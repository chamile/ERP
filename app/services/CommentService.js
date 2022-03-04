import ApiBuilder from '../helpers/ApiBuilder';

const getComments = (entityId, entityType, companyKey) => {
  return ApiBuilder.API.get(`/api/biz/comments?expand=Author&filter=entitytype eq '${entityType}' and entityid eq ${entityId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const postNewComment = (entityId, entityType, comment, companyKey) => {
  return ApiBuilder.API.post(`/api/biz/comments/${entityType}/${entityId}`, { Text: comment },
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  getComments,
  postNewComment
};
