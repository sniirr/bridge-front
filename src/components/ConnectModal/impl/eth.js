import _ from "lodash";
import TOKENS from "config/tokens.dev.json";
import tokenAbi from 'config/abi/tokenAbi'
// import Web3 from 'web3'
import { ethers } from "ethers"

const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

const tokens = _.filter(TOKENS, ({addresses}) => _.has(addresses, 'ETH'))

const tokenContracts = _.zipObject(
    _.map(tokens, 'symbol'),
    _.map(tokens, ({addresses}) => {
        return new ethers.Contract(addresses.ETH, tokenAbi, provider)
    })
)

export const connect = async ({providerIdx}) => {
    try {
        const {ethereum} = window;
        const {chainId} = ethereum;

        if (chainId === "0x3") {
            if (!!ethereum) {
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress()

                return {
                    address,
                    provider,
                    signer,
                }
            }
        } else {
            alert("Must connect to Ropsten testnet");
        }
    } catch (e) {
        console.error("MetaMask connection failed", e);
    }
    return null
}

export const fetchBalance = async ({symbol, precision}, account) => {
    const contract = _.get(tokenContracts, symbol)

    if (_.isNil(contract)) return

    const balance = await contract.balanceOf(account.address)

    return ethers.utils.formatUnits(balance, precision)
}

export default {
    connect,
    fetchBalance,
}