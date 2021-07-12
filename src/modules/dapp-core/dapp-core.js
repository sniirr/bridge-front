import _ from 'lodash'
import {getHandler, getMethod, showNotification} from 'modules/utils'
import {setChains, updateChain} from "./chains";
import {setTokens, tokensSelector} from './tokens'
import {clearAccount, setBalance, updateAccount} from "modules/dapp-core/accounts";

export const initDappCore = (controllers, {chains, tokens}) => (dispatch, getState) => {

    // init
    try {
        const data = _.reduce(chains, (memo, chain, chainKey) => {
            const handler = getMethod(controllers, chainKey, 'init')
            return handler(memo)
        }, {chains, tokens})

        dispatch(setChains(data.chains))
        dispatch(setTokens(data.tokens))
    } catch (e) {
        console.error('Failed to initialize:', e)
    }

    // methods
    const initRpc = async (chainKey) => {
        const {handler} = getHandler(controllers, chainKey, 'initRpc', getState())

        try {
            const rpc = await handler()
            dispatch(updateChain(chainKey, {rpc}))
        } catch (e) {
            console.error(e)
        }
    }

    const connect = async (chainKey, opts = {}) => {

        const state = getState()
        const {handler, context: {chain}} = getHandler(controllers, chainKey, 'connect', state)

        try {
            const tokens = tokensSelector(state)
            const account = await handler(opts, tokens)
            if (!_.isNil(account)) {
                dispatch(updateAccount(chainKey, account))
                dispatch(showNotification({type: 'success', text: `Connected to ${chain.name}`}))
            }
        } catch (e) {
            console.error(e)
            dispatch(showNotification({
                type: 'error',
                text: e.message || `Failed to connect to ${chain.name}`
            }))
        }
    }

    const fetchBalance = async (chainKey, token) => {
        const {handler} = getHandler(controllers, chainKey, 'fetchBalance', getState())

        try {
            const balance = await handler(token)
            if (!_.isNil(balance)) {
                const b = parseFloat(balance)
                dispatch(setBalance(chainKey, token.symbol,  _.isNumber(b) ? b : 0))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const logout = async (chainKey) => {
        const {handler, context: {chain}} = getHandler(controllers, chainKey, 'logout', getState())

        try {
            await handler()
            dispatch(clearAccount(chainKey))
            dispatch(showNotification({type: 'success', text: `Disconnected from ${chain.name}`}))
        } catch (e) {
            console.error(e)
        }
    }

    const ctrl = {
        initRpc,
        connect,
        logout,
        fetchBalance,
    }

    dispatch({
        type: 'DAPP.CORE.SET_CTRL',
        payload: {
            ctrlName: 'core',
            ctrl,
        }
    })
}