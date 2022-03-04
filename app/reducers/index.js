import appReducer from './appReducer';
import userReducer from './userReducer';
import errorReducer from './errorReducer';
import companyReducer from './companyReducer';
import timerReducer from './timerReducer';
import notificationReducer from './notificationReducer';
import recentDataReducer from './recentDataReducer';
import approvalReducer from './approvalReducer';
import invoiceListReducer from './invoiceListReducer';
import newInvoiceReducer from './newInvoiceReducer';
import orderListReducer from './orderListReducer';
import customerListReducer from './customerListReducer';
import supplierListReducer from './supplierListReducer';
import productListReducer from './productListReducer';
import projectListReducer from './projectListReducer';
import newProductReducer from './newProductReducer';
import addressListReducer  from './addressListReducer';
import newInboxItemReducer from './newInboxItemReducer';
import quoteListReducer from './quoteListReducer';
import customerInvoiceListReducer from './customerInvoiceListReducer';
import draftDataReducer from './draftDataReducer';
import bankAccountsReducer from './bankAccountsReducer';
import tokenReducer from './tokenReducer';

const Reducers = {
  app: appReducer,
  user: userReducer,
  error: errorReducer,
  invoiceList: invoiceListReducer,
  newInvoice: newInvoiceReducer,
  orderList: orderListReducer,
  customerList: customerListReducer,
  supplierList:supplierListReducer,
  productList: productListReducer,
  projectList: projectListReducer,
  company: companyReducer,
  timer: timerReducer,
  notification: notificationReducer,
  recentData: recentDataReducer,
  approval: approvalReducer,
  newProduct: newProductReducer,
  addressList: addressListReducer,
  newInboxItem: newInboxItemReducer,
  quoteList: quoteListReducer,
  customerInvoiceList: customerInvoiceListReducer,
  draftWorkLog: draftDataReducer,
  bankAccounts: bankAccountsReducer,
  token: tokenReducer,
};

export default Reducers;
