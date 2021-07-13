import { combineReducers } from 'redux'
import {bridgeReducer} from "modules/dapp-bridge";
import {notificationReducer} from "components/Notification"
import {actionStatusReducer} from './actionStatusReducer'
import {modalReducer} from "shared/components/Modal";
import {controllersReducer, chainsReducer, accountsReducer, tokensReducer} from "modules/dapp-core";

export default combineReducers({
    accounts: accountsReducer,
    controllers: controllersReducer,
    tokens: tokensReducer,
    chains: chainsReducer,
    bridge: bridgeReducer,
    notification: notificationReducer,
    modal: modalReducer,
    actionStatus: actionStatusReducer,
})