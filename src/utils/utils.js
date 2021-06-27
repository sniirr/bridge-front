import _ from 'lodash'
import numeral from 'numeral'
import TOKENS from 'config/tokens.json'

const precisions = _.uniq([2, ..._.map(TOKENS, t => t.precision)])

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

export const amountToAsset = (amount, symbol, withSymbol = true, prettify = false, overridePrecision = -1) => {
    const precision = overridePrecision > -1 ? overridePrecision : _.get(TOKENS, [symbol, 'precision'], 6)
    const format = prettify ? '0,' + PRECISION_FORMAT[precision] : PRECISION_FORMAT[precision]
    return `${numeral(_.isString(amount) ? parseFloat(amount) : amount).format(format)}${withSymbol ? (' ' + symbol) : ''}`
}