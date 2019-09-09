const ActorFactory = artifacts.require("ActorFactory");
const ERC1155 = artifacts.require("ERC1155");
const AffogatoStandardCoffee = artifacts.require("AffogatoStandardCoffee");
const AffogatoCoffeeHandler = artifacts.require("AffogatoCoffeeHandler");

const actorFactory = artifacts.require("StubActorFactory");

const ropstenAffogatoAddress = "0x59ec33BDCa28FE0Ea38e02d0BC424Bc797846d86";

module.exports = (deployer, network) => {
  if (network == "development") {
    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(ERC1155, actorFactory.address))
      .then((erc1155Instance) => deployer.deploy(AffogatoCoffeeHandler, erc1155Instance.address))
      .then((affogatoCoffeeHandlerInstance) => deployer.deploy(AffogatoStandardCoffee, affogatoCoffeeHandlerInstance.address))
  } else if (network === "rinkeby") {
    deployer
      .deploy(actorFactory)
      .then(() => actorFactory.deployed())
      .then(() => deployer.deploy(ERC1155, actorFactory.address))
      .then((erc1155Instance) => deployer.deploy(AffogatoCoffeeHandler, erc1155Instance.address))
      .then((affogatoCoffeeHandlerInstance) => deployer.deploy(AffogatoStandardCoffee, affogatoCoffeeHandlerInstance.address))
  } else if (network == "ropsten") {
    deployer
      .deploy(ERC1155, ropstenAffogatoAddress)
      .then(() => ERC1155.deployed())
      .then((erc1155Instance) => deployer.deploy(AffogatoCoffeeHandler, erc1155Instance.address))
      .then((affogatoCoffeeHandlerInstance) => deployer.deploy(AffogatoStandardCoffee, affogatoCoffeeHandlerInstance.address))
  }
};

