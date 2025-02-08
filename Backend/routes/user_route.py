from flask import Blueprint
from controllers import UserController
from middlewares import token_required, log_request

user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/', methods=['GET'])
@log_request
@token_required
def get_user(user):
    return UserController.get_user(user['_id'])

@user_blueprint.route('/money/add', methods=['PUT'])
@log_request
@token_required
def add_money(user):
    return UserController.add_money(user['_id'])

@user_blueprint.route('/money/subtract', methods=['PUT'])
@log_request
@token_required
def subtract_money(user):
    return UserController.subtract_money(user['_id'])

@user_blueprint.route('/record', methods=['GET'])
@log_request
@token_required
def get_record_by_user(user):
    return UserController.get_record_by_user(user['_id'])

@user_blueprint.route('/checkIn', methods=['POST'])
@log_request
@token_required
def daliy_check_in(user):
    return UserController.daliy_check_in(user['_id'])

@user_blueprint.route('/checkIn/status', methods=['GET'])
@log_request
@token_required
def daily_check_in_status(user):
    return UserController.daily_check_in_status(user['_id'])