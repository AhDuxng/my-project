import os
import json
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Load biến môi trường từ file .env
load_dotenv()

app = FastAPI()

# 2. Cấu hình CORS để Frontend (React) có thể gọi được Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép mọi nguồn (trong dev). Product nên để domain cụ thể.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Cấu hình Google Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("⚠️  CẢNH BÁO: Chưa tìm thấy GEMINI_API_KEY trong file .env")
else:
    genai.configure(api_key=API_KEY)

# Sử dụng model AI
model = genai.GenerativeModel('gemini-2.0-flash')

@app.post("/analyze-invoice")
async def analyze_invoice(file: UploadFile = File(...)):
    # Kiểm tra định dạng file
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File tải lên phải là hình ảnh.")

    try:
        # Đọc dữ liệu ảnh
        content = await file.read()

        # --- PROMPT AI
        prompt = """
        Hãy đóng vai một công cụ OCR và xử lý dữ liệu hóa đơn chuyên nghiệp. Nhiệm vụ của bạn là trích xuất TOÀN BỘ thông tin văn bản nhìn thấy trong hình ảnh này.

        Yêu cầu định dạng đầu ra:
        1. Trả về kết quả dưới dạng JSON thuần túy hợp lệ (raw JSON).
        2. KHÔNG sử dụng markdown code block (không dùng ```json).
        3. Tuyệt đối KHÔNG bỏ sót bất kỳ thông tin nào xuất hiện trên hóa đơn (ví dụ: Địa chỉ, Số điện thoại, Mã số thuế, Tên thu ngân, Giờ in, Tiền thừa, Tiền khách đưa...).
        4. Nếu một trường thông tin có trên hóa đơn nhưng không nằm trong danh sách key tiêu chuẩn, hãy đưa nó vào object "other_info".

        Cấu trúc JSON mong muốn:
        {
            "merchant_name": "Tên cửa hàng/người bán (viết đúng theo ảnh)",
            "merchant_address": "Địa chỉ chi tiết của cửa hàng",
            "merchant_phone": "Số điện thoại cửa hàng",
            "tax_id": "Mã số thuế (MST)",
            "invoice_number": "Số hóa đơn/Mã vận đơn",
            "date": "Ngày mua hàng (giữ nguyên định dạng gốc trên ảnh)",
            "time": "Giờ mua hàng (nếu có)",
            "items": [
                {
                    "name": "Tên sản phẩm đầy đủ",
                    "quantity": "Số lượng (giữ nguyên đơn vị tính nếu có)",
                    "unit_price": "Đơn giá",
                    "total_price": "Thành tiền",
                    "discount": "Giảm giá trên sản phẩm (nếu có)"
                }
            ],
            "financials": {
                "subtotal": "Tổng tiền hàng (trước thuế/giảm giá)",
                "tax_amount": "Tổng tiền thuế",
                "discount_amount": "Tổng giảm giá hóa đơn",
                "service_charge": "Phí dịch vụ/Ship",
                "total_amount": "Tổng thanh toán cuối cùng (số to nhất)",
                "currency": "Đơn vị tiền tệ (VND, USD...)"
            },
            "payment_info": {
                "method": "Phương thức thanh toán (Tiền mặt/Thẻ/Chuyển khoản)",
                "cash_given": "Tiền khách đưa",
                "change_returned": "Tiền thừa trả khách"
            },
            "other_info": {
                "cashier_name": "Tên thu ngân",
                "wifi_password": "Mật khẩu wifi (nếu có)",
                "footer_message": "Lời cảm ơn cuối hóa đơn",
                "...": "Bất kỳ thông tin nào khác thấy trên ảnh gán vào key tương ứng"
            }
        }
        """

        # Gửi yêu cầu sang Google Gemini
        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": content}
        ])

        # Xử lý kết quả trả về (Làm sạch chuỗi JSON)
        response_text = response.text.strip()
        
        # Loại bỏ markdown code block nếu Gemini lỡ thêm vào
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
            
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        # Parse string thành JSON object
        invoice_data = json.loads(response_text)
        
        return invoice_data

    except json.JSONDecodeError:
        # Trường hợp AI trả về text không phải JSON chuẩn
        print(f"Lỗi JSON: {response.text}")
        raise HTTPException(status_code=500, detail="AI trả về dữ liệu không đúng định dạng JSON.")
    except Exception as e:
        print(f"Lỗi Server: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý: {str(e)}")

if __name__ == "__main__":
    print("🚀 Server đang chạy tại http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)