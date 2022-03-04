import { NavigationActions, StackActions } from 'react-navigation';
import { store } from '../App';
import CompanyService from '../services/CompanyService';
import AuthService from '../services/AuthService';
import { PermissionType } from '../constants/PermissionTypes';
import {
  setSelectedCompany,
  setSelectedCompanyPermissions,
  setSelectedCompanyBaseCurrencyData,
} from '../actions/companySelectActions';
import { updateUnreadNotificationCount } from '../actions/notificationActions';
import { updatePendingApprovalCount } from '../actions/approvalActions';

export const companySwitch = async (companyKey, navigationRoutesInsideMainDrawer) => {
  const { company: { companyList } } = store.getState();
  const newCompany = (companyList || []).find(e => e.Key === companyKey);
  const baseCurrency = { BaseCurrencyCodeID: '', BaseCurrencyCode: '' };
  let permissionList = [];
  let firstTabWithPermission = 'InvoiceTab';

  // navigate user to a new screen until background tasks are done
  store.dispatch(NavigationActions.navigate({ routeName: 'CompanySwitch', params: { companyName: newCompany.Name } }));

  try {
    // get required base currency for the company
    const res1 = await CompanyService.getCompanyBaseCurrency(newCompany.Key, newCompany.Name);
    if (res1) {
      baseCurrency.BaseCurrencyCodeID =  res1.data[0].BaseCurrencyCodeID;
      baseCurrency.BaseCurrencyCode =  res1.data[0].BaseCurrencyCode;
      newCompany.CustomerCreditDays = res1.data[0].CustomerCreditDays;
    }

    // get required data for the company
    const res2 = await AuthService.getCurrentSession(newCompany.Key);
    if (res2) {
      permissionList =  res2.data.Permissions ? res2.data.Permissions : [];
      firstTabWithPermission = getFirstTabWithPermission(permissionList);
    }
  }
  catch (e) {}

  // setting up redux store to use new company data
  store.dispatch(setSelectedCompanyBaseCurrencyData(baseCurrency.BaseCurrencyCodeID, baseCurrency.BaseCurrencyCode));
  store.dispatch(setSelectedCompanyPermissions(permissionList));
  store.dispatch(setSelectedCompany(newCompany));
  store.dispatch(updateUnreadNotificationCount(newCompany.Key));
  store.dispatch(updatePendingApprovalCount(newCompany.Key));

  if (navigationRoutesInsideMainDrawer) {
    store.dispatch(StackActions.reset({
      index: 0,
      key: undefined,
      actions: [
        NavigationActions.navigate({ routeName: 'MainDrawer', action: navigationRoutesInsideMainDrawer }),
      ]
    }));
  }
  else {
    store.dispatch(StackActions.reset({
      index: 0,
      key: undefined,
      actions: [
        NavigationActions.navigate({ routeName: 'MainDrawer', action: NavigationActions.navigate({ routeName: firstTabWithPermission }) })
      ]
    }));
  }
};

export const getFirstTabWithPermission = (permissionList) => { // define landing tab according to permissions here
  if (permissionList.length === 0 || (permissionList.includes(PermissionType.UI_ACCOUNTING) && permissionList.includes(PermissionType.UI_ACCOUNTING_BILLS))) {
    return 'InvoiceTab';
  } else if (permissionList.includes(PermissionType.UI_ACCOUNTING)) {
    return 'SalesTab';
  } else if (permissionList.includes(PermissionType.UI_TIMETRACKING)) {
    return 'HoursTab';
  } else {
    return 'NotificationsTab';
  }
};


export default {
  companySwitch,
  getFirstTabWithPermission,
};
