import React, { Component } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  RefreshControl,
  Animated,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { connect } from 'react-redux';
import Touchable from '@expo/react-native-touchable-native-feedback-safe';
import ViewWrapperAsync from '../../components/ViewWrapperAsync';
import { theme } from '../../styles';
import ApiErrorHandler from '../../helpers/ApiErrorHandler';
import InvoiceService from '../../services/InvoiceService';
import AlertService from '../../services/AlertService';
import SegmentControl from '../../components/SegmentControl';
import { HeaderTextButton } from '../../components/HeaderTextButton';
import { ListPaddingComponent } from '../../components/ListPaddingComponent';
import { getHeaderStyle } from '../../helpers/UIHelper';
import i18n from '../../i18n/i18nConfig';
import { HeaderBackButton } from '../../components/HeaderBackButton';

const WIDTH: number = Dimensions.get('window').width;
const HEIGHT: number = Dimensions.get('window').height;

class SelectAssigneeView extends Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: i18n.t('SelectAssignee.index.title'),
      headerTintColor: theme.TEXT_COLOR_INVERT,
      headerStyle: { ...getHeaderStyle(), backgroundColor: theme.SECONDARY_COLOR, borderBottomWidth: 0 },
      headerRight: <HeaderTextButton isActionComplete={navigation.state.params.isActionComplete} navigate={navigation.navigate} onPress={() => navigation.state.params.setAssignee(navigation.state.params.setAssignee)} text={i18n.t('SelectAssignee.index.assign')} position="right" />,
      headerLeft: <HeaderBackButton onPress={() => navigation.goBack()} title={i18n.t('App.back')} />,
      headerTitleStyle: Platform.OS === 'android' ? styles.headerStyle : {},
    };
  };

  constructor() {
    super();
    this.state = {
      isLoading: true,
      isLoadingUsers: true,
      isLoadingTeams: true,
      isRefreshing: false,
      availableUsers: [],
      availableTeams: [],
      dataSet: [],
      assigneeDetails: {
        users: [],
        teams: []
      },
      error: false,
      selectedIndex: 0,
      searchCriteria: 'Team',
      searchText: '',
      filter: team => team.Name,
      moveAnimation: new Animated.Value(0)
    };

    this.isActionComplete = false;

    this.setAssignee = this.setAssignee.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.searchList = this.searchList.bind(this);
    this.onRowSelected = this.onRowSelected.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.findMatchingItems = this.findMatchingItems.bind(this);
  }

  componentDidMount() {
    this.props.navigation.setParams({ setAssignee: this.setAssignee });
    this.fetchUsers(this.refreshData);
    this.fetchTeams(this.refreshData);
  }

  setAssignee(caller) {
    if (this.isValid()) {
      this.isActionComplete = true;
      this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
      InvoiceService.assignInvoiceTo(this.props.navigation.state.params.ID, this.state.assigneeDetails.users, this.state.assigneeDetails.teams, this.props.company.selectedCompany.Key)
        .then((res) => {
          if (res.ok) {
            this.props.navigation.state.params.refresh();
            this.props.navigation.goBack();
          }
          else {
            AlertService.showSimpleAlert(i18n.t('SelectAssignee.index.assignFailed'), i18n.t('SelectAssignee.index.requestFailed'));
            this.isActionComplete = false;
            this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
          }
        })
        .catch((error) => {
          this.handleCompanyFetchErrors(error.problem, caller, i18n.t('SelectAssignee.index.assignError'));
          this.isActionComplete = false;
          this.props.navigation.setParams({ isActionComplete: this.isActionComplete });
        });
    } else {
      AlertService.showSimpleAlert(i18n.t('SelectAssignee.index.warning'), i18n.t('SelectAssignee.index.selectUserOrTeam'), 'WARNING');
    }
  }

  fetchUsers(caller) {
    this.setState({ isLoadingUsers: true });
    InvoiceService.getAssigneeUserList(this.props.company.selectedCompany.Key)
      .then((res) => {
        this.setState({ isLoadingUsers: false, isRefreshing: false, availableUsers: [...res.data], isLoading: false });
        if (this.state.searchCriteria === 'User') {
          this.setState({ dataSet: [...res.data] });
        }
      })
      .catch((error) => {
        this.handleCompanyFetchErrors(error.problem, caller, i18n.t('SelectAssignee.index.fetchUsersError'));
      });
  }

  fetchTeams(caller) {
    this.setState({ isLoadingTeams: true });
    InvoiceService.getAssigneeTeamList(this.props.company.selectedCompany.Key)
      .then((res) => {
        if (res.ok) {
          this.setState({ isLoadingTeams: false, isRefreshing: false, availableTeams: [...res.data], isLoading: false });
          if (this.state.searchCriteria === 'Team') {
            this.setState({ dataSet: [...res.data] });
          }
        }
      })
      .catch((error) => {
        this.handleCompanyFetchErrors(error.problem, caller, i18n.t('SelectAssignee.index.fetchTeamsError'));
      });
  }

  handleCompanyFetchErrors(problem = 'CLIENT_ERROR', caller, userErrorMessage = i18n.t('SelectAssignee.index.error')) {
    this.setState({ isLoadingTeams: false, isLoadingUsers: false, isLoading: false });
    ApiErrorHandler.handleGenericErrors({ problem, caller, userErrorMessage });
  }

  isValid() {
    if (this.state.assigneeDetails.users.length > 0 || this.state.assigneeDetails.teams.length > 0) {
      this.setState({ error: false });
      return true;
    } else {
      this.setState({ error: true });
      return false;
    }
  }

  handleIndexChange(index) {
    if (index === 0) {
      this.setState({
        selectedIndex: index, searchCriteria: 'Team', dataSet: this.state.availableTeams, searchText: '', filter: team => team.Name, assigneeDetails: { ...this.state.assigneeDetails, teams: [] }
      });
    } else {
      this.setState({
        selectedIndex: index, searchCriteria: 'User', dataSet: this.state.availableUsers, searchText: '', filter: user => user.DisplayName, assigneeDetails: { ...this.state.assigneeDetails, users: [] }
      });
    }
  }

  searchList(text) {
    this.setState({ searchText: text });
    this.findMatchingItems(text);
  }

  onRowSelected(item) {
    this.updateAssigneeData(item);
  }

  getRelatedOriginalDataSet() {
    let dataSet;
    if (this.state.selectedIndex === 0) {
      dataSet = this.state.availableTeams;
    } else {
      dataSet = this.state.availableUsers;
    }
    return dataSet;
  }

  findMatchingItems(text) {
    const filter = this.state.filter;
    const originalDataSet = this.getRelatedOriginalDataSet();

    if (!text) {
      this.updateList(originalDataSet);
      return;
    }

    const _filtered = originalDataSet.filter((item) => {
      const itemProp = filter(item).replace(/\s+/g, '-').toLowerCase();
      const textToMatch = text.replace(/\s+/g, '-').toLowerCase();
      if (itemProp.indexOf(textToMatch) !== -1) {
        return itemProp;
      }
    });

    this.updateList(_filtered);
  }

  updateList(newDataSet) {
    this.setState({ dataSet: [...newDataSet] });
  }

  refreshData() {
    this.setState({ isRefreshing: true });
    this.state.selectedIndex === 0 ? this.fetchTeams(this.refreshData) : this.fetchUsers(this.refreshData);
  }

  updateAssigneeData(item) {
    if (this.state.selectedIndex === 0) {
      this.setState({ assigneeDetails: { ...this.state.assigneeDetails, teams: [item.ID] } });
    } else {
      this.setState({ assigneeDetails: { ...this.state.assigneeDetails, users: [item.ID] } });
    }
  }

  renderPlaceholder() {
    const text = this.state.selectedIndex === 0 ? i18n.t('SelectAssignee.index.noTeams') : i18n.t('SelectAssignee.index.noUsers');

    return (
      <View pointerEvents={'box-none'} style={styles.placeholderContainer}>
        <Image style={styles.placeholderIcon} source={require('../../images/InvoiceList/users.png')} />
        <Text style={styles.placeholderText}>{text}</Text>
      </View>
    );
  }

  renderRow({ index, item }) {
    if (this.state.selectedIndex === 0) {
      return (
        <Touchable onPress={() => this.onRowSelected(item)} style={this.state.assigneeDetails.teams.includes(item.ID) ? styles.listItemHilighted : styles.listItem}>
          <View style={styles.container}>
            <View style={styles.checkMarkContainer}>
              {this.state.assigneeDetails.teams.includes(item.ID) ? <Image resizeMode={'contain'} style={styles.checkImage} source={require('../../images/InvoiceList/checked.png')} /> : null}
            </View>
            <View style={styles.infoLeft}>
              <Text style={{ color: theme.PRIMARY_TEXT_COLOR }}>{this.state.filter(item)}</Text>
            </View>
          </View>
        </Touchable>
      );
    }
    if (this.state.selectedIndex === 1) {
      return (
        <Touchable onPress={() => this.onRowSelected(item)} style={this.state.assigneeDetails.users.includes(item.ID) ? styles.listItemHilighted : styles.listItem}>
          <View style={styles.container}>
            <View style={styles.checkMarkContainer}>
              {this.state.assigneeDetails.users.includes(item.ID) ? <Image resizeMode={'contain'} style={styles.checkImage} source={require('../../images/InvoiceList/checked.png')} /> : null}
            </View>
            <View style={styles.infoLeft}>
              <Text style={styles.singleListElementLeft}>{this.state.filter(item)}</Text>
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.singleListElementRight}>{item.Email}</Text>
            </View>
          </View>
        </Touchable>
      );
    }
  }

  render() {
    return (
      <ViewWrapperAsync withFade={true} withMove={true} isReady={!this.state.isLoading} statusBarColor={theme.SECONDARY_STATUS_BAR_COLOR} loaderPosition={'nav_tabs'}>
        <View style={styles.SegmentControlContainer}>
          <SegmentControl
            values={[i18n.t('SelectAssignee.index.teams'), i18n.t('SelectAssignee.index.users')]}
            selectedIndex={this.state.selectedIndex}
            onTabPress={index => this.handleIndexChange(index)}
            badges={[this.state.availableTeams.length, this.state.availableUsers.length]}
            borderRadius={5}
          />
        </View>

        <View style={styles.searchBoxContainer}>
          <View style={styles.searchImageContainer}>
            <Image resizeMode={'contain'} style={styles.searchImage} source={require('../../images/InvoiceList/search.png')} />
          </View>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={`${this.state.searchCriteria === 'Team' ? i18n.t('SelectAssignee.index.searchTeam') : this.state.searchCriteria === 'User' ? i18n.t('SelectAssignee.index.searchUser') : null}`}
              underlineColorAndroid={'rgba(0,0,0,0)'}
              onChangeText={text => this.searchList(text)}
              value={this.state.searchText}
            />
          </View>
        </View>
        <FlatList
          keyExtractor={(item, index) => item.ID}
          data={this.state.dataSet}
          renderItem={this.renderRow}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isRefreshing}
              onRefresh={this.refreshData}
              tintColor={theme.PRIMARY_COLOR}
            />
          }
          ListHeaderComponent={() => <ListPaddingComponent height={0} />}
          ListFooterComponent={() => <ListPaddingComponent height={10} />}
        />
        {!this.state.isLoadingUsers && !this.state.isLoadingTeams && !this.state.isRefreshing && this.state.searchText === '' && this.state.dataSet.length === 0 ? this.renderPlaceholder() : null}
      </ViewWrapperAsync>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    user: state.user,
    company: state.company
  };
};

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectAssigneeView);

