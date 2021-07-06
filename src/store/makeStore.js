import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension'

import rootReducer from './rootReducer';

const logger = createLogger({
    predicate: (store, {type}) => {
        // console.log(action)
        return type !== 'BRIDGE.SET_TX_FEE'
    }
})

const makeStore = () => createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk, logger)))

export default makeStore