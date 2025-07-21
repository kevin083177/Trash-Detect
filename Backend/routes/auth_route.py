from flask import Blueprint

from middlewares import token_required, log_request
from controllers import AuthController

auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
@log_request
def register():
    return AuthController.register()

@auth_blueprint.route('/verify/register', methods=['POST'])
@log_request
def verify_email():
    return AuthController.verify_email()

@auth_blueprint.route('/resend/register', methods=['POST'])
@log_request
def resend_register_email():
    return AuthController.resend_verification()

@auth_blueprint.route('/status/register', methods=['GET'])
@log_request
def email_status():
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

@auth_blueprint.route('/forget', methods=['POST'])
@log_request
def forget_password():
    return AuthController.forget_password()

@auth_blueprint.route('/verify/password', methods=['POST'])
@log_request
def verify_password():
    return AuthController.verify_password_reset_code()

@auth_blueprint.route('/reset/password', methods=['POST'])
@log_request
def reset_password():
    return AuthController.reset_password()

@auth_blueprint.route('/resend/password', methods=['POST'])
@log_request
def resend_password_verification():
    return AuthController.resend_password_reset_code()

@auth_blueprint.route('/status/password', methods=['GET'])
@log_request
def password_status():
    return AuthController.get_reset_verification_status()