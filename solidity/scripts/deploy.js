const Web3 = require('web3');
const bridgeAbi = require('./bridge.abi.json');

const web3C = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); // Web3 provider for Chain C
const web3X = new Web3(new Web3.providers.HttpProvider('http://localhost:8546')); // Web3 provider for Chain X

const bridgeContract = new web3C.eth.Contract(bridgeAbi); // Create a new instance of the bridge contract
const targetContractAddress = '0x1234567890123456789012345678901234567890'; // Address of target contract on Chain C
const bridgeOwnerAddress = '0x1234567890123456789012345678901234567891'; // Address of the owner of the bridge contract

// Deploy the bridge contract on Chain C
bridgeContract.deploy({
    data: '0x1234567890', // Compiled bytecode of the bridge contract
    arguments: [targetContractAddress]
})
.send({
    from: bridgeOwnerAddress,
    gas: 5000000
})
.then((newContractInstance) => {
    console.log('Bridge contract deployed at address:', newContractInstance.options.address);

    // Set the address of the deployed contract in the bridge contract instance
    bridgeContract.options.address = newContractInstance.options.address;

    // Add a cross-chain transfer listener for Chain X
    bridgeContract.events.CrossChainTransfer({
        filter: {fromChain: web3C.utils.toChecksumAddress(newContractInstance.options.address), toChain: web3X.utils.toChecksumAddress('0xCHAIINX')},
        fromBlock: 0
    }, (error, event) => {
        if (error) {
            console.error(error);
            return;
        }

        console.log('Received cross-chain transfer event:', event);

        // Invoke the oracle on Chain X to confirm the transaction and transfer tokens to the recipient
        web3X.eth.sendTransaction({
            from: bridgeOwnerAddress,
            to: '0x1234567890123456789012345678901234567892', // Address of the oracle on Chain X
            value: 0,
            gas: 5000000,
            data: bridgeContract.methods.receiveFromChainC(event.returnValues.toAddress, event.returnValues.amount, web3C.utils.keccak256(event.raw)).encodeABI()
        })
        .then((receipt) => {
            console.log('Sent transaction to Chain X to confirm cross-chain transfer:', receipt);
        })
        .catch((error) => {
            console.error(error);
        });
    });
})
.catch((error) => {
    console.error(error);
});
