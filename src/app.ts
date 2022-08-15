/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 21:53:06
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-15 22:05:18
 */

import { Server } from '@hapi/hapi';
import { httpServerPort } from './defines';
import { YamlConfig } from './utils/yamlConfig';
import { route } from './routes/route';
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
        method: 'POST',
        path: '/sign',
        handler: route.paymasterRoute
    });
    server.route({
        method: 'POST',
        path: '/send',
        handler: route.bundlerRoute
    });

    // handler all other requests
    server.route({
        method: '*',
        path: '/{p*}',
        handler: route.index
    });


    await server.start();
    console.log('Server running on %s', server.info.uri);


}

main();
