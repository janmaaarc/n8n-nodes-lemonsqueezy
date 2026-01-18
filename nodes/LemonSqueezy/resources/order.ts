import type { INodeProperties } from 'n8n-workflow';
import { ORDER_STATUSES } from '../constants';

export const orderOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['order'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get an order',
      description: 'Retrieve a single order by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many orders',
      description: 'Retrieve multiple orders',
    },
    {
      name: 'Refund',
      value: 'refund',
      action: 'Refund an order',
      description: 'Issue a refund for an order',
    },
  ],
  default: 'getAll',
};

export const orderFields: INodeProperties[] = [
  // Order ID for Get/Refund operations
  {
    displayName: 'Order ID',
    name: 'orderId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the order',
    displayOptions: {
      show: { resource: ['order'], operation: ['get', 'refund'] },
    },
  },
  // Return All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: {
      show: { resource: ['order'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1 },
    displayOptions: {
      show: { resource: ['order'], operation: ['getAll'], returnAll: [false] },
    },
  },
  // Filters
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: { resource: ['order'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        default: '',
        description: 'Filter by store ID',
      },
      {
        displayName: 'User Email',
        name: 'userEmail',
        type: 'string',
        default: '',
        description: 'Filter by customer email',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: ORDER_STATUSES,
        default: '',
        description: 'Filter by order status',
      },
      {
        displayName: 'Refunded',
        name: 'refunded',
        type: 'boolean',
        default: false,
        description: 'Filter by refunded status',
      },
    ],
  },
];
