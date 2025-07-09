const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_VERSION = '/api/v1';

const AUTH_URL = `${API_BASE_URL}${API_VERSION}/auth`;
const THEME_URL = `${API_BASE_URL}${API_VERSION}/theme`;
const CHAPTER_URL = `${API_BASE_URL}${API_VERSION}/chapter`;
const QUESTION_URL = `${API_BASE_URL}${API_VERSION}/question`;

export const auth_api = {
    login: `${AUTH_URL}/login`,
    logout: `${AUTH_URL}/logout`
}

export const theme_api = {
    get_theme: `${THEME_URL}/`,
    add_theme: `${THEME_URL}/add_theme`,
    get_all_themes: `${THEME_URL}/get_all_themes`,
    get_theme_products: `${THEME_URL}`, // + theme_name/products
}

export const chapter_api = {
    get_all_chapters: `${CHAPTER_URL}/all`,
}

export const question_api = {
    add_question: `${QUESTION_URL}/add_question`,
    delete_question: `${QUESTION_URL}/delete_question`,
    update_question: `${QUESTION_URL}/update_question`,
    get_question_by_category: `${QUESTION_URL}/all` // + chapter name slice(0, -2);
}