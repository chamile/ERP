const initialState = {
  accessToken: '',
  fileServerToken: '',
  fileServerTokenUpdatedTimeStamp: null,
  authProvider: '',
  refreshToken: '',
  accessTokenExpirationDate: null,
};

function tokenReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_ACCESS_TOKENS':
      return { ...state, accessToken: action.payload.accessToken, refreshToken: action.payload.refreshToken, accessTokenExpirationDate: action.payload.accessTokenExpirationDate, authProvider: action.payload.authProvider };
    case 'SET_FILESERVER_TOKENS':
      return { ...state, fileServerTokenUpdatedTimeStamp: new Date(), fileServerToken: action.payload };
    case 'CLEAR_TOKENS':
      return { ...initialState };
    default:
      return state;
  }
}

export default tokenReducer;
