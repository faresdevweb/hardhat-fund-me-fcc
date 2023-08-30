const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe;
      let deployer;
      let MockV3Aggregator;
      const sendValue = "1000000000000000000"; // 1 ETH

      beforeEach(async () => {
        // Deploy the contract
        // const accounts = await ethers.getSigners();
        // const accountOne = accounts[0];
        deployer = (await getNamedAccounts()).deployer;
        console.log("deployer", deployer);
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        MockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async () => {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.priceFeed();
          assert.equal(response, MockV3Aggregator.target);
        });
      });

      describe("fund", async () => {
        it("fails if you dont send enough ether", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "Didn't send enought !"
          );
        });

        it("Updates the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.addressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("add funders to array of funders", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.funders(0);
          assert.equal(response, deployer);
        });
      });

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("Withdraw ETH from a single founder", async () => {
          // get starting balances
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // withdraw
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // get gas used in transaction
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice; // 0.000000005848484 * 10 * 18

          // get ending balances
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // compare values
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingDeployerBalance - gasCost,
            endingDeployerBalance
          );
        });
        it("Allows us to withdraw from multiple funders", async () => {
          const accounts = await ethers.getSigners();
          let funders = [];
          for (let i = 0; i < 5; i++) {
            const account = accounts[i];
            funders.push(account.address);
            await fundMe.connect(account).fund({ value: sendValue });
          }

          // get starting balances
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // withdraw
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // get gas used in transaction
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          // get ending balances
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          // compare values
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingDeployerBalance - gasCost,
            endingDeployerBalance
          );

          await expect(fundMe.funders(0)).to.be.reverted;

          for (let i = 1; i < 5; i++) {
            assert.equal(await fundMe.addressToAmountFunded(funders[i]), 0);
          }
        });
        it("Only allows the owner to withdraw funds", async () => {
          // get addresses
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);

          // withdraw
          await expect(attackerConnectedContract.withdraw()).to.be.reverted;
        });
      });
    });

/**
 *
 *
 * //
 *
 *
 */
