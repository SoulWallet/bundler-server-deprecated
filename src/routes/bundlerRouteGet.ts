/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-09-20 23:21:56
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-21 09:29:55
 */

import { ResponseToolkit, Request } from "@hapi/hapi";
import { UserOperation } from '../entity/userOperation';
import { BundlerMemPool } from "../bundlerMemPool";
import { Utils } from "../utils/utils";

export class bundlerRouteGet {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const requestID = request.params.requestId as string || '';
        const ret = await BundlerMemPool.getInstance().get(requestID);
        return h.response(ret).code(200);
    }

}