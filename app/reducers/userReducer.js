// @flow

const initialState = {
  isAuthenticated: false,
  isAuthenticatedFileServer: false,
  isFetching: false,
  error: null,
  activeUser: {
    username: '',
    userId: null,
    email: '',
    globalIdentity: '',
    displayName: '',
    lastLoginEnv: '',
  }
};

function userReducer(state = initialState, action) {
  switch (action.type) {
    case 'AUTHENTICATE_USER_PENDING':
      return { ...initialState, isFetching: true, isAuthenticated: false };
    case 'AUTHENTICATE_USER_SUCCESS':
      return { ...state, isFetching: false, isAuthenticated: true };
    case 'AUTHENTICATE_USER_FAILED':
      return { ...state, isFetching: false, isAuthenticated: false };
    case 'REFRESH_ACCESS_TOKEN_FAILED':
      return { ...state, isFetching: false, isAuthenticated: false };
    case 'SET_CURRENT_USER_DETAILS':
      return { ...state, activeUser: { ...state.activeUser, displayName: action.payload.DisplayName, userId: action.payload.ID, email: action.payload.Email, globalIdentity: action.payload.GlobalIdentity } };

    case 'USER_LOG_OUT':
      return { ...state, ...initialState };

    case 'SET_BASE_ENV':
    case 'CHANGE_BASE_ENV':
      return { ...state, activeUser: { ...state.activeUser, lastLoginEnv: action.payload } };

    case 'AUTHENTICATE_FILE_SERVER_PENDING':
      return { ...state, isAuthenticatedFileServer: false };
    case 'AUTHENTICATE_FILE_SERVER_SUCCESS':
      return { ...state, isAuthenticatedFileServer: true  };
    case 'AUTHENTICATE_FILE_SERVER_FAILED':
      return { ...state };

    default:
      return state;
  }
}

export default userReducer;
