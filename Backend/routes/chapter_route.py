from flask import Blueprint

from middlewares import token_required, admin_required, log_request
from controllers import ChapterController

chapter_blueprint = Blueprint('chapter', __name__)

@chapter_blueprint.route('/add_chapter', methods=['POST'])
@log_request
@admin_required
def add_level():
    return ChapterController.add_chapter()

@chapter_blueprint.route('/<chapter_name>', methods=['GET'])
@log_request
@token_required
def get_chapter_by_name(user, chapter_name):
    return ChapterController.get_chapter_by_name(user, chapter_name)

@chapter_blueprint.route('/delete_chapter', methods=['DELETE'])
@log_request
@admin_required
def delete_chapter():
    return ChapterController.delete_chapter()

@chapter_blueprint.route('/update_chapter', methods=['PUT'])
@log_request
@admin_required
def update_chapter():
    return ChapterController.update_chapter()

@chapter_blueprint.route('/all', methods=['GET'])
@log_request
@token_required
def get_all_chapters(user):
    return ChapterController.get_all_chapters(user)