const styles = StyleSheet.create({
  SegmentControlContainer: {
    marginTop: 30,
    marginLeft: 15,
    marginRight: 15
  },
  container: {
    flexDirection: 'row',
    paddingTop: 15,
    paddingBottom: 15,
    marginLeft: 10,
    marginRight: 20,
  },
  listItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)'
  },
  listItemHilighted: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
    backgroundColor: '#BADCF5'
  },
  infoLeft: {
    flex: 1,
    justifyContent: 'space-around'
  },
  infoRight: {
    padding: 5
  },
  textInputContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  textInput: {
    height: 40,
    borderColor: '#fff',
    borderWidth: 0,
    marginTop: 3,
    fontSize: 14,
    justifyContent: 'space-around'
  },
  searchEntity: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.PRIMARY_TEXT_COLOR
  },
  searchImageContainer: {
    justifyContent: 'center',
    paddingLeft: 15,
    marginTop: 5,
    padding: 10
  },
  searchImage: {
    width: 20,
    height: 20
  },
  checkImage: {
    width: 15,
    height: 15,
    marginTop: 3
  },
  searchBoxContainer: {
    height: 60,
    backgroundColor: 'rgba(200,200,200,0.1)',
    flexDirection: 'row'
  },
  singleListElementLeft: {
    color: theme.PRIMARY_TEXT_COLOR
  },
  singleListElementRight: {
    color: theme.SECONDARY_TEXT_COLOR,
    fontSize: 12
  },
  checkMarkContainer: {
    width: 20,
    paddingRight: 25,
    justifyContent: 'center',
  },
  tabBarIcon: {
    width: 28,
    height: 28
  },
  placeholderContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    marginTop: -80,
    justifyContent: 'center',
    alignItems: 'center'
  },
  placeholderIcon: {
    height: 80,
    width: 80,
    opacity: 0.6
  },
  placeholderText: {
    marginTop: 20,
    color: theme.SECONDARY_TEXT_COLOR,
    textAlign: 'center',
    lineHeight: 23
  }
});
