/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:57:17
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-15 22:05:01
 */
import { BundlerRoute } from './bundlerRoute';
import { Index } from './index';
import { PaymasterRoute } from './paymasterRoute';

const route = {
    index: Index.handler,
    paymasterRoute: PaymasterRoute.handler,
    bundlerRoute: BundlerRoute.handler
};

export { route };