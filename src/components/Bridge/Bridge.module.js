import {makeReducer, reduceSetKey} from "utils/reduxUtils";
import _ from "lodash";
import {accountSelector} from "store/accounts";
import config from 'config/bridge.dev.json'

export const makeBridgeController = (controllers, {registerOn}) => {

    const getHandler = (chainKey, method, state) => {
        const ctrl = controllers[chainKey]
        if (!_.isFunction(ctrl[method])) {
            throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
        }
        const account = accountSelector(chainKey)(state)
        return [ctrl[method], account]
    }

    // CONFIG
    // const init = () => async (dispatch, getState) => {
    //     const [handler, account] = getHandler(registerOn, 'init', getState())
    //     dispatch({
    //         type: 'BRIDGE.INIT',
    //         payload: {}
    //     })
    // }

    const fetchSupportedTokens = () => async (dispatch, getState) => {
        const {contract, supportedContracts = []} = config

        const tokenSets = await Promise.all(
            _.map([contract, ...supportedContracts], async c => {
                const [handler, account] = getHandler(registerOn, 'fetchSupportedTokens', getState())
                return await handler(account, c)
            })
        )

        const tokens = _.keyBy(_.flatten(tokenSets), 'symbol')

        dispatch({
            type: 'BRIDGE.SET_TOKENS',
            payload: tokens,
        })
    }

    // REGISTER
    const fetchRegistry = () => async (dispatch, getState) => {
        const [handler, account] = getHandler(registerOn, 'fetchRegistry', getState())

        const registry = await handler(account)
        dispatch({
            type: 'BRIDGE.SET_REGISTRY',
            payload: registry || {}
        })
    }

    const fetchRegFee = () => async (dispatch, getState) => {
        const [handler, account] = getHandler(registerOn, 'fetchRegFee', getState())

        const fee = await handler(account)
        dispatch({
            type: 'BRIDGE.SET_REG_FEE',
            payload: fee
        })
    }

    const register = (newAddress, regFee, isModify) => async (dispatch, getState) => {
        const [handler, account] = getHandler(registerOn, 'register', getState())

        const result = await handler(account, newAddress, regFee, isModify)
        dispatch({
            type: 'BRIDGE.REGISTER_SUCCESS',
            payload: result
        })
    }

    // TRANSFER
    const fetchTransferFee = (fromChain, token) => async (dispatch, getState) => {
        const [handler, account] = getHandler(fromChain, 'fetchTransferFee', getState())

        const fee = await handler(account, token)
        dispatch({
            type: 'BRIDGE.SET_TX_FEE',
            payload: fee
        })
    }

    const transfer = (fromChain, amount, token) => async (dispatch, getState) => {
        const [handler, account] = getHandler(fromChain, 'transfer', getState())

        const result = await handler(account, amount, token)
        dispatch({
            type: 'BRIDGE.TRANSFER_SUCCESS',
            payload: result
        })
    }

    const updatePrices = () => async (dispatch, getState) => {
        const [handler, account] = getHandler(registerOn, 'updatePrices', getState())

        const result = await handler(account)
        dispatch({
            type: 'BRIDGE.UPDATE_PRICES_SUCCESS',
            payload: result
        })
    }

    return {
        fetchSupportedTokens,
        fetchRegistry,
        fetchRegFee,
        register,
        updatePrices,

        fetchTransferFee,
        transfer,
    }
}

// selectors
export const bridgeSelector = state => _.get(state, 'bridge')
export const registrySelector = state => _.get(state, 'bridge.registry')
export const regFeeSelector = state => _.get(state, 'bridge.regFee')
export const txFeeSelector = state => _.get(state, 'bridge.txFee')

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