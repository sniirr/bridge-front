import { combineReducers } from 'redux'
import {dappReducer} from "modules/dapp-core"
import {bridgeReducer} from "modules/dapp-bridge";
import {notificationReducer} from "components/Notification"
import {actionStatusReducer} from './actionStatusReducer'
import {modalReducer} from "shared/Modal";
import {controllersReducer} from "modules/dapp-core/controllers";

export default combineReducers({
    dappcore: dappReducer,
    controllers: controllersReducer,
    bridge: bridgeReducer,
    notification: notificationReducer,
    modal: modalReducer,
    actionStatus: actionStatusReducer,
})