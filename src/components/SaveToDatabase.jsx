/**
 * SaveToDatabase Component
 * Lưu dữ liệu vào database và hiển thị kết quả
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SaveToDatabase = ({ invoiceData }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);

  const handleSave = async () => {
    // Validation
    if (!invoiceData.invoiceNumber) {
      setError('Vui lòng nhập số hóa đơn');
      return;
    }

    if (!invoiceData.productCategory) {
      setError('Vui lòng chọn danh mục sản phẩm');
      return;
    }

    if (!invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      setError('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // Gọi API để lưu vào MySQL
      const response = await fetch('http://localhost:8000/ocr-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Lỗi khi lưu vào database');
      }

      const saved = await response.json();
      setSavedInvoice(saved);
      setSuccess(true);

      // Hiển thị thông báo thành công
      setTimeout(() => {
        alert(`✅ Lưu thành công vào MySQL!\n\nSố hóa đơn: ${saved.invoiceNumber}\nID: ${saved.id}\nTổng tiền: ${new Intl.NumberFormat('vi-VN').format(saved.totalAmount)} đ`);
        
        // Chuyển đến trang danh sách
        navigate('/invoices');
      }, 500);

    } catch (err) {
      console.error('Error saving to database:', err);
      setError('Lỗi khi lưu database: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Lưu vào Database</h2>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Tóm tắt dữ liệu sẽ lưu:</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Số hóa đơn:</strong> {invoiceData.invoiceNumber || 'N/A'}</p>
          <p><strong>Nhà cung cấp:</strong> {invoiceData.supplierName || 'N/A'}</p>
          <p><strong>Ngày:</strong> {invoiceData.date || 'N/A'}</p>
          <p><strong>Danh mục:</strong> {invoiceData.productCategory?.name || 'Chưa chọn'}</p>
          <p><strong>Số sản phẩm:</strong> {invoiceData.lineItems?.length || 0}</p>
          <p><strong>Tổng tiền:</strong> {formatCurrency(invoiceData.totalAmount || 0)}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Success */}
      {success && savedInvoice && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-semibold">✅ Lưu thành công!</p>
          <p className="text-sm mt-1">ID: {savedInvoice.id} | Số hóa đơn: {savedInvoice.invoiceNumber}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex space-x-4">
        <button
          onClick={handleSave}
          disabled={saving || success}
          className={`flex-1 px-6 py-3 rounded-md font-semibold transition-colors ${
            saving || success
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang lưu...
            </span>
          ) : success ? (
            '✅ Đã lưu thành công'
          ) : (
            '💾 Lưu vào Database'
          )}
        </button>

        <button
          onClick={() => navigate('/invoices')}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-400"
        >
          Xem danh sách
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Lưu ý:</strong> Dữ liệu sẽ được lưu trực tiếp vào MySQL database của bạn.
          Đảm bảo server Python đang chạy tại http://localhost:8000
        </p>
      </div>
    </div>
  );
};

export default SaveToDatabase;

