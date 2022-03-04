import ApiBuilder from '../helpers/ApiBuilder';

const getProductList = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/products?&select=ID,Name,PriceExVat,PriceIncVat,PartName&top=${pageSize}&orderby=ID desc&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getProduct = (ID, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/products/${ID}?expand=VatType,VatType.VatTypePercentages`,
    { headers: { 'CompanyKey': companyKey } });
};

const searchProducts = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/products?filter=contains(Name,'${keyword}') or contains(PartName,'${keyword}')&expand=VatType`,
    { headers: { 'CompanyKey': companyKey } });
};

const editProduct = (ID, product, companyKey) => {
  return ApiBuilder.API.put(`/api/biz/products/${ID}`, product, { headers: { 'CompanyKey': companyKey } });
};

const createProduct = (product, companyKey) => {
  return ApiBuilder.API.post('/api/biz/products', product, { headers: { 'CompanyKey': companyKey } });
};

const getPartNameSuggestion = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/products/?action=getnewpartname', { headers: { 'CompanyKey' : companyKey } });
};

export default {
  getProductList,
  getProduct,
  searchProducts,
  editProduct,
  createProduct,
  getPartNameSuggestion,
};
