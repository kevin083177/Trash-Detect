from flask import Blueprint

from middlewares.auth_middleware import token_required
from middlewares.log_middleware import log_request
from controllers.record_controller import RecordController

record_blueprint = Blueprint('record', __name__)

@record_blueprint.route('/<record_id>', methods=['GET'])
@log_request
@token_required
def get_user(record_id):
    return RecordController.get_record_by_id(record_id)