/**
 * API Service - Quản lý tài liệu kế toán
 * Sử dụng localStorage để lưu trữ dữ liệu (mô phỏng database)
 */

const STORAGE_KEY_DOCUMENTS = 'accounting_documents';
const STORAGE_KEY_CATEGORIES = 'product_categories';

/**
 * Lấy danh sách tất cả tài liệu
 */
export const getDocuments = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DOCUMENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting documents:', error);
    return [];
  }
};

/**
 * Lấy một tài liệu theo ID
 */
export const getDocumentById = (id) => {
  const documents = getDocuments();
  return documents.find(doc => doc.id === parseInt(id));
};

/**
 * Tạo tài liệu mới
 */
export const createDocument = (documentData) => {
  const documents = getDocuments();
  const newDocument = {
    ...documentData,
    id: documents.length > 0 ? Math.max(...documents.map(d => d.id)) + 1 : 1,
    createdAt: new Date().toISOString(),
    createdBy: documentData.createdBy || 'Admin'
  };
  
  documents.push(newDocument);
  localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(documents));
  return newDocument;
};

/**
 * Cập nhật tài liệu
 */
export const updateDocument = (id, documentData) => {
  const documents = getDocuments();
  const index = documents.findIndex(doc => doc.id === parseInt(id));
  
  if (index === -1) {
    throw new Error('Document not found');
  }
  
  documents[index] = {
    ...documents[index],
    ...documentData,
    id: parseInt(id)
  };
  
  localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(documents));
  return documents[index];
};

/**
 * Xóa tài liệu
 */
export const deleteDocument = (id) => {
  const documents = getDocuments();
  const filtered = documents.filter(doc => doc.id !== parseInt(id));
  localStorage.setItem(STORAGE_KEY_DOCUMENTS, JSON.stringify(filtered));
  return true;
};

/**
 * Lấy danh sách danh mục sản phẩm
 */
export const getProductCategories = async () => {
  try {
    // Kiểm tra localStorage trước
    const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Nếu chưa có, load từ file JSON
    const response = await fetch('/productCategories.json');
    const categories = await response.json();
    
    // Lưu vào localStorage
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    // Fallback: trả về danh sách mặc định
    return [
      { id: 1, name: "Máy móc thiết bị" },
      { id: 2, name: "Nguyên vật liệu" },
      { id: 3, name: "Hàng hóa tiêu dùng" },
      { id: 4, name: "Dịch vụ" }
    ];
  }
};

/**
 * Lọc tài liệu theo điều kiện
 */
export const filterDocuments = (filters) => {
  const documents = getDocuments();
  let filtered = [...documents];
  
  // Lọc theo documentType
  if (filters.documentType && filters.documentType !== 'all') {
    filtered = filtered.filter(doc => doc.documentType === filters.documentType);
  }
  
  // Lọc theo productCategory
  if (filters.productCategoryId && filters.productCategoryId !== 'all') {
    filtered = filtered.filter(doc => 
      doc.productCategory && doc.productCategory.id === parseInt(filters.productCategoryId)
    );
  }
  
  // Tìm kiếm theo title
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm))
    );
  }
  
  return filtered;
};

