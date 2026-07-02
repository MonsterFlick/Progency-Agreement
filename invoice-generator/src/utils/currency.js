// ─── Number to words converter (Indian system) ───
const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']

export function numberToWords(num) {
  if (!num || num === 0) return 'Zero'
  if (num < 0) return 'Minus ' + numberToWords(-num)
  num = Math.round(num)
  let words = ''
  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore '
    num %= 10000000
  }
  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh '
    num %= 100000
  }
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand '
    num %= 1000
  }
  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + ' Hundred '
    num %= 100
  }
  if (num > 0) {
    if (words !== '') words += 'and '
    if (num < 20) words += ones[num]
    else {
      words += tens[Math.floor(num / 10)]
      if (num % 10 > 0) words += '-' + ones[num % 10]
    }
  }
  return words.trim()
}

export const CURRENCIES = {
  '₹': { symbol: '₹', name: 'INR', word: 'Rupees' },
  '$': { symbol: '$', name: 'USD', word: 'Dollars' },
  '€': { symbol: '€', name: 'EUR', word: 'Euros' },
  '£': { symbol: '£', name: 'GBP', word: 'Pounds' },
}

export function formatCurrency(num, symbol = '₹') {
  const val = Number(num || 0)
  if (symbol === '₹') {
    return symbol + val.toLocaleString('en-IN')
  }
  return symbol + val.toLocaleString('en-US')
}

export function amountInWords(num, symbol = '₹') {
  const currency = CURRENCIES[symbol] || CURRENCIES['₹']
  return numberToWords(num) + ' ' + currency.word + ' Only'
}
