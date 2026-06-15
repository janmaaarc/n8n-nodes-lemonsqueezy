/**
 * Product Resource
 *
 * Available operations:
 * - Create: Create a new product in a store
 * - Delete: Delete a product
 * - Get: Retrieve a single product by ID
 * - Get Many: Retrieve multiple products with filtering
 * - Update: Update a product
 *
 * @see https://docs.lemonsqueezy.com/api/products
 */
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
      name: 'Create',
      value: 'create',
      action: 'Create a product',
      description: 'Create a new product in a store',
    },
    {
      name: 'Delete',
      value: 'delete',
      action: 'Delete a product',
      description: 'Delete a product',
    },
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
    {
      name: 'Update',
      value: 'update',
      action: 'Update a product',
      description: 'Update an existing product',
    },
  ],
  default: 'getAll',
};

export const productFields: INodeProperties[] = [
  {
    displayName: 'Product ID',
    name: 'productId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the product',
    displayOptions: {
      show: { resource: ['product'], operation: ['get', 'update', 'delete'] },
    },
  },
  {
    displayName: 'Store',
    name: 'productStoreId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getStores' },
    required: true,
    default: '',
    description:
      'The store to create the product in. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: { resource: ['product'], operation: ['create'] },
    },
  },
  {
    displayName: 'Name',
    name: 'productName',
    type: 'string',
    required: true,
    default: '',
    description: 'The name of the product',
    displayOptions: {
      show: { resource: ['product'], operation: ['create'] },
    },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['product'], operation: ['create'] },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        description: 'The product description (HTML supported)',
      },
      {
        displayName: 'Pay What You Want',
        name: 'payWhatYouWant',
        type: 'boolean',
        default: false,
        description: 'Whether customers can choose their own price',
      },
      {
        displayName: 'Slug',
        name: 'slug',
        type: 'string',
        default: '',
        description: 'A unique slug for the product (auto-generated if not provided)',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: PRODUCT_STATUSES,
        default: 'draft',
        description: 'The product status',
      },
      {
        displayName: 'Test Mode',
        name: 'testMode',
        type: 'boolean',
        default: false,
        description: 'Whether to create the product in test mode',
      },
    ],
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: { resource: ['product'], operation: ['update'] },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        typeOptions: { rows: 3 },
        default: '',
        description: 'The product description (HTML supported)',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'The name of the product',
      },
      {
        displayName: 'Pay What You Want',
        name: 'payWhatYouWant',
        type: 'boolean',
        default: false,
        description: 'Whether customers can choose their own price',
      },
      {
        displayName: 'Slug',
        name: 'slug',
        type: 'string',
        default: '',
        description: 'A unique slug for the product',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: PRODUCT_STATUSES,
        default: 'draft',
        description: 'The product status',
      },
    ],
  },
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
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    description: 'Max number of results to return (API maximum is 100 per page)',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: { resource: ['product'], operation: ['getAll'], returnAll: [false] },
    },
  },
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
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [{ name: 'Any', value: '' }, ...PRODUCT_STATUSES],
        default: '',
        description: 'Filter by product status',
      },
      {
        displayName: 'Store ID',
        name: 'storeId',
        type: 'string',
        default: '',
        description: 'Filter by store ID',
      },
    ],
  },
];
