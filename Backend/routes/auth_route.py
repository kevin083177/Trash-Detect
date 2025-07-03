from flask import Blueprint

from middlewares import token_required, log_request
from controllers import AuthController

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
@log_request
def register():
    return AuthController.register()

@auth_blueprint.route('/verify', methods=['POST'])
@log_request
def verify():
    return AuthController.verify_email()

@auth_blueprint.route('/resend', methods=['POST'])
@log_request
def resend():
    return AuthController.resend_verification()

@auth_blueprint.route('/status', methods=['GET'])
@log_request
def status():
    return AuthController.get_verification_status()

@auth_blueprint.route('/login', methods=['POST'])
@log_request
def login():
    return AuthController.login()

@auth_blueprint.route('/logout', methods=['POST'])
@token_required
@log_request
def logout(user):
    return AuthController.logout(user)