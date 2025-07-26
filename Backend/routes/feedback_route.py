from flask import Blueprint

from middlewares import token_required, admin_required, log_request
from controllers import FeedbackController

feedback_blueprint = Blueprint('feedback', __name__)

@feedback_blueprint.route('/add', methods=['POST'])
@log_request
@token_required
def create_feedback(user):
    return FeedbackController.create_feedback(user["_id"])

@feedback_blueprint.route('/<feedback_id>', methods=['GET'])
@log_request
@token_required
def get_feedback(user, feedback_id):
    return FeedbackController.get_feedback(user, feedback_id)

@feedback_blueprint.route('/user', methods=['GET'])
@log_request
@token_required
def get_user_feedbacks(user):
    return FeedbackController.get_user_feedbacks(user["_id"])

@feedback_blueprint.route('/all', methods=['GET'])
@log_request
@admin_required
def get_all_feedbacks():
    return FeedbackController.get_all_feedbacks()

@feedback_blueprint.route('/update', methods=['PUT'])
@log_request
@admin_required
def update_feedback_status():
    return FeedbackController.update_feedback_status()

@feedback_blueprint.route('/reply', methods=['PUT'])
@log_request
@admin_required
def add_reply():
    return FeedbackController.add_reply()

@feedback_blueprint.route('/delete', methods=['DELETE'])
@log_request
@admin_required
def delete_feedback():
    return FeedbackController.delete_feedback()