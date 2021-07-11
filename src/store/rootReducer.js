import { combineReducers } from 'redux'
import {dappReducer} from "modules/dapp-core"
import {bridgeReducer} from "modules/dapp-bridge";
import {notificationReducer} from "components/Notification"
import {actionStatusReducer} from './actionStatusReducer'
import {modalReducer} from "shared/Modal";

export default combineReducers({
    dappcore: dappReducer,
    bridge: bridgeReducer,
    notification: notificationReducer,
    modal: modalReducer,
    actionStatus: actionStatusReducer,
})