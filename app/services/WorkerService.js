import ApiBuilder from '../helpers/ApiBuilder';

const getOrCreateWorkerFromUser = (companyKey, loggedInUserId) => {

  //TODO: api/biz/workrelations is probbably the wrong endpoint getting workers... try and decode the "timefangst" code
  return ApiBuilder.API.get(`api/biz/workrelations?expand=worker&filter=worker.userid eq ${loggedInUserId}&hateoas=false`,
    { headers: { 'CompanyKey': companyKey } })
    .then(res => res[0] ? res[0] : _createWorkerFromUser(companyKey, loggedInUserId));
};

const _createWorkerFromUser = (companyKey, loggedInUserId) => {
  return ApiBuilder.API.post(`api/biz/workers/?action=create-worker-from-user&userid=${loggedInUserId}`, null,
    { headers: { 'CompanyKey': companyKey } });
};

const getTotalLoggedTime = (companyKey, workerRelationID, startDate, endDate) => {
  return ApiBuilder.API.get(`api/statistics/?model=workitem&select=sum(minutes),Date&filter=workrelationid eq ${workerRelationID} and ( date ge '${startDate}' and date le '${endDate}') and ( WorkType.SystemType eq 1 or WorkType.SystemType eq 12 ) &join=workitem.worktypeid eq worktype.id`,
    { headers: { 'CompanyKey': companyKey } })
    .then(res => {
      if (!res.data.Success) {
        throw new Error(res.data.Message);
      }
      return res;
    });
};

const getWorkLogsForDay = (companyKey, workerRelationID, selectedDate) => {
  return ApiBuilder.API.get(`api/biz/workitems?expand=WorkType, Dimensions, Dimensions.Project, Dimensions.Department, CustomerOrder, Customer, Customer.Info, WorkItemGroup&filter= WorkRelationID eq ${workerRelationID} and (date eq '${selectedDate}') &orderBy=StartTime`,
    { headers: { 'CompanyKey': companyKey } });
};

const getLatestEndTime = (companyKey, workerRelationID, selectedDate) => {
  return ApiBuilder.API.get(`api/biz/workitems?&filter=WorkRelationID eq ${workerRelationID} and (date eq '${selectedDate}') &orderBy=EndTime desc &top=1 $select=EndTime`,
    { headers: { 'CompanyKey': companyKey } })
    .then( res => {
      if (res.ok) {
        res.data = res.data.length > 0 ? res.data[0].EndTime : null;
      }
      return res;
    });
};

const deleteLoggedTime = (companyKey, workItemId) => {
  return ApiBuilder.API.delete(`api/biz/workitems/${workItemId}`,
    { headers: { 'CompanyKey': companyKey } });
};

const getWorkingProjects = (companyKey) => {
  return ApiBuilder.API.get(`api/biz/projects?select=ProjectNumber,Name`,
    { headers: { 'CompanyKey': companyKey } });
};

const getWorkTypes = (companyKey) => {
  return ApiBuilder.API.get(`api/biz/worktypes?select=ID,Name`,
    { headers: { 'CompanyKey': companyKey } });
};

const getOrders = (companyKey) => {
  return ApiBuilder.API.get(`api/biz/orders?select=OrderNumber,CustomerName`,
    { headers: { 'CompanyKey': companyKey } });
};

const createWorkLog = (companyKey, workItem) => {
  return ApiBuilder.API.post(`api/biz/workitems`, workItem,
    { headers: { 'CompanyKey': companyKey } });
};

const editWorkLog = (companyKey, workItem) => {
  return ApiBuilder.API.put(`api/biz/workitems/${workItem.ID}`, workItem,
    { headers: { 'CompanyKey': companyKey } });
};

const getWorkRelations = (companyKey, workerId) => {
  return ApiBuilder.API.get(`api/biz/workrelations?filter=workerid eq ${workerId}&expand=workprofile`,
    { headers: { 'CompanyKey': companyKey } });
};

const getWorkProfiles = (companyKey) => {
  return ApiBuilder.API.get(`api/biz/workprofiles`,
    { headers: { 'CompanyKey': companyKey } });
};

const getRelationsForWorker = (companyKey, workerId, companyName) => {
  return getWorkRelations(companyKey, workerId).then((list) => {
    // Try to create initial workrelation for this worker
    if ((!list.data) || list.data.length === 0) {
      return getWorkProfiles(companyKey)
        .then(profiles => createInitialWorkRelation(companyKey, workerId, profiles.data[0], companyName)
        ).then(workRelation => workRelation)
    } else {
      return list;
    }
  });
};

const createInitialWorkRelation = (companyKey, workerId, workProfile, companyName) => {
  const postData = {
    WorkerID: workerId,
    CompanyName: companyName,
    WorkPercentage: 100,
    Description: workProfile.Name,
    StartDate: _firstDayInCurrentMonth(), // first day of current month
    IsActive: true,
    WorkProfileID: workProfile.ID
  };
  return ApiBuilder.API.post(`api/biz/workrelations`, postData,
    { headers: { 'CompanyKey': companyKey } });
};

function _firstDayInCurrentMonth() {
  const d = new Date();
  d.setDate(1);
  return d;
}

export default {
  getOrCreateWorkerFromUser,
  getTotalLoggedTime,
  getWorkLogsForDay,
  deleteLoggedTime,
  getWorkingProjects,
  getWorkTypes,
  getOrders,
  createWorkLog,
  editWorkLog,
  getWorkRelations,
  getWorkProfiles,
  getRelationsForWorker,
  getLatestEndTime
};
