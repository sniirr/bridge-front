import React from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {useDispatch, useSelector} from "react-redux";
import {hideModal} from "shared/components/Modal/Modal.module";

const Modal = ({className, title, children}) => {

    const dispatch = useDispatch()
    const {visible} = useSelector(state => _.get(state, 'modal', {}))

    const close = () => dispatch(hideModal())

    return visible ? (
        <>
            <div className="modal-backdrop" onClick={close}/>
            <div className={classNames("modal-container", className)}>
                <div className="close" onClick={close}>
                    <FontAwesomeIcon icon={faTimes}/>
                </div>
                <div className={classNames("modal", className)}>
                    {!_.isEmpty(title) && <div className="modal-header">{title}</div>}
                    <div className="modal-content">
                        {children}
                    </div>
                </div>
            </div>
        </>
    ) : null
}

export default Modal