import { spawn } from 'redux-saga/effects';

import { authSaga } from './authSaga';
import { tokenSaga } from './tokenSaga';
import { validateSaga } from './validateSaga';
import { notificationSaga } from './notificationSaga';
import { approvalSaga } from './approvalSaga';

export default function* rootSaga() {
  yield [
    spawn(authSaga),
    spawn(tokenSaga),
    spawn(validateSaga),
    spawn(notificationSaga),
    spawn(approvalSaga),
  ];
}
