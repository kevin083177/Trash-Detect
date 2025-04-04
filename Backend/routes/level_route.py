from flask import Blueprint

from middlewares import token_required, admin_required, log_request
from controllers import LevelController

level_blueprint = Blueprint('level', __name__)

@level_blueprint.route('/add_level', methods=['POST'])
@log_request
@admin_required
def add_level():
    return LevelController.add_level()

@level_blueprint.route('/<int:level_sequence>', methods=['GET'])
@log_request
@token_required
def get_level_by_sequence(user, level_sequence):
    return LevelController.get_level_by_sequence(user, level_sequence)

@level_blueprint.route('/delete_level', methods=['DELETE'])
@log_request
@admin_required
def delete_level():
    return LevelController.delete_level()

@level_blueprint.route('/update_level', methods=['PUT'])
@log_request
@admin_required
def update_level():
    return LevelController.update_level()