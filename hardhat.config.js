require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
const envs = require("./envs.js");
/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // ethernal: {
  //   apiToken:
  //     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJlYmFzZVVzZXJJZCI6IlUwU3ZPU0tFWkRWMEhXZEJoanZ0SVM1Mnl2dDEiLCJhcGlLZXkiOiJNQzNWTVhGLTJZVjRHRTYtTlpDWkcySy1ZN0dCMTZWXHUwMDAxIiwiaWF0IjoxNzE5Mjg0NzcwfQ.G0dKlIAj1SLbg05wysuC2G8oUgPTHCNkyJ2Iv56Zy7Y",
  // },
  networks: {
    "ethereum-sepolia": {
      // url: "https://eth-sepolia.g.alchemy.com/v2/nNbspp-yjKP9GtAcdKi8xcLnBTptR2Zx",
      url: envs.rpcUrlSepolia,
      accounts: [envs.privateKeySigner],
    },
    "ethereum-local": {
      url: envs.rpcUrlAnvil,
      accounts: [envs.privateKeySigner],
    },
    "sepolia": {
      // url: "https://eth-sepolia.g.alchemy.com/v2/nNbspp-yjKP9GtAcdKi8xcLnBTptR2Zx",
      url: envs.rpcUrlSepolia,
      accounts: [envs.privateKeySigner],
    },
    anvil: {
      url: envs.rpcUrlAnvil,
      accounts: [envs.privateKeySigner],
    },
  },
};
