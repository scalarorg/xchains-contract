const Env = require("./env.js");
console.log(Env);
const config = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "ethereum-sepolia": {
      url: Env.sepolia.rpcUrl,
      accounts: [Env.sepolia.privateKey],
    },
    "ethereum-local": {
      url: Env.local.rpcUrl,
      accounts: [Env.local.privateKey],
    },
  },
};

module.exports = config;
