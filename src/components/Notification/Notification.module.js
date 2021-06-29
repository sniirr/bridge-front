import {makeReducer} from "modules/utils"

const INITIAL_STATE = {
    text: '',
    type: ''
}

export const notificationReducer = makeReducer({
    'NOTIFICATION.SHOW': (state, action) => ({
        ...state,
        ...action.payload,
    }),
    'NOTIFICATION.REMOVE': () => INITIAL_STATE,
}, INITIAL_STATE)