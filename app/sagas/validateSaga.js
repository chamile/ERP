import { put, call, all, takeEvery } from 'redux-saga/effects';
import ValidationService from '../services/ValidationService';

function* validateRecentData({ payload }) {
  let recentData = payload.companies[payload.companyKey];
  try {
    if (recentData.project && recentData.project.id) {
      const resProject = yield call(ValidationService.validateProject, payload.companyKey, recentData.project.id);
      if (!resProject.ok || resProject.data.Deleted) {
        recentData.project = null;
      }
    }
    if (recentData.department && recentData.department.id) {
      const resDepartment = yield call(ValidationService.validateDepartment, payload.companyKey, recentData.department.id);
      if (!resDepartment.ok || resDepartment.data.Deleted) {
        recentData.department = null;
      }
    }
    if (recentData.workType && recentData.workType.id) {
      const resWorkType = yield call(ValidationService.validateWorkType, payload.companyKey, recentData.workType.id);
      if (!resWorkType.ok || resWorkType.data.Deleted) {
        recentData.workType = null;
      }
    }
    if (recentData.order && recentData.order.id) {
      const resOrder = yield call(ValidationService.validateOrder, payload.companyKey, recentData.order.id);
      if (!resOrder.ok || resOrder.data.Deleted) {
        recentData.order = null;
      }
    }
    payload.companies[payload.companyKey] = recentData
    yield put({ type: 'UPDATE_COMPANIES_RECENT_DATA', payload: { ...payload.companies } });
  }
  catch (error) {
    yield all([
      put({ type: 'CLEAR_COMPANIES_FOR_RECENT_DATA' }),
      put({ type: 'CLEAR_COMPANIES_FOR_TIMER' })
    ]);
  }
}

export function* validateSaga() {
  yield [
    takeEvery('VALIDATE_RECENT_DATA', validateRecentData)
  ];
}
