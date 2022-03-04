// @flow

const initialState = {
  selectedCompany: {},
  permissions: null,
  companyList: []
};

function companyReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_COMPANY_DETAILS':
      return { ...state, selectedCompany: { ...state.selectedCompany, ...action.payload } };
    case 'SET_COMPANY_PERMISSIONS':
      return { ...state, permissions: [...action.payload] };
    case 'RESET_COMPANY_PERMISSIONS':
      return { ...state, permissions: null };
    case 'SET_COMPANY_BASE_CURRENCY_DATA':
      return { ...state, selectedCompany: { ...state.selectedCompany, ...action.payload } };
    case 'SET_COMPANY_LIST':
      return { ...state, companyList: [...action.payload] };
    case 'USER_LOG_OUT':
      return { ...state, companyList: [] };
    default:
      return state;
  }
}

export default companyReducer;
