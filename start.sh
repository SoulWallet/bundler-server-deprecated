###
 # @Description: 
 # @Version: 1.0
 # @Autor: z.cejay@gmail.com
 # @Date: 2022-08-08 22:12:59
 # @LastEditors: cejay
 # @LastEditTime: 2022-08-08 22:14:20
### 

echo 'start script'
pm2 start /root/dist/app.js
pm2 logs