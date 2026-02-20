import type { INodeProperties } from 'n8n-workflow';

export const storeOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['store'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get a store',
      description: 'Retrieve a single store by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many stores',
      description: 'Retrieve all stores',
    },
  ],
  default: 'getAll',
};

export const storeFields: INodeProperties[] = [
  // Store ID for Get operation
  {
    displayName: 'Store ID',
    name: 'storeId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the store to retrieve',
    displayOptions: {
      show: { resource: ['store'], operation: ['get'] },
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
      show: { resource: ['store'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['store'], operation: ['getAll'], returnAll: [false] },
    },
  },
];
