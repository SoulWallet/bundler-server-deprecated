/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-10-06 16:11:57
 * @LastEditors: cejay
 * @LastEditTime: 2022-10-06 21:23:46
 */


import { Request, ResponseToolkit } from "@hapi/hapi";
import { Logger } from '../utils/logger';
const logger = Logger.Instance().logger;

export class IpLimit {
    private static instance: IpLimit;
    private constructor() {

    }

    public static Instance() {
        if (!IpLimit.instance) {
            IpLimit.instance = new IpLimit();
        }
        return IpLimit.instance;
    }

    limit_time = 10; // 10s
    limit_count = 20;// 20 times in 10s

    ipMap = new Map<string, TimeCount[]>();

    check(request: Request, h: ResponseToolkit) {
        let ip = request.headers['x-real-ip'] || '';
        const url = request.url.href;
        const payload = request.payload;
        logger.info(`${ip}\t${url}\t${JSON.stringify(payload)}`);
        if (!this.checkIP(ip)) {
            return h.response('ip limit:' + ip).code(503);
        }
        return null;
    }

    checkIP(ip: string) {
        const tsNow = Math.round(Date.now() / 1000);
        let ipTimeCount = this.ipMap.get(ip);
        if (!ipTimeCount) {
            this.ipMap.set(ip, [
                {
                    time: tsNow,
                    count: 1,
                }
            ]);
            logger.info(`ip:${ip} first time`);
            return true;
        } else {
            let last = ipTimeCount[ipTimeCount.length - 1];
            if (last.time != tsNow) {
                ipTimeCount.push({
                    time: tsNow,
                    count: 1,
                });
            } else {
                last.count++;
            }
            if (ipTimeCount.length > this.limit_time * 2) {
                ipTimeCount = ipTimeCount.slice(ipTimeCount.length - this.limit_time);
                this.ipMap.set(ip, ipTimeCount);
            }
            const ts_start = tsNow - this.limit_time;
            let count = 0;
            for (let index = ipTimeCount.length - 1; index >= 0; index--) {
                const element = ipTimeCount[index];
                if (element.time < ts_start) {
                    break;
                }
                count += element.count;
            }
            if (count > this.limit_count) { 
                logger.info(`ip:${ip} limit:${count}`);
                return false;
            } else {
                return true;
            }
        }


    }





}

interface TimeCount {
    time: number;
    count: number;
}