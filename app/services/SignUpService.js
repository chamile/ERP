import ApiBuilder from '../helpers/ApiBuilder';

const registerNewUser = (user) => {
  return ApiBuilder.API.post('api/init/confirmation', user);
};

const forgotPassword = (email) => {
  return ApiBuilder.API.post('api/init/forgot-password', { email });
};

export default {
  registerNewUser,
  forgotPassword
};
