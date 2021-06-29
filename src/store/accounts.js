import _ from 'lodash'
import {makeReducer, reduceUpdateKey} from "utils/reduxUtils";

// ACTIONS
export const login = (chainKey, account) => ({
    type: 'ACCOUNTS.LOGIN',
    payload: {chainKey, account}
})

export const logout = chainKey => ({
    type: 'ACCOUNTS.LOGOUT',
    payload: {chainKey}
})

export const updateAccount = (chainKey, update) => ({
    type: 'ACCOUNTS.UPDATE',
    payload: {chainKey, update},
})

export const initRpc = (chainKey, ctrl) => async dispatch => {
    if (!_.isFunction(ctrl.initRpc)) {
        console.error(`NotImplementedError: initRpc is not implemented for ${chainKey}`)
        return
    }
    const rpc = await ctrl.initRpc()
    if (!_.isNil(rpc)) {
        dispatch(updateAccount(chainKey, {rpc}))
    }
}

export const connect = (chainKey, ctrl, opts={}) => async dispatch => {
    if (!_.isFunction(ctrl.connect)) {
        console.error(`NotImplementedError: connect is not implemented for ${chainKey}`)
        return
    }
    const account = await ctrl.connect(opts)
    if (!_.isNil(account)) {
        dispatch(updateAccount(chainKey, account))
    }
}

export const fetchBalance = (chainKey, ctrl, symbol) => async (dispatch, getState) => {
    if (!_.isFunction(ctrl.fetchBalance)) {
        console.error(`NotImplementedError: fetchBalance is not implemented for ${chainKey}`)
        return
    }
    const state = getState()
    const account = accountSelector(chainKey)(state)

    const balance = await ctrl.fetchBalance(symbol, account)
    if (!_.isNil(balance)) {
        dispatch({
            type: 'ACCOUNTS.SET_BALANCE',
            payload: {
                chainKey,
                symbol,
                balance: parseFloat(balance),
            }
        })
    }
}

// SELECTORS
export const accountsSelector = state => _.get(state, 'accounts')
export const accountSelector = chainKey => state => _.get(state, ['accounts', chainKey], {})
export const balanceSelector = (chainKey, symbol) => state => _.get(state, ['accounts', chainKey, 'balances', symbol], 0)

// REDUCER
const INITIAL_STATE = {}

export const accountsReducer = makeReducer({
    'ACCOUNTS.LOGIN': (state, action) => {
        const {chainKey, account} = action.payload
        return {
            ...state,
            [chainKey]: account,
        }
    },
    'ACCOUNTS.UPDATE': (state, action) => {
        const {chainKey, update} = action.payload
        return {
            ...state,
            [chainKey]: {
                ...state[chainKey],
                ...update,
            },
        }
    },
    'ACCOUNTS.LOGOUT': (state, action) => {
        const {chainKey} = action.payload
        return _.omit(state, chainKey)
    },
    'ACCOUNTS.UPDATE_ACCOUNT': (state, action) => reduceUpdateKey(action.payload.chainKey)(state, action),
    'ACCOUNTS.SET_BALANCE': (state, action) => {
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
}, INITIAL_STATE)