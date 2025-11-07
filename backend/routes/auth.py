from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from utils.db import get_db_connection
from datetime import datetime


auth_bp = Blueprint('auth', __name__)


def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, hashed):
    """Verify password against hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


# ============================================
# REGISTER ENDPOINT
# ============================================
@auth_bp.route('/register', methods=['POST'])
def register():
    """Register new user (Student, HOD, or TPO)"""
    try:
        data = request.get_json()
        required_fields = ['email', 'password', 'role', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400

        email = data['email'].lower().strip()
        password = data['password']
        role = data['role'].lower()
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()

        if role not in ['student', 'hod', 'tpo']:
            return jsonify({'error': 'Invalid role'}), 400

        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'error': 'Email already registered'}), 409

            password_hash = hash_password(password)

            cursor.execute(
                "INSERT INTO users (email, password_hash, role, is_verified) VALUES (%s, %s, %s, %s)",
                (email, password_hash, role, True)
            )
            user_id = cursor.lastrowid

            if role == 'student':
                department_id = data.get('department_id', 1)  # Default to first department
                enrollment_number = data.get('enrollment_number', f'STU{user_id:06d}')
                phone = data.get('phone', '')

                cursor.execute(
                    """INSERT INTO students 
                    (user_id, department_id, enrollment_number, first_name, last_name, phone, is_approved) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (user_id, department_id, enrollment_number, first_name, last_name, phone, False)
                )

            elif role == 'hod':
                department_id = data.get('department_id', 1)
                phone = data.get('phone', '')

                cursor.execute(
                    """INSERT INTO hods 
                    (user_id, department_id, first_name, last_name, phone) 
                    VALUES (%s, %s, %s, %s, %s)""",
                    (user_id, department_id, first_name, last_name, phone)
                )

            elif role == 'tpo':
                phone = data.get('phone', '')
                designation = data.get('designation', 'Training & Placement Officer')

                cursor.execute(
                    """INSERT INTO tpos 
                    (user_id, first_name, last_name, phone, designation) 
                    VALUES (%s, %s, %s, %s, %s)""",
                    (user_id, first_name, last_name, phone, designation)
                )

            conn.commit()

            # Send welcome email asynchronously could be added here if needed

            return jsonify({
                'message': 'Registration successful',
                'user_id': user_id,
                'email': email,
                'role': role,
                'first_name': first_name,
                'last_name': last_name,
            }), 201

        except Exception as e:
            conn.rollback()
            print(f"Registration error: {e}")
            return jsonify({'error': 'Registration failed', 'details': str(e)}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Register endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# ============================================
# LOGIN ENDPOINT
# ============================================
@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400

        email = data['email'].lower().strip()
        password = data['password']

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id, email, password_hash, role, is_active FROM users WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()

            if not user:
                return jsonify({'error': 'Invalid email or password'}), 401

            if not user['is_active']:
                return jsonify({'error': 'Account is deactivated'}), 403

            if not verify_password(password, user['password_hash']):
                return jsonify({'error': 'Invalid email or password'}), 401

            # Get role-specific data
            role_data = {}
            if user['role'] == 'student':
                cursor.execute(
                    """SELECT s.*, d.name as department_name, d.code as department_code 
                    FROM students s 
                    JOIN departments d ON s.department_id = d.id 
                    WHERE s.user_id = %s""",
                    (user['id'],)
                )
                role_data = cursor.fetchone()

            elif user['role'] == 'hod':
                cursor.execute(
                    """SELECT h.*, d.name as department_name, d.code as department_code 
                    FROM hods h 
                    JOIN departments d ON h.department_id = d.id 
                    WHERE h.user_id = %s""",
                    (user['id'],)
                )
                role_data = cursor.fetchone()

            elif user['role'] == 'tpo':
                cursor.execute(
                    "SELECT * FROM tpos WHERE user_id = %s",
                    (user['id'],)
                )
                role_data = cursor.fetchone()

            cursor.execute(
                "UPDATE users SET last_login = %s WHERE id = %s",
                (datetime.now(), user['id'])
            )
            conn.commit()

            token = create_access_token(
                identity={
                    'user_id': user['id'],
                    'email': user['email'],
                    'role': user['role']
                }
            )

            response_data = {
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'role': user['role'],
                    'first_name': role_data.get('first_name', ''),
                    'last_name': role_data.get('last_name', ''),
                }
            }

            if user['role'] == 'student':
                response_data['user'].update({
                    'student_id': role_data['id'],
                    'enrollment_number': role_data['enrollment_number'],
                    'department_id': role_data['department_id'],
                    'department_name': role_data['department_name'],
                    'cgpa': float(role_data['cgpa']) if role_data['cgpa'] else None,
                    'is_approved': role_data['is_approved']
                })
            elif user['role'] == 'hod':
                response_data['user'].update({
                    'hod_id': role_data['id'],
                    'department_id': role_data['department_id'],
                    'department_name': role_data['department_name']
                })
            elif user['role'] == 'tpo':
                response_data['user'].update({
                    'tpo_id': role_data['id'],
                    'designation': role_data['designation']
                })

            return jsonify(response_data), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500


# ============================================
# GET CURRENT USER
# ============================================
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current logged-in user details"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user['user_id']

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id, email, role, is_active FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()

            if not user:
                return jsonify({'error': 'User not found'}), 404

            role_data = {}
            if user['role'] == 'student':
                cursor.execute(
                    """SELECT s.*, d.name as department_name 
                    FROM students s 
                    JOIN departments d ON s.department_id = d.id 
                    WHERE s.user_id = %s""",
                    (user_id,)
                )
                role_data = cursor.fetchone()

            elif user['role'] == 'hod':
                cursor.execute(
                    """SELECT h.*, d.name as department_name 
                    FROM hods h 
                    JOIN departments d ON h.department_id = d.id 
                    WHERE h.user_id = %s""",
                    (user_id,)
                )
                role_data = cursor.fetchone()

            elif user['role'] == 'tpo':
                cursor.execute(
                    "SELECT * FROM tpos WHERE user_id = %s",
                    (user_id,)
                )
                role_data = cursor.fetchone()

            response = {
                'id': user['id'],
                'email': user['email'],
                'role': user['role'],
                'is_active': user['is_active'],
                **role_data
            }

            return jsonify(response), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get current user error: {e}")
        return jsonify({'error': 'Failed to get user data'}), 500


# ============================================
# LOGOUT ENDPOINT
# ============================================
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side)"""
    return jsonify({'message': 'Logout successful'}), 200


# ============================================
# GET DEPARTMENTS
# ============================================
@auth_bp.route('/departments', methods=['GET'])
def get_departments():
    """Get all departments"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, code FROM departments ORDER BY name")
            departments = cursor.fetchall()

            return jsonify({'departments': departments}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get departments error: {e}")
        return jsonify({'error': 'Failed to get departments'}), 500
