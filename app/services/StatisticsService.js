import ApiBuilder from '../helpers/ApiBuilder';

const fetchUserStatistics = (companyKey, workerRelationId, date = new Date().toISOString().substr(0, 10)) => {
  return ApiBuilder.API.get(`api/biz/workrelations/${workerRelationId}?action=calc-flex-balance&date=${date}&details=true`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  fetchUserStatistics
};
