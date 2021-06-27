import {makeReducer, reduceSetKey} from "utils/reduxUtils";
import _ from "lodash";
import {accountSelector} from "store/accounts";

export const fetchRegistry = (chainKey, ctrl) => async (dispatch, getState) => {
    if (!_.isFunction(ctrl.fetchRegistry)) {
        console.error(`NotImplementedError: fetchRegistry is not implemented for ${chainKey}`)
        return
    }
    const state = getState()
    const account = accountSelector(chainKey)(state)

    const registry = await ctrl.fetchRegistry(account)
    dispatch({
        type: 'BRIDGE.SET_REGISTRY',
        payload: registry || {}
    })
}

export const fetchRegFee = (chainKey, ctrl) => async (dispatch, getState) => {
    if (!_.isFunction(ctrl.fetchRegFee)) {
        console.error(`NotImplementedError: fetchRegFee is not implemented for ${chainKey}`)
        return
    }
    const state = getState()
    const account = accountSelector(chainKey)(state)

    const fee = await ctrl.fetchRegFee(account)
    dispatch({
        type: 'BRIDGE.SET_REG_FEE',
        payload: fee
    })
}

export const register = (chainKey, ctrl, newAddress, regFee) => async (dispatch, getState) => {
    if (!_.isFunction(ctrl.register)) {
        console.error(`NotImplementedError: register is not implemented for ${chainKey}`)
        return
    }
    const state = getState()
    const account = accountSelector(chainKey)(state)

    const result = await ctrl.register(account, newAddress, regFee)
    dispatch({
        type: 'BRIDGE.REGISTER_SUCCESS',
        payload: result
    })
}

export const registrySelector = state => _.get(state, 'bridge.registry')
export const regFeeSelector = state => _.get(state, 'bridge.regFee')

const INITIAL_STATE = {
    registry: null,
    regFee: [-1, 'EOS'],
    regResult: null
}

export const bridgeReducer = makeReducer({
    'BRIDGE.SET_REGISTRY': reduceSetKey('registry'),
    'BRIDGE.SET_REG_FEE': reduceSetKey('regFee'),
    'BRIDGE.REGISTER_SUCCESS': reduceSetKey('regResult'),
}, INITIAL_STATE)