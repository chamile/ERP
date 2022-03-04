import ApiBuilder from '../helpers/ApiBuilder';

const getOCRDataForImage = (externalID, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/files/${externalID}?action=ocranalyse`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getOCRDataForImage,
};
