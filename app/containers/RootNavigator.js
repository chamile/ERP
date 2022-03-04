// @flow
import React from 'react';
import { Platform, Dimensions } from 'react-native';
import { createStackNavigator, createBottomTabNavigator, createDrawerNavigator } from 'react-navigation';
import i18n from '../i18n/i18nConfig';
import TabIcons from '../components/TabIcons';
import { isIphone5 } from '../helpers/UIHelper';
import { theme } from '../styles';

// root routes
import Init from './Init';
import Login from './Login';
import Logout from './Logout';
import OnBoard from './OnBoard';
import CompanySelect from './CompanySelect';
import CameraView from '../components/CameraView';
import LookupView from '../components/LookupView';
import LookupVatView from '../components/LookupVatView';
import CompanySwitch from './CompanySwitch';

import CustomDrawer from './CustomDrawer';

// tab routes
import InvoiceList from './InvoiceList';
import InvoiceDetails from './InvoiceDetails';
import HoursList from './HoursList';
import Feedback from './Feedback';
import About from './About';
import Website from '../components/Website';
import NotificationsList from './NotificationsList';
import ApprovalsList from './ApprovalsList';
import ApprovalItemDetails from './ApprovalItemDetails';
import AddNewInvoice from './AddNewInvoice';
import CommentsView from './CommentsView';
import QuickViewInvoice from './QuickView';
import AddNewWorkLog from './AddNewWorkLog';
import TimerView from './TimerView';
import StatisticsView from './StatisticsView';
import SelectAssignee from './SelectAssignee';
import OrderList from './OrderList';
import QuoteList from './QuoteList';
import CreateOrder from './CreateOrder';
import AddNewQuote from './AddNewQuote';
import OrderDetails from './OrderDetails';
import SearchView from './SearchView';
import AddNewOrderItem from './AddNewOrderItem';
import CustomerList from './CustomerList';
import SupplierList from './SupplierList';
import CustomerDetails from './CustomerDetails';
import SupplierDetails from './SupplierDetails';
import ProductList from './ProductList';
import ProductDetails from './ProductDetails';
import AddNewProduct from './AddNewProduct';
import AddNewCustomer from './AddNewCustomer';
import AddNewSupplier from './AddNewSupplier';
import AddressList from './AddressList';
import AddNewAddress from './AddNewAddress';
import InboxList from './InboxList';
import AddNewInboxItem from './AddNewInboxItem';
import CustomerInvoiceList from './CustomerInvoiceList';
import AddNewCustomerInvoice from './AddNewCustomerInvoice';
import CustomerInvoiceDetails from './CustomerInvoiceDetails';
import AddNewCustomerInvoiceItem from './AddNewCustomerInvoiceItem';
import TransferCustomerOrderToInvoiceView from './TransferCustomerOrderToInvoiceView';
import QuoteDetails from './QuoteDetails';
import AddNewQuoteItem from './AddNewQuoteItem';
import BankAccountLookup from './BankAccountLookup';
import AddNewComment from './AddNewComment';
import DistributionDetails from './DistributionDetails';
import MessageView from './MessageView';
import ProjectList from './ProjectList';
import AddNewProject from './AddNewProject';
import ProjectDetails from './ProjectDetails';
import HoursApproval from './HoursApproval';
import HoursRejectView from './HoursRejectView';
import WorkItemApprovalsListByWeek from './WorkItemApprovalsListByWeek';
import SendForAppprovalWorkItemSummary from './SendForAppprovalWorkItemSummary';
import WorkItemGroupDetails from './WorkItemGroupDetails';
import HoursRejectionMessage from './HoursRejectionMessage';

const WIDTH = Dimensions.get('window').width;

export const ApprovalsStackNav = createStackNavigator({
  ApprovalsList: { screen: ApprovalsList },
  InvoiceDetails: { screen: InvoiceDetails },
  CommentsView: { screen: CommentsView },
  AddNewInvoice: { screen: AddNewInvoice },
  LookupView: { screen: LookupView },
  ApprovalItemDetails: { screen: ApprovalItemDetails },
  HoursApproval: { screen: HoursApproval },
  WorkItemGroupDetails: { screen: WorkItemGroupDetails },
  AddNewWorkLog: { screen: AddNewWorkLog },
  HoursRejectView: { screen: HoursRejectView },
});

// this is not the recommended way to hide tab bar for specific screen, www.tiny.cc/1bia2y
ApprovalsStackNav.navigationOptions = ({ navigation }) => {
  const { routeName } = navigation.state.routes[navigation.state.index];
  let tabBarVisible = true;
  if (routeName == 'CommentsView' ||
    routeName == 'AddNewInvoice' ||
    routeName == 'LookupView' ||
    routeName == 'AddNewWorkLog' ||
    routeName == 'CommentsView' ||
    routeName == 'HoursRejectView' ||
    routeName == 'WorkItemGroupDetails' ||
    routeName == 'HoursApproval'
  ) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
  };
};

