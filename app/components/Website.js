import React, { Component } from 'react';
import { WebView } from 'react-native';

import ViewWrapper from './ViewWrapper';
import { theme } from '../styles';
import i18n from '../i18n/i18nConfig';

class Website extends Component {
    static navigationOptions = () => {
        return {
            title: i18n.t('Website.title'),
            headerTintColor: theme.TEXT_COLOR_INVERT,
            headerStyle: { backgroundColor: theme.PRIMARY_COLOR },
            tabBarVisible: false
        }
    };

    render() {
        return (
            <ViewWrapper withFade={true} withMove={false} >
                <WebView source={{ uri: 'https://unimicro.no' }} style={{ marginTop: -1 }} useWebKit={true}/>
            </ViewWrapper>
        );
    }
}

export default Website