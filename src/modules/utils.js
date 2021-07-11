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
    const chain = !_.isEmpty(state) ? _.get(state, ['chains', chainKey], {}) : null
    const account = !_.isEmpty(state) ? _.get(state, ['accounts', chainKey], {}) : null
    return [ctrl[method], chain, account]
}

export const showNotification = ({ type, text }) => ({
    type: 'NOTIFICATION.SHOW',
    payload: {type, text}
})

export const removeNotification = () => ({
    type: 'NOTIFICATION.REMOVE'
})
