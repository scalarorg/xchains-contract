
const { ethers } = require("hardhat");
const path = require("path");
const { setTimeout } = require("timers/promises");
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "MintContract";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const mintContract = new ethers.Contract(
    "0x4bAbD4440dF34D47783f33A9F016567bD3cBB1d7", // TODO
    contractABI,
    deployer
  );
  const axlContractName = "AxelarGateway";
  const axlContractArtifact = require(`../artifacts/contracts/axelar/${axlContractName}.sol/${axlContractName}.json`);
  const axlContractABI = axlContractArtifact.abi;
  const axlContract = new ethers.Contract(
    "0xe432150cce91c13a887f7D836923d5597adD8E31", //TODO
    axlContractABI,
    deployer
  );
  const sbtcContractName = "sBTC";
  const sbtcContractArtifact = require(`../artifacts/contracts/${sbtcContractName}.sol/${sbtcContractName}.json`);
  const sbtcContractABI = sbtcContractArtifact.abi;
  const sbtcContract = new ethers.Contract(
    "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B",
    sbtcContractABI,
    deployer
  );

  const destinationChain = "ethereum-sepolia";
  const destinationAddress = "0x4bAbD4440dF34D47783f33A9F016567bD3cBB1d7"; // TODO
  const to = "0x130C4810D57140e1E62967cBF742CaEaE91b6ecE";
    const amount = ethers.utils.parseUnits("1", 18);
  console.log("destinationChain:", mintContract.destinationChain);
  try {
    // Call Mint
  const txCallMint = await mintContract.callMint(destinationChain, destinationAddress, to, amount,{
    value: ethers.utils.parseEther("0.0001"),
  });
    console.log("Transaction hash:", txCallMint.hash);
    await txCallMint.wait();
    console.log("Transaction confirmed");
  } catch (error) {
    console.error("Error executing transaction:", error);
  }
  await setTimeout(20000);
  console.log("destinationChain:", mintContract.destinationChain);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
