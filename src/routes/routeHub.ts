/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:57:17
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-21 09:10:41
 */
import { BundlerRouteAdd } from './bundlerRouteAdd';
import { bundlerRouteGet } from './bundlerRouteGet';
import { Index } from './index';

const routeHub = {
    index: Index.handler,
    bundlerRouteAdd: BundlerRouteAdd.handler,
    bundlerRouteGet: bundlerRouteGet.handler,
};

export { routeHub };