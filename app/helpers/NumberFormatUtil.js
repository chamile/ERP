import i18n from '../i18n/i18nConfig';
import Intl from '../helpers/IntlConfig';
import CurrencyCodes from '../constants/CurrencySymbols';

const customFormatter = (number, decimalPoints = 2, thousandSeperatorPoints = 3, decimalSeperatorSymbol = '.', thousandSeperatorSymbol = ' ') => {
  const re = `\\d(?=(\\d{${thousandSeperatorPoints}})+${decimalPoints > 0 ? '\\D' : '$'})`;
  const num = number.toFixed(Math.max(0, decimalPoints));
  return (decimalSeperatorSymbol ? num.replace('.', decimalSeperatorSymbol) : num).replace(new RegExp(re, 'g'), `$&${thousandSeperatorSymbol}`);
};

const intlFormatter = (number, lang = i18n.language, options) => {
  if (options.style && options.style.toLowerCase() === 'currency') {
    return new Intl.NumberFormat(lang, options).format(number).replace(/^(\D+)/, '$1 ');
  }
  else {
    return new Intl.NumberFormat(lang, options).format(number);
  }
};

const customDeFormatter = (formattedNumber = '') => {
  if (formattedNumber === '') {
    return false;
  }
  const number = formattedNumber.replace(',', '.').replace(/\s/g, '');
  if (!isNaN(number)) {
    if (isNaN(Number(number))) {
      return false;
    }
    return Number(number);
  }
  else {
    return false;
  }
};

const intlDeFormatter = (formattedNumber, lang = i18n.language) => {
  let formatterRegex = '';
  if (i18n.language.includes('en-')) {
    formatterRegex = /[^0-9-.]/g;
  } else if (i18n.language.includes('nb-') || i18n.language.includes('nn-')) {
    formatterRegex = /[^0-9-,]/g;
  }
  const number = formattedNumber.toString().replace(formatterRegex, '').replace(/[,]/g,'.');
  if (number === '' || isNaN(number)) {
    return false;
  }
  else {
    return parseFloat(number);
  }
};

export const currencyCodeToSymbolConverter = (code = '') => {
  if (code in CurrencyCodes) {
    return CurrencyCodes[code].symbol;
  }
  else {
    return code;
  }
};

export const FormatNumber = (number, lang = i18n.language, options = { minimumFractionDigits: 2, maximumFractionDigits: 2, currency: '', style: '', thousandSeperatorDigits: 3, decimalSeperatorSymbol: (i18n.language.includes('nb-') || i18n.language.includes('nn-')) ? ',' : '.', thousandSeperatorSymbol: ' ' }) => {
  if (number !== null && number !== undefined) {
    if (options.style && options.style.toLowerCase() === 'currency') {
      return `${currencyCodeToSymbolConverter(options.currency)} ${customFormatter(number, options.minimumFractionDigits, options.thousandSeperatorDigits, options.decimalSeperatorSymbol, options.thousandSeperatorSymbol)}`;
    }
    else {
      return customFormatter(number, options.minimumFractionDigits, options.thousandSeperatorDigits, options.decimalSeperatorSymbol, options.thousandSeperatorSymbol);
    }
  }
  else {
    return '';
  }
};

export const DeFormatNumber = (formattedNumber, lang = i18n.language) => {
  return customDeFormatter(formattedNumber);
};

export default {
  FormatNumber,
  DeFormatNumber,
};
