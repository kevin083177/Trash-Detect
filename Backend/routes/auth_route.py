from flask import Blueprint

from middlewares import token_required, log_request
from controllers import AuthController

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
@log_request
def register():
    return AuthController.register()

@auth_blueprint.route('/login', methods=['POST'])
@log_request
def login():
    return AuthController.login()

@auth_blueprint.route('/logout', methods=['POST'])
@token_required
@log_request
def logout(user):
    return AuthController.logout(user)