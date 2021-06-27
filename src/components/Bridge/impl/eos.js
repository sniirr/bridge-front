import _ from "lodash";
import {fetchOneByPk, fetchOne, createTransferAction} from 'utils/api/eosApi'
import {BRIDGE_REGISTRY_ERROR} from '../Bridge.common'
import config from 'config/bridge.dev.json'
import {amountToAsset} from "utils/utils";

// actions
export const fetchRegistry = async account => {
    const rpc = _.get(account, 'wallet.eosApi.rpc')

    if (_.isEmpty(rpc)) return

    const {contract, tables: {registry}} = config

    return await fetchOneByPk(rpc, {
        code: contract,
        scope: contract,
        table: registry,
    }, 'account', account.address)
}

export const fetchRegFee = async account => {
    const rpc = _.get(account, 'wallet.eosApi.rpc')

    if (_.isEmpty(rpc)) return

    const {contract, tables: {fees}} = config

    const row = await fetchOne(rpc, {
        code: contract,
        scope: contract,
        table: fees,
    })

    const fee = _.split(_.get(row, 'registrationfee', '-1 EOS'), ' ')

    return [parseFloat(fee[0]), fee[1]]
}

export const register = async (account, newAddress, [regFee, feeSymbol], isModify) => {
    const {eosApi, auth} = _.get(account, 'wallet', {})

    if (_.isEmpty(eosApi)) return

    const {contract} = config

    const ethAccountField = isModify ? 'newethaddress' : 'ethaddress'
    const actions = [
        {
            ...createTransferAction(account.address, amountToAsset(regFee, feeSymbol, true, false, 4), {contract: 'eosio.token', symbol: 'EOS'}, contract, "register/modify fee"),
            authorization: [
                {
                    actor: auth.accountName,
                    permission: auth.permission,
                },
            ],
        },
        {
            account: contract,
            name: isModify ? 'modethadress' : 'registereth',
            authorization: [
                {
                    actor: auth.accountName,
                    permission: auth.permission,
                },
            ],
            data: {
                account: account.address,
                [ethAccountField]: newAddress,
            },
        },
    ]

    let response

    try {
        response = await eosApi.transact(
            {actions},
            {
                broadcast: true,
                blocksBehind: 3,
                expireSeconds: 60,
            }
        )
    }
    catch (e) {
        debugger
    }

    return {success: !!response, response}
}


// selectors
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
    fetchRegFee,
    register,
}