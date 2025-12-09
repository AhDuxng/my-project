/**
 * ProductCategories Page
 * Hiển thị danh sách danh mục sản phẩm
 */
import { useEffect, useState } from 'react';
import { getProductCategories, getDocuments } from '../services/api';

const ProductCategories = () => {
  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getProductCategories();
      const docs = getDocuments();
      setCategories(cats);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryUsage = (categoryId) => {
    return documents.filter(
      doc => doc.productCategory && doc.productCategory.id === categoryId
    ).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Product Categories</h2>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          These are the product categories available for document classification.
          Each document must be assigned to one category.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const usageCount = getCategoryUsage(category.id);
          return (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {category.id}</p>
                </div>
                <span className="text-2xl">📁</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents using this category:</span>
                  <span className="text-lg font-bold text-blue-600">{usageCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            <p className="text-sm text-gray-600">Total Categories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            <p className="text-sm text-gray-600">Total Documents</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {categories.filter(cat => getCategoryUsage(cat.id) > 0).length}
            </p>
            <p className="text-sm text-gray-600">Categories in Use</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {categories.filter(cat => getCategoryUsage(cat.id) === 0).length}
            </p>
            <p className="text-sm text-gray-600">Unused Categories</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCategories;

