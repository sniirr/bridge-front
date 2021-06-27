import _ from "lodash";
import TOKENS from "config/tokens.json";
import tokenAbi from 'config/abi/tokenAbi'
import Web3 from 'web3'

const web3 = new Web3(Web3.givenProvider);

const tokenContracts = _.zipObject(
    _.keys(TOKENS),
    _.map(TOKENS, ({addresses}) => new web3.eth.Contract(tokenAbi, addresses.ETH))
)

export const connect = async ({providerIdx}) => {
    try {
        const {ethereum} = window;
        const {chainId} = ethereum;

        if (chainId === "0x3") {
            if (!!ethereum) {
                const accounts = await ethereum.request({
                    method: "eth_requestAccounts",
                });
                return {address: accounts[0]}
            }
        } else {
            alert("Must connect to Ropsten testnet");
        }
    } catch (e) {
        console.error("MetaMask connection failed", e);
    }
    return null
}

export const fetchBalance = async (symbol, account) => {
    // const state = getState()
    // const account = accountSelector('EOS')(state)

    // const rpc = _.get(account, 'wallet.eosApi.rpc')
    const contract = _.get(tokenContracts, symbol)

    if (_.isNil(contract)) return

    const balance = await contract.methods.balanceOf(account.address).call()

    const {precision} = TOKENS[symbol]

    // console.log(`${symbol} balance = `, balance)

    return balance / Math.pow(10, precision)
}

export default {
    connect,
    fetchBalance,
}