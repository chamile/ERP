// @flow
import React, { Component } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Dimensions,
    Platform,
    Keyboard,
} from 'react-native';
import { connect } from 'react-redux';
import KeyboardSpacer from 'react-native-keyboard-spacer';

import ViewWrapper from '../../components/ViewWrapper';
import { theme } from '../../styles';
import i18n from '../../i18n/i18nConfig';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { addNewAddressToList, editExistingAddressInList } from '../../actions/addressListActions';
import AlertService from '../../services/AlertService';
import { AlertType } from '../../constants/AlertTypes';
import AddressService from '../../services/AddressService';
import { EntityType } from '../../constants/EntityTypes';

const WIDTH: number = Dimensions.get('window').width;

class AddNewAddress extends Component {
    static navigationOptions = ({ navigation }) => {
        return {
            title: navigation.state.params.isEditMode ? i18n.t('AddNewAddress.index.titleEdit') : i18n.t('AddNewAddress.index.title'),
            headerTintColor: theme.TEXT_COLOR_INVERT,
            headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
            headerRight: <HeaderTextButton navigate={navigation.navigate} onPress={() => navigation.state.params.handleAction()} text={navigation.state.params.isEditMode ? i18n.t('AddNewAddress.index.save') : i18n.t('AddNewAddress.index.add')} position="right" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerLeft: <HeaderTextButton navigate={navigation.navigate} onPress={() => { Keyboard.dismiss(); navigation.goBack(); }} text={i18n.t('AddNewAddress.index.cancel')} position="left" isActionComplete={navigation.state.params.disableActionButton ? navigation.state.params.disableActionButton : false} />,
            headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
        };
    };

    constructor() {
        super();
        this.state = {
            addressDetails: {
                City: '',
                Country: '',
                CountryCode: null,
                CountryId: null,
                PostalCode: '',
                AddressLine1: '',
                AddressLine2: '',
                AddressLine3: '',
            },
            errors: {
                City: null,
                Country: null,
                CountryCode: null,
                PostalCode: null,
                AddressLine1: null,
                AddressLine2: null,
                AddressLine3: null,
            },
            isLookingForCity: false,
        };

        this.addNewCustomer = this.addNewCustomer.bind(this);
        this.handleAction = this.handleAction.bind(this);
        this.setEditAddressDetails = this.setEditAddressDetails.bind(this);
        this.editExistingAddress = this.editExistingAddress.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this.selectCountry = this.selectCountry.bind(this);
        this.setCountry = this.setCountry.bind(this);
        this.lookupCity = this.lookupCity.bind(this);
        this.clearCountry = this.clearCountry.bind(this);
    }

    componentWillMount() {
        this.props.navigation.setParams({ handleAction: this.handleAction, disableActionButton: false });
        this.props.navigation.state.params.isEditMode ? this.setEditAddressDetails() : null;
    }

    setEditAddressDetails() {
        if (this.props.navigation.state.params.address) {
            const { address } = this.props.navigation.state.params;
            this.setState({
                addressDetails: {
                    ...this.state.addressDetails,
                    ...address,
                }
            });
        }
    }

    setCountry(country) {
        this.setState({ addressDetails: { ...this.state.addressDetails, Country: country.Name, CountryCode: country.CountryCode, CountryId: country.ID } });
    }

    selectCountry() {
        Keyboard.dismiss();
        this.props.navigation.navigate('LookupView', {
            data: {
                title: i18n.t('AddNewAddress.index.selectCountry'),
                searchCriteria: i18n.t('AddNewAddress.index.country'),
                entityType: EntityType.COUNTRY,
                setter: this.setCountry,
                showInstantResults: true,
                service: AddressService.getCountryList.bind(null, this.props.company.selectedCompany.Key),
                filter: (Country, serachText) => this.filterCountry(Country, serachText),
                selectedItem: {
                  ID: this.state.addressDetails.CountryId,
                  Display: this.state.addressDetails.Country,
                },
                clearSelectedItem: this.clearCountry,
            }
        });
    }

    clearCountry() {
        this.setState({ addressDetails: { ...this.state.addressDetails, Country: null, CountryCode: null, CountryId: null } });
    }

