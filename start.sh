#!/bin/bash
echo 'start script'
pm2 start /root/dist/app.js
pm2 logs