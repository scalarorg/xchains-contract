const { ethers } = require("ethers");

async function getSepoliaGasPrice() {
  // Connect to a Sepolia node
  const provider = new ethers.providers.JsonRpcProvider(
    "https://eth-sepolia.g.alchemy.com/v2/nNbspp-yjKP9GtAcdKi8xcLnBTptR2Zx"
  );

  // Fetch the current gas price
  const gasPrice = await provider.getGasPrice();

  // Print the gas price
  console.log(
    `Current Sepolia Gas Price: ${ethers.utils.formatUnits(
      gasPrice,
      "gwei"
    )} gwei`
  );
}

getSepoliaGasPrice();
