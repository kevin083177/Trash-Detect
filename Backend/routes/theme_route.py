from flask import Blueprint

from middlewares import admin_required, token_required, log_request
from controllers import ThemeController

theme_blueprint = Blueprint('theme', __name__)

@theme_blueprint.route('/add_theme', methods=['POST'])
@log_request
@admin_required
def add_theme():
    return ThemeController.add_theme()

@theme_blueprint.route('/get_all_themes', methods=['GET'])
@log_request
@token_required
def get_all_themes(user):
    return ThemeController.get_all_themes(user)

@theme_blueprint.route('/<theme_name>/products', methods=['GET'])
@log_request
@token_required
def get_theme_products(user, theme_name):
    return ThemeController.get_theme_products(user, theme_name)

@theme_blueprint.route('/<theme_name>', methods=['GET'])
@log_request
@token_required
def get_theme(user, theme_name):
    return ThemeController.get_theme(user, theme_name)

@theme_blueprint.route('/delete_theme/<theme_name>', methods=['DELETE'])
@log_request
@admin_required
def delete_theme(theme_name):
    return ThemeController.delete_theme(theme_name)