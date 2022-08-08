/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:46:45
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 23:06:55
 */
import { ResponseToolkit } from "@hapi/hapi";
export class Index {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        return h.response('server is running');
    }
}