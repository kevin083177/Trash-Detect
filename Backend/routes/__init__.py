from flask import Flask

from .user_route import user_blueprint
from .auth_route import auth_blueprint
from .admin_route import admin_blueprint
from .purchase_route import purchase_blueprint
from .product_route import product_blueprint
from .theme_route import theme_blueprint
from .chapter_route import chapter_blueprint
from .level_route import level_blueprint
from .user_level_route import user_level_blueprint
from .question_route import question_blueprint
from .question_category_route import question_category_blueprint
from .feedback_route import feedback_blueprint

api_prefix = '/api/v1/'

def register_blueprints(app: Flask):
    app.register_blueprint(user_blueprint, url_prefix=f"{api_prefix}users")
    app.register_blueprint(auth_blueprint, url_prefix=f"{api_prefix}auth") 
    app.register_blueprint(admin_blueprint, url_prefix=f"{api_prefix}admin")
    app.register_blueprint(purchase_blueprint, url_prefix=f"{api_prefix}purchase")
    app.register_blueprint(product_blueprint, url_prefix=f"{api_prefix}product")
    app.register_blueprint(theme_blueprint, url_prefix=f"{api_prefix}theme")
    app.register_blueprint(chapter_blueprint, url_prefix=f"{api_prefix}chapter")
    app.register_blueprint(level_blueprint, url_prefix=f"{api_prefix}level")
    app.register_blueprint(user_level_blueprint, url_prefix=f"{api_prefix}users/level")
    app.register_blueprint(question_blueprint, url_prefix=f"{api_prefix}question")
    app.register_blueprint(question_category_blueprint, url_prefix=f"{api_prefix}question/category")
    app.register_blueprint(feedback_blueprint, url_prefix=f"{api_prefix}feedback")