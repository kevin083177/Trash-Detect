from flask import Blueprint

from middlewares import token_required, log_request, admin_required
from controllers import QuestionCategoryController

question_category_blueprint = Blueprint('question/category', __name__)

@question_category_blueprint.route('/add_category', methods=['POST'])
@log_request
@admin_required
def add_category():
    return QuestionCategoryController.add_category()

@question_category_blueprint.route('/all', methods=['GET'])
@log_request
@token_required
def get_categories(user):
    return QuestionCategoryController.get_categories(user)

@question_category_blueprint.route('/delete_category', methods=['DELETE'])
@log_request
@admin_required
def delete_category():
    return QuestionCategoryController.delete_category()

@question_category_blueprint.route('/update_category', methods=['PUT'])
@log_request
@admin_required
def update_category():
    return QuestionCategoryController.update_category()