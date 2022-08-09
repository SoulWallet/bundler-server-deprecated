/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 21:58:13
 * @LastEditors: cejay
 * @LastEditTime: 2022-08-09 19:19:15
 */
import YAML from 'yaml'
import fs from 'fs';
import Web3 from 'web3';

export class YamlConfig {

    private static instance: YamlConfig;

    public httpServer = {
        host: 'localhost'
    };
    public web3 = {
        provider: 'https://'
    };
    public entryPoint = {
        address: '0x<address>'
    };
    public paymaster = {
        paymasterAddress: '0x<contract address>',
        paymasterChecksumAddress: '0x<contract address>',
        signatureKey: '0x<signature key>'
    };
    public bundler = {
        interval: 5,
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

        if (!yamlObj.entryPoint) throw new Error('entryPoint config not found');
        if (!yamlObj.entryPoint.address) throw new Error('entryPoint::address not found');

        if (!yamlObj.paymaster) throw new Error('paymaster config not found');
        if (!yamlObj.paymaster.paymasterAddress) throw new Error('paymaster::paymasterAddress not found');
        if (typeof (yamlObj.paymaster.paymasterAddress) !== 'string') throw new Error('paymaster::paymasterAddress not string');
        if (!yamlObj.paymaster.signatureKey) throw new Error('paymaster::signatureKey not found');
        if (typeof (yamlObj.paymaster.signatureKey) !== 'string') throw new Error('paymaster::signatureKey not string');

        if (!yamlObj.bundler) throw new Error('bundler config not found');
        if (!yamlObj.bundler.privateKeys) throw new Error('bundler::privateKeys not found');
        if (!Array.isArray(yamlObj.bundler.privateKeys)) throw new Error('bundler::privateKeys not array');
        if (yamlObj.bundler.privateKeys.length === 0) throw new Error('bundler::privateKeys is empty');
        if (!yamlObj.bundler.interval) throw new Error('bundler::interval not found');

        // set config
        this.httpServer = yamlObj.httpServer;
        this.web3 = yamlObj.web3;
        this.paymaster = yamlObj.paymaster;
        this.entryPoint = yamlObj.entryPoint;
        this.bundler = yamlObj.bundler;

        // check address
        const _web3 = new Web3();
        if (!_web3.utils.isAddress(this.paymaster.paymasterAddress)) {
            throw new Error('paymaster::paymasterAddress not valid');
        }
        this.paymaster.paymasterChecksumAddress = _web3.utils.toChecksumAddress(this.paymaster.paymasterAddress);
        this.paymaster.paymasterAddress = this.paymaster.paymasterAddress.toLocaleLowerCase();
        try {
            _web3.eth.accounts.privateKeyToAccount(this.paymaster.signatureKey);
        } catch (error) {
            throw new Error('paymaster::signatureKey not valid');
        }

        if (!_web3.utils.isAddress(this.entryPoint.address)) {
            throw new Error('entryPoint::address not valid');
        }
        this.entryPoint.address = _web3.utils.toChecksumAddress(this.entryPoint.address);


        const _bundlerSet: Set<string> | undefined = new Set<string>();
        for (let index = 0; index < this.bundler.privateKeys.length; index++) {
            const pk = this.bundler.privateKeys[index];
            if (_bundlerSet.has(pk)) {
                throw new Error('bundler::privateKeys not unique');
            }
            _bundlerSet.add(pk);
            try {
                _web3.eth.accounts.privateKeyToAccount(pk);
            } catch (error) {
                throw new Error('bundler::privateKeys[' + index + '] not valid');
            }
        }
        if (this.bundler.interval >= 2 && this.bundler.interval <= 60) {

        } else {
            throw new Error('bundler::interval not valid');
        }


    }

    public static getInstance() {
        if (!YamlConfig.instance) {
            YamlConfig.instance = new YamlConfig();
        }
        return YamlConfig.instance;
    }

}