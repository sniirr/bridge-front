import React from 'react'
import classNames from "classnames";
import {useSelector} from "react-redux";
import {isActionPendingSelector} from "./ActionButton.module";
import BeatLoader from 'react-spinners/BeatLoader'

const ActionButton = ({actionKey, className, onClick, disabled, children, ...props}) => {

    const isPending = useSelector(isActionPendingSelector(actionKey))

    const clickHandler = () => !isPending && !disabled && onClick()

    return (
        <div className={classNames("button", actionKey, className, {disabled: disabled || isPending})} onClick={clickHandler} {...props}>
            {isPending ? (<BeatLoader color={"#fff"} loading={true} size={10} />) : (<div className="button-content">{children}</div>)}
        </div>
    )
}

export default ActionButton