/**
 * Main App Component
 * Ứng dụng quản lý tài liệu kế toán - kiểm toán
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DocumentList from './components/DocumentList';
import DocumentForm from './components/DocumentForm';
import DocumentDetail from './components/DocumentDetail';
import ProductCategories from './pages/ProductCategories';
import OcrProcessPage from './pages/OcrProcessPage';
import InvoiceList from './components/InvoiceList';
import InvoiceDetailPage from './pages/InvoiceDetailPage';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 ml-64 p-8">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Documents */}
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/new" element={<DocumentForm />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/documents/:id/edit" element={<DocumentForm />} />

            {/* Product Categories */}
            <Route path="/categories" element={<ProductCategories />} />

            {/* OCR Process */}
            <Route path="/ocr-process" element={<OcrProcessPage />} />

            {/* Invoices (from OCR) */}
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
