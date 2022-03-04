// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Platform,
  StyleSheet,
  InteractionManager,
  Alert,
  Keyboard

} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import _ from 'lodash';
import Analytics from 'appcenter-analytics';

import { CalendarStrip } from '../../components/CalendarStrip';
import ViewWrapper from '../../components/ViewWrapper';
import TimePicker from '../../components/TimePicker';
import TimeDurationPicker from '../../components/TimeDurationPicker';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { EntityType } from '../../constants/EntityTypes';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import WorkerService from '../../services/WorkerService';
import CompanyService from '../../services/CompanyService';
import { validateRecentData, updateCompaniesRecentData } from '../../actions/recentDataActions';
import { setDraftWorkLog } from '../../actions/workLogActions';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import CustomerService from '../../services/CustomerService';
import { AnalyticalEventNames } from '../../constants/AnalyticalEventNames';
import { HeaderBackButton } from '../../components/HeaderBackButton';

class AddNewWorkLog extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.isViewOnlyMode ? i18n.t('AddNewWorkLog.index.hours') : navigation.state.params.isEditMode ? i18n.t('AddNewWorkLog.index.editHours') : i18n.t('AddNewWorkLog.index.addHours'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: navigation.state.params.isViewOnlyMode ? null : <HeaderTextButton isActionComplete={navigation.state.params.isActionComplete} position={'right'} text={navigation.state.params.isEditMode ? i18n.t('AddNewWorkLog.index.update') : i18n.t('AddNewWorkLog.index.add')} onPress={navigation.state.params.handleRightButton} />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      isContentEdited: false,
      isEditMode: props.navigation.state.params.isEditMode,
      isViewOnlyMode: props.navigation.state.params.isViewOnlyMode,
      selectedDate: props.navigation.state.params.selectedDate,
      timeLog: this.setInitialState(props.navigation.state.params, props.recentData.companies[props.company.selectedCompany.Key].lastLoggedEndTime ? moment(props.recentData.companies[props.company.selectedCompany.Key].lastLoggedEndTime).isSame(new Date(), 'day') ? moment(props.recentData.companies[props.company.selectedCompany.Key].lastLoggedEndTime) : null : null, props.recentData, null),
      errors: {
        workType: null
      },
      isFormUpdated: false
    };

    this.isActionComplete = false;

    this.onProjectSelect = this.onProjectSelect.bind(this);
    this.setProject = this.setProject.bind(this);
    this.onDepartmentSelect = this.onDepartmentSelect.bind(this);
    this.setDepartment = this.setDepartment.bind(this);
    this.onWorkTypeSelect = this.onWorkTypeSelect.bind(this);
    this.setWorkType = this.setWorkType.bind(this);
    this.onOrderSelect = this.onOrderSelect.bind(this);
    this.setOrder = this.setOrder.bind(this);
    this.setDescription = this.setDescription.bind(this);
    this.setLunchMins = this.setLunchMins.bind(this);
    this.roundLunchMins = this.roundLunchMins.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.handleChangeSelectedDate = this.handleChangeSelectedDate.bind(this);
    this.handleRightButton = this.handleRightButton.bind(this);
    this.onCustomerSelect = this.onCustomerSelect.bind(this);
    this.setCustomer = this.setCustomer.bind(this);
    this.clearProject = this.clearProject.bind(this);
    this.clearCustomer = this.clearCustomer.bind(this);
    this.clearDepartment = this.clearDepartment.bind(this);
    this.clearOrder = this.clearOrder.bind(this);
    this.clearWorkType = this.clearWorkType.bind(this);
  }

  componentWillMount() {
    if (!this.props.navigation.state.params.isEditMode && !this.props.navigation.state.params.isViewOnlyMode) {
      this.props.validateRecentData(this.props.recentData, this.props.company.selectedCompany.Key);
      this.getLatestEndTime(this.props.company.selectedCompany.Key, this.props.navigation.state.params.workerRelationID, this.props.navigation.state.params.selectedDate);
    }
  }

  componentDidMount() {
    this.props.navigation.setParams({ handleRightButton: this.handleRightButton });
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        this.calendar.jumpToDate(this.props.navigation.state.params.selectedDate.day);
      }, 0);
    });
    setTimeout(() => this.showDraftAlert(this.state.selectedDate), 1000);
  }

  showDraftAlert(selectedDate) {
    if (this.props.draftWorkLog.timeLog && !this.props.navigation.state.params.isViewOnlyMode && !this.props.navigation.state.params.isEditMode && moment(this.props.draftWorkLog.timeLog.drafDate).isSame(selectedDate.day, 'day')) {
      Alert.alert(
        i18n.t('AddNewWorkLog.index.draftDataAlert.title'),
        i18n.t('AddNewWorkLog.index.draftDataAlert.description'),
        [
          { text: i18n.t('AddNewWorkLog.index.draftDataAlert.clearButton'), onPress: () => { this.props.setDraftWorkLog({ timeLog: null }) } },
          { text: i18n.t('AddNewWorkLog.index.draftDataAlert.continueButton'), onPress: () => { this.setState({ timeLog: this.setInitialState(this.props.navigation.state.params, moment(this.props.recentData.companies[this.props.company.selectedCompany.Key].lastLoggedEndTime).isSame(new Date(), 'day') ? moment(this.props.recentData.companies[this.props.company.selectedCompany.Key].lastLoggedEndTime) : this.state.selectedDate.day, this.props.recentData, this.props.draftWorkLog.timeLog) }); this.props.setDraftWorkLog({ timeLog: null }) } },
        ],
        { cancelable: false }
      )
    }
  }

  componentWillUnmount() {
    if (this.state.isContentEdited) {
      this.props.navigation.state.params.updateCalendar(this.state.selectedDate.day);
    }

    if (!this.props.navigation.state.params.isEditMode && !this.props.navigation.state.params.isViewOnlyMode) {
      if (this.state.isFormUpdated) {
        this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day } });
      }

    }
  }

  componentWillReceiveProps(nextProps) {
    const recentCompanyData = this.props.recentData.companies[this.props.company.selectedCompany.Key];
    const newCompanyData = nextProps.recentData.companies[this.props.company.selectedCompany.Key];

    if (recentCompanyData && newCompanyData) {
      if (recentCompanyData.project && (!_.isEqual(recentCompanyData.project, newCompanyData.project) && this.state.timeLog.project.id === recentCompanyData.project.id)) {
        const project = { id: newCompanyData.project.id, name: newCompanyData.project.name, projectNumber: newCompanyData.project.projectNumber };
        const timeLog = { ...this.state.timeLog, project };
        this.setState({ timeLog });
      }
      if (recentCompanyData.department && (!_.isEqual(recentCompanyData.department, newCompanyData.department) && this.state.timeLog.department.id === recentCompanyData.department.id)) {
        const department = { id: newCompanyData.department.id, name: newCompanyData.department.name, departmentNumber: newCompanyData.department.departmentNumber };
        const timeLog = { ...this.state.timeLog, department };
        this.setState({ timeLog });
      }
      if (recentCompanyData.workType && (!_.isEqual(recentCompanyData.workType, newCompanyData.workType) && this.state.timeLog.workType.id === recentCompanyData.workType.id)) {
        const workType = { id: newCompanyData.workType.id, name: newCompanyData.workType.name };
        const timeLog = { ...this.state.timeLog, workType };
        this.setState({ timeLog });
      }
      if (recentCompanyData.order && (!_.isEqual(recentCompanyData.order, newCompanyData.order) && this.state.timeLog.order.id === recentCompanyData.order.id)) {
        const order = { id: newCompanyData.order.id, number: newCompanyData.order.number, company: newCompanyData.order.company };
        const timeLog = { ...this.state.timeLog, order };
        this.setState({ timeLog });
      }
      if (recentCompanyData.customer && (!_.isEqual(recentCompanyData.customer, newCompanyData.customer) && this.state.timeLog.customer.id === recentCompanyData.customer.id)) {
        const customer = { id: newCompanyData.customer.id, name: newCompanyData.customer.name, customerNumber: newCompanyData.customer.customerNumber };
        const timeLog = { ...this.state.timeLog, customer };
        this.setState({ timeLog });
      }
    }
  }

  getLatestEndTime(companyKey, workerRelationID, selectedDate) {
    WorkerService.getLatestEndTime(companyKey, workerRelationID, selectedDate.day.format('YYYY-MM-DD'))
      .then((response) => {
        if (response.ok) {
          this.setState({ isFormUpdated: false, selectedDate, timeLog: this.setInitialState(this.props.navigation.state.params, response.data ? moment(response.data) : selectedDate.day, this.props.recentData, null) }, () => {
            this._validateAndSetTime(this.state.timeLog.startTime, this.state.timeLog.endTime, this.state.timeLog.lunchInMinutes);
          });
        }
      })
      .catch(err => {
        this.setState({ selectedDate, timeLog: this.setInitialState(this.props.navigation.state.params, moment(this.props.recentData.companies[this.props.company.selectedCompany.Key].lastLoggedEndTime).isSame(new Date(), 'day') ? moment(this.props.recentData.companies[this.props.company.selectedCompany.Key].lastLoggedEndTime) : selectedDate.day, this.props.recentData, null) });
      });
  }

  _getEndTime(originalDate) {
    let date = moment(originalDate);
    if (date.isSame(new Date(), 'day')) {
      date.set({
        hour: date.hours() >= new Date().getHours() ? date.hours() + 1 : new Date().getHours(),
        minute: date.hours() >= new Date().getHours() ? date.minutes() : new Date().getMinutes(),
        millisecond: date.hours() >= new Date().getHours() ? date.millisecond() : new Date().getMilliseconds()
      });
    }
    else {
      date.set({
        hour: date.hours() === 0 && date.minutes() === 0 && date.milliseconds() === 0 ? 9 : date.hours() + 1,
        minute: date.minutes(),
        millisecond: date.milliseconds()
      });
    }
    return date;
  }

  _getStartTime(originalDate) {
    let date = moment(originalDate);
    if (date.hours() === 0 && date.minutes() === 0 && date.milliseconds() === 0) {
      date.set({ hour: 8 });
    }
    return date;
  }

  _getRoundedDate(minutes, originalDate) {
    const coeff = 1000 * 60 * minutes;
    const date = moment(Math.ceil((+originalDate) / coeff) * coeff);
    return date.toDate();
  }

  setInitialState(params, withDate, recentData, draftData) {
    const recentCompanyData = recentData.companies[this.props.company.selectedCompany.Key];
    if (!params.isEditMode && !params.isViewOnlyMode) {
      return {
        startTime: (draftData && draftData.startTime) ? draftData.startTime : (this._getRoundedDate(5, moment.isMoment(withDate) ? this._getStartTime(withDate) : this._getStartTime(params.selectedDate.day))),
        endTime: (draftData && draftData.endTime) ? draftData.endTime : (this._getRoundedDate(5, moment.isMoment(withDate) ? this._getEndTime(withDate) : this._getEndTime(params.selectedDate.day))),
        project: {
          name: (draftData && draftData.project) ? draftData.project.name : (recentCompanyData && recentCompanyData.project ? recentCompanyData.project.name : null),
          id: (draftData && draftData.project) ? draftData.project.id : (recentCompanyData && recentCompanyData.project ? recentCompanyData.project.id : null),
          projectNumber: (draftData && draftData.project) ? draftData.project.projectNumber : (recentCompanyData && recentCompanyData.project ? recentCompanyData.project.projectNumber : null),
        },
        department: {
          name: (draftData && draftData.department) ? draftData.department.name : (recentCompanyData && recentCompanyData.department ? recentCompanyData.department.name : null),
          id: (draftData && draftData.department) ? draftData.department.id : (recentCompanyData && recentCompanyData.department ? recentCompanyData.department.id : null),
          departmentNumber: (draftData && draftData.department) ? draftData.department.departmentNumber : (recentCompanyData && recentCompanyData.department ? recentCompanyData.department.departmentNumber : null),
        },
        workType: {
          name: (draftData && draftData.workType) ? draftData.workType.name : (recentCompanyData && recentCompanyData.workType ? recentCompanyData.workType.name : null),
          id: (draftData && draftData.workType) ? draftData.workType.id : (recentCompanyData && recentCompanyData.workType ? recentCompanyData.workType.id : null),
        },
        order: {
          id: (draftData && draftData.order) ? draftData.order.id : (recentCompanyData && recentCompanyData.order ? recentCompanyData.order.id : null),
          number: (draftData && draftData.order) ? draftData.order.number : (recentCompanyData && recentCompanyData.order ? recentCompanyData.order.number : null),
          company: (draftData && draftData.order) ? draftData.order.company : (recentCompanyData && recentCompanyData.order ? recentCompanyData.order.company : null),
        },
        customer: {
          id: (draftData && draftData.customer) ? draftData.customer.id : (recentCompanyData && recentCompanyData.customer ? recentCompanyData.customer.id : null),
          name: (draftData && draftData.customer) ? draftData.customer.name : (recentCompanyData && recentCompanyData.customer ? recentCompanyData.customer.name : null),
          customerNumber: (draftData && draftData.customer) ? draftData.customer.customerNumber : (recentCompanyData && recentCompanyData.customer ? recentCompanyData.customer.customerNumber : null),
        },
        description: (draftData && draftData.description) ? draftData.description : null,
        lunchInMinutes: (draftData && draftData.lunchInMinutes) ? draftData.lunchInMinutes : 0,

      };
    } else {
      return this._getTimeLogFromData(params.data);
    }
  }

  _getTimeLogFromData(data) {
    const timeLog = {};
    timeLog.ID = data.ID;
    timeLog.dimensionsId = data.DimensionsID; // we need this when updating a log
    timeLog.startTime = new Date(data.StartTime);
    timeLog.endTime = new Date(data.EndTime);

    timeLog.project = {
      name: data.Dimensions && data.Dimensions.Project ? data.Dimensions.Project.Name : null,
      id: data.Dimensions && data.Dimensions.Project ? data.Dimensions.Project.ID : null,
      projectNumber: data.Dimensions && data.Dimensions.Project ? data.Dimensions.Project.ProjectNumber : null,
    };

    timeLog.department = {
      name: data.Dimensions && data.Dimensions.Department ? data.Dimensions.Department.Name : null,
      id: data.Dimensions && data.Dimensions.Department ? data.Dimensions.Department.ID : null,
      departmentNumber: data.Dimensions && data.Dimensions.Department ? data.Dimensions.Department.DepartmentNumber : null,
    };

    timeLog.workType = {
      name: data.Worktype ? data.Worktype.Name : null,
      id: data.Worktype ? data.Worktype.ID : null
    };

    timeLog.order = {
      id: data.CustomerOrder ? data.CustomerOrder.ID : null,
      number: data.CustomerOrder ? data.CustomerOrder.OrderNumber : null,
      company: data.CustomerOrder ? data.CustomerOrder.CustomerName : null
    };

    timeLog.customer = {
      id: data.Customer ? data.Customer.ID : null,
      name: data.Customer && data.Customer.Info && data.Customer.Info.Name ? data.Customer.Info.Name : null,
      customerNumber: data.Customer && data.Customer.CustomerNumber ? data.Customer.CustomerNumber : null,
    };

    timeLog.description = data.Description ? data.Description : null;
    timeLog.lunchInMinutes = data.LunchInMinutes ? data.LunchInMinutes : null;
    return timeLog;
  }

  _validateAndSetTime(startTime, endTime, offsetMins) {
    const timeLog = { ...this.state.timeLog };
    const _startTime = moment(startTime);
    const _endTime = moment(endTime);

    const duration = moment.duration(_endTime.diff(_startTime)).asMinutes() - offsetMins;

    // Good date and language
    const language = i18n.language.includes('nn') || i18n.language.includes('nb') ? 'no' : 'en';
    timeLog.startTime = _startTime.toDate();
    timeLog.endTime = _endTime.toDate();
    timeLog.lunchInMinutes = offsetMins;
    this.setState({ timeLog });
  }

  addNewWorkLog(workItem, caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    WorkerService.createWorkLog(companyKey, workItem)
      .then((response) => {
        if (!response.ok) {
          this.handleErrors(response.problem, caller, i18n.t('AddNewWorkLog.index.addWorklogError'));
        } else {
          this.props.navigation.goBack();
          this.props.navigation.state.params.updateWorkLogTimeStamp();
          this.props.navigation.state.params.onChangeSuccess ? this.props.navigation.state.params.onChangeSuccess() : null;
        }
      })
      .catch((error) => {
        this.isActionComplete = false;
        this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        this.handleErrors(error.problem, caller, i18n.t('AddNewWorkLog.index.addWorklogError'));
      });

    Analytics.trackEvent(AnalyticalEventNames.ADD_NEW_WORKLOG, {
      From: 'Add new worklog',
    });
  }

  editWorkLog(workItem, caller) {
    const companyKey = this.props.company.selectedCompany.Key;
    WorkerService.editWorkLog(companyKey, workItem)
      .then((response) => {
        if (!response.ok) {
          this.handleErrors(error.response, caller, i18n.t('AddNewWorkLog.index.editWorklogError'));
        }
        this.setState({ isContentEdited: true });
        this.props.navigation.state.params.onChangeSuccess ? this.props.navigation.state.params.onChangeSuccess() : null;
        this.props.navigation.goBack();
      })
      .catch((error) => {
        this.isActionComplete = false;
        this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        this.handleErrors(error.problem, caller, i18n.t('AddNewWorkLog.index.editWorklogError'));
      });
  }

  handleErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('AddNewWorkLog.index.somethingWrong')) {
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  isValid() {
    const timeLog = { ...this.state.timeLog };
    const _startTime = moment(timeLog.startTime);
    const _endTime = moment(timeLog.endTime);
    const _lunchInMinutes = timeLog.lunchInMinutes;
    const workMins = _endTime.diff(_startTime) / 60000;
    if (workMins === 0) {
      Alert.alert(i18n.t('AddNewWorkLog.index.alertHeader'), i18n.t('AddNewWorkLog.index.timesInvalid'));
    } else if ((workMins - _lunchInMinutes) <= 0) {
      Alert.alert(i18n.t('AddNewWorkLog.index.alertHeader'), i18n.t('AddNewWorkLog.index.timesInvalid'));
    } else if (!timeLog.workType.id) {
      Alert.alert(i18n.t('AddNewWorkLog.index.alertHeader'), i18n.t('AddNewWorkLog.index.enterWorkType'));
      this.setState({ errors: { ...this.state.errors, workType: i18n.t('AddNewWorkLog.index.enterWorkType') } });
    } else {
      return true;
    }
  }

  handleRightButton() {
    Keyboard.dismiss();
    this.isActionComplete = true;
    this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    if (!this.isValid()) {
      this.isActionComplete = false;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      return;
    }

    const timeLog = { ...this.state.timeLog };
    const workItem = {
      WorkRelationID: this.props.navigation.state.params.workerRelationID,
      WorkTypeID: timeLog.workType.id,
      CustomerOrderID: timeLog.order.id,
      Description: timeLog.description,
      ID: timeLog.ID,
      Date: this.state.selectedDate.day.format('YYYY-MM-DD') + 'T00:00:00.000Z',
      StartTime: timeLog.startTime.toISOString(),
      EndTime: timeLog.endTime.toISOString(),
      Minutes: 0,
      LunchInMinutes: Number(timeLog.lunchInMinutes),
      Dimensions: { ProjectID: timeLog.project.id, DepartmentID: timeLog.department.id, ID: timeLog.dimensionsId },
      CustomerID: timeLog.customer.id,
    };

    if (this.state.isEditMode) {
      this.editWorkLog(workItem, this.handleRightButton);
    } else {
      this.addNewWorkLog(workItem, this.handleRightButton);
    }
    this.updateRecentData();
    this.props.setDraftWorkLog({ timeLog: null });
  }

  updateRecentData() {
    const companyKey = this.props.company.selectedCompany.Key;
    const { companies } = this.props.recentData;
    companies[companyKey] = {
      project: {
        name: this.state.timeLog.project.name,
        id: this.state.timeLog.project.id,
        projectNumber: this.state.timeLog.project.projectNumber,
      },
      department: {
        name: this.state.timeLog.department.name,
        id: this.state.timeLog.department.id,
        departmentNumber: this.state.timeLog.department.departmentNumber,
      },
      workType: {
        name: this.state.timeLog.workType.name,
        id: this.state.timeLog.workType.id
      },
      order: {
        id: this.state.timeLog.order.id,
        number: this.state.timeLog.order.number,
        company: this.state.timeLog.order.company
      },
      customer: {
        id: this.state.timeLog.customer.id,
        name: this.state.timeLog.customer.name,
        customerNumber: this.state.timeLog.customer.customerNumber,
      },
      lastLoggedEndTime: this.state.timeLog.endTime
    };
    this.props.updateCompaniesRecentData(companies);
  }

  _handleTimePicked(timeType, timestamp) {
    const _startTime = (timeType === 'fromTime') ? timestamp : null;
    const _endTime = (timeType === 'toTime') ? timestamp : null;

    this._validateAndSetTime(
      _startTime ? _startTime : this.state.timeLog.startTime,
      _endTime ? _endTime : this.state.timeLog.endTime,
      this.state.timeLog.lunchInMinutes);
    this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
    this.setState({ isFormUpdated: true });
  }

  _handleMultipleTimeChanges(timeData) {
    this._validateAndSetTime(
      timeData.fromTime,
      timeData.toTime,
      this.state.timeLog.lunchInMinutes);
  }

  onProjectSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewWorkLog.index.selectProject'),
        searchCriteria: i18n.t('AddNewWorkLog.index.project'),
        entityType: EntityType.PROJECT,
        showInstantResults: true,
        setter: this.setProject,
        service: WorkerService.getWorkingProjects.bind(null, this.props.company.selectedCompany.Key),
        filter: (project, serachText) => this.filterProject(project, serachText),
        selectedItem: {
          ID: this.state.timeLog.project.projectNumber,
          Display: this.state.timeLog.project.name,
        },
        clearSelectedItem: this.clearProject,
      }
    });
  }

  clearProject() {
    const timeLog = { ...this.state.timeLog };
    timeLog.project.name = null;
    timeLog.project.id = null;
    timeLog.project.projectNumber = null;
    this.setState({ timeLog, isContentEdited: true });
  }

  onCustomerSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewWorkLog.index.selectCustomer'),
        searchCriteria: i18n.t('AddNewWorkLog.index.customer'),
        entityType: EntityType.CUSTOMER,
        showInstantResults: true,
        setter: this.setCustomer,
        service: CustomerService.getCustomers.bind(null, this.props.company.selectedCompany.Key),
        filter: (customer, serachText) => this.filterCustomer(customer, serachText),
        selectedItem: {
          ID: this.state.timeLog.customer.customerNumber,
          Display: this.state.timeLog.customer.name,
        },
        clearSelectedItem: this.clearCustomer,
      }
    });
  }

  clearCustomer() {
    const timeLog = { ...this.state.timeLog };
    timeLog.customer.name = null;
    timeLog.customer.id = null;
    timeLog.customer.customerNumber = null;
    this.setState({ timeLog, isContentEdited: true });
  }

  filterProject(project, serachText) {
    if (project.ID.toString().indexOf(serachText) !== -1
      || (project.Name && project.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return project;
    } else {
      return null;
    }
  }

  filterCustomer(customer, serachText) {
    if (customer.ID.toString().indexOf(serachText) !== -1
      || (customer.Info && customer.Info.Name && customer.Info.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return customer;
    } else {
      return null;
    }
  }

  setProject(project) {
    const timeLog = { ...this.state.timeLog };
    timeLog.project.name = project.Name;
    timeLog.project.id = project.ID;
    timeLog.project.projectNumber = project.ProjectNumber;
    this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
    this.setState({ timeLog, isContentEdited: true, isFormUpdated: true });

  }

  setCustomer(customer) {
    const timeLog = { ...this.state.timeLog };
    timeLog.customer.id = customer.ID;
    timeLog.customer.name = customer.Info.Name;
    timeLog.customer.customerNumber = customer.CustomerNumber;
    this.setState({ timeLog, isContentEdited: true });

  }

  onDepartmentSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewWorkLog.index.selectDepartment'),
        searchCriteria: i18n.t('AddNewWorkLog.index.searchDepartment'),
        entityType: EntityType.DEPARTMENT,
        setter: this.setDepartment,
        service: CompanyService.getDepartments.bind(null, this.props.company.selectedCompany.Key),
        filter: (department, serachText) => this.filterDepartment(department, serachText),
        selectedItem: {
          ID: this.state.timeLog.department.departmentNumber,
          Display: this.state.timeLog.department.name,
        },
        clearSelectedItem: this.clearDepartment,
      }
    });
  }

  clearDepartment() {
    const timeLog = { ...this.state.timeLog };
    timeLog.department.name = null;
    timeLog.department.departmentNumber = null;
    timeLog.department.id = null;
    this.setState({ timeLog, isContentEdited: true });
  }

  filterDepartment(department, serachText) {
    if (department.DepartmentNumber.toString().indexOf(serachText) !== -1
      || (department.Name && department.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return department;
    } else {
      return null;
    }
  }

  setDepartment(department) {
    const timeLog = { ...this.state.timeLog };
    timeLog.department.name = department.Name;
    timeLog.department.departmentNumber = department.DepartmentNumber;
    timeLog.department.id = department.ID;
    this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
    this.setState({ timeLog, isContentEdited: true, isFormUpdated: true });

  }

  onWorkTypeSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewWorkLog.index.selectWorkType'),
        searchCriteria: i18n.t('AddNewWorkLog.index.workType'),
        entityType: EntityType.WORK_TYPE,
        showInstantResults: true,
        setter: this.setWorkType,
        service: WorkerService.getWorkTypes.bind(null, this.props.company.selectedCompany.Key),
        filter: (workType, serachText) => this.filterWorkType(workType, serachText),
        // selectedItem: {  this will be commented out since we do not let user to clear his selection for a required field
        //   ID: this.state.timeLog.workType.id,
        //   Display: this.state.timeLog.workType.name,
        // },
        // clearSelectedItem: this.clearWorkType,
      }
    });
  }

  clearWorkType() {
    const timeLog = { ...this.state.timeLog };
    timeLog.workType.name = null;
    timeLog.workType.id = null;
    this.setState({ timeLog, isContentEdited: true });
  }

  filterWorkType(workType, serachText) {
    if (workType.ID.toString().indexOf(serachText) !== -1
      || workType.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1) {
      return workType;
    } else {
      return null;
    }
  }

  setWorkType(workType) {
    const timeLog = { ...this.state.timeLog };
    timeLog.workType.name = workType.Name;
    timeLog.workType.id = workType.ID;
    this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
    this.setState({ timeLog, isContentEdited: true, isFormUpdated: true, errors: { ...this.state.errors, workType: null } });

  }

  onOrderSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('AddNewWorkLog.index.selectOrder'),
        searchCriteria: i18n.t('AddNewWorkLog.index.order'),
        entityType: EntityType.CUSTOMER_ORDER,
        setter: this.setOrder,
        service: WorkerService.getOrders.bind(null, this.props.company.selectedCompany.Key),
        filter: (order, serachText) => this.filterOrder(order, serachText),
        selectedItem: {
          ID: this.state.timeLog.order.number,
          Display: this.state.timeLog.order.company,
        },
        clearSelectedItem: this.clearOrder,
      }
    });
  }

  clearOrder() {
    const timeLog = { ...this.state.timeLog };
    timeLog.order.id = null;
    timeLog.order.number = null;
    timeLog.order.company = null;
    this.setState({ timeLog, isContentEdited: true });
  }

  filterOrder(order, serachText) {
    if ((order.OrderNumber && order.OrderNumber.toString().indexOf(serachText) !== -1)
      || (order.CustomerName && order.CustomerName.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return order;
    } else {
      return null;
    }
  }

  setOrder(order) {
    const timeLog = { ...this.state.timeLog };
    timeLog.order.id = order.ID;
    timeLog.order.number = order.OrderNumber;
    timeLog.order.company = order.CustomerName;
    this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
    this.setState({ timeLog, isContentEdited: true, isFormUpdated: true });

  }

  setDescription(description) {
    const timeLog = { ...this.state.timeLog };
    timeLog.description = description;
    this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
    this.setState({ timeLog, isContentEdited: true, isFormUpdated: true });

  }

  setLunchMins(lunchMins) {
    const timeLog = { ...this.state.timeLog };
    this._validateAndSetTime(timeLog.startTime, timeLog.endTime, lunchMins);
  }

  roundLunchMins() {
    const timeLog = { ...this.state.timeLog };
    let lunchInMinutes = Number(timeLog.lunchInMinutes);
    const remainder = lunchInMinutes % 5;
    if (remainder !== 0) {
      if (remainder >= 2.5) {
        lunchInMinutes += (5 - remainder);
        this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
        this.setState({ isFormUpdated: true });
      } else {
        lunchInMinutes -= remainder;
      }
    }
    this._validateAndSetTime(timeLog.startTime, timeLog.endTime, lunchInMinutes);
  }

  scrollToBottom() {
    setTimeout(() => this.scrollview.scrollToEnd({ animated: true }), 200);
  }

  handleChangeSelectedDate(selectedDate) {
    this.getLatestEndTime(this.props.company.selectedCompany.Key, this.props.navigation.state.params.workerRelationID, selectedDate);
    this.showDraftAlert(selectedDate);
  }

  render() {
    return (
      <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this.scrollview = ref} style={{ flex: 1 }} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>

          <CalendarStrip
            ref={ref => this.calendar = ref}
            disabled={(this.state.isEditMode || this.state.isViewOnlyMode)}
            daysInRow={7}
            showWeekNumber={true}
            parentProps={this.props} // accessing token and company key from parent props
            dateSelectedCallback={this.handleChangeSelectedDate}
          />

          <View style={styles.miniSpacer} />

          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.workType')}
            placeHolder={i18n.t('AddNewWorkLog.index.timeCode')}
            isKeyboardInput={false}
            onPress={this.onWorkTypeSelect}
            error={this.state.errors.workType}
            value={this.state.timeLog.workType.id ? `${this.state.timeLog.workType.name} (${this.state.timeLog.workType.id})` : null}
            editable={!this.state.isViewOnlyMode}
          />

          <View style={styles.miniSpacer} />

          <TimeDurationPicker
            disabled={this.state.isViewOnlyMode}
            startTime={this.state.timeLog.startTime}
            endTime={this.state.timeLog.endTime}
            lunchInMinutes={this.state.timeLog.lunchInMinutes}
            durationSelectedCallback={(timeType, timestamp) => {
              Analytics.trackEvent(AnalyticalEventNames.TIME_DURATION_CHANGE, {
                From: 'Duration picker',
              });
              this._handleTimePicked(timeType, timestamp);
            }}
          />

          <TimePicker
            fromDate={this.state.timeLog.startTime}
            toDate={this.state.timeLog.endTime}
            fromTimeDisabled={false}
            toTimeDisabled={false}
            disabled={this.state.isViewOnlyMode}
            timeSelectedCallback={(timeType, timestamp) => {
              Analytics.trackEvent(AnalyticalEventNames.TIME_DURATION_CHANGE, {
                From: timeType,
              });
              this._handleTimePicked(timeType, timestamp);
            }}
            multipleTimeChangesHandler={(timeData) => {
              this._handleMultipleTimeChanges(timeData);
              this.props.setDraftWorkLog({ timeLog: this.state.isNewlogAdded ? null : { ...this.state.timeLog, drafDate: this.state.selectedDate.day.format('YYYY-MM-DD') } });
              this.setState({ isFormUpdated: true });
            }}
          />

          <View style={styles.spacer} />

          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.lunch')}
            placeHolder={i18n.t('AddNewWorkLog.index.optional')}
            onChangeText={this.setLunchMins}
            onBlur={this.roundLunchMins}
            isKeyboardInput={true}
            keyboardType={'numeric'}
            onFocus={this.scrollToBottom}
            value={this.state.timeLog.lunchInMinutes ? this.state.timeLog.lunchInMinutes.toString() : null}
            editable={!this.state.isViewOnlyMode}
          />
          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.description')}
            placeHolder={i18n.t('AddNewWorkLog.index.optional')}
            isKeyboardInput={true}
            editable={this.state.isPartNameEditable}
            onChangeText={this.setDescription}
            value={this.state.timeLog.description}
            onFocus={this.scrollToBottom}
            editable={!this.state.isViewOnlyMode}
          />
          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.project')}
            placeHolder={i18n.t('AddNewWorkLog.index.projectNameNum')}
            isKeyboardInput={false}
            onPress={this.onProjectSelect}
            value={this.state.timeLog.project.name}
            editable={!this.state.isViewOnlyMode}
          />
          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.department')}
            placeHolder={i18n.t('AddNewWorkLog.index.departmentNameNum')}
            isKeyboardInput={false}
            onPress={this.onDepartmentSelect}
            value={this.state.timeLog.department.name}
            editable={!this.state.isViewOnlyMode}
          />
          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.orderNo')}
            placeHolder={i18n.t('AddNewWorkLog.index.optional')}
            isKeyboardInput={false}
            onPress={this.onOrderSelect}
            value={this.state.timeLog.order.id ? `#${this.state.timeLog.order.number} - ${this.state.timeLog.order.company}` : null}
            editable={!this.state.isViewOnlyMode}
          />
          <InlineValidationInputField
            title={i18n.t('AddNewWorkLog.index.customer')}
            placeHolder={i18n.t('AddNewWorkLog.index.optional')}
            isKeyboardInput={false}
            onPress={this.onCustomerSelect}
            value={this.state.timeLog.customer.id ? this.state.timeLog.customer.name : ''}
            editable={!this.state.isViewOnlyMode}
          />

          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          <View style={styles.spacer} />
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
    recentData: state.recentData,
    draftWorkLog: state.draftWorkLog.draftWorkLog,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setDraftWorkLog: data => dispatch(setDraftWorkLog(data)),
    updateCompaniesRecentData: data => dispatch(updateCompaniesRecentData(data)),
    validateRecentData: (recentData, companyKey) => dispatch(validateRecentData(recentData, companyKey))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AddNewWorkLog);

const styles = StyleSheet.create({
  timeDurationLabel: {
    color: theme.PRIMARY_COLOR,
    fontWeight: '600',
    fontSize: 18,
    paddingLeft: 5,
    paddingRight: 5,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  infoRow: {
    height: 50,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: {
    paddingRight: 15,
    paddingLeft: 15,
  },
  infoRowTitleContainer: {
    width: 90,
  },
  infoRowTitle: {
    color: theme.PRIMARY_TEXT_COLOR,
    width: 90,
    fontWeight: '500',
  },
  infoRowText: {
    color: theme.SECONDARY_TEXT_COLOR,
    flex: 1,
  },
  infoRowControlContainer: {
    flex: 1,
  },
  infoRowTextInput: {
    flex: 1,
    borderColor: '#fff',
    borderWidth: 0,
    fontSize: 14,
    marginLeft: -2,
  },
  infoRowTextActive: {
    color: theme.PRIMARY_TEXT_COLOR,
    flex: 1,
  },
  spacer: {
    height: 30,
  },
  miniSpacer: {
    height: 20,
  },
  iphoneXSpace: {
    height: 50,
  }
});
