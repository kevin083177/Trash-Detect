const api_version = '/api/v1'

const url_path = `http://${process.env.EXPO_PUBLIC_API_URL}${api_version}` as const;

const auth_url = `${url_path}/auth`;
const admin_url = `${url_path}/admin`;
const user_url = `${url_path}/users`;
const user_level_url = `${url_path}/users/level`
const purchase_url = `${url_path}/purchase`;
const product_url = `${url_path}/product`;
const theme_url = `${url_path}/theme`;
const chapter_url = `${url_path}/chapter`;
const level_url = `${url_path}/level`;
const question_url = `${url_path}/question`;
const question_category_url = `${url_path}/question/category`;

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
    get_user_trash_stats: `${user_url}/trash`,
    add_trash_stats: `${user_url}/trash/add_trash`,
    update_user: `${user_url}/update`,
    add_money: `${user_url}/money/add`,
    subtract_money: `${user_url}/money/subtract`,
    daily_check_in: `${user_url}/checkIn`,
    daily_check_in_status: `${user_url}/checkIn/status`,
    update_user_level: `${user_url}/level/update_level`,
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
    delete_theme: `${theme_url}/delete_theme/`, // + theme_name
} as const;

export const chapter_api = {
    get_chapter: `${chapter_url}/`, // + chapter name
    get_all_chapters: `${chapter_url}/all`,
    add_chapter: `${chapter_url}/add_chapter`,
    delete_chapter: `${chapter_url}/delete_chapter`,
    update_chapter: `${chapter_url}/update_chapter`,
} as const;

export const level_api = {
    get_level_by_sequence: `${level_url}/`, // + sequence
    add_level: `${level_url}/add_level`,
    delete_level: `${level_url}/delete_level`,
    update_level: `${level_url}/update_level`,
    get_chapters_level: `${level_url}/` // + chapter_name
} as const;

export const question_api = {
    get_question: `${question_url}/`, // + question_id
    get_question_by_category: `${question_url}/all/`, // + category name
    add_question: `${question_url}/add_question`,
    delete_question: `${question_url}/delete_question`,
    update_question: `${question_url}/update_question`,
} as const;

export const question_category_api = {
    get_categories: `${question_category_url}/all`,
    add_category: `${question_category_url}/add_category`,
    delete_category: `${question_category_url}/delete_category`,
    update_category: `${question_category_url}/update_category`,
} as const;

export const user_level_api = {
    unlocked_chapter: `${user_level_url}/unlocked`,
    completed_chapter: `${user_level_url}/completed`,
    get_user_level: `${user_level_url}/`,
    update_level: `${user_level_url}/update_level`
}
