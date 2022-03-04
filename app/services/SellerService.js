import ApiBuilder from '../helpers/ApiBuilder';

const getSellers = (companyKey) => {
  return ApiBuilder.API.get(`/api/biz/sellers/`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
    getSellers
};
