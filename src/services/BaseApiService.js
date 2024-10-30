import apiFetch from "@wordpress/api-fetch";

export default class BaseApiService {
  apiBaseUrl = "/wp-json/mediebank/v1";

  async get(endpoint) {
    return await apiFetch({
      url: `${this.apiBaseUrl}${endpoint}`,
      method: "GET",
    });
  }

  async post(endpoint, data) {
    return await apiFetch({
      url: `${this.apiBaseUrl}${endpoint}`,
      method: "POST",
      data,
    });
  }
}
