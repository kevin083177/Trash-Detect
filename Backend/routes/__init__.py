from flask import Flask

from .user_route import user_blueprint
from .auth_route import auth_blueprint
from .admin_route import admin_blueprint
from .purchase_route import purchase_blueprint

def register_blueprints(app: Flask):
    app.register_blueprint(user_blueprint, url_prefix="/users")
    app.register_blueprint(auth_blueprint, url_prefix="/auth") 
    app.register_blueprint(admin_blueprint, url_prefix="/admin")
    app.register_blueprint(purchase_blueprint, url_prefix="/purchase")