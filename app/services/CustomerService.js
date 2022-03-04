import ApiBuilder from '../helpers/ApiBuilder';

const getCustomers = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/customers/?expand=Info, DeliveryTerms, PaymentTerms, Info.DefaultEmail, Info.InvoiceAddress, Info.ShippingAddress &filter=StatusCode eq 20001 OR StatusCode eq 30001&top=${pageSize}&skip=${pageStart}&orderby=ID desc`,
    { headers: { 'CompanyKey': companyKey } });
};

const getCustomerDetails = (customerID, companyKey) => {
  return ApiBuilder.API.get(`api/biz/customers/${customerID}?expand=Info,Info.Addresses, Info.InvoiceAddress, Info.ShippingAddress, Info.DefaultEmail, Info.DefaultPhone, CurrencyCode, BusinessRelation`,
    { headers: { 'CompanyKey': companyKey } });
};

const editCustomerDetails = (customerID, customerData, companyKey) => {
  return ApiBuilder.API.put(`api/biz/customers/${customerID}`, { ...customerData },
    { headers: { 'CompanyKey': companyKey } });
};

const getCustomerKPIOpenOrders = (customerID, companyKey) => {
  return ApiBuilder.API.get(`/api/statistics?model=Customer&expand=CustomerOrders&filter=Customer.ID eq ${customerID} and isnull(CustomerOrders.Deleted,'false') eq 'false'&select=Customer.ID as CustomerID,sum(casewhen(CustomerOrders.StatusCode eq 41002 or CustomerOrders.StatusCode eq 41003\,CustomerOrders.TaxExclusiveAmountCurrency\,0)) as SumOpenOrdersExVatCurrency`,
    { headers: { 'CompanyKey': companyKey } });
};

const getCustomerKPITotalInvoiced = (customerID, companyKey) => {
  return ApiBuilder.API.get(`/api/statistics?model=Customer&expand=CustomerInvoices&filter=Customer.ID eq ${customerID} and isnull(CustomerInvoices.Deleted,'false') eq 'false' &select=Customer.ID as CustomerID,sum(casewhen(getdate() gt CustomerInvoices.PaymentDueDate and CustomerInvoices.StatusCode ne 42004\,1\,0)) as NumberOfDueInvoices,sum(casewhen(getdate() gt CustomerInvoices.PaymentDueDate and CustomerInvoices.StatusCode ne 42004\,CustomerInvoices.RestAmountCurrency\,0)) as SumDueInvoicesRestAmountCurrency,sum(casewhen(CustomerInvoices.StatusCode eq 42002 or CustomerInvoices.StatusCode eq 42003 or CustomerInvoices.StatusCode eq 42004\,CustomerInvoices.TaxExclusiveAmountCurrency\,0)) as SumInvoicedExVatCurrency`,
    { headers: { 'CompanyKey': companyKey } });
};

const searchCustomers = (keyword, companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`api/statistics?skip=${pageStart}&top=${pageSize}&model=Customer&select=Customer.WebUrl as WebUrl,Customer.CustomerNumber as CustomerCustomerNumber,Info.Name as InfoName,DefaultPhone.Number as DefaultPhoneNumber,DefaultEmail.EmailAddress as DefaultEmailEmailAddress,InvoiceAddress.AddressLine1 as InvoiceAddressAddressLine1,InvoiceAddress.PostalCode as InvoiceAddressPostalCode,InvoiceAddress.City as InvoiceAddressCity,ID as ID,BusinessRelationID as BusinessRelationID,Customer.ID as CustomerID&expand=Info,Info.DefaultPhone,Info.DefaultEmail,Info.InvoiceAddress&distinct=false&filter=startswith(Customer.CustomerNumber, '${keyword}' ) or contains(Info.Name, '${keyword}' ) or contains(InvoiceAddress.AddressLine1, '${keyword}' ) or startswith(InvoiceAddress.PostalCode, '${keyword}') or startswith(InvoiceAddress.City, '${keyword}')`,
    { headers: { 'CompanyKey': companyKey } });
};

const createCustomer = (customerData, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/customers/`, { ...customerData },
    { headers: { 'CompanyKey': companyKey } });
};

const getCustomerAddresses = (customerID, companyKey) => {
  return ApiBuilder.API.get(`api/biz/customers/${customerID}?select=Info.Addresses as Addresses &expand=Info.Addresses`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getCustomers,
  createCustomer,
  searchCustomers,
  getCustomerDetails,
  getCustomerAddresses,
  getCustomerKPIOpenOrders,
  getCustomerKPITotalInvoiced,
  editCustomerDetails,
};
