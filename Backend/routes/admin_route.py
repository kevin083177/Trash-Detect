from flask import Blueprint

from middlewares import admin_required, log_request
from controllers import AdminController

admin_blueprint = Blueprint('admin', __name__)