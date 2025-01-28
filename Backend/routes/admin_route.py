from flask import Blueprint

from middlewares import admin_required, log_request
from controllers import AdminController

admin_blueprint = Blueprint('admin', __name__)

@admin_blueprint.route('/add_product', methods=['POST'])
@admin_required
@log_request
def add_product():
    return AdminController.add_product()