from flask import Blueprint

from middlewares import token_required, log_request
from controllers import PurchaseController

purchase_blueprint = Blueprint('purchase', __name__)

@purchase_blueprint.route('/purchase_product/<product_id>', methods=['POST'])
@log_request
@token_required
def purchase_product(user, product_id):
    return PurchaseController.purchase_product(user, product_id)