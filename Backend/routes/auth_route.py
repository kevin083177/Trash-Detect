
from flask import Blueprint

from middlewares.log_middleware import log_request
from controllers.auth_controller import AuthController

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
@log_request
def register():
    return AuthController.register()

@auth_blueprint.route('/login', methods=['POST'])
@log_request
def login():
    return AuthController.login()