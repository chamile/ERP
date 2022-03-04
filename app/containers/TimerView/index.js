// @flow
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  BackHandler,
} from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';
import DateTimePicker from 'react-native-modal-datetime-picker';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import _ from 'lodash';

import ViewWrapper from '../../components/ViewWrapper';
import SqureLineButton from '../../components/SqureLineButton';
import Stopwatch from '../../components/Stopwatch';
import { EntityType } from '../../constants/EntityTypes';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { HeaderBackButton } from '../../components/HeaderBackButton';
import { theme } from '../../styles';
import { changeTimerInfo } from '../../actions/timerActions';
import WorkerService from '../../services/WorkerService';
import CompanyService from '../../services/CompanyService';
import InlineValidationInputField from '../../components/InputFieldWithValidation';
import { validateRecentData, updateCompaniesRecentData } from '../../actions/recentDataActions';
import { getHeaderStyle, isIphoneX } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';

class TimerView extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t(`TimerView.index.title`),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerLeft: <HeaderBackButton title={i18n.t(`TimerView.index.hours`)} onPress={navigation.state.params.handleLeftButton} />,
      headerRight: <HeaderTextButton isActionComplete={navigation.state.params.isActionComplete} position={'right'} text={i18n.t(`TimerView.index.minimize`)} onPress={navigation.state.params.handleRightButton} />,
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      isDateTimePickerVisible: false,
      errors: {
        workType: null
      }
    };
    this._didFocusSubscription = props.navigation.addListener('didFocus', payload => BackHandler.addEventListener('hardwareBackPress', this.onBackButtonPressAndroid));
    this.isActionComplete = false;
    this.changeStartTime = this.changeStartTime.bind(this);
    this._handleDatePicked = this._handleDatePicked.bind(this);
    this._hideDateTimePicker = this._hideDateTimePicker.bind(this);
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
    this.handleRightButton = this.handleRightButton.bind(this);
    this.handleLeftButton = this.handleLeftButton.bind(this);
    this.addTimeLog = this.addTimeLog.bind(this);
    this.clearOrder = this.clearOrder.bind(this);
    this.clearDepartment = this.clearDepartment.bind(this);
    this.clearProject = this.clearProject.bind(this);
  }

  componentWillMount() {
    if (!this.props.timer.companies[this.props.company.selectedCompany.Key].isActive && !this.props.navigation.state.params.isStartFromData) {
      this.props.validateRecentData(this.props.recentData, this.props.company.selectedCompany.Key);
    }
  }

  componentWillReceiveProps(nextProps) {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    const recentCompanyData = this.props.recentData.companies[companyKey];
    const newCompanyData = nextProps.recentData.companies[companyKey];

    if (recentCompanyData && newCompanyData) {
      if (!_.isEqual(recentCompanyData.project, newCompanyData.project) && companies[companyKey].timeLog.project.id === recentCompanyData.project.id) {
        const project = { id: newCompanyData.project.id, name: newCompanyData.project.name };
        companies[companyKey].timeLog.project = { ...project };
        this.props.changeTimerInfo(companies);
      }
      if (!_.isEqual(recentCompanyData.department, newCompanyData.department) && companies[companyKey].timeLog.department.id === recentCompanyData.department.id) {
        const department = { id: newCompanyData.department.id, name: newCompanyData.department.name };
        companies[companyKey].timeLog.department = { ...department };
        this.props.changeTimerInfo(companies);
      }
      if (!_.isEqual(recentCompanyData.workType, newCompanyData.workType) && companies[companyKey].timeLog.workType.id === recentCompanyData.workType.id) {
        const workType = { id: newCompanyData.workType.id, name: newCompanyData.workType.name };
        companies[companyKey].timeLog.workType = { ...workType };
        this.props.changeTimerInfo(companies);
      }
      if (!_.isEqual(recentCompanyData.order, newCompanyData.order) && companies[companyKey].timeLog.order.id === recentCompanyData.order.id) {
        const order = { id: newCompanyData.order.id, number: newCompanyData.order.number, company: newCompanyData.order.company };
        companies[companyKey].timeLog.order = { ...order };
        this.props.changeTimerInfo(companies);
      }
    }
  }

  componentDidMount() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    this.props.navigation.setParams({ handleRightButton: this.handleRightButton, handleLeftButton: this.handleLeftButton });
    if (!companies[companyKey].isActive && !this.props.navigation.state.params.isStartFromData) { // no active timer | not passed data
      const timelog = this._getTimeLogFromRecentData(this.props.recentData.companies[companyKey]);
      companies[companyKey].timeLog = { ...timelog };
      companies[companyKey].isActive = true;
      this.props.changeTimerInfo(companies);
    } else if (!companies[companyKey].isActive && this.props.navigation.state.params.isStartFromData) { // no active timer | passed data
      const _data = this.props.navigation.state.params.data;
      const timelog = this._getTimeLogFromData(_data);
      companies[companyKey].timeLog = { ...timelog };
      companies[companyKey].isActive = true;
      this.props.changeTimerInfo(companies);
    }

    this._willBlurSubscription = this.props.navigation.addListener('willBlur', payload => BackHandler.removeEventListener('hardwareBackPress', this.onBackButtonPressAndroid));
  }

  componentWillUnmount() {
    this._didFocusSubscription && this._didFocusSubscription.remove();
    this._willBlurSubscription && this._willBlurSubscription.remove();
  }

  onBackButtonPressAndroid = () => {
    this.handleLeftButton();
    return true;
  };

  _getTimeLogFromRecentData(recentData) {
    const timeLog = {};
    timeLog.startTime = new Date();
    timeLog.endTime = null;

    timeLog.project = {
      name: recentData.project ? recentData.project.name : null,
      id: recentData.project ? recentData.project.id : null
    };

    timeLog.department = {
      name: recentData.department ? recentData.department.name : null,
      id: recentData.department ? recentData.department.id : null
    };

    timeLog.workType = {
      name: recentData.workType ? recentData.workType.name : null,
      id: recentData.workType ? recentData.workType.id : null
    };

    timeLog.order = {
      id: recentData.order ? recentData.order.id : null,
      number: recentData.order ? recentData.order.number : null,
      company: recentData.order ? recentData.order.company : null
    };

    timeLog.description = recentData.description ? recentData.description : null;
    timeLog.lunchInMinutes = recentData.lunchInMinutes ? recentData.lunchInMinutes : null;
    return timeLog;
  }

  _getTimeLogFromData(data) {
    const timeLog = {};
    timeLog.startTime = new Date();
    timeLog.endTime = null;

    timeLog.project = {
      name: data.Dimensions && data.Dimensions.Project ? data.Dimensions.Project.Name : null,
      id: data.Dimensions && data.Dimensions.Project ? data.Dimensions.Project.ID : null
    };

    timeLog.department = {
      name: data.Dimensions && data.Dimensions.Department ? data.Dimensions.Department.Name : null,
      id: data.Dimensions && data.Dimensions.Department ? data.Dimensions.Department.ID : null
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

    timeLog.description = data.Description ? data.Description : null;
    timeLog.lunchInMinutes = data.LunchInMinutes ? data.LunchInMinutes : null;
    return timeLog;
  }

  addTimeLog() {
    if (!this.props.timer.companies[this.props.company.selectedCompany.Key].timeLog.workType.id) {
      Alert.alert(i18n.t('TimerView.index.alertHeader'),i18n.t('TimerView.index.addWorkType'));
      this.setState({ errors: { ...this.state.errors, workType: i18n.t(`AddNewWorkLog.index.enterWorkType`) } });
      return;
    }

    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[this.props.company.selectedCompany.Key].timeLog.endTime = new Date();
    this.updateRecentData();
    this.props.navigation.goBack();
    this.props.navigation.state.params.addNewWorkLog(companies[companyKey].timeLog);
  }

  handleRightButton() {
    Keyboard.dismiss();
    if (!this.props.timer.companies[this.props.company.selectedCompany.Key].timeLog.workType.id) {
      Alert.alert(i18n.t('TimerView.index.alertHeader'),i18n.t('TimerView.index.addWorkType'));
      this.setState({ errors: { ...this.state.errors, workType: i18n.t(`AddNewWorkLog.index.enterWorkType`) } });
      return;
    }
    this.isActionComplete = true;
    this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
    this.props.navigation.goBack();
    this.props.navigation.state.params.updateWorkLogTimeStamp();
  }

  updateRecentData() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.recentData;
    let timer = this.props.timer.companies[companyKey];
    companies[companyKey] = {
      project: {
        name: timer.timeLog.project.name,
        id: timer.timeLog.project.id
      },
      department: {
        name: timer.timeLog.department.name,
        id: timer.timeLog.department.id
      },
      workType: {
        name: timer.timeLog.workType.name,
        id: timer.timeLog.workType.id
      },
      order: {
        id: timer.timeLog.order.id,
        number: timer.timeLog.order.number,
        company: timer.timeLog.order.company
      },
      lastLoggedEndTime: timer.timeLog.endTime
    };
    this.props.updateCompaniesRecentData(companies);
  }

  handleLeftButton() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    const temp  = {
      isActive: false,
      timeLog: {
        startTime: null,
        endTime: null,
        project: {
          name: null,
          id: null
        },
        department: {
          name: null,
          id: null
        },
        workType: {
          name: null,
          id: null
        },
        order: {
          id: null,
          number: null,
          company: null
        },
        description: null,
        lunchInMinutes: 0
      }
    };
    Alert.alert(
      i18n.t('TimerView.index.discardTimer'),
      i18n.t('TimerView.index.goingBack'),
      [
        { text: i18n.t('TimerView.index.yesDiscard'), onPress: () => { companies[companyKey] = temp; this.props.changeTimerInfo(companies); this.props.navigation.goBack(); this.props.navigation.state.params.updateWorkLogTimeStamp(); } },
        { text: i18n.t('TimerView.index.cancel'), onPress: () => null },
      ],
      { cancelable: false }
    );
  }

  changeStartTime() {
    this.setState({
      isDateTimePickerVisible: true
    });
  }

  _handleDatePicked(time) {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    
    if (moment().isAfter(moment(time))) {
      companies[companyKey].timeLog.startTime = time;
      this.props.changeTimerInfo(companies);
    }
    this._hideDateTimePicker();
  }

  _hideDateTimePicker() {
    this.setState({
      isDateTimePickerVisible: false
    });
  }

  onProjectSelect() {
    Keyboard.dismiss();
    const companyKey = this.props.company.selectedCompany.Key;
    const { companies } = this.props.timer;
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('TimerView.index.selectProject'),
        searchCriteria: i18n.t('TimerView.index.project'),
        entityType: EntityType.PROJECT,
        showInstantResults: true,
        setter: this.setProject,
        service: WorkerService.getWorkingProjects.bind(null, this.props.company.selectedCompany.Key),
        filter: (project, serachText) => this.filterProject(project, serachText),
        selectedItem: {
          ID: companies[companyKey].timeLog.project.projectNumber,
          Display: companies[companyKey].timeLog.project.name,
        },
        clearSelectedItem: this.clearProject,
      }
    });
  }

  clearProject() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.project.name = null;
    companies[companyKey].timeLog.project.id = null;
    companies[companyKey].timeLog.project.projectNumber = null;
    this.props.changeTimerInfo(companies);
  }

  filterProject(project, serachText) {
    if (project.ProjectNumber.toString().indexOf(serachText) !== -1
      || (project.Name && project.Name.toLowerCase().indexOf(serachText.toLowerCase()) !== -1)) {
      return project;
    } else {
      return null;
    }
  }

  setProject(project) {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.project.name = project.Name;
    companies[companyKey].timeLog.project.id = project.ID;
    companies[companyKey].timeLog.project.projectNumber = project.ProjectNumber;
    this.props.changeTimerInfo(companies);
  }

  onDepartmentSelect() {
    Keyboard.dismiss();
    const companyKey = this.props.company.selectedCompany.Key;
    const { companies } = this.props.timer;
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t(`TimerView.index.selectDepartment`),
        searchCriteria: i18n.t(`TimerView.index.searchDepartment`),
        entityType: EntityType.DEPARTMENT,
        setter: this.setDepartment,
        service: CompanyService.getDepartments.bind(null, this.props.company.selectedCompany.Key),
        filter: (department, serachText) => this.filterDepartment(department, serachText),
        selectedItem: {
          ID: companies[companyKey].timeLog.department.departmentNumber,
          Display: companies[companyKey].timeLog.department.name ,
        },
        clearSelectedItem: this.clearDepartment,
      }
    });
  }

  clearDepartment() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.department.name = null;
    companies[companyKey].timeLog.department.id = null;
    companies[companyKey].timeLog.department.departmentNumber = null;
    this.props.changeTimerInfo(companies);
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
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.department.name = department.Name;
    companies[companyKey].timeLog.department.id = department.ID;
    companies[companyKey].timeLog.department.departmentNumber = department.DepartmentNumber;
    this.props.changeTimerInfo(companies);
  }

  onWorkTypeSelect() {
    Keyboard.dismiss();
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('TimerView.index.selectWorkType'),
        searchCriteria: i18n.t('TimerView.index.workType'),
        entityType: EntityType.WORK_TYPE,
        showInstantResults: true,
        setter: this.setWorkType,
        service: WorkerService.getWorkTypes.bind(null, this.props.company.selectedCompany.Key),
        filter: (workType, serachText) => this.filterWorkType(workType, serachText)
      }
    });
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
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.workType.name = workType.Name;
    companies[companyKey].timeLog.workType.id = workType.ID;
    this.setState({ errors: { ...this.state.errors, workType: null } });
    this.props.changeTimerInfo(companies);
  }

  onOrderSelect() {
    Keyboard.dismiss();
    const companyKey = this.props.company.selectedCompany.Key;
    const { companies } = this.props.timer;
    this.props.navigation.navigate('LookupView', {
      data: {
        title: i18n.t('TimerView.index.selectOrder'),
        searchCriteria: i18n.t('TimerView.index.order'),
        entityType: EntityType.CUSTOMER_ORDER,
        setter: this.setOrder,
        service: WorkerService.getOrders.bind(null, this.props.company.selectedCompany.Key),
        filter: (order, serachText) => this.filterOrder(order, serachText),
        selectedItem: {
          ID: companies[companyKey].timeLog.order.number,
          Display: companies[companyKey].timeLog.order.company,
        },
        clearSelectedItem: this.clearOrder,
      }
    });
  }

  clearOrder() {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.order.id = null;
    companies[companyKey].timeLog.order.number = null;
    companies[companyKey].timeLog.order.company = null;
    this.props.changeTimerInfo(companies);
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
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.order.id = order.ID;
    companies[companyKey].timeLog.order.number = order.OrderNumber;
    companies[companyKey].timeLog.order.company = order.CustomerName;
    this.props.changeTimerInfo(companies);
  }

  setDescription(description) {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.description = description;
    this.props.changeTimerInfo(companies);
  }

  setLunchMins(lunchMins) {
    const companyKey = this.props.company.selectedCompany.Key;
    let { companies } = this.props.timer;
    companies[companyKey].timeLog.lunchInMinutes = Number(lunchMins);
    this.props.changeTimerInfo(companies);
  }

  render() {
    let timer = this.props.timer.companies[this.props.company.selectedCompany.Key];
    return (
      <ViewWrapper withFade={true} withMove={true} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav'}>
        <ScrollView keyboardDismissMode={'interactive'} ref={ref => this.scrollview = ref} style={{ flex: 1 }} key={'scrollView'} horizontal={false} keyboardShouldPersistTaps={Platform.OS === 'android' ? 'handled' : 'never'}>
          <View style={styles.spacer} />
          <Stopwatch startTime={timer.timeLog.startTime} />

          <View style={styles.changeTimerContainer}>
            <TouchableOpacity onPress={this.changeStartTime} style={styles.changeTimerButton}>
              <Text style={styles.changeButtonText}>{i18n.t('TimerView.index.timerStarted')}</Text>
              <Text style={styles.changeButtonText}>{moment(timer.timeLog.startTime).format('HH:mm')}</Text>
            </TouchableOpacity>
          </View>

          <SqureLineButton onPress={this.addTimeLog} text={i18n.t('TimerView.index.addHours')} width={230} />

          <View style={styles.spacer} />

          <InlineValidationInputField
            title={i18n.t('TimerView.index.workType')}
            placeHolder={i18n.t('TimerView.index.timeCode')}
            isKeyboardInput={false}
            error={this.state.errors.workType}
            onPress={this.onWorkTypeSelect}
            value={timer.timeLog.workType.id ? `${timer.timeLog.workType.name} (${timer.timeLog.workType.id})` : null}
          />
          <InlineValidationInputField
            title={i18n.t('TimerView.index.lunch')}
            placeHolder={i18n.t('TimerView.index.optional')}
            onChangeText={this.setLunchMins}
            isKeyboardInput={true}
            keyboardType={'numeric'}
            onFocus={this.scrollToBottom}
            value={timer.timeLog.lunchInMinutes ? timer.timeLog.lunchInMinutes.toString() : null}
          />
          <InlineValidationInputField
            title={i18n.t('TimerView.index.description')}
            placeHolder={i18n.t('TimerView.index.optional')}
            isKeyboardInput={true}
            editable={timer.isPartNameEditable}
            onChangeText={this.setDescription}
            value={timer.timeLog.description}
            onFocus={this.scrollToBottom}
          />
          <InlineValidationInputField
            title={i18n.t('TimerView.index.project')}
            placeHolder={i18n.t('TimerView.index.projectNameNum')}
            isKeyboardInput={false}
            onPress={this.onProjectSelect}
            value={timer.timeLog.project.name}
          />
          <InlineValidationInputField
            title={i18n.t('TimerView.index.department')}
            placeHolder={i18n.t('TimerView.index.departmentNameNum')}
            isKeyboardInput={false}
            onPress={this.onDepartmentSelect}
            value={timer.timeLog.department.name}
          />
          <InlineValidationInputField
            title={i18n.t('TimerView.index.orderNo')}
            placeHolder={i18n.t('TimerView.index.optional')}
            isKeyboardInput={false}
            onPress={this.onOrderSelect}
            value={timer.timeLog.order.id ? `#${timer.timeLog.order.number} - ${timer.timeLog.order.company}` : null}
          />

          {Platform.OS === 'ios' ? <KeyboardSpacer /> : null}
          <View style={styles.spacer} />
          {isIphoneX() ? <View style={styles.iphoneXSpace} /> : null}
        </ScrollView>

        <DateTimePicker
          mode={'time'}
          is24Hour={true}
          date={new Date(timer.timeLog.startTime)}
          titleIOS={i18n.t('TimeSelector.pickTime')}
          isVisible={this.state.isDateTimePickerVisible}
          onConfirm={this._handleDatePicked}
          onCancel={this._hideDateTimePicker}
        />

      </ViewWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company,
    timer: state.timer,
    recentData: state.recentData
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeTimerInfo: (timeLog) => dispatch(changeTimerInfo(timeLog)),
    updateCompaniesRecentData: data => dispatch(updateCompaniesRecentData(data)),
    validateRecentData: (recentData, companyKey) => dispatch(validateRecentData(recentData, companyKey))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TimerView);

const styles = StyleSheet.create({
  changeTimerContainer: {
    alignSelf: 'center',
    width: 225,
    flexDirection: 'row',
    marginBottom: 20,
  },
  changeTimerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerInfoContainer: {
    flex: 1,
    padding: 15,
    marginTop: 20,
  },
  changeButtonText: {
    fontWeight: '500',
  },
  presetBox: {
    height: 80,
    backgroundColor: '#f8f8f8',
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
  fieldsContainer: {
    paddingRight: 15,
    paddingLeft: 15,
    marginTop: 30,
  },
  iphoneXSpace: {
    height: 50,
  },
  headerStyle: {
    flex: 1,
    textAlign: 'center',
  },
});
