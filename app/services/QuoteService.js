import ApiBuilder from '../helpers/ApiBuilder';

const getQuotes = (companyKey, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/quotes?expand=customer, currencycode&top=${pageSize}&skip=${pageStart}&orderby=id desc`,
    { headers: { 'CompanyKey': companyKey } });
};

const getQuoteDetails = (companyKey, quoteId) => {
  return ApiBuilder.API.get(`/api/biz/quotes/${quoteId}?expand=customer,PaymentTerms,DeliveryTerms, CreditDays,currencycode, Items, Items.CurrencyCode, Items.VatType, DefaultDimensions.Project, DefaultDimensions.Department, DefaultSeller`,
    { headers: { 'CompanyKey': companyKey } });
};

const editQuoteDetails = (companyKey, quoteId, order) => {
  return ApiBuilder.API.put(`/api/biz/quotes/${quoteId}`,
    order, { headers: { 'CompanyKey': companyKey } });
};

const transferQuoteToInvoice = (quoteId, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/quotes/${quoteId}?action=toInvoice`,
    null, { headers: { 'CompanyKey': companyKey } });
};

const transferQuoteToOrder = (quoteId, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/quotes/${quoteId}?action=toOrder`,
    null, { headers: { 'CompanyKey': companyKey } });
};

const registerQuote = (quoteId, quote, companyKey) => {
  return ApiBuilder.API.put(`/api/biz/quotes/${quoteId}`,
    quote, { headers: { 'CompanyKey': companyKey } });
};

const addNewItem = (quoteId, item, companyKey) => {
  const body = {
    ID: quoteId,
    Items: [item]
  };
  return ApiBuilder.API.put(`/api/biz/quotes/${quoteId}`, body,
    { headers: { 'CompanyKey': companyKey } });
};

const deleteItem = (quoteId, itemID, companyKey) => {
  const body = {
    ID: quoteId,
    Items: [{ ID: itemID, Deleted: true }]
  };
  return ApiBuilder.API.put(`/api/biz/quotes/${quoteId}`, body,
    { headers: { 'CompanyKey': companyKey } });
};

const createQuote = (companyKey, quote) => {
  return ApiBuilder.API.post('/api/biz/quotes/', quote,
    { headers: { 'CompanyKey': companyKey } });
};

const searchQuotes = (keyWord, companyKey, pageStart = 0, pageSize = 0, filterMap) => {
  const queryKeyword = keyWord === '' ? '' : `startswith(CustomerQuote.QuoteNumber,'${keyWord}') or startswith(Customer.CustomerNumber,'${keyWord}') or contains(Info.Name,'${keyWord}')`;
  let queryFilter = '';
  let filterQuery = '';
  filterMap.forEach((valueList, key, map) => {
    if (key === 'StatusCode-eq') {
      for (value in valueList) {
        queryFilter += `${queryFilter === '' ? '' : value > 0 ? ' or ' : ' and '}CustomerQuote.StatusCode eq ${valueList[value]} `;
      }
    }
    if (key === 'StatusCode-ne') {
      for (value in valueList) {
        queryFilter += `${queryFilter === '' ? '' : value > 0 ? ' or ' : ' and '}CustomerQuote.StatusCode ne ${valueList[value]} `;
      }
    }
  });

  filterQuery = queryKeyword === '' ? queryFilter : queryFilter === '' ? queryKeyword : `${queryKeyword} and ( ( ${queryFilter} ) )`;

  return ApiBuilder.API.get(`/api/statistics?skip=${pageStart}&top=${pageSize}&model=CustomerQuote&select=CustomerQuote.QuoteNumber as QuoteNumber,Customer.CustomerNumber as CustomerCustomerNumber,Info.Name as InfoName,CustomerQuote.QuoteDate as CustomerQuoteQuoteDate,CustomerQuote.ValidUntilDate as CustomerQuoteValidUntilDate,CustomerQuote.OurReference as CustomerQuoteOurReference,CustomerQuote.TaxExclusiveAmountCurrency as CustomerQuoteTaxExclusiveAmountCurrency,CustomerQuote.TaxInclusiveAmountCurrency as CustomerQuoteTaxInclusiveAmountCurrency,CustomerQuote.StatusCode as CustomerQuoteStatusCode,ID as ID,Customer.ID as CustomerID,CurrencyCode.Code as CurrencyCode&expand=Customer,Customer.Info,CurrencyCode&hateoas=true&distinct=false&filter=${filterQuery} &orderby=ID DESC`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getQuotes,
  createQuote,
  getQuoteDetails,
  addNewItem,
  deleteItem,
  editQuoteDetails,
  transferQuoteToInvoice,
  transferQuoteToOrder,
  registerQuote,
  searchQuotes,
};
