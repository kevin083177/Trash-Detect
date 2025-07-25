from flask import Blueprint
from controllers import UserLevelController
from middlewares import token_required, log_request

user_level_blueprint = Blueprint('user_level', __name__)

@user_level_blueprint.route('/unlocked', methods=['PUT'])
@log_request
@token_required
def set_chapter_unlocked(user):
    return UserLevelController.set_chapter_unlocked(user['_id'])

@user_level_blueprint.route('/completed', methods=['PUT'])
@log_request
@token_required
def set_chapter_completed(user):
    return UserLevelController.set_chapter_completed(user['_id'])

@user_level_blueprint.route('/', methods=['GET'])
@log_request
@token_required
def get_user_level(user):
    return UserLevelController.get_user_level(user['_id'])

@user_level_blueprint.route('/update_level', methods=['PUT'])
@log_request
@token_required
def update_level_progress(user):
    return UserLevelController.update_level_progress(user['_id'])

@user_level_blueprint.route('/update_completed', methods=['PUT'])
@log_request
@token_required
def update_completed_chapter(user):
    return UserLevelController.update_completed_chpater(user["_id"])