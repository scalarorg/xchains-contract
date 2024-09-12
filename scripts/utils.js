const path = require("path");
const { ethers } = require("hardhat");
const envs = require("../envs.js");
const fs = require('fs');

function getConfigPath() {
    return envs.configPath || path.join(__dirname, "../", "config/chains");
}
function readChainData(chain, fileName) {
    try {
      const filePath = path.join(getConfigPath(), chain, fileName)
      const data = fs.readFileSync(filePath, 'utf8');
      const chainConfig = JSON.parse(data);
      return chainConfig

  } catch (error) {
      console.error('Error reading or parsing the file:', error);
  }
}

function readChainConfig(chain) {
    return readChainData(chain, "config.json");
}

function saveChainData(chain, data, fileName) {
    const chainDir = path.join(getConfigPath(), chain);
    try {
        if (!fs.existsSync(chainDir)) {
            fs.mkdirSync(chainDir);
        }
        const filePath = path.join(chainDir, fileName)
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error('Error writing the file:', error);
    }
}

function createWallet(chainConfig) {
    const { mnemonic, walletIndex} = chainConfig;
    let wallet;
    if (mnemonic && walletIndex !== undefined) {
        // const {hdkey} = require('ethereumjs-wallet');
        // const hdwallet = hdkey.fromMasterSeed(mnemonic);
        wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${walletIndex}`);
    } else if (chainConfig.rivateKey) {
        wallet = new ethers.Wallet(privateKey);
    }
    if (wallet && chainConfig.rpcUrl) {
        const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
        console.log(wallet);
        wallet = wallet.connect(provider);
    }
    return wallet;
}
module.exports = {
    getConfigPath,
    createWallet,
    readChainData,
    readChainConfig,
    saveChainData
} 