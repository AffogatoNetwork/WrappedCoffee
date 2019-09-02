const ActorFactory = artifacts.require("ActorFactory");
const ERC1155 = artifacts.require("ERC1155");
const AffogatoStandardCoffee = artifacts.require("AffogatoStandardCoffee");
const AffogatoCoffeeHandler = artifacts.require("AffogatoCoffeeHandler");

const actorFactory = artifacts.require("StubActorFactory");


module.exports = (deployer, network) => {
  if (network == "development") {
    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(erc1155, actorFactory.address))
      .then((erc1155Instance) => deployer.deploy(AffogatoCoffeeHandler, erc1155Instance.address))
      .then((affogatoCoffeeHandlerInstance) => deployer.deploy(AffogatoStandardCoffee, affogatoCoffeeHandlerInstance.address))
  } else if (network === "rinkeby") {
    // deployer.deploy(erc1155, "0x51dC72631E9C730590cc93aB631E1B83B9067C0d")
    //   .then(() => console.log("Success"));
    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(erc1155, actorFactory.address))
      .then((erc1155Instance) => deployer.deploy(AffogatoCoffeeHandler, erc1155Instance.address))
      .then((affogatoCoffeeHandlerInstance) => deployer.deploy(AffogatoStandardCoffee, affogatoCoffeeHandlerInstance.address))
  }
};

