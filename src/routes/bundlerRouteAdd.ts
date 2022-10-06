/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-15 21:37:16
 * @LastEditors: cejay
 * @LastEditTime: 2022-10-06 21:23:20
 */
import { ResponseToolkit, Request } from "@hapi/hapi";
import { UserOperation } from '../entity/userOperation';
import { BundlerMemPool } from "../bundlerMemPool";
import { Utils } from "../utils/utils";
import { IpLimit } from "../utils/ipLimit";

import { Logger } from '../utils/logger';
const logger = Logger.Instance().logger;

export class BundlerRouteAdd {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const limit = IpLimit.Instance().check(request, h);
        if (limit) {
            return limit;
        }


        let req: UserOperation | undefined = undefined;
        try {
            if (typeof (request.payload) === 'object') {
                req = request.payload as UserOperation;
            }
            if (!req) {
                //400	Bad Request
                return h.response('unknownDataError').code(400);
            } else {

                const verifyResult = Utils.verifyUserOperation(req);
                if (!verifyResult.valid) {
                    //403	Forbidden 
                    return h.response('dataCanNotVerifyError:' + verifyResult.error).code(403);
                } else {
                    const ret = await BundlerMemPool.getInstance().add(req);
                    logger.info('add request:' + JSON.stringify(req));
                    return h.response(ret).code(200);
                }
            }
        } catch (error) {
            logger.error('add request error:' + JSON.stringify(req));
            //500	Internal Server Error 
            return h.response("error").code(500);
        }

    }

}