export const HoursStackNav = createStackNavigator({
  HoursList: { screen: HoursList },
  AddNewWorkLog: { screen: AddNewWorkLog },
  LookupView: { screen: LookupView },
  TimerView: { screen: TimerView },
  StatisticsView: { screen: StatisticsView },
  HoursApproval: { screen: HoursApproval },
  WorkItemApprovalsListByWeek: { screen: WorkItemApprovalsListByWeek },
  SendForAppprovalWorkItemSummary: { screen: SendForAppprovalWorkItemSummary },
  WorkItemGroupDetails: { screen: WorkItemGroupDetails },
  HoursRejectionMessage: { screen: HoursRejectionMessage },
});

// this is not the recommended way to hide tab bar for specific screen, www.tiny.cc/1bia2y
HoursStackNav.navigationOptions = ({ navigation }) => {
  const { routeName } = navigation.state.routes[navigation.state.index];
  let tabBarVisible = true;
  if (routeName == 'AddNewWorkLog'
    || routeName == 'TimerView'
    || routeName == 'StatisticsView'
    || routeName == 'LookupView'
    || routeName == 'WorkItemApprovalsListByWeek'
    || routeName == 'SendForAppprovalWorkItemSummary'
    || routeName == 'WorkItemGroupDetails'
    || routeName == 'HoursRejectionMessage'
  ) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
  };
};

export const NotificationsStackNav = createStackNavigator(
  {
    NotificationsList: { screen: NotificationsList },
    QuickViewInvoice: { screen: QuickViewInvoice },
    InvoiceDetails: { screen: InvoiceDetails },
    CommentsView: { screen: CommentsView },
    AddNewInvoice: { screen: AddNewInvoice },
    LookupView: { screen: LookupView },
    HoursApproval: { screen: HoursApproval },
    WorkItemGroupDetails: { screen: WorkItemGroupDetails },
    AddNewWorkLog: { screen: AddNewWorkLog },
    HoursRejectView: { screen: HoursRejectView },
    HoursRejectionMessage: { screen: HoursRejectionMessage },
  },
  {
    mode: 'modal'
  }
);

// this is not the recommended way to hide tab bar for specific screen, www.tiny.cc/1bia2y
NotificationsStackNav.navigationOptions = ({ navigation }) => {
  const { routeName } = navigation.state.routes[navigation.state.index];
  let tabBarVisible = true;
  if (routeName == 'QuickViewInvoice'
    || routeName == 'InvoiceDetails'
    || routeName == 'CommentsView'
    || routeName == 'LookupView'
    || routeName == 'WorkItemApprovalsListByWeek'
    || routeName == 'WorkItemGroupDetails'
    || routeName == 'HoursApproval'
    || routeName == 'AddNewWorkLog'
    || routeName == 'HoursRejectView'
    || routeName == 'HoursRejectionMessage'
  ) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
  };
};

export const AccountingStackNav = createStackNavigator({
  InvoiceList: { screen: InvoiceList },
  InvoiceDetails: { screen: InvoiceDetails },
  CameraView: { screen: CameraView },
  AddNewInvoice: { screen: AddNewInvoice },
  LookupView: { screen: LookupView },
  CommentsView: { screen: CommentsView },
  FeedbackView: { screen: Feedback },
  AboutView: { screen: About },
  Website: { screen: Website },
  SelectAssigneeView: { screen: SelectAssignee },
  SearchView: { screen: SearchView },
  InboxList: { screen: InboxList },
  AddNewInboxItem: { screen: AddNewInboxItem },
  SupplierList: { screen: SupplierList },
  AddNewSupplier: { screen: AddNewSupplier },
  AddressList: { screen: AddressList },
  AddNewAddress: { screen: AddNewAddress },
  SupplierDetails: { screen: SupplierDetails },
  BankAccountLookup: { screen: BankAccountLookup },
  ProjectList: { screen: ProjectList },
  AddNewProject: { screen: AddNewProject },
  ProjectDetails: { screen: ProjectDetails }
});

// this is not the recommended way to hide tab bar for specific screen, www.tiny.cc/1bia2y
AccountingStackNav.navigationOptions = ({ navigation }) => {
  const { routeName } = navigation.state.routes[navigation.state.index];
  let tabBarVisible = true;
  if (
    routeName == 'CameraView' ||
    routeName == 'AddNewInvoice' ||
    routeName == 'LookupView' ||
    routeName == 'CommentsView' ||
    routeName == 'FeedbackView' ||
    routeName == 'AboutView' ||
    routeName == 'Website' ||
    routeName == 'SelectAssigneeView' ||
    routeName == 'AddNewInboxItem' ||
    routeName == 'SearchView' ||
    routeName == 'AddNewSupplier' ||
    routeName == 'AddressList' ||
    routeName == 'AddNewAddress' ||
    routeName == 'BankAccountLookup' ||
    routeName == 'AddNewProject'
  ) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
  };
};

