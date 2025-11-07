from utils.db import get_db_connection
from config import Config

def test_connection():
    print("Testing database connection...")
    print(f"Host: {Config.DB_HOST}")
    print(f"User: {Config.DB_USER}")
    print(f"Database: {Config.DB_NAME}")
    print(f"Port: {Config.DB_PORT}")
    print("-" * 50)
    
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful!")
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT VERSION()")
                version = cursor.fetchone()
                print(f"📊 MySQL version: {version['VERSION()']}")
                
                cursor.execute("SELECT DATABASE()")
                db = cursor.fetchone()
                print(f"📁 Current database: {db['DATABASE()']}")
        except Exception as e:
            print(f"❌ Error executing query: {e}")
        finally:
            conn.close()
    else:
        print("❌ Database connection failed!")
        print("\nTroubleshooting:")
        print("1. Check if MySQL service is running")
        print("2. Verify DB_PASSWORD in .env file")
        print("3. Ensure 'placement_portal' database exists")
        print("4. Check MySQL user permissions")

if __name__ == "__main__":
    test_connection()
