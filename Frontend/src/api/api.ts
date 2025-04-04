const api_version = '/api/v1'

const url_path = `http://${process.env.EXPO_PUBLIC_API_URL}${api_version}` as const;

const auth_url = `${url_path}/auth`;
const admin_url = `${url_path}/admin`;
const user_url = `${url_path}/users`;
const record_url = `${url_path}/record`;
const purchase_url = `${url_path}/purchase`;
const product_url = `${url_path}/product`;
const theme_url = `${url_path}/theme`;

export const auth_api = {
    login: `${auth_url}/login`,
    register: `${auth_url}/register`,
    logout: `${auth_url}/logout`,
} as const;

export const admin_api = {
    delete_user: `${admin_url}/admin/delete_user`,
} as const;

export const user_api = {
    get_user: `${user_url}/`,
    get_record: `${user_url}/record`,
    update_user: `${user_url}/update`,
    add_money: `${user_url}/money/add`,
    subtract_money: `${user_url}/money/subtract`,
    daily_check_in: `${user_url}/checkIn`,
    daily_check_in_status: `${user_url}/checkIn/status`
} as const;

export const record_api = {
    get_record: `${record_url}/`,
    get_category_count: `${record_url}/category`,
    add_category_count: `${record_url}/add`,
} as const;

export const purchase_api = {
    get_purchase: `${purchase_url}/`,
    purchase: `${purchase_url}/purchase_product`,
} as const;

export const product_api = {
    get_product: `${product_url}/`,
    add_product: `${product_url}/add_product`,
    delete_product: `${product_url}/delete_product`,
} as const;

export const theme_api = {
    get_theme: `${theme_url}/`,
    add_theme: `${theme_url}/add_theme`,
    get_all_themes: `${theme_url}/get_all_themes`,
    get_theme_products: `${theme_url}/`, // + theme_name/products
}
