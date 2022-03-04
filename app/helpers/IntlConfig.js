let IntlObj = global.Intl || null;

if (!IntlObj) {
  IntlObj = require('intl');
  require( 'intl/locale-data/jsonp/en');
  require( 'intl/locale-data/jsonp/nn');
  require( 'intl/locale-data/jsonp/nb');
}

const IntlPollyfill = IntlObj;

export default IntlPollyfill;
