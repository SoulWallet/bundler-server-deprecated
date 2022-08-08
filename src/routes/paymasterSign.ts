/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 23:13:13
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 23:25:50
 */
/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:46:45
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 23:06:55
 */
import { ResponseToolkit } from "@hapi/hapi";
import { UserOperation } from '../entity/userOperation';

export class PaymasterSign {
    public static async handler(request: Request, h: ResponseToolkit, err?: Error | undefined) {
        // get post json content
        const op = await request.json() as UserOperation;
        if (!op) {
            return h.response('request json is empty').code(400);
        }
        // #TODO






    }
}