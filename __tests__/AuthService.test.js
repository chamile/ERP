import React from 'react';
import  axios, { create } from 'axios';

import renderer from 'react-test-renderer';


describe('Testing Authservice.js api calls', () => {

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

  test('should load user data', async (done) => {
    const data = await API.get(`api/biz/users?action=current-session`);
    expect(data.data.DisplayName).toEqual('Kalhara');
    expect(data.data.Email).toEqual('gayashanb@99x.lk');
    expect(data.data.GlobalIdentity).toEqual('c3f1e53a-606d-4afa-9ddc-16814f454460');
    expect(data.data.PhoneNumber).toEqual('+94770548334');
    expect(data.data.UserName).toEqual('gayashanb');
    done();
  });
});
