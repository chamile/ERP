import { put, call, takeEvery } from 'redux-saga/effects';
import NotificationService from '../services/NotificationService';

function* updateNotificationCount({ payload })
{
  try {
      const response = yield call(NotificationService.getNotificationCount, payload);
      if (response.ok) {
        yield put({ type: 'SET_NOTIFICATION_COUNTER', payload: response.data.Count });
      }
  }
  catch (error) {
    yield put({ type: 'RESET_NOTIFICATION_COUNTER' });
  }
}

export function* notificationSaga() {
  yield [
    takeEvery('UPDATE_NOTIFICATION_COUNTER', updateNotificationCount)
  ];
}
