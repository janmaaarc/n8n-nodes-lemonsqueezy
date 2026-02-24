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
  validateCustomDataSize,
  validateObjectDepth,
  simplifyResponse,
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

    // Validate required fields before API call
    validateField('email', email, 'email');

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

    // Validate discount amount based on type
    validateDiscountAmount(amount, amountType);

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
    if (additionalOptions.isLimitedToProducts !== undefined) {
      attributes.is_limited_to_products = additionalOptions.isLimitedToProducts;
    }

    const relationships: Record<
      string,
      { type: string; id: string } | Array<{ type: string; id: string }>
    > = {
      store: { type: 'stores', id: storeId },
    };

    if (additionalOptions.variantIds) {
      const variantIdList = (additionalOptions.variantIds as string)
        .split(',')
        .map((id: string) => id.trim())
        .filter((id: string) => id.length > 0);
      if (variantIdList.length > 0) {
        relationships.variants = variantIdList.map((vid: string) => ({
          type: 'variants',
          id: vid,
        }));
      }
    }

    const body = buildJsonApiBody('discounts', attributes, relationships);

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
      // Validate email before API call
      validateField('email', additionalOptions.email as string, 'email');
      checkoutData.email = additionalOptions.email;
    }
    if (additionalOptions.name) {
      checkoutData.name = additionalOptions.name;
    }
    if (additionalOptions.discountCode) {
      checkoutData.discount_code = additionalOptions.discountCode;
    }
    if (additionalOptions.redirectUrl) {
      // Validate URL before API call
      validateField('redirectUrl', additionalOptions.redirectUrl as string, 'url');
      productOptions.redirect_url = additionalOptions.redirectUrl;
    }
    if (additionalOptions.receiptButtonText) {
      productOptions.receipt_button_text = additionalOptions.receiptButtonText;
    }
    if (additionalOptions.receiptLinkUrl) {
      // Validate URL before API call
      validateField('receiptLinkUrl', additionalOptions.receiptLinkUrl as string, 'url');
      productOptions.receipt_link_url = additionalOptions.receiptLinkUrl;
    }
    if (additionalOptions.receiptThankYouNote) {
      productOptions.receipt_thank_you_note = additionalOptions.receiptThankYouNote;
    }
    if (additionalOptions.customData !== undefined && additionalOptions.customData !== null) {
      const customDataValue = additionalOptions.customData;

      // Validate payload size before processing (max 10KB)
      validateCustomDataSize(customDataValue);

      // Validate nesting depth to prevent stack overflow (max 10 levels)
      validateObjectDepth(customDataValue);

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
    if (additionalOptions.skipTrial !== undefined) {
      checkoutOptionsObj.skip_trial = additionalOptions.skipTrial;
    }
    if (additionalOptions.testMode !== undefined) {
      attributes.test_mode = additionalOptions.testMode;
    }
    if (additionalOptions.billingAddressCountry || additionalOptions.billingAddressZip) {
      const billingAddress: IDataObject = {};
      if (additionalOptions.billingAddressCountry) {
        billingAddress.country = additionalOptions.billingAddressCountry;
      }
      if (additionalOptions.billingAddressZip) {
        billingAddress.zip = additionalOptions.billingAddressZip;
      }
      checkoutData.billing_address = billingAddress;
    }
    if (additionalOptions.taxNumber) {
      checkoutData.tax_number = additionalOptions.taxNumber;
    }
    if (additionalOptions.variantQuantities) {
      const variantQuantities =
        typeof additionalOptions.variantQuantities === 'string'
          ? JSON.parse(additionalOptions.variantQuantities)
          : additionalOptions.variantQuantities;
      checkoutData.variant_quantities = variantQuantities;
    }
    if (additionalOptions.productName) {
      productOptions.name = additionalOptions.productName;
    }
    if (additionalOptions.productDescription) {
      productOptions.description = additionalOptions.productDescription;
    }
    if (additionalOptions.productMedia) {
      productOptions.media = (additionalOptions.productMedia as string)
        .split(',')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);
    }
    if (additionalOptions.enabledVariants) {
      productOptions.enabled_variants = (additionalOptions.enabledVariants as string)
        .split(',')
        .map((id: string) => Number(id.trim()))
        .filter((id: number) => !isNaN(id));
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
    if (checkoutOptions.subscriptionPreview !== undefined) {
      checkoutOptionsObj.subscription_preview = checkoutOptions.subscriptionPreview;
    }

    const colorFields = [
      { param: 'backgroundColor', api: 'background_color' },
      { param: 'headingsColor', api: 'headings_color' },
      { param: 'primaryTextColor', api: 'primary_text_color' },
      { param: 'secondaryTextColor', api: 'secondary_text_color' },
      { param: 'linksColor', api: 'links_color' },
      { param: 'bordersColor', api: 'borders_color' },
      { param: 'checkboxColor', api: 'checkbox_color' },
      { param: 'activeStateColor', api: 'active_state_color' },
      { param: 'buttonColor', api: 'button_color' },
      { param: 'buttonTextColor', api: 'button_text_color' },
      { param: 'termsPrivacyColor', api: 'terms_privacy_color' },
    ];
    for (const { param, api } of colorFields) {
      if (checkoutOptions[param]) {
        checkoutOptionsObj[api] = checkoutOptions[param];
      }
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

  if (resource === 'usageRecord') {
    const subscriptionItemId = ctx.getNodeParameter('subscriptionItemId', itemIndex) as string;
    const quantity = ctx.getNodeParameter('quantity', itemIndex) as number;
    const action = ctx.getNodeParameter('action', itemIndex) as string;

    const body = buildJsonApiBody(
      'usage-records',
      { quantity, action },
      { 'subscription-item': { type: 'subscription-items', id: subscriptionItemId } },
    );

    return await lemonSqueezyApiRequest.call(ctx, 'POST', '/usage-records', body);
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

    // Validate URL before API call - Lemon Squeezy requires HTTPS for webhooks
    validateField('url', url, 'httpsUrl');

    // Validate webhook secret minimum length for security (32+ chars recommended)
    if (secret.length < 32) {
      throw new Error(
        'Webhook secret must be at least 32 characters for security. Generate one using: openssl rand -hex 32',
      );
    }

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
    if (updateFields.trialEndsAt) {
      attributes.trial_ends_at = updateFields.trialEndsAt;
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
      // Validate email before API call
      validateField('email', updateFields.email as string, 'email');
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
      // Validate URL before API call - Lemon Squeezy requires HTTPS for webhooks
      validateField('url', updateFields.url as string, 'httpsUrl');
      attributes.url = updateFields.url;
    }
    if (updateFields.events) {
      attributes.events = updateFields.events;
    }
    if (updateFields.secret) {
      // Validate webhook secret minimum length for security (32+ chars recommended)
      if ((updateFields.secret as string).length < 32) {
        throw new Error(
          'Webhook secret must be at least 32 characters for security. Generate one using: openssl rand -hex 32',
        );
      }
      attributes.secret = updateFields.secret;
    }

    const body = buildJsonApiBody('webhooks', attributes, undefined, webhookId);

    return await lemonSqueezyApiRequest.call(ctx, 'PATCH', `/webhooks/${webhookId}`, body);
  }

  if (resource === 'subscriptionItem') {
    const subscriptionItemId = ctx.getNodeParameter('subscriptionItemId', itemIndex) as string;
    const updateFields = ctx.getNodeParameter('updateFields', itemIndex);

    const attributes: IDataObject = {};

    if (updateFields.quantity !== undefined) {
      attributes.quantity = updateFields.quantity;
    }
    if (updateFields.invoiceImmediately !== undefined) {
      attributes.invoice_immediately = updateFields.invoiceImmediately;
    }
    if (updateFields.disableProrations !== undefined) {
      attributes.disable_prorations = updateFields.disableProrations;
    }

    const body = buildJsonApiBody('subscription-items', attributes, undefined, subscriptionItemId);

    return await lemonSqueezyApiRequest.call(
      ctx,
      'PATCH',
      `/subscription-items/${subscriptionItemId}`,
      body,
    );
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
          'Whether to simplify the response by flattening JSON:API attributes to the top level',
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
