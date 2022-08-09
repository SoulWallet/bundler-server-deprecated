/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 23:13:13
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-09 19:23:24
 */
/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:46:45
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 23:06:55
 */
import { ResponseToolkit } from "@hapi/hapi";
import { HttpPOSTRequest, HttpPOSTResponse, HttpPOSTResponseCode } from "../entity/httpReqResp";
import { UserOperation } from '../entity/userOperation';
import { getPayMasterSignHash, signPayMasterHash } from "../utils/userOp";
import { Web3Helper } from "../utils/web3Helper";
import { YamlConfig } from "../utils/yamlConfig";
import { Bundler } from "../bundle";

export class PaymasterRoute {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const resp = new HttpPOSTResponse(HttpPOSTResponseCode.success, '');
        let req: HttpPOSTRequest | undefined = undefined;
        try {
            req = await request.json() as HttpPOSTRequest;
            if (!req || !req.data) {
                resp.code = HttpPOSTResponseCode.unknownDataError;
            } else {
                const op = req.data as UserOperation;
                if (!op) {
                    resp.code = HttpPOSTResponseCode.unknownDataError;
                } else {
                    const verifyResult = await PaymasterRoute._VerifyUserOperation(op);
                    if (!verifyResult.valid) {
                        resp.code = HttpPOSTResponseCode.dataCanNotVerifyError;
                        resp.msg = verifyResult.error;
                    } else {
                        switch (req.method) {
                            case 'sign':
                                if (op.paymaster.toLocaleLowerCase() != YamlConfig.getInstance().paymaster.paymasterAddress) {
                                    resp.code = HttpPOSTResponseCode.unknownPayMaster;
                                } else {
                                    const signRet = await PaymasterRoute._sign(req.data);
                                    if (signRet.succ) {
                                        resp.data = signRet.paymasterData;
                                    } else {
                                        resp.code = HttpPOSTResponseCode.payMasterSignError;
                                        resp.msg = signRet.error;
                                    }
                                }
                                break;
                            case 'send':
                                const sendRet = await PaymasterRoute._send(req.data);
                                if (sendRet.succ) {
                                    resp.data = sendRet.txHash;
                                } else {
                                    resp.code = HttpPOSTResponseCode.bundlerError;
                                    resp.msg = sendRet.error;
                                }
                                break;
                            default:
                                resp.code = HttpPOSTResponseCode.unknownMethodError;
                                break;
                        }
                    }

                }

            }
        } catch (error) {
            console.log(error);
            resp.code = HttpPOSTResponseCode.unknownError;
        }


        h.response(resp).code(200);
    }

    private static async _VerifyUserOperation(op: UserOperation): Promise<{
        valid: boolean,
        error: string
    }> {
        const web3 = Web3Helper.web3;
        if (!web3.utils.isAddress(op.sender) ||
            !web3.utils.isAddress(op.paymaster)) {
            return {
                valid: false,
                error: 'valid sender or paymaster'
            };
        }
        if (!PaymasterRoute._checkUint(op.nonce) ||
            !PaymasterRoute._checkUint(op.callGas) ||
            !PaymasterRoute._checkUint(op.verificationGas) ||
            !PaymasterRoute._checkUint(op.preVerificationGas) ||
            !PaymasterRoute._checkUint(op.maxFeePerGas) ||
            !PaymasterRoute._checkUint(op.maxPriorityFeePerGas)
        ) {
            return {
                valid: false,
                error: 'valid nonce, callGas, verificationGas, preVerificationGas, maxFeePerGas or maxPriorityFeePerGas'
            };
        }
        if (!PaymasterRoute._checkHex(op.initCode) ||
            !PaymasterRoute._checkHex(op.callData) ||
            !PaymasterRoute._checkHex(op.paymasterData) ||
            !PaymasterRoute._checkHex(op.signature)
        ) {
            return {
                valid: false,
                error: 'invalid initCode, initData,paymasterData or signature'
            };
        }


        return {
            valid: true,
            error: ''
        };
    }

    private static _sign(op: UserOperation): {
        succ: boolean,
        paymasterData: string,
        error: string
    } {
        try {
            const paymasterSignHash = getPayMasterSignHash(op);
            const paymasterData = signPayMasterHash(paymasterSignHash, YamlConfig.getInstance().paymaster.signatureKey);
            return {
                succ: true,
                paymasterData: paymasterData,
                error: ''
            };
        } catch (error) {
            return {
                succ: false,
                paymasterData: '0x',
                error: 'sign error'
            };
        }
    }

    private static async _send(op: UserOperation): Promise<{
        succ: boolean,
        txHash: string,
        error: string
    }> {
        /*
            bundler will send every 5sec 
        */
        const ret = {
            succ: false,
            txHash: '',
            error: ''
        };
        const addTaskRet = await Bundler.getInstance().addTask(op);
        if (typeof (addTaskRet) === 'string') {
            try {
                const tx = await Bundler.getInstance().fetchTaskState(addTaskRet);
                ret.succ = true;
                ret.txHash = tx;
            } catch (error) {
                console.log(error);
            }
        }
        return ret;
    }

    private static _checkUint(value: number): boolean {
        if (value % 1 === 0 && value >= 0) {
            return true;
        }
        return false;
    }
    private static _checkHex(value: string): boolean {
        if (value.startsWith('0x')) {
            return true;
        }
        return false;
    }
}