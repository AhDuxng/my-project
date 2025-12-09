/**
 * DocumentForm Component
 * Form để tạo mới hoặc chỉnh sửa tài liệu
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createDocument, updateDocument, getDocumentById, getProductCategories } from '../services/api';

const DocumentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    documentType: 'official',
    productCategoryId: '',
    attachments: [],
    createdBy: 'Admin'
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load categories và document (nếu edit mode)
  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await getProductCategories();
        setCategories(cats);

        if (isEditMode) {
          const doc = getDocumentById(id);
          if (doc) {
            setFormData({
              title: doc.title || '',
              description: doc.description || '',
              documentType: doc.documentType || 'official',
              productCategoryId: doc.productCategory?.id?.toString() || '',
              attachments: doc.attachments || [],
              createdBy: doc.createdBy || 'Admin'
            });
          } else {
            setError('Document not found');
          }
        }
      } catch (err) {
        setError('Error loading data: ' + err.message);
      }
    };

    loadData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttachmentAdd = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, file.name]
      }));
    }
  };

  const handleAttachmentRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      if (!formData.productCategoryId) {
        setError('Product Category is required');
        setLoading(false);
        return;
      }

      // Tìm category object
      const selectedCategory = categories.find(
        cat => cat.id === parseInt(formData.productCategoryId)
      );

      if (!selectedCategory) {
        setError('Invalid product category');
        setLoading(false);
        return;
      }

      // Chuẩn bị dữ liệu
      const documentData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        documentType: formData.documentType,
        productCategory: {
          id: selectedCategory.id,
          name: selectedCategory.name
        },
        attachments: formData.attachments,
        createdBy: formData.createdBy
      };

      // Lưu
      if (isEditMode) {
        updateDocument(id, documentData);
        alert('✅ Document updated successfully!');
      } else {
        createDocument(documentData);
        alert('✅ Document created successfully!');
      }

      navigate('/documents');
    } catch (err) {
      setError('Error saving document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">
          {isEditMode ? 'Edit Document' : 'Create New Document'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter document title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="official">Official (Nộp Nhà nước)</option>
              <option value="internal">Internal (Nội bộ)</option>
            </select>
          </div>

          {/* Product Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Category <span className="text-red-500">*</span>
            </label>
            <select
              name="productCategoryId"
              value={formData.productCategoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <input
              type="file"
              onChange={handleAttachmentAdd}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded">
                    <span className="text-sm">{file}</span>
                    <button
                      type="button"
                      onClick={() => handleAttachmentRemove(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created By
            </label>
            <input
              type="text"
              name="createdBy"
              value={formData.createdBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter creator name"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentForm;

