// @flow
import React, { Component } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import VersionNumber from 'react-native-version-number';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import AngleHeader from '../../components/AngleHeader';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import RoundedButton from '../../components/RoundedButton';
import { getHeaderStyle } from "../../helpers/UIHelper";
import i18n from '../../i18n/i18nConfig';

const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;
class About extends Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: i18n.t(`About.index.title`),
            headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} />,
            headerTintColor: theme.TEXT_COLOR_INVERT,
            header: props => <AngleHeader {...props} />,
            headerStyle: getHeaderStyle(),
        };
    };

    render() {
        return (
            <ViewWrapper withFade={true} withMove={true} loaderPosition={'nav'}>
                <ScrollView keyboardDismissMode={'on-drag'} style={styles.mainContainer} horizontal={false}>
                    <View style={styles.innerContainer}> 
                        <View style={styles.productInfoContainer}>
                            <Image style={styles.imgStyle} source={require('../../images/About/UE.png')} />
                            <Text style={styles.companyName}>UniMicro AS</Text>
                            <Text style={styles.buildNo}>Build {`${VersionNumber.appVersion}.${VersionNumber.buildVersion}`}</Text>
                        </View>

                        <Text style={[styles.mainText, styles.mainTextMargin]}>{i18n.t('About.index.address')}</Text>
                        <Text style={styles.subText}>Øvre Helland, 5729 MODALEN</Text>

                        <Text style={styles.mainText}>{i18n.t('About.index.telephone')}</Text>
                        <Text style={styles.subText}>+47 56 59 91 00</Text>

                        <Text style={styles.mainText}>{i18n.t('About.index.email')}</Text>
                        <Text style={styles.subText}>salg@unimicro.no</Text>

                        <RoundedButton color={theme.HINT_COLOR} width={150} text={i18n.t('About.index.visitWebsite')} onPress={() => this.props.navigation.navigate('Website')} />
                        <View style={styles.spacer} />
                    </View>
                </ScrollView>
            </ViewWrapper>
        );
    }
}

export default About

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 15,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'space-between',
        marginTop: 10
    },
    imgStyle: {
        width: 220,
        height: 42
    },
    mainText: {
        marginTop: 25,
        color: '#7D6F6F',
        textAlign: 'center',
        fontWeight: '600'
    },
    mainTextMargin: {
        marginTop: 15
    },
    subText: {
        marginTop: 5,
        color: 'rgba(0,0,0,0.4)',
        textAlign: 'center'
    },
    buildNo: {
        marginTop: 5,
        color: 'rgba(100,100,100,0.4)',
        fontSize: 12,
        fontWeight: '300'
    },
    companyName: {
        marginTop: 50,
        fontWeight: '600',
        fontSize: 17,
        color: '#7D6F6F'
    },
    productInfoContainer: {
        marginTop: 50,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 20
    },
    spacer: {
        height: 50
    }
});