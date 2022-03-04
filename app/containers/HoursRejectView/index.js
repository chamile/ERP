// @flow
import React, { Component } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Dimensions,
    Platform,
    Keyboard,
    ActivityIndicator,
    TextInput,
    Animated,
    Easing,
    Text
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import AlertService from '../../services/AlertService';
import { AlertType } from '../../constants/AlertTypes';
import ApprovalService from '../../services/ApprovalService';



const WIDTH: number = Dimensions.get('window').width;
const HEIGHT: number = Dimensions.get('window').height;

class HoursRejectView extends Component {
    static navigationOptions = ({ navigation }) => {

        return {
            title: i18n.t('HoursRejectView.index.title'),
            headerTintColor: theme.TEXT_COLOR_INVERT,
            headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
            headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleAction()} text={i18n.t('HoursRejectView.index.reject')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.goBack(); }} text={i18n.t('HoursRejectView.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},

        };
    };

    constructor() {
        super();
        this.state = {
            moveAnimation: new Animated.Value(0),
            isLoading: false,
            comment: '',
        };
        this.handleAction = this.handleAction.bind(this);
        this.rejectionCall = this.rejectionCall.bind(this);
        this.startAnimation = this.startAnimation.bind(this)
    }


    startAnimation(reverse = false) {
        Animated.timing(
            this.state.moveAnimation,
            {
                toValue: reverse ? 0 : 1,
                duration: 250,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true
            },
        ).start();
    }

    componentWillMount() {
        this.props.navigation.setParams({ handleAction: this.handleAction });
    }

    handleAction() {
        const approvalList = this.props.navigation.state.params.parent;
        if (approvalList == "HOURS_APPROVAL") {
            AlertService.showSimpleAlert(
                i18n.t('HoursRejectView.index.confirm'),
                i18n.t('HoursRejectView.index.sure'),
                AlertType.CONFIRMATION,
                this.rejectionCall.bind(this, this.props.navigation.state.params.approvalID, this.state.comment),
                null,
                i18n.t('HoursRejectView.index.reject'),
                i18n.t('HoursRejectView.index.cancel'));
        }
        else {
            const approvalID = this.props.navigation.state.params.approvalID;
            const rowData = this.props.navigation.state.params.rowData;
            const rowMap = this.props.navigation.state.params.rowMap;
            const sectionKey = this.props.navigation.state.params.sectionKey;
            AlertService.showSimpleAlert(
                i18n.t('HoursRejectView.index.confirm'),
                i18n.t('HoursRejectView.index.sure'),
                AlertType.CONFIRMATION, () => {
                    this.props.navigation.state.params.onApprovalRejectWithComment(approvalID, rowData, rowMap, sectionKey, this.state.comment, this.props.company.selectedCompany.Key)
                    this.props.navigation.goBack();
                },
                null,
                i18n.t('HoursRejectView.index.reject'),
                i18n.t('HoursRejectView.index.cancel'));

        }

    }

    async addCommentToWorkGroup(comment) {
        const companyKey = this.props.company.selectedCompany.Key;
        let entityID = this.props.navigation.state.params.taskItem.Task.EntityID;
        try {
            await ApprovalService.addCommentAtRejection(comment, entityID, companyKey);
        } catch (error) {
            throw error
        }
    }

    async rejectionCall(approvalID, comment) {
        this.setState({ actionMessage: i18n.t('HoursRejectView.index.rejecting') }, this.startAnimation())
        const companyKey = this.props.company.selectedCompany.Key;
        try {
            await ApprovalService.rejectApproval(approvalID, companyKey);
            if (comment !== '' && comment.length > 0) {
                await this.addCommentToWorkGroup(comment);
            }
            this.props.navigation.state.params.goBack();
            this.props.navigation.state.params && this.props.navigation.state.params.refreshApprovals ? this.props.navigation.state.params.refreshApprovals() : null;
            this.setState({ actionMessage: '' });
            this.startAnimation(true);
        } catch (error) {
            this.setState({ actionMessage: '' });
            this.startAnimation(true);
            this.handleErrors(error.problem, null, i18n.t('HoursApproval.index.approvalRejectError'));
        }
    }

    handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('HoursApproval.index.somethingWrong')) {
        ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
    }

    render() {
        return (
            <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
                <Animated.View
                    style={[styles.animatedPanel, {
                        transform: [
                            {
                                translateY: this.state.moveAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-60, 0],
                                })
                            }
                        ]
                    }]}
                >
                    <View style={styles.animatedPanelLoader}>
                        <ActivityIndicator
                            animating={true}
                            style={[{ height: 80 }]}
                            size="small"
                        />
                        <View style={styles.animatedPanelText}>
                            <Text>{`${this.state.actionMessage}`}</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.infoContainer} >
                    <Text style={styles.textInputTitle}>{i18n.t('HoursRejectView.index.rejectionReason')}</Text>
                    <View style={styles.textInput}>
                        <TextInput
                            multiline={true}
                            onChangeText={text => this.setState({ comment: text })}
                            isKeyboardInput={true}
                            onFocus={this.scrollToBottom}
                            value={this.state.comment}
                            editable={true}
                            underlineColorAndroid={'transparent'}
                            minHeight={60}
                            maxHeight={250}
                            numberOfLines={3}
                        />

                    </View>

                </View>
                {this.state.isLoading ?
                    <View style={styles.loader}>
                        <ActivityIndicator animating={true} size={'large'} color={theme.PRIMARY_COLOR} />
                    </View>
                    : null}
                <View style={styles.spacer} />
                {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
                {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
            </ViewWrapper>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        user: state.user,
        company: state.company,
    };
};


export default connect(
    mapStateToProps
)(HoursRejectView);

const styles = StyleSheet.create({
    detailsContainer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
        paddingTop: 10,
    },
    headerStyle: {
        flex: 1,
        textAlign: 'center',
    },
    spacer: {
        height: 50,
    },
    iphoneXSpace: {
        height: 50,
    },
    loader: {
        justifyContent: 'center',
        alignItems: 'center',
        width: WIDTH,
        height: HEIGHT,
        paddingTop: 0,
        position: 'absolute',
        zIndex: 10,
    },
    infoContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
        flex: 1
    },
    textInput: {
        borderColor: theme.SECONDARY_TEXT_COLOR,
        borderWidth: 0.5,
        padding: 10,
        marginBottom: 25,
        marginLeft: 10,
        marginRight: 10,

    },
    animatedPanel: {
        flexDirection: 'row',
        height: 59,
        backgroundColor: 'rgba(255,255,255,0.9)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    animatedPanelLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    animatedPanelText: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
    },
    textInputTitle: {
        padding: 10,
        marginLeft: 0,
        marginRight: 10,
        color: theme.SYSTEM_COLOR_LIGHT_GRAY_3

    }

});
