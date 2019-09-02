pragma solidity ^0.5.9;

import './AffogatoStandardToken.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Holder.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import './IActor.sol';
import "./IERC1155.sol";

contract AffogatoCoffeeHandler is Ownable, ERC721Holder{

    IERC20 public AffogatoStandardToken;
    mapping (uint256 => uint256) public coffeeBatches;
    mapping(address => bool) public isCooperative;
    IERC1155 public wrappedCoffeeToken;

    constructor(IERC1155 _wrappedCoffeeToken) Ownable() public{
        wrappedCoffeeToken = _wrappedCoffeeToken;
    }

    function setNFTTokenContractAddress(IERC1155 _wrappedCoffeeToken) public onlyOwner {
        wrappedCoffeeToken = _wrappedCoffeeToken;
    }
    //First action, set address of contract
    function setERC20TokenContract(IERC20 _ERC20TokenContract) public onlyOwner {
        ERC20TokenContract = _ERC20TokenContract;
    }

    function wrapCoffee(address _from, uint256 _tokenId) public{
       wrappedCoffeeToken.transferFrom(_from, address(this), _tokenId);
       uint256 size = wrappedCoffeeToken.coffeeBatchSize(_tokenId);
       AffogatoStandardToken(ERC20TokenContract).wrapCoffee(_from, size);
    }

    function unwrapCoffee(address _from, uint256 _tokenId, uint256 _amount) public{
       uint256 size = CoffeeBatchNFT(NFTTokenContractAddress).coffeeBatchSize(_tokenId);
       require(size == _amount, "burned tokens must equal to the coffee wanted");
       WrappedCoffeeCoin(ERC20TokenContract).transferFrom(_from, address(this), _amount);
       CoffeeBatchNFT(NFTTokenContractAddress).transferFrom(address(this),_from, _tokenId);
       WrappedCoffeeCoin(ERC20TokenContract).unwrapCoffee(_from, _amount);
    }
}
