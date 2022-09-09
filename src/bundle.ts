/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-09 16:34:47
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-09 20:16:51
 */

import { UserOperation } from "./entity/userOperation";
import { SHA256 } from "crypto-js";
import Web3 from "web3";
import { Web3Helper } from "./utils/web3Helper";
import { YamlConfig } from './utils/yamlConfig';
import fs from 'fs';
import path from 'path';
import { AddressZero } from "./defines";
import { Utils } from "./utils/utils";

export class Bundler {

    private static instance: Bundler;

    private yamlConfig: YamlConfig = YamlConfig.getInstance();

    private entryPointContract;

    private constructor() {
        const _entrypointABI = JSON.parse(fs.readFileSync(path.join(__dirname, 'ABI', 'EntryPoint.json'), 'utf8'));
        this.entryPointContract = new Web3Helper.web3.eth.Contract(_entrypointABI, this.yamlConfig.entryPoint.address);
    }

    public static getInstance() {
        if (!Bundler.instance) {
            Bundler.instance = new Bundler();
            Bundler.instance.start();
        }
        return Bundler.instance;
    }

    private _bundlerIndex = 0;
    private async start() {
        console.log('bundler is running');
        //const delEntry: string[] = [];
        while (true) {
            await Utils.sleep(1000 * this.yamlConfig.bundler.interval);

            // delEntry
            // for (const entry of delEntry) {
            //     this.opMap.delete(entry);
            // }

            const privateKey = this.yamlConfig.bundler.privateKeys[(this._bundlerIndex++) % this.yamlConfig.bundler.privateKeys.length];
            const address = Web3Helper.web3.eth.accounts.privateKeyToAccount(privateKey).address;
            //const sendHash: string[] = [];
            const sendOp: UserOperation[] = [];
            const senders: string[] = [];
            for (let [sender, opState] of this.opMap.entries()) {
                if (opState.state === 0) {
                    const op = opState.op;
                    if (op) {
                        sendOp.push(op);
                        
                        senders.push(sender);
                    }
                    //  else {
                    //     delEntry.push(hash);
                    // }
                }
                //  else {
                //     // delete entry
                //     delEntry.push(hash);
                // }
            }
            if (sendOp.length > 0) {
                for (let index = 0; index < senders.length; index++) {
                    const sender = senders[index];
                    const ops = this.opMap.get(sender);
                    if (ops) {
                        ops.state = 1;
                    }
                }
                let txHash = '';
                try {
                    const handleOpsCallData = this.entryPointContract.methods.handleOps(sendOp, address).encodeABI();
                    const AASendTx = await Utils.signAndSendTransaction(
                        privateKey,
                        this.yamlConfig.entryPoint.address,
                        '0x00',
                        handleOpsCallData);
                    console.log(`AASendTx:`, AASendTx);
                    if (AASendTx) {
                        txHash = AASendTx;;
                    }
                } catch (error) {
                    console.log(`AASendTx error:`, error);
                }
                for (let index = 0; index < senders.length; index++) {
                    const sender = senders[index];
                    const ops = this.opMap.get(sender);
                    if (ops) {
                        if (txHash) {
                            ops.state = 2;
                            ops.txHash = txHash;
                        } else {
                            ops.state = 3;
                        }
                    }
                }
            }
        }
    }

    private _userOperationHash(op: UserOperation) {
        let opStr = `${op.sender}|${op.nonce}|${op.initCode}|${op.callGas}|${op.verificationGas}|${op.preVerificationGas}|${op.maxFeePerGas}|${op.maxPriorityFeePerGas}|${op.paymaster}|${op.paymasterData}|${op.signature}`;
        const hash = SHA256(opStr).toString();
        return hash;
    }
    private _userOperationsHash(ops: UserOperation[]) {
        let opStr = '';
        for (let index = 0; index < ops.length; index++) {
            const op = ops[index];
            const hash = this._userOperationHash(op);
            opStr += hash;
        }
        const hash = SHA256(opStr).toString();
        return hash;
    }

