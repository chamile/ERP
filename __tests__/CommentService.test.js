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

describe('Testing CommentService.js api calls', () => {

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

  test('should load comments list', async (done) => {
    const data = await API.get(`api/biz/comments?expand=Author&filter=entitytype eq 'customerorder' and entityid eq 12`);
    expect(data.data).toBeType('array');
    done();
  });

});
