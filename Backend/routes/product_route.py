from flask import Blueprint

from middlewares import token_required, log_request
from controllers import ProductController

product_blueprint = Blueprint('product', __name__)

@product_blueprint.route('/<product_id>', methods=['GET'])
@log_request
@token_required
def get_product_by_id(user, product_id):
    return ProductController.get_product_by_id(user, product_id)