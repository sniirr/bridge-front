import _ from 'lodash'
import config from 'config/bridge.json'
import bridgeAbi from "config/abi/bridgeAbi"
import web3 from 'utils/api/ethApi'
import tokenAbi from "config/abi/tokenAbi"
// import TOKENS from "config/tokens.json"

import {ethers} from "ethers"

// const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const {ethAddresses} = config


// const sendToken = async (account, amount, {ethTokenId}) => {
//
//     const bridgeContract = new ethers.Contract(bridgeEthAddress, bridgeAbi, account.provider)
//
//     const contract = await bridgeContract.connect(account.signer)
//
//     const tx = await contract.sendToken(amount, ethTokenId)
//
//     console.log('sendToken tx', tx)
//     return tx
// };

// const init = ({contracts, signer}) => async (dispatch, getState) => {
const init = async ({contracts, signer}) => {
    // const state = getState()
    //
    // const {contracts, signer} = _.get(state, 'dappcore.accounts.ETH', {})

    console.log('init ETH bridge')

    if (_.isNil(signer)) {
        return console.error('init bridge failed - account.signer is null')
    }

    // const bridgeContract = await new ethers.Contract(bridgeEthAddress, bridgeAbi, signer)

    const newContracts = await Promise.all(_.map(ethAddresses, async a => await new ethers.Contract(a, bridgeAbi, signer)))

    _.forEach(newContracts, bridgeContract => {
        bridgeContract.on('Refund', (id, recipient, amount, reason, event) => {
            console.log('Bridge.Refund event', JSON.stringify({id, recipient, amount, reason, event}, null, 2))
            console.log('--------------------------------------')
        })
        bridgeContract.on('Failure', (reason, event) => {
            console.log('Bridge.Failure event', JSON.stringify({reason, event}, null, 2))
            console.log('--------------------------------------')
        })
        bridgeContract.on('Receipt', (recipient, amount, reason, event) => {
            console.log('Bridge.Receipt event', JSON.stringify({recipient, amount, reason, event}, null, 2))
            console.log('--------------------------------------')
        })

    })

    return {
        contracts: {
            ...contracts,
            ..._.zipObject(_.keys(ethAddresses), newContracts)
            // bridge: bridgeContract
        }
    }

    // dispatch({
    //     type: 'DAPPCORE.UPDATE_CHAIN',
    //     payload: {
    //         contracts: {
    //             ...contracts,
    //             bridge: bridgeContract,
    //         }
    //     }
    // })
}

const sendToken = ({contracts}, amount, {depositContracts, ethTokenId}) => {

    // const bridgeContract = new ethers.Contract(bridgeEthAddress, bridgeAbi, account.provider)
    //
    // const contract = await bridgeContract.connect(account.signer)
    const contract = _.get(contracts, depositContracts.EOS)

    contract.sendToken(amount, ethTokenId)
    // const tx = await contract.sendToken(amount, ethTokenId)
    //
    // console.log('sendToken tx', tx)
    // return tx
};

const approveAndSendToken = (account, sendAmount, token, infiniteApproval) => {
    console.log("inside approve and send token");

    const {contracts} = account
    const {symbol, depositContracts} = token

    // const usdcContract = new ethers.Contract(TOKENS.USDC.addresses.ETH, tokenAbi, account.provider)
    //
    // const contract = await usdcContract.connect(account.signer)
    const contract = _.get(contracts, symbol)

    // const contract = usdcContract;
    // const contract = token === "USDC" ? usdcContract : daiContract;
    // const approveAmount = stakeAMount
    // const approveAmount = web3.utils.toWei("10000000000000000", "mwei")
    let approveAmount
    if (infiniteApproval) {
        approveAmount = web3.utils.toWei("10000000000000000", "kwei")
        // approveAmount = Math.floor(10000000000000000 * Math.pow(10, precision))
        // approveAmount = symbol === "USDC"
        //     ? web3.utils.toWei("10000000000000000", "mwei")
        //     : web3.utils.toWei("10000000000000000", "ether");
    } else {
        approveAmount = sendAmount;
    }

    console.log("approved amount ", approveAmount);

    const filter = contract.filters.Approval(account.address, depositContracts.ETH)
    contract.on(filter, (owner, spender, amount, event) => {
        // The to will always be "address"

        console.log('--------------------------------------')
        console.log('--------------------------------------')
        console.log('approveAndSendToken EVENT TRIGGERED')
        console.log('--------------------------------------')
        console.log('--------------------------------------')
        console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
        console.log(`EVENT ${JSON.stringify(event)}`)
        console.log('--------------------------------------')
        console.log('--------------------------------------')

        // onComplete({
        //     deposited: true,
        //     depositTxId: 'txid1234567890'
        // })
        sendToken(account, sendAmount, token)

        // contract.off('Approval', contract.listeners('Approval')[0])
    });

    contract.approve(depositContracts.ETH, approveAmount)

    // const tx = await contract.approve(bridgeEthAddress, approveAmount)
    //
    // console.log('approveAndSendToken tx', tx)
    //
    // const tx2 = await sendToken(account, stakeAMount, {ethTokenId})

    // const result = await new Promise((resolve, reject) => {
    //     contract.methods.approve(bridgeEthAddress, approveAmount)
    //         .send({
    //             from: account.address,
    //         })
    //         .on("transactionHash", (hash) => {
    //             console.log("transactionHash approve ", hash);
    //         })
    //         .on("receipt", (receipt) => {
    //             console.log("receipt approve", receipt);
    //             // setapprovedMsg(receipt.transactionHash);
    //         })
    //         .on("confirmation", (confirmationNumber, receipt) => {
    //             console.log("confirmationNumber approve", confirmationNumber);
    //             console.log("receipt approve", receipt);
    //         })
    //         .on("error", (error) => {
    //             console.log("error approve", error);
    //             // setLoading(false);
    //             // seterrorMsg(error.message);
    //             reject(error)
    //         })
    //         .then(async () => {
    //             const res = await sendToken(account, stakeAMount, {ethTokenId})
    //             resolve(res)
    //         });
    // })

    // console.log('approveAndSendToken tx2', tx2)
    // return tx2
};

