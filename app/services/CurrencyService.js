import ApiBuilder from '../helpers/ApiBuilder';

const getVATCodes = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/vattypes?filter=Visible eq true',
    { headers: { 'CompanyKey': companyKey } });
};

const getCurrencies = (companyKey) => {
  return ApiBuilder.API.get(`/api/biz/currencycodes/`,
    { headers: { 'CompanyKey': companyKey } });
};

const getCurrencyDetails = (ID, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/currencycodes/${ID}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getCurrencyExchangeRates = (companyKey, fromCurrencyID, toCurrencyID, currencyDate) => {
  return ApiBuilder.API.get(`/api/biz/currencies/?action=get-currency-exchange-rate&fromCurrencyCodeID=${fromCurrencyID}&toCurrencyCodeID=${toCurrencyID}&currencyDate=${currencyDate}`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getVATCodes,
  getCurrencyExchangeRates,
  getCurrencies,
  getCurrencyDetails,
};
