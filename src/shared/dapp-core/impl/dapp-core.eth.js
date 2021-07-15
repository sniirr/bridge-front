import _ from "lodash";
import tokenAbi from 'shared/dapp-common/utils/tokenAbi'
import { ethers } from "ethers"

export const init = ({chains, tokens}) => {
    if (!window.ethereum) {
        throw 'Metamask not found, please install the extension and refresh to proceed'
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    return {
        chains: {
            ...chains,
            ETH: {
                ..._.get(chains, 'ETH', {}),
                provider,
            }
        },
        tokens: _.mapValues(tokens, token => ({
            ...token,
            contracts: {
                ..._.get(token, 'contracts', {}),
                ETH: new ethers.Contract(token.addresses.ETH, tokenAbi, provider),
            }
        }))
    }
}

export const connect = ({chain}) => async ({providerIdx}, tokens) => {
    const {ethereum} = window;
    const {chainId: currChainId} = ethereum;

    const {chainInfo, provider} = chain

    if (currChainId === chainInfo.chainId) {
        if (!!ethereum) {
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress()

            _.forEach(tokens, async token => {
                await token.contracts.ETH.connect(signer)
            })

            // const contracts = _.zipObject(
            //     _.map(tokens, 'symbol'),
            //     _.map(tokens, ({symbol, addresses}) => {
            //         const c = new ethers.Contract(addresses.ETH, tokenAbi, signer)
            //         if (symbol === 'DAPP') {
            //             c.on('Transfer', (from, to, amount, event) => {
            //                 // if (from === BRIDGE.ethAddress || to === BRIDGE.ethAddress) {
            //                 //     console.log('--------------------------------------')
            //                 console.log(`TRANSFER ${amount} ${symbol} from ${from} to ${to}`)
            //                 console.log(`EVENT ${JSON.stringify(event)}`)
            //                 // console.log('--------------------------------------')
            //                 // }
            //             })
            //             c.on('Approval', (owner, spender, amount, event) => {
            //                 // if (owner === BRIDGE.ethAddress) {
            //                 //     console.log('--------------------------------------')
            //                 console.log(`APPROVAL ${spender} to spend ${ ethers.utils.formatEther(amount) } ${symbol} on behalf of ${ owner }.`)
            //                 console.log(`EVENT ${JSON.stringify(event)}`)
            //                 // console.log('--------------------------------------')
            //                 // }
            //             })
            //         }
            //         return c
            //     })
            // )

            return {
                address,
                signer,
            }
        }
    } else {
        throw {message: "Wrong network"}
    }
    return null
}

export const fetchBalance = ({account}) => async ({precision, contracts}) => {
    const contract = _.get(contracts, 'ETH')

    if (_.isNil(contract)) return

    const balance = await contract.balanceOf(account.address)

    return ethers.utils.formatUnits(balance, precision)
}

const logout = () => async () => {}

export default {
    init,

    connect,
    logout,
    fetchBalance,
}