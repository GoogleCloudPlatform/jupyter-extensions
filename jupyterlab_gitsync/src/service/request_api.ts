import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

/**
 * Call the extension APIs
 *
 * @param extension: Handler extension for url
 * @param init: Initial values for the request
 * @returns: The response body interpreted as JSON
 */

export async function requestAPI(extension = '', init: RequestInit = {}) {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(settings.baseUrl, 'jupyterlab_gitsync/', extension);

  let response: Response;

  try {
    response = await ServerConnection.makeRequest(url, init, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }

  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }

  const data = await response.json();
  return data;
}
