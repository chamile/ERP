import { EntityType } from '../constants/EntityTypes';

export const validateRecentData = (data, companyKey) => {
  return { type: 'VALIDATE_RECENT_DATA', payload: { ...data, companyKey } };
};

export const updateCompaniesRecentData = (data = []) => {
  return { type: 'UPDATE_COMPANIES_RECENT_DATA', payload:  data  };
};

export const updateSearchKeywords = (entityType, searchKeyword) => {
  let type = '';
  switch (entityType) {
    case EntityType.CUSTOMER_ORDER: {
      type = 'UPDATE_CUSTOMER_ORDER_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.PRODUCT: {
      type = 'UPDATE_PRODUCT_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.CUSTOMER: {
      type = 'UPDATE_CUSTOMER_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.PROJECT: {
      type = 'UPDATE_PROJECT_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.SELLER: {
      type = 'UPDATE_SELLER_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.CURRENCY: {
      type = 'UPDATE_CURRENCY_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.SUPPLIER: {
      type = 'UPDATE_SUPPLIER_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.PHONEBOOK_SEARCH: {
      type = 'UPDATE_PHONEBOOK_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.WORK_TYPE: {
      type = 'UPDATE_WORK_TYPE_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.VAT_TYPE: {
      type = 'UPDATE_VAT_TYPE_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.DEPARTMENT: {
      type = 'UPDATE_DEPARTMENT_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.COUNTRY: {
      type = 'UPDATE_COUNTRY_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.CUSTOMER_INVOICE: {
      type = 'UPDATE_CUSTOMER_INVOICE_SEARCH_KEYWORDS';
      break;
    }
    case EntityType.CUSTOMER_QUOTE: {
      type = 'UPDATE_CUSTOMER_QUOTE_SEARCH_KEYWORDS';
      break;
    }
  }
  return { type, payload: { entityType, searchKeyword } };
};


export const udpadeRecentlyAddedBankAccounts = (data = []) => {
  return { type: 'UPDATE_RECENTLY_USED_BANK_ACCOUNTS', payload:  data  };
};