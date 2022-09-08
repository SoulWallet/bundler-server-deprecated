/*
 * @Description: 
 * @Version: 1.0
 * @Autor: z.cejay@gmail.com
 * @Date: 2022-08-08 21:58:13
 * @LastEditors: cejay
 * @LastEditTime: 2022-09-08 10:54:28
 */
import YAML from 'yaml'
import fs from 'fs';
import Web3 from 'web3';

export class YamlConfig {

    private static instance: YamlConfig;

    public httpServer = {
        host: '0.0.0.0'
    };
    public web3 = {
        provider: 'https://'
    };
    public entryPoint = {
        address: '0x<address>'
    };
    public paymaster = {
        stakePaymasterAddress: '0x<contract address>',
        stakePaymasterChecksumAddress: '0x<contract address>',
        stakeSignatureKey: '0x<signature key>',
        freePaymasterAddress: '0x<contract address>',
        freePaymasterChecksumAddress: '0x<contract address>',
        freeSignatureKey: '0x<signature key>',

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
        if (!yamlObj.paymaster.stakePaymasterAddress) throw new Error('paymaster::stakePaymasterAddress not found');
        if (typeof (yamlObj.paymaster.stakePaymasterAddress) !== 'string') throw new Error('paymaster::stakePaymasterAddress not string');
        if (!yamlObj.paymaster.stakeSignatureKey) throw new Error('paymaster::stakeSignatureKey not found');
        if (typeof (yamlObj.paymaster.stakeSignatureKey) !== 'string') throw new Error('paymaster::stakeSignatureKey not string');
        if (!yamlObj.paymaster.freePaymasterAddress) throw new Error('paymaster::freePaymasterAddress not found');
        if (typeof (yamlObj.paymaster.freePaymasterAddress) !== 'string') throw new Error('paymaster::freePaymasterAddress not string');
        if (!yamlObj.paymaster.freeSignatureKey) throw new Error('paymaster::freeSignatureKey not found');
        if (typeof (yamlObj.paymaster.freeSignatureKey) !== 'string') throw new Error('paymaster::freeSignatureKey not string');



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
        if (!_web3.utils.isAddress(this.paymaster.stakePaymasterAddress)) {
            throw new Error('paymaster::stakePaymasterAddress not valid');
        }
        if (!_web3.utils.isAddress(this.paymaster.freePaymasterAddress)) {
            throw new Error('paymaster::freePaymasterAddress not valid');
        }
        this.paymaster.stakePaymasterChecksumAddress = _web3.utils.toChecksumAddress(this.paymaster.stakePaymasterAddress);
        this.paymaster.stakePaymasterAddress = this.paymaster.stakePaymasterAddress.toLocaleLowerCase();
        this.paymaster.freePaymasterChecksumAddress = _web3.utils.toChecksumAddress(this.paymaster.freePaymasterAddress);
        this.paymaster.freePaymasterAddress = this.paymaster.freePaymasterAddress.toLocaleLowerCase();

        try {
            _web3.eth.accounts.privateKeyToAccount(this.paymaster.stakeSignatureKey);
        } catch (error) {
            throw new Error('paymaster::stakeSignatureKey not valid');
        }


        try {
            _web3.eth.accounts.privateKeyToAccount(this.paymaster.freeSignatureKey);
        } catch (error) {
            throw new Error('paymaster::freeSignatureKey not valid');
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