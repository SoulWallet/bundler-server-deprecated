/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-09 16:34:47
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-09 19:51:11
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
        const delEntry: string[] = [];
        while (true) {
            await Utils.sleep(1000 * this.yamlConfig.bundler.interval);

            // delEntry
            for (const entry of delEntry) {
                this.opMap.delete(entry);
            }

            const privateKey = this.yamlConfig.bundler.privateKeys[(this._bundlerIndex++) % this.yamlConfig.bundler.privateKeys.length];
            const address = Web3Helper.web3.eth.accounts.privateKeyToAccount(privateKey);
            const sendHash: string[] = [];
            const sendOp: UserOperation[] = [];
            for (let [hash, opState] of this.opMap.entries()) {
                if (opState.state === 0) {
                    const op = opState.op;
                    if (op) {
                        sendOp.push(op);
                        sendHash.push(hash);
                    } else {
                        delEntry.push(hash);
                    }
                } else {
                    // delete entry
                    delEntry.push(hash);
                }
            }
            if (sendOp.length > 0) {
                try {
                    const handleOpsCallData = this.entryPointContract.methods.handleOps(sendOp, address).encodeABI();
                    const AASendTx = await Utils.signAndSendTransaction(
                        privateKey,
                        this.yamlConfig.entryPoint.address,
                        '0x00',
                        handleOpsCallData);
                    console.log(`AASendTx:`, AASendTx);
                    if (AASendTx) {
                        for (const hash of sendHash) {
                            const k = this.opMap.get(hash);
                            if (k) {
                                k.state = 1;
                                k.txHash = AASendTx;
                            }
                        }
                    } else {
                        for (const hash of sendHash) {
                            delEntry.push(hash);
                        }
                    }
                } catch (error) {
                    console.log(`AASendTx error:`, error);
                    for (const hash of sendHash) {
                        delEntry.push(hash);
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

    private opMap = new Map<string, UserOperationState>();


    public async addTask(op: UserOperation): Promise<string | AddTaskResult> {
        const hash = this._userOperationHash(op);
        if (this.opMap.has(hash)) {
            return AddTaskResult.duplicate;
        }
        // simulateValidation  
        try {
            const result = await this.entryPointContract.methods.simulateValidation(op).call({
                from: AddressZero
            });
            console.log(`simulateValidation result:`, result);
        } catch (error) {
            console.log(`simulateValidation error:`, error);
            return AddTaskResult.simulateError;
        }
        this.opMap.set(hash, {
            op: op,
            state: 0,
            txHash: ''
        });
        return hash;
    }

    public async fetchTaskState(opHash: string): Promise<string> {
        for (let index = 0; index < this.yamlConfig.bundler.interval + 5; index++) {
            const op = this.opMap.get(opHash);
            if (!op) {
                throw new Error(`opHash ${opHash} not found`);
            }
            if (op.state === 1) {
                if (op.txHash) {
                    return op.txHash;
                } else {
                    throw new Error(`opHash ${opHash} not found`);
                }
            } else if (op.state === 2) {
                throw new Error(`opHash ${opHash} failed`);
            } else if (op.state === 0) {
                await Utils.sleep(1000);
            }
        }
        throw new Error(`opHash ${opHash} timeout`);
    }




}

class UserOperationState {
    op?: UserOperation;
    /**
     * 0:pending, 1:success, 2:fail
     */
    state?: number;
    txHash?: string;
    updateTime?: number;
}


export enum AddTaskResult {
    duplicate = 1,
    simulateError = 2
}