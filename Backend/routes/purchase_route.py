from flask import Blueprint

from middlewares.log_middleware import log_request
from middlewares.auth_middleware import token_required
from controllers.purchase_controller import PurchaseController

purchase_blueprint = Blueprint('purchase', __name__)

@purchase_blueprint.route('/purchase_product/<product_id>', methods=['POST'])
@log_request
@token_required
def purchase_product(user, product_id):
    return PurchaseController.purchase_product(user, product_id)