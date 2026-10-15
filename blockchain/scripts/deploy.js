const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log("SEAIT Online Voting System - Smart Contract Deployer");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const VotingLedgerFactory = await hre.ethers.getContractFactory("VotingLedger");
  const votingLedger = await VotingLedgerFactory.deploy();
  await votingLedger.waitForDeployment();

  const contractAddress = await votingLedger.getAddress();
  console.log("VotingLedger deployed to:", contractAddress);

  const network = await hre.ethers.provider.getNetwork();
  console.log("Network Chain ID:", network.chainId.toString());

  // Save deployment artifact for API and Frontend integration
  const deployInfo = {
    address: contractAddress,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contractName: "VotingLedger",
  };

  const outputPath = path.join(__dirname, "..", "deployed-contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployInfo, null, 2));
  console.log("Deployment details saved to:", outputPath);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
