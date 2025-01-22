from flask import Flask
from flask_cors import CORS
from config import Config, init_db
from routes.user_route import user_blueprint
from routes.auth_route import auth_blueprint
from utils.logger_config import logger
from gevent import pywsgi
import sys, signal

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "Hello"

def signal_handler(sig, frame):
    logger.info("Server shutting down...")
    sys.exit(0)

def create_app():
    try:
        # Load Flask settings
        app.config.from_object(Config)
        
        # Initial MongoDB connection store in app.config
        mongodb = init_db()
        app.config["MongoDB"] = mongodb
        
        # Log successful MongoDB connection
        logger.info(f"success: connect to mongoDB @{Config.MONGO_HOST}")
        
        # Blueprint
        app.register_blueprint(user_blueprint, url_prefix="/users")
        app.register_blueprint(auth_blueprint, url_prefix="/auth")
        
        # Log server startup
        logger.info(f"listening on *:{Config.PORT}")
        
        return app
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise e

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    
    app = create_app()
    server = pywsgi.WSGIServer(('0.0.0.0', Config.PORT), app, log=None)
    
    try:
        server.serve_forever()
        
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
        sys.exit(0)