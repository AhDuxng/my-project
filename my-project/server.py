import os
import re
import json
import logging
import requests
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# CONFIG & LOGGING
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

API_KEY = os.getenv("OCR_API_KEY")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "invoice_db")

if not API_KEY:
    logger.warning("OCR_API_KEY không có trong file .env")

# DATABASE SETUP
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    engine = create_engine(DATABASE_URL, pool_recycle=3600, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logger.info("Kết nối thành công MySQL")
except Exception as e:
    logger.critical(f"Lỗi kết nối MySQL: {e}")
    raise e

# MODELS & SCHEMAS
class InvoiceDB(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    merchant_name = Column(String(255), index=True)
    date = Column(String(50))
    total_amount = Column(Integer)
    items_json = Column(Text)
    raw_text = Column(Text)

Base.metadata.create_all(bind=engine)

class ItemSchema(BaseModel):
    name: str
    price: int

class InvoiceCreateSchema(BaseModel):
    merchant_name: str
    date: str
    total_amount: int
    items: List[ItemSchema]
    raw_text: Optional[str] = ""

# SERVICES 
class InvoiceParserService:
    @staticmethod
    def parse_money(text: str) -> int:
        clean_text = re.sub(r'[^\d]', '', text)
        try:
            return int(clean_text)
        except ValueError:
            return 0

    @classmethod
    def parse(cls, raw_text: str) -> dict:
        lines = [line.strip() for line in raw_text.split('\r\n') if line.strip()]
        
        parsed_data = {
            "merchant_name": "Unknown Store",
            "date": "",
            "items": [],
            "total_amount": 0,
            "raw_text": raw_text
        }

        if not lines:
            return parsed_data

        parsed_data["merchant_name"] = lines[0]

        # Extract Date
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b'
        for line in lines:
            match = re.search(date_pattern, line)
            if match:
                parsed_data["date"] = match.group(0)
                break

        # Extract Items & Price
        max_amount = 0
        for line in lines:
            match = re.search(r'(.+?)[\s\.:]+([\d,.]+)$', line)
            if match:
                item_name = match.group(1).strip()
                price_str = match.group(2)
                
                if len(item_name) < 2 or set(item_name).issubset(set(' -:.,')):
                    continue
                if re.search(date_pattern, item_name):
                    continue

                price = cls.parse_money(price_str)
                if price > 0:
                    parsed_data["items"].append({"name": item_name, "price": price})
                    if price > max_amount:
                        max_amount = price

        parsed_data["total_amount"] = max_amount
        return parsed_data

class OCRService:
    OCR_URL = "https://api.ocr.space/parse/image"

    @staticmethod
    def process_image(file_bytes: bytes, filename: str) -> str:
        payload = {
            'apikey': API_KEY,
            'language': 'eng',
            'isOverlayRequired': False,
            'scale': True,
            'OCREngine': 2
        }
        files = {'file': (filename, file_bytes, 'image/png')}

        try:
            logger.info("📡 Sending request to OCR.space...")
            response = requests.post(OCRService.OCR_URL, files=files, data=payload, timeout=20)
            
            if response.status_code != 200:
                raise Exception(f"OCR API Error: {response.status_code}")

            result = response.json()
            if result.get("IsErroredOnProcessing"):
                raise Exception(f"OCR Processing Error: {result.get('ErrorMessage')}")
            
            parsed_results = result.get("ParsedResults")
            if not parsed_results or not parsed_results[0].get("ParsedText"):
                return ""
                
            return parsed_results[0].get("ParsedText")

        except Exception as e:
            logger.error(f"OCR Service Error: {e}")
            raise e

# API ENDPOINTS 
app = FastAPI(title="Invoice Scanner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/analyze-invoice", response_model=InvoiceCreateSchema)
async def analyze_invoice(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file")

    try:
        content = await file.read()
        raw_text = OCRService.process_image(content, file.filename)
        
        if not raw_text:
            return {
                "merchant_name": "Not recognized",
                "date": "",
                "total_amount": 0,
                "items": [],
                "raw_text": ""
            }

        return InvoiceParserService.parse(raw_text)

    except Exception as e:
        logger.error(f"Analyze Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(invoice: InvoiceCreateSchema, db: Session = Depends(get_db)):
    try:
        items_str = json.dumps([item.model_dump() for item in invoice.items], ensure_ascii=False)
        
        db_invoice = InvoiceDB(
            merchant_name=invoice.merchant_name,
            date=invoice.date,
            total_amount=invoice.total_amount,
            items_json=items_str,
            raw_text=invoice.raw_text
        )
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        
        logger.info(f"Saved Invoice ID: {db_invoice.id}")
        return {"message": "Success", "id": db_invoice.id}

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database Error: {e}")
        raise HTTPException(status_code=500, detail="Database save failed")

@app.get("/invoices")
def read_invoices(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    invoices = db.query(InvoiceDB).order_by(InvoiceDB.id.desc()).offset(skip).limit(limit).all()
    results = []
    for inv in invoices:
        inv_dict = inv.__dict__
        if inv_dict.get("items_json"):
            try:
                inv_dict["items"] = json.loads(inv_dict["items_json"])
            except json.JSONDecodeError:
                inv_dict["items"] = []
        else:
             inv_dict["items"] = []
        results.append(inv_dict)
    return results

if __name__ == "__main__":
    logger.info("🚀 Server starting on port 8000...")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)