pragma solidity ^0.8.0;

contract Bridge {
    address public owner;
    address public targetContract;
    mapping (bytes32 => bool) public processed;
    
    event CrossChainTransfer(
        address indexed fromChain,
        address indexed toChain,
        address indexed toAddress,
        uint256 amount,
        bytes data
    );
    
    constructor(address _targetContract) {
        owner = msg.sender;
        targetContract = _targetContract;
    }
    
    function transferToChainX(address _toAddress, uint256 _amount, bytes calldata _data) external {
        require(msg.sender == owner, "Only owner can call this function");
        
        // Transfer tokens to target contract on Chain C
        require(ERC20(targetContract).transferFrom(msg.sender, address(this), _amount), "TransferFrom failed");
        
        // Emit event on Chain C
        emit CrossChainTransfer(address(this), address(0xCHAIINX), _toAddress, _amount, _data);
    }
    
    function receiveFromChainC(address _toAddress, uint256 _amount, bytes32 _txHash) external {
        require(msg.sender == owner, "Only owner can call this function");
        require(!processed[_txHash], "Transaction already processed");
        
        // Mark transaction as processed
        processed[_txHash] = true;
        
        // Transfer tokens to recipient on Chain X
        require(ERC20(ADDRESS_OF_TOKEN_ON_CHAIN_X).transfer(_toAddress, _amount), "Transfer failed");
    }
}
