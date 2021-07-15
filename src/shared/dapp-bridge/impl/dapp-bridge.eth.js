import _ from 'lodash'
import bridgeAbi from "shared/dapp-bridge/utils/bridgeAbi"
import web3 from 'shared/dapp-common/utils/ethApi'
import {ethers} from "ethers"
import {tokensSelector} from "shared/dapp-core";

export const createController = bridgeConfig => {

    const {bridgeRegistry, bridges} = bridgeConfig

    const ethAddresses = _.map(bridges, b => _.get(b, 'contracts.ETH.address'))

    const init = ({chain}) => () => {
        console.log('init ETH bridge')

        if (_.isNil(chain.provider)) {
            return console.error('init bridge failed - provider is null')
        }

        const contracts = _.map(ethAddresses, a => new ethers.Contract(a, bridgeAbi, chain.provider))

        // _.forEach(contracts, bridgeContract => {
        //     bridgeContract.on('Refund', (id, recipient, amount, reason, event) => {
        //         console.log('--------------------------------------')
        //         console.log('Bridge.Refund event', JSON.stringify({id, recipient, amount, reason, event}, null, 2))
        //         console.log('--------------------------------------')
        //     })
        //     bridgeContract.on('Failure', (reason, event) => {
        //         console.log('--------------------------------------')
        //         console.log('Bridge.Failure event', JSON.stringify({reason, event}, null, 2))
        //         console.log('--------------------------------------')
        //     })
        //     bridgeContract.on('Receipt', (recipient, amount, reason, event) => {
        //         console.log('--------------------------------------')
        //         console.log('Bridge.Receipt event', JSON.stringify({recipient, amount, reason, event}, null, 2))
        //         console.log('--------------------------------------')
        //     })
        // })

        return {
            contracts: _.zipObject(ethAddresses, contracts),
        }
    }

    const sendToken = async ({contracts}, account, amount, token) => {
        const {bridgeContracts, ethTokenId} = token

        const contract = _.get(contracts, bridgeContracts.ETH.address)

        const bContract = await contract.connect(account.signer)

        return await bContract.sendToken(amount, ethTokenId)
    }

    const approveAndSendToken = async (bridge, account, sendAmount, token, infiniteApproval, onError) => {
        console.log("inside approve and send token");

        const {symbol, bridgeContracts, toWeiUnit, contracts: tokenContracts} = token

        const tokenContract = tokenContracts.ETH

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

        const filter = tokenContract.filters.Approval(account.address, bridgeContracts.ETH.address)
        tokenContract.on(filter, (owner, spender, amount, event) => {
            console.log('--------------------------------------')
            console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
            console.log(`EVENT ${JSON.stringify(event)}`)
            console.log('--------------------------------------')
            try {
                sendToken(bridge, account, sendAmount, token)
            }
            catch (e) {
                onError(e)
            }
        });

        const tContract = await tokenContract.connect(account.signer)

        await tContract.approve(bridgeContracts.ETH.address, approveAmount)
    };

    const transfer = ({account, bridge}) => async (amount, token, infiniteApproval, onError) => {
        const {symbol, precision, contracts: tokenContracts, bridgeContracts, toWeiUnit} = token

        const tokenContract = tokenContracts.ETH
        const bridgeContract = _.get(bridge, ['contracts', bridgeContracts.ETH.address])
        if (!tokenContract) {
            return console.error(`Contract not initialized: ${symbol} ERC20`)
        }
        if (!bridgeContract) {
            return console.error(`Contract not initialized: Bridge at ${bridgeContracts.ETH.address}`)
        }

        let sendAmount
        switch (token.symbol) {
            case 'USDC':
            case 'DAI':
                sendAmount = web3.utils.toWei(amount + '', toWeiUnit)
                break
            default:
                sendAmount = Math.floor(amount * Math.pow(10, precision))
        }

        console.log("sendAmount ", sendAmount);

        const approvedAmount = await tokenContract.allowance(account.address, bridgeContracts.ETH.address)

        const appAmount = parseFloat(ethers.utils.formatUnits(approvedAmount, token.precision))
        console.log("approvedAmount in contract ", appAmount);

        return appAmount >= amount
            ? await sendToken(bridge, account, sendAmount, token)
            : await approveAndSendToken(bridge, account, sendAmount, token, infiniteApproval, onError)
    }

    // const onLogin = ({account, bridge}) => (state, callbacks) => {
    //     // const state = getState()
    //     const {tokens, bridgeContracts} = tokensSelector(state)
    //
    //     _.forEach(tokens, async token => {
    //         const tokenContract = token.contracts.ETH
    //         // await token.contracts.ETH.connect(signer)
    //
    //         // TODO - this will override ALL events
    //         await tokenContract.removeAllListeners()
    //
    //         // listen on allowance
    //         const filter1 = tokenContract.filters.Approval(account.address, bridgeContracts.ETH.address)
    //         tokenContract.on(filter1, (owner, spender, amount, event) => {
    //             console.log('--------------------------------------')
    //             console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
    //             console.log(`EVENT ${JSON.stringify(event)}`)
    //             console.log('--------------------------------------')
    //             sendToken(bridge, account, sendAmount, token)
    //         });
    //
    //         // listen on deposit
    //         console.log(`awaitDeposit on ETH from ${account.address} to ${bridgeContracts.ETH.address}`)
    //         const filter = tokenContract.filters.Transfer(account.address, bridgeContracts.ETH.address)
    //         tokenContract.on(filter, (from, to, amount, event) => {
    //             console.log('--------------------------------------')
    //             console.log(`User sent ${ ethers.utils.formatEther(amount) } to ${ to }.`);
    //             console.log(`EVENT ${JSON.stringify(event)}`)
    //             console.log('--------------------------------------')
    //             callbacks.onDeposit(token, {
    //                 deposited: true,
    //                 depositTxId: event.transactionHash
    //             })
    //         })
    //     })
    // }

    const awaitDeposit = ({account, bridge}) => (token, onComplete) => {
        // if (bridge.listeningOnDeposit) return

        const {symbol, bridgeContracts, contracts: tokenContracts} = token
        const contract = tokenContracts.ETH

        if (!contract) {
            return console.error(`Contract not initialized: ${symbol} ERC20`)
        }

        console.log(`awaitDeposit on ETH from ${account.address} to ${bridgeContracts.ETH.address}`)

        const filter = contract.filters.Transfer(account.address, bridgeContracts.ETH.address)
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

    const awaitReceived = ({account, bridge}) => (fromAccount, token, onComplete) => {
        // if (bridge.listeningOnReceive) return
        const {symbol, contracts: tokenContracts} = token
        const contract = tokenContracts.ETH

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

    return {
        init,
        transfer,
        awaitDeposit,
        awaitReceived,
    }
}

// const sendToken = ({contracts}, amount, token) => {
//     const {depositContracts, bridgeContracts, ethTokenId} = token
//
//     const contract = _.get(contracts, bridgeContracts.EOS.address)
//     contract.sendToken(amount, ethTokenId)
// };
//
// const approveAndSendToken = (chain, account, sendAmount, token, infiniteApproval) => {
//     console.log("inside approve and send token");
//
//     // const {contracts} = account
//     const {symbol, bridgeContracts, toWeiUnit, contracts: tokenContracts} = token
//
//     const tokenContract = tokenContracts.ETH
//
//     let approveAmount
//     if (infiniteApproval) {
//         approveAmount = web3.utils.toWei("10000000000000000", toWeiUnit)
//         // approveAmount = symbol === "USDC"
//         //     ? web3.utils.toWei("10000000000000000", "mwei")
//         //     : web3.utils.toWei("10000000000000000", "ether");
//     } else {
//         approveAmount = sendAmount;
//     }
//
//     console.log("approved amount ", approveAmount);
//
//     const filter = tokenContract.filters.Approval(account.address, bridgeContracts.ETH.address)
//     tokenContract.on(filter, (owner, spender, amount, event) => {
//         console.log('--------------------------------------')
//         console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
//         console.log(`EVENT ${JSON.stringify(event)}`)
//         console.log('--------------------------------------')
//         sendToken(account, sendAmount, token)
//     });
//
//     tokenContract.approve(bridgeContracts.ETH.address, approveAmount)
// };
//
// const transfer = ({chain, account}) => async (amount, token, infiniteApproval) => {
//     const {symbol, precision, bridgeContracts, toWeiUnit} = token
//
//     // const contract = _.get(chain, ['contracts', symbol])
//     const contract = _.get(token, ['contracts', 'ETH'])
//     if (!contract) {
//         return console.error(`Contract not initialized: ${symbol} ERC20`)
//     }
//
//     let sendAmount
//     switch (token.symbol) {
//         case 'USDC':
//         case 'DAI':
//             sendAmount = web3.utils.toWei(amount, toWeiUnit)
//             break
//         default:
//             sendAmount = Math.floor(amount * Math.pow(10, precision))
//     }
//
//     console.log("sendAmount ", sendAmount);
//
//     const approvedAmount = await contract.allowance(account.address, bridgeContracts.ETH.address)
//
//     const appAmount = parseFloat(ethers.utils.formatUnits(approvedAmount, token.precision))
//     console.log("approvedAmount in contract ", appAmount);
//
//     return appAmount >= amount ? sendToken(chain, sendAmount, token) : approveAndSendToken(chain, account, sendAmount, token, infiniteApproval)
// }

// const awaitDeposit = (chain, account, token, onComplete) => {
//     const {symbol, depositContracts} = token
//     const contract = _.get(token, ['contracts', 'ETH'])
//     // const contract = _.get(account, ['contracts', symbol])
//
//     if (!contract) {
//         return console.error(`Contract not initialized: ${symbol} ERC20`)
//     }
//
//     console.log(`awaitDeposit on ETH from ${account.address} to ${depositContracts.ETH}`)
//
//     const filter = contract.filters.Transfer(account.address, depositContracts.ETH)
//     contract.on(filter, (from, to, amount, event) => {
//         console.log('--------------------------------------')
//         console.log(`User sent ${ ethers.utils.formatEther(amount) } to ${ to }.`);
//         console.log(`EVENT ${JSON.stringify(event)}`)
//         console.log('--------------------------------------')
//
//         onComplete({
//             deposited: true,
//             depositTxId: event.transactionHash
//         })
//     });
// }

// const awaitReceived = async (chain, account, fromAccount, token, onComplete) => {
//     const {symbol} = token
//     const contract = _.get(token, ['contracts', 'ETH'])
//     // const contract = _.get(account, ['contracts', symbol])
//
//     if (!contract) {
//         return console.error(`Contract not initialized: ${symbol} ERC20`)
//     }
//
//     console.log(`awaitReceived on ETH to ${account.address}`)
//
//     const filter = contract.filters.Transfer(null, account.address)
//     contract.on(filter, (from, to, amount, event) => {
//         console.log('--------------------------------------')
//         console.log(`User received ${ ethers.utils.formatEther(amount) } from ${ from }.`);
//         console.log(`EVENT ${JSON.stringify(event)}`)
//         console.log('--------------------------------------')
//
//         onComplete({
//             received: true,
//             receivedTxId: event.transactionHash
//         })
//     });
// }

// export default {
//     // init,
//     // fetchTransferFee: () => '',
//
//     // transfer,
//     awaitDeposit,
//     awaitReceived,
// }