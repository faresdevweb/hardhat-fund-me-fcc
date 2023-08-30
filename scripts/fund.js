const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  console.log("Funding Contract...");
  const { deployer } = await getNamedAccounts();
  console.log("deployer", deployer);
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("fundMe", fundMe);
  const transactionResponse = await fundMe.fund({
    value: "100000000000000000",
  });
  console.log("transactionResponse", transactionResponse);
  await transactionResponse.wait(1);
  console.log("Funded!");
}

main();
