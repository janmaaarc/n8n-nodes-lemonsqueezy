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
      description: 'Retrieve multiple stores',
    },
    {
      name: 'Get Revenue Summary',
      value: 'getRevenueSummary',
      action: 'Get store revenue summary',
      description: 'Get revenue metrics for a store (total revenue, MRR, 30-day stats)',
    },
  ],
  default: 'getAll',
};

export const storeFields: INodeProperties[] = [
  {
    displayName: 'Store ID',
    name: 'storeId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the store',
    displayOptions: {
      show: { resource: ['store'], operation: ['get'] },
    },
  },
  // Revenue Summary
  {
    displayName: 'Store',
    name: 'revenueSummaryStoreId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getStores',
    },
    required: true,
    default: '',
    description:
      'The store to get revenue metrics for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: { resource: ['store'], operation: ['getRevenueSummary'] },
    },
  },
  // Get All
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
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return (API maximum is 100 per page)',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['store'], operation: ['getAll'], returnAll: [false] },
    },
  },
];
