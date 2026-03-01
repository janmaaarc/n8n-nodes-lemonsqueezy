import type { INodeProperties } from 'n8n-workflow';

export const discountRedemptionOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['discountRedemption'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        description: 'Get a discount redemption by ID',
        action: 'Get a discount redemption',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many discount redemptions',
        action: 'Get many discount redemptions',
      },
    ],
    default: 'getAll',
  },
];

export const discountRedemptionFields: INodeProperties[] = [
  // Get
  {
    displayName: 'Discount Redemption ID',
    name: 'discountRedemptionId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['discountRedemption'],
        operation: ['get'],
      },
    },
    description: 'The ID of the discount redemption to retrieve',
  },

  // Get All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['discountRedemption'],
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
        resource: ['discountRedemption'],
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
        resource: ['discountRedemption'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'Discount ID',
        name: 'discountId',
        type: 'string',
        default: '',
        description: 'Filter by discount ID',
      },
      {
        displayName: 'Order ID',
        name: 'orderId',
        type: 'string',
        default: '',
        description: 'Filter by order ID',
      },
      {
        displayName: 'Created After',
        name: 'createdAfter',
        type: 'dateTime',
        default: '',
        description: 'Return only redemptions created on or after this date',
      },
      {
        displayName: 'Created Before',
        name: 'createdBefore',
        type: 'dateTime',
        default: '',
        description: 'Return only redemptions created on or before this date',
      },
    ],
  },
];
