import pymysql
from config import Config

def get_db_connection():
    """Create and return database connection"""
    try:
        connection = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME,
            port=Config.DB_PORT,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False
        )
        return connection
    except pymysql.Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def execute_query(query, params=None, fetch=False):
    """Execute a database query"""
    connection = get_db_connection()
    if not connection:
        return None
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params or ())
            
            if fetch:
                result = cursor.fetchall() if query.strip().upper().startswith('SELECT') else None
                connection.commit()
                return result
            else:
                connection.commit()
                return cursor.lastrowid if cursor.lastrowid else True
                
    except pymysql.Error as e:
        connection.rollback()
        print(f"Database error: {e}")
        return None
    finally:
        connection.close()
