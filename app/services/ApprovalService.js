import ApiBuilder from '../helpers/ApiBuilder';

const getPendingApprovals = (userID, StatusCode, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/approvals?filter=UserID eq ${userID} and StatusCode eq ${StatusCode}&orderby=ID desc&expand=Task.Model,Task.User`,
    { headers: { 'CompanyKey': companyKey } });
};

const getAllApprovals = (userID, companyKey, skippingStatusCode, pageStart = 0, pageSize = 0) => {
  return ApiBuilder.API.get(`/api/biz/approvals?filter=UserID eq ${userID} and StatusCode ne ${skippingStatusCode}&top=${pageSize}&orderby=ID desc&expand=Task.Model,Task.User&skip=${pageStart}`,
    { headers: { 'CompanyKey': companyKey } });
};

const approveApproval = (approvalID, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/approvals/${approvalID}?action=approve`, null,
    { headers: { 'CompanyKey': companyKey } });
};

const rejectApproval = (approvalID, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/approvals/${approvalID}?action=reject`, null,
    { headers: { 'CompanyKey': companyKey } });
};

const addCommentAtRejection = (comment, workGroupId, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/comments/WorkItemGroup/${workGroupId}`, { Text: comment },
  { headers: { 'CompanyKey': companyKey } });
};

const getAllApprovalById = (approvalID, userID, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/approvals/${approvalID}?filter=UserID eq ${userID} &expand=Task.Model,Task.User`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getPendingApprovals,
  getAllApprovals,
  approveApproval,
  rejectApproval,
  addCommentAtRejection,
  getAllApprovalById,
};
