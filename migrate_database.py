"""
Script để cập nhật database schema - thêm các cột mới
Chạy script này để thêm các cột mới vào bảng invoices và invoice_items
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

def migrate_database():
    """Thêm các cột mới vào database"""
    try:
        # Kết nối database
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        print("🔄 Bắt đầu migration database...")
        
        # Kiểm tra và thêm cột vào bảng invoices
        print("\n📋 Cập nhật bảng invoices...")
        
        # Kiểm tra và thêm invoice_number
        try:
            cursor.execute("ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR(100) NULL AFTER id")
            print("  ✅ Đã thêm cột invoice_number")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột invoice_number đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm invoice_number: {e}")
        
        # Kiểm tra và thêm supplier_name
        try:
            cursor.execute("ALTER TABLE invoices ADD COLUMN supplier_name VARCHAR(500) NULL AFTER merchant_name")
            print("  ✅ Đã thêm cột supplier_name")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột supplier_name đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm supplier_name: {e}")
        
        # Kiểm tra và thêm vat_rate
        try:
            cursor.execute("ALTER TABLE invoices ADD COLUMN vat_rate INT NULL AFTER total_amount")
            print("  ✅ Đã thêm cột vat_rate")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột vat_rate đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm vat_rate: {e}")
        
        # Kiểm tra và thêm vat_amount
        try:
            cursor.execute("ALTER TABLE invoices ADD COLUMN vat_amount BIGINT NULL AFTER vat_rate")
            print("  ✅ Đã thêm cột vat_amount")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột vat_amount đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm vat_amount: {e}")
        
        # Thêm index cho invoice_number nếu chưa có
        try:
            cursor.execute("CREATE INDEX idx_invoice_number ON invoices(invoice_number)")
            print("  ✅ Đã thêm index cho invoice_number")
        except Exception as e:
            if "Duplicate key name" in str(e):
                print("  ℹ️  Index invoice_number đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm index: {e}")
        
        # Kiểm tra và thêm cột vào bảng invoice_items
        print("\n📋 Cập nhật bảng invoice_items...")
        
        # Kiểm tra và thêm category_id (nếu chưa có)
        try:
            cursor.execute("ALTER TABLE invoice_items ADD COLUMN category_id INT NULL AFTER invoice_id")
            print("  ✅ Đã thêm cột category_id")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột category_id đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm category_id: {e}")
        
        # Thêm foreign key constraint cho category_id (nếu chưa có)
        try:
            cursor.execute("""
                ALTER TABLE invoice_items 
                ADD CONSTRAINT fk_invoice_items_category 
                FOREIGN KEY (category_id) REFERENCES product_categories(id)
            """)
            print("  ✅ Đã thêm foreign key constraint cho category_id")
        except Exception as e:
            if "Duplicate foreign key" in str(e) or "already exists" in str(e).lower():
                print("  ℹ️  Foreign key constraint đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm foreign key: {e}")
        
        # Kiểm tra và thêm product_name
        try:
            cursor.execute("ALTER TABLE invoice_items ADD COLUMN product_name VARCHAR(500) NULL AFTER name")
            print("  ✅ Đã thêm cột product_name")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột product_name đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm product_name: {e}")
        
        # Kiểm tra và thêm quantity
        try:
            cursor.execute("ALTER TABLE invoice_items ADD COLUMN quantity INT NULL AFTER product_name")
            print("  ✅ Đã thêm cột quantity")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột quantity đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm quantity: {e}")
        
        # Kiểm tra và thêm unit_price
        try:
            cursor.execute("ALTER TABLE invoice_items ADD COLUMN unit_price BIGINT NULL AFTER quantity")
            print("  ✅ Đã thêm cột unit_price")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột unit_price đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm unit_price: {e}")
        
        # Kiểm tra và thêm total
        try:
            cursor.execute("ALTER TABLE invoice_items ADD COLUMN total BIGINT NULL AFTER unit_price")
            print("  ✅ Đã thêm cột total")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("  ℹ️  Cột total đã tồn tại")
            else:
                print(f"  ⚠️  Lỗi khi thêm total: {e}")
        
        # Commit changes
        connection.commit()
        print("\n✅ Migration hoàn tất!")
        
    except Exception as e:
        print(f"\n❌ Lỗi migration: {e}")
        if connection:
            connection.rollback()
    finally:
        if connection:
            cursor.close()
            connection.close()
            print("🔌 Đã đóng kết nối database")

if __name__ == "__main__":
    migrate_database()

