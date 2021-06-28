import _ from 'lodash'
import React, {useEffect, useState} from 'react'
import {CheckCircleOutlineTwoTone, SwapHoriz} from '@material-ui/icons'
import {Button} from '@material-ui/core'
import './Bridge.scss'
import {useDispatch, useSelector} from "react-redux"
import Slider from 'rc-slider'
import {showConnectModal} from "components/ConnectModal"
import {accountsSelector, balanceSelector, fetchBalance} from "store/accounts"
import useOnLogin from "hooks/useOnLogin";
import TOKENS from 'config/tokens.dev.json'
import {amountToAsset} from "utils/utils"
import Dropdown from 'components/Common/Dropdown'
import {isRegisteredSelector} from "components/Bridge/impl/Bridge.eos"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTimes, faAddressBook, faSync, faInfo} from '@fortawesome/free-solid-svg-icons'
import BridgeRegister from "./BridgeRegister"
import {bridgeSelector} from "components/Bridge/Bridge.module";

const Bridge = ({controller = {}, connectControllers = {}, supportedChains = ['EOS', 'ETH'], supportedTokens = ['USDC', 'DAPP'], registerOn = 'EOS'}) => {

    const dispatch = useDispatch()

    // accounts
    const connectedAccounts = useSelector(accountsSelector)
    const [amount, setAmount] = useState('0')

    // chain
    const [chains, setChains] = useState(supportedChains)
    const fromChain = chains[0]
    const toChain = chains[1]

    const {txFee, tokens} = useSelector(bridgeSelector)
    // token
    const [selectedSymbol, setSelectedSymbol] = useState(supportedTokens[0])
    const token = {
        ...TOKENS[selectedSymbol],
        ..._.get(tokens[selectedSymbol], fromChain === registerOn ? 'outToken' : 'inToken', {symbol: selectedSymbol, precision: 0})
    }
    //
    const balance = useSelector(balanceSelector(fromChain, token.symbol))

    const fromConnected = _.has(connectedAccounts, fromChain)
    const isConnected = fromConnected && _.has(connectedAccounts, toChain)
    const disabled = !isConnected

    // registry
    const {isRegistered} = useSelector(isRegisteredSelector)

    const [showModify, setShowModify] = useState(false)

    useOnLogin(fromChain, () => {
        dispatch(controller.fetchTransferFee(fromChain, token))
        dispatch(fetchBalance(fromChain, connectControllers[fromChain], token.symbol))
        if (registerOn === fromChain) {
            dispatch(controller.fetchRegistry())
            // TODO - move to "onLoad"
            dispatch(controller.fetchSupportedTokens())
        }
    })

    useEffect(() => {
        setAmount('0')
        dispatch(controller.fetchTransferFee(fromChain, token))
        if (fromConnected) {
            dispatch(fetchBalance(fromChain, connectControllers[fromChain], token.symbol))
        }
    }, [fromChain, selectedSymbol])

    const onSliderChange = value => {
        setAmount((balance * value / 100).toFixed(6))
    }

    const renderChainBox = (chainKey, direction) => {
        const isConnected = _.has(connectedAccounts, chainKey)

        const address = _.get(connectedAccounts, [chainKey, 'address'], 'Connected')
        return (
            <div key={`bridge-chain-${chainKey}`} className="chain-box">
                <div className="item">
                    <div className="item-title">{direction}</div>
                    <div className="item-text">{chainKey}</div>
                </div>
                <div className="center-aligned-row chain-connect">
                    {isConnected ? (
                        <>
                            <CheckCircleOutlineTwoTone/>
                            <span className="address" title={address}>{address}</span>
                        </>
                    ) : (
                        <Button color="secondary" onClick={() => dispatch(showConnectModal([chainKey]))}>Connect
                            Wallet</Button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="section bridge-panel">
            <div className="row chains-row">
                {renderChainBox(fromChain, 'From')}
                <div className="arrow" onClick={() => setChains([toChain, fromChain])}>
                    <SwapHoriz/>
                </div>
                {renderChainBox(toChain, 'To')}
            </div>
            {!showModify && (isRegistered || !isConnected) ? (
                <>
                    <div className="row center-aligned-row">
                        <div className="item item-group">
                            <div className="item-title">Token</div>
                            <div className="item-text">
                                <Dropdown id="token-select" withCaret={true}
                                          items={_.map(supportedTokens, t => ({name: t}))}
                                          onItemClick={({name: symbol}) => {setSelectedSymbol(symbol)}}>
                                    {selectedSymbol}
                                </Dropdown>
                            </div>
                        </div>
                        <div className="slider">
                            <Slider disabled={disabled} marks={{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}}
                                    value={Math.round(amount / balance * 100)}
                                    onChange={onSliderChange}
                            />
                        </div>
                    </div>
                    <div className="row input-container">
                        <div className="item">
                            <div className="item-title">
                                <span>Amount</span>
                                <span>
                                  Max: <span className="max-balance"
                                             onClick={() => !disabled && setAmount(balance.toFixed(token.precision))}>
                                      {amountToAsset(balance, token, false, true)}
                                  </span>
                              </span>
                            </div>
                            <div className="item-input">
                                <input disabled={disabled} type="text" className="input" value={amount}
                                       onChange={e => setAmount(parseFloat(e.target.value).toFixed(6))}/>
                            </div>
                        </div>
                    </div>
                    <div className="row center-aligned-spaced-row" style={{textAlign: 'right'}}>
                        <span className="info-message">
                            {!_.isEmpty(txFee) && `Transaction Fee ${txFee}`}
                        </span>
                        <Button disabled={disabled} variant="contained" color="default"
                                onClick={() => dispatch(controller.transfer(fromChain, amount, token))}>
                            Send Tokens
                        </Button>
                    </div>
                </>
            ) : (
                <BridgeRegister controller={controller} isModify={showModify}/>
            )}
            <div className="toolbar">
                {showModify && (
                    <FontAwesomeIcon icon={faTimes} onClick={() => setShowModify(false)}/>
                )}
                {!showModify && isConnected && isRegistered && (
                    <FontAwesomeIcon icon={faAddressBook} title="Change registered Ethereum address"
                                     onClick={() => setShowModify(true)}/>
                )}
                <FontAwesomeIcon icon={faSync} title="Refresh fees" onClick={() => dispatch(controller.updatePrices())}/>
                <FontAwesomeIcon icon={faInfo} title="DAPP Bridge guide" onClick={() => console.log('guide')}/>
            </div>
        </div>
    )
}

export default Bridge