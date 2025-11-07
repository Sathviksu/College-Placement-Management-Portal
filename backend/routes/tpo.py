from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from utils.db import execute_query
from utils.email_service import (
    send_email,
    get_shortlisted_email,
    get_selected_email,
    get_rejected_email
)
from datetime import datetime
import traceback

tpo_bp = Blueprint('tpo', __name__)

# ============================================
# COMPANY MANAGEMENT
# ============================================

@tpo_bp.route('/companies', methods=['GET'])
@jwt_required()
def get_companies():
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        search = request.args.get('search')

        query = """
            SELECT c.id, c.name, c.description, c.website, c.logo_url,
            c.industry, c.location, c.created_by, c.created_at, c.updated_at,
            COUNT(DISTINCT pd.id) AS total_drives,
            COUNT(DISTINCT a.id) AS total_applications
            FROM companies c
            LEFT JOIN placementdrives pd ON c.id = pd.companyid
            LEFT JOIN applications a ON pd.id = a.driveid
        """
        params = []
        conditions = []
        if search:
            conditions.append("(c.name LIKE %s OR c.industry LIKE %s)")
            params.extend([f"%{search}%", f"%{search}%"])
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " GROUP BY c.id ORDER BY c.created_at DESC"

        companies = execute_query(query, params, fetch=True)

        if companies is None:
            return jsonify({'error': 'Failed to fetch companies'}), 500

        return jsonify({'companies': companies, 'count': len(companies)}), 200

    except Exception as e:
        print(f"Get companies error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@tpo_bp.route('/companies/<int:company_id>', methods=['GET'])
@jwt_required()
def get_company_details(company_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
            company = cursor.fetchone()
            if not company:
                return jsonify({'error': 'Company not found'}), 404
            cursor.execute("""
                SELECT 
                    pd.*,
                    COUNT(a.id) as application_count
                FROM placement_drives pd
                LEFT JOIN applications a ON pd.id = a.drive_id
                WHERE pd.company_id = %s
                GROUP BY pd.id
                ORDER BY pd.created_at DESC
            """, (company_id,))
            drives = cursor.fetchall()
            for drive in drives:
                if drive.get('package_ctc'):
                    drive['package_ctc'] = float(drive['package_ctc'])
                if drive.get('package_base'):
                    drive['package_base'] = float(drive['package_base'])
                if drive.get('min_cgpa'):
                    drive['min_cgpa'] = float(drive['min_cgpa'])
            company['drives'] = drives
            return jsonify({'company': company}), 200
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Get company details error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get company details'}), 500

@tpo_bp.route('/companies', methods=['POST'])
@jwt_required()
def create_company():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        data = request.get_json()
        required_fields = ['name', 'industry', 'location']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM companies WHERE name = %s", (data['name'],))
            if cursor.fetchone():
                return jsonify({'error': 'Company already exists'}), 409
            cursor.execute("""
                INSERT INTO companies 
                (name, description, website, industry, location, created_by)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                data['name'],
                data.get('description', ''),
                data.get('website', ''),
                data['industry'],
                data['location'],
                user_id
            ))
            company_id = cursor.lastrowid
            conn.commit()
            return jsonify({'message': 'Company created successfully', 'company_id': company_id}), 201
        except Exception as e:
            conn.rollback()
            print(f"Create company error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to create company'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Create company endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@tpo_bp.route('/companies/<int:company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM companies WHERE id = %s", (company_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Company not found'}), 404
            update_fields = []
            update_values = []
            allowed_fields = ['name', 'description', 'website', 'industry', 'location', 'logo_url']
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(data[field])
            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400
            update_values.append(company_id)
            query = f"UPDATE companies SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, tuple(update_values))
            conn.commit()
            return jsonify({'message': 'Company updated successfully'}), 200
        except Exception as e:
            conn.rollback()
            print(f"Update company error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to update company'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Update company endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@tpo_bp.route('/companies/<int:company_id>', methods=['DELETE'])
@jwt_required()
def delete_company(company_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) as active_drives 
                FROM placement_drives 
                WHERE company_id = %s AND status = 'active'
            """, (company_id,))
            result = cursor.fetchone()
            if result and result.get('active_drives', 0) > 0:
                return jsonify({'error': 'Cannot delete company with active drives'}), 400
            cursor.execute("DELETE FROM companies WHERE id = %s", (company_id,))
            conn.commit()
            return jsonify({'message': 'Company deleted successfully'}), 200
        except Exception as e:
            conn.rollback()
            print(f"Delete company error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to delete company'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Delete company endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# ... The rest of your tpo.py functions including stats, drives, application, rounds, analytics, etc.
# Due to length limitations, continuing in the next response is recommended.
# ============================================
# TPO DASHBOARD STATS
# ============================================

@tpo_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_tpo_stats():
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) as total FROM companies")
            companies = cursor.fetchone()

            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                FROM placement_drives
            """)
            drives = cursor.fetchone()

            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) as selected
                FROM applications
            """)
            applications = cursor.fetchone()

            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved
                FROM students
            """)
            students = cursor.fetchone()

            return jsonify({
                'stats': {
                    'total_companies': int(companies.get('total', 0)),
                    'total_drives': int(drives.get('total', 0)),
                    'active_drives': int(drives.get('active', 0)),
                    'completed_drives': int(drives.get('completed', 0)),
                    'total_applications': int(applications.get('total', 0)),
                    'students_placed': int(applications.get('selected', 0)),
                    'total_students': int(students.get('total', 0)),
                    'approved_students': int(students.get('approved', 0))
                }
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get TPO stats error: {e}")
        traceback.print_exc()
        return jsonify({
            'stats': {
                'total_companies': 0,
                'total_drives': 0,
                'active_drives': 0,
                'completed_drives': 0,
                'total_applications': 0,
                'students_placed': 0,
                'total_students': 0,
                'approved_students': 0
            }
        }), 200


# ============================================
# PLACEMENT DRIVE MANAGEMENT
# ============================================

@tpo_bp.route('/drives', methods=['GET'])
@jwt_required()
def get_drives():
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        status = request.args.get('status', '')
        company_id = request.args.get('company_id', '')

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            query = """
                SELECT 
                    pd.*,
                    c.name as company_name,
                    c.industry,
                    COUNT(DISTINCT a.id) as application_count,
                    COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.id END) as selected_count
                FROM placement_drives pd
                JOIN companies c ON pd.company_id = c.id
                LEFT JOIN applications a ON pd.id = a.drive_id
            """

            params = []
            conditions = []

            if status:
                conditions.append("pd.status = %s")
                params.append(status)

            if company_id:
                conditions.append("pd.company_id = %s")
                params.append(company_id)

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " GROUP BY pd.id ORDER BY pd.created_at DESC"

            cursor.execute(query, tuple(params))
            drives = cursor.fetchall()

            for drive in drives:
                if drive.get('package_ctc'):
                    drive['package_ctc'] = float(drive['package_ctc'])
                if drive.get('package_base'):
                    drive['package_base'] = float(drive['package_base'])
                if drive.get('min_cgpa'):
                    drive['min_cgpa'] = float(drive['min_cgpa'])

            return jsonify({
                'drives': drives,
                'count': len(drives)
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get drives error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get drives'}), 500


@tpo_bp.route('/drives/<int:drive_id>', methods=['GET'])
@jwt_required()
def get_drive_details(drive_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    pd.*,
                    c.name as company_name,
                    c.description as company_description,
                    c.industry,
                    c.website as company_website
                FROM placement_drives pd
                JOIN companies c ON pd.company_id = c.id
                WHERE pd.id = %s
            """, (drive_id,))

            drive = cursor.fetchone()

            if not drive:
                return jsonify({'error': 'Drive not found'}), 404

            if drive.get('package_ctc'):
                drive['package_ctc'] = float(drive['package_ctc'])
            if drive.get('package_base'):
                drive['package_base'] = float(drive['package_base'])
            if drive.get('min_cgpa'):
                drive['min_cgpa'] = float(drive['min_cgpa'])

            cursor.execute("""
                SELECT * FROM rounds 
                WHERE drive_id = %s 
                ORDER BY round_number
            """, (drive_id,))

            rounds = cursor.fetchall()
            drive['rounds'] = rounds

            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
                    SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                    SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) as selected,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM applications
                WHERE drive_id = %s
            """, (drive_id,))

            app_stats = cursor.fetchone()
            drive['application_stats'] = {
                'total': int(app_stats.get('total', 0)),
                'applied': int(app_stats.get('applied', 0)),
                'shortlisted': int(app_stats.get('shortlisted', 0)),
                'selected': int(app_stats.get('selected', 0)),
                'rejected': int(app_stats.get('rejected', 0))
            }

            return jsonify({'drive': drive}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get drive details error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get drive details'}), 500

# ... Additional functions for create_drive, update_drive, delete_drive,
# applications management, round management, analytics, etc.
# Continue providing in subsequent responses...

@tpo_bp.route('/drives', methods=['POST'])
@jwt_required()
def create_drive():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()
        required_fields = ['company_id', 'job_role', 'job_description', 'package_ctc',
                           'location', 'job_type', 'min_cgpa', 'max_backlogs', 'application_deadline']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM companies WHERE id = %s", (data['company_id'],))
            if not cursor.fetchone():
                return jsonify({'error': 'Company not found'}), 404

            cursor.execute("""
                INSERT INTO placement_drives 
                (company_id, job_role, job_description, package_ctc, package_base, package_stipend,
                 location, job_type, min_cgpa, max_backlogs, application_deadline,
                 status, total_rounds, created_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['company_id'],
                data['job_role'],
                data['job_description'],
                data['package_ctc'],
                data.get('package_base', data['package_ctc']),
                data.get('package_stipend', 0),
                data['location'],
                data['job_type'],
                data['min_cgpa'],
                data['max_backlogs'],
                data['application_deadline'],
                'active',
                data.get('total_rounds', 3),
                user_id
            ))

            drive_id = cursor.lastrowid

            rounds = data.get('rounds', [])
            for i, round_data in enumerate(rounds):
                cursor.execute("""
                    INSERT INTO rounds (drive_id, round_number, round_name, round_type)
                    VALUES (%s, %s, %s, %s)
                """, (
                    drive_id,
                    i + 1,
                    round_data.get('name', f'Round {i + 1}'),
                    round_data.get('type', 'technical')
                ))

            conn.commit()

            return jsonify({
                'message': 'Drive created successfully',
                'drive_id': drive_id
            }), 201

        except Exception as e:
            conn.rollback()
            print(f"Create drive error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to create drive'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Create drive endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@tpo_bp.route('/drives/<int:drive_id>', methods=['PUT'])
@jwt_required()
def update_drive(drive_id):
    try:
        current_user = get_jwt_identity()

        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        conn = get_db_connection()

        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM placement_drives WHERE id = %s", (drive_id,))
            if not cursor.fetchone():
                return jsonify({'error': 'Drive not found'}), 404

            update_fields = []
            update_values = []
            allowed_fields = ['job_role', 'job_description', 'package_ctc', 'package_base',
                              'package_stipend', 'location', 'job_type', 'min_cgpa',
                              'max_backlogs', 'application_deadline', 'status']
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            update_values.append(drive_id)

            query = f"UPDATE placement_drives SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, tuple(update_values))
            conn.commit()

            return jsonify({'message': 'Drive updated successfully'}), 200

        except Exception as e:
            conn.rollback()
            print(f"Update drive error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to update drive'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Update drive endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@tpo_bp.route('/drives/<int:drive_id>', methods=['DELETE'])
@jwt_required()
def delete_drive(drive_id):
    try:
        current_user = get_jwt_identity()

        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
            
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT COUNT(*) as app_count 
                FROM applications 
                WHERE drive_id = %s
            """, (drive_id,))
            
            result = cursor.fetchone()
            if result and result.get('app_count', 0) > 0:
                return jsonify({'error': 'Cannot delete drive with existing applications'}), 400

            cursor.execute("DELETE FROM rounds WHERE drive_id = %s", (drive_id,))
            cursor.execute("DELETE FROM placement_drives WHERE id = %s", (drive_id,))
            conn.commit()

            return jsonify({'message': 'Drive deleted successfully'}), 200

        except Exception as e:
            conn.rollback()
            print(f"Delete drive error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to delete drive'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Delete drive endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# ... Continue with application management, rounds, and analytics functions in next response
# ============================================
# APPLICATION MANAGEMENT
# ============================================

@tpo_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_applications():
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        drive_id = request.args.get('drive_id', '')
        status = request.args.get('status', '')
        search = request.args.get('search', '')

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            query = """
                SELECT 
                    a.*,
                    s.enrollment_number,
                    s.first_name,
                    s.last_name,
                    s.cgpa,
                    s.phone,
                    s.resume_url,
                    d.name as department_name,
                    pd.job_role,
                    pd.package_ctc,
                    c.name as company_name
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN departments d ON s.department_id = d.id
                JOIN placement_drives pd ON a.drive_id = pd.id
                JOIN companies c ON pd.company_id = c.id
            """

            params = []
            conditions = []

            if drive_id:
                conditions.append("a.drive_id = %s")
                params.append(drive_id)

            if status:
                conditions.append("a.status = %s")
                params.append(status)

            if search:
                conditions.append("(s.first_name LIKE %s OR s.last_name LIKE %s OR s.enrollment_number LIKE %s)")
                params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY a.applied_at DESC"

            cursor.execute(query, tuple(params))
            applications = cursor.fetchall()

            for app in applications:
                if app.get('cgpa') is not None:
                    app['cgpa'] = float(app['cgpa'])
                if app.get('package_ctc') is not None:
                    app['package_ctc'] = float(app['package_ctc'])

            return jsonify({
                'applications': applications,
                'count': len(applications)
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get applications error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get applications'}), 500


@tpo_bp.route('/applications/<int:application_id>', methods=['GET'])
@jwt_required()
def get_application_details(application_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    a.*,
                    s.*,
                    d.name as department_name,
                    pd.*,
                    c.name as company_name,
                    u.email
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN users u ON s.user_id = u.id
                JOIN departments d ON s.department_id = d.id
                JOIN placement_drives pd ON a.drive_id = pd.id
                JOIN companies c ON pd.company_id = c.id
                WHERE a.id = %s
            """, (application_id,))

            application = cursor.fetchone()

            if not application:
                return jsonify({'error': 'Application not found'}), 404

            if application.get('cgpa') is not None:
                application['cgpa'] = float(application['cgpa'])
            if application.get('package_ctc') is not None:
                application['package_ctc'] = float(application['package_ctc'])

            return jsonify({'application': application}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get application details error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get application details'}), 500


@tpo_bp.route('/applications/<int:application_id>/status', methods=['PUT'])
@jwt_required()
def update_application_status(application_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()
        if 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400

        new_status = data['status']
        valid_statuses = ['applied', 'shortlisted', 'selected', 'rejected', 'on_hold']

        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT a.*, s.user_id, pd.job_role, pd.package_ctc, c.name as company_name
                FROM applications a
                JOIN students s ON a.student_id = s.id
                JOIN placement_drives pd ON a.drive_id = pd.id
                JOIN companies c ON pd.company_id = c.id
                WHERE a.id = %s
            """, (application_id,))

            application = cursor.fetchone()

            if not application:
                return jsonify({'error': 'Application not found'}), 404

            cursor.execute("""
                UPDATE applications 
                SET status = %s, updated_at = %s 
                WHERE id = %s
            """, (new_status, datetime.now(), application_id))

            notification_messages = {
                'shortlisted': f'Congratulations! You have been shortlisted for {application["job_role"]} at {application["company_name"]}.',
                'selected': f'🎉 Congratulations! You have been SELECTED for {application["job_role"]} at {application["company_name"]}!',
                'rejected': f'Your application for {application["job_role"]} at {application["company_name"]} has been rejected.',
                'on_hold': f'Your application for {application["job_role"]} at {application["company_name"]} is on hold.'
            }

            if new_status in notification_messages:
                cursor.execute("""
                    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    application['user_id'],
                    'Application Status Update',
                    notification_messages[new_status],
                    'info' if new_status != 'selected' else 'success',
                    'application',
                    application_id
                ))

            conn.commit()

            # Send email notifications
            try:
                cursor.execute("SELECT email FROM users WHERE id = %s", (application['user_id'],))
                user_email = cursor.fetchone()['email']

                cursor.execute("""
                    SELECT s.first_name, s.last_name 
                    FROM students s 
                    WHERE user_id = %s
                """, (application['user_id'],))
                student_name_data = cursor.fetchone()
                student_name = f"{student_name_data['first_name']} {student_name_data['last_name']}"

                if new_status == 'shortlisted':
                    email_html = get_shortlisted_email(
                        student_name,
                        application['company_name'],
                        application['job_role'],
                        'Next Round'
                    )
                    send_email(user_email, "You're Shortlisted! ⭐", email_html)

                elif new_status == 'selected':
                    package = f"{float(application['package_ctc'])/100000:.1f} LPA" if application.get('package_ctc') else "N/A"
                    email_html = get_selected_email(
                        student_name,
                        application['company_name'],
                        application['job_role'],
                        package
                    )
                    send_email(user_email, "🎉 Congratulations! You're SELECTED!", email_html)

                elif new_status == 'rejected':
                    email_html = get_rejected_email(
                        student_name,
                        application['company_name'],
                        application['job_role']
                    )
                    send_email(user_email, "Application Update", email_html)

            except Exception as e:
                print(f"Email send failed: {e}")
                traceback.print_exc()

            return jsonify({'message': 'Application status updated successfully', 'new_status': new_status}), 200

        except Exception as e:
            conn.rollback()
            print(f"Update status error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to update status'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Update status endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

# Continue with bulk updating applications, round management, analytics similarly...

@tpo_bp.route('/applications/bulk-update', methods=['POST'])
@jwt_required()
def bulk_update_applications():
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        if 'application_ids' not in data or 'status' not in data:
            return jsonify({'error': 'application_ids and status are required'}), 400
        
        application_ids = data['application_ids']
        new_status = data['status']
        
        if not application_ids:
            return jsonify({'error': 'No applications selected'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            placeholders = ','.join(['%s'] * len(application_ids))
            query = f"UPDATE applications SET status = %s WHERE id IN ({placeholders})"
            cursor.execute(query, [new_status] + application_ids)
            conn.commit()
            return jsonify({
                'message': f'{len(application_ids)} applications updated successfully',
                'count': len(application_ids)
            }), 200
        except Exception as e:
            conn.rollback()
            print(f"Bulk update error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to update applications'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Bulk update endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@tpo_bp.route('/drives/<int:drive_id>/rounds', methods=['GET'])
@jwt_required()
def get_drive_rounds(drive_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT pd.*, c.name as company_name
                FROM placement_drives pd
                JOIN companies c ON pd.company_id = c.id
                WHERE pd.id = %s
            """, (drive_id,))
            drive = cursor.fetchone()
            if not drive:
                return jsonify({'error': 'Drive not found'}), 404
            
            cursor.execute("""
                SELECT * FROM rounds 
                WHERE drive_id = %s 
                ORDER BY round_number
            """, (drive_id,))
            rounds = cursor.fetchall()
            
            for round_data in rounds:
                cursor.execute("""
                    SELECT 
                        a.*,
                        s.first_name,
                        s.last_name,
                        s.enrollment_number,
                        s.cgpa,
                        d.name as department_name
                    FROM applications a
                    JOIN students s ON a.student_id = s.id
                    JOIN departments d ON s.department_id = d.id
                    WHERE a.drive_id = %s AND a.current_round >= %s
                    ORDER BY s.last_name
                """, (drive_id, round_data['round_number']))
                round_data['applications'] = cursor.fetchall()
            
            return jsonify({
                'drive': drive,
                'rounds': rounds
            }), 200
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Get rounds error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get rounds'}), 500


@tpo_bp.route('/applications/<int:application_id>/promote', methods=['POST'])
@jwt_required()
def promote_to_next_round(application_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.*, pd.total_rounds, s.user_id
                FROM applications a
                JOIN placement_drives pd ON a.drive_id = pd.id
                JOIN students s ON a.student_id = s.id
                WHERE a.id = %s
            """, (application_id,))
            application = cursor.fetchone()
            if not application:
                return jsonify({'error': 'Application not found'}), 404
            
            current_round = application['current_round']
            total_rounds = application['total_rounds']
            
            if current_round >= total_rounds:
                return jsonify({'error': 'Already in final round'}), 400
            
            new_round = current_round + 1
            new_status = 'shortlisted' if new_round < total_rounds else 'selected'
            
            cursor.execute("""
                UPDATE applications 
                SET current_round = %s, status = %s
                WHERE id = %s
            """, (new_round, new_status, application_id))
            
            message = 'Congratulations! You have been SELECTED!' if new_status == 'selected' else f'You have been shortlisted for Round {new_round}.'
            
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (%s, %s, %s, %s)
            """, (application['user_id'], 'Round Update', message, 'success' if new_status == 'selected' else 'info'))
            
            conn.commit()
            
            return jsonify({'message': 'Promoted to next round', 'new_round': new_round, 'new_status': new_status}), 200
        except Exception as e:
            conn.rollback()
            print(f"Promote error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to promote'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Promote endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


@tpo_bp.route('/applications/<int:application_id>/reject-round', methods=['POST'])
@jwt_required()
def reject_in_round(application_id):
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        data = request.get_json()
        feedback = data.get('feedback', '')
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT a.*, s.user_id
                FROM applications a
                JOIN students s ON a.student_id = s.id
                WHERE a.id = %s
            """, (application_id,))
            application = cursor.fetchone()
            if not application:
                return jsonify({'error': 'Application not found'}), 404
            cursor.execute("UPDATE applications SET status = 'rejected' WHERE id = %s", (application_id,))
            message = 'Unfortunately, you were not selected for the next round.'
            if feedback:
                message += f' Feedback: {feedback}'
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (%s, %s, %s, %s)
            """, (application['user_id'], 'Application Update', message, 'warning'))
            conn.commit()
            return jsonify({'message': 'Application rejected'}), 200
        except Exception as e:
            conn.rollback()
            print(f"Reject error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to reject'}), 500
        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Reject endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


# ============================================
# ANALYTICS
# ============================================

@tpo_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    try:
        current_user = get_jwt_identity()
        if current_user.get('role') != 'tpo':
            return jsonify({'error': 'Access denied'}), 403
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    c.name as company_name,
                    COUNT(a.id) as application_count
                FROM companies c
                LEFT JOIN placement_drives pd ON c.id = pd.company_id
                LEFT JOIN applications a ON pd.id = a.drive_id
                GROUP BY c.id, c.name
                ORDER BY application_count DESC
                LIMIT 5
            """)
            company_stats = cursor.fetchall()

            cursor.execute("""
                SELECT 
                    SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
                    SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                    SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) as selected,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM applications
            """)
            status_stats = cursor.fetchone()

            cursor.execute("""
                SELECT 
                    d.name as department_name,
                    COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN s.id END) as placed_count
                FROM departments d
                LEFT JOIN students s ON d.id = s.department_id
                LEFT JOIN applications a ON s.id = a.student_id
                GROUP BY d.id, d.name
                ORDER BY placed_count DESC
            """)
            department_stats = cursor.fetchall()

            cursor.execute("SELECT COUNT(*) as total FROM applications")
            total_apps = cursor.fetchone()

            cursor.execute("SELECT COUNT(DISTINCT student_id) as total FROM applications WHERE status = 'selected'")
            total_placed = cursor.fetchone()

            cursor.execute("SELECT COUNT(*) as total FROM placement_drives WHERE status = 'active'")
            active_drives = cursor.fetchone()

            cursor.execute("SELECT COUNT(*) as total FROM companies")
            total_companies = cursor.fetchone()

            return jsonify({
                'company_stats': company_stats,
                'status_stats': status_stats,
                'department_stats': department_stats,
                'total_applications': int(total_apps.get('total', 0)),
                'total_placed': int(total_placed.get('total', 0)),
                'active_drives': int(active_drives.get('total', 0)),
                'total_companies': int(total_companies.get('total', 0))
            }), 200

        finally:
            cursor.close()
            conn.close()
    except Exception as e:
        print(f"Analytics error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get analytics'}), 500
