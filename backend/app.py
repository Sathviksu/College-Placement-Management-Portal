from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
import os
from datetime import timedelta



# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)


# CRITICAL JWT Configuration
app.config['JWT_SECRET_KEY'] = 'placement_portal_super_secret_jwt_key_2024_hackathon'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)  # 7 days
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['PROPAGATE_EXCEPTIONS'] = True


# Initialize CORS - FIXED
CORS(app, 
     origins=['http://localhost:5173'],
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])


# Initialize JWT
jwt = JWTManager(app)


# Create upload folder
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)


# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'success',
        'message': 'Backend is running!',
        'database': 'connected'
    }), 200


# ============================================
# IMPORT ROUTES
# ============================================
from routes.auth import auth_bp
from routes.student import student_bp
from routes.tpo import tpo_bp
from routes.hod import hod_bp  # ADD THIS LINE


# ============================================
# REGISTER BLUEPRINTS
# ============================================
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(student_bp, url_prefix='/api/student')
app.register_blueprint(tpo_bp, url_prefix='/api/tpo')
app.register_blueprint(hod_bp, url_prefix='/api/hod')  # ADD THIS LINE


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# JWT error handlers - FIXED
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'error': 'Token has expired'}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'error': 'Invalid token'}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'error': 'Authorization token is missing'}), 401


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 PLACEMENT PORTAL - BACKEND SERVER")
    print("="*60)
    print(f"Server: http://localhost:5000")
    print(f"JWT Expiry: 7 days")
    print("\n📍 Active Routes:")
    print("  /api/auth/*     - Authentication")
    print("  /api/student/*  - Student Module")
    print("  /api/tpo/*      - TPO Module")
    print("  /api/hod/*      - HOD Module ✨ NEW")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
