import React, {useState, useRef} from 'react'
import _ from 'lodash'
import classNames from 'classnames'
import './Dropdown.scss'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCaretDown, faCaretRight} from '@fortawesome/free-solid-svg-icons'
import useOnClickOutside from "shared/dapp-common/hooks/useClickOutside"

const Dropdown = ({id, className, items, onItemClick, withCaret, disabled, children}) => {

    const ref = useRef(null)
    const [isVisible, setIsVisible] = useState(false)
    const [selected, setSelected] = useState(items[0])

    useOnClickOutside(ref, () => setIsVisible(false))

    return (
        <div ref={ref} className={classNames('dropdown', className, {'is-visible': isVisible})} onClick={() => !disabled && setIsVisible(!isVisible)}>
            <div>
                {children}
            </div>
            {withCaret && (<div className="caret">
                <FontAwesomeIcon icon={faCaretDown}/>
                {/*<FontAwesomeIcon icon={isVisible ? faCaretDown : faCaretRight}/>*/}
            </div>)}
            <div className="dropdown-menu">
                {_.map(items, (item, i) => {
                    const {name, link, ...itemProps} = item
                    if (selected.name === name) return null
                    const Item = (
                        <div key={`dropdown-menu-opt-${id}-${i}`}
                             className="dropdown-item"
                             onClick={() => {
                                 setSelected({name})
                                 _.isFunction(onItemClick) && onItemClick(item)
                             }}
                             {...itemProps}>{name}</div>
                    )

                    return _.isEmpty(link) ? Item : (
                        <a href={link} target="_blank" rel="noopener noreferrer">{Item}</a>
                    )
                })}
            </div>
        </div>
    )
}

export default Dropdown
