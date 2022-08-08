/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 21:58:13
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-08 22:44:47
 */
import YAML from 'yaml'
import fs from 'fs';

export class YamlConfig {

    private static instance: YamlConfig;

    public httpServer = {
        host: 'localhost'
    };
    public web3 = {
        provider: 'https://'
    };
    public paymaster = {
        paymasterAddress: '0x<contract address>',
        signatureKey: '0x<signature key>'
    };
    public bundler: { privateKeys: string[] } = {
        privateKeys: [
            "0x<private key 1>",
            "0x<private key 2>",
        ]
    };
    private constructor() {
        let yamlPath = '';
        if (fs.existsSync('/root/config.yaml')) {
            yamlPath = '/root/config.yaml'
        } else {
            console.log('no config file specified, use default config file: ../config.yaml');
            yamlPath = 'config.yaml';//console.log('current path: ' + process.cwd());
        }
        const yamlContent = fs.readFileSync(yamlPath, 'utf8');
        const yamlObj = YAML.parse(yamlContent);

        
        // check config

        if (!yamlObj.httpServer) throw new Error('httpServer config not found');
        if (!yamlObj.httpServer.host) throw new Error('httpServer::host not found');
        if (typeof (yamlObj.httpServer.host) !== 'string') throw new Error('httpServer::host not string');

        if (!yamlObj.web3) throw new Error('web3 config not found');
        if (!yamlObj.web3.provider) throw new Error('web3::provider not found');
        if (typeof (yamlObj.web3.provider) !== 'string') throw new Error('web3::provider not string');

        if (!yamlObj.paymaster) throw new Error('paymaster config not found');
        if (!yamlObj.paymaster.paymasterAddress) throw new Error('paymaster::paymasterAddress not found');
        if (typeof (yamlObj.paymaster.paymasterAddress) !== 'string') throw new Error('paymaster::paymasterAddress not string');
        if (!yamlObj.paymaster.signatureKey) throw new Error('paymaster::signatureKey not found');
        if (typeof (yamlObj.paymaster.signatureKey) !== 'string') throw new Error('paymaster::signatureKey not string');

        if (!yamlObj.bundler) throw new Error('bundler config not found');
        if (!yamlObj.bundler.privateKeys) throw new Error('bundler::privateKeys not found');
        if (!Array.isArray(yamlObj.bundler.privateKeys)) throw new Error('bundler::privateKeys not array');


        // set config
        this.httpServer = yamlObj.httpServer;
        this.web3 = yamlObj.web3;
        this.paymaster = yamlObj.paymaster;
        this.bundler = yamlObj.bundler;
    }

    public static getInstance() {
        if (!YamlConfig.instance) {
            YamlConfig.instance = new YamlConfig();
        }
        return YamlConfig.instance;
    }

}