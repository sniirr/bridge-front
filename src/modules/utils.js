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

export const getMethod = (controllers, chainKey, method) => {
    const ctrl = controllers[chainKey]
    if (!_.isFunction(ctrl[method])) {
        throw `NotImplementedError: ${method} is not implemented for ${chainKey}`
    }

    return ctrl[method]
}

export const getHandler = (controllers, chainKey, methodName, state, mapContext = () => ({})) => {
    const ctrl = controllers[chainKey]
    if (!_.isFunction(ctrl[methodName])) {
        throw `NotImplementedError: ${methodName} is not implemented for ${chainKey}`
    }
    const method = getMethod(controllers, chainKey, methodName)

    const chain = !_.isEmpty(state) ? _.get(state, ['chains', chainKey], {}) : null
    const account = !_.isEmpty(state) ? _.get(state, ['accounts', chainKey], {}) : null
    const tokens = !_.isEmpty(state) ? _.get(state, 'tokens', {}) : null

    const context = {
        chain,
        account,
        tokens,
        ...mapContext(state),
    }

    return {
        handler: method(context),
        context,
    }
}

export const showNotification = ({ type, text }) => ({
    type: 'NOTIFICATION.SHOW',
    payload: {type, text}
})

export const removeNotification = () => ({
    type: 'NOTIFICATION.REMOVE'
})
