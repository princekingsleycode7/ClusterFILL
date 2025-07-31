import { ethers } from "hardhat";

async function main() {
  // Option 1: Use ethers.utils.getAddress() to ensure proper checksum
  //const sepoliaUsdcAddress = ethers.getAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a98");
  
  // Option 2: Alternative - Use one of the verified USDC addresses from the search results
  const sepoliaUsdcAddress = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"; // This is checksummed correctly
  
  console.log(
    "Deploying ClusterFiShare contract and linking it to USDC on Sepolia at:",
    sepoliaUsdcAddress
  );

  // When we deploy the contract, we pass the required constructor arguments
  // in an array as the second parameter to `deployContract`.
  const clusterFiShare = await ethers.deployContract("ClusterFiShare", [
    sepoliaUsdcAddress,
  ]);

  // Wait for the deployment transaction to be mined and confirmed.
  await clusterFiShare.waitForDeployment();

  // Get the address of the newly deployed contract.
  const contractAddress = await clusterFiShare.getAddress();

  console.log(
    `✅ ClusterFiShare contract deployed successfully to: ${contractAddress}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("💥 Deployment failed:", error);
  process.exitCode = 1;
});