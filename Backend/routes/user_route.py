from flask import Blueprint
from controllers import UserController
from middlewares import token_required, log_request

user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/', methods=['GET'])
@log_request
@token_required
def get_user(user):
    return UserController.get_user(user['_id'])

@user_blueprint.route('/money/add/<int:money>', methods=['PUT'])
@log_request
@token_required
def add_money(user, money):
    return UserController.add_money(user['_id'], money)

@user_blueprint.route('/money/subtract/<int:money>', methods=['PUT'])
@log_request
@token_required
def subtract_money(user, money):
    return UserController.subtract_money(user['_id'], money)

@user_blueprint.route('/record', methods=['GET'])
@log_request
@token_required
def get_record_by_user_id(user):
    return UserController.get_record_by_user_id(user['_id'])