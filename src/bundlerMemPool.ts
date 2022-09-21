/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-09-20 20:45:29
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-21 15:30:57
 */

import { UserOperation } from "./entity/userOperation";
import { YamlConfig } from "./utils/yamlConfig";
import { Web3Helper } from "./utils/web3Helper";
import fs from 'fs';
import path from 'path';
import { Utils } from "./utils/utils";
import { AddressZero } from "./defines";
import { getRequestId } from "./utils/userOp";

export class BundlerMemPool {

    public static code_succ: Code = {
        code: 0,
        msg: 'success'
    };
    public static code_fail: Code = {
        code: 1,
        msg: 'fail'
    };
    public static code_nonce_error: Code = {
        code: 2,
        msg: 'server error: nonce error'
    };
    public static code_nonce_too_low: Code = {
        code: 3,
        msg: 'nonce too low'
    };
    public static code_gas_error: Code = {
        code: 4,
        msg: 'current chain not support EIP1559'
    };
    public static code_gas_too_low: Code = {
        code: 5,
        msg: 'gas too low'
    };
    public static code_not_ready: Code = {
        code: 6,
        msg: 'bundler server not ready'
    };




    private static instance: BundlerMemPool;
    public static getInstance() {
        if (!BundlerMemPool.instance) {
            BundlerMemPool.instance = new BundlerMemPool();
        }
        return BundlerMemPool.instance;
    }

    private yamlConfig: YamlConfig = YamlConfig.getInstance();

    private entryPointContract;

    private chainId: number = 0;

    private memPool: Map<string,
        {
            nonce: number,
            data: {
                status: 'pending' | 'processing' | 'success' | 'fail',
                txHash: string,
                masGas: number,
                requestId: string,
                op: UserOperation
            }[]
        }
    > = new Map();
    private status2Code(status: 'pending' | 'processing' | 'success' | 'fail') {
        switch (status) {
            case 'pending':
                return 0;
            case 'processing':
                return 2;
            case 'success':
                return 3;
            case 'fail':
                return 4;
            default:
                return 5;
        }

    }

    private nonceCache: Map<string, {
        nonce: number,
        timestamp: number
    }> = new Map();

    private requestIdMap = new Map<string, {
        walletAddress: string,
        nonce: number
    }>();


