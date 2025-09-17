from flask import Blueprint

from middlewares import token_required, admin_required, log_request
from controllers import LevelController

level_blueprint = Blueprint('level', __name__)

@level_blueprint.route('/<int:level_sequence>', methods=['GET'])
@log_request
@token_required
def get_level_by_sequence(user, level_sequence):
    return LevelController.get_level_by_sequence(user, level_sequence)

@level_blueprint.route('/update_level', methods=['PUT'])
@log_request
@admin_required
def update_level():
    return LevelController.update_level()

@level_blueprint.route('/<chapter_name>', methods=['GET'])
@log_request
@token_required
def get_chapters_level(user, chapter_name):
    return LevelController.get_chapters_level(chapter_name)

@level_blueprint.route('/all', methods=['GET'])
@log_request
@admin_required
def get_all_levels():
    return LevelController.get_all_levels()