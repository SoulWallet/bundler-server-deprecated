/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 21:53:06
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-07 19:38:11
 */

import { Server } from '@hapi/hapi';
import { httpServerPort } from './defines';
import { YamlConfig } from './utils/yamlConfig';
import { routeHub } from './routes/routeHub';
import { Web3Helper } from './utils/web3Helper';
import { Bundler } from './bundle';
import { UserOperation } from './entity/userOperation';

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

const yamlConfig: YamlConfig = YamlConfig.getInstance();

function init() {
    Web3Helper.init(yamlConfig.web3.provider);
}

async function main() {
    init();

    const server = new Server({
        port: httpServerPort,
        host: yamlConfig.httpServer.host
    });

    server.route({
        method: ['PUT', 'POST'],
        path: '/sign',
        handler: routeHub.paymasterRoute
    });
    server.route({
        method: ['PUT', 'POST'],
        path: '/send',
        handler: routeHub.bundlerRoute
    });

    // handler all other requests
    server.route({
        method: '*',
        path: '/{p*}',
        handler: routeHub.index
    });


    await server.start();
    console.log('Server running on %s', server.info.uri);


}

main();
