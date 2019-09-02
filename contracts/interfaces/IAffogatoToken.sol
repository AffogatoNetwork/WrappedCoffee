pragma solidity ^0.5.9;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract IAffogatoToken is IERC20 {

    /** @notice When the Token holder gets the NFT it creates the ERC20.
      * @param _owner address of the owner of the NFT.
      * @param _amount amount of tokens to create
      */
    function wrapCoffee(address _owner, uint _amount) external;

    /** @notice When the Token holder gets the ERC20 it burns them.
      * @param _owner address of the owner of the NFT.
      * @param _amount amount of tokens to burn
      */
    function unwrapCoffee(address _owner, uint _amount) external;
}
