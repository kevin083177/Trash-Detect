from flask import Blueprint

from middlewares import token_required, log_request, admin_required
from controllers import QuestionController

question_blueprint = Blueprint('question', __name__)

@question_blueprint.route('/add_question', methods=['POST'])
@log_request
@admin_required
def add_question():
    return QuestionController.add_question()

@question_blueprint.route('/delete_question', methods=['DELETE'])
@log_request
@admin_required
def delete_question():
    return QuestionController.delete_question()

@question_blueprint.route('/<question_id>', methods=['GET'])
@log_request
@token_required
def get_question(user, question_id):
    return QuestionController.get_question(user, question_id)

@question_blueprint.route('/update_question', methods=['PUT'])
@log_request
@admin_required
def update_question():
    return QuestionController.update_question()

@question_blueprint.route('/all/<category>', methods=['GET'])
@log_request
@token_required
def get_question_by_category(user, category):
    return QuestionController.get_question_by_category(user, category)