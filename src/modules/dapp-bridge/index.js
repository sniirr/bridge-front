import {makeReducer, reduceSetKey, reduceUpdateKey} from "utils/reduxUtils";
import _ from "lodash";
import {chainCoreSelector} from "modules/dapp-core";
import config from 'config/bridge.json'
import {showNotification} from "modules/utils";
import {clearActionStatus, setActionPending} from "store/actionStatusReducer";

export const BRIDGE_REGISTRY_ERROR = {
    NOT_READY: 0,
    NOT_REGISTERED: 1,
    ACCOUNT_MISMATCH: 2,
}

export const initBridge = (controllers, {registerOn}) => (dispatch, getState) => {

    const coreController = _.get(getState(), 'controllers.core')

    if (_.isNil(coreController)) {
        console.error(`Failed to initBridge - coreController must be initialized before calling initBridge`)
    }

    const getHandler = (chainKey, method, state) => {
        const ctrl = controllers[chainKey]
        if (!_.isFunction(ctrl[method])) {
            throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
        }
        const chain = chainCoreSelector(chainKey)(state)
        return [ctrl[method], chain]
    }

    // INIT
    const init = async chainKey => {
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
    const fetchSupportedTokens = async () => {
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
    const fetchRegistry = async () => {
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

    const fetchRegFee = async () => {
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

    const awaitRegister = chainKey => {
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

    const register = async (newAddress, regFee, isModify) => {
        const [handler, chain] = getHandler(registerOn, 'register', getState())

        try {
            dispatch(setActionPending('register'))
            await handler(chain, newAddress, regFee, isModify)
            awaitRegister(registerOn)
            // dispatch(awaitRegister(registerOn))
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
    const fetchTransferFee = async token => {
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

    const awaitDeposit = (chainKey, token) => {
        const [handler, chain] = getHandler(chainKey, 'awaitDeposit', getState())

        try {
            handler(chain, token, payload => {
                dispatch({
                    type: 'BRIDGE.SET_TX_STATUS',
                    payload,
                })
                dispatch(clearActionStatus('transfer'))
                coreController.fetchBalance(chainKey, token)
                // dispatch(coreController.fetchBalance(chainKey, token))
            })
        }
        catch (e) {
            console.error(e)
            // dispatch(clearTxStatus())
            // dispatch(clearActionStatus('transfer'))
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const awaitReceived = (fromChainKey, toChainKey, token) => {
        const state = getState()
        const [handler, chain] = getHandler(toChainKey, 'awaitReceived', state)
        const fromChain = chainCoreSelector(fromChainKey)(state)

        try {
            handler(chain, fromChain, token, payload => {
                dispatch({
                    type: 'BRIDGE.SET_TX_STATUS',
                    payload,
                })
                coreController.fetchBalance(toChainKey, token)
                // dispatch(coreController.fetchBalance(toChainKey, token))
            })
        }
        catch (e) {
            console.error(e)
            // dispatch(clearTxStatus())
            // dispatch(clearActionStatus('transfer'))
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const clearTxStatus = () => ({type: 'BRIDGE.CLEAR_TX_STATUS'})

    const transfer = async (fromChain, toChain, amount, token, infiniteApproval) => {
        const [handler, chain] = getHandler(fromChain, 'transfer', getState())

        try {
            dispatch(setActionPending('transfer'))
            const response = await handler(chain, amount, token, infiniteApproval)

            dispatch({
                type: 'BRIDGE.SET_TX_STATUS',
                payload: {depositTxId: response?.transaction_id, active: true, fromChainKey: fromChain, toChainKey: toChain}
            })

            awaitDeposit(fromChain, token)
            awaitReceived(fromChain, toChain, token)

            // dispatch(awaitDeposit(fromChain, token))
            // dispatch(awaitReceived(fromChain, toChain, token))
        }
        catch (e) {
            console.error(e)
            dispatch(clearTxStatus())
            dispatch(clearActionStatus('transfer'))
            dispatch(showNotification({type: 'error', text: e.message}))
        }
    }

    const updatePrices = async () => {
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

    const ctrl = {
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

    dispatch({
        type: 'DAPP.CORE.SET_CTRL',
        payload: {
            ctrlName: 'bridge',
            ctrl,
        }
    })

    return ctrl
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
    }),
    'BRIDGE.REGISTER_SUCCESS': reduceSetKey('regResult'),
    'BRIDGE.TRANSFER_SUCCESS': reduceSetKey('transferResult'),
    'BRIDGE.UPDATE_PRICES_SUCCESS': reduceSetKey('pricesResult'),
}, INITIAL_STATE)