// @flow
import React from 'react';
import {
    View,
    Text,
    Image,
    Platform,
    ActivityIndicator,
    ImageBackground,
    StyleSheet
} from 'react-native';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import PropTypes from 'prop-types';
import Icon from '../components/CustomIcon';
import { theme } from '../styles';

export default ImageView = ({ index, item, onDelete = () => { }, getImageURI, viewModeOnly, isOCRInProgress, isOCRSuccess, ocrStatusText }) => {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground style={styles.invoiceImage}
          source={getImageURI(item)}
          resizeMode="cover"
        >
          {(index === 0) && (isOCRInProgress || isOCRSuccess) ?
            <View style={[styles.background, styles.invoiceImage]}>
              <View style={styles.activityIndicatorContainer}>
                {isOCRInProgress ?
                  <ActivityIndicator
                    size={'small'}
                    animating={isOCRInProgress}
                    color={theme.SCREEN_COLOR_LIGHT_BLUE}
                  />
            :
                  <Icon name={'ios-checkmark-circle'} color={theme.SCREEN_COLOR_LIGHT_BLUE} size={26} />
                
            }
              </View>
              <Text style={{ padding: 10, color: theme.SCREEN_COLOR_LIGHT_BLUE }}>{ocrStatusText}</Text>
            </View>
        : null}
        </ImageBackground>
        {
                viewModeOnly ? null :
                <Touchable onPress={onDelete.bind(null, item, index)} style={Platform.OS === 'ios' ? styles.iconContainerIOS : styles.iconContainer}>
                  <Image resizeMode={'contain'} style={styles.icon} source={require('../images/CameraView/close.png')} />
                </Touchable>
            }
      </View>
    );
};

ImageView.PropTypes = {
    item: PropTypes.object.isRequired,
    onDelete: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
    invoiceImage: {
        height: 300,
        width: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainContainer: {
        marginBottom: 40,
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    iconContainer: {
        position: 'absolute',
        left: 186,
        top: 286,
    },
    iconContainerIOS: {
        position: 'absolute',
        right: -13,
        bottom: -15,
    },
    icon: {
        height: 27,
        width: 27,
    },
    background: {
        backgroundColor: 'black',
        opacity: 0.75,
    },
    activityIndicatorContainer: {
        height: 25,
    }
});
