import {makeReducer, reduceSetKey} from "utils/reduxUtils";
import _ from "lodash";
import {chainCoreSelector} from "modules/dapp-core";
import config from 'config/bridge.json'
import {showNotification} from "modules/utils";

export const BRIDGE_REGISTRY_ERROR = {
    NOT_READY: 0,
    NOT_REGISTERED: 1,
    ACCOUNT_MISMATCH: 2,
}

export const initBridge = (controllers, {registerOn}) => {

    const getHandler = (chainKey, method, state) => {
        const ctrl = controllers[chainKey]
        if (!_.isFunction(ctrl[method])) {
            throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
        }
        const chain = chainCoreSelector(chainKey)(state)
        return [ctrl[method], chain]
    }

    // CONFIG
    const fetchSupportedTokens = () => async (dispatch, getState) => {
        const {contract, supportedContracts = []} = config

        try {
            const tokenSets = await Promise.all(
                _.map([contract, ...supportedContracts], async c => {
                    const [handler, chain] = getHandler(registerOn, 'fetchSupportedTokens', getState())
                    return await handler(chain, c)
                })
            )

            const tokens = _.keyBy(_.flatten(tokenSets), 'symbol')

            dispatch({
                type: 'BRIDGE.SET_TOKENS',
                payload: tokens,
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch supported tokens'}))
        }
    }

    // REGISTER
    const fetchRegistry = () => async (dispatch, getState) => {
        const [handler, chain] = getHandler(registerOn, 'fetchRegistry', getState())

        try {
            const registry = await handler(chain)
            dispatch({
                type: 'BRIDGE.SET_REGISTRY',
                payload: registry || {}
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch registry info'}))
        }
    }

    const fetchRegFee = () => async (dispatch, getState) => {
        const [handler, chain] = getHandler(registerOn, 'fetchRegFee', getState())

        try {
            const fee = await handler(chain)
            dispatch({
                type: 'BRIDGE.SET_REG_FEE',
                payload: fee
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch registration fee'}))
        }
    }

    const register = (newAddress, regFee, isModify) => async (dispatch, getState) => {
        const [handler, chain] = getHandler(registerOn, 'register', getState())

        try {
            const result = await handler(chain, newAddress, regFee, isModify)
            dispatch({
                type: 'BRIDGE.REGISTER_SUCCESS',
                payload: result
            })
        }
        catch (e){
            console.error(e)
            dispatch(showNotification({type: 'error', text: e.message || e}))
        }
    }

    const isRegisteredSelector = state => {
        const [selector, ] = getHandler(registerOn, 'isRegisteredSelector', state)

        return selector(state)
    }

    // TRANSFER
    const fetchTransferFee = (fromChain, token) => async (dispatch, getState) => {
        const [handler, chain] = getHandler(fromChain, 'fetchTransferFee', getState())

        try {
            const fee = await handler(chain, token)
            dispatch({
                type: 'BRIDGE.SET_TX_FEE',
                payload: fee
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch transaction fee'}))
        }
    }

    const transfer = (fromChain, amount, token, infiniteApproval) => async (dispatch, getState) => {
        const [handler, chain] = getHandler(fromChain, 'transfer', getState())

        try {
            const result = await handler(chain, amount, token, infiniteApproval)
            dispatch({
                type: 'BRIDGE.TRANSFER_SUCCESS',
                payload: result
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const updatePrices = () => async (dispatch, getState) => {
        const [handler, chain] = getHandler(registerOn, 'updatePrices', getState())

        try {
            const result = await handler(chain)
            dispatch({
                type: 'BRIDGE.UPDATE_PRICES_SUCCESS',
                payload: result
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    return {
        fetchSupportedTokens,
        fetchRegistry,
        fetchRegFee,
        register,
        isRegisteredSelector,

        updatePrices,

        fetchTransferFee,
        transfer,
    }
}

// selectors
export const bridgeSelector = state => _.get(state, 'bridge')
export const regFeeSelector = state => _.get(state, 'bridge.regFee')

const INITIAL_STATE = {
    tokens: {},
    registry: null,
    regFee: [-1, 'EOS'],
    txFee: null,

    regResult: null,
    transferResult: null,
    pricesResult: null,
}

export const bridgeReducer = makeReducer({
    'BRIDGE.SET_TOKENS': reduceSetKey('tokens'),
    'BRIDGE.SET_REGISTRY': reduceSetKey('registry'),
    'BRIDGE.SET_REG_FEE': reduceSetKey('regFee'),
    'BRIDGE.SET_TX_FEE': reduceSetKey('txFee'),
    'BRIDGE.REGISTER_SUCCESS': reduceSetKey('regResult'),
    'BRIDGE.TRANSFER_SUCCESS': reduceSetKey('transferResult'),
    'BRIDGE.UPDATE_PRICES_SUCCESS': reduceSetKey('pricesResult'),
}, INITIAL_STATE)