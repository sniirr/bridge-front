import _ from 'lodash'
import {makeReducer, getHandler} from './utils'

export const initDappCore = (controllers) => {

    const initRpc = (chainKey) => async (dispatch, getState) => {
        const [handler, account] = getHandler(controllers, chainKey, 'initRpc', getState())

        const rpc = await handler(account)
        dispatch(updateChain(chainKey, {rpc}))
    }

    const connect = (chainKey, opts={}) => async (dispatch, getState) => {

        const [handler, ] = getHandler(controllers, chainKey, 'connect', getState())

        const account = await handler(opts)
        if (!_.isNil(account)) {
            dispatch(updateChain(chainKey, account))
        }
    }

    const fetchBalance = (chainKey, token) => async (dispatch, getState) => {
        const [handler, account] = getHandler(controllers, chainKey, 'fetchBalance', getState())

        const balance = await handler(token, account)
        if (!_.isNil(balance)) {
            dispatch({
                type: 'DAPPCORE.SET_BALANCE',
                payload: {
                    chainKey,
                    symbol: token.symbol,
                    balance: parseFloat(balance),
                }
            })
        }
    }

    const logout = (chainKey) => async (dispatch, getState) => {
        const [handler, account] = getHandler(controllers, chainKey, 'logout', getState())

        await handler(account)
        dispatch({
            type: 'DAPPCORE.LOGOUT',
            payload: {chainKey}
        })
    }

    return {
        initRpc,
        connect,
        logout,
        fetchBalance,
    }
}

// ACTIONS
export const updateChain = (chainKey, update) => ({
    type: 'DAPPCORE.UPDATE_CHAIN',
    payload: {chainKey, update},
})

// SELECTORS
export const dappCoreSelector = state => _.get(state, 'dappcore')
export const chainCoreSelector = chainKey => state => _.get(state, ['dappcore', chainKey], {})
export const balanceSelector = (chainKey, symbol) => state => _.get(state, ['dappcore', chainKey, 'balances', symbol], 0)

// REDUCER
const INITIAL_STATE = {}

export const dappReducer = makeReducer({
    'DAPPCORE.UPDATE_CHAIN': (state, action) => {
        const {chainKey, update} = action.payload
        return {
            ...state,
            [chainKey]: {
                ...state[chainKey],
                ...update,
            },
        }
    },
    'DAPPCORE.LOGOUT': (state, action) => {
        const {chainKey} = action.payload
        return {
            ...state,
            [chainKey]: {
                ...state[chainKey],
                address: ''
            }
        }
    },
    'DAPPCORE.SET_BALANCE': (state, action) => {
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