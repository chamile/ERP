// @flow
import { NavigationActions, StackActions } from 'react-navigation';

export const completeOnboarding = () => {
  return {
    type: 'USER_ONBOARD_COMPLETE',
  }
};

export const resetToCompanySelect = () => {
  return StackActions.reset({
    index: 0,
    key: undefined,
    actions: [
      NavigationActions.navigate({ routeName: 'CompanySelect' })
    ]
  });
}
