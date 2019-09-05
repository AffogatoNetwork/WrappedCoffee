require("chai").should();
require("chai").expect;
var BN = web3.utils.BN;
require("chai").use(require("chai-bignumber")(BN));

var AffogatoStandardCoffee = artifacts.require("./AffogatoStandardCoffee.sol");

contract(AffogatoStandardCoffee, function(accounts) {
  beforeEach(async () => {
    this.tokenInstance = await AffogatoStandardCoffee.deployed();
  });

  describe("ERC20 Validations", () => {
    before(async () => {});

    it("...should set an owner.", async () => {
      //   var owner = await this.tokenInstance.owner();
      //   owner.should.be.equal(accounts[0]);
    });

    it("...should create a farm", async () => {
      //   const receipt = await this.tokenInstance.addFarm(
      //     web3.utils.utf8ToHex("Los Encinos"),
      //     web3.utils.utf8ToHex("Honduras"),
      //     web3.utils.utf8ToHex("Francisco Morazan"),
      //     web3.utils.utf8ToHex("Santa Lucia"),
      //     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      //     { from: accounts[0] }
      //   );
      //   receipt.logs.length.should.be.equal(1, "trigger one event");
      //   receipt.logs[0].event.should.be.equal(
      //     "LogAddFarm",
      //     "should be the LogAddFarm event"
      //   );
      //   expect(receipt.logs[0].args._id.toNumber()).to.be.equal(
      //     1,
      //     "logs the added farm id"
      //   );
      //   receipt.logs[0].args._ownerAddress.should.be.equal(
      //     accounts[0],
      //     "logs the added owner address"
      //   );
      //   web3.utils
      //     .hexToUtf8(receipt.logs[0].args._name)
      //     .should.be.equal("Los Encinos", "logs the added farm name");
      //   web3.utils
      //     .hexToUtf8(receipt.logs[0].args._country)
      //     .should.be.equal("Honduras", "logs the added farm country");
      //   web3.utils
      //     .hexToUtf8(receipt.logs[0].args._region)
      //     .should.be.equal("Francisco Morazan", "logs the added farm region");
      //   web3.utils
      //     .hexToUtf8(receipt.logs[0].args._village)
      //     .should.be.equal("Santa Lucia", "logs the added farm village");
      //   receipt.logs[0].args._story.should.be.equal(
      //     "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      //     "logs the added farm story"
      //   );
      //   let isException = false;
      //   try {
      //     await this.tokenInstance.addFarm(
      //       web3.utils.utf8ToHex("Los Encinos 2"),
      //       web3.utils.utf8ToHex("Honduras 2"),
      //       web3.utils.utf8ToHex("Francisco Morazan 2"),
      //       web3.utils.utf8ToHex("Santa Lucia 2"),
      //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 2",
      //       { from: accounts[1] }
      //     );
      //   } catch (err) {
      //     isException = true;
      //     assert(err.reason === "not a farmer");
      //   }
      //   isException.should.equal(true, "should rever on not a farmer account");
    });
  });
});
