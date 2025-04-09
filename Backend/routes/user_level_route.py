from flask import Blueprint
from controllers import UserLevelController
from middlewares import token_required, log_request

user_level_blueprint = Blueprint('user_level', __name__)

@user_level_blueprint.route('/unlocked', methods=['PUT'])
@log_request
@token_required
def set_chapter_unlocked(user):
    return UserLevelController.set_chapter_unlocked(user['_id'])