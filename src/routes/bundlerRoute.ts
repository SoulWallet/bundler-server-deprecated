/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-15 21:37:16
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-09 20:17:51
 */
import { ResponseToolkit, Request } from "@hapi/hapi";
import { HttpPOSTRequest, HttpPOSTResponse, HttpPOSTResponseCode } from "../entity/httpReqResp";
import { UserOperation } from '../entity/userOperation';
import { AddTaskResult, Bundler } from "../bundle";
import { Utils } from "../utils/utils";

export class BundlerRoute {
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
                        case 'send':

                            const verifyResult = await Utils.verifyUserOperation(op);
                            if (!verifyResult.valid) {
                                resp.code = HttpPOSTResponseCode.dataCanNotVerifyError;
                                resp.msg = verifyResult.error;
                                return;
                            }

                            const sendRet = await Bundler.getInstance().addTask(req.data);
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
        return h.response(resp).code(200);
    }

}