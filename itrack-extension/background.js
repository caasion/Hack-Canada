(() => {
  const runtime = typeof browser !== "undefined" ? browser.runtime : null;
  if (!runtime?.onMessage) return;

  runtime.onMessage.addListener((message) => {
    if (!message || message.type !== "ITRACK_PROXY_FETCH") {
      return undefined;
    }

    const request = message.request ?? {};
    const url = typeof request.url === "string" ? request.url : "";
    if (!url) {
      return Promise.resolve({
        ok: false,
        status: 0,
        statusText: "BAD_REQUEST",
        bodyText: "",
        error: "Missing request.url",
      });
    }

    const method = typeof request.method === "string" ? request.method : "GET";
    const headers =
      request.headers && typeof request.headers === "object"
        ? request.headers
        : undefined;
    const body = typeof request.body === "string" ? request.body : undefined;

    return fetch(url, { method, headers, body })
      .then(async (response) => ({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        bodyText: await response.text(),
      }))
      .catch((error) => ({
        ok: false,
        status: 0,
        statusText: "NETWORK_ERROR",
        bodyText: "",
        error: String(error),
      }));
  });
})();
