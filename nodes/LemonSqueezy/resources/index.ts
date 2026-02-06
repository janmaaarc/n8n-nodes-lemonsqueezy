import type { INodeProperties } from 'n8n-workflow';
import { affiliateOperations, affiliateFields } from './affiliate';
import { checkoutOperations, checkoutFields } from './checkout';
import { customerOperations, customerFields } from './customer';
import { discountOperations, discountFields } from './discount';
import { discountRedemptionOperations, discountRedemptionFields } from './discountRedemption';
import { fileOperations, fileFields } from './file';
import { licenseKeyOperations, licenseKeyFields } from './licenseKey';
import { licenseKeyInstanceOperations, licenseKeyInstanceFields } from './licenseKeyInstance';
import { orderOperations, orderFields } from './order';
import { orderItemOperations, orderItemFields } from './orderItem';
import { priceOperations, priceFields } from './price';
import { productOperations, productFields } from './product';
import { storeOperations, storeFields } from './store';
import { subscriptionOperations, subscriptionFields } from './subscription';
import { subscriptionInvoiceOperations, subscriptionInvoiceFields } from './subscriptionInvoice';
import { subscriptionItemOperations, subscriptionItemFields } from './subscriptionItem';
import { usageRecordOperations, usageRecordFields } from './usageRecord';
import { userOperations, userFields } from './user';
import { variantOperations, variantFields } from './variant';
import { webhookOperations, webhookFields } from './webhook';
import {
  orderAdvancedOptions,
  subscriptionAdvancedOptions,
  customerAdvancedOptions,
  licenseKeyAdvancedOptions,
  productAdvancedOptions,
  variantAdvancedOptions,
  checkoutAdvancedOptions,
  discountAdvancedOptions,
  priceAdvancedOptions,
  subscriptionItemAdvancedOptions,
} from './shared';

export const resourceProperty: INodeProperties = {
  displayName: 'Resource',
  name: 'resource',
  type: 'options',
  noDataExpression: true,
  options: [
    { name: 'Affiliate', value: 'affiliate' },
    { name: 'Checkout', value: 'checkout' },
    { name: 'Customer', value: 'customer' },
    { name: 'Discount', value: 'discount' },
    { name: 'Discount Redemption', value: 'discountRedemption' },
    { name: 'File', value: 'file' },
    { name: 'License Key', value: 'licenseKey' },
    { name: 'License Key Instance', value: 'licenseKeyInstance' },
    { name: 'Order', value: 'order' },
    { name: 'Order Item', value: 'orderItem' },
    { name: 'Price', value: 'price' },
    { name: 'Product', value: 'product' },
    { name: 'Store', value: 'store' },
    { name: 'Subscription', value: 'subscription' },
    { name: 'Subscription Invoice', value: 'subscriptionInvoice' },
    { name: 'Subscription Item', value: 'subscriptionItem' },
    { name: 'Usage Record', value: 'usageRecord' },
    { name: 'User', value: 'user' },
    { name: 'Variant', value: 'variant' },
    { name: 'Webhook', value: 'webhook' },
  ],
  default: 'product',
};

export const allOperations: INodeProperties[] = [
  affiliateOperations,
  checkoutOperations,
  customerOperations,
  discountOperations,
  ...discountRedemptionOperations,
  fileOperations,
  licenseKeyOperations,
  ...licenseKeyInstanceOperations,
  orderOperations,
  ...orderItemOperations,
  priceOperations,
  productOperations,
  storeOperations,
  subscriptionOperations,
  ...subscriptionInvoiceOperations,
  ...subscriptionItemOperations,
  ...usageRecordOperations,
  ...userOperations,
  variantOperations,
  webhookOperations,
];

export const allFields: INodeProperties[] = [
  ...affiliateFields,
  ...checkoutFields,
  checkoutAdvancedOptions,
  ...customerFields,
  customerAdvancedOptions,
  ...discountFields,
  discountAdvancedOptions,
  ...discountRedemptionFields,
  ...fileFields,
  ...licenseKeyFields,
  licenseKeyAdvancedOptions,
  ...licenseKeyInstanceFields,
  ...orderFields,
  orderAdvancedOptions,
  ...orderItemFields,
  ...priceFields,
  priceAdvancedOptions,
  ...productFields,
  productAdvancedOptions,
  ...storeFields,
  ...subscriptionFields,
  subscriptionAdvancedOptions,
  ...subscriptionInvoiceFields,
  ...subscriptionItemFields,
  subscriptionItemAdvancedOptions,
  ...usageRecordFields,
  ...userFields,
  ...variantFields,
  variantAdvancedOptions,
  ...webhookFields,
];

export {
  affiliateOperations,
  affiliateFields,
  checkoutOperations,
  checkoutFields,
  customerOperations,
  customerFields,
  discountOperations,
  discountFields,
  discountRedemptionOperations,
  discountRedemptionFields,
  fileOperations,
  fileFields,
  licenseKeyOperations,
  licenseKeyFields,
  licenseKeyInstanceOperations,
  licenseKeyInstanceFields,
  orderOperations,
  orderFields,
  orderItemOperations,
  orderItemFields,
  priceOperations,
  priceFields,
  productOperations,
  productFields,
  storeOperations,
  storeFields,
  subscriptionOperations,
  subscriptionFields,
  subscriptionInvoiceOperations,
  subscriptionInvoiceFields,
  subscriptionItemOperations,
  subscriptionItemFields,
  usageRecordOperations,
  usageRecordFields,
  userOperations,
  userFields,
  variantOperations,
  variantFields,
  webhookOperations,
  webhookFields,
};
