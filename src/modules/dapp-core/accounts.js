import {makeReducer} from "modules/utils";
import _ from 'lodash'

export const updateAccount = (chainKey, account) => ({
    type: 'DAPP.CORE.UPDATE_ACCOUNT',
    payload: {chainKey, account}
})

export const clearAccount = (chainKey) => ({
    type: 'DAPP.CORE.CLEAR_ACCOUNT',
    payload: {chainKey}
})

export const setBalance = (chainKey, symbol, balance) => ({
    type: 'DAPP.CORE.SET_BALANCE',
    payload: {chainKey, symbol, balance}
})

export const accountsSelector = state => _.get(state, 'accounts')
export const accountSelector = chainKey => state => _.get(state, ['accounts', chainKey])
export const balanceSelector = (chainKey, symbol) => state => _.get(state, ['accounts', chainKey, 'balances', symbol], 0)

export const accountsReducer = makeReducer({
    'DAPP.CORE.UPDATE_ACCOUNT': (state, action) => {
        const {chainKey, account} = action.payload
        return {
            ...state,
            [chainKey]: {
                ..._.get(state, chainKey, {}),
                ...account
            },
        }
    },
    'DAPP.CORE.CLEAR_ACCOUNT': (state, action) => {
        const {chainKey} = action.payload
        return _.omit(state, chainKey)
    },
    'DAPP.CORE.SET_BALANCE': (state, action) => {
        const {chainKey, symbol, balance} = action.payload
        return {
            ...state,
            [chainKey]: {
                ...state[chainKey],
                balances: {
                    ..._.get(state, [chainKey, 'balances']),
                    [symbol]: balance,
                }
            }
        }
    },
}, {})