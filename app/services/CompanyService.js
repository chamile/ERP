import ApiBuilder from '../helpers/ApiBuilder';
import CurrencyService from './CurrencyService';

const getUserCompanies = () => {
  return ApiBuilder.API.get(`/api/init/companies`);
};

const getCompanyBaseCurrency = (companyKey, companyName) => {
  return ApiBuilder.API.get(`/api/biz/companysettings/?filter=CompanyName eq '${companyName}'&select=BaseCurrencyCodeID,RoundingNumberOfDecimals,CustomerCreditDays`,
    { headers: { 'CompanyKey': companyKey } })
    .then(response => {
      if (response.data[0].BaseCurrencyCodeID) {
        return CurrencyService.getCurrencyDetails(response.data[0].BaseCurrencyCodeID, companyKey)
          .then(res => {
            response.data[0].BaseCurrencyCode = res.data && res.data.Code ? res.data.Code : '';
            return response;
          });
      } else {
        response.data[0].BaseCurrencyCode = '';
        return response;
      }
    }
    );
};

const getDepartments = (companyKey) => {
  return ApiBuilder.API.get(`/api/biz/departments/?select=ID, DepartmentNumber, Name`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getUserCompanies,
  getCompanyBaseCurrency,
  getDepartments
};
