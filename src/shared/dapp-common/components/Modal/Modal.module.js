import _ from 'lodash'
import {makeReducer} from "shared/dapp-common/utils/reduxUtils";

export const showModal = (modalType, modalProps) => ({
    type: 'DAPP.MODAL.SHOW',
    payload: {modalType, modalProps}
})

export const hideModal = () => ({
    type: 'DAPP.MODAL.HIDE',
})

export const modalSelector = state => _.get(state, 'modal', {})
export const modalPropsSelector = state => _.get(state, 'modal.modalProps', {})

const INITIAL_STATE = {
    visible: true,
}

export const modalReducer = makeReducer({
    'DAPP.MODAL.SHOW': (state, action) => ({
        visible: true,
        ...action.payload,
    }),
    'DAPP.MODAL.HIDE': () => ({
        visible: false
    }),
}, INITIAL_STATE)