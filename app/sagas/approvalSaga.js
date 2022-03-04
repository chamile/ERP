import { put, call, takeEvery } from 'redux-saga/effects';
import ApprovalService from '../services/ApprovalService';
import AuthService from '../services/AuthService';
import { ApprovalStatusCodes } from '../constants/ApprovalConstants';

function* updateApprovalCount({ payload })
{
  try {
      const authResponse = yield call(AuthService.getCurrentSession, payload);
      if (authResponse.ok) {
        const response = yield call(ApprovalService.getPendingApprovals, authResponse.data.ID, ApprovalStatusCodes.ACTIVE, payload);
        if (response.ok) {
          yield put({ type: 'SET_APPROVAL_COUNTER', payload: response.data.length });
        }
      }
  }
  catch (error) {
    yield put({ type: 'RESET_APPROVAL_COUNTER' });
  }
}

export function* approvalSaga() {
  yield [
    takeEvery('UPDATE_APPROVAL_COUNTER', updateApprovalCount)
  ];
}
