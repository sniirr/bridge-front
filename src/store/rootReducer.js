import { combineReducers } from 'redux'
import {connectModalReducer} from "components/ConnectModal"
import {dappReducer} from "modules/dapp-core"
import {bridgeReducer} from "modules/dapp-bridge";
import {notificationReducer} from "components/Notification"

export default combineReducers({
    dappcore: dappReducer,
    connectModal: connectModalReducer,
    bridge: bridgeReducer,
    notification: notificationReducer,
})