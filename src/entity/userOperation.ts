/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-07-25 10:53:52
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-09 15:38:37
 */

import { Web3Helper } from "../utils/web3Helper";

/**
 * @link https://github.com/eth-infinitism/account-abstraction/blob/develop/contracts/UserOperation.sol    
 */

class UserOperation {

    // the sender account of this request
    sender: string = '';

    // unique value the sender uses to verify it is not a replay.
    nonce: number = 0;

    // if set, the account contract will be created by this constructor
    initCode: string = '0x';

    // the method call to execute on this account.
    callData: string = '0x';

    // gas used for validateUserOp and validatePaymasterUserOp
    callGas: number = 0;

    // gas not calculated by the handleOps method, but added to the gas paid. Covers batch overhead.
    verificationGas: number = 0;

    // gas not calculated by the handleOps method, but added to the gas paid. Covers batch overhead.
    preVerificationGas: number = 21000;

    // same as EIP-1559 gas parameter
    maxFeePerGas: number = 0;

    // same as EIP-1559 gas parameter
    maxPriorityFeePerGas: number = 0;

    // if set, the paymaster will pay for the transaction instead of the sender
    paymaster: string = '0x';

    // extra data used by the paymaster for validation
    paymasterData: string = '0x';

    // sender-verified signature over the entire request, the EntryPoint address and the chain ID.
    signature: string = '0x';
}



export { UserOperation };