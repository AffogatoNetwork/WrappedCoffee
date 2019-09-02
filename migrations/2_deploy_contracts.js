const ActorFactory = artifacts.require("ActorFactory");
const ERC1155 = artifacts.require("ERC1155");
const AffogatoStandardCoffee = artifacts.require("AffogatoStandardCoffee");
const AffogatoCoffeeHandler = artifacts.require("AffogatoCoffeeHandler");

module.exports = (deployer, network) => {
  if (network == "development") {
    deployer.deploy(ActorFactory).then(async actorInstance => {
      await deployer
        .deploy(ERC1155, actorInstance.address)
        .then(async erc1155Instance => {
          await deployer
            .deploy(AffogatoCoffeeHandler, erc1155Instance.address)
            .then(async coffeeHandlerInstance => {
              await deployer.deploy(
                AffogatoStandardCoffee,
                coffeeHandlerInstance.address
              );
            });
        });
    });
  } else {
    //TODO: set address of affogato core
  }
};
