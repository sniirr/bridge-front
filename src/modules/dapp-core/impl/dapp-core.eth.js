import _ from "lodash";
import BRIDGE from 'config/bridge.json'
import TOKENS from "config/tokens.json";
import CHAINS from 'config/chains.json'
import tokenAbi from 'config/abi/tokenAbi'
import { ethers } from "ethers"

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const tokens = _.filter(TOKENS, ({addresses}) => _.has(addresses, 'ETH'))

// const tokenContracts = _.zipObject(
//     _.map(tokens, 'symbol'),
//     _.map(tokens, ({addresses}) => {
//         // const c = new ethers.Contract(addresses.ETH, tokenAbi, provider)
//         //
//         // const myAddress = "0x6fAe7852634b6E111a3dAc4810501813b12e7BeE";
//         // const filter = c.filters.Transfer(null, myAddress)
//         //
//         // c.on(filter, (from, to, amount, event) => {
//         //     // The to will always be "address"
//         //     console.log(`I got ${ ethers.utils.formatEther(amount) } from ${ from }.`);
//         // });
//         //
//         // return c
//         return new ethers.Contract(addresses.ETH, tokenAbi, provider)
//     })
// )

// const init = (account, tokens) => {
//     if (_.isNil(account.signer)) {
//         return console.error(`Failed to init, signer is null`)
//     }
//
//     const contracts = _.zipObject(
//         _.map(tokens, 'symbol'),
//         _.map(tokens, ({addresses}) => {
//             return new ethers.Contract(addresses.ETH, tokenAbi, provider)
//         })
//     )
//
//     return {
//         contracts
//     }
// }

export const connect = async ({providerIdx}) => {
    const {ethereum} = window;
    const {chainId} = ethereum;

    if (chainId === CHAINS.ETH.chain.chainId) {
        if (!!ethereum) {
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress()

            const contracts = _.zipObject(
                _.map(tokens, 'symbol'),
                _.map(tokens, ({symbol, addresses}) => {
                    const c = new ethers.Contract(addresses.ETH, tokenAbi, signer)
                    if (symbol === 'DAPP') {
                        c.on('Transfer', (from, to, amount, event) => {
                            // if (from === BRIDGE.ethAddress || to === BRIDGE.ethAddress) {
                            //     console.log('--------------------------------------')
                            console.log(`TRANSFER ${amount} ${symbol} from ${from} to ${to}`)
                            console.log(`EVENT ${JSON.stringify(event)}`)
                            // console.log('--------------------------------------')
                            // }
                        })
                        c.on('Approval', (owner, spender, amount, event) => {
                            // if (owner === BRIDGE.ethAddress) {
                            //     console.log('--------------------------------------')
                            console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
                            console.log(`EVENT ${JSON.stringify(event)}`)
                            // console.log('--------------------------------------')
                            // }
                        })
                    }
                    return c
                })
            )

            return {
                address,
                provider,
                signer,
                contracts,
            }
        }
    } else {
        throw {message: "Wrong network"}
    }
    return null
}

export const fetchBalance = async ({symbol, precision}, account) => {
    const contract = _.get(account, ['contracts', symbol])

    if (_.isNil(contract)) return

    const balance = await contract.balanceOf(account.address)

    return ethers.utils.formatUnits(balance, precision)
}

const logout = async () => {}

export default {
    connect,
    logout,
    fetchBalance,
}