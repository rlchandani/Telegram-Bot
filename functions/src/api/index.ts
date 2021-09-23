import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

export function httpsAxios<T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  config.withCredentials = true;
  return axios
    .request<T>(config)
    .then(async (response: AxiosResponse) => {
      await response.data;
      return response;
    })
    .catch((context: AxiosError) => {
      const errorMessage = context?.response?.data.message || context.message;
      const error = new Error(errorMessage);
      console.error(
        "Issue with an API call using \"httpsAxios\" handler",
        error,
        context
      );
      throw error;
    });
}

export function getAxios<T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  config.method = "get";
  return httpsAxios<T>(config);
}

export function postAxios<T>(
  config: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  config.method = "post";
  // TODO: Revert following changes
  // config.data = JSON.stringify(config.data);
  return httpsAxios<T>(config);
}
