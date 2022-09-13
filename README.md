# paymaster-server
a simple paymaster and bundler server


### **Init**
```bash
npm install
```

### **Build**
```bash
make publish
```

### **Run**
```bash
sudo curl -fsSL https://get.docker.com | sh

sudo docker-compose -f docker-compose-nginx-ssl.yml up  -d

sudo docker run -d \
    --name paymaster-bundler-service \
    --env "VIRTUAL_HOST=paymasterapi-poc.soulwallets.me" \
    --env "LETSENCRYPT_HOST=paymasterapi-poc.soulwallets.me" \
    -v '/home/ubuntu/config.yaml':'/root/config.yaml' \
    cejay/paymasterserver:latest
```
