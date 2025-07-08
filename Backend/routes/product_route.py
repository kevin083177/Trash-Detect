from flask import Blueprint

from middlewares import token_required, log_request, admin_required
from controllers import ProductController

product_blueprint = Blueprint('product', __name__)

@product_blueprint.route('/<product_id>', methods=['GET'])
@log_request
@token_required
def get_product_by_id(user, product_id):
    return ProductController.get_product_by_id(user, product_id)

@product_blueprint.route('/add_product', methods=['POST'])
@admin_required
@log_request
def add_product():
    return ProductController.add_product()

@product_blueprint.route('/delete_product', methods=['DELETE'])
@admin_required
@log_request
def delete_product_by_id():
    return ProductController.delete_product_by_id()

@product_blueprint.route('/delete_all', methods=['DELETE'])
@admin_required
@log_request
def delete_all_products():
    return ProductController.delete_all_products()

@product_blueprint.route('/update_product/<product_id>', methods=['PUT'])
@admin_required
@log_request
def update_product(product_id):
    return ProductController.update_product(product_id)
