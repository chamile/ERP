import Logentries from 'react-native-logentries';
import { Platform } from 'react-native';
import VersionNumber from 'react-native-version-number';
import RNConfigReader from 'react-native-config-reader';

const useEnv = (env) => {
  if (env === 'pilot') {
    Logentries.setDebugging(false); // if you need logs on console even in the pilot environment you may change this to true
    Logentries.setToken(RNConfigReader.LOGENTRIES_RELEASE_ENV_KEY); // API key can be found here https://logentries.com/app/37c790e0#/user-account/apikey
  } else if (env === 'test') {
    Logentries.setDebugging(true);
    Logentries.setToken(RNConfigReader.LOGENTRIES_DEVELOPMENT_ENV_KEY); // API key can be found here https://logentries.com/app/37c790e0#/user-account/apikey
  }
};

const log = (Msg, CallPoint = null, Component_State = null) => {
  const { OS, Version } = Platform;
  const logEntry = {
    Platform_OS: OS,
    Platform_Version: Version,
    BuilD_No: `${VersionNumber.appVersion}.${VersionNumber.buildVersion}`,
    CallPoint,
    Component_State,
    Msg,
  };
  Logentries.log(JSON.stringify(logEntry));
};

export default {
  useEnv,
  log
};
