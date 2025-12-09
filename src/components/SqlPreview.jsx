/**
 * SqlPreview Component
 * Hiển thị SQL queries được tạo từ JSON OCR
 */
import { useEffect, useState } from 'react';
import { convertToSQL } from '../services/invoiceApi';

const SqlPreview = ({ invoiceData }) => {
  const [sqlQueries, setSqlQueries] = useState(null);

  useEffect(() => {
    if (invoiceData) {
      const sql = convertToSQL(invoiceData);
      setSqlQueries(sql);
    }
  }, [invoiceData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy SQL vào clipboard!');
  };

  if (!sqlQueries) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">Chưa có dữ liệu để tạo SQL</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">SQL Queries</h2>
        <button
          onClick={() => copyToClipboard(sqlQueries.fullSQL)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          📋 Copy tất cả
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Các câu lệnh SQL sẽ được thực thi để lưu dữ liệu vào database:
      </p>

      {/* Invoice SQL */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-green-700">1. INSERT INTO invoices</h3>
          <button
            onClick={() => copyToClipboard(sqlQueries.invoiceSQL)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Copy
          </button>
        </div>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {sqlQueries.invoiceSQL}
          </pre>
        </div>
      </div>

      {/* Items SQL */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-blue-700">
            2. INSERT INTO invoice_items ({sqlQueries.itemsSQL.split('\n\n').length} items)
          </h3>
          <button
            onClick={() => copyToClipboard(sqlQueries.itemsSQL)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Copy
          </button>
        </div>
        <div className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {sqlQueries.itemsSQL}
          </pre>
        </div>
      </div>

      {/* Full SQL */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800 mb-2">
          Xem toàn bộ SQL (Full Script)
        </summary>
        <div className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {sqlQueries.fullSQL}
          </pre>
        </div>
      </details>

      {/* Info */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Các câu lệnh SQL này sẽ được thực thi tự động khi bạn lưu vào database.
          Bạn có thể copy để kiểm tra hoặc chạy thủ công nếu cần.
        </p>
      </div>
    </div>
  );
};

export default SqlPreview;

