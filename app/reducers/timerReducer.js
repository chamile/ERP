// @flow
const initialState = {
  companies: []
};

function timerReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_COMPANIES_FOR_TIMER':
      return { ...state, companies: { ...state.companies, ...action.payload } };
    case 'UPDATE_CURRENT_TIMER_INFO':
      return { ...state, companies: { ...state.companies, ...action.payload } };
    case 'CLEAR_COMPANIES_FOR_TIMER':
      return { ...state, companies: [] };
    default:
      return state;
  }
}

export default timerReducer;
