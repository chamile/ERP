import React, { Component } from 'react';
import {
    View,
    StyleSheet,
    Text,
    FlatList
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '../components/CustomIcon';
import Analytics from 'appcenter-analytics';
import ImagePicker from 'react-native-image-crop-picker';

import RoundedButton from './RoundedButton';
import i18n from '../i18n/i18nConfig';
import ImageView from './ImageView';
import AlertService from '../services/AlertService';
import { AlertType } from '../constants/AlertTypes';
import { AnalyticalEventNames } from '../constants/AnalyticalEventNames';

class ImageCarousel extends Component {

    constructor(props) {
        super(props);
        this.renderListFooter = this.renderListFooter.bind(this);
        this.openGallery = this.openGallery.bind(this);
        this.handleDeleteTap = this.handleDeleteTap.bind(this);
    }

    openGallery() {
        ImagePicker.openPicker({
            multiple: true,
            mediaType: "photo"
        })
            .then(images => {
                if (Array.isArray(images)) {
                    this.props.onImageAdd(images.map((img) => img.path));
                  }
                  else {
                    this.props.onImageAdd([images.path]);
                  }
            }
            )
            .catch(error => {
                // Occurs when the user does not select an image.
                // No need to handle it since we allow uploads without images.
            });
    }

    renderListFooter() {
        return (
            this.props.images.length === 0 ?
                <View style={styles.noImageContainer}>
                    <Icon name='ios-image-outline' size={80} color={'grey'} style={styles.icon} />
                    <Text style={styles.noImagesText}>
                        {this.props.noImageTitle}
                    </Text>
                </View>
                : null
        );
    }

    handleDeleteTap(file, index) {
        AlertService.showSimpleAlert(i18n.t('ImageCarousel.confirm'), i18n.t('ImageCarousel.sure'), AlertType.CONFIRMATION, this.onDeleteConfirm.bind(this, file, index), null, i18n.t('ImageCarousel.delete'), i18n.t('ImageCarousel.cancel'));
    }

    onDeleteConfirm(file, index) {
        this.props.onDelete ? this.props.onDelete(file, index) : null;
    }

    render() {
        return (
            <View style={styles.mainContainer}>
                <View style={this.props.viewModeOnly === true ? [styles.listContainer, styles.viewModeBottom] : styles.listContainer}>
                    <FlatList
                        keyExtractor={(item, index) => index}
                        data={this.props.images}
                        ListFooterComponent={this.renderListFooter}
                        horizontal={true}
                        renderItem={props => <ImageView {...props} ocrStatusText={this.props.ocrStatusText} index={props.index} viewModeOnly={this.props.viewModeOnly} getImageURI={this.props.getImageURI} onDelete={this.handleDeleteTap}  isOCRInProgress={this.props.isOCRInProgress} isOCRSuccess={this.props.isOCRSuccess} />}
                    />
                </View>
                {this.props.viewModeOnly === true
                    ? null
                    : <View style={styles.buttonContainer}>
                        <RoundedButton
                            onPress={() => {
                                this.openGallery();
                                Analytics.trackEvent(AnalyticalEventNames.IMAGE_SELECTION, { From: 'Gallery' });
                            }}
                            text={i18n.t('ImageCarousel.imageGallery')}
                            icon='ios-images-outline'
                            width={135}
                            iconSize={19}
                            fontSize={13}
                            color="white"
                        />
                        <RoundedButton
                            onPress={() => {
                                this.props.navigateToCamera();
                                Analytics.trackEvent(AnalyticalEventNames.IMAGE_SELECTION, { From: 'Camera' });
                            }}
                            text={i18n.t('ImageCarousel.takePicture')}
                            icon='ios-camera-outline'
                            width={135}
                            iconSize={19}
                            fontSize={13}
                            color='white'
                        />
                    </View>}
            </View>
        );
    }
}

ImageCarousel.PropTypes = {
    data: PropTypes.array.isRequired,
    viewModeOnly: PropTypes.bool.isRequired,
    getImageURI: PropTypes.func.isRequired,
    onImageAdd: PropTypes.func,
    navigateToCamera: PropTypes.func,
    onDelete: PropTypes.func
};

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: '#000000',
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 25,
    },
    listContainer: {
        alignItems: 'center'
    },
    viewModeBottom: {
        marginBottom: -35,
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: -40,
        justifyContent: 'space-between'
    },
    noImagesText: {
        color: 'grey',
        fontSize: 17,
        textAlign: 'center',
        fontWeight: '400'
    },
    noImageContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'grey',
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 40,
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20,
        width: 200
    },
});

export default ImageCarousel;