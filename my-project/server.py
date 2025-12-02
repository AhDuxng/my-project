import os
import uvicorn
import requests
import re
import json
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OCR_API_KEY", "helloworld")

def parse_money(text):
    """Lọc số từ chuỗi tiền tệ (VD: 100,000 -> 100000)"""
    # Chỉ giữ lại số và dấu chấm
    clean_text = re.sub(r'[^\d]', '', text)
    try:
        return int(clean_text)
    except:
        return 0

def smart_invoice_parser(raw_text):
    """Phân tích text thô thành JSON"""
    lines = [line.strip() for line in raw_text.split('\r\n') if line.strip()]
    
    parsed_data = {
        "merchant_name": "Unknown",
        "date": "",
        "items": [],
        "total_amount": 0,
        "raw_text": raw_text
    }

    if not lines:
        return parsed_data

    parsed_data["merchant_name"] = lines[0]

    # Tìm ngày tháng
    for line in lines:
        if re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{4}', line):
            parsed_data["date"] = re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{4}', line).group(0)
            break

    max_amount = 0
    
    for line in lines:
        # Regex tìm dòng có giá tiền ở cuối
        match = re.search(r'(.+?)[\s\t\.\:]+([\d,.]+)$', line)
        if match:
            item_name = match.group(1).strip()
            price_str = match.group(2)
            
            # Bỏ qua các dòng quá ngắn
            if len(item_name) < 2 or set(item_name).issubset(set(' -:.,')):
                continue

            price = parse_money(price_str)
            
            if price > 0:
                parsed_data["items"].append({
                    "name": item_name,
                    "price": price
                })
                # Giả định số lớn nhất là tổng tiền
                if price > max_amount:
                    max_amount = price

    parsed_data["total_amount"] = max_amount
    return parsed_data

@app.post("/analyze-invoice")
async def analyze_invoice(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File phải là hình ảnh.")

    try:
        content = await file.read()
        
        url = "https://api.ocr.space/parse/image"
        
        payload = {
            'apikey': API_KEY,
            'language': 'eng',   
            'isOverlayRequired': True,
            'scale': True,
            'OCREngine': 2      
        }
        
        files = {'file': (file.filename, content, file.content_type)}
        
        print(f"📡 Đang gửi file sang OCR.space (Engine 2 - English)...")
        # Timeout 30s để tránh treo
        response = requests.post(url, files=files, data=payload, timeout=30)
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Lỗi kết nối OCR.space")

        result = response.json()
        
        # Debug lỗi
        if result.get("IsErroredOnProcessing") == True:
            err = result.get("ErrorMessage")
            print(f"❌ Lỗi API: {err}")
            raise HTTPException(status_code=400, detail=f"OCR Error: {err}")

        parsed_results = result.get("ParsedResults")
        if not parsed_results:
             return {"message": "Không đọc được chữ nào.", "data": {}}

        full_text = parsed_results[0].get("ParsedText", "")
        print("--- KẾT QUẢ TEXT ---")
        print(full_text)
        
        # Chuyển text thành JSON
        json_response = smart_invoice_parser(full_text)
        return json_response

    except Exception as e:
        print(f"❌ Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Server đang chạy...")
    uvicorn.run(app, host="0.0.0.0", port=8000)