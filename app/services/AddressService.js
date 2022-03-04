import ApiBuilder from '../helpers/ApiBuilder';

const getCountryList = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/countries',
    { headers: { 'CompanyKey': companyKey } });
};

const lookupCityBaseOnPostalCode = (postalCode, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/postalcodes?filter=Code eq ${postalCode}&top=1`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getCountryList,
  lookupCityBaseOnPostalCode,
};
