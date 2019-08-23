pragma solidity ^0.5.0;

import "./IAffogato.sol";

contract Affogato is IAffogato {
    mapping(address => bool) farmers;
    mapping(address => bool) cooperatives;

    function setIsCooperative(address _address, bool isCooperative) external {
        cooperatives[_address] = isCooperative;
    }

    function setIsFarmer(address _address, bool isFarmer) external {
        farmers[_address] = isFarmer;
    }

    function isCooperative(address _cooperative) external view returns (bool) {
        return cooperatives[_cooperative];
    }

    function isFarmer(address _farmer) external view returns (bool) {
        return farmers[_farmer];
    }
}