    filterCountry(Country, serachText) {
        if ((Country.ID && Country.ID.toString().indexOf(serachText) !== -1)
            || (Country.Name && Country.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
            return Country;
        } else {
            return null;
        }
    }

    isValid() {
        const errors = {};
        if (!this.state.addressDetails.AddressLine1) {
            errors.AddressLine1 = i18n.t('AddNewAddress.index.noAddressLine');
        }
        this.setState({ errors: { ...this.state.errors, ...errors } });
        return Object.keys(errors).length === 0;
    }

    handleAction() {
        Keyboard.dismiss();
        if (this.isValid()) {
            this.props.navigation.state.params.isEditMode ? this.editExistingAddress() : this.addNewCustomer();
        } else {
            this.scrollToBottom();
        }
    }

    scrollToBottom() {
        setTimeout(() => this._scrollview.scrollToEnd({ animated: true }), 200);
      }

    addNewCustomer() {
        if (this.props.navigation.state.params && this.props.navigation.state.params.setAddress) {  // check any setAddress method passed via navigation props and call, that address
            this.props.navigation.state.params.setAddress(this.state.addressDetails, this.props.addressList.addresses.length)
        }
        this.props.addNewAddressToList(this.state.addressDetails);
        this.props.navigation.goBack();
    }

    editExistingAddress() {
      if(this.props.navigation.state.params.index || this.props.navigation.state.params.index == 0) {
        this.props.editExistingAddressInList(this.state.addressDetails, this.props.navigation.state.params.index);
        this.props.navigation.goBack();
      }
      else {
        AlertService.showSimpleAlert(i18n.t('AddNewAddress.index.errorTitle'), i18n.t('AddNewAddress.index.errorSaving'), AlertType.ERROR);
      }
    }

    lookupCity() {
        if (this.state.addressDetails.PostalCode !== '') {
            this.setState({ isLookingForCity: true });
            AddressService.lookupCityBaseOnPostalCode(this.state.addressDetails.PostalCode, this.props.company.selectedCompany.Key)
                .then(res => {
                    if (res.ok) {
                        this.setState({ addressDetails: { ...this.state.addressDetails, City: res.data.length > 0 ? res.data[0].City : this.state.addressDetails.City }, isLookingForCity: false });
                    }
                })
                .catch(() => { this.setState({ isLookingForCity: false }); });
        }
    }

    render() {
        return (
            <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR}>
                <ScrollView keyboardDismissMode={'interactive'} ref={ref => this._scrollview = ref} key={'scrollView'} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
                    <View style={styles.detailsContainer} >
                        <InlineValidationInputField
                            title={i18n.t('AddNewAddress.index.addressLine') + ' 1'}
                            placeHolder={i18n.t('AddNewAddress.index.notSpecified')}
                            isKeyboardInput={true}
                            value={this.state.addressDetails.AddressLine1}
                            onChangeText={AddressLine1 => this.setState({ addressDetails: { ...this.state.addressDetails, AddressLine1 }, errors: { ...this.state.errors, AddressLine1: '' } })}
                            error={this.state.errors.AddressLine1}
                        />
                        <InlineValidationInputField
                            title={i18n.t('AddNewAddress.index.addressLine') + ' 2'}
                            placeHolder={i18n.t('AddNewAddress.index.notSpecified')}
                            isKeyboardInput={true}
                            value={this.state.addressDetails.AddressLine2}
                            onChangeText={AddressLine2 => this.setState({ addressDetails: { ...this.state.addressDetails, AddressLine2 }, errors: { ...this.state.errors, AddressLine2: '' } })}
                        />
                        <InlineValidationInputField
                            title={i18n.t('AddNewAddress.index.addressLine') + ' 3'}
                            placeHolder={i18n.t('AddNewAddress.index.notSpecified')}
                            isKeyboardInput={true}
                            value={this.state.addressDetails.AddressLine3}
                            onChangeText={AddressLine3 => this.setState({ addressDetails: { ...this.state.addressDetails, AddressLine3 }, errors: { ...this.state.errors, AddressLine3: '' } })}
                        />
                        <InlineValidationInputField
                            title={i18n.t('AddNewAddress.index.zipCode')}
                            placeHolder={i18n.t('AddNewAddress.index.notSpecified')}
                            isKeyboardInput={true}
                            keyboardType={'phone-pad'}
                            value={this.state.addressDetails.PostalCode}
                            onChangeText={PostalCode => this.setState({ addressDetails: { ...this.state.addressDetails, PostalCode }, errors: { ...this.state.errors, PostalCode: '' } })}
                            onFocus={this.scrollToBottom}
                            onBlur={this.lookupCity}
                        />
                        <InlineValidationInputField
                            title={i18n.t('AddNewAddress.index.city')}
                            placeHolder={i18n.t('AddNewAddress.index.notSpecified')}
                            isKeyboardInput={true}
                            editable={!this.state.isLookingForCity}
                            value={this.state.addressDetails.City}
                            onChangeText={City => this.setState({ addressDetails: { ...this.state.addressDetails, City }, errors: { ...this.state.errors, City: '' } })}
                            onFocus={this.scrollToBottom}
                            showLoadingSpinner={this.state.isLookingForCity}
                        />
                        <InlineValidationInputField
                            title={i18n.t('AddNewAddress.index.country')}
                            placeHolder={i18n.t('AddNewAddress.index.notSpecified')}
                            isKeyboardInput={false}
                            onPress={this.selectCountry}
                            value={this.state.addressDetails.Country}
                        />
                    </View>
                    <View style={styles.spacer} />
                    {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
                    {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
                </ScrollView>
            </ViewWrapper>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        user: state.user,
        company: state.company,
        addressList: state.addressList,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        addNewAddressToList: (address) => dispatch(addNewAddressToList(address)),
        editExistingAddressInList: (address, index) => dispatch(editExistingAddressInList(address, index)),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddNewAddress);

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
    }
});
