// @flow
import React from 'react';
import {
    View,
    Text,
    StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';

import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';

export const PhonebookSearchListRow = ({ item, index, onSelect }) => {
    return (
        <Touchable onPress={() => onSelect(item)} key={`${item.Source * Math.random()}`} style={styles.button}>
            <View style={styles.mainTextContainer}>
                <Text style={styles.infoTextMain} numberOfLines={1} ellipsizeMode={'tail'}>{item.Name ? item.Name.trim() : i18n.t('CustomerList.CustomerListRow.unknown')}</Text>
                <View style={styles.detailsContainer}>
                    <View style={styles.infoLeft}>
                        <Text style={styles.infoText}>{`${item.Streetaddress ? item.Streetaddress : i18n.t('CustomerList.CustomerListRow.notSpecified')}`}</Text>
                        <Text style={styles.infoTextSubLeft}>{`${item.City ? item.City : i18n.t('CustomerList.CustomerListRow.notSpecified')}`}</Text>
                    </View>
                </View>
            </View>
        </Touchable>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 80,
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
        paddingRight: 10,
        paddingLeft: 10,
    },
    infoLeft: {
        flex: 1,
        justifyContent: 'space-around',
        paddingVertical: 5,
    },
    infoRight: {
        flex: 1,
        padding: 5,
        justifyContent: 'space-around',
        alignItems: 'flex-end',
    },
    infoTextMain: {
        color: theme.PRIMARY_TEXT_COLOR,
        fontWeight: '700',
        fontSize: 15,
        paddingTop: 10,
    },
    infoTextSubLeft: {
        color: theme.SECONDARY_TEXT_COLOR,
        fontSize: 12,
        fontWeight: '500',
        paddingVertical: 5,
        marginRight: -80,
    },
    infoTextSubRight: {
        color: theme.SECONDARY_TEXT_COLOR,
        fontSize: 12,
        fontWeight: '500',
        paddingVertical: 5,
    },
    infoText: {
        color: theme.PRIMARY_TEXT_COLOR,
        fontWeight: '400',
    },
    detailsContainer: {
        flexDirection: 'row',
    },
    mainTextContainer: {
        flexDirection: 'column',
        flex: 1,
        paddingLeft: 5,
    },
});
