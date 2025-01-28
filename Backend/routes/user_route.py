from flask import Blueprint
from controllers.user_controller import UserController
from middlewares.auth_middleware import self_required
from middlewares.log_middleware import log_request

user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/get_own_user/<user_id>', methods=['GET'])
@log_request
@self_required
def get_user(user_id):
    return UserController.get_user(user_id)

@user_blueprint.route('/money/add', methods=['PUT'])
@log_request
@self_required
def add_money():
    return UserController.add_money()

@user_blueprint.route('/money/subtract', methods=['PUT'])
@log_request
@self_required
def subtract_money():
    return UserController.subtract_money()

@user_blueprint.route('/record/<user_id>', methods=['GET'])
@log_request
@self_required
def get_user_record(user_id):
    return UserController.get_user_record(user_id)