from flask import Blueprint

from middlewares import admin_required, token_required, log_request
from controllers import StationController

station_blueprint = Blueprint('station', __name__)

@station_blueprint.route('/types', methods=['GET'])
@log_request
@token_required
def get_station_type(user):
    return StationController.get_station_types(user)

@station_blueprint.route('/types/create', methods=['POST'])
@log_request
@admin_required
def add_station_type():
    return StationController.create_station_types()

@station_blueprint.route('/types/delete', methods=['DELETE'])
@log_request
@admin_required
def delete_station_type():
    return StationController.delete_station_types()

@station_blueprint.route('/types/update', methods=['PUT'])
@log_request
@admin_required
def update_station_type():
    return StationController.update_station_types()

@station_blueprint.route('/', methods=['GET'])
@log_request
@token_required
def get_stations(user):
    return StationController.get_stations(user)

@station_blueprint.route('/create', methods=['POST'])
@log_request
@admin_required
def create_station():
    return StationController.create_station()

@station_blueprint.route('/delete', methods=['DELETE'])
@log_request
@admin_required
def delete_station():
    return StationController.delete_station()

@station_blueprint.route('/update', methods=['PUT'])
@log_request
@admin_required
def update_station():
    return StationController.update_station()
