import { Dimensions, Platform } from 'react-native';
import { theme } from '../styles';

export function isIphoneX() {
  let dim = Dimensions.get('window');
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    ((dim.height === 812 || dim.width === 812) || (dim.height === 896 || dim.width === 896))
  );
}

export function isIphone5() {
  let dim = Dimensions.get('window');
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (dim.height === 568 || dim.width === 568)
  );
}

export function isSmallerThanIphone6() {
  let dim = Dimensions.get('window');
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    (dim.height < 667 || dim.width < 375)
  );
}

export function ifIphoneX(iphoneXStyle, regularStyle) {
  if (isIphoneX()) {
    return iphoneXStyle;
  } else {
    return regularStyle;
  }
}

export function getHeaderStyle() {
  return ifIphoneX({ backgroundColor: theme.PRIMARY_COLOR, elevation: 0 }, { backgroundColor: theme.PRIMARY_COLOR, elevation: 0, paddingBottom: 1 });
}
