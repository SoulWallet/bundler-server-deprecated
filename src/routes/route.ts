/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 22:57:17
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 23:13:54
 */
import { Index } from './index';
import { PaymasterSign } from './paymasterSign';

const route = {
    index: Index.handler,
    paymasterSign: PaymasterSign.handler
};

export { route };