/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-09 19:12:25
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-09 19:38:53
 */

import got from 'got';
import Web3 from 'web3';
import { SuggestedGasFees } from "../entity/suggestedGasFees";
import { Web3Helper } from './web3Helper';


export class Utils {
    /**
     * sleep ms
     * @param {number} time ms
     */
    static sleep(time = 0) {
        return new Promise((resolve, _) => {
            setTimeout(() => {
                resolve(true);
            }, time);
        })
    }



    /**
     * get suggested gas fees use codefi network api
     * @param chainid chain id
     * @returns SuggestedGasFees
     */
    private static async getSuggestedGasFees(chainid: number): Promise<SuggestedGasFees | null> {
        try {
            const json = await got.get(`https://gas-api.metaswap.codefi.network/networks/${chainid}/suggestedGasFees`).json() as SuggestedGasFees;
            if (json && json.high && json.medium) {
                return json;
            } else {
                return null;
            }
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    /**
     * get suggested gas fees from codefi network
     * @param chainid chain id
     * @param type gas level
     * @returns suggested gas fees
     */
    static async getGasPrice(chainid: number, type: 'low' | 'medium' | 'high' = 'high') {
        let suggestedGasFees = await Utils.getSuggestedGasFees(chainid);
        if (suggestedGasFees) {
            let f = suggestedGasFees[type];
            if (f && f.suggestedMaxPriorityFeePerGas && f.suggestedMaxFeePerGas && suggestedGasFees.estimatedBaseFee) {
                const MaxPriority = Math.ceil(parseFloat(f.suggestedMaxPriorityFeePerGas)).toString();
                const Max = Math.ceil(parseFloat(f.suggestedMaxFeePerGas)).toString();
                const Base = Math.ceil(parseFloat(suggestedGasFees.estimatedBaseFee)).toString();
                console.log(`Base:${Base} \t Max:${Max} \t MaxPriority:${MaxPriority}`);
                const web3 = Web3Helper.web3;
                return {
                    Base: web3.utils.toWei(Base, 'gwei'),
                    Max: web3.utils.toWei(Max, 'gwei'),
                    MaxPriority: web3.utils.toWei(MaxPriority, 'gwei')
                }
            }
        }
        throw new Error('get GasPrice error');

    }

    /**
     * sign transaction and send transaction
     * @param web3 web3 instance
     * @param privateKey private key of from account
     * @param to to address
     * @param value value
     * @param data data
     * @returns null or transaction hash
     */
    static async signAndSendTransaction(
        privateKey: string,
        to: string | undefined,
        value: string,
        data: string | undefined) {
        const web3 = Web3Helper.web3;
        const chainId = await web3.eth.net.getId();
        const gasPrice = await Utils.getGasPrice(chainId);
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        const rawTx = {
            from: account.address,
            to: to,
            value: value,
            data: data,
            gas: web3.utils.toWei('1', 'ether'),
            maxPriorityFeePerGas: gasPrice.MaxPriority,
            maxFeePerGas: gasPrice.Max
        };

        let gas = (await web3.eth.estimateGas(rawTx)) * 5;
        rawTx.gas = web3.utils.toHex(web3.utils.toBN(gas)); // gas limit
        let signedTransactionData = await account.signTransaction(rawTx);
        if (signedTransactionData.rawTransaction && signedTransactionData.transactionHash) {
            web3.eth.sendSignedTransaction(signedTransactionData.rawTransaction, (err: any, hash: string) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`tx:${hash} has been sent, please wait few secs to confirm`);
                }
            });
            return signedTransactionData.transactionHash;
        }
        return null;
    }

}