const affogato = artifacts.require("Affogato");
const erc1155 = artifacts.require("ERC1155");

module.exports = (deployer) => {
    deployer.deploy(affogato)
        .then(() => affogato.deployed())
        .then(() => deployer.deploy(erc1155, affogato.address));
}