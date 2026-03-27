import type {
  IExecuteFunctions,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  IDataObject,
} from 'n8n-workflow';
import { RESOURCE_ENDPOINTS, RESOURCE_ID_PARAMS } from './constants';
import {
  lemonSqueezyApiRequest,
  lemonSqueezyApiRequestAllItems,
  buildFilterParams,
  buildJsonApiBody,
  validateField,
  validateDiscountAmount,
  simplifyResponse,
} from './helpers';
import { resourceProperty, allOperations, allFields } from './resources';
import type { LemonSqueezyResponse } from './types';
import { handleCreate, handleUpdate } from './handlers';

export class LemonSqueezy implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Lemon Squeezy',
    name: 'lemonSqueezy',
    icon: 'file:lemonSqueezy.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Lemon Squeezy API',
    defaults: {
      name: 'Lemon Squeezy',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'lemonSqueezyApi',
        required: true,
      },
    ],
    properties: [
      resourceProperty,
      ...allOperations,
      ...allFields,
      {
        displayName: 'Simplify',
        name: 'simplifyOutput',
        type: 'boolean',
        default: true,
        description:
          'Whether to simplify the response by flattening JSON:API attributes to the top level. Disable to get the raw JSON:API format with type, attributes, and relationships.',
      },
      {
        displayName: 'Retry Options',
        name: 'retryOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        description: 'Configure retry behavior for failed API requests',
        options: [
          {
            displayName: 'Max Retries',
            name: 'maxRetries',
            type: 'number',
            default: 3,
            description: 'Maximum number of retry attempts for failed requests (0 to disable)',
            typeOptions: { minValue: 0, maxValue: 10 },
          },
          {
            displayName: 'Initial Delay (Ms)',
            name: 'initialDelayMs',
            type: 'number',
            default: 1000,
            description:
              'Initial delay in milliseconds before the first retry (doubles each retry)',
            typeOptions: { minValue: 100, maxValue: 30000 },
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);
    const simplifyOutput = this.getNodeParameter('simplifyOutput', 0, true) as boolean;

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[] | undefined;

        const endpoint = RESOURCE_ENDPOINTS[resource];

        // Validate that the resource exists in our endpoints mapping
        if (!endpoint && !['user'].includes(resource)) {
          throw new Error(`Unknown resource: ${resource}`);
        }

        if (operation === 'get') {
          const idParam = RESOURCE_ID_PARAMS[resource];
          const id = this.getNodeParameter(idParam, i) as string;
          responseData = await lemonSqueezyApiRequest.call(this, 'GET', `/${endpoint}/${id}`);
        } else if (operation === 'getAll') {
          const returnAll = this.getNodeParameter('returnAll', i) as boolean;
          const filters = this.getNodeParameter('filters', i, {});
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as IDataObject;
          const qs = buildFilterParams(filters);

          // Apply sorting if specified
          if (advancedOptions.sortField) {
            const sortDirection = (advancedOptions.sortDirection as string) || 'desc';
            const sortPrefix = sortDirection === 'desc' ? '-' : '';
            qs.sort = `${sortPrefix}${advancedOptions.sortField as string}`;
          }

          // Apply relationship expansion if specified
          if (advancedOptions.include && Array.isArray(advancedOptions.include)) {
            const includes = advancedOptions.include as string[];
            if (includes.length > 0) {
              qs.include = includes.join(',');
            }
          }

          if (returnAll) {
            // Convert pagination timeout from seconds to milliseconds (0 = no timeout)
            const paginationTimeout = (advancedOptions.paginationTimeout as number) ?? 300;
            responseData = await lemonSqueezyApiRequestAllItems.call(
              this,
              'GET',
              `/${endpoint}`,
              qs,
              {
                timeout: paginationTimeout > 0 ? paginationTimeout * 1000 : 0,
              },
            );
          } else {
            const limit = this.getNodeParameter('limit', i);
            qs['page[size]'] = limit;
            const response = await lemonSqueezyApiRequest.call(
              this,
              'GET',
              `/${endpoint}`,
              undefined,
              qs,
            );
            responseData = (response as unknown as LemonSqueezyResponse).data;
          }

          // Post-filter: subscription renewals within N days
          if (resource === 'subscription' && Array.isArray(responseData)) {
            const renewsWithinDays = filters.renewsWithinDays;
            if (renewsWithinDays && Number(renewsWithinDays) > 0) {
              const now = new Date();
              const cutoff = new Date(
                now.getTime() + Number(renewsWithinDays) * 24 * 60 * 60 * 1000,
              );
              responseData = responseData.filter((sub: IDataObject) => {
                const attrs = (sub.attributes ?? sub) as IDataObject;
                const renewsAt = attrs.renews_at as string;
                const status = attrs.status as string;
                if (!renewsAt || !['active', 'on_trial'].includes(status)) {
                  return false;
                }
                const renewDate = new Date(renewsAt);
                return renewDate >= now && renewDate <= cutoff;
              });
            }
          }
        } else if (operation === 'getManyById') {
          const batchIdParamMap: Record<string, string> = {
            order: 'batchOrderIds',
            customer: 'batchCustomerIds',
            subscription: 'batchSubscriptionIds',
          };
          const batchParam = batchIdParamMap[resource];
          if (!batchParam) {
            throw new Error(`getManyById not supported for resource: ${resource}`);
          }
          const idsRaw = this.getNodeParameter(batchParam, i) as string;
          const ids = idsRaw
            .split(',')
            .map((id: string) => id.trim())
            .filter((id: string) => id.length > 0);
          if (ids.length === 0) {
            throw new Error('At least one ID is required');
          }
          const batchResults = await Promise.all(
            ids.map((id: string) =>
              lemonSqueezyApiRequest
                .call(this, 'GET', `/${endpoint}/${id}`)
                .catch((err: Error) => ({ error: err.message, id })),
            ),
          );
          responseData = batchResults as IDataObject[];
        } else if (operation === 'create') {
          responseData = await handleCreate(this, resource, i);
        } else if (operation === 'update') {
          responseData = await handleUpdate(this, resource, i);
        } else if (operation === 'delete' && resource === 'customer') {
          const customerId = this.getNodeParameter('customerId', i) as string;
          const body = buildJsonApiBody('customers', { status: 'archived' }, undefined, customerId);
          responseData = await lemonSqueezyApiRequest.call(
            this,
            'PATCH',
            `/customers/${customerId}`,
            body,
          );
        } else if (operation === 'delete') {
          const idParam = RESOURCE_ID_PARAMS[resource];
          const id = this.getNodeParameter(idParam, i) as string;
          responseData = await lemonSqueezyApiRequest.call(this, 'DELETE', `/${endpoint}/${id}`);
        } else if (operation === 'cancel' && resource === 'subscription') {
          const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
          responseData = await lemonSqueezyApiRequest.call(
            this,
            'DELETE',
            `/subscriptions/${subscriptionId}`,
          );
        } else if (operation === 'resume' && resource === 'subscription') {
          const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
          const body = buildJsonApiBody(
            'subscriptions',
            { pause: null },
            undefined,
            subscriptionId,
          );
          responseData = await lemonSqueezyApiRequest.call(
            this,
            'PATCH',
            `/subscriptions/${subscriptionId}`,
            body,
          );
        } else if (operation === 'pause' && resource === 'subscription') {
          const subscriptionId = this.getNodeParameter('subscriptionId', i) as string;
          const pauseMode = this.getNodeParameter('pauseMode', i) as string;
          const body = buildJsonApiBody(
            'subscriptions',
            { pause: { mode: pauseMode } },
            undefined,
            subscriptionId,
          );
          responseData = await lemonSqueezyApiRequest.call(
            this,
            'PATCH',
            `/subscriptions/${subscriptionId}`,
            body,
          );
        } else if (operation === 'generateInvoice' && resource === 'order') {
          const orderId = this.getNodeParameter('orderId', i) as string;
          const invoiceName = this.getNodeParameter('invoiceName', i) as string;
          const invoiceAddress = this.getNodeParameter('invoiceAddress', i) as string;
          const invoiceCity = this.getNodeParameter('invoiceCity', i) as string;
          const invoiceZipCode = this.getNodeParameter('invoiceZipCode', i) as string;
          const invoiceCountry = this.getNodeParameter('invoiceCountry', i) as string;
          const invoiceOptions = this.getNodeParameter('invoiceOptions', i, {}) as IDataObject;

          const qs: Record<string, string> = {
            name: invoiceName,
            address: invoiceAddress,
            city: invoiceCity,
            zip_code: invoiceZipCode,
            country: invoiceCountry,
          };

          if (invoiceOptions.state) {
            qs.state = invoiceOptions.state as string;
          }
          if (invoiceOptions.notes) {
            qs.notes = invoiceOptions.notes as string;
          }
          if (invoiceOptions.locale) {
            qs.locale = invoiceOptions.locale as string;
          }

          responseData = await lemonSqueezyApiRequest.call(
            this,
            'POST',
            `/orders/${orderId}/generate-invoice`,
            {},
            qs,
          );

          // Download invoice PDF if requested
          const orderDownloadPdf = this.getNodeParameter('downloadPdf', i, false) as boolean;
          if (orderDownloadPdf && responseData) {
            const invoiceResponse = responseData as unknown as Record<
              string,
              Record<string, Record<string, string>>
            >;
            const pdfUrl = invoiceResponse?.meta?.urls?.download_invoice;
            if (pdfUrl) {
              const binaryProp = this.getNodeParameter(
                'invoiceBinaryProperty',
                i,
                'data',
              ) as string;
              const pdfResponse = await this.helpers.httpRequest({
                method: 'GET',
                url: pdfUrl,
                encoding: 'arraybuffer',
                returnFullResponse: true,
              });
              const binaryData = await this.helpers.prepareBinaryData(
                Buffer.from(pdfResponse.body as ArrayBuffer),
                `order-${orderId}-invoice.pdf`,
                'application/pdf',
              );
              const execItem = this.helpers.constructExecutionMetaData(
                [{ json: responseData ?? {}, binary: { [binaryProp]: binaryData } }],
                { itemData: { item: i } },
              );
              returnData.push(...execItem);
              continue;
            }
          }
        } else if (operation === 'getCurrentUsage' && resource === 'subscriptionItem') {
          const subscriptionItemId = this.getNodeParameter('subscriptionItemId', i) as string;
          responseData = await lemonSqueezyApiRequest.call(
            this,
            'GET',
            `/subscription-items/${subscriptionItemId}/current-usage`,
          );
        } else if (operation === 'refund' && resource === 'order') {
          const orderId = this.getNodeParameter('orderId', i) as string;
          const refundAmount = this.getNodeParameter('orderRefundAmount', i, 0) as number;

          const body: IDataObject =
            refundAmount > 0
              ? { data: { type: 'orders', id: orderId, attributes: { amount: refundAmount } } }
              : {};

          responseData = await lemonSqueezyApiRequest.call(
            this,
            'POST',
            `/orders/${orderId}/refund`,
            body,
          );
        } else if (resource === 'licenseKey') {
          if (operation === 'validate') {
            const licenseKey = this.getNodeParameter('licenseKey', i) as string;
            responseData = await lemonSqueezyApiRequest.call(this, 'POST', '/licenses/validate', {
              license_key: licenseKey,
            });
          } else if (operation === 'activate') {
            const licenseKey = this.getNodeParameter('licenseKey', i) as string;
            const instanceName = this.getNodeParameter('instanceName', i) as string;
            responseData = await lemonSqueezyApiRequest.call(this, 'POST', '/licenses/activate', {
              license_key: licenseKey,
              instance_name: instanceName,
            });
          } else if (operation === 'deactivate') {
            const licenseKey = this.getNodeParameter('licenseKey', i) as string;
            const instanceId = this.getNodeParameter('instanceId', i) as string;
            responseData = await lemonSqueezyApiRequest.call(this, 'POST', '/licenses/deactivate', {
              license_key: licenseKey,
              instance_id: instanceId,
            });
          } else if (operation === 'bulkActivate') {
            const bulkKeysRaw = this.getNodeParameter('bulkActivateKeys', i) as string;
            let keyList: unknown;
            try {
              keyList = typeof bulkKeysRaw === 'string' ? JSON.parse(bulkKeysRaw) : bulkKeysRaw;
            } catch {
              throw new Error(
                'License keys must be valid JSON. Example: [{"license_key":"...","instance_name":"..."}]',
              );
            }

            if (!Array.isArray(keyList) || keyList.length === 0) {
              throw new Error('License keys must be a non-empty JSON array');
            }

            const activateResults = await Promise.all(
              (keyList as IDataObject[]).map((entry: IDataObject) =>
                lemonSqueezyApiRequest
                  .call(this, 'POST', '/licenses/activate', {
                    license_key: entry.license_key,
                    instance_name: entry.instance_name,
                  })
                  .catch((err: Error) => ({
                    error: err.message,
                    license_key: entry.license_key,
                  })),
              ),
            );
            responseData = activateResults as IDataObject[];
          } else if (operation === 'bulkDeactivate') {
            const bulkDeactivateRaw = this.getNodeParameter('bulkDeactivateKeys', i) as string;
            let deactivateList: unknown;
            try {
              deactivateList =
                typeof bulkDeactivateRaw === 'string'
                  ? JSON.parse(bulkDeactivateRaw)
                  : bulkDeactivateRaw;
            } catch {
              throw new Error(
                'License key instances must be valid JSON. Example: [{"license_key":"...","instance_id":"..."}]',
              );
            }

            if (!Array.isArray(deactivateList) || deactivateList.length === 0) {
              throw new Error('License key instances must be a non-empty JSON array');
            }

            const deactivateResults = await Promise.all(
              (deactivateList as IDataObject[]).map((entry: IDataObject) =>
                lemonSqueezyApiRequest
                  .call(this, 'POST', '/licenses/deactivate', {
                    license_key: entry.license_key,
                    instance_id: entry.instance_id,
                  })
                  .catch((err: Error) => ({
                    error: err.message,
                    license_key: entry.license_key,
                  })),
              ),
            );
            responseData = deactivateResults as IDataObject[];
          }
        } else if (resource === 'user' && operation === 'getCurrent') {
          responseData = await lemonSqueezyApiRequest.call(this, 'GET', '/users/me');
        } else if (resource === 'customer' && operation === 'lookupByEmail') {
          const lookupEmail = this.getNodeParameter('lookupEmail', i) as string;
          validateField('email', lookupEmail, 'email');
          const lookupResponse = await lemonSqueezyApiRequest.call(
            this,
            'GET',
            '/customers',
            undefined,
            { 'filter[email]': lookupEmail },
          );
          const customers = (lookupResponse as unknown as LemonSqueezyResponse)
            .data as IDataObject[];
          if (!customers || customers.length === 0) {
            throw new Error(`No customer found with email: ${lookupEmail}`);
          }
          responseData = customers[0];
        } else if (resource === 'customer' && operation === 'upsert') {
          const upsertEmail = this.getNodeParameter('upsertEmail', i) as string;
          const upsertName = this.getNodeParameter('upsertName', i) as string;
          const upsertStoreId = this.getNodeParameter('upsertStoreId', i) as string;
          const upsertUpdateFields = this.getNodeParameter(
            'upsertUpdateFields',
            i,
            {},
          ) as IDataObject;

          validateField('email', upsertEmail, 'email');

          // Try to find existing customer
          const lookupResp = await lemonSqueezyApiRequest.call(
            this,
            'GET',
            '/customers',
            undefined,
            { 'filter[email]': upsertEmail },
          );
          const existingCustomers = (lookupResp as unknown as LemonSqueezyResponse)
            .data as IDataObject[];

          if (existingCustomers && existingCustomers.length > 0) {
            // Customer exists — update if fields provided
            const existing = existingCustomers[0];
            const existingId = existing.id as string;
            const hasUpdates = Object.keys(upsertUpdateFields).some(
              (key) =>
                upsertUpdateFields[key] !== undefined &&
                upsertUpdateFields[key] !== null &&
                upsertUpdateFields[key] !== '',
            );

            if (hasUpdates) {
              const updateAttrs: IDataObject = {};
              for (const [key, value] of Object.entries(upsertUpdateFields)) {
                if (value !== undefined && value !== null && value !== '') {
                  updateAttrs[key] = value;
                }
              }
              const updateBody = buildJsonApiBody('customers', updateAttrs, undefined, existingId);
              responseData = await lemonSqueezyApiRequest.call(
                this,
                'PATCH',
                `/customers/${existingId}`,
                updateBody,
              );
            } else {
              responseData = existing;
            }
          } else {
            // Customer not found — create
            const createBody = buildJsonApiBody(
              'customers',
              { name: upsertName, email: upsertEmail },
              { store: { type: 'stores', id: upsertStoreId } },
            );
            responseData = await lemonSqueezyApiRequest.call(
              this,
              'POST',
              '/customers',
              createBody,
            );
          }
        } else if (resource === 'store' && operation === 'getRevenueSummary') {
          const revStoreId = this.getNodeParameter('revenueSummaryStoreId', i) as string;
          const storeResponse = await lemonSqueezyApiRequest.call(
            this,
            'GET',
            `/stores/${revStoreId}`,
          );
          const storeData = (storeResponse as unknown as LemonSqueezyResponse).data as IDataObject;
          const attrs = (storeData?.attributes ?? {}) as IDataObject;
          responseData = {
            id: storeData?.id,
            name: attrs.name,
            currency: attrs.currency,
            currency_rate: attrs.currency_rate,
            total_revenue: attrs.total_revenue,
            total_sales: attrs.total_sales,
            thirty_day_revenue: attrs.thirty_day_revenue,
            thirty_day_sales: attrs.thirty_day_sales,
            mrr: attrs.mrr,
          } as IDataObject;
        } else if (resource === 'store' && operation === 'getAnalytics') {
          const analyticsStoreId = this.getNodeParameter('analyticsStoreId', i) as string;

          // Fetch store data for revenue summary
          const analyticsStoreResp = await lemonSqueezyApiRequest.call(
            this,
            'GET',
            `/stores/${analyticsStoreId}`,
          );
          const analyticsStore = (analyticsStoreResp as unknown as LemonSqueezyResponse)
            .data as IDataObject;
          const storeAttrs = (analyticsStore?.attributes ?? {}) as IDataObject;

          // Safety limits to prevent unbounded API fetches
          const analyticsLimits = { maxItems: 10000, timeout: 120000 };

          // Fetch products, subscriptions, and orders for this store
          const products = await lemonSqueezyApiRequestAllItems.call(
            this,
            'GET',
            '/products',
            { 'filter[store_id]': analyticsStoreId },
            analyticsLimits,
          );

          const subscriptions = await lemonSqueezyApiRequestAllItems.call(
            this,
            'GET',
            '/subscriptions',
            { 'filter[store_id]': analyticsStoreId },
            analyticsLimits,
          );

          const orders = await lemonSqueezyApiRequestAllItems.call(
            this,
            'GET',
            '/orders',
            { 'filter[store_id]': analyticsStoreId },
            analyticsLimits,
          );

          // Revenue by product
          const revenueByProduct: IDataObject[] = products.map((product) => {
            const pAttrs = (product.attributes ?? {}) as IDataObject;
            const productOrders = orders.filter((order) => {
              const oAttrs = (order.attributes ?? order) as IDataObject;
              const firstItem = oAttrs.first_order_item as IDataObject | undefined;
              return firstItem && String(firstItem.product_id) === String(product.id);
            });
            const productRevenue = productOrders.reduce((sum, order) => {
              const oAttrs = (order.attributes ?? order) as IDataObject;
              return sum + ((oAttrs.total as number) || 0);
            }, 0);
            return {
              product_id: product.id,
              product_name: pAttrs.name,
              order_count: productOrders.length,
              total_revenue: productRevenue,
            };
          });

          // Churn analysis
          const totalSubs = subscriptions.length;
          const cancelledSubs = subscriptions.filter((sub) => {
            const sAttrs = (sub.attributes ?? sub) as IDataObject;
            return sAttrs.status === 'cancelled' || sAttrs.status === 'expired';
          }).length;
          const activeSubs = subscriptions.filter((sub) => {
            const sAttrs = (sub.attributes ?? sub) as IDataObject;
            return sAttrs.status === 'active' || sAttrs.status === 'on_trial';
          }).length;
          const churnRate = totalSubs > 0 ? cancelledSubs / totalSubs : 0;

          // LTV (simple: total revenue / total customers who have ordered)
          const uniqueCustomerIds = new Set(
            orders.map((order) => {
              const oAttrs = (order.attributes ?? order) as IDataObject;
              return String(oAttrs.customer_id);
            }),
          );
          const ltv =
            uniqueCustomerIds.size > 0
              ? ((storeAttrs.total_revenue as number) || 0) / uniqueCustomerIds.size
              : 0;

          responseData = {
            store_id: analyticsStoreId,
            store_name: storeAttrs.name,
            currency: storeAttrs.currency,
            total_revenue: storeAttrs.total_revenue,
            total_sales: storeAttrs.total_sales,
            mrr: storeAttrs.mrr,
            thirty_day_revenue: storeAttrs.thirty_day_revenue,
            thirty_day_sales: storeAttrs.thirty_day_sales,
            total_subscriptions: totalSubs,
            active_subscriptions: activeSubs,
            cancelled_subscriptions: cancelledSubs,
            churn_rate: Math.round(churnRate * 10000) / 100,
            unique_customers: uniqueCustomerIds.size,
            customer_ltv: Math.round(ltv),
            revenue_by_product: revenueByProduct,
          } as IDataObject;
        } else if (resource === 'subscriptionInvoice') {
          if (operation === 'generate') {
            const invoiceId = this.getNodeParameter('generateInvoiceId', i) as string;
            const generateName = this.getNodeParameter('generateName', i) as string;
            const generateAddress = this.getNodeParameter('generateAddress', i) as string;
            const generateCity = this.getNodeParameter('generateCity', i) as string;
            const generateZipCode = this.getNodeParameter('generateZipCode', i) as string;
            const generateCountry = this.getNodeParameter('generateCountry', i) as string;
            const generateOptions = this.getNodeParameter('generateOptions', i, {}) as IDataObject;

            const qs: Record<string, string> = {
              name: generateName,
              address: generateAddress,
              city: generateCity,
              zip_code: generateZipCode,
              country: generateCountry,
            };

            if (generateOptions.state) {
              qs.state = generateOptions.state as string;
            }
            if (generateOptions.notes) {
              qs.notes = generateOptions.notes as string;
            }
            if (generateOptions.locale) {
              qs.locale = generateOptions.locale as string;
            }

            responseData = await lemonSqueezyApiRequest.call(
              this,
              'POST',
              `/subscription-invoices/${invoiceId}/generate-invoice`,
              {},
              qs,
            );

            // Download invoice PDF if requested
            const subDownloadPdf = this.getNodeParameter('downloadPdf', i, false) as boolean;
            if (subDownloadPdf && responseData) {
              const subInvoiceResponse = responseData as unknown as Record<
                string,
                Record<string, Record<string, string>>
              >;
              const subPdfUrl = subInvoiceResponse?.meta?.urls?.download_invoice;
              if (subPdfUrl) {
                const subBinaryProp = this.getNodeParameter(
                  'generateBinaryProperty',
                  i,
                  'data',
                ) as string;
                const subPdfResponse = await this.helpers.httpRequest({
                  method: 'GET',
                  url: subPdfUrl,
                  encoding: 'arraybuffer',
                  returnFullResponse: true,
                });
                const subBinaryData = await this.helpers.prepareBinaryData(
                  Buffer.from(subPdfResponse.body as ArrayBuffer),
                  `subscription-invoice-${invoiceId}.pdf`,
                  'application/pdf',
                );
                const subExecItem = this.helpers.constructExecutionMetaData(
                  [{ json: responseData ?? {}, binary: { [subBinaryProp]: subBinaryData } }],
                  { itemData: { item: i } },
                );
                returnData.push(...subExecItem);
                continue;
              }
            }
          } else if (operation === 'refund') {
            const invoiceId = this.getNodeParameter('subscriptionInvoiceId', i) as string;
            const refundAmount = this.getNodeParameter('refundAmount', i, 0) as number;

            const body: IDataObject =
              refundAmount > 0
                ? {
                    data: {
                      type: 'subscription-invoices',
                      id: invoiceId,
                      attributes: { amount: refundAmount },
                    },
                  }
                : {};

            responseData = await lemonSqueezyApiRequest.call(
              this,
              'POST',
              `/subscription-invoices/${invoiceId}/refund`,
              body,
            );
          }
        } else if (resource === 'licenseKeyInstance' && operation === 'deactivate') {
          const licenseKeyStr = this.getNodeParameter('licenseKeyString', i) as string;
          const instanceId = this.getNodeParameter('deactivateInstanceId', i) as string;
          responseData = await lemonSqueezyApiRequest.call(this, 'POST', '/licenses/deactivate', {
            license_key: licenseKeyStr,
            instance_id: instanceId,
          });
        } else if (resource === 'file' && operation === 'download') {
          const fileId = this.getNodeParameter('fileId', i) as string;
          const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data');

          // Fetch file metadata to get the download URL
          const fileResponse = await lemonSqueezyApiRequest.call(this, 'GET', `/files/${fileId}`);
          const fileData = fileResponse.data as IDataObject;
          const fileAttrs = (fileData?.attributes ?? {}) as IDataObject;
          const downloadUrl = fileAttrs?.download_url as string;
          const fileName = (fileAttrs?.name as string) || `file-${fileId}`;
          const mimeType = (fileAttrs?.mime_type as string) || 'application/octet-stream';

          if (!downloadUrl) {
            throw new Error(`No download URL available for file ${fileId}`);
          }

          // Download the binary content
          const binaryResponse = await this.helpers.httpRequest({
            method: 'GET',
            url: downloadUrl,
            encoding: 'arraybuffer',
            returnFullResponse: true,
          });

          const binaryData = await this.helpers.prepareBinaryData(
            Buffer.from(binaryResponse.body as ArrayBuffer),
            fileName,
            mimeType,
          );

          const executionItem = this.helpers.constructExecutionMetaData(
            [
              {
                json: { id: fileId, ...fileAttrs },
                binary: { [binaryPropertyName]: binaryData },
              },
            ],
            { itemData: { item: i } },
          );
          returnData.push(...executionItem);
          continue;
        } else if (resource === 'discount' && operation === 'bulkCreate') {
          const bulkStoreId = this.getNodeParameter('bulkDiscountStoreId', i) as string;
          const bulkCodesRaw = this.getNodeParameter('bulkDiscountCodes', i) as string;
          let discountList: unknown;
          try {
            discountList =
              typeof bulkCodesRaw === 'string' ? JSON.parse(bulkCodesRaw) : bulkCodesRaw;
          } catch {
            throw new Error(
              'Discount codes must be valid JSON. Example: [{"name":"10% Off","code":"SAVE10","amount":10,"amount_type":"percent"}]',
            );
          }

          if (!Array.isArray(discountList) || discountList.length === 0) {
            throw new Error('Discount codes must be a non-empty JSON array');
          }

          const bulkResults = await Promise.all(
            (discountList as IDataObject[]).map((disc: IDataObject) => {
              validateDiscountAmount(disc.amount as number, disc.amount_type as string);

              const discAttrs: IDataObject = {
                name: disc.name,
                code: disc.code,
                amount: disc.amount,
                amount_type: disc.amount_type,
              };
              if (disc.duration) {
                discAttrs.duration = disc.duration;
              }
              if (disc.duration_in_months) {
                discAttrs.duration_in_months = disc.duration_in_months;
              }
              if (disc.max_redemptions) {
                discAttrs.max_redemptions = disc.max_redemptions;
                discAttrs.is_limited_redemptions = true;
              }
              if (disc.starts_at) {
                discAttrs.starts_at = disc.starts_at;
              }
              if (disc.expires_at) {
                discAttrs.expires_at = disc.expires_at;
              }

              const discBody = buildJsonApiBody('discounts', discAttrs, {
                store: { type: 'stores', id: bulkStoreId },
              });

              return lemonSqueezyApiRequest
                .call(this, 'POST', '/discounts', discBody)
                .catch((err: Error) => ({
                  error: err.message,
                  code: disc.code,
                }));
            }),
          );
          responseData = bulkResults as IDataObject[];
        }

        // Apply output simplification if enabled
        const outputData =
          simplifyOutput && responseData
            ? simplifyResponse(responseData as IDataObject)
            : responseData;

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(outputData as IDataObject[]),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: (error as Error).message },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }

  methods = {
    loadOptions: {
      async getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const response = await lemonSqueezyApiRequestAllItems.call(
          this as unknown as IExecuteFunctions,
          'GET',
          '/stores',
          {},
        );
        return response.map((store) => ({
          name: (store.attributes as IDataObject).name as string,
          value: store.id as string,
        }));
      },

      async getProducts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const response = await lemonSqueezyApiRequestAllItems.call(
          this as unknown as IExecuteFunctions,
          'GET',
          '/products',
          {},
        );
        return response.map((product) => {
          const attrs = product.attributes as IDataObject;
          return {
            name: attrs.name as string,
            value: product.id as string,
            description: `Store: ${(attrs.store_id as string) ?? ''}`,
          };
        });
      },

      async getVariants(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        // If a store is selected, filter variants to that store's products
        const selectedStoreId = this.getCurrentNodeParameter('checkoutStoreId') as
          | string
          | undefined;

        const variants = await lemonSqueezyApiRequestAllItems.call(
          this as unknown as IExecuteFunctions,
          'GET',
          '/variants',
          {},
        );

        let filteredVariants = variants;
        if (selectedStoreId) {
          // Fetch products for the selected store to get valid product IDs
          const products = await lemonSqueezyApiRequestAllItems.call(
            this as unknown as IExecuteFunctions,
            'GET',
            '/products',
            { 'filter[store_id]': selectedStoreId },
          );
          const productIds = new Set(products.map((p) => String(p.id)));
          filteredVariants = variants.filter((v) => {
            const attrs = v.attributes as IDataObject;
            return productIds.has(String(attrs.product_id));
          });
        }

        return filteredVariants.map((variant) => {
          const attrs = variant.attributes as IDataObject;
          return {
            name: `${attrs.name as string} (${variant.id})`,
            value: variant.id as string,
            description: `Product ID: ${(attrs.product_id as string) ?? ''}`,
          };
        });
      },

      async getDiscounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const response = await lemonSqueezyApiRequestAllItems.call(
          this as unknown as IExecuteFunctions,
          'GET',
          '/discounts',
          {},
        );
        return response.map((discount) => {
          const attrs = discount.attributes as IDataObject;
          return {
            name: `${attrs.name as string} (${attrs.code as string})`,
            value: discount.id as string,
          };
        });
      },
    },
  };
}
