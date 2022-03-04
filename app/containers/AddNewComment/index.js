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
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { EntityType } from '../../constants/EntityTypes';
import OrderService from '../../services/OrderService';
import QuoteService from '../../services/QuoteService';
import CustomerInvoiceService from '../../services/CustomerInvoiceService';
import { createGuid } from '../../helpers/APIUtil';


const WIDTH: number = Dimensions.get('window').width;
const HEIGHT: number = Dimensions.get('window').height;

class AddNewComment extends Component {
    static navigationOptions = ({ navigation }) => {

        return {
            title: navigation.state.params.isEditMode ? i18n.t('AddNewComment.index.editCommentTitle') : i18n.t('AddNewComment.index.addCommentTitle'),
            headerTintColor: theme.TEXT_COLOR_INVERT,
            headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
            headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleAction()} text={navigation.state.params.isEditMode ? i18n.t('AddNewComment.index.save') : i18n.t('AddNewComment.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.goBack(); }} text={i18n.t('AddNewComment.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},

        };
    };

    constructor() {
        super();
        this.state = {
            isLoading: false,
            comment: ''
        };
        this.handleAction = this.handleAction.bind(this);
        this.addComment = this.addComment.bind(this);

    }

    componentWillMount() {
        this.props.navigation.setParams({ handleAction: this.handleAction, disableActionButton: false, addComment: this.addComment, editCommentInOrder: this.editCommentInOrder });
        this.props.navigation.state.params.isEditMode ? this.setState({ comment: this.props.navigation.state.params.editItem.ItemText }) : null;
    }

    handleAction() {
        Keyboard.dismiss();
        if (this.state.comment.trim() != '') {
            this.addComment(this.state.comment.trim());
        }

    }

    getCommentDetails(edit = false, comment) {
        let commentNew = { ID: 0, Product: null, ProductID: null, ItemText: comment };
        if (!edit) {
            commentNew._createguid = createGuid();
        }
        else {
            commentNew = this.props.navigation.state.params.editItem
            commentNew.ItemText = comment;
        }
        return commentNew;
    }

    addComment(comment) {
        Keyboard.dismiss();
        this.setState({ isLoading: true });
        this.props.navigation.setParams({ disableActionButton: true });
        setTimeout(() => {
            this.props.navigation.setParams({ disableActionButton: true });
            //Add comment to order
            if (this.props.navigation.state.params.entityType == EntityType.CUSTOMER_ORDER) {
                OrderService.addNewItem(this.props.navigation.state.params.orderID, this.getCommentDetails(this.props.navigation.state.params.isEditMode ? true : false, comment), this.props.company.selectedCompany.Key)
                    .then((res) => {
                        this.props.navigation.state.params.refreshData();
                        this.props.navigation.goBack();
                        this.props.navigation.setParams({ disableActionButton: false });
                        this.setState({ isLoading: false });
                    })
                    .catch((err) => {
                        this.handleProductErrors(err.problem, this.handleAction, i18n.t('AddNewComment.index.addCommentError'));
                        this.props.navigation.setParams({ disableActionButton: false });
                        this.setState({ isLoading: false });
                    });

            }
            //Add new comment to quote
            else if (this.props.navigation.state.params.entityType == EntityType.CUSTOMER_QUOTE) {

                QuoteService.addNewItem(this.props.navigation.state.params.quoteID, this.getCommentDetails(this.props.navigation.state.params.isEditMode ? true : false, comment), this.props.company.selectedCompany.Key)
                    .then((res) => {
                        this.props.navigation.state.params.refreshData();
                        this.props.navigation.goBack();
                        this.props.navigation.setParams({ disableActionButton: false });
                        this.setState({ isLoading: false });
                    })
                    .catch((err) => {
                        this.handleProductErrors(err.problem, this.handleAction, i18n.t('AddNewComment.index.addCommentError'));
                        this.props.navigation.setParams({ disableActionButton: false });
                        this.setState({ isLoading: false });
                    });

            }
            //Add new comment to customer invoice
            else if (this.props.navigation.state.params.entityType == EntityType.CUSTOMER_INVOICE) {

                CustomerInvoiceService.addNewItem(this.props.navigation.state.params.customerInvoiceID, this.getCommentDetails(this.props.navigation.state.params.isEditMode ? true : false, comment), this.props.company.selectedCompany.Key)
                    .then((res) => {
                        this.props.navigation.state.params.refreshData();
                        this.props.navigation.goBack();
                        this.props.navigation.setParams({ disableActionButton: false });
                        this.setState({ isLoading: false });
                    })
                    .catch((err) => {
                        this.handleProductErrors(err.problem, this.handleAction, i18n.t('AddNewComment.index.addCommentError'));
                        this.props.navigation.setParams({ disableActionButton: false });
                        this.setState({ isLoading: false });
                    });

            }

        }, 1000);

    }

    render() {
        return (
            <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
                <View style={styles.infoContainer} >
                    <View style={styles.textInput}>
                        <TextInput
                            multiline={true}
                            placeholder={i18n.t('AddNewComment.index.commentPlaceHolder')}
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
)(AddNewComment);

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

    }
});
