import _ from "lodash";
import {fetchOneByPk} from 'utils/api/eosApi'
import {BRIDGE_REGISTRY_ERROR} from '../Bridge.common'

export const fetchRegistry = async account => {
    const rpc = _.get(account, 'wallet.eosApi.rpc')

    if (_.isEmpty(rpc)) return

    return await fetchOneByPk(rpc, {
        code: 'etheosmultok',
        scope: 'etheosmultok',
        table: 'accountdet',
    }, 'account', account.address)
}

export const isRegisteredSelector = state => {
    const accounts = _.get(state, 'accounts')
    const registry = _.get(state, 'bridge.registry')

    if (!_.has(accounts, 'EOS') || !_.has(accounts, 'ETH')) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.NOT_READY}
    if (_.isNil(registry)) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.NOT_READY}
    if (_.isEmpty(registry)) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.NOT_REGISTERED}
    if (_.toLower(registry.ethaddress) !== _.toLower(accounts.ETH.address)) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.ACCOUNT_MISMATCH}

    return {isRegistered: true}
}

export default {
    fetchRegistry,
}