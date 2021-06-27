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

export const registrySelector = state => _.get(state, 'bridge.registry', {})

const INITIAL_STATE = {
    registry: null,
}

export const bridgeReducer = makeReducer({
    'BRIDGE.SET_REGISTRY': reduceSetKey('registry'),
}, INITIAL_STATE)