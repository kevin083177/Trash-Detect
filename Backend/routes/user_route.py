from flask import Blueprint
from controllers.user_controller import UserController
from middlewares.auth_middleware import token_required
user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/create_user', methods=['POST'])
def create_user():
    return UserController.create_user()

@user_blueprint.route('/login', methods=['POST'])
def login():
    return UserController.login()

@user_blueprint.route('/getUserById/<user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    return UserController.get_user(user_id)