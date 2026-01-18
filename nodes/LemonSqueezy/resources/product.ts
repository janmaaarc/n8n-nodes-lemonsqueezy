import type { INodeProperties } from 'n8n-workflow';
import { PRODUCT_STATUSES } from '../constants';

export const productOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['product'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get a product',
      description: 'Retrieve a single product by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many products',
      description: 'Retrieve multiple products',
    },
  ],
  default: 'getAll',
};

export const productFields: INodeProperties[] = [
  // Product ID for Get operation
  {
    displayName: 'Product ID',
    name: 'productId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the product to retrieve',
    displayOptions: {
      show: { resource: ['product'], operation: ['get'] },
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
      show: { resource: ['product'], operation: ['getAll'] },
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
      show: { resource: ['product'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['product'], operation: ['getAll'] },
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
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: PRODUCT_STATUSES,
        default: '',
        description: 'Filter by product status',
      },
    ],
  },
];
