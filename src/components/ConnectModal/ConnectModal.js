import React, {useEffect, useState} from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import {useDispatch, useSelector} from "react-redux";
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@material-ui/core';
import {NavigateNext, Close} from '@material-ui/icons'
import {connectModalSelector, hideConnectModal} from './ConnectModal.module'
import {dappCoreSelector} from "modules/dapp-core"
import './ConnectModal.scss'
import useOnLogin from "hooks/useOnLogin"

const ConnectModal = ({config, controller}) => {

    const dispatch = useDispatch()

    const {visible, chains} = useSelector(connectModalSelector)
    const dappcore = useSelector(dappCoreSelector)

    const [selectedChain, setSelectedChain] = useState('')

    const hasSelectedChain = !_.isEmpty(selectedChain)
    const isSingleChain = _.size(chains) === 1

    const closeModal = () => dispatch(hideConnectModal())

    useEffect(() => {
        setSelectedChain(isSingleChain ? chains[0] : '')
    }, [chains])

    useOnLogin(selectedChain, () => {
        if (isSingleChain) {
            closeModal()
        }
        else {
            setSelectedChain('')
        }
    })

    const renderContent = () => {
        if (!hasSelectedChain) {
            // multiple chains - render chain selection first
            return _.map(chains, chainKey => {
                const address = _.get(dappcore, [chainKey, 'address'])
                const isConnected = !_.isEmpty(address)
                return (
                    <div key={`connect-chain-${chainKey}`} className={classNames("chain", {'not-connected': !isConnected})}
                         onClick={() => !isConnected && setSelectedChain(chainKey)}>
                        <div className="name">
                            <img src={`images/${_.toUpper(chainKey)}.svg`} alt={chainKey}/>
                            <div className="info">
                                <div>{chainKey}</div>
                                <div className="account-name">
                                    {isConnected ? address : "Not Connected"}
                                </div>
                            </div>
                        </div>
                        {isConnected ? (<span className="logout" onClick={() => dispatch(controller.logout(chainKey))}><Close/></span>) : <NavigateNext/>}
                    </div>
                )
            })
        }

        return (
            <div className="connectors">
                {_.map(config[selectedChain].connectors, (text, i) => {
                    return (
                        <div key={`connect-wallet-btn-${i}`} className="connector"
                             onClick={() => {
                                 dispatch(controller.connect(selectedChain, {providerIdx: i}))
                                 // dispatch(connect(selectedChain, handlers[selectedChain], {providerIdx: i}))
                             }}>
                            <div className="name">
                                <img className={`${_.toLower(text)}-icon`} src={`images/${_.toLower(text)}.svg`} alt={text}/>
                                <span>{text}</span>
                            </div>
                            <NavigateNext/>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Dialog open={visible}
                className="connect-modal"
                keepMounted={false}
                onClose={closeModal}>
            <DialogTitle>{!hasSelectedChain ? 'Accounts' : `Connect ${selectedChain} account`}</DialogTitle>
            <DialogContent>
                {renderContent()}
            </DialogContent>
            <DialogActions>
                {!isSingleChain && hasSelectedChain && (
                    <Button onClick={() => setSelectedChain('')}>
                        Back
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )

    // return (
    //     <div className="modal">
    //         <div className="modal-header">
    //             Connect to a Wallet
    //         </div>
    //         <div className="modal-content">
    //             {renderContent()}
    //         </div>
    //         <div className="modal-footer">
    //             <Button onClick={closeModal} color="primary">
    //                 Cancel
    //             </Button>
    //         </div>
    //     </div>
    // )
}

export default ConnectModal
