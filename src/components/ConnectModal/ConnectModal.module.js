import _ from 'lodash'
import {makeReducer} from "utils/reduxUtils"

// ACTIONS
export const showConnectModal = chains => ({
    type: 'CONNECT_MODAL.SHOW',
    payload: {chains},
})

export const hideConnectModal = () => ({
    type: 'CONNECT_MODAL.HIDE',
})

// SELECTORS
export const connectModalSelector = state => _.get(state, 'connectModal')

// REDUCER
const INITIAL_STATE = {
    visible: false,
    chains: [],
}

export const connectModalReducer = makeReducer({
    'CONNECT_MODAL.SHOW': (state, action) => ({
        visible: true,
        chains: action.payload.chains,
    }),
    'CONNECT_MODAL.HIDE': () => INITIAL_STATE,
}, INITIAL_STATE)