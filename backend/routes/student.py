from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from utils.email_service import send_email, get_application_submitted_email
from werkzeug.utils import secure_filename
import os
from config import Config
from datetime import datetime
import traceback
import google.generativeai as genai
import PyPDF2
import io
import json

student_bp = Blueprint('student', __name__)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS


# ============================================
# GET STUDENT PROFILE
# ============================================
@student_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get student profile details"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT s.*, d.name as department_name, d.code as department_code,
                       u.email, u.last_login
                FROM students s
                JOIN departments d ON s.department_id = d.id
                JOIN users u ON s.user_id = u.id
                WHERE s.user_id = %s
            """, (user_id,))

            profile = cursor.fetchone()

            if not profile:
                return jsonify({'error': 'Profile not found'}), 404

            if profile.get('cgpa') is not None:
                profile['cgpa'] = float(profile['cgpa'])

            return jsonify({'profile': profile}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get profile error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get profile'}), 500


# ============================================
# UPDATE STUDENT PROFILE
# ============================================
@student_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update student profile"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        data = request.get_json()

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM students WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()

            if not student:
                return jsonify({'error': 'Student not found'}), 404

            student_id = student.get('id')
            if not student_id:
                return jsonify({'error': 'Student id missing'}), 500

            update_fields = []
            update_values = []

            allowed_fields = ['first_name', 'last_name', 'phone', 'date_of_birth',
                              'gender', 'cgpa', 'year_of_study', 'backlogs', 'skills', 'bio']

            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    update_values.append(data[field])

            if not update_fields:
                return jsonify({'error': 'No fields to update'}), 400

            update_values.append(student_id)

            query = f"UPDATE students SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, tuple(update_values))
            conn.commit()

            return jsonify({'message': 'Profile updated successfully'}), 200

        except Exception as e:
            conn.rollback()
            print(f"Update profile error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to update profile'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Update profile endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


# ============================================
# UPLOAD RESUME
# ============================================
@student_bp.route('/resume', methods=['POST'])
@jwt_required()
def upload_resume():
    """Upload student resume"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        if 'resume' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['resume']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > Config.MAX_FILE_SIZE:
            return jsonify({'error': 'File too large'}), 400

        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM students WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()

            if not student:
                return jsonify({'error': 'Student not found'}), 404

            student_id = student.get('id')
            if not student_id:
                return jsonify({'error': 'Student id missing'}), 500

            filename = secure_filename(file.filename)
            unique_filename = f"student_{student_id}_{filename}"
            file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)

            file.save(file_path)

            cursor.execute(
                "UPDATE students SET resume_url = %s WHERE id = %s",
                (file_path, student_id)
            )

            cursor.execute(
                """INSERT INTO resumes (student_id, file_name, file_path, file_size, parsing_status)
                   VALUES (%s, %s, %s, %s, %s)""",
                (student_id, filename, file_path, file_size, 'pending')
            )

            conn.commit()

            return jsonify({
                'message': 'Resume uploaded successfully',
                'file_name': filename
            }), 200

        except Exception as e:
            conn.rollback()
            print(f"Upload resume error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to upload resume'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Upload resume endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


# ============================================
# GET STUDENT STATISTICS
# ============================================
@student_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get student dashboard statistics"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM students WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()

            if not student:
                return jsonify({
                    'stats': {
                        'total_applications': 0,
                        'pending': 0,
                        'shortlisted': 0,
                        'selected': 0,
                        'rejected': 0,
                        'active_drives': 0
                    }
                }), 200

            student_id = student.get('id')
            if not student_id:
                return jsonify({'stats': {
                    'total_applications': 0,
                    'pending': 0,
                    'shortlisted': 0,
                    'selected': 0,
                    'rejected': 0,
                    'active_drives': 0
                }}), 200

            cursor.execute("""
                SELECT 
                    COUNT(*) as total_applications,
                    SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted,
                    SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END) as selected,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
                FROM applications
                WHERE student_id = %s
            """, (student_id,))

            stats = cursor.fetchone()

            cursor.execute("""
                SELECT COUNT(*) as active_drives
                FROM placement_drives
                WHERE status = 'active' AND application_deadline > NOW()
            """)

            active_drives = cursor.fetchone()

            return jsonify({
                'stats': {
                    'total_applications': int(stats['total_applications'] or 0),
                    'pending': int(stats['pending'] or 0),
                    'shortlisted': int(stats['shortlisted'] or 0),
                    'selected': int(stats['selected'] or 0),
                    'rejected': int(stats['rejected'] or 0),
                    'active_drives': int(active_drives['active_drives'] or 0)
                }
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get stats error: {e}")
        traceback.print_exc()
        return jsonify({
            'stats': {
                'total_applications': 0,
                'pending': 0,
                'shortlisted': 0,
                'selected': 0,
                'rejected': 0,
                'active_drives': 0
            }
        }), 200


# ============================================
# GET ALL ACTIVE DRIVES
# ============================================
@student_bp.route('/drives', methods=['GET'])
@jwt_required()
def get_drives():
    """Get all active placement drives"""
    try:
        current_user = get_jwt_identity()

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        search = request.args.get('search', '')
        job_type = request.args.get('job_type', '')
        min_package = request.args.get('min_package', 0)

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            query = """
                SELECT 
                    pd.*,
                    c.name as company_name,
                    c.logo_url,
                    c.industry,
                    (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as total_applications,
                    (SELECT COUNT(*) FROM rounds WHERE drive_id = pd.id) as round_count
                FROM placement_drives pd
                JOIN companies c ON pd.company_id = c.id
                WHERE pd.status = 'active' 
                AND pd.application_deadline > NOW()
            """

            params = []

            if search:
                query += " AND (c.name LIKE %s OR pd.job_role LIKE %s)"
                params.extend([f'%{search}%', f'%{search}%'])

            if job_type:
                query += " AND pd.job_type = %s"
                params.append(job_type)

            if min_package:
                query += " AND pd.package_ctc >= %s"
                params.append(min_package)

            query += " ORDER BY pd.application_deadline ASC"

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


# ============================================
# GET SINGLE DRIVE DETAILS
# ============================================
@student_bp.route('/drives/<int:drive_id>', methods=['GET'])
@jwt_required()
def get_drive_details(drive_id):
    """Get detailed information about a specific drive"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
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
                    c.website as company_website,
                    c.logo_url,
                    c.industry,
                    (SELECT COUNT(*) FROM applications WHERE drive_id = pd.id) as total_applications
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

            cursor.execute("SELECT id FROM students WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()

            if student:
                cursor.execute("""
                    SELECT * FROM applications 
                    WHERE student_id = %s AND drive_id = %s
                """, (student['id'], drive_id))

                application = cursor.fetchone()
                drive['has_applied'] = application is not None
                drive['application_status'] = application['status'] if application else None
            else:
                drive['has_applied'] = False
                drive['application_status'] = None

            return jsonify({'drive': drive}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get drive details error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get drive details'}), 500


# ============================================
# APPLY TO DRIVE - WITH EMAIL
# ============================================
@student_bp.route('/apply/<int:drive_id>', methods=['POST'])
@jwt_required()
def apply_to_drive(drive_id):
    """Apply to a placement drive"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT s.*, d.name as department_name 
                FROM students s
                JOIN departments d ON s.department_id = d.id
                WHERE s.user_id = %s
            """, (user_id,))

            student = cursor.fetchone()

            if not student:
                return jsonify({'error': 'Student profile not found'}), 404

            if not student['is_approved']:
                return jsonify({'error': 'Your profile is not approved yet'}), 403

            cursor.execute("""
                SELECT pd.*, c.name as company_name
                FROM placement_drives pd
                JOIN companies c ON pd.company_id = c.id
                WHERE pd.id = %s
            """, (drive_id,))

            drive = cursor.fetchone()

            if not drive:
                return jsonify({'error': 'Drive not found'}), 404

            if drive['status'] != 'active':
                return jsonify({'error': 'This drive is not active'}), 400

            if datetime.now() > drive['application_deadline']:
                return jsonify({'error': 'Application deadline has passed'}), 400

            cursor.execute("""
                SELECT id FROM applications 
                WHERE student_id = %s AND drive_id = %s
            """, (student['id'], drive_id))

            if cursor.fetchone():
                return jsonify({'error': 'You have already applied'}), 409

            eligibility_errors = []

            if student['cgpa']:
                if float(student['cgpa']) < float(drive['min_cgpa']):
                    eligibility_errors.append(f"Minimum CGPA required: {drive['min_cgpa']}")
            else:
                eligibility_errors.append("Please update your CGPA in profile")

            if student['backlogs'] > drive['max_backlogs']:
                eligibility_errors.append(f"Maximum backlogs allowed: {drive['max_backlogs']}")

            if not student['resume_url']:
                eligibility_errors.append("Please upload your resume")

            if eligibility_errors:
                return jsonify({
                    'error': 'Eligibility criteria not met',
                    'details': eligibility_errors
                }), 400

            cursor.execute("""
                INSERT INTO applications (student_id, drive_id, status, current_round)
                VALUES (%s, %s, %s, %s)
            """, (student['id'], drive_id, 'applied', 0))

            application_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                user_id,
                'Application Submitted',
                f'Your application to {drive["company_name"]} has been submitted.',
                'success',
                'application',
                application_id
            ))

            conn.commit()

            # Send confirmation email
            try:
                cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
                user_email = cursor.fetchone()['email']

                email_html = get_application_submitted_email(
                    f"{student['first_name']} {student['last_name']}",
                    drive['company_name'],
                    drive['job_role']
                )
                send_email(user_email, "Application Submitted Successfully", email_html)
            except Exception as e:
                print(f"Email send failed: {e}")

            return jsonify({
                'message': 'Application submitted successfully',
                'application_id': application_id
            }), 201

        except Exception as e:
            conn.rollback()
            print(f"Apply error: {e}")
            traceback.print_exc()
            return jsonify({'error': 'Failed to submit application'}), 500
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Apply endpoint error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500


# ============================================
# CHECK ELIGIBILITY
# ============================================
@student_bp.route('/check-eligibility/<int:drive_id>', methods=['GET'])
@jwt_required()
def check_eligibility(drive_id):
    """Check if student is eligible for a drive"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM students WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()

            if not student:
                return jsonify({'error': 'Student profile not found'}), 404

            cursor.execute("SELECT * FROM placement_drives WHERE id = %s", (drive_id,))
            drive = cursor.fetchone()

            if not drive:
                return jsonify({'error': 'Drive not found'}), 404

            eligible = True
            issues = []

            if not student['is_approved']:
                eligible = False
                issues.append({'type': 'critical', 'message': 'Profile not approved by HOD'})

            if not student['resume_url']:
                eligible = False
                issues.append({'type': 'critical', 'message': 'Resume not uploaded'})

            if student['cgpa']:
                if float(student['cgpa']) < float(drive['min_cgpa']):
                    eligible = False
                    issues.append({
                        'type': 'eligibility',
                        'message': f"CGPA too low (Required: {drive['min_cgpa']}, Yours: {student['cgpa']})"
                    })
            else:
                eligible = False
                issues.append({'type': 'profile', 'message': 'CGPA not updated in profile'})

            if student['backlogs'] > drive['max_backlogs']:
                eligible = False
                issues.append({
                    'type': 'eligibility',
                    'message': f"Too many backlogs (Allowed: {drive['max_backlogs']}, Yours: {student['backlogs']})"
                })

            return jsonify({
                'eligible': eligible,
                'issues': issues
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Check eligibility error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to check eligibility'}), 500


# ============================================
# GET MY APPLICATIONS
# ============================================
@student_bp.route('/applications', methods=['GET'])
@jwt_required()
def get_my_applications():
    """Get all applications of current student"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("SELECT id FROM students WHERE user_id = %s", (user_id,))
            student = cursor.fetchone()

            if not student:
                return jsonify({'applications': []}), 200

            student_id = student.get('id')
            if not student_id:
                return jsonify({'applications': []}), 200

            cursor.execute("""
                SELECT 
                    a.*,
                    pd.job_role,
                    pd.package_ctc,
                    pd.location,
                    pd.job_type,
                    c.name as company_name,
                    c.industry,
                    c.logo_url
                FROM applications a
                JOIN placement_drives pd ON a.drive_id = pd.id
                JOIN companies c ON pd.company_id = c.id
                WHERE a.student_id = %s
                ORDER BY a.applied_at DESC
            """, (student_id,))

            applications = cursor.fetchall()

            for app in applications:
                if app.get('package_ctc'):
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


# ============================================
# GET SINGLE APPLICATION DETAILS
# ============================================
@student_bp.route('/applications/<int:application_id>', methods=['GET'])
@jwt_required()
def get_application_details(application_id):
    """Get detailed information about a specific application"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT 
                    a.*,
                    pd.*,
                    c.name as company_name,
                    c.description as company_description,
                    c.website as company_website,
                    c.industry,
                    s.first_name,
                    s.last_name,
                    s.enrollment_number
                FROM applications a
                JOIN placement_drives pd ON a.drive_id = pd.id
                JOIN companies c ON pd.company_id = c.id
                JOIN students s ON a.student_id = s.id
                WHERE a.id = %s AND s.user_id = %s
            """, (application_id, user_id))

            application = cursor.fetchone()

            if not application:
                return jsonify({'error': 'Application not found'}), 404

            cursor.execute("""
                SELECT * FROM rounds 
                WHERE drive_id = %s 
                ORDER BY round_number
            """, (application['drive_id'],))

            rounds = cursor.fetchall()
            application['rounds'] = rounds

            if application.get('package_ctc'):
                application['package_ctc'] = float(application['package_ctc'])
            if application.get('package_base'):
                application['package_base'] = float(application['package_base'])
            if application.get('min_cgpa'):
                application['min_cgpa'] = float(application['min_cgpa'])

            return jsonify({'application': application}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get application details error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get application details'}), 500


# ============================================
# NOTIFICATIONS
# ============================================


@student_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get student notifications"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM notifications 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT 20
            """, (user_id,))

            notifications = cursor.fetchall()

            cursor.execute("""
                SELECT COUNT(*) as unread_count 
                FROM notifications 
                WHERE user_id = %s AND is_read = 0
            """, (user_id,))

            unread = cursor.fetchone()

            return jsonify({
                'notifications': notifications,
                'unread_count': int(unread['unread_count'] or 0)
            }), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Get notifications error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to get notifications'}), 500


@student_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE notifications 
                SET is_read = 1 
                WHERE id = %s AND user_id = %s
            """, (notification_id, user_id))

            conn.commit()

            return jsonify({'message': 'Notification marked as read'}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Mark read error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to mark as read'}), 500


@student_bp.route('/notifications/read-all', methods=['POST'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')

        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        try:
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE notifications 
                SET is_read = 1 
                WHERE user_id = %s
            """, (user_id,))

            conn.commit()

            return jsonify({'message': 'All notifications marked as read'}), 200

        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"Mark all read error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to mark all as read'}), 500


# ============================================
# ANALYZE RESUME
# ============================================
@student_bp.route('/resume/analyze', methods=['POST'])
@jwt_required()
def analyze_resume():
    """Analyze resume against a job role using Gemini AI"""
    try:
        current_user = get_jwt_identity()
        
        if current_user.get('role') != 'student':
            return jsonify({'error': 'Access denied'}), 403

        # Check if API key is configured
        if not Config.GEMINI_API_KEY:
            return jsonify({'error': 'Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.'}), 500

        # Configure Gemini
        genai.configure(api_key=Config.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')

        # Get file and job role from request
        if 'resumeContent' not in request.files:
            return jsonify({'error': 'Resume file is required'}), 400
        
        file = request.files['resumeContent']
        job_role = request.form.get('jobRole', '')

        if not file or file.filename == '':
            return jsonify({'error': 'Resume file is required'}), 400

        if not job_role or len(job_role) < 3:
            return jsonify({'error': 'Job role must be at least 3 characters'}), 400

        if file.content_type != 'application/pdf':
            return jsonify({'error': 'Only PDF files are allowed'}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > Config.MAX_FILE_SIZE:
            return jsonify({'error': f'File size must be less than {Config.MAX_FILE_SIZE / 1024 / 1024}MB'}), 400

        # Extract text from PDF
        try:
            pdf_reader = PyPDF2.PdfReader(file)
            resume_content = ""
            for page in pdf_reader.pages:
                resume_content += page.extract_text() + "\n"
            
            if len(resume_content.strip()) < 100:
                return jsonify({'error': 'Could not extract enough text from the PDF. Please ensure it is a text-based PDF.'}), 400
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return jsonify({'error': 'Failed to extract text from PDF. Please ensure it is a valid PDF file.'}), 400

        # Analysis 1: Score Resume
        score_prompt = f"""You are an expert resume reviewer. Analyze the following resume content against the specified job role.

Resume Content:
{resume_content}

Job Role: {job_role}

Provide your analysis in the following JSON format:
{{
    "importantInfo": ["list", "of", "important", "information", "extracted", "from", "resume"],
    "resumeScore": <number from 0 to 100>,
    "scoreRationale": "brief explanation for the score",
    "improvementSuggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Important: Return ONLY valid JSON, no additional text or markdown formatting."""

        # Analysis 2: Analyze Resume Against Role
        analysis_prompt = f"""You are a career advisor. Analyze the following resume content against the specified job role and provide feedback.

Resume Content:
{resume_content}

Job Role: {job_role}

Provide your analysis in the following JSON format:
{{
    "overallSuitability": "assessment of overall suitability",
    "skillsGapAnalysis": "analysis of skills gap",
    "feedback": "specific feedback on how to improve"
}}

Important: Return ONLY valid JSON, no additional text or markdown formatting."""

        try:
            # Get both analyses
            score_response = model.generate_content(score_prompt)
            analysis_response = model.generate_content(analysis_prompt)

            # Parse JSON responses
            score_text = score_response.text.strip()
            analysis_text = analysis_response.text.strip()

            # Clean up JSON (remove markdown code blocks if present)
            if score_text.startswith('```'):
                score_text = score_text.split('```')[1]
                if score_text.startswith('json'):
                    score_text = score_text[4:]
                score_text = score_text.strip()
            
            if analysis_text.startswith('```'):
                analysis_text = analysis_text.split('```')[1]
                if analysis_text.startswith('json'):
                    analysis_text = analysis_text[4:]
                analysis_text = analysis_text.strip()

            score_data = json.loads(score_text)
            analysis_data = json.loads(analysis_text)

            # Combine results
            result = {
                **score_data,
                **analysis_data
            }

            # Ensure all required fields are present
            if 'resumeScore' not in result:
                result['resumeScore'] = 0
            if 'scoreRationale' not in result:
                result['scoreRationale'] = 'Score not available'
            if 'importantInfo' not in result:
                result['importantInfo'] = []
            if 'improvementSuggestions' not in result:
                result['improvementSuggestions'] = []
            if 'overallSuitability' not in result:
                result['overallSuitability'] = 'Analysis not available'
            if 'skillsGapAnalysis' not in result:
                result['skillsGapAnalysis'] = 'Skills gap analysis not available'
            if 'feedback' not in result:
                result['feedback'] = 'Feedback not available'

            return jsonify(result), 200

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Score response: {score_response.text if 'score_response' in locals() else 'N/A'}")
            print(f"Analysis response: {analysis_response.text if 'analysis_response' in locals() else 'N/A'}")
            return jsonify({'error': 'Failed to parse AI response. Please try again.'}), 500
        except Exception as e:
            print(f"Gemini API error: {e}")
            traceback.print_exc()
            return jsonify({'error': f'AI analysis failed: {str(e)}'}), 500

    except Exception as e:
        print(f"Analyze resume error: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500
