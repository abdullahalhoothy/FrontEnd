interface XMLHttpRequest {
  _url?: string | URL;
}

const detectBlockedByClient = (callback: (isBlocked: boolean) => void) => {
  const monitorAjaxRequests = () => {
    // Override XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      (this as XMLHttpRequest & { _url?: string | URL })._url = url;
      return originalOpen.apply(this, [method, url, async, username, password]);
    };

    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(this, args);
        if (!response.ok && response.status === 0) {
          console.log(`ERR_BLOCKED_BY_CLIENT detected in fetch for URL: ${args[0]}`);
          callback(true);
        }
        return response;
      } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.log(`ERR_BLOCKED_BY_CLIENT detected in fetch for URL: ${args[0]}`);
          callback(true);
        }
        throw error;
      }
    };
  };

  monitorAjaxRequests();
};

export default detectBlockedByClient;
