import React from 'react';
import  axios, { create } from 'axios';

import renderer from 'react-test-renderer';

expect.extend({
	toBeType(received, argument) {
		const initialType = typeof received;
		const type = initialType === "object" ? Array.isArray(received) ? "array" : initialType : initialType;
		return type === argument ? {
			message: () => `expected ${received} to be type ${argument}`,
			pass: true
		} : {
			message: () => `expected ${received} to be type ${argument}`,
			pass: false
		};
	}
});

describe('Testing CustomerService.js api calls', () => {

  const BASE_URL = 'https://test-api.unieconomy.no/';
  let API;
  let access_token = '';
  const company_key = '9d9d8734-6b5e-4972-bde3-811d46c894a0';

  beforeAll(async (done) => {
    const credentials = {
      username: 'gayashanb',
      password: 'test@1111college'
    };

    const _data = await axios.post(`${BASE_URL}api/init/sign-in`, credentials);
    access_token = _data.data.access_token;

    API = create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_data.data.access_token}`,
        'CompanyKey': company_key
      },
    });
    done();
    return { access_token: _data.data.access_token, company_key: '9d9d8734-6b5e-4972-bde3-811d46c894a0', API };
  });

  test('Is User login success', () => {
    expect(company_key).toEqual('9d9d8734-6b5e-4972-bde3-811d46c894a0');
    expect(access_token).toBeDefined();
  });

  test('should get customers as an array', async (done) => {
    const data = await API.get(`api/biz/customers/?expand=Info, Info.DefaultEmail, Info.InvoiceAddress, Info.ShippingAddress &filter=StatusCode eq 20001 OR StatusCode eq 30001`);
    expect(data.data).toBeType('array');
    done();
  });

  test('should get customer details', async (done) => {
    const data = await API.get(`api/biz/customers/1?expand=Info,Info.Addresses, Info.InvoiceAddress, Info.ShippingAddress, Info.DefaultEmail, Info.DefaultPhone, CurrencyCode, BusinessRelation`);
    expect(data.data).toBeType('object');
    expect(data.data.ID).toEqual(1);
    done();
  });

  test('should get customer KPI order details', async (done) => {
    const data = await API.get(`api/statistics?model=Customer&expand=CustomerOrders&filter=Customer.ID eq 1 and isnull(CustomerOrders.Deleted,'false') eq 'false'&select=Customer.ID as CustomerID,sum(casewhen(CustomerOrders.StatusCode eq 41002 or CustomerOrders.StatusCode eq 41003\,CustomerOrders.TaxExclusiveAmountCurrency\,0)) as SumOpenOrdersExVatCurrency`);
    expect(data.data).toBeType('object');
    expect(data.data.Data).toBeType('array');
    expect(data.data.Data[0].SumOpenOrdersExVatCurrency).toBeDefined();
    done();
  });

  test('should get customer KPI total invoices details', async (done) => {
    const data = await API.get(`api/statistics?model=Customer&expand=CustomerInvoices&filter=Customer.ID eq 1 and isnull(CustomerInvoices.Deleted,'false') eq 'false' &select=Customer.ID as CustomerID,sum(casewhen(getdate() gt CustomerInvoices.PaymentDueDate and CustomerInvoices.StatusCode ne 42004\,1\,0)) as NumberOfDueInvoices,sum(casewhen(getdate() gt CustomerInvoices.PaymentDueDate and CustomerInvoices.StatusCode ne 42004\,CustomerInvoices.RestAmountCurrency\,0)) as SumDueInvoicesRestAmountCurrency,sum(casewhen(CustomerInvoices.StatusCode eq 42002 or CustomerInvoices.StatusCode eq 42003 or CustomerInvoices.StatusCode eq 42004\,CustomerInvoices.TaxExclusiveAmountCurrency\,0)) as SumInvoicedExVatCurrency`);
    expect(data.data).toBeType('object');
    expect(data.data.Data).toBeType('array');
    expect(data.data.Data[0].SumInvoicedExVatCurrency).toBeDefined();
    expect(data.data.Data[0].SumDueInvoicesRestAmountCurrency).toBeDefined();
    expect(data.data.Data[0].NumberOfDueInvoices).toBeDefined();
    done();
  });
  
});
