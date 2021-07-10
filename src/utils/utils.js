import _ from 'lodash'
import numeral from 'numeral'

const precisions = _.uniq([2, 4, 6, 18])
// const precisions = _.uniq([2, ..._.map(TOKENS, t => t.precision)])

const PRECISION_FORMAT = _.zipObject(
    precisions,
    _.map(precisions, p => {
        if (p === 0) return '0'
        let ps = '0.'
        for (let i = 0; i < p; i++) {
            ps += '0'
        }
        return ps
    })
)

export const amountToAsset = (amount, {symbol, precision}, withSymbol = true, prettify = false, overridePrecision = -1) => {
    const p = overridePrecision === -1 ? precision : overridePrecision
    const format = prettify ? '0,' + PRECISION_FORMAT[p] : PRECISION_FORMAT[p]
    // console.log('amountToAsset amount', amount, 'format', format)
    const num = numeral(_.isString(amount) ? parseFloat(amount) : amount)
    return `${(_.isNumber(num) ? num.format(format) : parseFloat(amount).toFixed(p))}${withSymbol ? (' ' + symbol) : ''}`
}

export const poll = async opts => {
    const {interval, pollFunc, checkFunc, timerId, setTimerId} = opts
    try {
        const res = await pollFunc()
        const shouldStop = _.isFunction(checkFunc) && checkFunc(res)

        if (!shouldStop) {
            if (timerId !== -1) {
                clearTimeout(timerId)
            }
            setTimerId(
                setTimeout(() => {
                    poll(opts)
                }, interval)
            )
        }
    }
    catch (e) {

    }
}