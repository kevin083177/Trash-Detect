from flask import Blueprint

from middlewares.log_middleware import log_request
from middlewares.auth_middleware import self_required
from controllers.purchase_controller import PurchaseController

purchase_blueprint = Blueprint('purchase', __name__)

@purchase_blueprint.route('/purchase_product', methods=['POST'])
@log_request
@self_required
def purchase_product():
    return PurchaseController.purchase_product()