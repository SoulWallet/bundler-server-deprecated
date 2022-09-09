import { ResponseToolkit, Request } from "@hapi/hapi";
import { HttpPOSTRequest, HttpPOSTResponse, HttpPOSTResponseCode } from "../entity/httpReqResp";
import { UserOperation } from '../entity/userOperation';
import { getPayMasterSignHash, signPayMasterHash } from "../utils/userOp";
import { YamlConfig } from "../utils/yamlConfig";
import { Utils } from "../utils/utils";

export class PaymasterRoute {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const resp = new HttpPOSTResponse(HttpPOSTResponseCode.success, '');
        let req: HttpPOSTRequest | undefined = undefined;
        try {
            if (typeof (request.payload) === 'object') {
                req = request.payload as HttpPOSTRequest;
            }
            if (!req || !req.data) {
                resp.code = HttpPOSTResponseCode.unknownDataError;
            } else {
                const op = req.data as UserOperation;
                if (!op) {
                    resp.code = HttpPOSTResponseCode.unknownDataError;
                } else {
                    switch (req.method) {
                        case 'sign':

                            const verifyResult = await Utils.verifyUserOperation(op);
                            if (!verifyResult.valid) {
                                resp.code = HttpPOSTResponseCode.dataCanNotVerifyError;
                                resp.msg = verifyResult.error;
                                break;
                            }
                            // else if (op.paymaster.toLocaleLowerCase() != YamlConfig.getInstance().paymaster.stakePaymasterAddress &&
                            //     op.paymaster.toLocaleLowerCase() != YamlConfig.getInstance().paymaster.freePaymasterAddress) {
                            //     resp.code = HttpPOSTResponseCode.unknownPayMaster;
                            //     return;
                            // }
                            // else if (op.paymaster) {
                            //     resp.code = HttpPOSTResponseCode.specifyPayMaster;
                            //     return;
                            // }

                            resp.data = PaymasterRoute._sign(op);

                            break;
                        default:
                            resp.code = HttpPOSTResponseCode.unknownMethodError;
                            break;
                    }
                }

            }


        } catch (error) {
            console.log(error);
            resp.code = HttpPOSTResponseCode.unknownError;
        }


        return h.response(resp).code(200);
    }

    private static _sign(op: UserOperation): {
        succ: boolean,
        paymaster: string,
        paymasterData: string,
        error: string
    } {
        try {
            // check if use free paymaster
            /*
            transferOwner(address account = '0xeC9a6761a181C942906919Cc73C38de96C6FdFBD')
            0x4fb2e45d000000000000000000000000ec9a6761a181c942906919cc73c38de96c6fdfbd
            */
            let useFreePayMaster = false;
            // if (op.callData.startsWith('0x4fb2e45d') && op.callData.length === 10 + 64) {
            //     useFreePayMaster = true;
            // }
            useFreePayMaster = true;
            if (useFreePayMaster) {
                op.paymaster = YamlConfig.getInstance().paymaster.freePaymasterAddress;
            } else {
                op.paymaster = YamlConfig.getInstance().paymaster.stakePaymasterAddress;
            }
            const paymasterSignHash = getPayMasterSignHash(op);
            const paymasterData = signPayMasterHash(
                paymasterSignHash,
                (useFreePayMaster ? YamlConfig.getInstance().paymaster.freeSignatureKey : YamlConfig.getInstance().paymaster.stakeSignatureKey)
            );

            return {
                succ: true,
                paymaster: op.paymaster,
                paymasterData: paymasterData,
                error: ''
            };
        } catch (error) {
            return {
                succ: false,
                paymaster: '',
                paymasterData: '0x',
                error: 'sign error'
            };
        }
    }



}