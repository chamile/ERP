// @flow
import { NavigationActions, StackActions } from 'react-navigation';

export const resetToTabs = (selectedTab) => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'MainDrawer', action: NavigationActions.navigate({ routeName: selectedTab }) })
    ]
  });
};

export const resetToSignIn = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'Login' })
    ]
  });
};

export const setAvailableCompanyList = (list) => {
  return { type: 'SET_COMPANY_LIST',  payload: [...list] };
};

export const userLogout = () => {
  return { type: 'USER_LOG_OUT' };
};

export const setSelectedCompany = (company) => {
  return { type: 'SET_COMPANY_DETAILS', payload: { ...company } };
};

export const setCompaniesForRecentData = (companies = []) => {
  return { type: 'SET_COMPANIES_FOR_RECENT_DATA', payload: companies };
};

export const clearCompaniesForRecentData = () => {
  return { type: 'CLEAR_COMPANIES_FOR_RECENT_DATA' };
};

export const setSelectedCompanyPermissions = (permissionList) => {
  return { type: 'SET_COMPANY_PERMISSIONS', payload: [...permissionList] };
};

export const resetSelectedCompanyPermissions = () => {
  return { type: 'RESET_COMPANY_PERMISSIONS' };
};

export const setSelectedCompanyBaseCurrencyData = (BaseCurrencyCodeID, BaseCurrencyCode) => {
  return { type: 'SET_COMPANY_BASE_CURRENCY_DATA', payload: { BaseCurrencyCodeID, BaseCurrencyCode } };
};
