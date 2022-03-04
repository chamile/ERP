// @flow
import React from 'react';
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import CheckBox from 'react-native-check-box';
import Icon from '../../components/CustomIcon';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { FormatNumber } from '../../helpers/NumberFormatUtil';

export const ItemListRow = ({ item, setDefaultAccount, removeAccount, enableButtons, onSelect }) => {

  const toggleChckBox = (item) => {
    onSelect(item, !item.isChecked)
  }
  return (

    <View>
      {
        item.isChecked ?
          <View style={styles.detailsContainer}>
            <View style={styles.infoLeft}>
              <Text style={[styles.infoTextSubLeft, styles.biggerAccountNo]}>{i18n.t('BankAccountLookup.index.accountNuberText')}{item.AccountNumber}</Text>
              <Text style={styles.infoTextSubLeft}>{i18n.t('BankAccountLookup.index.iBN')}{item.IBAN}</Text>
              <Text style={styles.infoTextSubLeft}>{i18n.t('BankAccountLookup.index.bankName')}{item.Bank == null ? '' : item.Bank.Name}</Text>
              <TouchableOpacity onPress={() => toggleChckBox(item)}><Text style={[styles.infoTextSubLeftCheckBox,]}>{i18n.t('BankAccountLookup.index.setAsDefault')}</Text></TouchableOpacity>
            </View>

            <View style={styles.infoRight}>
              <TouchableOpacity style={styles.closeButton} onPress={() => removeAccount(item)}>
                <Icon name="ios-close-circle" size={30} color="#FFFFFF" ></Icon>
              </TouchableOpacity>
              <CheckBox
                style={styles.checkBox}
                onClick={() => toggleChckBox(item)}
                isChecked={item.isChecked ? true : false}
                checkBoxColor={theme.HINT_COLOR}
              />
            </View>


          </View>
          :

          <View style={styles.detailsContainerBasic}>
            <View style={styles.infoLeft}>
              <Text style={[styles.infoTextSubLeftBasic, styles.biggerAccountNo]}>{i18n.t('BankAccountLookup.index.accountNuberText')}{item.AccountNumber}</Text>
              <Text style={styles.infoTextSubLeftBasic}>{i18n.t('BankAccountLookup.index.iBN')}{item.IBAN}</Text>
              <Text style={styles.infoTextSubLeftBasic}>{i18n.t('BankAccountLookup.index.bankName')}{item.Bank == null ? '' : item.Bank.Name}</Text>
              <TouchableOpacity onPress={() => toggleChckBox(item)}><Text style={styles.infoTextSubLeftCheckBoxBasic}>{i18n.t('BankAccountLookup.index.setAsDefault')}</Text></TouchableOpacity>
            </View>

            <View style={styles.infoRight}>

              <TouchableOpacity style={styles.closeButton} onPress={() => removeAccount(item)}>
                <Icon name="ios-close-circle" size={30} color={theme.COLOR_GRAY} ></Icon>
              </TouchableOpacity>
              <CheckBox
                style={styles.checkBox}
                onClick={() => toggleChckBox(item)}
                isChecked={item.isChecked ? true : false}
                checkBoxColor={theme.COLOR_GRAY}
              />



            </View>


          </View>

      }
    </View>

  );
};

const styles = StyleSheet.create({

  biggerAccountNo: {
    fontWeight: '900',
    fontSize: 13,
  },
  button: {
    height: 90,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    paddingRight: 10,
    paddingLeft: 10
  },
  infoLeft: {
    flex: 5,
    justifyContent: 'space-around',
    paddingLeft: 5,
    paddingVertical: 5
  },
  infoRight: {
    flex: 1,
    paddingRight: 5,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 5,
    // backgroundColor: 'green',
    flexDirection: 'column'
  },
  infoTextMain: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 16,
    paddingLeft: 5,
    paddingTop: 10
  },
  infoTextSubLeft: {
    color: theme.COLOR_LIGHT_GRAY,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5,
    marginRight: -80
  },
  infoTextSubRight: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5
  },
  infoText: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontWeight: '400'
  },
  currency: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
    marginBottom: 1,
    alignSelf: 'flex-end',
  },
  currencySmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '400',
    fontSize: 13,
    alignSelf: 'flex-end',
    marginBottom: 1
  },
  statusBar: {
    width: 3,
    backgroundColor: 'black',
    marginTop: 10
  },
  amount: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 17
  },
  amountSmall: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontWeight: '900',
    fontSize: 15
  },
  amountContainer: {
    marginBottom: 5,
    flexDirection: 'row',
  },
  detailsContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#034f84',
    marginTop: 7
  },
  mainTextContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  checkBox: {
    marginLeft: 0,
    marginRight: 0,
  },
  currencyCode: {
    fontSize: 14,
    color: theme.PRIMARY_TEXT_COLOR,
  },
  detailsContainerBasic: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
    marginTop: 7
  },
  infoTextSubLeftBasic: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 5,
    marginRight: -80
  },
  infoTextSubLeftCheckBoxBasic: {
    color: theme.PRIMARY_TEXT_COLOR,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 5,
    marginRight: -80,
    paddingBottom: 5,
    paddingRight: 5,
    paddingTop: 10
  },
  infoTextSubLeftCheckBox: {
    color: theme.COLOR_LIGHT_GRAY,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 5,
    marginRight: -80,
    paddingBottom: 5,
    paddingRight: 5,
    paddingTop: 10
  },
  closeButton:
    {
      paddingTop: 5
    }
});