const transfer = async (account, amount, token, infiniteApproval) => {
    // const contract = symbol === "USDC" ? usdcContract : daiContract
    // const stakeAMount =
    //     symbol === "USDC"
    //         ? web3.utils.toWei(amount, "mwei")
    //         : web3.utils.toWei(amount, "ether");

    // const contract = usdcContract
    // const tokenContract = new ethers.Contract(token.addresses.ETH, tokenAbi, account.provider)
    // const contract = await tokenContract.connect(account.signer)

    const {symbol, precision, depositContracts} = token

    const contract = _.get(account, ['contracts', symbol])

    if (!contract) {
        return console.error(`Contract not initialized: ${symbol} ERC20`)
    }

    // const stakeAmount = web3.utils.toWei(amount, "mwei")
    // const stakeAmount = parseInt(token.symbol === "USDC"
    //     ? web3.utils.toWei(amount, "mwei")
    //     : web3.utils.toWei(amount, "ether"))

    const sendAmount = Math.floor(amount * Math.pow(10, precision))

    console.log("sendAmount ", sendAmount);

    const approvedAmount = await contract.allowance(account.address, depositContracts.ETH)
    // const approvedAmount = await contract.methods.allowance(account.address, bridgeEthAddress).call();

    const appAmount = parseFloat(ethers.utils.formatUnits(approvedAmount, token.precision))

    console.log("approvedAmount in contract ", appAmount);

    return appAmount >= amount ? sendToken(account, sendAmount, token) : approveAndSendToken(account, sendAmount, token, infiniteApproval)
    // return await appAmount > stakeAmount ? sendToken(account, stakeAmount, token) : approveAndSendToken(account, stakeAmount, token)
}

const awaitDeposit = (account, token, onComplete) => {
    const {symbol, depositContracts} = token
    const contract = _.get(account, ['contracts', symbol])

    if (!contract) {
        return console.error(`Contract not initialized: ${symbol} ERC20`)
    }

    const filter = contract.filters.Transfer(account.address, depositContracts.ETH)
    contract.on(filter, (from, to, amount, event) => {
        // The to will always be "address"
        console.log(`I sent ${ ethers.utils.formatEther(amount) } to ${ to }.`);
        console.log(`EVENT ${JSON.stringify(event)}`)

        onComplete({
            deposited: true,
            depositTxId: event.transactionHash
        })

        // contract.off('Transfer', contract.listeners('Transfer')[0])
    });
}

const awaitReceived = async (account, fromAccount, token, onComplete) => {
    const {symbol, depositContracts} = token
    const contract = _.get(account, ['contracts', symbol])

    if (!contract) {
        return console.error(`Contract not initialized: ${symbol} ERC20`)
    }

    console.log(`awaitReceived on ETH from ${depositContracts.ETH} to ${account.address}`)

    const filter = contract.filters.Transfer(null, account.address)
    contract.on(filter, (from, to, amount, event) => {
        // The to will always be "address"
        console.log(`I got ${ ethers.utils.formatEther(amount) } from ${ from }.`);
        console.log(`EVENT ${JSON.stringify(event)}`)

        onComplete({
            received: true,
            receivedTxId: event.transactionHash
        })

        // contract.off('Transfer', contract.listeners('Transfer')[0])
    });
}

export default {
    init,
    fetchTransferFee: () => '',

    transfer,
    awaitDeposit,
    awaitReceived,
}