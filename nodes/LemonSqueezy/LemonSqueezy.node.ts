import type {
  IExecuteFunctions,
  INodeExecutionData,
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
} from './helpers';
import { resourceProperty, allOperations, allFields } from './resources';
import type { LemonSqueezyResponse } from './types';

async function handleCreate(
  ctx: IExecuteFunctions,
  resource: string,
  itemIndex: number,
): Promise<IDataObject> {
  if (resource === 'customer') {
    const storeId = ctx.getNodeParameter('customerStoreId', itemIndex) as string;
    const name = ctx.getNodeParameter('customerName', itemIndex) as string;
    const email = ctx.getNodeParameter('customerEmail', itemIndex) as string;
    const additionalFields = ctx.getNodeParameter('additionalFields', itemIndex);

    const body = buildJsonApiBody(
      'customers',
      { name, email, ...additionalFields },
      { store: { type: 'stores', id: storeId } },
    );

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/customers', body);
  }

  if (resource === 'discount') {
    const storeId = ctx.getNodeParameter('discountStoreId', itemIndex) as string;
    const name = ctx.getNodeParameter('discountName', itemIndex) as string;
    const code = ctx.getNodeParameter('discountCode', itemIndex) as string;
    const amount = ctx.getNodeParameter('discountAmount', itemIndex) as number;
    const amountType = ctx.getNodeParameter('discountAmountType', itemIndex) as string;
    const additionalOptions = ctx.getNodeParameter(
      'additionalOptions',
      itemIndex,
      {},
    ) as IDataObject;

    const attributes: IDataObject = {
      name,
      code,
      amount,
      amount_type: amountType,
    };

    if (additionalOptions.duration) {
      attributes.duration = additionalOptions.duration;
    }
    if (additionalOptions.durationInMonths) {
      attributes.duration_in_months = additionalOptions.durationInMonths;
    }
    if (additionalOptions.maxRedemptions) {
      attributes.max_redemptions = additionalOptions.maxRedemptions;
      attributes.is_limited_redemptions = true;
    }
    if (additionalOptions.startsAt) {
      attributes.starts_at = additionalOptions.startsAt;
    }
    if (additionalOptions.expiresAt) {
      attributes.expires_at = additionalOptions.expiresAt;
    }
    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }

    const body = buildJsonApiBody('discounts', attributes, {
      store: { type: 'stores', id: storeId },
    });

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/discounts', body);
  }

  if (resource === 'checkout') {
    const storeId = ctx.getNodeParameter('checkoutStoreId', itemIndex) as string;
    const variantId = ctx.getNodeParameter('checkoutVariantId', itemIndex) as string;
    const additionalOptions = ctx.getNodeParameter(
      'additionalOptions',
      itemIndex,
      {},
    ) as IDataObject;
    const checkoutOptions = ctx.getNodeParameter('checkoutOptions', itemIndex, {}) as IDataObject;

    const attributes: IDataObject = {};
    const checkoutData: IDataObject = {};
    const productOptions: IDataObject = {};
    const checkoutOptionsObj: IDataObject = {};

    if (additionalOptions.customPrice) {
      attributes.custom_price = additionalOptions.customPrice;
    }
    if (additionalOptions.email) {
      checkoutData.email = additionalOptions.email;
    }
    if (additionalOptions.name) {
      checkoutData.name = additionalOptions.name;
    }
    if (additionalOptions.discountCode) {
      checkoutData.discount_code = additionalOptions.discountCode;
    }
    if (additionalOptions.redirectUrl) {
      productOptions.redirect_url = additionalOptions.redirectUrl;
    }
    if (additionalOptions.receiptButtonText) {
      productOptions.receipt_button_text = additionalOptions.receiptButtonText;
    }
    if (additionalOptions.receiptLinkUrl) {
      productOptions.receipt_link_url = additionalOptions.receiptLinkUrl;
    }
    if (additionalOptions.receiptThankYouNote) {
      productOptions.receipt_thank_you_note = additionalOptions.receiptThankYouNote;
    }
    if (additionalOptions.customData !== undefined && additionalOptions.customData !== null) {
      const customDataValue = additionalOptions.customData;
      if (typeof customDataValue === 'string') {
        try {
          const parsed: unknown = JSON.parse(customDataValue);
          if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
            checkoutData.custom = parsed as IDataObject;
          } else {
            throw new Error('customData must be a valid JSON object');
          }
        } catch (error) {
          throw new Error(
            `Invalid customData: ${error instanceof Error ? error.message : 'must be valid JSON object'}`,
          );
        }
      } else if (typeof customDataValue === 'object' && !Array.isArray(customDataValue)) {
        checkoutData.custom = customDataValue as IDataObject;
      } else {
        throw new Error('customData must be a JSON string or object');
      }
    }
    if (additionalOptions.expiresAt) {
      attributes.expires_at = additionalOptions.expiresAt;
    }
    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }

    if (checkoutOptions.dark !== undefined) {
      checkoutOptionsObj.dark = checkoutOptions.dark;
    }
    if (checkoutOptions.embed !== undefined) {
      checkoutOptionsObj.embed = checkoutOptions.embed;
    }
    if (checkoutOptions.logo !== undefined) {
      checkoutOptionsObj.logo = checkoutOptions.logo;
    }
    if (checkoutOptions.desc !== undefined) {
      checkoutOptionsObj.desc = checkoutOptions.desc;
    }
    if (checkoutOptions.media !== undefined) {
      checkoutOptionsObj.media = checkoutOptions.media;
    }
    if (checkoutOptions.discount !== undefined) {
      checkoutOptionsObj.discount = checkoutOptions.discount;
    }
    if (checkoutOptions.buttonColor) {
      checkoutOptionsObj.button_color = checkoutOptions.buttonColor;
    }

    if (Object.keys(checkoutData).length > 0) {
      attributes.checkout_data = checkoutData;
    }
    if (Object.keys(productOptions).length > 0) {
      attributes.product_options = productOptions;
    }
    if (Object.keys(checkoutOptionsObj).length > 0) {
      attributes.checkout_options = checkoutOptionsObj;
    }

    const body = buildJsonApiBody('checkouts', attributes, {
      store: { type: 'stores', id: storeId },
      variant: { type: 'variants', id: variantId },
    });

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/checkouts', body);
  }

  if (resource === 'webhook') {
    const storeId = ctx.getNodeParameter('webhookStoreId', itemIndex) as string;
    const url = ctx.getNodeParameter('webhookUrl', itemIndex) as string;
    const events = ctx.getNodeParameter('webhookEvents', itemIndex) as string[];
    const secret = ctx.getNodeParameter('webhookSecret', itemIndex) as string;
    const additionalOptions = ctx.getNodeParameter(
      'additionalOptions',
      itemIndex,
      {},
    ) as IDataObject;

    const attributes: IDataObject = { url, events, secret };

    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }

    const body = buildJsonApiBody('webhooks', attributes, {
      store: { type: 'stores', id: storeId },
    });

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/webhooks', body);
  }

  throw new Error(`Create operation not supported for resource: ${resource}`);
}

