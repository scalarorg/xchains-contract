// transfer sBTC ownership for MintContract
// can only be run with deployer account of MintContract
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "sBTC";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const sbtc = new ethers.Contract(
    "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B",
    contractABI,
    deployer
  );

  console.log("sBTC address:", sbtc.address);
  console.log("sBTC total supply:", await sbtc.totalSupply());

  const currentSBTCOwner = await sbtc.owner();
  console.log("sBTC owner:", currentSBTCOwner);

  const mintContractName = "MintContract";
  const mintContractArtifact = require(`../artifacts/contracts/${mintContractName}.sol/${mintContractName}.json`);
  const mintContractABI = mintContractArtifact.abi;
  const mintContract = new ethers.Contract(
    currentSBTCOwner,
    mintContractABI,
    deployer
  );

  const txTransferOwnership = await mintContract.transferMintOwnership(
    "0x768E8De8cf0c7747D41f75F83C914a19C5921Cf3" // TODO: Update this address to new mintContract address
  );
  await txTransferOwnership.wait();
  console.log("sBTC owner:", await sbtc.owner());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
