# Description

Solidity code and scripts for deploying and interacting with MintContract and BurnContract on Sepolia network.

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies (you may need to nvm use version > 16):

```sh
npm install
```

Compile smartcontracts

```
npx hardhat compile
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
| BurnContract       | 0x44dD1420Af56740ACeb697538227A9A787067786 |

## Scripts explain

### Deploy contract

Scripts to deploy smart contract usually begin with this pattern:

```javascript
const gatewayAddress = "0x1811AE0B97479b77258CF8aAda7768aB74e21aE9"; // Params passed to constructor of BurnContract
const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6"; // Params passed to constructor of BurnContract
const sbtcAddress = "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B"; // Params passed to constructor of BurnContract

const BurnContract = await ethers.getContractFactory("BurnContract");
const burnContract = await BurnContract.deploy(
  gatewayAddress,
  gasServiceAddress,
  sbtcAddress
);
await burnContract.deployed();
```

At the end of the deployment script, the contract abi and address will be saved to the `abis` folder.

```javascript
saveABI([
  {
    name: "BurnContract",
    address: burnContract.address,
  },
]);
```

### Interaction with deployed contracts

Scripts to test or interact with smart contract usually begin with this pattern:

```javascript
const contractName = "BurnContract";
const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
const contractABI = contractArtifact.abi;
const burnContract = new ethers.Contract(
  "0x6F111e169710C6c3a33948c867aE425A74cDa1a3", // TODO: update BurnContract address
  contractABI,
  signer
);
```

This code is used to get the contract instance by contract ABI and address.  
When running any scripts, check the contract address and update it if necessary.

When calling get methods of a contract (public attributes or view functions), you just need to:

```javascript
const result = await burnContract.getSomeValue();
```

However, when calling set methods of a contract (functions that change the state of the contract), you need to sign the transaction before sending it:

```javascript
const tx = await burnContract.setSomeValue(newValue);
await tx.wait();
```

## Details of Axelar related contracts

### Contracts deployed

In order to make the ethereum-side of the bridge work, we need to deploy these main contracts:

1. `AxelarGateway`: This contract is the main contract that will be used to interact with the Axelar network. The constructor of this contract take the address of the `AxelarAuthWeighted` contract as a parameter, so that we need to deploy the `AxelarAuthWeighted` contract first.
1. `AxelarAuthWeighted`: This contract is used to manage the operatorship of the Axelar network. It also define logic to validate the signatures of messages receiving from the Axelar network.
1. `MintContract`: This contract implement the `AxelarExecutable` interface. The constructor of this contract take the address of the `AxelarGateway`, `GasServices` and `sBTC` contracts as parameters. However, the `GasServices` contract is not used in the our implementation, so basically we can pass the address of contract deployed by Axelar team (e.g. `0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6` on Sepolia).
1. `BurnContract`: Deployment of this contract is similar to `MintContract`.

### How do these contracts work together?

#### Minting flow

1. BTC -> Axelar stuff
1. Relayer listen and handle the ContractCallApproved event from Axelar network. In this step, relayer will generate `executeData` from batch commands and call `execute()` function of `AxelarGateway` contract.

   ```javascript
   const executeData = await vxClient.getExecuteDataFromBatchCommands(
     event.args.destinationChain,
     batchedCommandId
   );

   logger.info(
     `[handleCosmosToEvmApprovedEvent] BatchCommands: ${JSON.stringify(
       executeData
     )}`
   );

   const tx = await evmClient.gatewayExecute(executeData);
   ```

1. In this `execute()` function, the `input` first will be decoded to `data` part and `proof` part. These values then will be validated by the `validateProof()` function of `AxelarAuthWeighted` contract.
1. If the proof is valid, the gateway contract will process commands in the `data` part. In this case, it will call its `approveContractCall()` function and emit `ContractCallApproved` event, indicating that the _Minting call_ is approved to be executed.
1. Relayer will listen to this event and call the `execute()` function of the `MintContract` contract.
   - The `execute()` function is actually the `execute()` function of the `AxelarExecutable` interface. It first check if the _Minting call_ is approved and then call the `_execute()` function of `MintContract`.
   - This `_execute()` will then call `sBTC` contract to mint the token.

#### Burning flow

1. To unbonding Bitcoin transaction, the staker first need to burn their sBTC token on Ethereum network.

1. First, the staker need to approve the `BurnContract` to burn their sBTC token. This is done by calling the `approve()` function of the `sBTC` contract.

   ```javascript
   const tx = await sBTC.approve(burnContract.address, amountToBurn);
   await tx.wait();
   ```

1. Then, the staker can call the `callBurn()` function of the `BurnContract` contract with necessary parameters.

   ```javascript
   const txCallBurn = await burnContract.callBurn(
     destinationChain,
     destinationAddress,
     amountToBurn,
     btcPsbtB64
   );
   await txCallBurn.wait();
   ```

1. This `callBurn()` function will then call `sBTC` contract to burn the token and call the `callContract()` function of the `AxelarGateway` contract to emit `ContractCall` event for relayer to listen and handle.

#### Contract for GMP

- If you want to create another contract for GMP in Axelar network, you can follow the same pattern as `MintContract` and `BurnContract`. The contract need to implement the `AxelarExecutable` interface with the same constructor.
- If your contract execute logic in the BTC -> EVM direction, write your logic in the `_execute()` function such as `MintContract`.
- If your contract execute logic in the EVM -> BTC direction, write your logic in the `callContract()` function such as `BurnContract`.
- For more details, please refer to this [example](https://github.com/axelarnetwork/axelar-examples/tree/main/examples/evm/call-contract).

#### sBTC Ownership

Currently, the ownership of the `sBTC` contract is set to the `MintContract`. This is to ensure that only the `MintContract` can mint the token. If you want to change the ownership, you can call the `transferOwnership()` function of the `sBTC` contract (using the deployer account). Details can be found in the `scripts/setOwnership.js`.

#### Axelar Operatorship

The operatorship of the Axelar network is managed by the `AxelarAuthWeighted` contract. The operator can be added by calling the `transferOperatorship()` function of this contract. Details can be found in the `scripts/transferOperatorShip.js`.

#### Deploy contract batch

To deploy all contract in once time.

```bash
node scripts/deployAll.js deploy <target> --network <string> --newSbtc <bool> --newAxelarGateway <bool>
```

1. target: choice "All, AxelarGateway, MintContract, BurnContract"
1. network: network name < ethereum-sepolia, ethereum-local>
1. --newSbtc: a parameter to specify whether to deploy a new contract sBtc
1. --newAxelarGateway: a parameter to specify whether to deploy a new contract AxelarGateway when deploying Mint/Burn Contract
1. --AxelarGatewayAddress: input AxelarGateway address when newAxelarGateway is false
