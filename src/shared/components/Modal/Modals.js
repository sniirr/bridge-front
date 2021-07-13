import React from "react"
import _ from 'lodash'
import {useSelector} from "react-redux";
import {modalSelector} from "shared/components/Modal/Modal.module";
import 'shared/components/Modal/Modal.scss'

export const Modals = ({modals}) => {

    const {visible, modalType, modalProps} = useSelector(modalSelector)

    if (visible) {
        const Modal = _.get(modals, modalType)
        if (!_.isNil(Modal)) {
            return React.cloneElement(Modal, modalProps)
        }
    }

    return null
}

export default Modals
