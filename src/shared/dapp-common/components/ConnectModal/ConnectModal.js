import React, {useEffect, useState} from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import {useDispatch, useSelector} from "react-redux";
import './ConnectModal.scss'
import useOnLogin from "shared/dapp-common/hooks/useOnLogin"
import Modal, {hideModal} from "shared/dapp-common/components/Modal";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faChevronRight, faTimes} from '@fortawesome/free-solid-svg-icons'
import {ctrlSelector, accountsSelector, chainsSelector} from "shared/dapp-core";
import {showNotification} from "shared/dapp-common/utils/utils";

const ConnectModal = ({activeChains}) => {

    const dispatch = useDispatch()

    const controller = useSelector(ctrlSelector('core'))
    const accounts = useSelector(accountsSelector)
    const chains = useSelector(chainsSelector)

    const [selectedChain, setSelectedChain] = useState('')

    const hasSelectedChain = !_.isEmpty(selectedChain)
    const isSingleChain = _.size(activeChains) === 1

    const closeModal = () => dispatch(hideModal())

    useEffect(() => {
        setSelectedChain(isSingleChain ? activeChains[0] : '')
    }, [activeChains])

    useOnLogin(selectedChain, () => {
        if (isSingleChain) {
            closeModal()
        }
        else {
            setSelectedChain('')
        }
    })

    if (_.isEmpty(chains)) {
        dispatch(showNotification({type: 'error', text: 'Metamask not found, please install the extension and refresh to proceed'}))
        return null
    }

    const renderContent = () => {
        if (!hasSelectedChain) {
            // multiple chains - render chain selection first
            return _.map(activeChains, chainKey => {
                const address = _.get(accounts, [chainKey, 'address'])
                const {name: chainName} = _.get(chains, chainKey)
                const isConnected = !_.isEmpty(address)
                return (
                    <div key={`connect-chain-${chainKey}`} className={classNames("chain", {'not-connected': !isConnected})}
                         onClick={() => !isConnected && setSelectedChain(chainKey)}>
                        <div className="name">
                            <div className="round-bg">
                                <div className={`wallet-icon ${_.toLower(chainKey)}`}/>
                                {/*<img src={`images/${_.toUpper(chainKey)}.svg`} alt={chainKey}/>*/}
                            </div>
                            <div className="info">
                                <div>{chainName}</div>
                                <div className="account-name">
                                    {isConnected ? address : "Not Connected"}
                                </div>
                            </div>
                        </div>
                        {isConnected ? (
                            <span className="logout" onClick={() => controller.logout(chainKey)}>
                                <FontAwesomeIcon title="Disconnect" icon={faTimes}/>
                            </span>
                        ) : <FontAwesomeIcon icon={faChevronRight}/>}
                    </div>
                )
            })
        }

        return (
            <div className="connectors">
                {_.map(chains[selectedChain].connectors, (text, i) => {
                    return (
                        <div key={`connect-wallet-btn-${i}`} className="connector"
                             onClick={() => controller.connect(selectedChain, {providerIdx: i})}>
                            <div className="name">
                                <div className={`wallet-icon ${_.toLower(text)}`}/>
                                <span>{text}</span>
                            </div>
                            <FontAwesomeIcon icon={faChevronRight}/>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Modal className="connect-modal" title={!hasSelectedChain ? 'Accounts' : `Connect ${selectedChain} account`}>
            {renderContent()}
            {!isSingleChain && hasSelectedChain && (
                <div className="modal-buttons">
                    <div className="button" onClick={() => setSelectedChain('')}>
                        Back
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default ConnectModal
