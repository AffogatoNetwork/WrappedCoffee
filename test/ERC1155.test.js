const ERC1155 = artifacts.require("ERC1155");
const ActorFactory = artifacts.require("ActorFactory");
let catchRevert = require("./exceptionHelpers.js").catchRevert;

const chai = require("chai");
const BN = require("bn.js");
const chaiBN = require("bn-chai");
chai.use(chaiBN(BN));

require("truffle-test-utils").init();

contract("ERC1155", async accounts => {
  describe("create", async () => {
    let erc1155;
    let actorFactory;

    let farmer = accounts[1];
    let cooperative = accounts[2];
    let notCooperative = accounts[3];
    let notFarmer = accounts[4];

    before(async () => {
      this.actorInstance = await ActorFactory.deployed();
      actorFactory = await ActorFactory.new({ from: accounts[0] });
      erc1155 = await ERC1155.new(this.actorInstance.address, {
        from: accounts[0]
      });
      await this.actorInstance.addActor(web3.utils.utf8ToHex("TASTER"), {
        from: notCooperative
      });
      await this.actorInstance.addActor(web3.utils.utf8ToHex("COOPERATIVE"), {
        from: cooperative
      });
      await this.actorInstance.addActor(web3.utils.utf8ToHex("FARMER"), {
        from: farmer
      });
      await this.actorInstance.addActor(web3.utils.utf8ToHex("CERTIFIER"), {
        from: notFarmer
      });
    });

    it("should not allow an address that doesn't belong to a cooperative to mint new tokens", async () => {
      await catchRevert(
        erc1155.create("", farmer, 100, { from: notCooperative })
      );
    });

    it("should not allow recipient to be an address that is not a farmer in actorFactory", async () => {
      await catchRevert(
        erc1155.create("", notFarmer, 100, { from: cooperative })
      );
    });

    it("should not allow to mint 0 tokens", async () => {
      await catchRevert(erc1155.create("", farmer, 0, { from: cooperative }));
    });

    it("should create a token", async () => {
      await erc1155.create.sendTransaction("", farmer, 100, {
        from: cooperative
      });
      const nonce = await erc1155.nonce.call({ from: accounts[0] });
      expect(nonce.eq(new BN(1))).to.be.true;

      // We must make sure the token has not been approved yet
      const approved = await erc1155.creationApprovals.call(
        web3.utils.toBN(1),
        { from: accounts[0] }
      );
      expect(approved).to.be.false;

      // The original beneficiary should be the farmer
      const beneficiary = await erc1155.beneficiaries.call(nonce, {
        from: accounts[0]
      });
      expect(beneficiary).to.be.equal(farmer);
    });

    it("should emit the URI event in case _uri passed is not empty", async () => {
      const myUri = "http://myjson.com/12";
      const tx = await erc1155.create.sendTransaction(myUri, farmer, 100, {
        from: cooperative
      });
      const nonce = await erc1155.nonce.call({ from: accounts[0] });
      assert.web3Event(tx, {
        event: "URI"
      });
    });
  });

  describe("approveTokenCreation", async () => {
    let erc1155;
    let actorFactory;

    let farmer = accounts[1];
    let cooperative = accounts[2];
    let notCooperative = accounts[3];
    let notFarmer = accounts[4];

    before(async () => {
      erc1155 = await ERC1155.new(this.actorInstance.address, {
        from: accounts[0]
      });
    });

    it("shouldn't be possible to use the token without approving it", async () => {
      const supplyAmount = 100;
      await erc1155.create.sendTransaction("", farmer, supplyAmount, {
        from: cooperative
      });
      const nonce = await erc1155.nonce.call({ from: accounts[0] });
      expect(nonce.eq(new BN(1))).to.be.true;

      // We must make sure the token has not been approved yet
      const approved = await erc1155.creationApprovals.call(
        web3.utils.toBN(1),
        { from: accounts[0] }
      );
      expect(approved).to.be.false;

      await catchRevert(
        erc1155.safeTransferFrom(farmer, notFarmer, nonce, supplyAmount, [])
      );
      await erc1155.approveTokenCreation.sendTransaction(nonce, {
        from: farmer
      });
      let balance = await erc1155.balanceOf.call(farmer, nonce);
      expect(balance.eq(new BN(supplyAmount))).to.be.true;
    });

    it("should emit the initial TransferSingle until the token has been approved", async () => {
      const supplyAmount = 100;
      await erc1155.create.sendTransaction("", farmer, supplyAmount, {
        from: cooperative
      });
      const nonce = await erc1155.nonce.call({ from: accounts[0] });

      const tx = await erc1155.approveTokenCreation.sendTransaction(nonce, {
        from: farmer
      });
      assert.web3Event(tx, {
        event: "TransferSingle"
      });
    });
  });

  describe("burn", async () => {
    let erc1155;
    let tokenId;

    const initialSupplyAmount = 100;
    const farmer = accounts[1];
    const cooperative = accounts[2];
    const notCooperative = accounts[3];
    const notFarmer = accounts[4];

    before(async () => {
      erc1155 = await ERC1155.new(this.actorInstance.address, {
        from: accounts[0]
      });

      // Create the token with the farmer as beneficiary
      await erc1155.create.sendTransaction(
        "http://tokenjson.com/mytoken",
        farmer,
        initialSupplyAmount,
        { from: cooperative }
      );
      tokenId = await erc1155.nonce.call({ from: accounts[0] });

      // Approve the token
      await erc1155.approveTokenCreation.sendTransaction(tokenId, {
        from: farmer
      });
    });

    it("should not accept burning 0 tokens", async () => {
      await catchRevert(
        erc1155.burn.sendTransaction(tokenId, 0, farmer, { from: farmer })
      );
    });

    it("should not allow arbitrary address to burn other address' tokens", async () => {
      await catchRevert(
        erc1155.burn.sendTransaction(tokenId, 5, farmer, { from: notFarmer })
      );
    });

    it("should revert in case we try to burn more tokens than we have actually have", async () => {
      await catchRevert(
        erc1155.burn.sendTransaction(tokenId, 105, farmer, { from: farmer })
      );
    });

    it("should burn the tokens", async () => {
      const balance = await erc1155.balanceOf.call(farmer, tokenId, {
        from: farmer
      });
      await erc1155.burn.sendTransaction(tokenId, 10, farmer, { from: farmer });
      const balanceAfterBurn = await erc1155.balanceOf.call(farmer, tokenId, {
        from: farmer
      });
      expect(balance.sub(new BN("10")).eq(balanceAfterBurn)).to.be.true;
    });

    it("should allow an approved address to burn the tokens", async () => {
      const balance = await erc1155.balanceOf.call(farmer, tokenId, {
        from: notFarmer
      });
      await erc1155.setApprovalForAll.sendTransaction(notFarmer, true, {
        from: farmer
      });
      await erc1155.burn.sendTransaction(tokenId, 10, farmer, {
        from: notFarmer
      });
      const balanceAfterBurn = await erc1155.balanceOf.call(farmer, tokenId, {
        from: notFarmer
      });
      expect(balance.sub(new BN("10")).eq(balanceAfterBurn)).to.be.true;
    });
  });

  describe("getTokensWithBalance", async () => {
    let erc1155;

    const initialSupplyAmount = 100;
    const farmer = accounts[1];
    const cooperative = accounts[2];
    const notCooperative = accounts[3];
    const notFarmer = accounts[4];

    before(async () => {
      erc1155 = await ERC1155.new(this.actorInstance.address, {
        from: accounts[0]
      });
      await createNewTokenForFarmer();
      await createNewTokenForFarmer();
    });

    createNewTokenForFarmer = async () => {
      // Create the token with the farmer as beneficiary
      await erc1155.create.sendTransaction(
        "http://tokenjson.com/mytoken",
        farmer,
        initialSupplyAmount,
        { from: cooperative }
      );
      const tokenId = await erc1155.nonce.call({ from: accounts[0] });

      // Approve the token
      await erc1155.approveTokenCreation.sendTransaction(tokenId, {
        from: farmer
      });
    };

    it("should get the ids of the tokens", async () => {
      const ids = await erc1155.getTokensWithBalance.call(farmer, {
        from: farmer
      });
      // expect(ids).to.eql([new BN("1"), new BN("2")]);
      expect(ids.length).to.be.eql(2);
      expect(ids[0].eq(new BN("1"))).to.be.true;
      expect(ids[1].eq(new BN("2"))).to.be.true;
    });
  });
});
