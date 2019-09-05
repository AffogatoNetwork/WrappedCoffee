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

    it("...should set the token details", async () => {
      let name = await this.tokenInstance.name();
      let symbol = await this.tokenInstance.symbol();
      let decimals = await this.tokenInstance.decimals();
      name.should.be.equal("Affogato Standard Coffee");
      symbol.should.be.equal("ASC");
      decimals.toNumber().should.be.equal(0);
    });

    it("...should validate permissions", async () => {
      let isException = false;
      try {
        await this.tokenInstance.wrapCoffee(accounts[0], 1, {
          from: accounts[0]
        });
      } catch (err) {
        isException = true;
        assert(err.reason === "caller must be holder contract");
      }
      isException.should.equal(true, "should rever on not a holder account");
      isException = false;
      try {
        await this.tokenInstance.unwrapCoffee(accounts[0], 1, {
          from: accounts[0]
        });
      } catch (err) {
        isException = true;
        assert(err.reason === "caller must be holder contract");
      }
      isException.should.equal(true, "should rever on not a holder account");
    });
  });
});
