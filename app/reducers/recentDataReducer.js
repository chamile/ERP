import _ from 'lodash';
import { REHYDRATE } from 'redux-persist';

const initialState = {
  companies: {},
  searchKeywords: {
    CUSTOMER_ORDER: [],
    PHONEBOOK_SEARCH: [],
    CUSTOMER: [],
    PROJECT: [],
    CURRENCY: [],
    SUPPLIER: [],
    DEPARTMENT: [],
    PRODUCT: [],
    VAT_TYPE: [],
    WORK_TYPE: [],
    SELLER: [],
    COUNTRY: [],
    CUSTOMER_INVOICE: [],
    CUSTOMER_QUOTE: [],
  }
};


function recentDataReducer(state = initialState, action) {
  switch (action.type) {
    case REHYDRATE: // since redux persisit rehydrates only merges level 1 fileds on hierarchy we miss some data in arrays saved inside searchKeyords object. So we do handle REHYDRATE action manually inside the reducer.
      if (action.payload && action.payload.recentData) {
        return { ...state, ...action.payload.recentData, searchKeywords: { ...state.searchKeywords, ...action.payload.recentData.searchKeywords } };
      }
      else {
        return { ...state };
      }
    case 'VALIDATE_RECENT_DATA':
      return { ...state };
    case 'SET_COMPANIES_FOR_RECENT_DATA':
      return { ...state, companies: { ...state.companies,...action.payload } };
    case 'UPDATE_COMPANIES_RECENT_DATA':
      return { ...state, companies: { ...state.companies,...action.payload } };
    case 'CLEAR_COMPANIES_FOR_RECENT_DATA':
      return { ...initialState };
    case 'UPDATE_CUSTOMER_ORDER_SEARCH_KEYWORDS':
      return { ...state, searchKeywords: { ...state.searchKeywords, CUSTOMER_ORDER: _getUpdatedKeywordList(state.searchKeywords.CUSTOMER_ORDER, action.payload.searchKeyword) } };
    case 'UPDATE_PRODUCT_SEARCH_KEYWORDS':
      return { ...state, searchKeywords: { ...state.searchKeywords, PRODUCT: _getUpdatedKeywordList(state.searchKeywords.PRODUCT, action.payload.searchKeyword) } };
    case 'UPDATE_CUSTOMER_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, CUSTOMER: _getUpdatedKeywordList(state.searchKeywords.CUSTOMER, action.payload.searchKeyword) } };
    }
    case 'UPDATE_PROJECT_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, PROJECT: _getUpdatedKeywordList(state.searchKeywords.PROJECT, action.payload.searchKeyword) } };
    }
    case 'UPDATE_CURRENCY_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, CURRENCY: _getUpdatedKeywordList(state.searchKeywords.CURRENCY, action.payload.searchKeyword) } };
    }
    case 'UPDATE_PHONEBOOK_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, PHONEBOOK_SEARCH: _getUpdatedKeywordList(state.searchKeywords.PHONEBOOK_SEARCH, action.payload.searchKeyword) } };
    }
    case 'UPDATE_SELLER_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, SELLER: _getUpdatedKeywordList(state.searchKeywords.SELLER, action.payload.searchKeyword) } };
    }
    case 'UPDATE_VAT_TYPE_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, VAT_TYPE: _getUpdatedKeywordList(state.searchKeywords.VAT_TYPE, action.payload.searchKeyword) } };
    }
    case 'UPDATE_SUPPLIER_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, SUPPLIER: _getUpdatedKeywordList(state.searchKeywords.SUPPLIER, action.payload.searchKeyword) } };
    }
    case 'UPDATE_DEPARTMENT_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, DEPARTMENT: _getUpdatedKeywordList(state.searchKeywords.DEPARTMENT, action.payload.searchKeyword) } };
    }
    case 'UPDATE_WORK_TYPE_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, WORK_TYPE: _getUpdatedKeywordList(state.searchKeywords.WORK_TYPE, action.payload.searchKeyword) } };
    }
    case 'UPDATE_COUNTRY_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, COUNTRY: _getUpdatedKeywordList(state.searchKeywords.COUNTRY, action.payload.searchKeyword) } };
    }
    case 'UPDATE_CUSTOMER_INVOICE_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, CUSTOMER_INVOICE: _getUpdatedKeywordList(state.searchKeywords.CUSTOMER_INVOICE, action.payload.searchKeyword) } };
    }
    case 'UPDATE_CUSTOMER_QUOTE_SEARCH_KEYWORDS': {
      return { ...state, searchKeywords: { ...state.searchKeywords, CUSTOMER_QUOTE: _getUpdatedKeywordList(state.searchKeywords.CUSTOMER_QUOTE, action.payload.searchKeyword) } };
    }
    default:
      return state;
  }
}

function _getUpdatedKeywordList(list = [], searchKeyword) {
  if (searchKeyword === '') {
    return list;
  } else if (list.some(keyword => keyword.toUpperCase() === searchKeyword.toUpperCase())) { // check if list contains the searchKeyword
    _.remove(list, keyword => keyword.toUpperCase() === searchKeyword.toUpperCase());
    return list.concat(searchKeyword);
  } else {
    return list.length > 4 ? _.tail(list).concat(searchKeyword) : list.concat(searchKeyword);
  }
}

export default recentDataReducer;
