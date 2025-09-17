let isRedirecting = false;

function handle401Error() {
  if (isRedirecting) return;

  isRedirecting = true;

  localStorage.removeItem('token');
  localStorage.removeItem('username');

  window.location.hash = '#/login';

  setTimeout(() => {
    isRedirecting = false;
  }, 1000);
}

/**
 * 異步呼叫 api，只可用響應體為 JSON 的 api
 * @param api 要呼叫的 api
 * @returns 回傳物件：{ status, message, body }
 */
export async function asyncGet(api: string, { headers = {} }: { headers?: HeadersInit } = {}): Promise<any> {
    try {
      const res: Response = await fetch(api, {
        method: 'GET',
        headers: {
          ...headers,
        },
      });
      
      if (res.status === 401) handle401Error();

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const jsonData = await res.json();
        return { status: res.status, ...jsonData };
      } else {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Response was not JSON');
      }
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
}
  
/**
 * 異步執行 Post 請求
 * @param api 要呼叫的 api url
 * @param body 請求內容
 * @returns 回傳物件：{ status, message, body }
 */
export async function asyncPost(api: string, { body, headers = {} }: { body?: any, headers?: HeadersInit }): Promise<any> {
  try {
    const requestHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    };

    if (!(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const res: Response = await fetch(api, {
      method: 'POST',
      headers: requestHeaders,
      body: body instanceof FormData ? body : JSON.stringify(body),
      mode: 'cors',
    });

    if (res.status === 401) handle401Error();

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const jsonData = await res.json();
      return { status: res.status, ...jsonData };
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error('Response was not JSON');
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
  
/**
 * 異步執行 Delete 請求
 * @param api 要呼叫的 api url
 * @param body 請求內容
 * @returns 回傳物件：{ status, message, body }
 */
export async function asyncDelete(api: string, { body, headers = {} }: { body: any, headers?: HeadersInit }): Promise<any> {
  try {
    const res: Response = await fetch(api, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body instanceof FormData ? body : JSON.stringify(body),
      mode: 'cors',
    });

    if (res.status === 401) handle401Error();

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const jsonData = await res.json();
      return { status: res.status, ...jsonData };
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error('Response was not JSON');
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
  
/**
 * 異步執行 Put 請求
 * @param api 要呼叫的 api url
 * @param body 請求內容
 * @returns 回傳物件：{ status, message, body }
 */
export async function asyncPut(api: string, { body, headers = {} }: { body: any, headers?: HeadersInit }): Promise<any> {
  try {
    const requestHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    };

    if (!(body instanceof FormData)) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const res: Response = await fetch(api, {
      method: 'PUT',
      headers: requestHeaders,
      body: body instanceof FormData ? body : JSON.stringify(body),
      mode: 'cors',
    });
    
    if (res.status === 401) handle401Error();

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const jsonData = await res.json();
      return { status: res.status, ...jsonData };
    } else {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error('Response was not JSON');
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
  