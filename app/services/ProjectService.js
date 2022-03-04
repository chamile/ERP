import ApiBuilder from '../helpers/ApiBuilder';

const createProject = (companyKey, project) => {
    return ApiBuilder.API.post('/api/biz/projects', project,
        { headers: { 'CompanyKey': companyKey } });
};

const editProject = (companyKey,id, project) => {
    return ApiBuilder.API.put(`/api/biz/projects/${id}`, project,
        { headers: { 'CompanyKey': companyKey } });
};

const getProjects = (companyKey, pageStart = 0, pageSize = '*') => {
    return ApiBuilder.API.get(`/api/biz/projects?skip=${pageStart}&top=${pageSize}`,
        { headers: { 'CompanyKey': companyKey } });
};

const getProjectDetails = (companyKey, id) => {
    return ApiBuilder.API.get(`/api/biz/projects/${id}`,
        { headers: { 'CompanyKey': companyKey } });
};

const getDimensionForProject = (companyKey, projectID) => {
    return ApiBuilder.API.get(`/api/biz/dimensions/?filter=ProjectID eq ${projectID}`,
        { headers: { 'CompanyKey': companyKey } });
};

export default {
    getProjects,
    getDimensionForProject,
    createProject,
    editProject,
    getProjectDetails,
};
