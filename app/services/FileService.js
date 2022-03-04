import ApiBuilder from '../helpers/ApiBuilder';

const getFileById = (fileId, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/files?filter=ID eq ${fileId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getFiles = (entityId, entityType, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/files/${entityType}/${entityId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const deleteFile = (id, companyKey) => {
  return ApiBuilder.API.delete(`/api/biz/files/${id}`, { headers: { 'CompanyKey': companyKey } });
};

const deleteSupplierInvoiceFile = (fileId, invoiceID, companyKey) => {
  return ApiBuilder.API.delete(`/api/biz/files/SupplierInvoice/${invoiceID}/${fileId}`, { headers: { 'CompanyKey': companyKey } });
};

const uploadImage = (imageUrl, token, companyKey) => {
  const photo = {
    uri: imageUrl,
    type: 'image/jpeg',
    name: 'photo-ocr'
  };

  const form = new FormData();
  form.append('File', photo);
  form.append('Token', token);
  form.append('CompanyKey', companyKey);
  form.append('Key', companyKey);

  return ApiBuilder.FILE_SERVER.post('/api/file', form);
};

export default {
  getFiles,
  deleteFile,
  uploadImage,
  deleteSupplierInvoiceFile,
  getFileById
};
