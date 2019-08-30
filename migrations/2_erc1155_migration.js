const actorFactory = artifacts.require("ActorFactory");
const erc1155 = artifacts.require("ERC1155");

module.exports = (deployer, network) => {
  if (network == "development") {
    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(erc1155, actorFactory.address));
  } else {
  }
};
