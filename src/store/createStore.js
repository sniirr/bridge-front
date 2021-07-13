import {createLogger} from 'redux-logger';
import {createDappStore} from "modules/dapp-core/redux";
import {bridgeReducer} from "modules/dapp-bridge"
import {notificationReducer} from "shared/dapp-common/components/Notification"
import {actionStatusReducer} from 'shared/dapp-common/components/ActionButton'
import {modalReducer} from "shared/dapp-common/components/Modal"

const logger = createLogger({
    predicate: (store, {type}) => {
        return type !== 'BRIDGE.SET_TX_FEE'
    }
})

const createStore = () => createDappStore({
    reducers: {
        bridge: bridgeReducer,
        notification: notificationReducer,
        modal: modalReducer,
        actionStatus: actionStatusReducer,
    },
    middleware: [logger],
})

export default createStore