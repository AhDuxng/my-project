/**
 * InvoiceDetailPage
 * Trang chi tiết chứng từ
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceById } from '../services/invoiceApi';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = () => {
    setLoading(true);
    try {
      const data = getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Không tìm thấy chứng từ
        <div className="mt-4">
          <Link to="/invoices" className="text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/invoices"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Quay lại danh sách
          </Link>
          <h2 className="text-2xl font-bold">Chi tiết Chứng Từ</h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">ID</label>
            <p className="text-lg font-semibold">#{invoice.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Số hóa đơn</label>
            <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Nhà cung cấp</label>
            <p className="text-lg">{invoice.supplierName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Ngày</label>
            <p className="text-lg">{invoice.date}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Danh mục sản phẩm</label>
            <p className="text-lg">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                {invoice.productCategory?.name || 'N/A'}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Ngày tạo</label>
            <p className="text-lg text-gray-600">
              {new Date(invoice.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {/* Line Items */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Chi tiết sản phẩm</h3>
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SẢN PHẨM</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">SỐ LƯỢNG</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ĐƠN GIÁ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">THÀNH TIỀN</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.lineItems?.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-6 border-t border-gray-200 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-gray-700">Tổng tiền:</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(invoice.totalAmount || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold text-gray-700">
              Thuế VAT ({invoice.vatRate || 0}%):
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(invoice.vatAmount || 0)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
            <span className="font-bold text-lg text-gray-900">Thành tiền:</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency((invoice.totalAmount || 0) + (invoice.vatAmount || 0))}
            </span>
          </div>
        </div>

        {/* Raw Text */}
        {invoice.rawText && (
          <details className="pt-6 border-t border-gray-200">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
              Xem văn bản OCR gốc
            </summary>
            <div className="mt-2 p-4 bg-gray-100 rounded border border-gray-300">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {invoice.rawText}
              </pre>
            </div>
          </details>
        )}

        {/* JSON View */}
        <details className="pt-6 border-t border-gray-200">
          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
            Xem dữ liệu JSON
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded border border-gray-300 overflow-auto text-xs">
            {JSON.stringify(invoice, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;

