import { getZohoAccessToken } from "./auth";

const ZOHO_API_BASE_URL =
  process.env.ZOHO_API_BASE_URL || "https://www.zohoapis.com/crm/v8";

interface ZohoFetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function zohoFetch(path: string, options: ZohoFetchOptions = {}) {
  const { params, headers: customHeaders, ...rest } = options;

  let url = `${ZOHO_API_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const tokenData = await getZohoAccessToken();

  const headers: Record<string, string> = {
    Authorization: `Zoho-oauthtoken ${tokenData.access_token}`,
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  const response = await fetch(url, {
    ...rest,
    headers,
  });

  if (response.status === 401) {
    const refreshed = await getZohoAccessToken();

    const retryResponse = await fetch(url, {
      ...rest,
      headers: {
        ...headers,
        Authorization: `Zoho-oauthtoken ${refreshed.access_token}`,
      },
    });

    return retryResponse;
  }

  return response;
}
