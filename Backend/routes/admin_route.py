from flask import Blueprint

from middlewares import admin_required, log_request
from controllers import UserController, DailyTrashController, AdminController

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('users/all', methods=['GET'])
@admin_required
@log_request
def get_all_users_info():
    return AdminController.get_all_users_info()

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
