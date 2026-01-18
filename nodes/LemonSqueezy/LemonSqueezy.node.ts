import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestMethods,
  IDataObject,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

interface LemonSqueezyResponse {
  data: IDataObject | IDataObject[];
  links?: {
    next?: string;
  };
}

export class LemonSqueezy implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Lemon Squeezy',
    name: 'lemonSqueezy',
    icon: 'file:lemonSqueezy.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Lemon Squeezy API',
    defaults: {
      name: 'Lemon Squeezy',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'lemonSqueezyApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Customer', value: 'customer' },
          { name: 'Discount', value: 'discount' },
          { name: 'License Key', value: 'licenseKey' },
          { name: 'Order', value: 'order' },
          { name: 'Product', value: 'product' },
          { name: 'Store', value: 'store' },
          { name: 'Subscription', value: 'subscription' },
          { name: 'Variant', value: 'variant' },
        ],
        default: 'product',
      },

      // Product Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['product'] },
        },
        options: [
          { name: 'Get', value: 'get', action: 'Get a product' },
          { name: 'Get Many', value: 'getAll', action: 'Get many products' },
        ],
        default: 'getAll',
      },

      // Order Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['order'] },
        },
        options: [
          { name: 'Get', value: 'get', action: 'Get an order' },
          { name: 'Get Many', value: 'getAll', action: 'Get many orders' },
        ],
        default: 'getAll',
      },

      // Subscription Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['subscription'] },
        },
        options: [
          { name: 'Cancel', value: 'cancel', action: 'Cancel a subscription' },
          { name: 'Get', value: 'get', action: 'Get a subscription' },
          { name: 'Get Many', value: 'getAll', action: 'Get many subscriptions' },
          { name: 'Update', value: 'update', action: 'Update a subscription' },
        ],
        default: 'getAll',
      },

      // Customer Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['customer'] },
        },
        options: [
          { name: 'Create', value: 'create', action: 'Create a customer' },
          { name: 'Get', value: 'get', action: 'Get a customer' },
          { name: 'Get Many', value: 'getAll', action: 'Get many customers' },
        ],
        default: 'getAll',
      },

      // License Key Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['licenseKey'] },
        },
        options: [
          { name: 'Get', value: 'get', action: 'Get a license key' },
          { name: 'Get Many', value: 'getAll', action: 'Get many license keys' },
        ],
        default: 'getAll',
      },

      // Discount Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['discount'] },
        },
        options: [
          { name: 'Create', value: 'create', action: 'Create a discount' },
          { name: 'Delete', value: 'delete', action: 'Delete a discount' },
          { name: 'Get', value: 'get', action: 'Get a discount' },
          { name: 'Get Many', value: 'getAll', action: 'Get many discounts' },
        ],
        default: 'getAll',
      },

      // Store Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['store'] },
        },
        options: [
          { name: 'Get', value: 'get', action: 'Get a store' },
          { name: 'Get Many', value: 'getAll', action: 'Get many stores' },
        ],
        default: 'getAll',
      },

      // Variant Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: ['variant'] },
        },
        options: [
          { name: 'Get', value: 'get', action: 'Get a variant' },
          { name: 'Get Many', value: 'getAll', action: 'Get many variants' },
        ],
        default: 'getAll',
      },

      // ==================== FIELDS ====================

      // ID Fields for Get operations
      {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['product'], operation: ['get'] },
        },
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['order'], operation: ['get'] },
        },
      },
      {
        displayName: 'Subscription ID',
        name: 'subscriptionId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['subscription'], operation: ['get', 'update', 'cancel'] },
        },
      },
      {
        displayName: 'Customer ID',
        name: 'customerId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['customer'], operation: ['get'] },
        },
      },
      {
        displayName: 'License Key ID',
        name: 'licenseKeyId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['licenseKey'], operation: ['get'] },
        },
      },
      {
        displayName: 'Discount ID',
        name: 'discountId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['discount'], operation: ['get', 'delete'] },
        },
      },
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['store'], operation: ['get'] },
        },
      },
      {
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['variant'], operation: ['get'] },
        },
      },

      // Customer Create Fields
      {
        displayName: 'Store ID',
        name: 'customerStoreId',
        type: 'string',
        required: true,
        default: '',
        description: 'The ID of the store this customer belongs to',
        displayOptions: {
          show: { resource: ['customer'], operation: ['create'] },
        },
      },
      {
        displayName: 'Name',
        name: 'customerName',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['customer'], operation: ['create'] },
        },
      },
      {
        displayName: 'Email',
        name: 'customerEmail',
        type: 'string',
        placeholder: 'name@email.com',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['customer'], operation: ['create'] },
        },
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['customer'], operation: ['create'] },
        },
        options: [
          {
            displayName: 'City',
            name: 'city',
            type: 'string',
            default: '',
          },
          {
            displayName: 'Country',
            name: 'country',
            type: 'string',
            default: '',
            description: 'ISO 3166-1 alpha-2 country code',
          },
          {
            displayName: 'Region',
            name: 'region',
            type: 'string',
            default: '',
          },
        ],
      },

      // Subscription Update Fields
      {
        displayName: 'Update Fields',
        name: 'updateFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: { resource: ['subscription'], operation: ['update'] },
        },
        options: [
          {
            displayName: 'Variant ID',
            name: 'variantId',
            type: 'string',
            default: '',
            description: 'Change the subscription to a different variant',
          },
          {
            displayName: 'Pause Mode',
            name: 'pause',
            type: 'options',
            options: [
              { name: 'Not Paused', value: '' },
              { name: 'Pause Void', value: 'void' },
              { name: 'Pause Free', value: 'free' },
            ],
            default: '',
            description: 'Pause or unpause the subscription',
          },
          {
            displayName: 'Cancelled',
            name: 'cancelled',
            type: 'boolean',
            default: false,
            description: 'Whether the subscription should be cancelled',
          },
          {
            displayName: 'Billing Anchor',
            name: 'billingAnchor',
            type: 'number',
            default: 0,
            description: 'Day of the month for billing (1-31)',
          },
        ],
      },

      // Discount Create Fields
      {
        displayName: 'Store ID',
        name: 'discountStoreId',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
          show: { resource: ['discount'], operation: ['create'] },
        },
      },
      {
        displayName: 'Name',
        name: 'discountName',
        type: 'string',
        required: true,
        default: '',
        description: 'Internal name for the discount',
        displayOptions: {
          show: { resource: ['discount'], operation: ['create'] },
        },
      },
      {
        displayName: 'Code',
        name: 'discountCode',
        type: 'string',
        required: true,
        default: '',
        description: 'The discount code customers will use',
        displayOptions: {
          show: { resource: ['discount'], operation: ['create'] },
        },
      },
      {
        displayName: 'Amount',
        name: 'discountAmount',
        type: 'number',
        required: true,
        default: 0,
        description: 'Discount amount (percentage or fixed amount in cents)',
        displayOptions: {
          show: { resource: ['discount'], operation: ['create'] },
        },
      },
      {
        displayName: 'Amount Type',
        name: 'discountAmountType',
        type: 'options',
        options: [
          { name: 'Percent', value: 'percent' },
          { name: 'Fixed', value: 'fixed' },
        ],
        default: 'percent',
        displayOptions: {
          show: { resource: ['discount'], operation: ['create'] },
        },
      },

      // Return All / Limit for getAll operations
      {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        default: false,
        description: 'Whether to return all results or only up to a given limit',
        displayOptions: {
          show: { operation: ['getAll'] },
        },
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 50,
        description: 'Max number of results to return',
        typeOptions: { minValue: 1 },
        displayOptions: {
          show: { operation: ['getAll'], returnAll: [false] },
        },
      },

      // Filters for getAll
      {
        displayName: 'Filters',
        name: 'filters',
        type: 'collection',
        placeholder: 'Add Filter',
        default: {},
        displayOptions: {
          show: { operation: ['getAll'] },
        },
        options: [
          {
            displayName: 'Store ID',
            name: 'storeId',
            type: 'string',
            default: '',
            description: 'Filter by store ID',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[] | undefined;

        // Map resource to API endpoint
        const resourceMap: Record<string, string> = {
          product: 'products',
          order: 'orders',
          subscription: 'subscriptions',
          customer: 'customers',
          licenseKey: 'license-keys',
          discount: 'discounts',
          store: 'stores',
          variant: 'variants',
        };

        const endpoint = resourceMap[resource];

        if (operation === 'get') {
          const idMap: Record<string, string> = {
            product: 'productId',
            order: 'orderId',
            subscription: 'subscriptionId',
            customer: 'customerId',
            licenseKey: 'licenseKeyId',
            discount: 'discountId',
            store: 'storeId',
            variant: 'variantId',
          };
          const id = this.getNodeParameter(idMap[resource], i) as string;
          responseData = await lemonSqueezyApiRequest.call(this, 'GET', `/${endpoint}/${id}`);
        } else if (operation === 'getAll') {
          const returnAll = this.getNodeParameter('returnAll', i) as boolean;
          const filters = this.getNodeParameter('filters', i) as { storeId?: string };

          const qs: Record<string, string | number> = {};
          if (filters.storeId) {
            qs['filter[store_id]'] = filters.storeId;
          }

          if (returnAll) {
            responseData = await lemonSqueezyApiRequestAllItems.call(this, 'GET', `/${endpoint}`, qs);
          } else {
            const limit = this.getNodeParameter('limit', i) as number;
            qs['page[size]'] = limit;
            const response = await lemonSqueezyApiRequest.call(this, 'GET', `/${endpoint}`, undefined, qs);
            responseData = (response as unknown as LemonSqueezyResponse).data;
          }
        } else if (operation === 'create') {
          if (resource === 'customer') {
            const storeId = this.getNodeParameter('customerStoreId', i) as string;
            const name = this.getNodeParameter('customerName', i) as string;
            const email = this.getNodeParameter('customerEmail', i) as string;
            const additionalFields = this.getNodeParameter('additionalFields', i) as Record<string, string>;

            const body = {
              data: {
                type: 'customers',
                attributes: {
                  name,
                  email,
                  ...additionalFields,
                },
                relationships: {
                  store: {
                    data: {
                      type: 'stores',
                      id: storeId,
                    },
                  },
                },
              },
            };
            responseData = await lemonSqueezyApiRequest.call(this, 'POST', '/customers', body);
          } else if (resource === 'discount') {
            const storeId = this.getNodeParameter('discountStoreId', i) as string;
            const name = this.getNodeParameter('discountName', i) as string;
            const code = this.getNodeParameter('discountCode', i) as string;
            const amount = this.getNodeParameter('discountAmount', i) as number;
            const amountType = this.getNodeParameter('discountAmountType', i) as string;

            const body = {
              data: {
                type: 'discounts',
                attributes: {
                  name,
                  code,
                  amount,
                  amount_type: amountType,
                },
                relationships: {
                  store: {
                    data: {
                      type: 'stores',
                      id: storeId,
                    },
                  },
                },
              },
            };
            responseData = await lemonSqueezyApiRequest.call(this, 'POST', '/discounts', body);
          }
        } else if (operation === 'update') {
          if (resource === 'subscription') {
            const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
            const updateFields = this.getNodeParameter('updateFields', i) as Record<string, unknown>;

            const attributes: Record<string, unknown> = {};
            if (updateFields.variantId) {
              attributes.variant_id = updateFields.variantId;
            }
            if (updateFields.pause !== undefined && updateFields.pause !== '') {
              attributes.pause = { mode: updateFields.pause };
            } else if (updateFields.pause === '') {
              attributes.pause = null;
            }
            if (updateFields.cancelled !== undefined) {
              attributes.cancelled = updateFields.cancelled;
            }
            if (updateFields.billingAnchor) {
              attributes.billing_anchor = updateFields.billingAnchor;
            }

            const body = {
              data: {
                type: 'subscriptions',
                id: subscriptionId,
                attributes,
              },
            };
            responseData = await lemonSqueezyApiRequest.call(this, 'PATCH', `/subscriptions/${subscriptionId}`, body);
          }
        } else if (operation === 'cancel') {
          if (resource === 'subscription') {
            const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
            responseData = await lemonSqueezyApiRequest.call(this, 'DELETE', `/subscriptions/${subscriptionId}`);
          }
        } else if (operation === 'delete') {
          if (resource === 'discount') {
            const discountId = this.getNodeParameter('discountId', i) as string;
            responseData = await lemonSqueezyApiRequest.call(this, 'DELETE', `/discounts/${discountId}`);
          }
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData as IDataObject[]),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

async function lemonSqueezyApiRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
  qs: Record<string, string | number> = {},
): Promise<IDataObject> {
  const options: {
    method: IHttpRequestMethods;
    url: string;
    qs: Record<string, string | number>;
    body?: IDataObject;
    json: boolean;
  } = {
    method,
    url: `https://api.lemonsqueezy.com/v1${endpoint}`,
    qs,
    json: true,
  };

  if (body) {
    options.body = body;
  }

  try {
    return await this.helpers.requestWithAuthentication.call(this, 'lemonSqueezyApi', options) as IDataObject;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject);
  }
}

async function lemonSqueezyApiRequestAllItems(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  qs: Record<string, string | number> = {},
): Promise<IDataObject[]> {
  const returnData: IDataObject[] = [];
  let nextPageUrl: string | null = `https://api.lemonsqueezy.com/v1${endpoint}`;

  qs['page[size]'] = 100;

  do {
    const options: {
      method: IHttpRequestMethods;
      url: string;
      qs: Record<string, string | number>;
      json: boolean;
    } = {
      method,
      url: nextPageUrl,
      qs: nextPageUrl.includes('?') ? {} : qs,
      json: true,
    };

    const responseData = await this.helpers.requestWithAuthentication.call(this, 'lemonSqueezyApi', options) as LemonSqueezyResponse;
    returnData.push(...(responseData.data as IDataObject[]));
    nextPageUrl = responseData.links?.next || null;
  } while (nextPageUrl);

  return returnData;
}
