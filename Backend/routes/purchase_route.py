from flask import Blueprint

from middlewares import token_required, log_request
from controllers import PurchaseController

purchase_blueprint = Blueprint('purchase', __name__)

@purchase_blueprint.route('/purchase_product', methods=['POST'])
@log_request
@token_required
def purchase_product(user):
    return PurchaseController.purchase_product(user)

@purchase_blueprint.route('/', methods=['GET'])
@log_request
@token_required
def get_purchase_by_user(user):
    return PurchaseController.get_purchase_by_user(user['_id'])