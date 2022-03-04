import React, { Component } from 'react';
import {
    Text,
    View,
    Image,
    StyleSheet,
    TextInput,
    Platform,
    TouchableWithoutFeedback,
    ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '../components/CustomIcon';

import { theme } from '../styles';

const InlineValidationInputField = ({
    title,
    placeHolder,
    placeholderTextColor,
    value,
    error,
    onFocus,
    onChangeText,
    onPress,
    isKeyboardInput,
    keyboardType,
    titleStyle,
    titleErrorStyle,
    warningTextStyle,
    textInputErrorStyle,
    textInputStyle,
    editable,
    onBlur,
    textInput,
    showLoadingSpinner,
    textInputBgColor,

}) => {
    return (
        <TouchableWithoutFeedback onPress={editable ? onPress : null}>
            <View style={styles.padding}>
                <View style={error ? styles.mainContainerError : [styles.mainContainer,textInputBgColor]}>
                    <View style={error ? styles.subContainerError : styles.subContainer}>
                        <View style={styles.titleContainer}>
                            <Text style={error ? [styles.titleError, titleErrorStyle] : [styles.title, titleStyle]}>{title}</Text>
                        </View>
                        {showLoadingSpinner ?
                            <ActivityIndicator
                                animating={showLoadingSpinner}
                                color={theme.PRIMARY_COLOR}
                                size="small"
                                style={styles.spinner}
                            />
                            : isKeyboardInput ?
                                <TextInputFiled
                                    placeHolder={placeHolder}
                                    keyboardType={keyboardType}
                                    placeholderTextColor={placeholderTextColor}
                                    onChangeText={onChangeText}
                                    value={value}
                                    onFocus={onFocus}
                                    error={error}
                                    textInputStyle={textInputStyle}
                                    textInputErrorStyle={textInputErrorStyle}
                                    editable={editable}
                                    onBlur={onBlur}
                                /> :
                                <TextField
                                    error={error}
                                    placeHolder={placeHolder}
                                    value={value}
                                    textInputStyle={textInputStyle}
                                    textInputErrorStyle={textInputErrorStyle}
                                    editable={editable}
                                />}
                    </View>
                </View>
                {error ? <Text style={[styles.warningText, warningTextStyle]}>{error}</Text> : null}
            </View>
        </TouchableWithoutFeedback>
    );
};

const TextInputFiled = ({ onChangeText, value, onFocus, error, placeholderTextColor, keyboardType, placeHolder, textInputStyle, textInputErrorStyle, editable, onBlur }) => {
    return (
        <View style={styles.inputContainer} >
            <TextInput
                placeholder={placeHolder}
                keyboardType={keyboardType || 'default'}
                placeholderTextColor={placeholderTextColor || theme.SECONDARY_TEXT_COLOR}
                underlineColorAndroid={error ? theme.ERROR_BACKGROUND_COLOR : '#fff'}
                style={error ? [styles.textInputError, (Platform.OS === 'ios') ? styles.textInputErrorMarginIOS : styles.textInputErrorMarginAndroid, textInputErrorStyle] : [styles.textInput, (Platform.OS === 'ios') ? styles.textInputMarginIOS : styles.textInputMarginAndroid, textInputStyle]}
                onChangeText={onChangeText}
                value={value}
                onFocus={onFocus}
                editable={editable}
                onBlur={onBlur}
            />
        </View>
    );
};

const TextField = ({ error, placeHolder, value, textInputStyle, textInputErrorStyle, editable }) => {
    return (
        <View style={styles.carrotTextContainer}>
            <Text style={error ? value ? styles.textError : styles.text : value ? [styles.textActive, textInputStyle] : styles.text}>{value ? value : placeHolder}</Text>
            {editable ? <View style={styles.carrotIconBox}>
                <Icon name="ios-arrow-forward" size={25} color={theme.SECONDARY_TEXT_COLOR} />
            </View> : null}
        </View>
    );
};

InlineValidationInputField.propTypes = {
    title: PropTypes.string.isRequired,
    placeHolder: PropTypes.string.isRequired,
    placeholderTextColor: PropTypes.string,
    error: PropTypes.string,
    value: PropTypes.string,
    onFocus: PropTypes.func,
    onChangeText: PropTypes.func,
    onPress: PropTypes.func,
    isKeyboardInput: PropTypes.bool.isRequired,
    keyboardType: PropTypes.string,
    titleStyle: Text.propTypes.style,
    titleErrorStyle: Text.propTypes.style,
    warningTextStyle: Text.propTypes.style,
    textInputErrorStyle: Text.propTypes.style,
    textInputStyle: Text.propTypes.style,
    showLoadingSpinner: PropTypes.bool,
};

InlineValidationInputField.defaultProps = {
    title: '...',
    placeHolder: '...',
    error: null,
    value: null,
    onFocus: () => { },
    onChangeText: () => { },
    onPress: () => { },
    isKeyboardInput: true,
    placeholderTextColor: theme.SECONDARY_TEXT_COLOR,
    keyboardType: 'default',
    titleStyle: {},
    titleErrorStyle: {},
    warningTextStyle: {},
    textInputErrorStyle: {},
    textInputStyle: {},
    editable: true,
    onBlur: () => {},
    showLoadingSpinner: false,
};

export default InlineValidationInputField;

const styles = StyleSheet.create({
    subContainer: {
        height: 48,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.SECONDARY_TEXT_COLOR,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    carrotTextContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    titleContainer: {
        marginBottom: 0.5,
        justifyContent: 'center',
    },
    carrotIconBox: {
        justifyContent: 'center',
        marginTop: 2
    },
    inputContainer: {
        flex: 1
    },
    mainContainer: {
        paddingRight: 15,
        paddingLeft: 15
    },
    title: {
        color: theme.PRIMARY_TEXT_COLOR,
        fontSize: 16
    },
    textInput: {
        flex: 1,
        textAlign: 'right',
        paddingLeft: 20,
        fontSize: 16,
        color: theme.PRIMARY_TEXT_COLOR,
    },
    textInputMarginIOS: {
        marginRight: 5.5,
        marginLeft: 4
    },
    textInputMarginAndroid: {
        marginLeft: 0
    },
    subContainerError: {
        height: 48,
        marginRight: 15,
        marginLeft: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.ERROR_TEXT_COLOR,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainContainerError: {
        backgroundColor: theme.ERROR_BACKGROUND_COLOR
    },
    titleError: {
        color: theme.ERROR_TEXT_COLOR,
        fontSize: 16
    },
    textInputError: {
        flex: 1,
        borderColor: '#fff',
        borderWidth: 0,
        fontSize: 16,
        textAlign: 'right',
        color: theme.ERROR_TEXT_COLOR
    },
    textInputErrorMarginIOS: {
        marginRight: 5.5,
        marginLeft: 4
    },
    textInputErrorMarginAndroid: {
        marginRight: 0,
        marginLeft: 0
    },
    warningText: {
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 5,
        paddingBottom: 10,
        fontSize: 12,
        color: theme.SECONDARY_TEXT_COLOR
    },
    textError: {
        color: theme.ERROR_TEXT_COLOR,
        flex: 1,
        fontSize: 16,
        paddingLeft: 20,
        marginRight: 10,
        textAlign: 'right',
    },
    text: {
        color: theme.SECONDARY_TEXT_COLOR,
        flex: 1,
        fontSize: 16,
        textAlign: 'right',
        marginRight: 10
    },
    textActive: {
        color: theme.PRIMARY_TEXT_COLOR,
        flex: 1,
        fontSize: 16,
        textAlign: 'right',
        paddingLeft: 20,
        marginRight: 10
    },
    spinner: {
        paddingHorizontal: 5
    },
});
