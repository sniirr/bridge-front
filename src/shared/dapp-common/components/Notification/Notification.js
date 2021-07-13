import React, { useEffect } from 'react'
import './Notification.scss'
import { useSelector, useDispatch } from 'react-redux'
import {removeNotification} from 'shared/dapp-common/utils/utils'
import classNames from "classnames";
import _ from "lodash";

const Notification = () => {

    const dispatch = useDispatch()
    const {text, type} = useSelector(state => _.get(state, 'notification'))

    const visible = !!type

    useEffect(() => {
        if(visible) {
            setTimeout(() => {
                dispatch(removeNotification())
            }, 5000)
        }
    }, [visible])

    return !!type ? (
        <div className={classNames("notification", type)}>{text}</div>
    ) : null
}

export default Notification