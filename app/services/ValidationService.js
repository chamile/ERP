import ApiBuilder from '../helpers/ApiBuilder';

const validateWorkType = (companyKey, workTypeId) => {
  return ApiBuilder.API.get(`api/biz/worktypes/${workTypeId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const validateProject = (companyKey, projectId) => {
  return ApiBuilder.API.get(`api/biz/projects/${projectId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const validateDepartment = (companyKey, departmentId) => {
  return ApiBuilder.API.get(`api/biz/departments/${departmentId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const validateOrder = (companyKey, orderId) => {
  return ApiBuilder.API.get(`api/biz/orders/${orderId}`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  validateWorkType,
  validateProject,
  validateDepartment,
  validateOrder
};
