import _ from "lodash";
import {fetchOneByPk, fetchOne, fetchTableData, createTransferAction} from 'utils/api/eosApi'
import {BRIDGE_REGISTRY_ERROR} from '../'
import config from 'config/bridge.json'
import {amountToAsset} from "utils/utils";

// actions
const fetchSupportedTokens = async (account, contract) => {
    if (_.isEmpty(account.rpc)) return

    const {tables: {acceptedSym}} = config

    // TODO - remove this:
    const table = contract === 'etheosmultok' ? 'acceptedsym1' : acceptedSym

    const data = await fetchTableData(account.rpc, {
        code: contract,
        scope: contract,
        table,
    })

    return _.map(data.rows, ({dtoken, insymbol}) => {
        const [inPrecision, inSymbol] = _.split(insymbol, ',')
        const [outPrecision, outSymbol] = _.split(dtoken, ',')
        return {
            symbol: inSymbol,
            inToken: {symbol: inSymbol, precision: parseInt(inPrecision)},
            outToken: {symbol: outSymbol, precision: parseInt(outPrecision)},
        }
    })
}

const fetchRegistry = async account => {
    const rpc = _.get(account, 'wallet.eosApi.rpc')

    if (_.isEmpty(rpc)) return

    const {contract, tables: {registry}} = config

    return await fetchOneByPk(rpc, {
        code: contract,
        scope: contract,
        table: registry,
    }, 'account', account.address)
}

const fetchRegFee = async account => {
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

const register = async (account, newAddress, [regFee, feeSymbol], isModify) => {
    const {eosApi, auth} = _.get(account, 'wallet', {})

    if (_.isEmpty(eosApi)) return

    const {contract} = config

    const ethAccountField = isModify ? 'newethaddress' : 'ethaddress'
    const actions = [
        {
            ...createTransferAction(account.address, amountToAsset(regFee, {symbol: feeSymbol, precision: 4}, true, false), {contract: 'eosio.token', symbol: 'EOS'}, contract, "register/modify fee"),
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

    return await eosApi.transact(
        {actions},
        {
            broadcast: true,
            blocksBehind: 3,
            expireSeconds: 60,
        }
    )
}

const fetchTransferFee = async (account, {symbol, depositContracts}) => {
    if (_.isEmpty(account.rpc)) return

    const {contract, tables: {feeSettings}} = config

    // TODO - remove this:
    const depositContract = _.get(depositContracts, 'EOS', contract)
    const table = depositContract === 'dadethbridge' ? 'feesettings4' : feeSettings

    const row = await fetchOne(account.rpc, {
        code: depositContract,
        scope: symbol,
        table,
    })

    return _.get(row, 'minfeewithdraw', '')
}

const transfer = async (account, amount, token) => {
    const {eosApi, auth} = _.get(account, 'wallet', {})

    if (_.isEmpty(eosApi)) return

    const {contract} = config
    const {symbol, addresses, depositContracts} = token

    const actions = [
        {
            ...createTransferAction(account.address, amountToAsset(amount, token, true), {contract: addresses.EOS, symbol}, depositContracts?.EOS || contract, `Transfer ${symbol}`),
            authorization: [
                {
                    actor: auth.accountName,
                    permission: auth.permission,
                },
            ],
        },
    ]

    return await eosApi.transact(
        {actions},
        {
            broadcast: true,
            blocksBehind: 3,
            expireSeconds: 60,
        }
    )
}

// prices
const updatePrices = async (account) => {
    const {eosApi, auth} = _.get(account, 'wallet', {})

    if (_.isEmpty(eosApi)) return

    const {contract} = config

    const actions = [
        {
            account: contract,
            name: 'setgasprice',
            authorization: [
                {
                    actor: auth.accountName,
                    permission: auth.permission,
                },
            ],
            data: {},
        },
        {
            account: contract,
            name: 'setethprice',
            authorization: [
                {
                    actor: auth.accountName,
                    permission: auth.permission,
                },
            ],
            data: {},
        },
        {
            account: contract,
            name: 'seteosprice',
            authorization: [
                {
                    actor: auth.accountName,
                    permission: auth.permission,
                },
            ],
            data: {},
        },
    ]

    return await eosApi.transact(
        {actions},
        {
            broadcast: true,
            blocksBehind: 3,
            expireSeconds: 60,
        }
    )
}

// selectors
export const isRegisteredSelector = state => {
    const dappcore = _.get(state, 'dappcore')
    const registry = _.get(state, 'bridge.registry')

    if (!_.has(dappcore, 'EOS') || !_.has(dappcore, 'ETH')) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.NOT_READY}
    if (_.isNil(registry)) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.NOT_READY}
    if (_.isEmpty(registry)) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.NOT_REGISTERED}
    if (_.toLower(registry.ethaddress) !== _.toLower(dappcore.ETH.address)) return {isRegistered: false, error: BRIDGE_REGISTRY_ERROR.ACCOUNT_MISMATCH}

    return {isRegistered: true}
}

export default {
    fetchSupportedTokens,
    fetchRegistry,
    fetchRegFee,
    register,
    isRegisteredSelector,

    updatePrices,

    fetchTransferFee,
    transfer,
}