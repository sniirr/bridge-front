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

export const showNotification = ({ type, text }) => ({
    type: 'NOTIFICATION.SHOW',
    payload: {type, text}
})

export const removeNotification = () => ({
    type: 'NOTIFICATION.REMOVE'
})

export const generateError = (e, defaultMsg) => {

    try {
        let errorString = JSON.stringify(e)

        if (errorString && errorString.includes('assertion failure with message')) {
            let errorObj = JSON.parse(errorString)

            const msgObj = errorObj?.json?.error?.details[0]?.message

            if (typeof msgObj === 'string' && msgObj.includes(':')) {
                return msgObj.split(':')[1]
            }

            return defaultMsg
        }

        return defaultMsg
    } catch {
        return 'Something went wrong'
    }
}