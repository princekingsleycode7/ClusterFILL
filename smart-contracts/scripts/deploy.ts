// smart-contracts/scripts/deploy.ts

import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ClusterFiShare contract...");
  
  const clusterFiShare = await ethers.deployContract("ClusterFiShare");

  await clusterFiShare.waitForDeployment();

  const contractAddress = await clusterFiShare.getAddress();
  console.log(`ClusterFiShare deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});