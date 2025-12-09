import os
import re
import json
import logging
import requests
import traceback
from typing import List, Optional, Any
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, BigInteger
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from sqlalchemy.exc import SQLAlchemyError
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

# --- CONFIG ---
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = os.getenv("OCR_API_KEY", "helloworld") # Key mặc định để test
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "invoice_db")

# Setup DB hỗ trợ tiếng Việt
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

try:
    engine = create_engine(DATABASE_URL, pool_recycle=3600, pool_pre_ping=True, connect_args={"charset": "utf8mb4"})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logger.info("✅ Database Connected!")
except Exception as e:
    logger.critical(f"❌ Database Connection Failed: {e}")
    raise e

# --- MODELS (SQLAlchemy - Safe Mode) ---
class ProductCategoryDB(Base):
    __tablename__ = "product_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    
    # Quan hệ với items
    items = relationship("InvoiceItemDB", back_populates="category")

class InvoiceDB(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), nullable=True, index=True)  # Số hóa đơn từ OCR
    merchant_name = Column(String(500), nullable=True)  # Tên cửa hàng
    supplier_name = Column(String(500), nullable=True)  # Nhà cung cấp từ OCR
    date = Column(String(100), nullable=True)
    total_amount = Column(BigInteger, nullable=True)
    vat_rate = Column(Integer, nullable=True)  # % thuế VAT
    vat_amount = Column(BigInteger, nullable=True)  # Số tiền thuế VAT
    raw_text = Column(Text, nullable=True)
    
    # Quan hệ với bảng Items
    items = relationship("InvoiceItemDB", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItemDB(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=True)
    name = Column(String(500), nullable=True)  # Tên sản phẩm
    product_name = Column(String(500), nullable=True)  # Tên sản phẩm từ OCR (alias)
    quantity = Column(Integer, nullable=True)  # Số lượng
    unit_price = Column(BigInteger, nullable=True)  # Đơn giá
    price = Column(BigInteger, nullable=True)  # Thành tiền (quantity * unit_price)
    total = Column(BigInteger, nullable=True)  # Thành tiền (alias)
    
    invoice = relationship("InvoiceDB", back_populates="items")
    category = relationship("ProductCategoryDB", back_populates="items")

Base.metadata.create_all(bind=engine)

# --- INITIALIZE CATEGORIES ---
def init_categories():
    """Khởi tạo 20 danh mục sản phẩm mẫu"""
    db = SessionLocal()
    try:
        # Kiểm tra xem đã có categories chưa
        existing = db.query(ProductCategoryDB).first()
        if existing:
            logger.info("✅ Categories đã tồn tại, bỏ qua khởi tạo")
            return
        
        categories_data = [
            {"name": "Thực phẩm & Đồ uống", "description": "Thực phẩm, đồ uống, nước giải khát"},
            {"name": "Văn phòng phẩm", "description": "Giấy, bút, dụng cụ văn phòng"},
            {"name": "Điện tử & Công nghệ", "description": "Máy tính, điện thoại, thiết bị điện tử"},
            {"name": "Vật liệu xây dựng", "description": "Xi măng, gạch, sắt thép, vật liệu xây dựng"},
            {"name": "Nội thất & Trang trí", "description": "Bàn ghế, tủ, đồ trang trí nội thất"},
            {"name": "Quần áo & Thời trang", "description": "Quần áo, giày dép, phụ kiện"},
            {"name": "Mỹ phẩm & Chăm sóc sức khỏe", "description": "Mỹ phẩm, thuốc, sản phẩm chăm sóc"},
            {"name": "Gia dụng & Đồ dùng nhà bếp", "description": "Đồ dùng nhà bếp, thiết bị gia dụng"},
            {"name": "Xăng dầu & Nhiên liệu", "description": "Xăng, dầu, nhiên liệu"},
            {"name": "Dịch vụ & Bảo trì", "description": "Dịch vụ sửa chữa, bảo trì, bảo dưỡng"},
            {"name": "Vận chuyển & Logistics", "description": "Phí vận chuyển, giao hàng"},
            {"name": "Marketing & Quảng cáo", "description": "Chi phí quảng cáo, marketing"},
            {"name": "Điện nước & Tiện ích", "description": "Tiền điện, nước, internet, điện thoại"},
            {"name": "Thuê mướn & Cho thuê", "description": "Tiền thuê văn phòng, kho bãi, thiết bị"},
            {"name": "Đào tạo & Phát triển", "description": "Khóa học, đào tạo nhân viên"},
            {"name": "Y tế & Bảo hiểm", "description": "Khám chữa bệnh, bảo hiểm"},
            {"name": "Ngân hàng & Tài chính", "description": "Phí ngân hàng, lãi vay"},
            {"name": "Pháp lý & Tư vấn", "description": "Phí tư vấn pháp lý, kế toán"},
            {"name": "Giải trí & Sự kiện", "description": "Tiệc, sự kiện, giải trí"},
            {"name": "Khác", "description": "Các chi phí khác không thuộc danh mục trên"}
        ]
        
        for cat_data in categories_data:
            category = ProductCategoryDB(**cat_data)
            db.add(category)
        
        db.commit()
        logger.info(f"✅ Đã tạo {len(categories_data)} danh mục sản phẩm")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Lỗi khởi tạo categories: {e}")
    finally:
        db.close()

# Khởi tạo categories khi start server
init_categories()

# --- SCHEMAS (Pydantic V2 - Auto Fix Data) ---
# Đây là phần quan trọng nhất để sửa lỗi JSON input

class ItemSchema(BaseModel):
    name: Optional[str] = "Unknown Item"
    price: Optional[int] = 0
    category_id: Optional[int] = None  # ID của danh mục sản phẩm

    # Validator: Tự động xóa dấu chấm/phẩy trong giá tiền nếu lỡ gửi chuỗi
    @field_validator('price', mode='before')
    def clean_price(cls, v):
        if v is None:
            return 0
        if isinstance(v, str):
            # Xóa mọi thứ không phải số
            clean = re.sub(r'[^\d]', '', v)
            return int(clean) if clean else 0
        if isinstance(v, (int, float)):
            return int(v) if v >= 0 else 0
        return 0
    
    @field_validator('name', mode='before')
    def clean_name(cls, v):
        if v is None:
            return "Unknown Item"
        # Cắt chuỗi nếu quá dài (500 ký tự)
        if isinstance(v, str) and len(v) > 500:
            return v[:500]
        return v
    
    @field_validator('category_id', mode='before')
    def clean_category_id(cls, v):
        if v is None:
            return None
        if isinstance(v, (int, str)):
            try:
                return int(v) if int(v) > 0 else None
            except (ValueError, TypeError):
                return None
        return None
        
    class Config:
        from_attributes = True

class InvoiceCreateSchema(BaseModel):
    merchant_name: Optional[str] = "Unknown Store"
    date: Optional[str] = ""
    total_amount: Optional[int] = 0
    items: List[ItemSchema] = []
    raw_text: Optional[str] = ""

    # Validator cho tổng tiền tương tự như item price
    @field_validator('total_amount', mode='before')
    def clean_total(cls, v):
        if v is None:
            return 0
        if isinstance(v, str):
            clean = re.sub(r'[^\d]', '', v)
            return int(clean) if clean else 0
        if isinstance(v, (int, float)):
            return int(v) if v >= 0 else 0
        return 0
    
    @field_validator('merchant_name', mode='before')
    def clean_merchant_name(cls, v):
        if v is None:
            return "Unknown Store"
        # Cắt chuỗi nếu quá dài (500 ký tự)
        if isinstance(v, str) and len(v) > 500:
            return v[:500]
        return v
    
    @field_validator('date', mode='before')
    def clean_date(cls, v):
        if v is None:
            return ""
        # Cắt chuỗi nếu quá dài (100 ký tự)
        if isinstance(v, str) and len(v) > 100:
            return v[:100]
        return v

# Schema cho OCR Invoice
class LineItemSchema(BaseModel):
    productName: Optional[str] = ""
    quantity: Optional[int] = 0
    unitPrice: Optional[int] = 0
    total: Optional[int] = 0

    @field_validator('quantity', 'unitPrice', 'total', mode='before')
    def clean_number(cls, v):
        if v is None:
            return 0
        if isinstance(v, str):
            clean = re.sub(r'[^\d]', '', v)
            return int(clean) if clean else 0
        if isinstance(v, (int, float)):
            return int(v) if v >= 0 else 0
        return 0

    class Config:
        from_attributes = True

class OcrInvoiceCreateSchema(BaseModel):
    invoiceNumber: Optional[str] = ""
    supplierName: Optional[str] = ""
    date: Optional[str] = ""
    totalAmount: Optional[int] = 0
    vatRate: Optional[int] = 0
    vatAmount: Optional[int] = 0
    productCategory: Optional[dict] = None
    lineItems: List[LineItemSchema] = []
    rawText: Optional[str] = ""

    @field_validator('totalAmount', 'vatAmount', 'vatRate', mode='before')
    def clean_amount(cls, v):
        if v is None:
            return 0
        if isinstance(v, str):
            clean = re.sub(r'[^\d]', '', v)
            return int(clean) if clean else 0
        if isinstance(v, (int, float)):
            return int(v) if v >= 0 else 0
        return 0

    @field_validator('invoiceNumber', 'supplierName', mode='before')
    def clean_string(cls, v):
        if v is None:
            return ""
        if isinstance(v, str) and len(v) > 500:
            return v[:500]
        return v

# --- SERVICES ---
class OCRService:
    OCR_URL = "https://api.ocr.space/parse/image"

    @staticmethod
    def process_image(file_bytes: bytes, filename: str) -> str:
        if not file_bytes: return ""
        payload = {'apikey': API_KEY, 'language': 'eng', 'isOverlayRequired': False, 'scale': True, 'OCREngine': 2}
        files = {'file': (filename, file_bytes, 'image/png')}
        try:
            logger.info("📡 Gọi API OCR...")
            response = requests.post(OCRService.OCR_URL, files=files, data=payload, timeout=20)
            result = response.json()
            if result.get("IsErroredOnProcessing"): return ""
            parsed = result.get("ParsedResults")
            if parsed and parsed[0].get("ParsedText"):
                return parsed[0].get("ParsedText")
            return ""
        except Exception:
            return ""

class InvoiceParserService:
    @staticmethod
    def parse_money(text: str) -> int:
        if not text: return 0
        clean_text = re.sub(r'[^\d]', '', text)
        try: return int(clean_text)
        except ValueError: return 0

    @classmethod
    def parse(cls, raw_text: str) -> dict:
        default_res = {"merchant_name": "Unknown", "date": "", "items": [], "total_amount": 0, "raw_text": raw_text}
        if not raw_text: return default_res

        lines = [line.strip() for line in raw_text.split('\r\n') if line.strip()]
        if not lines: return default_res

        default_res["merchant_name"] = lines[0]
        
        # Tìm ngày
        date_match = re.search(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b', raw_text)
        if date_match: default_res["date"] = date_match.group(0)

        # Tìm items
        items = []
        total_amount = 0
        for line in lines:
            match = re.search(r'(.+?)[\s\.:]+([\d,.]+)$', line)
            if match:
                name = match.group(1).strip()
                price_str = match.group(2)
                price = cls.parse_money(price_str)
                if price > 0 and len(name) > 2:
                    items.append({"name": name, "price": price})
                    total_amount += price  # Tổng tất cả items
        
        default_res["items"] = items
        default_res["total_amount"] = total_amount  # Tổng tiền = tổng tất cả items
        return default_res

# --- API ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@app.post("/analyze-invoice", response_model=InvoiceCreateSchema)
async def analyze_invoice(file: UploadFile = File(...)):
    content = await file.read()
    raw_text = OCRService.process_image(content, file.filename)
    return InvoiceParserService.parse(raw_text)

@app.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(invoice: InvoiceCreateSchema, db: Session = Depends(get_db)):
    try:
        # In dữ liệu đã được Pydantic làm sạch ra log
        logger.info(f"📥 Data Validated: {invoice.model_dump()}")

        # Hàm helper để cắt chuỗi nếu quá dài
        def truncate_string(s: Optional[str], max_length: int) -> Optional[str]:
            if s is None:
                return None
            return s[:max_length] if len(s) > max_length else s

        # Tính lại tổng tiền từ items (đảm bảo chính xác)
        calculated_total = sum(item.price if item.price else 0 for item in invoice.items)
        safe_total = calculated_total if calculated_total > 0 else (invoice.total_amount if invoice.total_amount else 0)

        # 1. Tạo các object Item trước (nhưng chưa lưu) với validation
        db_items = []
        for i in invoice.items:
            safe_price = i.price if i.price is not None else 0
            safe_name = truncate_string(i.name, 500)
            # Kiểm tra category_id có tồn tại không
            category_id = i.category_id if i.category_id else None
            if category_id:
                category_exists = db.query(ProductCategoryDB).filter(ProductCategoryDB.id == category_id).first()
                if not category_exists:
                    logger.warning(f"⚠️  Category ID {category_id} không tồn tại, bỏ qua category_id")
                    category_id = None
            
            db_items.append(InvoiceItemDB(
                name=safe_name, 
                price=safe_price,
                category_id=category_id
            ))

        # 2. Tạo Invoice cha và gán luôn items vào (SQLAlchemy tự xử lý ID)
        db_invoice = InvoiceDB(
            merchant_name=truncate_string(invoice.merchant_name, 500),
            date=truncate_string(invoice.date, 100),
            total_amount=safe_total,
            raw_text=invoice.raw_text,  # Text không giới hạn
            items=db_items # Gán trực tiếp list item vào đây
        )

        db.add(db_invoice)
        db.commit() # Chỉ commit 1 lần duy nhất
        db.refresh(db_invoice)

        logger.info(f"✅ Saved Invoice ID: {db_invoice.id}")
        return {"message": "Success", "id": db_invoice.id}

    except SQLAlchemyError as e:
        db.rollback()
        error_msg = str(e)
        logger.error(f"❌ Database Error: {error_msg}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        # Trả về thông báo lỗi chi tiết hơn để debug
        raise HTTPException(status_code=500, detail=f"Lỗi lưu Database: {error_msg}")
    except Exception as e:
        db.rollback()  # Đảm bảo rollback trong mọi trường hợp
        error_msg = str(e)
        logger.error(f"❌ Unknown Error: {error_msg}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {error_msg}")

@app.get("/invoices")
def read_invoices(db: Session = Depends(get_db)):
    invoices = db.query(InvoiceDB).order_by(InvoiceDB.id.desc()).limit(20).all()
    results = []
    for inv in invoices:
        items_list = []
        for i in inv.items:
            item_data = {
                "name": i.name, 
                "price": i.price,
                "category_id": i.category_id
            }
            if i.category:
                item_data["category_name"] = i.category.name
            items_list.append(item_data)
        
        results.append({
            "id": inv.id,
            "merchant_name": inv.merchant_name,
            "date": inv.date,
            "total_amount": inv.total_amount,
            "items": items_list,
            "raw_text": inv.raw_text
        })
    return results

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Lấy danh sách tất cả danh mục sản phẩm"""
    categories = db.query(ProductCategoryDB).order_by(ProductCategoryDB.id).all()
    return [{"id": cat.id, "name": cat.name, "description": cat.description} for cat in categories]

@app.get("/categories/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Lấy thông tin chi tiết một danh mục"""
    category = db.query(ProductCategoryDB).filter(ProductCategoryDB.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"id": category.id, "name": category.name, "description": category.description}

@app.get("/products/by-category")
def get_products_by_category(db: Session = Depends(get_db)):
    """Lấy tất cả sản phẩm được nhóm theo danh mục (bảng tổng hợp)"""
    categories = db.query(ProductCategoryDB).order_by(ProductCategoryDB.id).all()
    result = []
    
    for category in categories:
        # Lấy tất cả items thuộc danh mục này
        items = db.query(InvoiceItemDB).filter(
            InvoiceItemDB.category_id == category.id
        ).order_by(InvoiceItemDB.id.desc()).all()
        
        items_list = []
        total_amount = 0
        for item in items:
            items_list.append({
                "id": item.id,
                "name": item.name,
                "price": item.price,
                "invoice_id": item.invoice_id,
                "invoice_date": item.invoice.date if item.invoice else None,
                "merchant_name": item.invoice.merchant_name if item.invoice else None
            })
            total_amount += item.price if item.price else 0
        
        result.append({
            "category_id": category.id,
            "category_name": category.name,
            "category_description": category.description,
            "total_items": len(items_list),
            "total_amount": total_amount,
            "items": items_list
        })
    
    # Thêm các sản phẩm chưa có danh mục
    uncategorized_items = db.query(InvoiceItemDB).filter(
        InvoiceItemDB.category_id.is_(None)
    ).order_by(InvoiceItemDB.id.desc()).all()
    
    if uncategorized_items:
        uncategorized_list = []
        uncategorized_total = 0
        for item in uncategorized_items:
            uncategorized_list.append({
                "id": item.id,
                "name": item.name,
                "price": item.price,
                "invoice_id": item.invoice_id,
                "invoice_date": item.invoice.date if item.invoice else None,
                "merchant_name": item.invoice.merchant_name if item.invoice else None
            })
            uncategorized_total += item.price if item.price else 0
        
        result.append({
            "category_id": None,
            "category_name": "Chưa phân loại",
            "category_description": "Các sản phẩm chưa được chọn danh mục",
            "total_items": len(uncategorized_list),
            "total_amount": uncategorized_total,
            "items": uncategorized_list
        })
    
    return result

@app.get("/products/by-category/{category_id}")
def get_products_by_category_id(category_id: int, db: Session = Depends(get_db)):
    """Lấy tất cả sản phẩm của một danh mục cụ thể"""
    category = db.query(ProductCategoryDB).filter(ProductCategoryDB.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    items = db.query(InvoiceItemDB).filter(
        InvoiceItemDB.category_id == category_id
    ).order_by(InvoiceItemDB.id.desc()).all()
    
    items_list = []
    total_amount = 0
    for item in items:
        items_list.append({
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "invoice_id": item.invoice_id,
            "invoice_date": item.invoice.date if item.invoice else None,
            "merchant_name": item.invoice.merchant_name if item.invoice else None
        })
        total_amount += item.price if item.price else 0
    
    return {
        "category_id": category.id,
        "category_name": category.name,
        "category_description": category.description,
        "total_items": len(items_list),
        "total_amount": total_amount,
        "items": items_list
    }

@app.post("/ocr-invoices", status_code=status.HTTP_201_CREATED)
def create_ocr_invoice(invoice: OcrInvoiceCreateSchema, db: Session = Depends(get_db)):
    """API endpoint để lưu invoice từ OCR vào MySQL"""
    try:
        logger.info(f"📥 OCR Invoice Data: {invoice.model_dump()}")

        # Validation
        if not invoice.invoiceNumber:
            raise HTTPException(status_code=400, detail="Số hóa đơn là bắt buộc")
        
        if not invoice.productCategory or not invoice.productCategory.get('id'):
            raise HTTPException(status_code=400, detail="Danh mục sản phẩm là bắt buộc")

        if not invoice.lineItems or len(invoice.lineItems) == 0:
            raise HTTPException(status_code=400, detail="Phải có ít nhất một sản phẩm")

        # Hàm helper để cắt chuỗi
        def truncate_string(s: Optional[str], max_length: int) -> Optional[str]:
            if s is None:
                return None
            return s[:max_length] if len(s) > max_length else s

        # Lấy category_id
        category_id = invoice.productCategory.get('id')
        category_exists = db.query(ProductCategoryDB).filter(ProductCategoryDB.id == category_id).first()
        if not category_exists:
            raise HTTPException(status_code=400, detail=f"Danh mục ID {category_id} không tồn tại")

        # Tạo các invoice items
        db_items = []
        for item in invoice.lineItems:
            product_name = truncate_string(item.productName, 500) or ""
            quantity = item.quantity if item.quantity else 0
            unit_price = item.unitPrice if item.unitPrice else 0
            total = item.total if item.total else (quantity * unit_price)

            db_items.append(InvoiceItemDB(
                name=product_name,
                product_name=product_name,
                quantity=quantity,
                unit_price=unit_price,
                price=total,
                total=total,
                category_id=category_id
            ))

        # Tạo invoice
        db_invoice = InvoiceDB(
            invoice_number=truncate_string(invoice.invoiceNumber, 100),
            supplier_name=truncate_string(invoice.supplierName, 500),
            merchant_name=truncate_string(invoice.supplierName, 500),  # Dùng supplier_name làm merchant_name
            date=truncate_string(invoice.date, 100),
            total_amount=invoice.totalAmount if invoice.totalAmount else 0,
            vat_rate=invoice.vatRate if invoice.vatRate else 0,
            vat_amount=invoice.vatAmount if invoice.vatAmount else 0,
            raw_text=invoice.rawText or "",
            items=db_items
        )

        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)

        logger.info(f"✅ Saved OCR Invoice ID: {db_invoice.id}, Invoice Number: {db_invoice.invoice_number}")
        
        return {
            "message": "Success",
            "id": db_invoice.id,
            "invoiceNumber": db_invoice.invoice_number,
            "totalAmount": db_invoice.total_amount
        }

    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        error_msg = str(e)
        logger.error(f"❌ Database Error: {error_msg}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Lỗi lưu Database: {error_msg}")
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        logger.error(f"❌ Unknown Error: {error_msg}")
        logger.error(f"❌ Full traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Lỗi không xác định: {error_msg}")

@app.get("/statistics/by-category")
def get_statistics_by_category(db: Session = Depends(get_db)):
    """Thống kê tổng hợp theo danh mục"""
    categories = db.query(ProductCategoryDB).order_by(ProductCategoryDB.id).all()
    result = []
    
    for category in categories:
        items = db.query(InvoiceItemDB).filter(
            InvoiceItemDB.category_id == category.id
        ).all()
        
        total_amount = sum(item.price if item.price else 0 for item in items)
        invoice_count = len(set(item.invoice_id for item in items if item.invoice_id))
        
        result.append({
            "category_id": category.id,
            "category_name": category.name,
            "total_items": len(items),
            "total_amount": total_amount,
            "invoice_count": invoice_count,
            "average_per_item": total_amount / len(items) if items else 0
        })
    
    # Thống kê chưa phân loại
    uncategorized = db.query(InvoiceItemDB).filter(
        InvoiceItemDB.category_id.is_(None)
    ).all()
    
    if uncategorized:
        uncategorized_total = sum(item.price if item.price else 0 for item in uncategorized)
        uncategorized_invoices = len(set(item.invoice_id for item in uncategorized if item.invoice_id))
        
        result.append({
            "category_id": None,
            "category_name": "Chưa phân loại",
            "total_items": len(uncategorized),
            "total_amount": uncategorized_total,
            "invoice_count": uncategorized_invoices,
            "average_per_item": uncategorized_total / len(uncategorized) if uncategorized else 0
        })
    
    return result

if __name__ == "__main__":
    import uvicorn
    import sys
    
    # Kiểm tra port có đang được sử dụng không
    port = 8000
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        if result == 0:
            logger.warning(f"⚠️  Port {port} đang được sử dụng!")
            logger.info("💡 Giải pháp:")
            logger.info("   1. Tắt process cũ đang chạy trên port này")
            logger.info("   2. Hoặc đổi port trong code (ví dụ: port=8001)")
            logger.info("   3. Trên Windows: taskkill /PID <PID> /F")
            sys.exit(1)
    except Exception as e:
        logger.warning(f"Không thể kiểm tra port: {e}")
    
    logger.info(f"🚀 Starting server on http://0.0.0.0:{port}")
    try:
        uvicorn.run(app, host="0.0.0.0", port=port)
    except OSError as e:
        if "10048" in str(e) or "address already in use" in str(e).lower():
            logger.error(f"❌ Port {port} đang được sử dụng bởi process khác!")
            logger.info("💡 Chạy lệnh sau để tìm và kill process:")
            logger.info(f"   netstat -ano | findstr :{port}")
            logger.info("   taskkill /PID <PID> /F")
        raise