from flask import Blueprint
from controllers.user_controller import UserController
from middlewares.auth_middleware import *
from middlewares.log_middleware import log_request

user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/create_user', methods=['POST'])
@log_request
def create_user():
    return UserController.create_user()

@user_blueprint.route('/login', methods=['POST'])
@log_request
def login():
    return UserController.login()

@user_blueprint.route('/get_own_user/<user_id>', methods=['GET'])
@log_request
@self_required
def get_user(user_id):
    return UserController.get_user(user_id)