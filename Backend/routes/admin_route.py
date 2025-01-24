from flask import Blueprint

from middlewares.auth_middleware import admin_required
from middlewares.log_middleware import log_request
from controllers.admin_controller import AdminController

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('/add_product', methods=['POST'])
@admin_required
@log_request
def add_product():
    return AdminController.add_product()