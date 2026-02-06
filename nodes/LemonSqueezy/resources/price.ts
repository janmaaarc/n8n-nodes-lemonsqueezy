/**
 * Price Resource
 *
 * Provides read-only operations for prices in Lemon Squeezy.
 * Prices represent pricing options added to variants. When a variant's
 * pricing changes, a new price object is created.
 *
 * Available operations:
 * - Get: Retrieve a single price by ID
 * - Get Many: Retrieve multiple prices with filtering
 *
 * @see https://docs.lemonsqueezy.com/api/prices
 */
import type { INodeProperties } from 'n8n-workflow';

export const priceOperations: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: { resource: ['price'] },
  },
  options: [
    {
      name: 'Get',
      value: 'get',
      action: 'Get a price',
      description: 'Retrieve a single price by ID',
    },
    {
      name: 'Get Many',
      value: 'getAll',
      action: 'Get many prices',
      description: 'Retrieve multiple prices',
    },
  ],
  default: 'getAll',
};

export const priceFields: INodeProperties[] = [
  // Price ID for Get operation
  {
    displayName: 'Price ID',
    name: 'priceId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID of the price to retrieve',
    displayOptions: {
      show: { resource: ['price'], operation: ['get'] },
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
      show: { resource: ['price'], operation: ['getAll'] },
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
      show: { resource: ['price'], operation: ['getAll'], returnAll: [false] },
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
      show: { resource: ['price'], operation: ['getAll'] },
    },
    options: [
      {
        displayName: 'Variant ID',
        name: 'variantId',
        type: 'string',
        default: '',
        description: 'Filter by variant ID',
      },
    ],
  },
];
