import type { INodeProperties } from 'n8n-workflow';

export const orderItemOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['orderItem'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        description: 'Get an order item by ID',
        action: 'Get an order item',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many order items',
        action: 'Get many order items',
      },
    ],
    default: 'getAll',
  },
];

export const orderItemFields: INodeProperties[] = [
  // Get
  {
    displayName: 'Order Item ID',
    name: 'orderItemId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['orderItem'],
        operation: ['get'],
      },
    },
    description: 'The ID of the order item to retrieve',
  },

  // Get All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['orderItem'],
        operation: ['getAll'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: {
      minValue: 1,
      maxValue: 100,
    },
    displayOptions: {
      show: {
        resource: ['orderItem'],
        operation: ['getAll'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['orderItem'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        description: 'Filter by order ID',
      },
      {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        default: '',
        description: 'Filter by product ID',
      },
      {
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        default: '',
        description: 'Filter by variant ID',
      },
    ],
  },
];
