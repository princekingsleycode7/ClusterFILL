// smart-contracts/hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Validate environment variables
if (!SEPOLIA_RPC_URL && process.env.NODE_ENV !== "test") {
  console.warn("Warning: SEPOLIA_RPC_URL not set in .env file");
}
if (!PRIVATE_KEY && process.env.NODE_ENV !== "test") {
  console.warn("Warning: PRIVATE_KEY not set in .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      timeout: 60000, // 60 seconds
      gas: "auto",
      gasPrice: "auto",
    },
  },
  defaultNetwork: "hardhat",
};

export default config;