export const SalesStackNav = createStackNavigator({
  OrderList: { screen: OrderList },
  OrderDetails: { screen: OrderDetails },
  CommentsView: { screen: CommentsView },
  SearchView: { screen: SearchView },
  AddNewOrderItem: { screen: AddNewOrderItem },
  CreateOrder: { screen: CreateOrder },
  AddNewQuote: { screen: AddNewQuote },
  LookupView: { screen: LookupView },
  LookupVatView: { screen: LookupVatView },
  CustomerList: { screen: CustomerList },
  AddNewCustomer: { screen: AddNewCustomer },
  CustomerDetails: { screen: CustomerDetails },
  ProductList: { screen: ProductList },
  ProductDetails: { screen: ProductDetails },
  AddNewProduct: { screen: AddNewProduct },
  AddressList: { screen: AddressList },
  AddNewAddress: { screen: AddNewAddress },
  CameraView: { screen: CameraView },
  CustomerInvoiceList: { screen: CustomerInvoiceList },
  AddNewCustomerInvoice: { screen: AddNewCustomerInvoice },
  CustomerInvoiceDetails: { screen: CustomerInvoiceDetails },
  AddNewCustomerInvoiceItem: { screen: AddNewCustomerInvoiceItem },
  TransferCustomerOrderToInvoiceView: { screen: TransferCustomerOrderToInvoiceView },
  QuoteDetails: { screen: QuoteDetails },
  AddNewQuoteItem: { screen: AddNewQuoteItem },
  QuoteList: { screen: QuoteList },
  AddNewComment: { screen: AddNewComment },
  DistributionDetails: { screen: DistributionDetails },
  MessageView: { screen: MessageView },
});

// this is not the recommended way to hide tab bar for specific screen, www.tiny.cc/1bia2y
SalesStackNav.navigationOptions = ({ navigation }) => {
  const { routeName } = navigation.state.routes[navigation.state.index];
  let tabBarVisible = true;
  if (
    routeName == 'CommentsView' ||
    routeName == 'SearchView' ||
    routeName == 'AddNewOrderItem' ||
    routeName == 'CreateOrder' ||
    routeName == 'AddNewQuote' ||
    routeName == 'LookupView' ||
    routeName == 'LookupVatView' ||
    routeName == 'AddNewCustomer' ||
    routeName == 'AddNewProduct' ||
    routeName == 'AddressList' ||
    routeName == 'AddNewAddress' ||
    routeName == 'CameraView' ||
    routeName == 'AddNewCustomerInvoice' ||
    routeName == 'TransferCustomerOrderToInvoiceView' ||
    routeName == 'AddNewQuoteItem' ||
    routeName == 'AddNewComment'
  ) {
    tabBarVisible = false;
  }
  return {
    tabBarVisible,
  };
};

export const Tabs = createBottomTabNavigator({
  AccountingTab: {
    screen: AccountingStackNav,
    navigationOptions: () => ({
      tabBarLabel: i18n.t('CustomDrawer.accounting'),
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return TabIcons.AccountingActive;
        } else {
          return TabIcons.AccountingInactive;
        }
      },
    })
  },
  SalesTab: {
    screen: SalesStackNav,
    navigationOptions: () => ({
      tabBarLabel: i18n.t('CustomDrawer.sales'),
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return TabIcons.SalesActive;
        } else {
          return TabIcons.SalesInactive;
        }
      },
    })
  },
  HoursTab: {
    screen: HoursStackNav,
    navigationOptions: () => ({
      tabBarLabel: i18n.t('HoursList.index.title'),
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return TabIcons.HoursActive;
        } else {
          return TabIcons.HoursInactive;
        }
      },
    })
  },
  ApprovalsTab: {
    screen: ApprovalsStackNav,
    navigationOptions: () => ({
      tabBarLabel: i18n.t('CustomDrawer.approvals'),
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return TabIcons.ApprovalsActive;
        } else {
          return TabIcons.ApprovalsInactive;
        }
      },
    })
  },
  NotificationsTab: {
    screen: NotificationsStackNav,
    navigationOptions: () => ({
      tabBarLabel: i18n.t('NotificationsList.index.title'),
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return TabIcons.NotificationActive;
        } else {
          return TabIcons.NotificationInactive;
        }
      },
    })
  },
}, {
    tabBarOptions: {
      activeTintColor: theme.HINT_TEXT_COLOR,
      inactiveTintColor: theme.SECONDARY_TEXT_COLOR,
      style: { paddingTop: Platform.OS === 'ios' ? 5 : 0 },
      labelStyle: {
        fontSize: isIphone5() ? 8 : 10,
      }
    }

  });

const Drawer = createDrawerNavigator({
  MainDrawer: { screen: Tabs }
}, {
    contentComponent: props => <CustomDrawer {...props} />,
    drawerWidth: WIDTH - (Platform.OS === 'android' ? 56 : 64)
  });

export const AppNavigator = createStackNavigator({
  Init: { screen: Init },
  Login: { screen: Login },
  Logout: { screen: Logout },
  OnBoard: { screen: OnBoard },
  CompanySelect: { screen: CompanySelect },
  CompanySwitch: { screen: CompanySwitch },
  MainDrawer: { screen: Drawer, navigationOptions: { header: null } },
});
