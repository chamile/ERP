// @flow
import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import _ from 'lodash';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { ProjectStatusCodes } from '../../constants/ProjectConstants';

const _processStatus = (status) => {
  let text = null;
  let color = 'transparent';
  switch (status) {
    case ProjectStatusCodes.REGISTERED: {
      text = i18n.t('ProjectList.index.registered');
      color = theme.SCREEN_COLOR_LIGHT_BLUE;
      break;
    }
    case ProjectStatusCodes.OFFERES_PHASE: {
      text = i18n.t('ProjectList.index.offeresPhase');
      color = theme.SCREEN_COLOR_ORANGE;
      break;
    }
    case ProjectStatusCodes.ONGOING: {
      text = i18n.t('ProjectList.index.ongoing');
      color = theme.SCREEN_COLOR_GREEN;
      break;
    }
    case ProjectStatusCodes.COMPLETED: {
      text = i18n.t('ProjectList.index.completed');
      color = theme.SCREEN_COLOR_NAVY_BLUE;
      break;
    }
    case ProjectStatusCodes.FILED: {
      text = i18n.t('ProjectList.index.filed');
      color = theme.SCREEN_COLOR_PURPLE;
      break;
    }
    default: {
      text = i18n.t('ProjectList.index.registered');
      color = theme.SCREEN_COLOR_GREY;
    }
  }
  return { text, color };
};

export const ProjectListRow = ({ item, index, onSelect }) => {
  const StatusObj = _processStatus(item.StatusCode);

  return (
    <Touchable onPress={() => onSelect(item)} key={item.ID} style={styles.button}>
      <View style={styles.mainTextContainer}>
        <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{(item.Name) ? _.capitalize(item.Name) : i18n.t('ProjectList.index.unknown')}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoText}>{`${i18n.t('ProjectList.index.projectNumber')}: ${item.ProjectNumber}`}</Text>
            <Text style={styles.infoText} numberOfLines={2}>{`${i18n.t('ProjectList.index.description')}: ${item.Description || i18n.t('ProjectList.index.notAvailable')}`}</Text>
          </View>

          <View style={styles.infoRight}>
            <Text numberOfLines={1} style={{ fontSize: 13, color: StatusObj.color }}>{StatusObj.text}</Text>
          </View>
        </View>

      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10,
  },
  infoLeft: {
    flex: 3,
    justifyContent: 'space-around',
    paddingLeft: 5,
    paddingVertical: 5,
  },
  infoRight: {
    flex: 1,
    paddingRight: 5,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 10,
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 15,
    paddingLeft: 5,
    paddingTop: 7,
  },
  infoText: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontWeight: '400',
    paddingVertical: 2,
    fontSize: 13
  },
  detailsContainer: {
    flexDirection: 'row',
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
  },
});
