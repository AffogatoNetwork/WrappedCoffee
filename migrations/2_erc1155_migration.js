const actorFactory = artifacts.require("StubActorFactory");
const erc1155 = artifacts.require("ERC1155");

module.exports = (deployer, network) => {
  if (network == "development") {
    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(erc1155, actorFactory.address));
  } else if (network === "rinkeby") {
    // deployer.deploy(erc1155, "0x51dC72631E9C730590cc93aB631E1B83B9067C0d")
    //   .then(() => console.log("Success"));

    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(erc1155, actorFactory.address));
  }
};
