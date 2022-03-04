import ApiBuilder from '../helpers/ApiBuilder';

const searchPhonebook = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
    return ApiBuilder.INTEGRATION_SERVER.get(`/api/businessrelationsearch?searchCriteria='${keyword}'&limit=20&datahotel=true`,
        { headers: { 'CompanyKey': companyKey } });
};

export default {
    searchPhonebook
}