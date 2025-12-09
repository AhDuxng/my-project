/**
 * DocumentDetail Component
 * Hiển thị chi tiết đầy đủ của một tài liệu
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDocumentById, deleteDocument } from '../services/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = () => {
    setLoading(true);
    setError('');
    
    try {
      const doc = getDocumentById(id);
      if (doc) {
        setDocument(doc);
      } else {
        setError('Document not found');
      }
    } catch (err) {
      setError('Error loading document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${document.title}"?`)) {
      deleteDocument(id);
      alert('Document deleted successfully!');
      navigate('/documents');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadgeColor = (type) => {
    return type === 'official' 
      ? 'bg-green-100 text-green-800 border-green-300' 
      : 'bg-blue-100 text-blue-800 border-blue-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Document not found'}
        <div className="mt-4">
          <Link to="/documents" className="text-blue-600 hover:underline">
            ← Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link
            to="/documents"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Documents
          </Link>
          <h2 className="text-2xl font-bold">Document Details</h2>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/documents/${id}/edit`}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Document Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">
            Title
          </label>
          <h3 className="text-xl font-semibold text-gray-900">{document.title}</h3>
        </div>

        {/* Description */}
        {document.description && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Description
            </label>
            <p className="text-gray-900 whitespace-pre-wrap">{document.description}</p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Document Type
            </label>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${getTypeBadgeColor(document.documentType)}`}>
              {document.documentType === 'official' ? 'Official (Nộp Nhà nước)' : 'Internal (Nội bộ)'}
            </span>
          </div>

          {/* Product Category */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Product Category
            </label>
            <div className="text-gray-900 font-medium">
              {document.productCategory ? (
                <>
                  <span className="text-lg">{document.productCategory.name}</span>
                  <span className="text-gray-500 ml-2">(ID: {document.productCategory.id})</span>
                </>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Created At
            </label>
            <div className="text-gray-900">{formatDate(document.createdAt)}</div>
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Created By
            </label>
            <div className="text-gray-900">{document.createdBy || 'N/A'}</div>
          </div>

          {/* Document ID */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Document ID
            </label>
            <div className="text-gray-900 font-mono">#{document.id}</div>
          </div>
        </div>

        {/* Attachments */}
        {document.attachments && document.attachments.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Attachments ({document.attachments.length})
            </label>
            <div className="space-y-2">
              {document.attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded border border-gray-200"
                >
                  <span className="text-gray-400">📎</span>
                  <span className="text-gray-900">{file}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JSON View (for debugging) */}
        <details className="pt-4 border-t border-gray-200">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
            View Raw JSON Data
          </summary>
          <pre className="mt-2 p-4 bg-gray-50 rounded border border-gray-200 overflow-auto text-xs">
            {JSON.stringify(document, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default DocumentDetail;

