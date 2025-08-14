from flask import Blueprint
from controllers import UserController
from middlewares import token_required, log_request, admin_required

user_blueprint = Blueprint('users', __name__)

@user_blueprint.route('/', methods=['GET'])
@log_request
@token_required
def get_user(user):
    return UserController.get_user(user['_id'])

@user_blueprint.route('/update/username', methods=['PUT'])
@log_request
@token_required
def update_username(user):
    return UserController.update_username(user['_id'])

@user_blueprint.route('/update/password', methods=['PUT'])
@log_request
@token_required
def update_password(user):
    return UserController.update_password(user['_id'])

@user_blueprint.route('/update/email', methods=['PUT'])
@log_request
@token_required
def update_email(user):
    return UserController.update_email(user['_id'])

@user_blueprint.route('/delete', methods=['DELETE'])
@log_request
@admin_required
def delete_user():
    return UserController.delete_user()

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

@user_blueprint.route('/trash', methods=['GET'])
@log_request
@token_required
def get_user_trash_stats(user):
    return UserController.get_user_trash_stats(user['_id'])

@user_blueprint.route('/trash/add_trash', methods=['POST'])
@log_request
@token_required
def add_trash(user):
    return UserController.add_user_trash_stats(user['_id'])

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

@user_blueprint.route('/update/profile', methods=['PUT'])
@log_request
@token_required
def update_profile(user):
    return UserController.update_profile(user['_id'])

@user_blueprint.route('/question', methods=['GET'])
@log_request
@token_required
def get_question_stats(user):
    return UserController.get_question_stats(user['_id'])

@user_blueprint.route('/question/add', methods=["PUT"])
@log_request
@token_required
def update_question_stats(user):
    return UserController.update_question_stats(user['_id'])