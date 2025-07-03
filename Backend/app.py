import threading
from flask import Flask
from flask_cors import CORS
from sockets import start_server
from config import Config
from routes import register_blueprints
from utils import logger
from gevent import pywsgi
import sys, signal
from services import DetectionService

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
        # Load Config
        app.config.from_object(Config)
        
        # Initial MongoDB connection store in app.config
        mongodb = Config.init_db()
        app.config["MongoDB"] = mongodb
        
        # Log successful MongoDB connection
        logger.info(f"success: connect to mongoDB @{Config.MONGO_HOST}")
        
        # Blueprint
        with app.app_context():
            register_blueprints(app)
        
        # Log server startup
        logger.info(f"listening on *:{Config.PORT}")
        
        # initalize detection service
        detection_service = DetectionService()
        thread = threading.Thread(target=lambda: start_server(Config.SOCKET_PORT, detection_service), daemon=True)
        thread.start()
        
        logger.info(f"Socket server listening on *:{Config.SOCKET_PORT}")
        
        return app
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        raise e

if __name__ == "__main__":
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    app = create_app()
    
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