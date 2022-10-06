/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:46:45
 * @LastEditors: cejay
 * @LastEditTime: 2022-10-06 21:16:19
 */
import { ResponseToolkit, Request } from "@hapi/hapi";
import { IpLimit } from "../utils/ipLimit";

export class Index {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        const limit = IpLimit.Instance().check(request, h);
        if (limit) {
            return limit;
        }
        
        return h.response('<html><body><h1>service is running</h1></body></html>').code(200);
    }
}