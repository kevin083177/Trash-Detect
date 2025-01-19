from flask import Blueprint
from controllers.user_controller import UserController

user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/create_user', methods=['POST'])
def create_user():
    return UserController.create_user()

@user_blueprint.route('/getUserById', methods=['GET'])
def get_user(user_id):
    return UserController.get_user(user_id)