// @flow

const initialState = {
  isFirstTime: true,
  isOnBoardComplete: false,
  isPushAuthenticated: false,
  isCameraAuthenticated: false,
  isLoggedOut: false,
  lastLoggedIn: null,
  lastLoggedOut: null,
};

function appReducer(state = initialState, action) {
  switch (action.type) {
    case 'AUTHENTICATE_USER_SUCCESS':
      return { ...state, lastLoggedIn: new Date().toISOString(), isLoggedOut: false };
    case 'USER_ONBOARD_COMPLETE':
      return { ...state, isOnBoardComplete: true, isFirstTime: false };
    case 'USER_LOG_OUT':
      return { ...state, isLoggedOut: true, lastLoggedOut: new Date().toISOString() };
    default:
      return state;
  }
}

export default appReducer;
