import ApiBuilder from '../helpers/ApiBuilder';

const getPaymentTerms = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/terms/?action=get-payment-terms',
    { headers: { 'CompanyKey': companyKey } });
};

const getDeliveryTerms = (companyKey) => {
  return ApiBuilder.API.get('api/biz/terms/?action=get-delivery-terms',
    { headers: { 'CompanyKey': companyKey } });
};


export default {
  getPaymentTerms,
  getDeliveryTerms
};
