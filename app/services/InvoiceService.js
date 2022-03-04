import ApiBuilder from '../helpers/ApiBuilder';

const getUserInvoices = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/statistics?model=supplierinvoice&select=InvoiceNumber as InvoiceNumber,CurrencyCode.Code as CurrencyCode,id as ID,SupplierID as SupplierID,Info.Name as SupplierName,max(file.id) as fileID,file.StorageReference as fileRef,StatusCode as Status,TaxInclusiveAmountCurrency as Amount,max(file.name) as fileName&filter=deleted eq 0 and ( fileentitylink.entitytype eq 'supplierinvoice' or isnull(fileentitylink.id,0) eq 0 )&join=supplierinvoice.id eq fileentitylink.entityid and fileentitylink.fileid eq file.id&top=${pageSize}&expand=supplier.info,CurrencyCode&orderby=id desc&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getInvoiceDetails = (invoiceId, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/supplierinvoices/${invoiceId}?expand=Supplier.Info,DefaultDimensions,DefaultDimensions.Project,DefaultDimensions.Department`,
    { headers: { 'CompanyKey': companyKey } });
};

const getInvoiceSummary = (invoiceId, companyKey) => {
  return ApiBuilder.API.get(`api/statistics?model=supplierinvoice&select=CurrencyCode.Code as CurrencyCode,id as ID,SupplierID as SupplierID,Info.Name as SupplierName,file.id as fileID,file.StorageReference as fileRef,StatusCode as Status,TaxInclusiveAmount as Amount,file.name as fileName  &filter=supplierinvoice.id eq ${invoiceId} and deleted eq 0 and ( fileentitylink.entitytype eq 'supplierinvoice' or isnull(fileentitylink.id,0) eq 0 )&join=supplierinvoice.id eq fileentitylink.entityid and fileentitylink.fileid eq file.id&expand=supplier.info,CurrencyCode`,
    { headers: { 'CompanyKey': companyKey } });
};

const createNewInvoice = (invoice, companyKey) => {
  return ApiBuilder.API.post('/api/biz/supplierinvoices', invoice,
    { headers: { 'CompanyKey': companyKey } });
};

const editInvoice = (invoiceId, invoice, companyKey) => {
  return ApiBuilder.API.put(`/api/biz/supplierinvoices/${invoiceId}`, invoice,
    { headers: { 'CompanyKey': companyKey } });
};

const getCurrencyCode = (currencyCodeID, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/currencycodes/${currencyCodeID}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getAssigneeUserList = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/users',
    { headers: { 'CompanyKey': companyKey } });
};

const getAssigneeTeamList = (companyKey) => {
  return ApiBuilder.API.get('/api/biz/teams',
    { headers: { 'CompanyKey': companyKey } });
};

const assignInvoiceTo = (invoiceID, userIDs, teamIDs, companyKey) => {
  const body = {
    Message: '',
    UserIDs: [...userIDs],
    TeamIDs: [...teamIDs]
  };
  return ApiBuilder.API.post(`/api/biz/supplierinvoices/${invoiceID}?action=assign-to`, body,
    { headers: { 'CompanyKey': companyKey } });
};

const getInvoiceImages = (invoiceID, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/files/SupplierInvoice/${invoiceID}`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getUserInvoices,
  getInvoiceDetails,
  getInvoiceSummary,
  createNewInvoice,
  editInvoice,
  getCurrencyCode,
  getAssigneeTeamList,
  getAssigneeUserList,
  assignInvoiceTo,
  getInvoiceImages,
};
