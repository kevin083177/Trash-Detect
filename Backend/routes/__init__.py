from flask import Flask

from .user_route import user_blueprint
from .auth_route import auth_blueprint
from .admin_route import admin_blueprint
from .purchase_route import purchase_blueprint
from .record_route import record_blueprint
from .product_route import product_blueprint
from .theme_route import theme_blueprint

api_prefix = '/api/v1/'

def register_blueprints(app: Flask):
    app.register_blueprint(user_blueprint, url_prefix=f"{api_prefix}users")
    app.register_blueprint(auth_blueprint, url_prefix=f"{api_prefix}auth") 
    app.register_blueprint(admin_blueprint, url_prefix=f"{api_prefix}admin")
    app.register_blueprint(purchase_blueprint, url_prefix=f"{api_prefix}purchase")
    app.register_blueprint(record_blueprint, url_prefix=f"{api_prefix}record")
    app.register_blueprint(product_blueprint, url_prefix=f"{api_prefix}product")
    app.register_blueprint(theme_blueprint, url_prefix=f"{api_prefix}theme")