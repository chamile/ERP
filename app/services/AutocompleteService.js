import ApiBuilder from '../helpers/ApiBuilder';

const getUserSuggestions = (displayName, companyKey) => {
  return ApiBuilder.API.get(`api/biz/users?filter=contains(DisplayName,'${displayName.slice(1)}')`,
  { headers: { 'CompanyKey': companyKey } });
};

export default {
  getUserSuggestions
};
