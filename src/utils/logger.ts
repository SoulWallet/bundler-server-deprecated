/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-10-06 20:50:21
 * @LastEditors: cejay
 * @LastEditTime: 2022-10-06 21:03:06
 */


import log4js from 'log4js';
import fs from 'fs';



export class Logger {
    private static instance: Logger;
    private _logger: log4js.Logger;
    private constructor() {
        let logDir = '/root/applog/';
        if (!fs.existsSync(logDir)) {
            console.log('log dir:' + logDir + ' not exists, use default dir ./applog');
            try {
                fs.mkdirSync('./applog');
            } catch (error) {

            }
            logDir = './applog/';
        }

        log4js.configure({
            appenders: {
                everything: { type: 'file', filename: logDir + 'bundler.log' },
            },
            categories: {
                default: { appenders: ['everything'], level: 'debug' }
            }
        });

        this._logger = log4js.getLogger();

    }

    public static Instance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public get logger() {
        return this._logger;
    }





}