import type { INodeProperties } from 'n8n-workflow';

export const licenseKeyInstanceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['licenseKeyInstance'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        description: 'Get a license key instance by ID',
        action: 'Get a license key instance',
      },
      {
        name: 'Get Many',
        value: 'getAll',
        description: 'Get many license key instances',
        action: 'Get many license key instances',
      },
    ],
    default: 'getAll',
  },
];

export const licenseKeyInstanceFields: INodeProperties[] = [
  // Get
  {
    displayName: 'License Key Instance ID',
    name: 'licenseKeyInstanceId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['licenseKeyInstance'],
        operation: ['get'],
      },
    },
    description: 'The ID of the license key instance to retrieve',
  },

  // Get All
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['licenseKeyInstance'],
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
        resource: ['licenseKeyInstance'],
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
        resource: ['licenseKeyInstance'],
        operation: ['getAll'],
      },
    },
    options: [
      {
        displayName: 'License Key ID',
        name: 'licenseKeyId',
        type: 'string',
        default: '',
        description: 'Filter by license key ID',
      },
    ],
  },
];
