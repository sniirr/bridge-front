import {makeReducer} from "shared/dapp-common/utils/reduxUtils";
import _ from 'lodash'

// ACTIONS
export const setActionPending = actionKey => ({
    type: 'DAPP.ACTION_STATUS.PENDING',
    payload: {actionKey}
})

export const clearActionStatus = actionKey => ({
    type: 'DAPP.ACTION_STATUS.CLEAR',
    payload: {actionKey}
})

// SELECTORS
export const actionStatusSelector = actionKey => state => _.get(state, ['actionStatus', actionKey], '')
export const isActionPendingSelector = actionKey => state => actionStatusSelector(actionKey)(state) === 'pending'

// REDUCER
export const actionStatusReducer = makeReducer({
    'DAPP.ACTION_STATUS.PENDING': (state, action) => {
        const {actionKey}= action.payload
        return {
            ...state,
            [actionKey]: 'pending',
        }
    },
    'DAPP.ACTION_STATUS.CLEAR': (state, action) => {
        const {actionKey}= action.payload
        return _.omit(state, actionKey)
    }
}, {})
