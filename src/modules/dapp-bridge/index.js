import {makeReducer, reduceSetKey, reduceUpdateKey} from "utils/reduxUtils";
import _ from "lodash";
import {chainCoreSelector} from "modules/dapp-core";
import config from 'config/bridge.json'
import {showNotification} from "modules/utils";
import CHAINS from "config/chains.json";
import {clearActionStatus, setActionPending} from "store/actionStatusReducer";

export const BRIDGE_REGISTRY_ERROR = {
    NOT_READY: 0,
    NOT_REGISTERED: 1,
    ACCOUNT_MISMATCH: 2,
}

export const initBridge = (controllers, {registerOn}, coreController) => {

    const getHandler = (chainKey, method, state) => {
        const ctrl = controllers[chainKey]
        if (!_.isFunction(ctrl[method])) {
            throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
        }
        const chain = chainCoreSelector(chainKey)(state)
        return [ctrl[method], chain]
    }

    // INIT
    const init = chainKey => async (dispatch, getState) => {
        const [handler, chain] = getHandler(chainKey, 'init', getState())

        try {
            const update = await handler(chain)
            dispatch({
                type: 'DAPPCORE.UPDATE_CHAIN',
                payload: {
                    chainKey,
                    update,
                }
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Init failed'}))
        }
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

    const awaitRegister = chainKey => (dispatch, getState) => {
        const [handler, chain] = getHandler(chainKey, 'awaitRegister', getState())
        handler(chain, registry => {
            dispatch({
                type: 'BRIDGE.SET_REGISTRY',
                payload: registry,
            })
            dispatch(clearActionStatus('register'))
            dispatch(showNotification({type: 'success', text: `Registered successfully`}))
        })
    }

    const register = (newAddress, regFee, isModify) => async (dispatch, getState) => {
        const [handler, chain] = getHandler(registerOn, 'register', getState())

        try {
            dispatch(setActionPending('register'))
            const result = await handler(chain, newAddress, regFee, isModify)
            // dispatch({
            //     type: 'BRIDGE.REGISTER_SUCCESS',
            //     payload: result
            // })
            dispatch(awaitRegister(registerOn))
        }
        catch (e){
            console.error(e)
            dispatch(clearActionStatus('register'))
            dispatch(showNotification({type: 'error', text: e.message || e}))
        }
    }

    const isRegisteredSelector = state => {
        const [selector, ] = getHandler(registerOn, 'isRegisteredSelector', state)

        return selector(state)
    }

    // TRANSFER
    const fetchTransferFee = (token) => async (dispatch, getState) => {
        const [handler, chain] = getHandler(registerOn, 'fetchTransferFee', getState())

        try {
            const fee = await handler(chain, token)
            dispatch({
                type: 'BRIDGE.SET_TX_FEE',
                payload: fee || {}
            })
        }
        catch (e) {
            console.error(e)
            dispatch(showNotification({type: 'error', text: 'Failed to fetch transaction fee'}))
        }
    }

    const awaitDeposit = (chainKey, token) => (dispatch, getState) => {
        const [handler, chain] = getHandler(chainKey, 'awaitDeposit', getState())
        handler(chain, token, payload => {
            dispatch({
                type: 'BRIDGE.SET_TX_STATUS',
                payload,
            })
            dispatch(clearActionStatus('transfer'))
            dispatch(coreController.fetchBalance(chainKey, token))
        })
    }

    const awaitReceived = (fromChainKey, toChainKey, token) => (dispatch, getState) => {
        const state = getState()
        const [handler, chain] = getHandler(toChainKey, 'awaitReceived', state)
        const fromChain = chainCoreSelector(fromChainKey)(state)
        handler(chain, fromChain, token, payload => {
            dispatch({
                type: 'BRIDGE.SET_TX_STATUS',
                payload,
            })
            dispatch(coreController.fetchBalance(toChainKey, token))
        })
    }

    const clearTxStatus = () => ({type: 'BRIDGE.CLEAR_TX_STATUS'})

    const transfer = (fromChain, toChain, amount, token, infiniteApproval) => async (dispatch, getState) => {
        const [handler, chain] = getHandler(fromChain, 'transfer', getState())

        try {
            dispatch(setActionPending('transfer'))
            const response = await handler(chain, amount, token, infiniteApproval)

            // const response = {transaction_id :'skdfhskdhfkjsdhf'}

            dispatch({
                type: 'BRIDGE.SET_TX_STATUS',
                payload: {depositTxId: response?.transaction_id, active: true, fromChainKey: fromChain, toChainKey: toChain}
            })

            dispatch(awaitDeposit(fromChain, token))
            dispatch(awaitReceived(fromChain, toChain, token))
        }
        catch (e) {
            console.error(e)
            dispatch(clearTxStatus())
            dispatch(clearActionStatus('transfer'))
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
        init,
        fetchSupportedTokens,
        fetchRegistry,
        fetchRegFee,
        register,
        isRegisteredSelector,

        updatePrices,

        fetchTransferFee,
        transfer,
        clearTxStatus,
    }
}

// selectors
export const bridgeSelector = state => _.get(state, 'bridge')
export const regFeeSelector = state => _.get(state, 'bridge.regFee')

const INITIAL_STATE = {
    tokens: {},
    registry: null,
    regFee: [-1, 'EOS'],
    txFee: {},
    txStatus: {
        active: false,
        deposited: false,
        depositTxId: '',
        received: false,
        receivedTxId: '',
        // active: true,
        // deposited: true,
        // depositTxId: 'dlskjflsdjflsjdflksjdf',
        // received: true,
        // receivedTxId: 'sdlfjsldlsjflksdjflksdjf',
    },

    regResult: null,
    transferResult: null,
    pricesResult: null,
}

export const bridgeReducer = makeReducer({
    'BRIDGE.SET_TOKENS': reduceSetKey('tokens'),
    'BRIDGE.SET_REGISTRY': reduceSetKey('registry'),
    'BRIDGE.SET_REG_FEE': reduceSetKey('regFee'),
    'BRIDGE.SET_TX_FEE': reduceSetKey('txFee'),
    'BRIDGE.SET_TX_STATUS': reduceUpdateKey('txStatus'),
    'BRIDGE.CLEAR_TX_STATUS': state => ({
        ...state,
        txStatus: INITIAL_STATE.txStatus,
        // active: false,
    }),

    'BRIDGE.REGISTER_SUCCESS': reduceSetKey('regResult'),
    'BRIDGE.TRANSFER_SUCCESS': reduceSetKey('transferResult'),
    'BRIDGE.UPDATE_PRICES_SUCCESS': reduceSetKey('pricesResult'),
}, INITIAL_STATE)