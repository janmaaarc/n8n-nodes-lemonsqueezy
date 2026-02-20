import type { INodeProperties } from 'n8n-workflow';

export const variantOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['variant'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get a variant',
      description: 'Retrieve a single variant by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many variants',
      description: 'Retrieve multiple variants',
    },
  ],
  default: 'getAll',
};

export const variantFields: INodeProperties[] = [
  // Variant ID for Get operation
  {
    displayName: 'Variant ID',
    name: 'variantId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the variant to retrieve',
    displayOptions: {
      show: { resource: ['variant'], operation: ['get'] },
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
      show: { resource: ['variant'], operation: ['getAll'] },
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
      show: { resource: ['variant'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['variant'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Product ID',
        name: 'productId',
        type: 'string',
        default: '',
        description: 'Filter by product ID',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Pending', value: 'pending' },
          { name: 'Draft', value: 'draft' },
          { name: 'Published', value: 'published' },
        ],
        default: '',
        description: 'Filter by variant status',
      },
    ],
  },
];
