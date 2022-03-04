import ApiBuilder from '../helpers/ApiBuilder';

const uploadSupplierInvoice = (invoiceId, index = 0, imageUrl, token, companyKey) => {

  const photo = {
    uri: imageUrl,
    type: 'image/jpeg',
    name: `photo-${index}.jpg`,
  };

  const form = new FormData();
  form.append('File', photo);
  form.append('Token', token);
  form.append('CompanyKey', companyKey); //TODO: Remove this key when the new UniFiles api is in pilot
  form.append('Key', companyKey);
  form.append('EntityType', 'SupplierInvoice');
  form.append('EntityID', invoiceId);
  form.append('Caption', 'Uploaded from mobile');

  return ApiBuilder.FILE_SERVER.post(`/api/file`, form);
};

const uploadProductImages = (productId, index = 0, imageUrl, token, companyKey) => {

  const photo = {
    uri: imageUrl,
    type: 'image/jpeg',
    name: `photo-${index}.jpg`,
  };

  const form = new FormData();
  form.append('File', photo);
  form.append('Token', token);
  form.append('CompanyKey', companyKey); //TODO: Remove this key when the new UniFiles api is in pilot
  form.append('Key', companyKey);
  form.append('EntityType', 'product');
  form.append('EntityID', productId);
  form.append('Caption', 'Uploaded from mobile');
  return ApiBuilder.FILE_SERVER.post(`/api/file`, form);
};

const uploadInboxItem = (image, description = '', token, companyKey) => {

  const photo = {
    uri: image ? image : '',
    type: image.mime ? image.mime : 'image/jpeg',
    name: image.filename ? image.filename : 'Camera_image.png',
  };

  const form = new FormData();
  form.append('File', photo);
  form.append('Token', token);
  form.append('Key', companyKey);
  form.append('Caption', 'IncomingExpense');
  form.append('Description', description);
  return ApiBuilder.FILE_SERVER.post(`/api/file`, form);
};

const linkImageToInvoice = (externalID, invoiceId, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/files/${externalID}?action=link&entitytype=SupplierInvoice&entityid=${invoiceId}`,{} ,
  { headers: { 'CompanyKey': companyKey } });
};

export default {
  uploadSupplierInvoice,
  uploadProductImages,
  uploadInboxItem,
  linkImageToInvoice,
};
