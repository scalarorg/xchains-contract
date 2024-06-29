// scripts/deploy_price_consumer.js
const { ethers } = require("hardhat");

async function main() {
  const PriceConsumerV3 = await ethers.getContractFactory("ManualChainlink");
  const priceConsumer = await PriceConsumerV3.deploy();
  await priceConsumer.deployed();

  console.log("PriceConsumerV3 deployed to:", priceConsumer.address);
  console.log("Price: ", await priceConsumer.getLatestPrice());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
