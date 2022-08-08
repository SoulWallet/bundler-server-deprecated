/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 21:53:06
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 23:26:40
 */

import { Server } from '@hapi/hapi';
import { httpServerPort } from './defines';
import { YamlConfig } from './utils/yamlConfig';
import { route } from './routes/route';

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

const yamlConfig: YamlConfig = YamlConfig.getInstance();

async function main() {
    const server = new Server({
        port: httpServerPort,
        host: yamlConfig.httpServer.host
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: route.index
    });

    server.route({
        method: 'POST',
        path: '/sign',
        handler: route.paymasterSign
    });


    await server.start();
    console.log('Server running on %s', server.info.uri);


}


main();
