/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-09-20 23:21:56
 * @LastEditors: cejay
 * @LastEditTime: 2022-10-06 21:17:21
 */

import { ResponseToolkit, Request } from "@hapi/hapi";
import { UserOperation } from '../entity/userOperation';
import { BundlerMemPool } from "../bundlerMemPool";
import { Utils } from "../utils/utils";
import { IpLimit } from "../utils/ipLimit";

export class bundlerRouteGet {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const limit = IpLimit.Instance().check(request, h);
        if (limit) {
            return limit;
        }
        const requestID = request.params.requestId as string || '';
        const ret = await BundlerMemPool.getInstance().get(requestID);
        return h.response(ret).code(200);
    }

}