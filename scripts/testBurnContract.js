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
  const destinationAddress = "0x9F3Ed8159e7c0Fe44Ccd945870f6DDD3062D58B2";
  const btcPsbtB64 =
    "0200000001a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890000000006a4730440220561db21e45ed7894ab528d6ab348c7b7dd0b6b8d09ab4a2c703bd9f786cfb7d002205b8db7a1f0a7c81f514f735b37f4a4d4d907c7aee64d8c8b0a6fcda23a715db3012103b1e2c84a9b3b1f7c6ebd73c6feddfe6a1e47b9c6a7f45d9f8b6d78197c8e8fb6ffffffff02e8030000000000001976a9147b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b88ac10270000000000001976a9148c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c88ac00000000";

  const amountToBurn = ethers.utils.parseUnits("1", 18);
  try {
    console.log(
      "SBTC balance:",
      (await sbtcContract.balanceOf(deployer.address)).toString()
    );
    // Approve SBTC spend for BurnContract
    const txApprove = await sbtcContract.approve(
      burnContract.address,
      amountToBurn
    );
    await txApprove.wait();
    console.log("Approve transaction confirmed");
    // Call Burn
    const txCallBurn = await burnContract.callBurn(
      destinationChain,
      destinationAddress,
      amountToBurn,
      btcPsbtB64
    );

    await txCallBurn.wait();
    console.log("Burn transaction confirmed");
    console.log(
      "SBTC balance:",
      (await sbtcContract.balanceOf(deployer.address)).toString()
    );
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
