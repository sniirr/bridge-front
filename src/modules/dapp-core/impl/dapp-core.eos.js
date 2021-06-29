import _ from "lodash";
import CHAINS from 'config/chains.json'
import {initAccessContext} from 'eos-transit'
import scatter from 'eos-transit-scatter-provider'
import tokenpocket from 'eos-transit-tokenpocket-provider'
import AnchorLinkProvider from 'eos-transit-anchorlink-provider'
import TOKENS from 'config/tokens.json'
import { JsonRpc, RpcError } from 'eosjs'

const initRpc = () => {
    const {host, port, protocol} = CHAINS.EOS.chain
    return new JsonRpc(`${protocol}://${host}:${port}`)
}

const connect = async ({providerIdx}) => {
    const accessContext = initAccessContext({
        appName: 'DeFights',
        network: CHAINS.EOS.chain,
        walletProviders: [
            scatter(),
            AnchorLinkProvider(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
            tokenpocket(),
        ]
    });

    const walletProviders = accessContext.getWalletProviders()
    const selectedProvider = walletProviders[providerIdx]
    const wallet = accessContext.initWallet(selectedProvider)

    await wallet.connect()
    await wallet.login()

    return {
        address: _.get(wallet, 'auth.accountName'),
        wallet,
    }
    // try {
    //
    // } catch (e) {
    //     console.error("EOS connection failed", e);
    // }
    // return null
}

const fetchBalance = async ({symbol}, account) => {
    const rpc = _.get(account, 'wallet.eosApi.rpc')
    const contract = _.get(TOKENS, [symbol, 'addresses', 'EOS'])

    if (_.isEmpty(rpc)) return

    const balances = await rpc.get_currency_balance(contract, account.address, symbol)
    return _.size(balances) === 1 ? balances[0] : 0
}

const logout = async () => {}

export default {
    initRpc,
    connect,
    logout,
    fetchBalance,
}