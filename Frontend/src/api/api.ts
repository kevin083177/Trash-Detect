const api_version = '/api/v1'

const url_path = `http://${process.env.EXPO_PUBLIC_API_URL}${api_version}` as const;

export const auth_api = {
    login: `${url_path}/auth/login`,
    register: `${url_path}/auth/register`,
    logout: `${url_path}/auth/logout`,
} as const;

export const admin_api = {
    delete_user: `${url_path}/admin/delete_user`,
} as const;

export const user_api = {
    get_user: `${url_path}/users`,
    get_record: `${url_path}/users/record`,
    add_money: `${url_path}/users/money/add`,
    subtract_money: `${url_path}/users/money/subtract`,
} as const;

export const record_api = {
    get_record: `${url_path}/record`,
    get_category_count: `${url_path}/record/category`,
    add_category_count: `${url_path}/record/add`,
} as const;

export const purchase_api = {
    purchase: `${url_path}/purchase/purchase_product`,
} as const;

export const product_api = {
    get_product: `${url_path}/product`,
    add_product: `${url_path}/product/add_product`,
    delete_product: `${url_path}/product/delete_product`,
} as const;