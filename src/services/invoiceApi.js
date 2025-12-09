/**
 * Invoice API Service
 * Quản lý chứng từ (invoices) từ OCR
 */

const STORAGE_KEY_INVOICES = 'accounting_invoices';

/**
 * Lấy danh sách tất cả chứng từ
 */
export const getInvoices = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_INVOICES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
};

/**
 * Lấy một chứng từ theo ID
 */
export const getInvoiceById = (id) => {
  const invoices = getInvoices();
  return invoices.find(inv => inv.id === parseInt(id));
};

/**
 * Tạo chứng từ mới
 */
export const createInvoice = (invoiceData) => {
  const invoices = getInvoices();
  const newInvoice = {
    ...invoiceData,
    id: invoices.length > 0 ? Math.max(...invoices.map(inv => inv.id)) + 1 : 1,
    createdAt: new Date().toISOString()
  };
  
  invoices.push(newInvoice);
  localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  return newInvoice;
};

/**
 * Cập nhật chứng từ
 */
export const updateInvoice = (id, invoiceData) => {
  const invoices = getInvoices();
  const index = invoices.findIndex(inv => inv.id === parseInt(id));
  
  if (index === -1) {
    throw new Error('Invoice not found');
  }
  
  invoices[index] = {
    ...invoices[index],
    ...invoiceData,
    id: parseInt(id),
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  return invoices[index];
};

/**
 * Xóa chứng từ
 */
export const deleteInvoice = (id) => {
  const invoices = getInvoices();
  const filtered = invoices.filter(inv => inv.id !== parseInt(id));
  localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(filtered));
  return true;
};

/**
 * Chuyển đổi JSON OCR thành SQL queries
 */
export const convertToSQL = (invoiceData) => {
  const { invoiceNumber, supplierName, date, totalAmount, vatAmount, productCategory, lineItems } = invoiceData;
  const categoryId = productCategory?.id || 1;

  // SQL cho bảng invoices
  const invoiceSQL = `INSERT INTO invoices (invoice_number, supplier_name, date, total_amount, vat_amount, product_category_id, created_at)
VALUES ('${invoiceNumber}', '${supplierName}', '${date}', ${totalAmount}, ${vatAmount}, ${categoryId}, NOW());`;

  // SQL cho bảng invoice_items
  const itemsSQL = lineItems.map((item, index) => {
    return `INSERT INTO invoice_items (invoice_id, product_name, quantity, unit_price, total)
VALUES (LAST_INSERT_ID()${index > 0 ? ` + ${index}` : ''}, '${item.productName}', ${item.quantity}, ${item.unitPrice}, ${item.total});`;
  }).join('\n\n');

  return {
    invoiceSQL,
    itemsSQL,
    fullSQL: invoiceSQL + '\n\n' + itemsSQL
  };
};

