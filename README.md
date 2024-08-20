## Description

Solidity code and scripts for deploying and interacting with MintContract and BurnContract on Sepolia network.

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies (you may need to nvm use version > 16):

```sh
npm install
```

Now you can run script in the scripts folder using:

```sh
npx hardhat run scripts/script-name.js --network sepolia
```

## Sepolia Deployed Contract

| Contract           | Address                                    |
| ------------------ | ------------------------------------------ |
| sBTC               | 0xa32e5903815476Aff6E784F5644b1E0e3eE2081B |
| AxelarGateway      | 0xd70943944567979d99800DD14b441B1D3A601A1D |
| GasService         | 0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6 |
| AxelarAuthWeighted | 0x71b7B290B14D7A8EB8071e35e3457b192b4a7fB6 |
| MintContract       | 0x768E8De8cf0c7747D41f75F83C914a19C5921Cf3 |
| BurnContract       | 0x9F3Ed8159e7c0Fe44Ccd945870f6DDD3062D58B2 |

## Note

Scripts to test or interact with smart contract usually begin with this pattern:

```javascript
const contractName = "BurnContract";
const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
const contractABI = contractArtifact.abi;
const burnContract = new ethers.Contract(
  "0x6F111e169710C6c3a33948c867aE425A74cDa1a3", // TODO: update BurnContract address
  contractABI,
  deployer
);
```

This code is used to get the contract instance by contract ABI and address.  
When running any scripts, check the contract address and update it if necessary.
