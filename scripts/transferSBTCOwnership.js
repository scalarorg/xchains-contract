// Deploy sBTC and MintContract (optional)
// Transfer ownership of sBTC to MintContract and then transfer back to deployer

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "sBTC";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const sbtc = new ethers.Contract(
    "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    contractABI,
    deployer
  );

  //   const SBTC = await ethers.getContractFactory("sBTC");
  //   const sbtc = await SBTC.deploy();
  //   await sbtc.deployed();

  console.log("sbtc address:", sbtc.address);
  console.log("sbtc total supply:", await sbtc.totalSupply());

  //   // Deploy the MintContract
  //   const gatewayAddress = "0x70b9E1B98fb9cDd0221778c1E4d72e7a386D9CCe";
  //   const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
  //   const MintContract = await ethers.getContractFactory("MintContract");
  //   const mintContract = await MintContract.deploy(
  //     gatewayAddress,
  //     gasServiceAddress,
  //     sbtc.address
  //   );
  //   await mintContract.deployed();

  const mintContractName = "MintContract";
  const mintContractArtifact = require(`../artifacts/contracts/${mintContractName}.sol/${mintContractName}.json`);
  const mintContractABI = mintContractArtifact.abi;
  const mintContract = new ethers.Contract(
    "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    mintContractABI,
    deployer
  );
  console.log("mintContract address:", mintContract.address);
  console.log("sbtc owner:", await sbtc.owner());
  const txTransferOwnership = await sbtc.transferOwnership(
    mintContract.address,
    true,
    false
  );
  await txTransferOwnership.wait();
  console.log("sbtc owner:", await sbtc.owner());
  const txTransferOwnershipAgain = await mintContract.transferMintOwnership(
    deployer.address
  );
  await txTransferOwnershipAgain.wait();
  console.log("sbtc owner:", await sbtc.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
