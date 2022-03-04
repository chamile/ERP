// @flow
import React, { Component } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Dimensions,
    Platform,
    Animated,
    Easing,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Keyboard,
    FlatList,
    Alert
} from 'react-native';
import { connect } from 'react-redux';
import Icon from '../../components/CustomIcon';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Analytics from 'appcenter-analytics';
import _ from 'lodash';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import SupplierService from '../../services/SupplierService';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { udpadeRecentlyAddedBankAccounts } from '../../actions/recentDataActions';
import { ItemListRow } from './itemListRow';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';

const WIDTH: number = Dimensions.get('window').width;

class BankAccountLookup extends Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.state.params.isEditMode ? i18n.t('BankAccountLookup.index.editBankAccount') : i18n.t('BankAccountLookup.index.title'),
            headerTintColor: theme.TEXT_COLOR_INVERT,
            headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
            headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleAction()} text={navigation.state.params.isEditMode ? i18n.t('BankAccountLookup.index.save') : i18n.t('BankAccountLookup.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { navigation.state.params.clearAccountAddedAlreadyToForm(); navigation.state.params.udpadeRecentlyAddedBankAccounts([]); Keyboard.dismiss(); navigation.goBack(); }} text={i18n.t('BankAccountLookup.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
        };
    };

    constructor(props) {
        super(props);
        this.state = {
            pageSize: 20,
            hasNextPage: false,
            isLoading: false,
            showSearchResult: false,
            entityType: props.navigation.state.params.data.entityType,
            searchText: '',
            iBnSeachResults: [],
            selectedBankAccounts: [],
            selectedCustomeBankAccounts: [],
            iBNSearched: false,
            recentAccounts: [],
            selectedDeafultAccount: {},
            uEExistingAccounts: [],
            userSearched: false,

        };

        this.clearSearch = this.clearSearch.bind(this);
        this.onItemSelect = this.onItemSelect.bind(this);
        this.uEBankAccountSearch = this.uEBankAccountSearch.bind(this);
        this.search = this.search.bind(this);
        this.passSelectedBankAccounts = this.passSelectedBankAccounts.bind(this);
        this.handleAction = this.handleAction.bind(this);
        this.removeAccount = this.removeAccount.bind(this);
        this.setDefaultAccount = this.setDefaultAccount.bind(this);
        this.setUserSelectedDeafultAccount = this.setUserSelectedDeafultAccount.bind(this);
        this.clearAccountAddedAlreadyToForm = this.clearAccountAddedAlreadyToForm.bind(this);
    }

    handleSearchResultsFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('SearchView.index.somethingWrong')) {
        this.setState({ isLoading: false });
        ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
    }

    newBankAccountProcess(searchText) {
        const companyKey = this.props.company.selectedCompany.Key;
        if (searchText != '') {
            if (!isNaN(searchText) && searchText.length == 11) {
                //Search IBN for bank account whihc is nit in UE
                SupplierService.searchSupliersBankAccountInIBNByAccountNo(this.state.searchText, companyKey, 0, this.state.pageSize)
                    .then((response) => {
                        if (response.ok) {

                            if (response.data.IBAN != null)
                                this.setState({ isLoading: false, iBnSeachResults: response.data ? [response.data] : [], userSearched: true });
                            else
                                this.setState({ isLoading: false, iBnSeachResults: [], userSearched: true });
                        } else {
                            this.setState({ iBnSeachResults: [], userSearched: true });

                        }
                    })
                    .catch((error) => {
                        this.setState({ iBnSeachResults: [], userSearched: true });
                        this.handleSearchResultsFetchErrors(error.problem, null, i18n.t('BankAccountLookup.index.invalidSearchInfo'));
                    });
            }
            else {

                //Search IBN for bank account whihc is nit in UE
                SupplierService.searchSupliersBankAccountInIBNByIBNNo(this.state.searchText, companyKey, 0, this.state.pageSize)
                    .then((response) => {
                        if (response.ok) {

                            if (response.data.IBAN != null)
                                this.setState({ isLoading: false, iBnSeachResults: response.data ? [response.data] : [], userSearched: true });
                            else
                                this.setState({ isLoading: false, iBnSeachResults: [], userSearched: true });

                        } else {
                            this.setState({ iBnSeachResults: [], userSearched: true });
                        }
                    })
                    .catch((error) => {
                        this.setState({ iBnSeachResults: [], userSearched: true });
                        this.handleSearchResultsFetchErrors(error.problem, null, i18n.t('BankAccountLookup.index.invalidSearchInfo'));
                    });

            }
        }
        else {
            this.setState({ isLoading: false, iBnSeachResults: [], userSearched: true });
        }

    }

    isExistingUEAccountNumber(searchText) {
        const companyKey = this.props.company.selectedCompany.Key;
        if (searchText != '') {
            if (!isNaN(searchText) && searchText.length == 11) {
                SupplierService.searchByNOAccountNumberInUE(this.state.searchText, companyKey, 0, this.state.pageSize)
                    .then((response) => {
                        if (response.ok) {

                            //UE searched results since can have multiples recodes takes 0 
                            if (response.data != [] && response.data[0].Bank != null && response.data[0].IBAN != null) {

                                this.setState({ uEExistingAccounts: [...this.state.uEExistingAccounts, response.data[0]] }, () => { this.props.udpadeRecentlyAddedBankAccounts(this.state.uEExistingAccounts) });
                            }

                            this.newBankAccountProcess(searchText);


                        }
                    })
                    .catch((error) => {
                        this.setState({ iBnSeachResults: [], userSearched: true });
                        this.handleSearchResultsFetchErrors(error.problem, null, i18n.t('BankAccountLookup.index.invalidSearchInfo'));
                    });

            }
            else {
                SupplierService.searchByIBNNumberInUE(this.state.searchText, companyKey, 0, this.state.pageSize)
                    .then((response) => {
                        if (response.ok) {

                            //UE searched results since can have multiples recodes takes 0 
                            if (response.data != [] && response.data[0].Bank != null && response.data[0].IBAN != null) {

                                this.setState({ uEExistingAccounts: [...this.state.uEExistingAccounts, response.data[0]] }, () => { this.props.udpadeRecentlyAddedBankAccounts(this.state.uEExistingAccounts) });
                            }

                            this.newBankAccountProcess(searchText);

                        } else {
                            this.setState({ iBnSeachResults: [], userSearched: true });

                        }
                    })
                    .catch((error) => {
                        this.setState({ iBnSeachResults: [], userSearched: true });
                        this.handleSearchResultsFetchErrors(error.problem, null, i18n.t('BankAccountLookup.index.invalidSearchInfo'));
                    });


            }
        }
        else {
            this.setState({ isLoading: false, iBnSeachResults: [], userSearched: true });
        }


    }



    search() {
        this.uEBankAccountSearch();
        Keyboard.dismiss();

    }

    uEBankAccountSearch() {
        this.setState({ isLoading: true });
        this.isExistingUEAccountNumber(this.state.searchText, this.uEBankAccountSearch);

    }

    removeAccount(account) {

        for (var i = 0; i < this.state.selectedBankAccounts.length; i++) {
            var obj = this.state.selectedBankAccounts[i];

            if (obj.AccountNumber == account.AccountNumber) {

                this.state.selectedBankAccounts.splice(i, 1);
                this.state.selectedCustomeBankAccounts.splice(i, 1);

                this.setState({

                    selectedBankAccounts: [...this.state.selectedBankAccounts],
                    selectedCustomeBankAccounts: [...this.state.selectedCustomeBankAccounts],
                })
            }

        }

        //if default account removed selected default account willset to empty
        //then if user selected a account that wikll be set as default acccount if not 0th account will set as default.

        if ((account.AccountNumber == this.props.navigation.state.params.data.existingDefaultAcc.AccountNumber) &&
            (account.BankID == this.props.navigation.state.params.data.existingDefaultAcc.BankID)) {
            this.setState({ selectedDeafultAccount: {} });
        }
    }

    setDefaultAccount(account) {

    }


    onItemSelect(item) {

        let accountObj = false;
        this.state.selectedBankAccounts.forEach(function (element) {
            if (element.AccountNumber == item.AccountNumber.replace(/'/g, ""))
                accountObj = true;
        });

        const Bank = {

        }
        const account = {
            AccountNumber: item.AccountNumber.replace(/'/g, ""),
            BankAccountType: 'supplier',
            IBAN: item.IBAN,
            BankID: item.Bank.ID,
            Bank: { Name: item.Bank.Name, ID: item.BankID == undefined ? item.Bank.ID : item.BankID },
            ID: item.ID


        }

        if (!accountObj)
            this.setState({
                selectedBankAccounts: [...this.state.selectedBankAccounts, account],
                selectedCustomeBankAccounts: [...this.state.selectedCustomeBankAccounts, account],
            })

    }

    clearSearch() {
        this.setState({
            searchText: ''
        });
        Keyboard.dismiss();
    }

    formatBankAccounts(bankAccountsArray) {

        let formattedBAarray = [];
        bankAccountsArray.forEach(function (element) {

            const account = {
                AccountNumber: element.AccountNumber,
                BankAccountType: 'supplier',
                IBAN: element.IBAN,
                BankID: element.Bank == null ? null : element.BankID,
                Bank: element.Bank == null ? null : { Name: element.Bank.Name, ID: element.BankID },
                ID: element.ID

            }
            formattedBAarray.push(account);
        });

        return formattedBAarray;
    }


    componentWillMount() {

        try {
            this.props.navigation.setParams({ passSelectedBankAccounts: this.passSelectedBankAccounts, handleAction: this.handleAction, disableActionButton: false, clearAddressData: this.clearAddressData, udpadeRecentlyAddedBankAccounts: this.props.udpadeRecentlyAddedBankAccounts, clearAccountAddedAlreadyToForm: this.clearAccountAddedAlreadyToForm });

            if (this.props.navigation.state.params.data.existingBankAccounts && this.props.navigation.state.params.data.existingBankAccounts.length > 0) {
                this.setState({
                    selectedBankAccounts: this.props.navigation.state.params.data.existingBankAccounts,
                    selectedCustomeBankAccounts: this.formatBankAccounts(this.props.navigation.state.params.data.existingBankAccounts),
                }, this.setDefaultAccountChecked())
            }

        }
        catch (error) {
            this.handleSearchResultsFetchErrors(error.problem, null, i18n.t('BankAccountLookup.index.somethingWrong'));

        }

    }

    //This method will set the default accounts checbox checked
    setDefaultAccountChecked() {

        const b = this.props.navigation.state.params.data.existingBankAccounts.map(element => {

            if ((this.props.navigation.state.params.data.existingDefaultAcc.AccountNumber == element.AccountNumber) && (this.props.navigation.state.params.data.existingDefaultAcc.BankID == element.BankID)) {
                element.isChecked = true
                //setting deafult account as user selected account.bcz of that back and forth will not failed.
                this.setState({ selectedDeafultAccount: this.props.navigation.state.params.data.existingDefaultAcc });
            }
            else {
                element.isChecked = false
            }

        });

        this.setState({
            selectedBankAccounts: b,
        })

    }


    componentWillReceiveProps(nextProps) {

    }

    passSelectedBankAccounts() {

    }

    removeIsCheckedKey(selectedCustomeBankAccounts) {

        selectedCustomeBankAccounts.forEach(element => {
            delete element.isChecked;

        });

        this.setState({ selectedCustomeBankAccounts: selectedCustomeBankAccounts })
    }

    isEmpty(obj) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }

    clearAccountAddedAlreadyToForm() {
        if (!this.props.navigation.state.params.data.isEditMode)
            this.props.navigation.state.params.data.bankAccountSetter([], null, null);
    }
    handleAction() {




        if (this.state.selectedBankAccounts && this.state.selectedBankAccounts.length > 0) {
            Keyboard.dismiss();
            this.props.udpadeRecentlyAddedBankAccounts(this.state.selectedBankAccounts);
            this.removeIsCheckedKey(this.state.selectedCustomeBankAccounts);
            this.props.navigation.state.params.data.bankAccountSetter(this.state.selectedCustomeBankAccounts, this.isEmpty(this.state.selectedDeafultAccount) ? this.state.selectedCustomeBankAccounts[0] : this.state.selectedDeafultAccount, this.state.uEExistingAccounts)
            this.props.navigation.goBack();

        }
        else {
            Alert.alert("", i18n.t('BankAccountLookup.index.noAccountSelected'));
        }

    }

    scrollToBottom() {
        setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
    }


    handlesupplierErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('BankAccountLookup.index.somethingWrong')) {
        ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
    }


    setUserSelectedDeafultAccount(account = null, isChecked) {

        if (account != null) {

            const a = this.state.selectedBankAccounts.map(element => {
                if ((account.AccountNumber == element.AccountNumber) && (element.BankID == account.BankID)) {
                    element.isChecked = isChecked;

                    if (isChecked) {
                        this.state.selectedCustomeBankAccounts.forEach(element => {
                            if ((element.AccountNumber == account.AccountNumber) && (element.BankID == account.BankID)) {
                                this.setState({ selectedDeafultAccount: account });
                            }

                        });


                    }
                }
                else {
                    element.isChecked = false;
                }
                return element;

            });

            this.setState({ selectedBankAccounts: a });
            if (isChecked)
                Alert.alert("", i18n.t('BankAccountLookup.index.selectedAsDefault'));

        }

    }




    render() {
        return (
            <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
                <View style={styles.searchPanel}>
                    <View style={styles.row}>
                        <View style={Platform.OS === 'ios' ? styles.textInputContainerIos : styles.textInputContainerAndroid}>
                            <Icon name="ios-search" size={20} color={theme.DISABLED_ITEM_COLOR} />
                            <TextInput
                                style={styles.textInput}
                                placeholder={this.props.navigation.state.params.data.placeholder ? this.props.navigation.state.params.data.placeholder : i18n.t('BankAccountLookup.index.textInputPlaceholder')}
                                underlineColorAndroid={'rgba(0,0,0,0)'}
                                onChangeText={(text) => { this.setState({ searchText: text }); }}
                                value={this.state.searchText}
                                returnKeyType={'search'}
                                returnKeyLabel={'search'}
                                onSubmitEditing={this.onKeyPress}
                                blurOnSubmit={true}
                                onBlur={() => Analytics.trackEvent(AnalyticalEventNames.ENTER_SEARCH_TEXT)}
                                autoCorrect={false}
                            />
                            <TouchableOpacity onPress={this.clearSearch}>
                                <View style={styles.closeButton}>
                                    <Icon name="ios-close" size={18} color={theme.TEXT_COLOR_INVERT} style={styles.closeIcon} />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={this.search}>
                            <Text style={styles.searchText}>{i18n.t('BankAccountLookup.index.search')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>


                <View style={styles.searchResultsWrapper}>
                    {this.state.userSearched ? <Text style={styles.SearchfilterTitle}>{i18n.t('BankAccountLookup.index.searchedAccountTitle')}</Text> : null}
                    {this.state.isLoading ?
                        <View style={styles.loader}>
                            <ActivityIndicator animating={true} size={'large'} color={theme.PRIMARY_COLOR} />
                        </View>
                        : null}

                    <View style={styles.searchedBankAccountPanel}>
                        {
                            this.state.userSearched ?
                                this.state.iBnSeachResults.length != 0 ?
                                    <TouchableOpacity onPress={() => this.onItemSelect(this.state.iBnSeachResults == [] ? [] : this.state.iBnSeachResults[0])}>
                                        {/* <Text style={styles.infoTextSubLeft}>{this.state.iBnSeachResults == [] ? '' : this.state.iBnSeachResults[0].ID}</Text> */}
                                        <View style={styles.bankAccountHolder}>
                                            <Text style={[styles.infoTextSubLeftBasic, styles.biggerAccountNo]}>{i18n.t('BankAccountLookup.index.accountNuberText')}{this.state.iBnSeachResults == [] ? '' : this.state.iBnSeachResults[0].AccountNumber.replace(/["']/g, "")}</Text>
                                            <Text style={styles.infoTextSubLeftBasic}>{i18n.t('BankAccountLookup.index.iBN')}{this.state.iBnSeachResults == [] ? '' : this.state.iBnSeachResults[0].IBAN}</Text>
                                            <Text style={styles.infoTextSubLeftBasic}>{i18n.t('BankAccountLookup.index.bankName')}{this.state.iBnSeachResults == [] ? '' : this.state.iBnSeachResults[0].Bank.Name}</Text>

                                        </View>
                                    </TouchableOpacity>
                                    : <Text style={styles.rearchResultText}>{i18n.t('BankAccountLookup.index.noAccountsFound')}</Text>
                                : null
                        }
                    </View>
                </View>

                <View style={styles.selectedResultsWrapper}>
                    {
                        this.state.selectedBankAccounts.length != 0 ?
                            <View style={styles.selectedResultsContainer}>
                                <Text style={styles.selectedAccountsTitle}>{i18n.t('BankAccountLookup.index.selectedAccountsTitle')}{` ( ${this.state.selectedBankAccounts.length} )`}</Text>

                                <FlatList
                                    data={this.state.selectedBankAccounts}
                                    renderItem={props => <ItemListRow {...props} setDefaultAccount={this.setDefaultAccount} removeAccount={this.removeAccount} enableButtons={true} onSelect={this.setUserSelectedDeafultAccount} />}
                                    keyExtractor={(item, index) => index}
                                />

                            </View> : null
                    }

                </View>



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
        recentAccounts: state.bankAccounts.selectedBankAccounts,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        udpadeRecentlyAddedBankAccounts: (accounts) => dispatch(udpadeRecentlyAddedBankAccounts(accounts)),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BankAccountLookup);

const styles = StyleSheet.create({

    selectedResultsContainer: {
        flex: 1
    },
    biggerAccountNo: {
        fontWeight: '900',
        fontSize: 13,
    }
    ,
    bankAccountHolder: {
        backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
        marginRight: 5,
        padding: 5,
        marginTop: 5,
    },
    selectedResultsWrapper: {
        paddingHorizontal: 15,
        flex: 1

    },
    searchResultsWrapper: {
        paddingTop: 10,
        paddingHorizontal: 15,
        height: 150,
    },
    loader: {
        justifyContent: 'center',
        alignItems: 'center',
        width: WIDTH,
        height: 150,
        paddingTop: 20,
        position: 'absolute',
        zIndex: 10
    },
    activity: {
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'red',
        justifyContent: 'center',
    },
    column: {
        flexDirection: 'column',
    },
    fromBackgroundStyle: {
        backgroundColor: '#FFF',
    },
    toBackgroundStyle: {
        backgroundColor: '#FFF',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchPanel: {
        padding: 15,

    },
    sellected: {
        padding: 15,
        backgroundColor: 'green',
        flex: 5
    },
    searchedBankAccountPanel: {
        height: 100,
    },
    searchText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.PRIMARY_COLOR,
    },
    textInputContainerIos: {
        flex: 1,
        padding: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
        borderRadius: 8,
        marginRight: 10,
    },
    textInputContainerAndroid: {
        flex: 1,
        paddingHorizontal: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY,
        borderRadius: 8,
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        marginHorizontal: 10,
    },
    closeButton: {
        width: 16,
        borderRadius: 18,
        height: 16,
        backgroundColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterIcon: {
        alignSelf: 'center',
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    iosIconAlignment: {
        marginTop: 3,
    },
    closeIcon: {
        marginTop: 1,
        alignSelf: 'center',
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    filterPanel: {
        paddingHorizontal: 15,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.PRIMARY_TEXT_COLOR,
    },
    filterList: {
        flexDirection: 'row',
        paddingVertical: 15,
    },
    filterItem: {
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 8
    },
    filterItemIconActive: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 40,
        marginBottom: 5,
        backgroundColor: theme.PRIMARY_COLOR,
    },
    filterItemIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 40,
        marginBottom: 5,
        backgroundColor: theme.PRIMARY_BACKGROUND_COLOR,
        borderColor: theme.SCREEN_COLOR_LIGHT_GREY_1,
        borderWidth: 1,
    },
    filterItemText: {
        fontSize: 11,
        marginHorizontal: -5,
        textAlign: 'center',
        color: theme.DISABLED_ITEM_COLOR,
    },
    resultsContainer: {
        paddingTop: 0,
    },
    resultTitle: {
        padding: 15,
        paddingRight: 5,
        fontSize: 16,
        fontWeight: '700',
        color: theme.PRIMARY_TEXT_COLOR,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: theme.SECONDARY_TEXT_COLOR,
        textAlign: 'center',
        lineHeight: 23,
    },
    palceHolderSpacer: {
        height: 150,
    },
    clearSearchButton: {
        height: 35,
        width: 3 * (WIDTH / 4),
        backgroundColor: 'transparent',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: theme.PRIMARY_COLOR,
        marginHorizontal: 30,
    },
    clearSearchText: {
        color: theme.PRIMARY_COLOR,
        fontWeight: '400',
    },
    headerStyle: {
        flex: 1,
        textAlign: 'center',
    },
    footerLoaderBox: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoTextSubLeft: {
        color: theme.COLOR_LIGHT_GRAY,
        fontSize: 12,
        fontWeight: '500',
        paddingVertical: 5,

    },
    rearchResultText: {
        color: theme.COLOR_DARK_GRAY,
        fontSize: 12,
        fontWeight: '500',
        paddingVertical: 5,

    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.PRIMARY_TEXT_COLOR,
    },
    SearchfilterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.PRIMARY_TEXT_COLOR,
        marginTop: 5
    },
    selectedAccountsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.PRIMARY_TEXT_COLOR,
        marginTop: 5,
        paddingBottom: 5
    },
    infoTextSubLeftBasic: {
        color: theme.PRIMARY_TEXT_COLOR,
        fontSize: 12,
        fontWeight: '500',
        paddingVertical: 5,
        marginRight: -80
    },
});
