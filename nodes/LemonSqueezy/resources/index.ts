import type { INodeProperties } from 'n8n-workflow';
import { productOperations, productFields } from './product';
import { orderOperations, orderFields } from './order';
import { subscriptionOperations, subscriptionFields } from './subscription';
import { customerOperations, customerFields } from './customer';
import { licenseKeyOperations, licenseKeyFields } from './licenseKey';
import { discountOperations, discountFields } from './discount';
import { storeOperations, storeFields } from './store';
import { variantOperations, variantFields } from './variant';
import { checkoutOperations, checkoutFields } from './checkout';
import { webhookOperations, webhookFields } from './webhook';

export const resourceProperty: INodeProperties = {
  displayName: 'Resource',
  name: 'resource',
  type: 'options',
  noDataExpression: true,
  options: [
    { name: 'Checkout', value: 'checkout' },
    { name: 'Customer', value: 'customer' },
    { name: 'Discount', value: 'discount' },
    { name: 'License Key', value: 'licenseKey' },
    { name: 'Order', value: 'order' },
    { name: 'Product', value: 'product' },
    { name: 'Store', value: 'store' },
    { name: 'Subscription', value: 'subscription' },
    { name: 'Variant', value: 'variant' },
    { name: 'Webhook', value: 'webhook' },
  ],
  default: 'product',
};

export const allOperations: INodeProperties[] = [
  productOperations,
  orderOperations,
  subscriptionOperations,
  customerOperations,
  licenseKeyOperations,
  discountOperations,
  storeOperations,
  variantOperations,
  checkoutOperations,
  webhookOperations,
];

export const allFields: INodeProperties[] = [
  ...productFields,
  ...orderFields,
  ...subscriptionFields,
  ...customerFields,
  ...licenseKeyFields,
  ...discountFields,
  ...storeFields,
  ...variantFields,
  ...checkoutFields,
  ...webhookFields,
];

export {
  productOperations,
  productFields,
  orderOperations,
  orderFields,
  subscriptionOperations,
  subscriptionFields,
  customerOperations,
  customerFields,
  licenseKeyOperations,
  licenseKeyFields,
  discountOperations,
  discountFields,
  storeOperations,
  storeFields,
  variantOperations,
  variantFields,
  checkoutOperations,
  checkoutFields,
  webhookOperations,
  webhookFields,
};
