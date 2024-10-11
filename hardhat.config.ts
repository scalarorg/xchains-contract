import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-foundry";
import { Env } from "./env";

const config: HardhatUserConfig = {
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
    sepolia: {
      url: Env.sepolia.rpcUrl,
      accounts: [Env.sepolia.evmPrivateKey],
    },
    local: {
      url: Env.local.rpcUrl,
      accounts: [Env.local.evmPrivateKey],
    },
  },
};

export default config;
