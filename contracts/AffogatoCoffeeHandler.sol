pragma solidity ^0.5.9;

/** @title Affogato Coffee Handler
  * @notice Coffee Handler Scrow that retains ERC1155 fungible tokens and gives ERC20 tokens as a loan
  * @author Affogato
  */

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './interfaces/IActor.sol';
import "./interfaces/IERC1155.sol";
import "./interfaces/IAffogatoToken.sol";

contract AffogatoCoffeeHandler is Ownable{

     using SafeMath for uint256;

    /** @notice Logs when the NFT token contract is set. */
    event LogSetNFTTokenContractAddress(
        address _wrappedCoffeeToken
    );

    /** @notice Logs when the ERC20 token contract is set. */
    event LogSetASCAddress(
        address _standardCoffeeContract
    );

    /** @notice Logs when coffee is wrapped. */
    event LogWrapCoffee(
        address _tokenOwner,
        uint _tokenId,
        uint _amount
    );

    /** @notice Logs when coffee is unwrapped. */
    event LogUnwrapCoffee(
        address _tokenOwner,
        uint _tokenId,
        uint _amount
    );

    IAffogatoToken public affogatoStandardCoffee;
    IERC1155 public wrappedCoffeeToken;
    mapping (address => mapping (uint => uint)) public ownerToLoan; //TODO: Security issues, it has to be double mapping

    constructor(IERC1155 _wrappedCoffeeToken) Ownable() public{
        wrappedCoffeeToken = _wrappedCoffeeToken;
    }

    function getTokenLoan(uint _tokenId, address _owner) public view returns (uint) {
        return   ownerToLoan[_owner][_tokenId];
    }

    function setNFTTokenContractAddress(IERC1155 _wrappedCoffeeToken) public onlyOwner {
        wrappedCoffeeToken = _wrappedCoffeeToken;
        emit LogSetNFTTokenContractAddress(address(_wrappedCoffeeToken));
    }

    function setASCAddress(IAffogatoToken _standardCoffeeContract) public onlyOwner {
        affogatoStandardCoffee = _standardCoffeeContract;
        emit LogSetASCAddress(address(_standardCoffeeContract));
    }

    function wrapCoffee(uint256 _tokenId, uint _amount) external{
       wrappedCoffeeToken.safeTransferFrom(msg.sender, address(this), _tokenId, _amount, "");
       affogatoStandardCoffee.wrapCoffee(msg.sender, _amount);
       ownerToLoan[msg.sender][_tokenId] = ownerToLoan[msg.sender][_tokenId].add(_amount);
       emit LogWrapCoffee(msg.sender, _tokenId, _amount);
    }

    function unwrapCoffee(uint256 _tokenId, uint256 _amount) external{
       require(ownerToLoan[msg.sender][_tokenId] >= _amount, "Only owner of token can retrieve it");
         ownerToLoan[msg.sender][_tokenId] = ownerToLoan[msg.sender][_tokenId].sub(_amount);
       affogatoStandardCoffee.transferFrom(msg.sender, address(this), _amount);
       wrappedCoffeeToken.safeTransferFrom(address(this),msg.sender, _tokenId, _amount, "");
       affogatoStandardCoffee.unwrapCoffee(address(this), _amount);
       emit LogUnwrapCoffee(msg.sender, _tokenId, _amount);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}
