const API_BASE_URL = import.meta.env.VITE_API_URL;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const API_VERSION = '/api/v1';

const ADMIN_URL = `${API_BASE_URL}${API_VERSION}/admin`;
const AUTH_URL = `${API_BASE_URL}${API_VERSION}/auth`;
const THEME_URL = `${API_BASE_URL}${API_VERSION}/theme`;
const PRODUCT_URL = `${API_BASE_URL}${API_VERSION}/product`;
const CHAPTER_URL = `${API_BASE_URL}${API_VERSION}/chapter`;
const QUESTION_URL = `${API_BASE_URL}${API_VERSION}/question`;
const FEEDBACK_URL = `${API_BASE_URL}${API_VERSION}/feedback`;

export const admin_api = {
    get_all_users_info: `${ADMIN_URL}/users/all`,
    delete_user: `${ADMIN_URL}/users/delete`,
    get_all_trash: `${ADMIN_URL}/trash/all`,
    get_system_info: `${ADMIN_URL}/system/info`
}

export const auth_api = {
    login: `${AUTH_URL}/login`,
    logout: `${AUTH_URL}/logout`
}

export const theme_api = {
    get_theme: `${THEME_URL}/`,
    add_theme: `${THEME_URL}/add_theme`,
    delete_theme: `${THEME_URL}/delete_theme`,
    get_all_themes: `${THEME_URL}/all`,
    get_theme_products: `${THEME_URL}`, // + theme_name/products
    update_theme: `${THEME_URL}/update_theme`
}

export const chapter_api = {
    get_all_chapters: `${CHAPTER_URL}/all`,
}

export const product_api = {
    add: `${PRODUCT_URL}/add_product`,
    delete: `${PRODUCT_URL}/delete_product`,
    update: `${PRODUCT_URL}/update_product`
}

export const question_api = {
    add_question: `${QUESTION_URL}/add_question`,
    delete_question: `${QUESTION_URL}/delete_question`,
    update_question: `${QUESTION_URL}/update_question`,
    get_question_by_category: `${QUESTION_URL}/all` // + chapter name slice(0, -2);
}

export const feedback_api = {
    all: `${FEEDBACK_URL}/all`,
    update_status: `${FEEDBACK_URL}/update`,
    reply: `${FEEDBACK_URL}/reply`
}