import _ from "lodash";

export const makeReducer = (actionHandlers={}, initialState={}, globalReset = true) => (state=initialState, action) => {
    if (action.type === 'RESET_STATE' && globalReset) {
        return  initialState
    }
    if (_.isFunction(actionHandlers[action.type])) {
        return actionHandlers[action.type](state, action)
    }
    return state
}

export const getHandler = (controllers, chainKey, method, state) => {
    const ctrl = controllers[chainKey]
    if (!_.isFunction(ctrl[method])) {
        throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
    }
    const connector = _.get(state, ['dappcore', chainKey], {})
    return [ctrl[method], connector]
}