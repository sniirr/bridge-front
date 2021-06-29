import _ from 'lodash'
import React, {useEffect, useState} from 'react'
import {CheckCircleOutlineTwoTone, SwapHoriz} from '@material-ui/icons'
import {Button} from '@material-ui/core'
import './Bridge.scss'
import {useDispatch, useSelector} from "react-redux"
import Slider from 'rc-slider'
import {showConnectModal} from "components/ConnectModal"
import {balanceSelector, chainCoreSelector} from "modules/dapp-core"
import useOnLogin from "hooks/useOnLogin";
import TOKENS from 'config/tokens.json'
import {amountToAsset} from "utils/utils"
import Dropdown from 'components/Common/Dropdown'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faTimes, faAddressBook, faSync, faInfo} from '@fortawesome/free-solid-svg-icons'
import BridgeRegister from "./BridgeRegister"
import {bridgeSelector} from "modules/dapp-bridge";

const Bridge = ({controller, coreController, supportedChains = ['EOS', 'ETH'], supportedTokens = ['USDC', 'DAPP'], registerOn = 'EOS'}) => {

    const dispatch = useDispatch()

    // chain
    const [chains, setChains] = useState(supportedChains)
    const fromChainKey = chains[0]
    const toChainKey = chains[1]

    // accounts
    const fromChain = useSelector(chainCoreSelector(fromChainKey))
    const toChain = useSelector(chainCoreSelector(toChainKey))
    const fromConnected = !_.isEmpty(fromChain?.address)
    const toConnected = !_.isEmpty(toChain?.address)
    const isConnected = fromConnected && toConnected
    const disabled = !isConnected
    const [amount, setAmount] = useState('0')

    // bridge
    const {txFee, tokens} = useSelector(bridgeSelector)

    // tokens
    const [selectedSymbol, setSelectedSymbol] = useState(supportedTokens[0])
    let token = {
        ...TOKENS[selectedSymbol],
        ..._.get(tokens[selectedSymbol], fromChainKey === registerOn ? 'outToken' : 'inToken', {symbol: selectedSymbol, precision: 0})
    }
    token = {
        ...token,
        ..._.get(TOKENS, token.symbol, {})
    }

    const {isRegistered} = useSelector(controller.isRegisteredSelector)
    const balance = useSelector(balanceSelector(fromChainKey, token.symbol))

    const [showModify, setShowModify] = useState(false)
    const [infiniteApproval, setInfiniteApproval] = useState(false)

    const {hasRpc} = useOnLogin(fromChainKey, () => {
        dispatch(coreController.fetchBalance(fromChainKey, token))
        // dispatch(fetchBalance(fromChainKey, connectControllers[fromChainKey], token))
        if (registerOn === fromChainKey) {
            dispatch(controller.fetchRegistry())
        }
    })

    useEffect(() => {
        if (hasRpc) {
            dispatch(controller.fetchSupportedTokens())
        }
    }, [hasRpc])

    useEffect(() => {
        if (!_.isEmpty(tokens)) {
            dispatch(controller.fetchTransferFee(fromChainKey, token))
        }
    }, [tokens])

    useEffect(() => {
        setAmount((0).toFixed(token.precision))
        dispatch(controller.fetchTransferFee(fromChainKey, token))
        if (fromConnected) {
            dispatch(coreController.fetchBalance(fromChainKey, token))
            // dispatch(fetchBalance(fromChainKey, connectControllers[fromChainKey], token))
        }
    }, [fromChainKey, selectedSymbol])

    const onSliderChange = value => {
        setAmount((balance * value / 100).toFixed(6))
    }

    const renderChainBox = (chainKey, direction) => {
        const address = direction === 'From' ? fromChain.address : toChain.address
        return (
            <div key={`bridge-chain-${chainKey}`} className="chain-box">
                <div className="item">
                    <div className="item-title">{direction}</div>
                    <div className="item-text">{chainKey}</div>
                </div>
                <div className="center-aligned-row chain-connect">
                    {!_.isEmpty(address) ? (
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
                {renderChainBox(fromChainKey, 'From')}
                <div className="arrow" onClick={() => setChains([toChainKey, fromChainKey])}>
                    <SwapHoriz/>
                </div>
                {renderChainBox(toChainKey, 'To')}
            </div>
            {!showModify && (isRegistered || !isConnected) ? (
                <>
                    <div className="row center-aligned-row">
                        <div className="item item-group">
                            <div className="item-title">Token</div>
                            <div className="item-text">
                                {_.size(supportedTokens) === 1 ? selectedSymbol : (
                                    <Dropdown id="token-select" withCaret={true}
                                              items={_.map(supportedTokens, t => ({name: t}))}
                                              onItemClick={({name: symbol}) => {setSelectedSymbol(symbol)}}>
                                        {selectedSymbol}
                                    </Dropdown>
                                )}
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
                                       onChange={e => setAmount(parseFloat(e.target.value).toFixed(token.precision))}/>
                            </div>
                        </div>
                    </div>
                    <div className="row input-container checkbox-row">
                        <div className="item">
                            <div className="item-input">
                                <input disabled={disabled} type="checkbox" className="input" checked={infiniteApproval}
                                       onChange={() => setInfiniteApproval(!infiniteApproval)}/> Infinite Approval
                            </div>
                        </div>
                    </div>
                    <div className="row center-aligned-spaced-row" style={{textAlign: 'right'}}>
                        <span className="info-message">
                            {!_.isEmpty(txFee) && `Transaction Fee ${txFee}`}
                        </span>
                        <Button disabled={disabled} variant="contained" color="default"
                                onClick={() => dispatch(controller.transfer(fromChainKey, amount, token, infiniteApproval))}>
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