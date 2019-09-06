pragma solidity ^0.5.9;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IAffogatoToken.sol";

contract AffogatoStandardCoffee is ERC20, ERC20Detailed, IAffogatoToken {

    address public CoffeeHandlerAddress;

    modifier onlyCoffeeHolder(){
        require(msg.sender == CoffeeHandlerAddress, "caller must be holder contract");
        _;
    }

    constructor(address _CoffeeHandlerAddress)  ERC20Detailed("Affogato Standard Coffee", "ASC", 0) public {
        CoffeeHandlerAddress = _CoffeeHandlerAddress;
    }

    function wrapCoffee(address _owner, uint _amount) external onlyCoffeeHolder {
        _mint(_owner, _amount);
    }

    function unwrapCoffee(address _owner, uint _amount) external onlyCoffeeHolder {
         _burn(_owner, _amount);
    }
}