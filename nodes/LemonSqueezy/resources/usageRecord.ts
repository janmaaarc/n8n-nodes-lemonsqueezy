import type { INodeProperties } from 'n8n-workflow';

export const usageRecordOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['usageRecord'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        description: 'Get a usage record by ID',
        action: 'Get a usage record',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many usage records',
        action: 'Get many usage records',
      },
    ],
    default: 'getAll',
  },
];

export const usageRecordFields: INodeProperties[] = [
  // Get
  {
    displayName: 'Usage Record ID',
    name: 'usageRecordId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['usageRecord'],
        operation: ['get'],
      },
    },
    description: 'The ID of the usage record to retrieve',
  },

  // Get All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['usageRecord'],
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
        resource: ['usageRecord'],
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
        resource: ['usageRecord'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'Subscription Item ID',
        name: 'subscriptionItemId',
        type: 'string',
        default: '',
        description: 'Filter by subscription item ID',
      },
    ],
  },
];
