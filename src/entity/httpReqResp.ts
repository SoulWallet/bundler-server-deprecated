/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-09 11:42:47
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-15 21:44:48
 */

import { UserOperation } from "./userOperation";

export class HttpPOSTRequest {
    method: 'sign' | 'send' | undefined;
    data?: UserOperation[];
    extra?: any = {};
}

export enum HttpPOSTResponseCode {
    success = 0,

    unknownError = 100,
    unknownMethodError = 101,
    unknownDataError = 102,

    dataCanNotVerifyError = 300,

    unknownPayMaster = 400,
    payMasterSignError = 401,

    bundlerError = 500,
}

export class HttpPOSTResponse {
    constructor(public _code: HttpPOSTResponseCode, public _msg: string) {
        this.code = _code;
        this.msg = _msg;
    }


    /**
     * 0: success, > 0: fail
     * 100:unknown error 
     * 101: unknown method
     * 102: data is empty
     * 200: data can not verify
     */
    code: HttpPOSTResponseCode = 0;
    /**
     * error message
     */
    msg: string = '';
    /**
     * any data
     */
    data: any = {};
}