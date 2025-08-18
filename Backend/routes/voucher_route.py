from flask import Blueprint
from middlewares import token_required, admin_required, log_request
from controllers import VoucherController

voucher_blueprint = Blueprint('voucher', __name__)

@voucher_blueprint.route('/types', methods=['GET'])
@log_request
@token_required
def get_voucher_types(user):
    return VoucherController.get_voucher_types(user)

@voucher_blueprint.route('/types/create', methods=['POST'])
@log_request
@admin_required
def create_voucher_type():
    return VoucherController.create_voucher_type()

@voucher_blueprint.route('/types/delete', methods=['DELETE'])
@log_request
@admin_required
def delete_voucher_type():
    return VoucherController.delete_voucher_type()

@voucher_blueprint.route('/types/update', methods=['PUT'])
@log_request
@admin_required
def update_voucher_type():
    return VoucherController.update_voucher_type()

@voucher_blueprint.route('/redeem', methods=['POST'])
@log_request
@token_required
def redeem_voucher(user):
    return VoucherController.redeem_voucher(user)

@voucher_blueprint.route('/my', methods=['GET'])
@log_request
@token_required
def get_user_vouchers(user):
    return VoucherController.get_user_vouchers(user)