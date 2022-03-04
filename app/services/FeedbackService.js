import ApiBuilder from '../helpers/ApiBuilder';

const sendFeedback = (companyKey, title, text) => {
  const meta = {
    headers: {
      'companykey': companyKey
    }
  };
  const data = {
    Title: title,
    Description: text,
    Modules: ['mobile'],
    Metadata: {
      AbsoluteUri: 'mobile',
      LocalTime: (new Date()).toISOString(),
      GitRev: 'https://github.com/unimicro/AppFrontend/commit/' + "APP_VERSION" //todo: add proper version
    }
  };
  return ApiBuilder.INTEGRATION_SERVER.post('/api/feedback', data, meta);
};

export default {
  sendFeedback
};
