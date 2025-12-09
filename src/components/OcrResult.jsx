/**
 * OcrResult Component
 * Hiển thị và cho phép chỉnh sửa kết quả OCR
 */
import { useState, useEffect } from 'react';
import { getProductCategories } from '../services/api';

const OcrResult = ({ ocrData, onDataChange }) => {
  const [editedData, setEditedData] = useState(ocrData);
  const [categories, setCategories] = useState([]);
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setEditedData(ocrData);
  }, [ocrData]);

  const loadCategories = async () => {
    try {
      const cats = await getProductCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleChange = (field, value) => {
    const updated = { ...editedData, [field]: value };
    setEditedData(updated);
    onDataChange(updated);
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = { ...editedData };
    updated.lineItems[index] = {
      ...updated.lineItems[index],
      [field]: field === 'quantity' || field === 'unitPrice' || field === 'total' 
        ? parseFloat(value) || 0 
        : value
    };
    
    // Tự động tính total nếu quantity hoặc unitPrice thay đổi
    if (field === 'quantity' || field === 'unitPrice') {
      updated.lineItems[index].total = 
        updated.lineItems[index].quantity * updated.lineItems[index].unitPrice;
    }
    
    // Tính lại tổng tiền
    updated.totalAmount = updated.lineItems.reduce((sum, item) => sum + item.total, 0);
    // Tính VAT theo % thuế
    const vatRate = updated.vatRate || 0;
    updated.vatAmount = Math.floor(updated.totalAmount * (vatRate / 100));
    
    setEditedData(updated);
    onDataChange(updated);
  };

  const handleVatRateChange = (vatRate) => {
    const updated = { ...editedData };
    updated.vatRate = parseFloat(vatRate) || 0;
    // Tính lại VAT
    updated.vatAmount = Math.floor(updated.totalAmount * (updated.vatRate / 100));
    setEditedData(updated);
    onDataChange(updated);
  };

  const handleAddLineItem = () => {
    const updated = { ...editedData };
    updated.lineItems.push({
      productName: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
    setEditedData(updated);
    onDataChange(updated);
  };

  const handleRemoveLineItem = (index) => {
    const updated = { ...editedData };
    updated.lineItems = updated.lineItems.filter((_, i) => i !== index);
    updated.totalAmount = updated.lineItems.reduce((sum, item) => sum + item.total, 0);
    // Tính lại VAT theo % thuế
    const vatRate = updated.vatRate || 0;
    updated.vatAmount = Math.floor(updated.totalAmount * (vatRate / 100));
    setEditedData(updated);
    onDataChange(updated);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Kết quả OCR - Chỉnh sửa dữ liệu</h2>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số hóa đơn
          </label>
          <input
            type="text"
            value={editedData.invoiceNumber || ''}
            onChange={(e) => handleChange('invoiceNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nhà cung cấp
          </label>
          <input
            type="text"
            value={editedData.supplierName || ''}
            onChange={(e) => handleChange('supplierName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày
          </label>
          <input
            type="date"
            value={editedData.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục sản phẩm <span className="text-red-500">*</span>
          </label>
          <select
            value={editedData.productCategory?.id || ''}
            onChange={(e) => {
              const selectedCat = categories.find(cat => cat.id === parseInt(e.target.value));
              handleChange('productCategory', selectedCat || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            % Thuế VAT
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={editedData.vatRate || 0}
              onChange={(e) => handleVatRateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
              step="0.1"
              placeholder="0"
            />
            <span className="text-gray-600 font-medium">%</span>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chi tiết sản phẩm</h3>
          <button
            onClick={handleAddLineItem}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold"
          >
            + Thêm sản phẩm
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SẢN PHẨM</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">SỐ LƯỢNG</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ĐƠN GIÁ</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">THÀNH TIỀN</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {editedData.lineItems?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.productName || ''}
                      onChange={(e) => handleLineItemChange(index, 'productName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tên sản phẩm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.quantity || 0}
                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.unitPrice || 0}
                      onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(item.total || 0)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveLineItem(index)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded text-sm font-bold"
                      title="Xóa sản phẩm"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-700">Tổng tiền:</span>
          <span className="text-xl font-bold text-blue-600">
            {formatCurrency(editedData.totalAmount || 0)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-gray-700">
            Thuế VAT ({editedData.vatRate || 0}%):
          </span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(editedData.vatAmount || 0)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
          <span className="font-bold text-lg text-gray-900">Thành tiền:</span>
          <span className="text-2xl font-bold text-green-600">
            {formatCurrency((editedData.totalAmount || 0) + (editedData.vatAmount || 0))}
          </span>
        </div>
      </div>

      {/* Raw Text */}
      {editedData.rawText && (
        <div className="mb-4">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showRawText ? '▼' : '▶'} Xem văn bản OCR gốc
          </button>
          {showRawText && (
            <div className="mt-2 p-4 bg-gray-100 rounded border border-gray-300">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {editedData.rawText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* JSON View */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
          Xem dữ liệu JSON
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded border border-gray-300 overflow-auto text-xs">
          {JSON.stringify(editedData, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default OcrResult;

