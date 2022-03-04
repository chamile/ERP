// @flow
import { isArray } from 'lodash';

const initialState = {
  errors: []
};

function errorReducer(state = initialState, action) {
  switch (action.type) {
    case 'PUSH_ERROR':
      const errors = isArray(action.payload) ? action.payload : [action.payload];
      return { ...state, errors: [...errors] };
    case 'FLUSH_ERRORS':
      return { ...state, errors: [] };
    default:
      return state;
  }
}

export default errorReducer;
