import _ from 'lodash'
import config from 'config/bridge.json'
import bridgeAbi from "config/abi/bridgeAbi"
import web3 from 'utils/api/ethApi'
import {ethers} from "ethers"

const {ethAddresses} = config

const init = async ({contracts, signer}) => {
    console.log('init ETH bridge')

    if (_.isNil(signer)) {
        return console.error('init bridge failed - account.signer is null')
    }

    const newContracts = await Promise.all(_.map(ethAddresses, async a => await new ethers.Contract(a, bridgeAbi, signer)))

    _.forEach(newContracts, bridgeContract => {
        bridgeContract.on('Refund', (id, recipient, amount, reason, event) => {
            console.log('--------------------------------------')
            console.log('Bridge.Refund event', JSON.stringify({id, recipient, amount, reason, event}, null, 2))
            console.log('--------------------------------------')
        })
        bridgeContract.on('Failure', (reason, event) => {
            console.log('--------------------------------------')
            console.log('Bridge.Failure event', JSON.stringify({reason, event}, null, 2))
            console.log('--------------------------------------')
        })
        bridgeContract.on('Receipt', (recipient, amount, reason, event) => {
            console.log('--------------------------------------')
            console.log('Bridge.Receipt event', JSON.stringify({recipient, amount, reason, event}, null, 2))
            console.log('--------------------------------------')
        })
    })

    return {
        contracts: {
            ...contracts,
            ..._.zipObject(_.keys(ethAddresses), newContracts)
        }
    }
}

const sendToken = ({contracts}, amount, {depositContracts, ethTokenId}) => {
    const contract = _.get(contracts, depositContracts.EOS)
    contract.sendToken(amount, ethTokenId)
};

const approveAndSendToken = (account, sendAmount, token, infiniteApproval) => {
    console.log("inside approve and send token");

    const {contracts} = account
    const {symbol, depositContracts, toWeiUnit} = token

    const contract = _.get(contracts, symbol)

    let approveAmount
    if (infiniteApproval) {
        approveAmount = web3.utils.toWei("10000000000000000", toWeiUnit)
        // approveAmount = symbol === "USDC"
        //     ? web3.utils.toWei("10000000000000000", "mwei")
        //     : web3.utils.toWei("10000000000000000", "ether");
    } else {
        approveAmount = sendAmount;
    }

    console.log("approved amount ", approveAmount);

    const filter = contract.filters.Approval(account.address, depositContracts.ETH)
    contract.on(filter, (owner, spender, amount, event) => {
        console.log('--------------------------------------')
        console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
        console.log(`EVENT ${JSON.stringify(event)}`)
        console.log('--------------------------------------')
        sendToken(account, sendAmount, token)
    });

    contract.approve(depositContracts.ETH, approveAmount)
};

const transfer = async (account, amount, token, infiniteApproval) => {
    const {symbol, precision, depositContracts, toWeiUnit} = token

    const contract = _.get(account, ['contracts', symbol])
    if (!contract) {
        return console.error(`Contract not initialized: ${symbol} ERC20`)
    }

    let sendAmount
    switch (token.symbol) {
        case 'USDC':
        case 'DAI':
            sendAmount = web3.utils.toWei(amount, toWeiUnit)
            break
        default:
            sendAmount = Math.floor(amount * Math.pow(10, precision))
    }

    console.log("sendAmount ", sendAmount);

    const approvedAmount = await contract.allowance(account.address, depositContracts.ETH)

    const appAmount = parseFloat(ethers.utils.formatUnits(approvedAmount, token.precision))
    console.log("approvedAmount in contract ", appAmount);

    return appAmount >= amount ? sendToken(account, sendAmount, token) : approveAndSendToken(account, sendAmount, token, infiniteApproval)
}

const awaitDeposit = (account, token, onComplete) => {
    const {symbol, depositContracts} = token
    const contract = _.get(account, ['contracts', symbol])

    if (!contract) {
        return console.error(`Contract not initialized: ${symbol} ERC20`)
    }

    console.log(`awaitDeposit on ETH from ${account.address} to ${depositContracts.ETH}`)

    const filter = contract.filters.Transfer(account.address, depositContracts.ETH)
    contract.on(filter, (from, to, amount, event) => {
        console.log('--------------------------------------')
        console.log(`User sent ${ ethers.utils.formatEther(amount) } to ${ to }.`);
        console.log(`EVENT ${JSON.stringify(event)}`)
        console.log('--------------------------------------')

        onComplete({
            deposited: true,
            depositTxId: event.transactionHash
        })
    });
}

const awaitReceived = async (account, fromAccount, token, onComplete) => {
    const {symbol} = token
    const contract = _.get(account, ['contracts', symbol])

    if (!contract) {
        return console.error(`Contract not initialized: ${symbol} ERC20`)
    }

    console.log(`awaitReceived on ETH to ${account.address}`)

    const filter = contract.filters.Transfer(null, account.address)
    contract.on(filter, (from, to, amount, event) => {
        console.log('--------------------------------------')
        console.log(`User received ${ ethers.utils.formatEther(amount) } from ${ from }.`);
        console.log(`EVENT ${JSON.stringify(event)}`)
        console.log('--------------------------------------')

        onComplete({
            received: true,
            receivedTxId: event.transactionHash
        })
    });
}

export default {
    init,
    fetchTransferFee: () => '',

    transfer,
    awaitDeposit,
    awaitReceived,
}