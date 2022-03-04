// @flow
import _ from 'lodash';
import ApiBuilder from '../helpers/ApiBuilder';
import { updateFileServerToken } from '../actions/userActions';

export const getImageLink = (fileRef:string, companyKey:string, fileServerToken:string, fileServerTokenUpdatedTimeStamp:Date, isThumbnail:boolean, width:int = 100, height:int =100):any => {
  const getLink = (_fileServerToken) => {
    if (fileRef) {
      if (isThumbnail)
        { return { uri: `${ApiBuilder.FILE_SERVER.defaults.baseURL}api/image?id=${fileRef}&key=${companyKey}&token=${_fileServerToken}&width=${width}&height=${height}` }; }
      else
        { return `${ApiBuilder.FILE_SERVER.defaults.baseURL}api/image?id=${fileRef}&key=${companyKey}&token=${_fileServerToken}`; }
    } else {
      return require('../images/InvoiceList/noInvoiceImageIcon.png');
    }
  };

  if (!validFileServerToken(fileServerTokenUpdatedTimeStamp)) {
    debouncedUpdateFileServerToken().catch(() => {});
  }
  return getLink(fileServerToken);
};

const debouncedUpdateFileServerToken = _.debounce(updateFileServerToken, 15000, {
  'leading': true
});

export const getResponseProblem = (statusCode) => {
  let problem = null;
  if (statusCode >= 200 && statusCode <= 299) {
    problem = null;
  } else if (statusCode === 403) {
    problem = 'UNAUTHORIZED';
  } else if (statusCode >= 400 && statusCode <= 499 && statusCode !== 403 && statusCode !== 408) {
    problem = 'CLIENT_ERROR';
  } else if (statusCode >= 500 && statusCode <= 599) {
    problem = 'SERVER_ERROR';
  } else if (statusCode === 408) {
    problem = 'TIMEOUT_ERROR';
  } else if (statusCode === null) {
    problem = 'OFFLINE';
  } else {
    problem = 'NETWORK_ERROR';
  }
  return problem;
};

export const isResponseOK = (statusCode) => {
  return (statusCode >= 200 && statusCode <= 299) ? true : false;
};

export const responseProcessor = (response) => {
  if (response) {
    response.ok = isResponseOK(response.status);
    response.problem = getResponseProblem(response.status);
  }
  else {
    response = {};
    response.ok = isResponseOK(null);
    response.problem = getResponseProblem(null);
  }
  return response;
};

export const validFileServerToken = (timestamp) => {
  const diff = new Date() - new Date(timestamp);
  return ((diff % 36e5) / 60000 < 2);
};

export const createGuid = () => {
  const S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (`${S4() + S4()  }-${  S4()  }-4${  S4().substr(0, 3)  }-${  S4()  }-${  S4()  }${S4()  }${S4()}`).toLowerCase();
};

export default APIUtil = {
  getImageLink,
  getResponseProblem,
  createGuid,
  isResponseOK,
  responseProcessor,
  validFileServerToken
};
