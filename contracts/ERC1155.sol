pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./Address.sol";
import "./Common.sol";
import "./IERC1155TokenReceiver.sol";
import "./IERC1155.sol";
import "./IActor.sol";

// A sample implementation of core ERC1155 function.
contract ERC1155 is IERC1155, ERC165, CommonConstants, Ownable
{
    using SafeMath for uint256;
    using Address for address;

    /// @notice An event emmited when tokens are burned in order to recover coffee from the cooperative.
    event BurnSingle(address indexed _operator, address indexed _from, uint256 _id, uint256 _value);

    /// @notice The contract which can be queried to know the type of address
    /// @dev We need to make sure some of the functions are only called by cooperatives or farmers
    IActor private actorFactory;

    /// @notice The balances of the tokens
    // id => (owner => balance)
    mapping (uint256 => mapping(address => uint256)) internal balances;

    /// @notice The permissions an owner has granted to a set of operators to manage their tokens
    // owner => (operator => approved)
    mapping (address => mapping(address => bool)) internal operatorApproval;

    bytes4 constant private INTERFACE_SIGNATURE_URI = 0x0e89341c;

    /// @dev The original creators of the token (Should contain only addresses that belong to cooperatives)
    // id => creators
    mapping (uint256 => address) public creators;

    /// @notice The state of the approval for the token creation. Until it's approved by the farmer the token cannot be queried or transfered
    // id => approved
    mapping (uint256 => bool) public creationApprovals;

    /// @notice The original beneficiary at the token creation.
    // id => farmer's address
    mapping (uint256 => address) public beneficiaries;

    /// @notice The uris pointing to the JSON describing the token
    // id => URI
    mapping (uint256 => string) public uris;

    // A nonce to ensure we have a unique id each time we mint.
    uint256 public nonce;

    constructor(IActor _actorFactoryAddress)  public {
        actorFactory = IActor(_actorFactoryAddress);
    }

    modifier creatorOnly(uint256 _id) {
        require(creators[_id] == msg.sender, "Only the creator of the Token can execute this");
        _;
    }

    modifier beneficiaryOnly(uint256 _id) {
        require(msg.sender == beneficiaries[_id], "Only the owner original beneficiary can execute this");
        _;
    }

    modifier onlyIfTokenCreationApproved(uint256 _id) {
        require(creationApprovals[_id] == true, "Token yet to be approved");
        _;
    }

    modifier onlyIfTokensCreationApproved(uint256[] memory _ids) {
        bool allApproved = true;
        for (uint256 i = 0; i < _ids.length; i++) {
            bool approved = creationApprovals[_ids[i]];
            allApproved = allApproved && approved;
            if (!approved) break;
        }

        require(allApproved, "Some of the tokens have not been approved for creation");
        _;
    }

    /** @notice Sets the address of the ActorFactory
      * @param _actorFactoryAddress address of the IActor
      * @dev Only Owner can set the ActorFactory contract, it helps when the Actor Factory migrates
      */

    function setIActorAddress(IActor _actorFactoryAddress) public onlyOwner{
        actorFactory = IActor(_actorFactoryAddress);
    }

    /**
        @notice Creates the new token for the address in _recipient to approve it. The token cannot be used it until it's approved.
        @param _initialSupply The amount of tokens to mint for this new type
        @param _uri The URI pointing to the JSON (it must conforms to the "ERC-1155 Metadata URI JSON Schema".)
        @return The id of the newly created token
    */
    function create(string calldata _uri, address _recipient, uint256 _initialSupply) external returns(uint256 _id) {
        require(actorFactory.isCooperative(msg.sender), "Only a cooperative can mint new tokens");
        require(actorFactory.isFarmer(_recipient), "Recipient must be a farmer");
        require(_initialSupply > 0, "Cannot mint 0 tokens");
        // require(_recipient != address(0x0), "_recipient cannot be address 0x0");
        _id = ++nonce;
        balances[_id][_recipient] = _initialSupply;
        beneficiaries[_id] = _recipient;
        creators[_id] = msg.sender;
        creationApprovals[_id] = false;

        if (bytes(_uri).length > 0) {
            uris[_id] = _uri;
            emit URI(_uri, _id);
        }
    }

    /**
        @notice Recieves an amount of tokens of a given type to be burned. A token that is burned becomes unusable and
        it means the sender will receive coffee in return.
        @dev The balance of the _from address must be equal or greater than the amount specified and the _id must belong to a previously created token (approved creation).
        @param _id The id of the token to be burned.
        @param _amount The amount of tokens to be burned.
        @param _from The address from which the tokens will be burned
     */
    function burn(uint256 _id, uint256 _amount, address _from) external onlyIfTokenCreationApproved(_id) {
        require(_amount > 0, "You can't burn 0 tokens");
        require(msg.sender == _from || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        balances[_id][_from] = balances[_id][_from].sub(_amount);

        emit BurnSingle(msg.sender, _from, _id, _amount);
    }

    /**
        @notice Approves a previously created token to be used. The only user allowed to approve the token creation is the original coffe owner.
        @param _id The id of the token to be approved
     */
    function approveTokenCreation(uint256 _id) external beneficiaryOnly(_id) {
        require(!creationApprovals[_id], "Token is already approved");
        // Transfer event with mint semantic
        creationApprovals[_id] = true;
        emit TransferSingle(msg.sender, address(0x0), msg.sender, _id, balances[_id][msg.sender]);
    }

    function setURI(string calldata _uri, uint256 _id) external creatorOnly(_id) {
        require(bytes(_uri).length > 0, "Cannot use an empty URI for the token description");
        uris[_id] = _uri;
        emit URI(_uri, _id);
    }

    /**
        @notice Returns an array containing all the ids of the tokens this address has a positive balance.
        This is intended to be used to show al the tokens available for this address at once without maintaining the ids stored somewhere else.
        @dev Looking for better ways to do this, it can change in the future.
        @param _address The address to get the tokens
        @return An array containing the ids of the tokens
     */
    function getTokensWithBalance(address _address) external view returns(uint256[] memory) {
        uint256[] memory allTokens = new uint256[](nonce);
        uint256 tokenCount = 0;

        for (uint256 i = 0; i <= nonce; i++) {
            if (balances[i][_address] > 0 && creationApprovals[i]) {
                allTokens[tokenCount++] = i;
            }
        }

        uint256[] memory tokenIds = new uint256[](tokenCount);
        for (uint i = 0; i < tokenCount; i++) {
            tokenIds[i] = allTokens[i];
        }

        return tokenIds;
    }

    function getActorFactoryAddress() public view returns(address){
        return address(actorFactory);
     }
/////////////////////////////////////////// ERC165 //////////////////////////////////////////////

    /*
        bytes4(keccak256('supportsInterface(bytes4)'));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC165 = 0x01ffc9a7;

    /*
        bytes4(keccak256("safeTransferFrom(address,address,uint256,uint256,bytes)")) ^
        bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)")) ^
        bytes4(keccak256("balanceOf(address,uint256)")) ^
        bytes4(keccak256("balanceOfBatch(address[],uint256[])")) ^
        bytes4(keccak256("setApprovalForAll(address,bool)")) ^
        bytes4(keccak256("isApprovedForAll(address,address)"));
    */
    bytes4 constant private INTERFACE_SIGNATURE_ERC1155 = 0xd9b67a26;

    function supportsInterface(bytes4 _interfaceId)
    public
    view
    returns (bool) {
        if (_interfaceId == INTERFACE_SIGNATURE_URI) {
            return true;
        }

        if (_interfaceId == INTERFACE_SIGNATURE_ERC165 ||
             _interfaceId == INTERFACE_SIGNATURE_ERC1155) {
            return true;
        }

        return false;
    }

/////////////////////////////////////////// ERC1155 //////////////////////////////////////////////

    /**
        @notice Transfers `_value` amount of an `_id` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if balance of holder for token `_id` is lower than the `_value` sent.
        MUST revert on any other error.
        MUST emit the `TransferSingle` event to reflect the balance change (see "Safe Transfer Rules" section of the standard).
        After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from    Source address
        @param _to      Target address
        @param _id      ID of the token type
        @param _value   Transfer amount
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`
    */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external onlyIfTokenCreationApproved(_id) {

        require(_to != address(0x0), "_to must be non-zero.");
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        // SafeMath will throw with insuficient funds _from
        // or if _id is not valid (balance will be 0)
        balances[_id][_from] = balances[_id][_from].sub(_value);
        balances[_id][_to] = _value.add(balances[_id][_to]);

        // MUST emit event
        emit TransferSingle(msg.sender, _from, _to, _id, _value);

        // Now that the balance is updated and the event was emitted,
        // call onERC1155Received if the destination is a contract.
        if (_to.isContract()) {
            _doSafeTransferAcceptanceCheck(msg.sender, _from, _to, _id, _value, _data);
        }
    }

    /**
        @notice Transfers `_values` amount(s) of `_ids` from the `_from` address to the `_to` address specified (with safety call).
        @dev Caller must be approved to manage the tokens being transferred out of the `_from` account (see "Approval" section of the standard).
        MUST revert if `_to` is the zero address.
        MUST revert if length of `_ids` is not the same as length of `_values`.
        MUST revert if any of the balance(s) of the holder(s) for token(s) in `_ids` is lower than the respective amount(s) in `_values` sent to the recipient.
        MUST revert on any other error.
        MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see "Safe Transfer Rules" section of the standard).
        Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc).
        After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size > 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `_to` and act appropriately (see "Safe Transfer Rules" section of the standard).
        @param _from    Source address
        @param _to      Target address
        @param _ids     IDs of each token type (order and length must match _values array)
        @param _values  Transfer amounts per token type (order and length must match _ids array)
        @param _data    Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`
    */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data) external onlyIfTokensCreationApproved(_ids) {

        // MUST Throw on errors
        require(_to != address(0x0), "destination address must be non-zero.");
        require(_ids.length == _values.length, "_ids and _values array lenght must match.");
        require(_from == msg.sender || operatorApproval[_from][msg.sender] == true, "Need operator approval for 3rd party transfers.");

        for (uint256 i = 0; i < _ids.length; ++i) {
            uint256 value = _values[i];

            // SafeMath will throw with insuficient funds _from
            // or if _id is not valid (balance will be 0)
            balances[_ids[i]][_from] = balances[_ids[i]][_from].sub(value);
            balances[_ids[i]][_to] = value.add(balances[_ids[i]][_to]);
        }

        // Note: instead of the below batch versions of event and acceptance check you MAY have emitted a TransferSingle
        // event and a subsequent call to _doSafeTransferAcceptanceCheck in above loop for each balance change instead.
        // Or emitted a TransferSingle event for each in the loop and then the single _doSafeBatchTransferAcceptanceCheck below.
        // However it is implemented the balance changes and events MUST match when a check (i.e. calling an external contract) is done.

        // MUST emit event
        emit TransferBatch(msg.sender, _from, _to, _ids, _values);

        // Now that the balances are updated and the events are emitted,
        // call onERC1155BatchReceived if the destination is a contract.
        if (_to.isContract()) {
            _doSafeBatchTransferAcceptanceCheck(msg.sender, _from, _to, _ids, _values, _data);
        }
    }

    /**
        @notice Get the balance of an account's Tokens.
        @param _owner  The address of the token holder
        @param _id     ID of the Token
        @return        The _owner's balance of the Token type requested
     */
    function balanceOf(address _owner, uint256 _id) external view onlyIfTokenCreationApproved(_id) returns (uint256) {
        // The balance of any account can be calculated from the Transfer events history.
        // However, since we need to keep the balances to validate transfer request,
        // there is no extra cost to also privide a querry function.
        return balances[_id][_owner];
    }


    /**
        @notice Get the balance of multiple account/token pairs
        @param _owners The addresses of the token holders
        @param _ids    ID of the Tokens
        @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
     */
    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids)
    external view onlyIfTokensCreationApproved(_ids) returns (uint256[] memory) {
        require(_owners.length == _ids.length, "The _ids array must match in length the array of owners");
        uint256[] memory balances_ = new uint256[](_owners.length);
        for (uint256 i = 0; i < _owners.length; ++i) {
            balances_[i] = balances[_ids[i]][_owners[i]];
        }
        return balances_;
    }

    /**
        @notice Enable or disable approval for a third party ("operator") to manage all of the caller's tokens.
        @dev MUST emit the ApprovalForAll event on success.
        @param _operator  Address to add to the set of authorized operators
        @param _approved  True if the operator is approved, false to revoke approval
    */
    function setApprovalForAll(address _operator, bool _approved) external {
        operatorApproval[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    /**
        @notice Queries the approval status of an operator for a given owner.
        @param _owner     The owner of the Tokens
        @param _operator  Address of authorized operator
        @return           True if the operator is approved, false if not
    */
    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return operatorApproval[_owner][_operator];
    }

/////////////////////////////////////////// Internal //////////////////////////////////////////////

    function _doSafeTransferAcceptanceCheck(
        address _operator,
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes memory _data
    ) internal {
        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.
        // Note: if the below reverts in the onERC1155Received function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155Received(
            _operator,
            _from,
            _id,
            _value,
            _data
        ) == ERC1155_ACCEPTED, "contract returned an unknown value from onERC1155Received");
    }

    function _doSafeBatchTransferAcceptanceCheck(
        address _operator,
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _values,
        bytes memory _data
    ) internal {
        // If this was a hybrid standards solution you would have to check ERC165(_to).supportsInterface(0x4e2312e0) here but as this is a pure implementation of an ERC-1155 token set as recommended by
        // the standard, it is not necessary. The below should revert in all failure cases i.e. _to isn't a receiver, or it is and either returns an unknown value or it reverts in the call to indicate non-acceptance.
        // Note: if the below reverts in the onERC1155BatchReceived function of the _to address you will have an undefined revert reason returned rather than the one in the require test.
        // If you want predictable revert reasons consider using low level _to.call() style instead so the revert does not bubble up and you can revert yourself on the ERC1155_BATCH_ACCEPTED test.
        require(ERC1155TokenReceiver(_to).onERC1155BatchReceived(
            _operator,
            _from,
            _ids,
            _values,
            _data
        ) == ERC1155_BATCH_ACCEPTED, "contract returned an unknown value from onERC1155BatchReceived");
    }
}
