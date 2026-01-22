import type { INodeProperties } from 'n8n-workflow';
import { productOperations, productFields } from './product';
import { orderOperations, orderFields } from './order';
import { orderItemOperations, orderItemFields } from './orderItem';
import { subscriptionOperations, subscriptionFields } from './subscription';
import { subscriptionInvoiceOperations, subscriptionInvoiceFields } from './subscriptionInvoice';
import { customerOperations, customerFields } from './customer';
import { licenseKeyOperations, licenseKeyFields } from './licenseKey';
import { licenseKeyInstanceOperations, licenseKeyInstanceFields } from './licenseKeyInstance';
import { discountOperations, discountFields } from './discount';
import { discountRedemptionOperations, discountRedemptionFields } from './discountRedemption';
import { storeOperations, storeFields } from './store';
import { variantOperations, variantFields } from './variant';
import { checkoutOperations, checkoutFields } from './checkout';
import { webhookOperations, webhookFields } from './webhook';
import { usageRecordOperations, usageRecordFields } from './usageRecord';
import { userOperations, userFields } from './user';
import { fileOperations, fileFields } from './file';
import {
  orderAdvancedOptions,
  subscriptionAdvancedOptions,
  customerAdvancedOptions,
  licenseKeyAdvancedOptions,
  productAdvancedOptions,
  variantAdvancedOptions,
  checkoutAdvancedOptions,
  discountAdvancedOptions,
} from './shared';

export const resourceProperty: INodeProperties = {
  displayName: 'Resource',
  name: 'resource',
  type: 'options',
  noDataExpression: true,
  options: [
    { name: 'Checkout', value: 'checkout' },
    { name: 'Customer', value: 'customer' },
    { name: 'Discount', value: 'discount' },
    { name: 'Discount Redemption', value: 'discountRedemption' },
    { name: 'File', value: 'file' },
    { name: 'License Key', value: 'licenseKey' },
    { name: 'License Key Instance', value: 'licenseKeyInstance' },
    { name: 'Order', value: 'order' },
    { name: 'Order Item', value: 'orderItem' },
    { name: 'Product', value: 'product' },
    { name: 'Store', value: 'store' },
    { name: 'Subscription', value: 'subscription' },
    { name: 'Subscription Invoice', value: 'subscriptionInvoice' },
    { name: 'Usage Record', value: 'usageRecord' },
    { name: 'User', value: 'user' },
    { name: 'Variant', value: 'variant' },
    { name: 'Webhook', value: 'webhook' },
  ],
  default: 'product',
};

export const allOperations: INodeProperties[] = [
  productOperations,
  orderOperations,
  ...orderItemOperations,
  subscriptionOperations,
  ...subscriptionInvoiceOperations,
  customerOperations,
  licenseKeyOperations,
  ...licenseKeyInstanceOperations,
  discountOperations,
  ...discountRedemptionOperations,
  storeOperations,
  variantOperations,
  checkoutOperations,
  webhookOperations,
  ...usageRecordOperations,
  ...userOperations,
  fileOperations,
];

export const allFields: INodeProperties[] = [
  ...productFields,
  productAdvancedOptions,
  ...orderFields,
  orderAdvancedOptions,
  ...orderItemFields,
  ...subscriptionFields,
  subscriptionAdvancedOptions,
  ...subscriptionInvoiceFields,
  ...customerFields,
  customerAdvancedOptions,
  ...licenseKeyFields,
  licenseKeyAdvancedOptions,
  ...licenseKeyInstanceFields,
  ...discountFields,
  discountAdvancedOptions,
  ...discountRedemptionFields,
  ...storeFields,
  ...variantFields,
  variantAdvancedOptions,
  ...checkoutFields,
  checkoutAdvancedOptions,
  ...webhookFields,
  ...usageRecordFields,
  ...userFields,
  ...fileFields,
];

export {
  productOperations,
  productFields,
  orderOperations,
  orderFields,
  orderItemOperations,
  orderItemFields,
  subscriptionOperations,
  subscriptionFields,
  subscriptionInvoiceOperations,
  subscriptionInvoiceFields,
  customerOperations,
  customerFields,
  licenseKeyOperations,
  licenseKeyFields,
  licenseKeyInstanceOperations,
  licenseKeyInstanceFields,
  discountOperations,
  discountFields,
  discountRedemptionOperations,
  discountRedemptionFields,
  storeOperations,
  storeFields,
  variantOperations,
  variantFields,
  checkoutOperations,
  checkoutFields,
  webhookOperations,
  webhookFields,
  usageRecordOperations,
  usageRecordFields,
  userOperations,
  userFields,
  fileOperations,
  fileFields,
};
