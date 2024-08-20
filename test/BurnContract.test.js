// !!! NOTICE: This test interacts with the Sepolia network and requires a Sepolia account with funds to pay for gas.
// !!! NOTICE: Be aware of the gas fees and account balance when running this test.

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BurnContract", function () {
  let burnContract;
  let sbtcContract;
  let owner;

  beforeEach(async function () {
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    const provider = new ethers.providers.JsonRpcProvider(
      "https://eth-sepolia.public.blastapi.io"
    );
    owner = new ethers.Wallet(privateKey, provider);

    const contractName = "BurnContract";
    const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    const contractABI = contractArtifact.abi;
    burnContract = new ethers.Contract(
      "0x9F3Ed8159e7c0Fe44Ccd945870f6DDD3062D58B2", // TODO: update BurnContract address
      contractABI,
      owner
    );

    const sbtcContractName = "sBTC";
    const sbtcContractArtifact = require(`../artifacts/contracts/${sbtcContractName}.sol/${sbtcContractName}.json`);
    const sbtcContractABI = sbtcContractArtifact.abi;
    sbtcContract = new ethers.Contract(
      "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B", // TODO: update sBTC address
      sbtcContractABI,
      owner
    );
  });

  it("should get owner", async function () {
    expect(owner.address).to.equal(
      "0xD2EB37F383F67da4B55Be9EcF0EF0dea83Afb19A"
    );
  });

  it("should get BurnContract", async function () {
    expect(burnContract.address).to.equal(
      "0x9F3Ed8159e7c0Fe44Ccd945870f6DDD3062D58B2" // TODO: update BurnContract address
    );
  });

  it("should burn tokens", async function () {
    const initialBalance = await sbtcContract.balanceOf(owner.address);

    const destinationChain = "Wbitcoin";
    const destinationAddress = "0x9F3Ed8159e7c0Fe44Ccd945870f6DDD3062D58B2";
    const btcPsbtB64 =
      "0200000001a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890000000006a4730440220561db21e45ed7894ab528d6ab348c7b7dd0b6b8d09ab4a2c703bd9f786cfb7d002205b8db7a1f0a7c81f514f735b37f4a4d4d907c7aee64d8c8b0a6fcda23a715db3012103b1e2c84a9b3b1f7c6ebd73c6feddfe6a1e47b9c6a7f45d9f8b6d78197c8e8fb6ffffffff02e8030000000000001976a9147b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b7b88ac10270000000000001976a9148c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c88ac00000000";

    const amountToBurn = ethers.utils.parseUnits("1", 18);

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

    const finalBalance = await sbtcContract.balanceOf(owner.address);
    expect(finalBalance).to.equal(initialBalance.sub(amountToBurn));
  });
});
