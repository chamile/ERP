import ApiBuilder from '../helpers/ApiBuilder';

const getOrders = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/orders?expand=customer, currencycode&top=${pageSize}&skip=${pageStart}&orderby=id desc`,
    { headers: { 'CompanyKey': companyKey } });
};

const getOrderDetails = (companyKey, orderId) => {
  return ApiBuilder.API.get(`/api/biz/orders/${orderId}?expand=customer,PaymentTerms, DeliveryTerms, currencycode,CreditDays, Items, Items.CurrencyCode, Items.VatType, DefaultDimensions.Project, DefaultDimensions.Department, DefaultSeller`,
    { headers: { 'CompanyKey': companyKey } });
};

const editOrderDetails = (companyKey, orderId, order) => {
  return ApiBuilder.API.put(`/api/biz/orders/${orderId}`,
    order, { headers: { 'CompanyKey': companyKey } });
};

const addNewItem = (orderId, item, companyKey) => {
  const body = {
    ID: orderId,
    Items: [item]
  };
  return ApiBuilder.API.put(`/api/biz/orders/${orderId}`, body,
    { headers: { 'CompanyKey': companyKey } });
};

const deleteItem = (orderId, itemID, companyKey) => {
  const body = {
    ID: orderId,
    Items: [{ ID: itemID, Deleted: true }]
  };
  return ApiBuilder.API.put(`/api/biz/orders/${orderId}`, body,
    { headers: { 'CompanyKey': companyKey } });
};

const createOrder = (companyKey, order) => {
  return ApiBuilder.API.post('/api/biz/orders/', order,
    { headers: { 'CompanyKey': companyKey } });
};

const transferToInvoice = (ID, order, companyKey) => {
  return ApiBuilder.API.put(`/api/biz/orders/${ID}?action=transfer-to-invoice`, order,
    { headers: { 'CompanyKey': companyKey } });
};

const searchOrders = (keyWord, companyKey, pageStart = 0, pageSize = 0, filterMap) => {
  const queryKeyword = keyWord === '' ? '' : `startswith(CustomerOrder.OrderNumber,'${keyWord}') or startswith(Customer.CustomerNumber,'${keyWord}') or contains(Info.Name,'${keyWord}')`;
  let queryFilter = '';
  let filterQuery = '';
  filterMap.forEach((valueList, key, map) => {
    if (key === 'StatusCode-eq') {
      for (value in valueList) {
        queryFilter += `${queryFilter === '' ? '' : value > 0 ? ' or ' : ' and '}CustomerOrder.StatusCode eq ${valueList[value]} `;
      }
    }
    if (key === 'StatusCode-ne') {
      for (value in valueList) {
        queryFilter += `${queryFilter === '' ? '' : value > 0 ? ' or ' : ' and '}CustomerOrder.StatusCode ne ${valueList[value]} `;
      }
    }
  });

  filterQuery = queryKeyword === '' ? queryFilter : queryFilter === '' ? queryKeyword : `${queryKeyword} and ( ( ${queryFilter} ) )`;

  return ApiBuilder.API.get(`/api/statistics?skip=${pageStart}&top=${pageSize}&model=CustomerOrder&select=CustomerOrder.OrderNumber as OrderNumber,Customer.CustomerNumber as CustomerCustomerNumber,Info.Name as InfoName,CurrencyCode.Code as CurrencyCodeCode,CustomerOrder.TaxInclusiveAmountCurrency as CustomerOrderTaxInclusiveAmountCurrency,CustomerOrder.TaxInclusiveAmount as CustomerOrderTaxInclusiveAmount,sum(casewhen(items.statuscode eq 41102\,items.SumTotalExVat\,0)) as Restsum,CustomerOrder.StatusCode as CustomerOrderStatusCode,ID as ID,Customer.ID as CustomerID&expand=Customer.Info,CurrencyCode,Items&hateoas=true&distinct=false&filter=${filterQuery} &orderby=ID DESC`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getOrders,
  getOrderDetails,
  searchOrders,
  addNewItem,
  deleteItem,
  createOrder,
  editOrderDetails,
  transferToInvoice,
};
