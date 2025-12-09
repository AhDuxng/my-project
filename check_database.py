"""
Script kiểm tra cấu trúc database
"""
import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "invoice_db")

def check_database():
    """Kiểm tra cấu trúc database"""
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        print("🔍 Kiểm tra cấu trúc database...\n")
        
        # Kiểm tra bảng invoices
        print("📋 Bảng invoices:")
        cursor.execute("DESCRIBE invoices")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")
        
        print("\n📋 Bảng invoice_items:")
        cursor.execute("DESCRIBE invoice_items")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")
        
        print("\n✅ Kiểm tra hoàn tất!")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
    finally:
        if connection:
            cursor.close()
            connection.close()

if __name__ == "__main__":
    check_database()

