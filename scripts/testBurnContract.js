const { ethers } = require("hardhat");
const path = require("path");
const { setTimeout } = require("timers/promises");
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "BurnContract";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const burnContract = new ethers.Contract(
    "0x6F111e169710C6c3a33948c867aE425A74cDa1a3", // TODO: update BurnContract address
    contractABI,
    deployer
  );

  const sbtcContractName = "sBTC";
    const sbtcContractArtifact = require(`../artifacts/contracts/${sbtcContractName}.sol/${sbtcContractName}.json`);
    const sbtcContractABI = sbtcContractArtifact.abi;
    const sbtcContract = new ethers.Contract(
      "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B", // TODO: update sBTC address
      sbtcContractABI,
      deployer
    );

  const destinationChain = "Wbitcoin";
  const destinationAddress = "f802b68aa83f8b43e433b27b6962863d629692404939fc3f2dce80c623f98106";
  const amount = ethers.utils.parseUnits("1", 18);
  const stakerAddress = "bc1qjcz5et0yml4hgmehfsjrtayxvryxplqzkzxfx3"
  try {
    console.log("SBTC balance:", (await sbtcContract.balanceOf(deployer.address)).toString());
    // Approve SBTC spend for BurnContract
    const txApprove = await sbtcContract.approve(
      burnContract.address,
      amount
    );
    console.log("Approve transaction hash:", txApprove.hash);
    await txApprove.wait();
    console.log("Approve transaction confirmed");
    // Call Burn
    const txCallBurn = await burnContract.callBurn(
      destinationChain,
      destinationAddress,
      amount,
      stakerAddress
    );
    console.log("Burn transaction hash:", txCallBurn.hash);
    await txCallBurn.wait();
    console.log("Burn transaction confirmed");
    console.log("SBTC balance:", (await sbtcContract.balanceOf(deployer.address)).toString());
  } catch (error) {
    console.error("Error executing transaction:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
