/**
 * 異步呼叫api, 只可用響應體為 json 的 api
 * @param api 要呼叫的api
 * @returns json 結果
 */
export async function asyncGet(api: string, { headers = {} }: { headers?: HeadersInit } = {}): Promise<any> {
    try {
        const res: Response = await fetch(api, {
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await res.json();
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
 * @param api 要呼叫的api url
 * @param body 
 * @returns json 結果
 */
export async function asyncPost(api: string, { body, headers = {} }: { body: any, headers?: HeadersInit }): Promise<any> {
    try {
        const res: Response = await fetch(api, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body instanceof FormData ? body : JSON.stringify(body),
            mode: 'cors',
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await res.json();
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
 * @param api 要呼叫的api url
 * @param body 
 * @returns json 結果
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

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await res.json();
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
 * @param api 要呼叫的api url
 * @param body 
 * @returns json 結果
 */
export async function asyncPut(api: string, { body, headers = {} }: { body: any, headers?: HeadersInit }): Promise<any> {
    try {
        const res: Response = await fetch(api, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body instanceof FormData ? body : JSON.stringify(body),
            mode: 'cors',
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await res.json();
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