import { combineReducers } from 'redux'
import {bridgeReducer} from "modules/dapp-bridge";
import {notificationReducer} from "shared/dapp-common/components/Notification"
import {actionStatusReducer} from 'shared/dapp-common/components/ActionButton'
import {modalReducer} from "shared/dapp-common/components/Modal";
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