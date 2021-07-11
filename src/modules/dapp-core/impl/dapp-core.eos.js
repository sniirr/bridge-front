import _ from "lodash";
import {initAccessContext} from 'eos-transit'
import scatter from 'eos-transit-scatter-provider'
import tokenpocket from 'eos-transit-tokenpocket-provider'
import AnchorLinkProvider from 'eos-transit-anchorlink-provider'
import { JsonRpc } from 'eosjs'

const initRpc = ({chain}) => {
    const {host, port, protocol} = chain
    return new JsonRpc(`${protocol}://${host}:${port}`)
}

const connect = async ({providerIdx}, {chain}) => {
    const accessContext = initAccessContext({
        appName: 'DeFights',
        network: chain,
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
}

const fetchBalance = async (chain, account, {symbol, addresses}) => {
    const rpc = _.get(account, 'wallet.eosApi.rpc')

    if (_.isEmpty(rpc)) return

    const balances = await rpc.get_currency_balance(addresses.EOS, account.address, symbol)
    return _.size(balances) === 1 ? balances[0] : 0
}

const logout = async () => {}

export default {
    init: data => data,
    initRpc,

    connect,
    logout,
    fetchBalance,
}