pragma solidity ^0.5.9;

import './AffogatoStandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import './interfaces/IActor.sol';
import "./interfaces/IERC1155.sol";
import "./interfaces/IAffogatoToken.sol";

contract AffogatoCoffeeHandler is Ownable, ERC721Holder{

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

    function wrapCoffee(address _from, uint256 _tokenId, uint _amount) external{
       wrappedCoffeeToken.safeTransferFrom(_from, address(this), _tokenId, _amount, "");
       affogatoStandardToken.wrapCoffee(_from, _amount);
    }

    function unwrapCoffee(address _from, uint256 _tokenId, uint256 _amount) external{
       affogatoStandardToken.unwrapCoffee(_from, _amount);
       affogatoStandardToken.transferFrom(_from, address(this), _amount);
       wrappedCoffeeToken.safeTransferFrom(address(this),_from, _tokenId, _amount, "");
       affogatoStandardToken.unwrapCoffee(_from, _amount);
    }
}
