import {makeReducer, reduceSetFull} from "shared/dapp-common/utils/reduxUtils";
import _ from 'lodash'

export const setChains = chains => ({
    type: 'DAPP.CORE.SET_CHAINS',
    payload: chains
})

export const updateChain = (chainKey, chain) => ({
    type: 'DAPP.CORE.UPDATE_CHAIN',
    payload: {chainKey, chain}
})

export const chainsSelector = state => _.get(state, 'chains')
export const chainSelector = chainKey => state => _.get(state, ['chains', chainKey])

export const chainsReducer = makeReducer({
    'DAPP.CORE.SET_CHAINS': reduceSetFull,
    'DAPP.CORE.UPDATE_CHAIN': (state, action) => {
        const {chainKey, chain} = action.payload
        return {
            ...state,
            [chainKey]: {
                ..._.get(state, chainKey, {}),
                ...chain
            },
        }
    }
}, {})