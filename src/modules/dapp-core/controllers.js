import {makeReducer} from "shared/dapp-common/utils/reduxUtils";
import _ from 'lodash'

export const setControllers = (ctrlName, ctrl) => ({
    type: 'DAPP.CORE.SET_CTRL',
    payload: {ctrlName, ctrl}
})

export const ctrlSelector = ctrlName => state => _.get(state, ['controllers', ctrlName])

export const controllersReducer = makeReducer({
    'DAPP.CORE.SET_CTRL': (state, action) => {
        const {ctrlName, ctrl} = action.payload
        return {
            ...state,
            [ctrlName]: ctrl,
        }
    }
}, {})