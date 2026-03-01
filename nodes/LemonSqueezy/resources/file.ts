import type { INodeProperties } from 'n8n-workflow';

export const fileOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['file'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get a file',
      description: 'Retrieve a single file by ID',
    },
    {
      name: 'Download',
      value: 'download',
      action: 'Download a file',
      description: 'Download a file as binary data',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many files',
      description: 'Retrieve multiple files',
    },
  ],
  default: 'getAll',
};

export const fileFields: INodeProperties[] = [
  // File ID for Get operation
  {
    displayName: 'File ID',
    name: 'fileId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g., 12345',
    description: 'The ID of the file (numeric string)',
    displayOptions: {
      show: { resource: ['file'], operation: ['get', 'download'] },
    },
  },
  // Binary Property Name for Download
  {
    displayName: 'Binary Property',
    name: 'binaryPropertyName',
    type: 'string',
    default: 'data',
    description: 'Name of the binary property to write the downloaded file to',
    displayOptions: {
      show: { resource: ['file'], operation: ['download'] },
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
      show: { resource: ['file'], operation: ['getAll'] },
    },
  },
  // Limit
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return (API maximum is 100 per page)',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['file'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['file'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        default: '',
        placeholder: 'e.g., 12345',
        description: 'Filter files by variant ID',
      },
    ],
  },
];
