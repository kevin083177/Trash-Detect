from flask import Flask
from flask_cors import CORS
from config import Config, init_db
from routes.user_route import user_blueprint

app = Flask(__name__)
CORS(app)

# Load Flask settings
app.config.from_object(Config)

# Initial MongoDB connection store in app.config
app.config["MongoDB"] = init_db()

# Blueprint
app.register_blueprint(user_blueprint, url_prefix="/users")
    
if __name__ == "__main__":
    app.run(debug=app.config["DEBUG"], host="0.0.0.0", port=Config.PORT)