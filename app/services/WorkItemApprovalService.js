import ApiBuilder from '../helpers/ApiBuilder';

const createWorkItemGroup = (companyKey, workRelationID, fromDate, toDate) => {
  return ApiBuilder.API.post(`api/biz/workitemgroups?action=create-from-items&workrelationid=${workRelationID}&fromdate=${fromDate}&todate=${toDate}`, {},
    { headers: { 'CompanyKey': companyKey } });
};

const assignWorkItemGroup = (companyKey, workItemGroupID) => {
  return ApiBuilder.API.post(`api/biz/workitemgroups/${workItemGroupID}?action=Assign`, null,
    { headers: { 'CompanyKey': companyKey } });
};

const getDraftWorkItemGroups = (companyKey, workRelationID, fromDate, toDate) => {
  return ApiBuilder.API.get(`api/statistics/?model=workitemgroup&select=id as ID,statuscode as StatusCode,task.id as TaskID&join=workitemgroup.id eq task.entityid&expand=items&filter=workrelationid eq ${workRelationID} and items.date ge '${fromDate}' and items.date le '${toDate}' and isnull(task.modelid, 196) eq 196 AND ( statuscode eq 60001 or  statuscode eq 60009)`,
    { headers: { 'CompanyKey': companyKey } });
};

const getDraftWorkItemGroupsForEditWeek = (companyKey, workRelationID, fromDate, toDate) => {
  return ApiBuilder.API.get(`api/statistics/?model=workitemgroup&select=id as ID,statuscode as StatusCode,task.id as TaskID&join=workitemgroup.id eq task.entityid&expand=items&filter=workrelationid eq ${workRelationID} and items.date ge '${fromDate}' and items.date le '${toDate}' and isnull(task.modelid, 196) eq 196`,
    { headers: { 'CompanyKey': companyKey } });
};

const deleteWorkItemGroup = (companyKey, workItemGroupID) => {
  return ApiBuilder.API.delete(`api/biz/workitemgroups/${workItemGroupID}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getWorkLogsForMonth = (companyKey, monthStartDate, endDayOfMonth, workerRelationID) => {
  return ApiBuilder.API.get(`/api/biz/workrelations/${workerRelationID}?action=timesheet&fromdate=${monthStartDate}&todate=${endDayOfMonth}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getAvailableWorkGroupItemsForTimeRange = (companyKey, startDate, endDate, workerRelationID) => {
  return ApiBuilder.API.get(`api/statistics/?model=workitemgroup&select=id as ID,sum(items.minutes) as Minutes,sum(items.lunchInMinutes) as LunchInMinutes,statuscode as StatusCode&expand=items&filter=workrelationid eq ${workerRelationID} and items.date ge '${startDate}' and items.date le '${endDate}'`,
    { headers: { 'CompanyKey': companyKey } });
};

const getWorkItemGroup = (companyKey, taskEntityID) => {
  return ApiBuilder.API.get(`api/biz/workitemgroups/${taskEntityID}?expand=items, WorkRelation`,
    { headers: { 'CompanyKey': companyKey } });
};

const getCommentsForWorkItemGroups = (companyKey, taskEntityID) => {
  return ApiBuilder.API.get(`api/biz/comments?expand=Author&orderby=id desc&filter=entitytype eq 'workitemgroup' and (entityid eq ${taskEntityID})`,
    { headers: { 'CompanyKey': companyKey } });
};

export default {
  createWorkItemGroup,
  assignWorkItemGroup,
  getDraftWorkItemGroups,
  deleteWorkItemGroup,
  getWorkLogsForMonth,
  getAvailableWorkGroupItemsForTimeRange,
  getWorkItemGroup,
  getDraftWorkItemGroupsForEditWeek,
  getCommentsForWorkItemGroups,
};
