require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
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
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/nNbspp-yjKP9GtAcdKi8xcLnBTptR2Zx",
      accounts: [
        "0x2c4f7317230ccd5cb55e7e5378b8bc4b635cd6544cf54cf82116600bbb3c4cd5",
      ],
    },
  },
};
