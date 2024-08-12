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
      "0x335936bcB8ccCf8e08fC73676De2794735a35d46", // TODO: update BurnContract address
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
      "0x130C4810D57140e1E62967cBF742CaEaE91b6ecE"
    );
  });

  it("should get BurnContract", async function () {
    expect(burnContract.address).to.equal(
      "0x335936bcB8ccCf8e08fC73676De2794735a35d46"
    );
  });

  it("should burn tokens", async function () {
    const initialBalance = await sbtcContract.balanceOf(owner.address);

    const destinationChain = "Wbitcoin";
    const destinationAddress =
      "f802b68aa83f8b43e433b27b6962863d629692404939fc3f2dce80c623f98106";
    const stakerAddress = "bc1qjcz5et0yml4hgmehfsjrtayxvryxplqzkzxfx3";

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
      stakerAddress
    );

    await txCallBurn.wait();
    console.log("Burn transaction confirmed");

    const finalBalance = await sbtcContract.balanceOf(owner.address);
    expect(finalBalance).to.equal(initialBalance.sub(amountToBurn));
  });

  it("should emit a Burn event when tokens are burned", async function () {
    const destinationChain = "Wbitcoin";
    const destinationAddress =
      "f802b68aa83f8b43e433b27b6962863d629692404939fc3f2dce80c623f98106";
    const stakerAddress = "bc1qjcz5et0yml4hgmehfsjrtayxvryxplqzkzxfx3";

    const amountToBurn = ethers.utils.parseUnits("1", 18);

    const txApprove = await sbtcContract.approve(
      burnContract.address,
      amountToBurn
    );

    await txApprove.wait();
    console.log("Approve transaction confirmed");

    await expect(
      burnContract.callBurn(
        destinationChain,
        destinationAddress,
        amountToBurn,
        stakerAddress
      )
    )
      .to.emit(burnContract, "Burned")
      .withArgs(owner.address, amountToBurn);
  });
});
