/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-15 21:37:16
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-15 22:03:45
 */
import { ResponseToolkit } from "@hapi/hapi";
import { HttpPOSTRequest, HttpPOSTResponse, HttpPOSTResponseCode } from "../entity/httpReqResp";
import { UserOperation } from '../entity/userOperation';
import { Bundler } from "../bundle";
import { Utils } from "../utils/utils";

export class BundlerRoute {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const resp = new HttpPOSTResponse(HttpPOSTResponseCode.success, '');
        let req: HttpPOSTRequest | undefined = undefined;
        try {
            req = await request.json() as HttpPOSTRequest;
            if (!req || !req.data) {
                resp.code = HttpPOSTResponseCode.unknownDataError;
            } else {
                const opArr = req.data as UserOperation[];
                if (!opArr) {
                    resp.code = HttpPOSTResponseCode.unknownDataError;
                } else if (!Array.isArray(opArr) || opArr.length === 0) {
                    resp.code = HttpPOSTResponseCode.unknownDataError;
                } else {
                    switch (req.method) {
                        case 'send':
                            for (const op of opArr) {
                                const verifyResult = await Utils.verifyUserOperation(op);
                                if (!verifyResult.valid) {
                                    resp.code = HttpPOSTResponseCode.dataCanNotVerifyError;
                                    resp.msg = verifyResult.error;
                                    return;
                                }
                            }
                            const sendRet = await BundlerRoute._send(req.data);
                            resp.data = sendRet;
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
        h.response(resp).code(200);
    }


    private static async _send(opArr: UserOperation[]): Promise<{
        succ: boolean,
        txHash: string,
        error: string
    }[]> {
        /*
            bundler will send every 5sec 
        */
        const ret = {
            succ: false,
            txHash: '',
            error: ''
        };
        const taskArr = [];
        for (const op of opArr) {
            taskArr.push(Bundler.getInstance().addTask(op));
        }
        const taskRet = await Promise.all(taskArr);
        const retArr = [];
        for (const task of taskRet) {
            retArr.push(Bundler.getInstance().fetchTaskState(task));
        }
        const retData = await Promise.all(retArr);
        return retData;
    }

}