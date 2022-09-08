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
sudo docker pull cejay/paymasterserver:latest
sudo docker run -d -p 80:80 -v 'xxx/config.yaml':'/root/config.yaml' cejay/paymasterserver:latest
```
