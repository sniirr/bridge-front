export default [{
    "anonymous": false,
    "inputs": [{
        "indexed": false,
        "internalType": "bytes",
        "name": "reason",
        "type": "bytes"
    }],
    "name": "Failure",
    "type": "event"
},
    {
        "anonymous": false,
        "inputs": [{
            "indexed": false,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
        },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "reason",
                "type": "bytes"
            }
        ],
        "name": "Receipt",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
            "indexed": false,
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        },
            {
                "indexed": false,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "reason",
                "type": "bytes"
            }
        ],
        "name": "Refund",
        "type": "event"
    },
    {
        "inputs": [{
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        },
            {
                "internalType": "bytes",
                "name": "_message",
                "type": "bytes"
            }
        ],
        "name": "pushInboundMessage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive",
        "payable": true
    },
    {
        "inputs": [{
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
        },
            {
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "sendToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimGas",
        "outputs": [{
            "internalType": "bool",
            "name": "",
            "type": "bool"
        }],
        "stateMutability": "payable",
        "type": "function",
        "payable": true
    }
]