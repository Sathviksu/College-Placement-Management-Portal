from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.db import get_db_connection
from datetime import datetime

hod_bp = Blueprint('hod', __name__)

# ============================================
# HOD DASHBOARD STATS
# ============================================

@hod_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_hod_stats():
    """Get HOD dashboard statistics"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')
        
        if current_user.get('role') != 'hod':
            return jsonify({'error': 'Access denied'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get HOD's department
            cursor.execute("SELECT department_id FROM hods WHERE user_id = %s", (user_id,))
            hod = cursor.fetchone()
            
            if not hod:
                return jsonify({'error': 'HOD profile not found'}), 404
            
            department_id = hod['department_id']
            
            # Get students count
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) as pending
                FROM students
                WHERE department_id = %s
            """, (department_id,))
            
            students = cursor.fetchone()
            
            # Get placed students
            cursor.execute("""
                SELECT COUNT(DISTINCT s.id) as placed
                FROM students s
                JOIN applications a ON s.id = a.student_id
                WHERE s.department_id = %s AND a.status = 'selected'
            """, (department_id,))
            
            placed = cursor.fetchone()
            
            # Get applications count
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM applications a
                JOIN students s ON a.student_id = s.id
                WHERE s.department_id = %s
            """, (department_id,))
            
            applications = cursor.fetchone()
            
            return jsonify({
                'stats': {
                    'total_students': int(students['total'] or 0),
                    'approved_students': int(students['approved'] or 0),
                    'pending_students': int(students['pending'] or 0),
                    'placed_students': int(placed['placed'] or 0),
                    'total_applications': int(applications['total'] or 0)
                }
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Get HOD stats error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'stats': {
                'total_students': 0,
                'approved_students': 0,
                'pending_students': 0,
                'placed_students': 0,
                'total_applications': 0
            }
        }), 200


# ============================================
# STUDENT MANAGEMENT
# ============================================

@hod_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    """Get all students in HOD's department"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')
        
        if current_user.get('role') != 'hod':
            return jsonify({'error': 'Access denied'}), 403
        
        status = request.args.get('status', 'all')
        search = request.args.get('search', '')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get HOD's department
            cursor.execute("SELECT department_id FROM hods WHERE user_id = %s", (user_id,))
            hod = cursor.fetchone()
            
            if not hod:
                return jsonify({'error': 'HOD profile not found'}), 404
            
            department_id = hod['department_id']
            
            # Build query
            query = """
                SELECT 
                    s.*,
                    u.email,
                    d.name as department_name,
                    COUNT(DISTINCT a.id) as application_count,
                    COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.id END) as placements
                FROM students s
                JOIN users u ON s.user_id = u.id
                JOIN departments d ON s.department_id = d.id
                LEFT JOIN applications a ON s.id = a.student_id
                WHERE s.department_id = %s
            """
            
            params = [department_id]
            
            if status == 'pending':
                query += " AND s.is_approved = 0"
            elif status == 'approved':
                query += " AND s.is_approved = 1"
            
            if search:
                query += " AND (s.first_name LIKE %s OR s.last_name LIKE %s OR s.enrollment_number LIKE %s)"
                params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
            
            query += " GROUP BY s.id ORDER BY s.created_at DESC"
            
            cursor.execute(query, tuple(params))
            students = cursor.fetchall()
            
            # Convert decimals
            for student in students:
                if student.get('cgpa'):
                    student['cgpa'] = float(student['cgpa'])
            
            return jsonify({
                'students': students,
                'count': len(students)
            }), 200
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Get students error: {e}")
        return jsonify({'error': 'Failed to get students'}), 500


@hod_bp.route('/students/<int:student_id>/approve', methods=['POST'])
@jwt_required()
def approve_student(student_id):
    """Approve a student"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')
        
        if current_user.get('role') != 'hod':
            return jsonify({'error': 'Access denied'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get HOD's department
            cursor.execute("SELECT department_id FROM hods WHERE user_id = %s", (user_id,))
            hod = cursor.fetchone()
            
            if not hod:
                return jsonify({'error': 'HOD profile not found'}), 404
            
            # Get student
            cursor.execute("""
                SELECT s.*, u.id as user_id
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = %s AND s.department_id = %s
            """, (student_id, hod['department_id']))
            
            student = cursor.fetchone()
            
            if not student:
                return jsonify({'error': 'Student not found'}), 404
            
            # Approve student
            cursor.execute("""
                UPDATE students 
                SET is_approved = 1, approved_at = %s, approved_by = %s
                WHERE id = %s
            """, (datetime.now(), user_id, student_id))
            
            # Create notification
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (%s, %s, %s, %s)
            """, (
                student['user_id'],
                'Profile Approved',
                'Your profile has been approved by the HOD. You can now apply to placement drives.',
                'success'
            ))
            
            conn.commit()
            
            return jsonify({'message': 'Student approved successfully'}), 200
            
        except Exception as e:
            conn.rollback()
            print(f"Approve student error: {e}")
            return jsonify({'error': 'Failed to approve student'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Approve endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@hod_bp.route('/students/<int:student_id>/reject', methods=['POST'])
@jwt_required()
def reject_student(student_id):
    """Reject a student"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')
        
        if current_user.get('role') != 'hod':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        reason = data.get('reason', 'Profile rejected by HOD')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Get HOD's department
            cursor.execute("SELECT department_id FROM hods WHERE user_id = %s", (user_id,))
            hod = cursor.fetchone()
            
            if not hod:
                return jsonify({'error': 'HOD profile not found'}), 404
            
            # Get student
            cursor.execute("""
                SELECT s.*, u.id as user_id
                FROM students s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = %s AND s.department_id = %s
            """, (student_id, hod['department_id']))
            
            student = cursor.fetchone()
            
            if not student:
                return jsonify({'error': 'Student not found'}), 404
            
            # Reject student (keep is_approved as 0)
            cursor.execute("""
                UPDATE students 
                SET is_approved = 0
                WHERE id = %s
            """, (student_id,))
            
            # Create notification
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (%s, %s, %s, %s)
            """, (
                student['user_id'],
                'Profile Needs Update',
                reason,
                'warning'
            ))
            
            conn.commit()
            
            return jsonify({'message': 'Student profile rejected'}), 200
            
        except Exception as e:
            conn.rollback()
            print(f"Reject student error: {e}")
            return jsonify({'error': 'Failed to reject student'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Reject endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@hod_bp.route('/students/bulk-approve', methods=['POST'])
@jwt_required()
def bulk_approve_students():
    """Bulk approve students"""
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('user_id')
        
        if current_user.get('role') != 'hod':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        student_ids = data.get('student_ids', [])
        
        if not student_ids:
            return jsonify({'error': 'No students selected'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        try:
            cursor = conn.cursor()
            
            # Bulk approve
            placeholders = ','.join(['%s'] * len(student_ids))
            query = f"""
                UPDATE students 
                SET is_approved = 1, approved_at = %s, approved_by = %s
                WHERE id IN ({placeholders})
            """
            
            cursor.execute(query, [datetime.now(), user_id] + student_ids)
            conn.commit()
            
            return jsonify({
                'message': f'{len(student_ids)} students approved successfully',
                'count': len(student_ids)
            }), 200
            
        except Exception as e:
            conn.rollback()
            print(f"Bulk approve error: {e}")
            return jsonify({'error': 'Failed to approve students'}), 500
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"Bulk approve endpoint error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
