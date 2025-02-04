from flask import Blueprint

from middlewares import admin_required, log_request
from controllers import AdminController

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('/delete_user', methods=['DELETE'])
@admin_required
@log_request
def delete_user():
    return AdminController.delete_user()