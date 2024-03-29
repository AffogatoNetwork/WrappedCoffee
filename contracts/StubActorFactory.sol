pragma solidity ^0.5.9;

import "./interfaces/IActor.sol";

contract StubActorFactory is IActor {
    /** @notice Gets the type of the account.
      * @param _owner address of the owner.
      * @return returns a bytes32 with the type of account or empty if there is no account
      */
    function getAccountType(address _owner) external view returns (bytes32) {
        return "FARMER";
    }

    /** @notice Gets the type of the sender account.
      * @return returns a bytes32 with the type of account or empty if there is no account
      */
    function getSenderRole() external view returns (bytes32) {
        return "COOPERATIVE";
    }

    /** @notice checks if an actor exists
      * @param _actorAddress address of actor to check
      * @return true if is exists false if not
      */
    function actorExists(address _actorAddress) external view returns(bool) {
        return true;
    }

    /** @notice Checks if a user has permission from another user.
      * @param _allower address of the allower.
      * @param _allowed address of the actor to check if has permission.
      * @return returns true if _allowed has permission, false otherwise.
      */
    function isAllowed(address _allower, address _allowed) external view returns (bool) {
        return true;
    }

    /** @notice creates a new actor from sender
      * @param _role type of account of the actor.
      */
    function addActor(bytes32 _role) external {
        // NO OP
    }

    /** @notice Cooperative creates new actor
      * @param _role type of account of the actor.
      * @param _actorAddress address of the actor.
      * @dev Only Cooperatives can call this method
      */
    function cooperativeAddActor(
        bytes32 _role,
        address _actorAddress
    ) external {

    }

    /** @notice approves actor
      * @param _allowed address of actor to assign the permission.
      * @param _value value to be set.
      * @return true if is success
      */
    function approve(address _allowed, bool _value) external returns (bool) {
        return true;
    }

    /** @notice approves actor from cooperative
      * @param _allower address of actor to giving the permission.
      * @param _allowed address of actor to assign the permission.
      * @param _value value to be set.
      * @return true if is success
      * @dev Only Cooperatives can call this method
      */
    function cooperativeApprove(address _allower, address _allowed, bool _value) external  returns (bool) {
        return true;
    }

    /** @notice destroys an actor
      * @dev only actor can destroy account
      */
    function destroyActor() external {}

    /** @notice destroys an actor
      * @param _actorAddress address of the actor.
      * @dev Only Cooperatives can call this method
      * @dev only actor can destroy account
      */
    function cooperativeDestroyActor(address _actorAddress) external {}

    /** @notice Returns true if the address passed to it belongs to a cooperative account
      * @param _cooperative The address to be checked
      * @return true if the address passed to the function belongs to a cooperative false otherwise
      */
    function isCooperative(address _cooperative) external view returns (bool) {
        return true;
    }

    /** @notice Returns true if the address passed to it belongs to a farmer account
      * @param _farmer The address to be checked
      * @return true if the address passed to the function belongs to a farmer false otherwise
      */
    function isFarmer(address _farmer) external view returns (bool) {
        return true;
    }

    /** @notice checks if account is a certifier
      * @param _accountAddress address of account to check
      * @return true if is exists false if not
      */
    function isCertifier(address _accountAddress) external view returns (bool) {
        return true;
    }

    /** @notice checks if account is a technician
      * @param _accountAddress address of account to check
      * @return true if is exists false if not
      */
    function isTechnician(address _accountAddress) external view returns (bool) {
        return true;
    }

    /** @notice checks if account is a taster
      * @param _accountAddress address of account to check
      * @return true if is exists false if not
      */
    function isTaster(address _accountAddress) external view returns (bool) {
        return true;
    }

    /** @notice checks if account is a validator
      * @param _accountAddress address of account to check
      * @return true if is exists false if not
      */
    function isValidator(address _accountAddress) external view returns (bool) {
        return true;
    }

    /** @notice checks if account is a benefit
      * @param _accountAddress address of account to check
      * @return true if is exists false if not
      */
    function isBenefit(address _accountAddress) external view returns (bool) {
        return true;
    }

    /** @notice checks if account is a roaster
      * @param _accountAddress address of account to check
      * @return true if is exists false if not
      */
    function isRoaster(address _accountAddress) external view returns (bool) {
        return true;
    }
}