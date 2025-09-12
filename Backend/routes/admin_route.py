from flask import Blueprint

from middlewares import admin_required, log_request
from controllers import UserController, DailyTrashController, SystemController

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('users/all', methods=['GET'])
@admin_required
@log_request
def get_all_users_info():
    return UserController.get_all_users_info()

@admin_blueprint.route('users/delete_user', methods=['DELETE'])
@admin_required
@log_request
def delete_user():
    return UserController.delete_user()

@admin_blueprint.route('trash/all', methods=["GET"])
@admin_required
@log_request
def get_all_trash():
    return DailyTrashController.get_all_trash()

@admin_blueprint.route('/system/info', methods=['GET'])
@admin_required
@log_request
def get_system_info():
    return SystemController.get_system_info()