    /**
    * get nonce number from contract wallet
    * @param walletAddress the wallet address
    * @param web3 the web3 instance
    * @param defaultBlock "earliest", "latest" and "pending"
    * @returns the next nonce number
    */
    private async getNonce(walletAddress: string, defaultBlock = 'latest'): Promise<number> {
        try {
            const code = await Web3Helper.web3.eth.getCode(walletAddress, defaultBlock);
            // check contract is exist
            if (code === '0x') {
                return 0;
            } else {
                const contract = new Web3Helper.web3.eth.Contract([{ "inputs": [], "name": "nonce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }], walletAddress);
                const nonce = await contract.methods.nonce().call();
                // try parse to number
                const nextNonce = parseInt(nonce, 10);
                if (isNaN(nextNonce)) {
                    throw new Error('nonce is not a number');
                }
                return nextNonce;
            }

        } catch (error) {
            throw error;
        }
    }
    /**
     * key: hash of UserOperationState::op
     */
    private opMap = new Map<string, UserOperationState>();


    public async addTask(op: UserOperation): Promise<{
        txHash: string,
        code: AddTaskResult,
        error: string
    }> {

        // check nonce
        let nonce = 0;
        try {
            nonce = await this.getNonce(op.sender);
        } catch (error) {
            return {
                txHash: '',
                code: AddTaskResult.serverError,
                error: 'get nonce error'
            };
        }
        if (nonce !== op.nonce) {
            return {
                txHash: '',
                code: AddTaskResult.nonceError,
                error: 'nonce error'
            };
        }

        try {
            const result = await this.entryPointContract.methods.simulateValidation(op).call({
                from: AddressZero
            });
            console.log(`simulateValidation result:`, result);
        } catch (error) {
            console.log(`simulateValidation error:`, error);
            return {
                txHash: '',
                code: AddTaskResult.simulateError,
                error: 'simulateValidation error'
            };

        }


        let userOperationState = this.opMap.get(op.sender);
        if (userOperationState) {
            if (userOperationState.state !== 2 && userOperationState.state !== 3) {
                return {
                    txHash: '',
                    code: AddTaskResult.pendingError,
                    error: 'pending'
                };

            }
        }

        this.opMap.set(op.sender, {
            state: 0,
            op,
            txHash: ''
        });

        return await this.fetchTaskState(op.sender);
    }

    private async fetchTaskState(sender: string): Promise<{
        txHash: string,
        code: AddTaskResult,
        error: string
    }> {
        for (let index = 0; index < this.yamlConfig.bundler.interval + 5; index++) {
            const op = this.opMap.get(sender);
            if (!op) {
                throw new Error(`op from sender:${sender} not found`);
            }
            if (op.state === 2) {
                if (op.txHash) {
                    return {
                        txHash: op.txHash,
                        code: AddTaskResult.success,
                        error: ''
                    };
                } else {
                    return {
                        txHash: '',
                        code: AddTaskResult.serverError,
                        error: `op from sender:${sender} not found`
                    };
                }
            } else if (op.state === 3) {
                return {
                    txHash: '',
                    code: AddTaskResult.serverError,
                    error: `op from sender:${sender} failed`
                };
            }
            await Utils.sleep(1000);

        }
        const op = this.opMap.get(sender);
        if (op) {
            op.state = 3;
        }
        return {
            txHash: '',
            code: AddTaskResult.serverError,
            error: `op from sender:${sender} timeout`
        };
    }

}

class UserOperationState {
    op?: UserOperation;
    /**
     * 0:idle 1:pending, 2:success, 3:fail
     */
    state?: number;
    txHash?: string;
    updateTime?: number;
}


export enum AddTaskResult {
    success = 0,
    duplicate = 1,
    simulateError = 2,
    multipleSender = 3,
    serverError = 4,
    nonceError = 5,
    pendingError = 6,
    EmptyOps = 7,
}