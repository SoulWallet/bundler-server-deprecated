/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:57:17
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-09 11:56:14
 */
import { Index } from './index';
import { PaymasterRoute } from './paymasterRoute';

const route = {
    index: Index.handler,
    paymasterRoute: PaymasterRoute.handler
};

export { route };