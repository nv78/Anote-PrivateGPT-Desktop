const API_ENDPOINT = "http://127.0.0.1:5000";

export function defaultHeaders() {
  const sessionToken = localStorage.getItem("sessionToken");

  return {
    Authorization: `Bearer ${sessionToken}`,
    'Content-Type': 'application/json', // Ensure the Content-Type is set
  };
}

function updateOptions(options) {
  const update = { ...options };
  const headers = defaultHeaders();
  update.headers = {
    ...headers,
    ...update.headers,
  };
  update.credentials = "include";
  return update;
}

function fetcher(url, options = {}, retryCount = 0) {
  console.log("updateOptions(options)");
  console.log(updateOptions(options));

  return fetch(API_ENDPOINT + "/" + url, updateOptions(options))
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response;
    })
    .catch((error) => {
      console.log("there is an error", error);
      return Promise.reject(error);
    });
}

export default fetcher;
