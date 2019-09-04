require("chai").should();
require("chai").expect;
var BN = web3.utils.BN;
require("chai").use(require("chai-bignumber")(BN));

var AffogatoStandardCoffee = artifacts.require("./AffogatoStandardCoffee.sol");
var AffogatoCoffeeHandler = artifacts.require("./AffogatoCoffeeHandler.sol");
var ERC1155 = artifacts.require("./ERC1155.sol");
var ActorFactory = artifacts.require("ActorFactory");

contract(AffogatoStandardCoffee, function(accounts) {
  beforeEach(async () => {
    this.standardCoffeeInstance = await AffogatoStandardCoffee.deployed();
    this.nftInstance = await ERC1155.deployed();
    this.handlerInstance = await AffogatoCoffeeHandler.deployed();
    this.actorInstance = await ActorFactory.deployed();
  });

  describe("Handler Validations", () => {
    before(async () => {
      this.nftInstance = await ERC1155.deployed();
      this.handlerInstance = await AffogatoCoffeeHandler.deployed();
      this.actorInstance = await ActorFactory.deployed();
      this.standardCoffeeInstance = await AffogatoStandardCoffee.deployed();
      await this.actorInstance.addActor(web3.utils.utf8ToHex("COOPERATIVE"), {
        from: accounts[2]
      });
      await this.actorInstance.addActor(web3.utils.utf8ToHex("FARMER"), {
        from: accounts[1]
      });
      await this.nftInstance.create("", accounts[1], 100, {
        from: accounts[2]
      });
      await this.nftInstance.approveTokenCreation(1, {
        from: accounts[1]
      });
      await this.nftInstance.setApprovalForAll(
        this.handlerInstance.address,
        true,
        {
          from: accounts[1]
        }
      );
      await this.standardCoffeeInstance.approve(
        this.handlerInstance.address,
        100,
        { from: accounts[1] }
      );
    });

    it("...should set an owner.", async () => {
      var owner = await this.handlerInstance.owner();
      owner.should.be.equal(accounts[0]);
    });

    it("...should set the Token Contracts", async () => {
      let receipt = await this.handlerInstance.setNFTTokenContractAddress(
        this.nftInstance.address,
        {
          from: accounts[0]
        }
      );
      receipt.logs.length.should.be.equal(1, "trigger one event");
      receipt.logs[0].event.should.be.equal(
        "LogSetNFTTokenContractAddress",
        "should be the LogSetNFTTokenContractAddress event"
      );
      expect(receipt.logs[0].args._wrappedCoffeeToken).to.be.equal(
        this.nftInstance.address,
        "logs the set contract address"
      );

      receipt = await this.handlerInstance.setASCAddress(
        this.standardCoffeeInstance.address,
        {
          from: accounts[0]
        }
      );
      receipt.logs.length.should.be.equal(1, "trigger one event");
      receipt.logs[0].event.should.be.equal(
        "LogSetASCAddress",
        "should be the LogSetASCAddress event"
      );
      expect(receipt.logs[0].args._standardCoffeeContract).to.be.equal(
        this.standardCoffeeInstance.address,
        "logs the set contract address"
      );

      let isException = false;
      try {
        await this.handlerInstance.setNFTTokenContractAddress(accounts[1], {
          from: accounts[1]
        });
      } catch (err) {
        isException = true;
        assert(err.reason === "Ownable: caller is not the owner");
      }
      isException.should.equal(true, "should rever on not the owner account");

      isException = false;
      try {
        await this.handlerInstance.setASCAddress(accounts[1], {
          from: accounts[1]
        });
      } catch (err) {
        isException = true;
        assert(err.reason === "Ownable: caller is not the owner");
      }
      isException.should.equal(true, "should rever on not the owner account");
    });

    it("...should wrap coffee", async () => {
      let userNFTBalance = await this.nftInstance.balanceOf(accounts[1], 1);
      userNFTBalance.toNumber().should.be.equal(100, "Initial balance is 100");
      let receipt = await this.handlerInstance.wrapCoffee(1, 100, {
        from: accounts[1]
      });
      receipt.logs.length.should.be.equal(1, "trigger one event");
      receipt.logs[0].event.should.be.equal(
        "LogWrapCoffee",
        "should be the LogWrapCoffee event"
      );
      expect(receipt.logs[0].args._tokenId.toNumber()).to.be.equal(
        1,
        "logs the token id"
      );
      expect(receipt.logs[0].args._amount.toNumber()).to.be.equal(
        100,
        "logs the token amount"
      );
      expect(receipt.logs[0].args._tokenOwner).to.be.equal(
        accounts[1],
        "logs the sender address"
      );
      let contractNFTBalance = await this.nftInstance.balanceOf(
        this.handlerInstance.address,
        1
      );
      contractNFTBalance
        .toNumber()
        .should.be.equal(100, "contract balance should be 100");
      userNFTBalance = await this.nftInstance.balanceOf(accounts[1], 1);
      userNFTBalance.toNumber().should.be.equal(0, "new balance should be 0");
      let userStandardBalance = await this.standardCoffeeInstance.balanceOf(
        accounts[1]
      );
      userStandardBalance
        .toNumber()
        .should.be.equal(100, "new balance should be 100");
    });

    it("...should unwrap coffee", async () => {
      let receipt = await this.handlerInstance.unwrapCoffee(1, 10, {
        from: accounts[1]
      });
      receipt.logs.length.should.be.equal(1, "trigger one event");
      receipt.logs[0].event.should.be.equal(
        "LogUnWrapCoffee",
        "should be the LogUnWrapCoffee event"
      );
      expect(receipt.logs[0].args._tokenId.toNumber()).to.be.equal(
        1,
        "logs the token id"
      );
      expect(receipt.logs[0].args._amount.toNumber()).to.be.equal(
        10,
        "logs the token amount"
      );
      expect(receipt.logs[0].args._tokenOwner).to.be.equal(
        accounts[1],
        "logs the sender address"
      );
      let contractNFTBalance = await this.nftInstance.balanceOf(
        this.handlerInstance.address,
        1
      );
      contractNFTBalance
        .toNumber()
        .should.be.equal(90, "contract balance should be 90");
      let userNFTBalance = await this.nftInstance.balanceOf(accounts[1], 1);
      userNFTBalance.toNumber().should.be.equal(10, "new balance should be 10");
      let userStandardBalance = await this.standardCoffeeInstance.balanceOf(
        accounts[1]
      );
      userStandardBalance
        .toNumber()
        .should.be.equal(90, "new balance should be 90");

      isException = false;
      try {
        await this.handlerInstance.unwrapCoffee(1, 10, {
          from: accounts[2]
        });
      } catch (err) {
        isException = true;
        assert(err.reason === "Only owner of token can retrieve it");
      }
      isException.should.equal(
        true,
        "should rever on not the owner of the token"
      );
    });
  });
});
