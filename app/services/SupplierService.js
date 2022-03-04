import ApiBuilder from '../helpers/ApiBuilder';

const getSuppliersForNewInvoice = (companyKey) => {
  return ApiBuilder.API.get(`/api/biz/suppliers/?expand=info&filter=StatusCode eq 20001 OR StatusCode eq 30001`,
    { headers: { 'CompanyKey': companyKey } });
};

const getSuppliers = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`api/biz/suppliers/?expand=Info, Info.DefaultEmail, Info.InvoiceAddress, Info.ShippingAddress&top=${pageSize}&skip=${pageStart}&orderby=ID desc`,
    { headers: { 'CompanyKey': companyKey } });
};

const createSupplier = (supplierData, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/suppliers/`, supplierData,
    { headers: { 'CompanyKey': companyKey } });
};

const searchSupliers = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`api/statistics?skip=${pageStart}&top=${pageSize}&model=Supplier&select=Supplier.WebUrl as WebUrl,Supplier.SupplierNumber as SupplierNumber,Info.Name as InfoName,DefaultPhone.Number as DefaultPhoneNumber,DefaultEmail.EmailAddress as DefaultEmailEmailAddress,InvoiceAddress.AddressLine1 as InvoiceAddressAddressLine1,InvoiceAddress.PostalCode as InvoiceAddressPostalCode,InvoiceAddress.City as InvoiceAddressCity,ID as ID,BusinessRelationID as BusinessRelationID,Supplier.ID as SupplierID&expand=Info,Info.DefaultPhone,Info.DefaultEmail,Info.InvoiceAddress&distinct=false&filter=startswith(Supplier.SupplierNumber, '${keyword}' ) or contains(Info.Name, '${keyword}' ) or contains(InvoiceAddress.AddressLine1, '${keyword}' ) or startswith(InvoiceAddress.PostalCode, '${keyword}') or startswith(InvoiceAddress.City, '${keyword}')`,
    { headers: { 'CompanyKey': companyKey } });
};

const editSupplierDetails = (supplierID, customerData, companyKey) => {
  return ApiBuilder.API.put(`api/biz/suppliers/${supplierID}`, { ...customerData },
    { headers: { 'CompanyKey': companyKey } });
};

const getSupplierDetails = (supplierID, companyKey) => {
  return ApiBuilder.API.get(`api/biz/suppliers/${supplierID}?expand=Info&expand=Info.BankAccounts.Bank,Info.BankAccounts,Info.DefaultBankAccount,Info.Addresses, Info.InvoiceAddress, Info.ShippingAddress, Info.DefaultEmail, Info.DefaultPhone, CurrencyCode, BusinessRelation`,
    { headers: { 'CompanyKey': companyKey } });
};

const filteruppliers = (orgNo, companyKey) => {
  return ApiBuilder.API.get(`api/biz/suppliers?expand=Info.BankAccounts,&filter=OrgNumber eq '${orgNo}'`,
    { headers: { 'CompanyKey': companyKey } });
};

const findSupplierViaPhonebook = (orgNo, companyKey) => {
  return ApiBuilder.API.get(`api/biz/business-relations/?action=search-data-hotel&searchText=${orgNo}`,
    { headers: { 'CompanyKey': companyKey } });
};

//------------------------------Bank account lookup -------------------------------------------------------------------

const searchByNOAccountNumberInUE = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/bankaccounts/?filter=AccountNumber eq '${keyword}' and bankaccounttype eq 'supplier'&hateoas=false&expand=bank`,
    { headers: { 'CompanyKey': companyKey } });
};
const searchByIBNNumberInUE = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/bankaccounts/?filter=IBAN eq '${keyword}' and bankaccounttype eq 'supplier'&hateoas=false&expand=bank`,
    { headers: { 'CompanyKey': companyKey } });
};

const searchSupliersBankAccountInIBNByAccountNo = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/banks?action=get-iban-upsert-bank&bankAccountNumber= ${keyword}`,
    { headers: { 'CompanyKey': companyKey } });
};

const searchSupliersBankAccountInIBNByIBNNo = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/banks?action=verify-iban-upsert-bank&IBAN= ${keyword}`,
    { headers: { 'CompanyKey': companyKey } });
};


const createNewBankAccountInUE = (bankAccountData, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/bankaccounts`, bankAccountData,
    { headers: { 'CompanyKey': companyKey } });
};



export default {
  getSuppliersForNewInvoice,
  getSuppliers,
  createSupplier,
  getSupplierDetails,
  editSupplierDetails,
  filteruppliers,
  findSupplierViaPhonebook,
  searchSupliers,
  searchByNOAccountNumberInUE,
  searchByIBNNumberInUE,
  searchSupliersBankAccountInIBNByAccountNo,
  searchSupliersBankAccountInIBNByIBNNo,
  createNewBankAccountInUE
};
