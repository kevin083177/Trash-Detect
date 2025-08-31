import { tokenStorage } from '@/utils/tokenStorage';

let authErrorCallback: (() => void) | null = null;
let isHandling401 = false;
let handle401Timeout: NodeJS.Timeout | null = null;

export function setAuthErrorCallback(callback: () => void) {
  authErrorCallback = callback;
}

async function handleResponse(response: Response): Promise<any> {
  if (response.status === 401) {
    if (!isHandling401) {
      isHandling401 = true;
      
      if (handle401Timeout) {
        clearTimeout(handle401Timeout);
      }
      
      handle401Timeout = setTimeout(() => {
        if (authErrorCallback) {
          authErrorCallback();
        }
        
        setTimeout(() => {
          isHandling401 = false;
        }, 2000);
      }, 100);
    }
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const jsonData = await response.json();
    return { status: response.status, ...jsonData };
  } else {
    const text = await response.text();
    if (response.status !== 200) {
      console.error('Non-JSON response:', text);
      throw new Error('Response was not JSON');
    }
    return { status: response.status, body: text };
  }
}

async function getHeaders(customHeaders: HeadersInit = {}): Promise<HeadersInit> {
  const token = await tokenStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...customHeaders,
  };
}

/**
 * 異步呼叫 api，只可用響應體為 JSON 的 api
 * @param api 要呼叫的 api
 * @returns 回傳物件：{ status, message, body }
 */
export async function asyncGet(api: string, { headers = {} }: { headers?: HeadersInit } = {}): Promise<any> {
  try {
    const finalHeaders = await getHeaders(headers);
    
    const res: Response = await fetch(api, {
      method: 'GET',
      headers: finalHeaders,
    });

    return await handleResponse(res);
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
export async function asyncPost(api: string, { body, headers = {} }: { body?: any, headers?: HeadersInit } = {}): Promise<any> {
  try {
    const finalHeaders = await getHeaders(headers);
    
    const res: Response = await fetch(api, {
      method: 'POST',
      headers: finalHeaders,
      body: body instanceof FormData ? body : JSON.stringify(body),
      mode: 'cors',
    });

    return await handleResponse(res);
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
export async function asyncDelete(api: string, { body, headers = {} }: { body?: any, headers?: HeadersInit } = {}): Promise<any> {
  try {
    const finalHeaders = await getHeaders(headers);
    
    const res: Response = await fetch(api, {
      method: 'DELETE',
      headers: finalHeaders,
      body: body instanceof FormData ? body : JSON.stringify(body),
      mode: 'cors',
    });

    return await handleResponse(res);
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
export async function asyncPut(api: string, { body, headers = {} }: { body?: any, headers?: HeadersInit } = {}): Promise<any> {
  try {
    const finalHeaders = await getHeaders(headers);
    
    const res: Response = await fetch(api, {
      method: 'PUT',
      headers: finalHeaders,
      body: body instanceof FormData ? body : JSON.stringify(body),
      mode: 'cors',
    });

    return await handleResponse(res);
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}