    private constructor() {
        const _entrypointABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'ABI', 'EntryPoint.json'), 'utf8'));
        this.entryPointContract = new Web3Helper.web3.eth.Contract(_entrypointABI, this.yamlConfig.entryPoint.address);
        this.start();
    }

    // get gas now 
    maxFeePerGas: number = 0;
    maxPriorityFeePerGas: number = 0;

    private _bundlerIndex = 0;
    private async start() {
        console.log('bundler is running');

        this.chainId = await Web3Helper.web3.eth.getChainId();


        while (true) {
            await Utils.sleep(1000 * this.yamlConfig.bundler.interval);

            let currentGas = 0;

            const privateKey = this.yamlConfig.bundler.privateKeys[(this._bundlerIndex++) % this.yamlConfig.bundler.privateKeys.length];
            const address = Web3Helper.web3.eth.accounts.privateKeyToAccount(privateKey).address;
            const sendOp: UserOperation[] = [];
            const sendData = [];



            if (this.chainId === 10 || this.chainId === 420) {
                // not support EIP-1559 and  gas-api.metaswap.codefi.network not work
                try {
                    const gasNow = await Web3Helper.web3.eth.getGasPrice();
                    this.maxFeePerGas = parseInt(gasNow, 10);
                    this.maxPriorityFeePerGas = this.maxFeePerGas;
                }
                catch (error) {
                    console.log('get gas now error:', error);
                    continue;
                }
            } else {
                try {
                    const gasNow = await Utils.getGasPrice(this.chainId, 'medium');
                    this.maxFeePerGas = parseInt(gasNow.Max, 10);
                    this.maxPriorityFeePerGas = parseInt(gasNow.MaxPriority, 10);
                } catch (error) {
                    console.log('get gas now by codefi error:', error);
                }
            }

            for (let [sender, data] of this.memPool.entries()) {
                if (data.data.filter(op => op.status === 'pending').length === 0) {
                    continue;
                }

                try {
                    const nonce = await this.getNonce(sender);
                    data.nonce = nonce;
                } catch (error) {
                    console.error(error);
                    continue;
                }

                const ops = data.data.filter(op => op.op.nonce === data.nonce);
                if (ops.length === 0) {
                } else if (ops.length === 1) {
                    if (ops[0].status === 'pending') {

                        if (ops[0].op.maxFeePerGas < this.maxFeePerGas || ops[0].op.maxPriorityFeePerGas < this.maxPriorityFeePerGas) {
                            // gas price too low
                        } else {
                            ops[0].status = 'processing';
                            if (await this.simulateValidation(ops[0].op)) {
                                if (currentGas + ops[0].masGas <= this.yamlConfig.bundler.maxGas) {
                                    currentGas += ops[0].masGas;
                                    sendOp.push(ops[0].op);
                                    sendData.push(ops[0]);
                                }
                            } else {
                                ops[0].status = 'fail';
                            }
                        }
                    }
                } else {
                    console.error('nonce error =>' + sender + ' on nonce ' + data.nonce);
                }
            }
            if (sendOp.length > 0) {
                console.log(sendOp);

                const handleOpsCallData = this.entryPointContract.methods.handleOps(sendOp, this.yamlConfig.bundler.beneficiary).encodeABI();
                let tx = null;
                try {
                    //const newMaxFeePerGas = Web3Helper.web3.utils.toBN(this.maxFeePerGas).mul(Web3Helper.web3.utils.toBN(2)).toNumber();
                    tx = await Utils.signAndSendTransaction(
                        privateKey,
                        this.yamlConfig.entryPoint.address,
                        '0x00',
                        currentGas,
                        this.yamlConfig.web3.EIP1559 ? undefined : this.maxPriorityFeePerGas,
                        this.yamlConfig.web3.EIP1559 ? this.maxPriorityFeePerGas : undefined,
                        this.yamlConfig.web3.EIP1559 ? this.maxFeePerGas : undefined,
                        handleOpsCallData);

                } catch (error) {
                    console.error(error);
                }
                for (const data of sendData) {
                    if (tx) {
                        data.status = 'success';
                        data.txHash = tx;
                    } else {
                        data.status = 'fail';
                    }
                }
            }
        }
    }

    private async simulateValidation(op: UserOperation) {
        try {
            const result = await this.entryPointContract.methods.simulateValidation(op).call({
                from: AddressZero
            });
            if (result) {
                return true;
            }
        } catch (error) {
            console.log(`simulateValidation error:`, error);
        }
        return false;
    }

    /**
    * get nonce number from contract wallet
    * @param walletAddress the wallet address
    * @param web3 the web3 instance
    * @param defaultBlock "earliest", "latest" and "pending"
    * @returns the next nonce number
    */
    private async getNonce(walletAddress: string, defaultBlock = 'latest'): Promise<number> {
        const cache = this.nonceCache.get(walletAddress);
        if (cache && (cache.timestamp + 13) > Math.round(Date.now() / 1000)) {
            return cache.nonce;
        }
        try {
            const code = await Web3Helper.web3.eth.getCode(walletAddress, defaultBlock);
            // check contract is exist
            if (code === '0x') {
                this.nonceCache.set(walletAddress, {
                    nonce: 0,
                    timestamp: Math.round(Date.now() / 1000)
                });
                return 0;
            } else {
                const contract = new Web3Helper.web3.eth.Contract([{ "inputs": [], "name": "nonce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }], walletAddress);
                const nonce = await contract.methods.nonce().call();
                // try parse to number
                const nextNonce = parseInt(nonce, 10);
                if (isNaN(nextNonce)) {
                    throw new Error('nonce is not a number');
                }
                this.nonceCache.set(walletAddress, {
                    nonce: nextNonce,
                    timestamp: Math.round(Date.now() / 1000)
                });
                return nextNonce;
            }

        } catch (error) {
            throw error;
        }
    }

    public async add(op: UserOperation): Promise<Ret> {
        if (this.maxFeePerGas === 0 || this.maxPriorityFeePerGas === 0) {
            return new Ret(BundlerMemPool.code_not_ready, '');
        }

        if (!this.yamlConfig.web3.EIP1559) {
            if (op.maxFeePerGas != op.maxPriorityFeePerGas) {
                new Ret(BundlerMemPool.code_gas_error, '');
            }
        }

        if (op.maxFeePerGas < this.maxFeePerGas || op.maxPriorityFeePerGas < this.maxPriorityFeePerGas) {
            return new Ret(BundlerMemPool.code_gas_too_low, '');
        }

        const walletAddress = op.sender.toLowerCase();

        const nonce = op.nonce;

        let onlineNonce = 0;
        try {
            onlineNonce = await this.getNonce(walletAddress);
        } catch (error) {
            console.error(error);
            return new Ret(BundlerMemPool.code_nonce_error, '');
        }
        if (nonce < onlineNonce) {
            return new Ret(BundlerMemPool.code_nonce_too_low, '');
        } else if (nonce > onlineNonce + 10) {
            return new Ret(BundlerMemPool.code_nonce_error, '');
        }

        const requestId = getRequestId(op, this.yamlConfig.entryPoint.address, this.chainId);

        const poolData = this.memPool.get(walletAddress);
        if (!poolData || poolData.data.length === 0) {
            this.memPool.set(walletAddress, {
                nonce: onlineNonce,
                data: [{
                    status: 'pending',
                    requestId: requestId,
                    txHash: '',
                    masGas: op.callGas + op.verificationGas + op.preVerificationGas,
                    op: op,
                }]
            });
        } else {
            poolData.nonce = onlineNonce;
            if (nonce < poolData.data[0].op.nonce) {
                // insert to head

                poolData.data.unshift({
                    status: 'pending',
                    requestId: requestId,
                    txHash: '',
                    masGas: op.callGas + op.verificationGas + op.preVerificationGas,
                    op: op,
                });
            } else {
                for (let i = poolData.data.length - 1; i >= 0; i--) {
                    if (poolData.data[i].op.nonce === nonce) {
                        // replace
                        if (poolData.data[i].status !== 'processing') {
                            poolData.data[i].op = op;
                            poolData.data[i].status = 'pending';
                            break;
                        } else {
                            return new Ret(BundlerMemPool.code_nonce_too_low, '');
                        }
                    } else if (poolData.data[i].op.nonce < nonce) {
                        // insert
                        poolData.data.splice(i + 1, 0, {
                            status: 'pending',
                            requestId: requestId,
                            txHash: '',
                            masGas: op.callGas + op.verificationGas + op.preVerificationGas,
                            op: op,
                        });
                        break;
                    }
                }
            }

        }
        this.requestIdMap.set(requestId, {
            walletAddress: walletAddress,
            nonce: nonce
        });
        console.log(`add op to mempool: ${requestId}`);
        return new Ret(BundlerMemPool.code_succ, requestId);
    }

    public get(requestId: string) {
        /**
     * 0:pending
     * 1:replaced
     * 2:processing
     * 3:success
     * 4:fail
     * 5:notfound
     */
        const addressNonceUnion = this.requestIdMap.get(requestId);
        if (addressNonceUnion) {
            const poolData = this.memPool.get(addressNonceUnion.walletAddress);
            if (poolData) {
                // find nonce in poolData.data
                for (let i = poolData.data.length - 1; i >= 0; i--) {
                    if (poolData.data[i].op.nonce === addressNonceUnion.nonce) {
                        if (poolData.data[i].requestId === requestId) {
                            return {
                                code: this.status2Code(poolData.data[i].status),
                                msg: poolData.data[i].status,
                                requestId: poolData.data[i].requestId,
                                txHash: poolData.data[i].txHash
                            };
                        } else {
                            return {
                                code: 1,
                                msg: 'replaced',
                                requestId: requestId,
                                txHash: ''
                            };
                        }
                    }
                }
            }
        }

        return {
            code: 5,
            msg: 'notfound',
            requestId: requestId,
            txHash: ''
        };

    }

}

export interface Code {
    code: number;
    msg: string;
}

export class Ret implements Code {
    constructor(code: Code, requestiD: string) {
        this.code = code.code;
        this.msg = code.msg;
        this.requestId = requestiD;
    }
    code: number;
    msg: string;
    requestId: string;
}

