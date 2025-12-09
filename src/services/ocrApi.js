/**
 * OCR API Service - Giả lập API OCR
 * Chuyển đổi ảnh thành JSON dữ liệu
 */

/**
 * Giả lập OCR - Chuyển base64 image thành JSON
 * Trong thực tế, đây sẽ là API call đến OCR service
 */
export const processOCR = async (base64Image) => {
  // Giả lập delay của API
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Giả lập kết quả OCR với dữ liệu mẫu
  // Trong thực tế, đây sẽ là response từ OCR API
  const mockOcrResult = {
    invoiceNumber: "HD" + Math.floor(Math.random() * 10000).toString().padStart(5, '0'),
    supplierName: "CTY TNHH ABC",
    date: new Date().toISOString().split('T')[0],
    totalAmount: Math.floor(Math.random() * 50000000) + 1000000,
    vatRate: 10, // % thuế VAT (mặc định 10%)
    vatAmount: 0,
    lineItems: [
      {
        productName: "Máy in HP LaserJet",
        quantity: 1,
        unitPrice: 12500000,
        total: 12500000
      },
      {
        productName: "Giấy A4",
        quantity: 10,
        unitPrice: 50000,
        total: 500000
      }
    ],
    rawText: `HÓA ĐƠN BÁN HÀNG
Số: HD00123
Ngày: ${new Date().toLocaleDateString('vi-VN')}
Nhà cung cấp: CTY TNHH ABC
Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM

Máy in HP LaserJet    x1    12,500,000đ
Giấy A4               x10   500,000đ

Tổng cộng: 13,000,000đ
Thuế VAT: 0đ
Thành tiền: 13,000,000đ`
  };

  // Tính lại VAT và tổng tiền
  const total = mockOcrResult.lineItems.reduce((sum, item) => sum + item.total, 0);
  mockOcrResult.totalAmount = total;
  mockOcrResult.vatAmount = Math.floor(total * (mockOcrResult.vatRate / 100)); // Tính VAT theo %

  return mockOcrResult;
};

/**
 * Convert image file sang base64
 */
export const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      // Remove data:image/jpeg;base64, prefix nếu có
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

