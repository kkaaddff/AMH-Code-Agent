import axios from 'axios';

export class LLMClient {
  constructor({
    url,
    endpoint,
    key,
    token,
    path = '',
    timeout = 60000
  } = {}) {
    this.baseURL = endpoint ?? url ?? '';
    this.apiKey = key ?? token ?? '';
    this.path = path;
    this.timeout = timeout;

    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout
    });
  }

  isConfigured() {
    return Boolean(this.baseURL);
  }

  async sendRequest(body, axiosConfig = {}) {
    if (!this.isConfigured()) {
      throw new Error(
        'LLM client is not configured. Please set MODEL_ENDPOINT (or provide --api-url/--api-endpoint).'
      );
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...axiosConfig.headers
    };

    const url = this.path?.length ? this.path : undefined;

    const response = await this.http.post(url, body, {
      ...axiosConfig,
      headers
    });

    return response.data;
  }
}

export const createClient = config => new LLMClient(config);
