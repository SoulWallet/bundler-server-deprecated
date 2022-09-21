# bundler-server 
a simple bundler server


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
    --name bundler-service \
    --env "VIRTUAL_HOST=bundler-poc.soulwallets.me" \
    --env "LETSENCRYPT_HOST=bundler-poc.soulwallets.me" \
    -v '/home/ubuntu/config.yaml':'/root/config.yaml' \
    cejay/bundlerserver:latest
```
