import os
import threading
from flask import Flask, send_from_directory
from flask_cors import CORS
from sockets import start_server
from config import Config
from routes import register_blueprints
from utils import logger, start_scheduler, stop_scheduler, init_default_data
from gevent import pywsgi
import sys, signal
from services import DetectionService

ADMIN_DIST = os.path.join(os.path.dirname(__file__), "..", Config.ADMIN_PATH, "dist")

app = Flask(__name__, static_folder=ADMIN_DIST, static_url_path="/")
CORS(app)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, "index.html")

def signal_handler(sig, frame):
    logger.info("Server shutting down...")
    stop_scheduler()
    sys.exit(0)

def create_app():
    try:
        # Load Config
        app.config.from_object(Config)
        
        # Initial MongoDB connection store in app.config
        mongodb = Config.init_db()
        app.config["MongoDB"] = mongodb
        
        # Log successful MongoDB connection
        logger.info(f"success: connect to mongoDB @{Config.MONGO_HOST}")
        
        # Blueprint
        with app.app_context():
            init_default_data(mongodb)
            register_blueprints(app)
        
        # Log server startup
        logger.info(f"listening on *:{Config.PORT}")
        
        # initalize detection service
        detection_service = DetectionService()
        thread = threading.Thread(target=lambda: start_server(Config.SOCKET_PORT, detection_service), daemon=True)
        thread.start()
        
        logger.info(f"Socket server listening on *:{Config.SOCKET_PORT}")
        
        start_scheduler()
        logger.info("Daily trash statistics scheduler started")
        
        return app
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise e

try:
    app = create_app()
    
except Exception as e:
    print(f"Error during app initialization: {e}")

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # 根據環境變數決定使用哪種伺服器
    if Config.ENV == 'development':
        app.run(
            host='0.0.0.0',
            port=Config.PORT,
            debug=True,
            use_reloader=False
        )
    elif Config.ENV == 'production':
        # 生產環境：使用 gevent WSGIServer
        server = pywsgi.WSGIServer(('0.0.0.0', Config.PORT), app, log=None)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            logger.info("Server shutting down...")
            sys.exit(0)