pragma solidity ^0.5.9;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './interfaces/IActor.sol';
import "./interfaces/IERC1155.sol";
import "./interfaces/IAffogatoToken.sol";

contract AffogatoCoffeeHandler is Ownable{

    IAffogatoToken public affogatoStandardToken;
    IERC1155 public wrappedCoffeeToken;

    constructor(IERC1155 _wrappedCoffeeToken) Ownable() public{
        wrappedCoffeeToken = _wrappedCoffeeToken;
    }

    function setNFTTokenContractAddress(IERC1155 _wrappedCoffeeToken) public onlyOwner {
        wrappedCoffeeToken = _wrappedCoffeeToken;
    }
    //First action, set address of contract
    function setStandardTokenContract(IAffogatoToken _standardTokenContract) public onlyOwner {
        affogatoStandardToken = _standardTokenContract;
    }

    function wrapCoffee(uint256 _tokenId, uint _amount) external{
       wrappedCoffeeToken.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");
       affogatoStandardToken.wrapCoffee(msg.sender, _amount);
    }

    function unwrapCoffee(uint256 _tokenId, uint256 _amount) external{
       affogatoStandardToken.transferFrom(msg.sender, address(this), _amount);
       wrappedCoffeeToken.safeTransferFrom(address(this),msg.sender, _tokenId, _amount, "");
       affogatoStandardToken.unwrapCoffee(msg.sender, _amount);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}
