import ApiBuilder from '../helpers/ApiBuilder';

const getInboxItemList = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/filetags/IncomingMail|IncomingEHF|IncomingTravel|IncomingExpense/0?action=get-supplierInvoice-inbox&orderby=ID desc&top=${pageSize}&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};

const tagUploadedFile = (FileID, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/filetags/${FileID}`, { FileID, TagName: 'IncomingExpense', Status: 0 },
    { headers: { 'CompanyKey': companyKey } });
};

const deleteInboxItem = (ID, companyKey) => {
  return ApiBuilder.API.delete(`/api/biz/files/${ID}`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getInboxItemList,
  deleteInboxItem,
  tagUploadedFile,
};
