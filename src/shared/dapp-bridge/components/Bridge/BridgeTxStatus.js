import React from 'react'
import _ from 'lodash'
import {useSelector} from "react-redux"
import {bridgeSelector} from "shared/dapp-bridge/dapp-bridge"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCheck, faMinus, faTimes} from '@fortawesome/free-solid-svg-icons'
import classNames from "classnames";
import ClipLoader from "react-spinners/ClipLoader"
import {chainSelector} from "shared/dapp-core";

const StatusMarker = ({status}) => {

    const renderMarker = () => {
        switch (status) {
            case 'loading':
                return <ClipLoader color={"#b5b5b5"} loading={true} size={16} />
            case 'done':
                return <FontAwesomeIcon icon={faCheck}/>
            default:
                return <FontAwesomeIcon icon={faMinus}/>
        }
    }

    return <span className={classNames("marker", status)}>{renderMarker()}</span>
}

const BridgeTxStatus = ({controller}) => {

    const {txStatus} = useSelector(bridgeSelector)
    const {active, deposited, depositTxId, received, receivedTxId, fromChainKey, toChainKey} = txStatus

    const fromChain = useSelector(chainSelector(fromChainKey))
    const toChain = useSelector(chainSelector(toChainKey))

    if (!active || _.isNil(fromChain) || _.isNil(toChain)) return null

    let s1 = 'loading', s2 = '', s3 = '', isBridging = false

    if (deposited) {
        s1 = 'done'
        s2 = 'loading'
        isBridging = true
    }
    if (received) {
        s1 = 'done'
        s2 = 'done'
        s3 = 'done'
        isBridging = false
    }

    const hideReceivedTxId = toChainKey === 'EOS'

    const getExplorerLink = (chainKey, txId) => {
        return chainKey === 'EOS'
            ? `https://bloks.io/transaction/${txId}`
            : `https://etherscan.io/tx/${txId}`
    }

    return (
        <div className="tx-status">
            <div className={classNames("center-aligned-row status-row done")}>
                <StatusMarker status={s1}/> Deposit on {fromChain.name}
            </div>
            {deposited && (
                <div className="tx-id">TX: <a target="_blank" rel="noreferrer" href={getExplorerLink(fromChainKey, depositTxId)}>{depositTxId}</a></div>
            )}
            <div className={classNames("center-aligned-row status-row loading")}>
                <StatusMarker status={s2}/> Bridge to {toChain.name} {isBridging && <span className="small-text">This might take a few minutes</span>}
            </div>
            <div className={classNames("center-aligned-row status-row")}>
                <StatusMarker status={s3}/> Receive on {toChain.name}
            </div>
            {!hideReceivedTxId && received && (
                <div className="tx-id">TX: <a target="_blank" rel="noreferrer" href={getExplorerLink(toChainKey, receivedTxId)}>{receivedTxId}</a></div>
            )}
            <div className="close-icon">
                <FontAwesomeIcon icon={faTimes} onClick={() => controller.clearTxStatus()}/>
            </div>
        </div>
    )
}

export default BridgeTxStatus