async function handleUpdate(
  ctx: IExecuteFunctions,
  resource: string,
  itemIndex: number,
): Promise<IDataObject> {
  if (resource === 'subscription') {
    const subscriptionId = ctx.getNodeParameter('subscriptionId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.variantId) {
      attributes.variant_id = updateFields.variantId;
    }
    if (updateFields.pause !== undefined && updateFields.pause !== '') {
      attributes.pause = { mode: updateFields.pause };
    } else if (updateFields.pause === '') {
      attributes.pause = null;
    }
    if (updateFields.cancelled !== undefined) {
      attributes.cancelled = updateFields.cancelled;
    }
    if (updateFields.billingAnchor) {
      attributes.billing_anchor = updateFields.billingAnchor;
    }
    if (updateFields.invoiceImmediately !== undefined) {
      attributes.invoice_immediately = updateFields.invoiceImmediately;
    }
    if (updateFields.disableProrations !== undefined) {
      attributes.disable_prorations = updateFields.disableProrations;
    }

    const body = buildJsonApiBody('subscriptions', attributes, undefined, subscriptionId);

    return await lemonSqueezyApiRequest.call(
      ctx,
      'PATCH',
      `/subscriptions/${subscriptionId}`,
      body,
    );
  }

  if (resource === 'customer') {
    const customerId = ctx.getNodeParameter('customerId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.name) {
      attributes.name = updateFields.name;
    }
    if (updateFields.email) {
      attributes.email = updateFields.email;
    }
    if (updateFields.city) {
      attributes.city = updateFields.city;
    }
    if (updateFields.country) {
      attributes.country = updateFields.country;
    }
    if (updateFields.region) {
      attributes.region = updateFields.region;
    }
    if (updateFields.status) {
      attributes.status = updateFields.status;
    }

    const body = buildJsonApiBody('customers', attributes, undefined, customerId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/customers/${customerId}`, body);
  }

  if (resource === 'licenseKey') {
    const licenseKeyId = ctx.getNodeParameter('licenseKeyId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.activationLimit !== undefined) {
      attributes.activation_limit = updateFields.activationLimit;
    }
    if (updateFields.disabled !== undefined) {
      attributes.disabled = updateFields.disabled;
    }
    if (updateFields.expiresAt) {
      attributes.expires_at = updateFields.expiresAt;
    }

    const body = buildJsonApiBody('license-keys', attributes, undefined, licenseKeyId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/license-keys/${licenseKeyId}`, body);
  }

  if (resource === 'webhook') {
    const webhookId = ctx.getNodeParameter('webhookId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.url) {
      attributes.url = updateFields.url;
    }
    if (updateFields.events) {
      attributes.events = updateFields.events;
    }
    if (updateFields.secret) {
      attributes.secret = updateFields.secret;
    }

    const body = buildJsonApiBody('webhooks', attributes, undefined, webhookId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/webhooks/${webhookId}`, body);
  }

  throw new Error(`Update operation not supported for resource: ${resource}`);
}

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
    properties: [resourceProperty, ...allOperations, ...allFields],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      try {
        let responseData: IDataObject | IDataObject[] | undefined;

        const endpoint = RESOURCE_ENDPOINTS[resource];

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
            responseData = await lemonSqueezyApiRequestAllItems.call(
              this,
              'GET',
              `/${endpoint}`,
              qs,
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
        } else if (operation === 'create') {
          responseData = await handleCreate(this, resource, i);
        } else if (operation === 'update') {
          responseData = await handleUpdate(this, resource, i);
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
        } else if (operation === 'refund' && resource === 'order') {
          const orderId = this.getNodeParameter('orderId', i) as string;
          responseData = await lemonSqueezyApiRequest.call(
            this,
            'POST',
            `/orders/${orderId}/refund`,
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
          }
        } else if (resource === 'user' && operation === 'getCurrent') {
          responseData = await lemonSqueezyApiRequest.call(this, 'GET', '/users/me');
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData as IDataObject[]),
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
}
