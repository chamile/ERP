// @flow

const initialState = {
  draftWorkLog: {}
};

function draftDataReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_USER_DRAFT_WORKLOG_DATA':
      return { ...state, draftWorkLog: { ...action.payload } };
    default:
      return state;
  }
}

export default draftDataReducer;
