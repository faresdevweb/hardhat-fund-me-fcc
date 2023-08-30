const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  log("DEPLOYING FUNDME CONTRACT");
  log("-------------------------------------------------------");
  console.log("DEPLOYMENTS : ", deploy);
  console.log("LOGS : ", log);

  const { deployer } = await getNamedAccounts();

  console.log("DEPLOYER : ", deployer);

  const chainId = network.config.chainId;

  console.log("CHAIN ID : ", chainId);

  let ethUsdPriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeedAddress"];
  }

  console.log("ETH/USD ADDRESS: ", ethUsdPriceFeedAddress);
  // when going for localhost or hadhat network we want to use a mock
  const args = [ethUsdPriceFeedAddress];
  const FundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // price feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(FundMe.address, args);
  }
  log("-------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
