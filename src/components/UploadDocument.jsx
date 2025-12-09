/**
 * UploadDocument Component
 * Upload ảnh chứng từ và xử lý OCR
 */
import { useState } from 'react';
import { imageToBase64, processOCR } from '../services/ocrApi';

const UploadDocument = ({ onOcrComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setError('Chỉ chấp nhận file ảnh JPG hoặc PNG');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    setError('');
    setSelectedFile(file);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Convert to base64
    setUploading(true);
    try {
      const base64 = await imageToBase64(file);
      setBase64Image(base64);
    } catch (err) {
      setError('Lỗi khi đọc file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleProcessOCR = async () => {
    if (!base64Image) {
      setError('Vui lòng upload ảnh trước');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const ocrResult = await processOCR(base64Image);
      onOcrComplete(ocrResult);
    } catch (err) {
      setError('Lỗi khi xử lý OCR: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setBase64Image(null);
    setError('');
    // Reset file input
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Ảnh Chứng Từ</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Upload Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn ảnh chứng từ (JPG, PNG)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading || processing}
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${uploading || processing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600">
                {uploading ? 'Đang xử lý...' : 'Click để chọn ảnh hoặc kéo thả vào đây'}
              </p>
              <p className="text-xs text-gray-500">JPG, PNG (tối đa 10MB)</p>
            </div>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 text-sm text-gray-600">
            <p>📄 File: <strong>{selectedFile.name}</strong></p>
            <p>📊 Kích thước: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Preview Ảnh</h3>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto max-h-96 mx-auto rounded"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <button
          onClick={handleProcessOCR}
          disabled={!base64Image || processing || uploading}
          className={`flex-1 px-6 py-3 rounded-md font-semibold transition-colors ${
            !base64Image || processing || uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý OCR...
            </span>
          ) : (
            '🔍 Xử lý OCR'
          )}
        </button>

        {selectedFile && (
          <button
            onClick={handleReset}
            disabled={processing}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-400 disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress indicator */}
      {processing && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">Đang phân tích ảnh bằng OCR...</p>
        </div>
      )}
    </div>
  );
};

export default UploadDocument;

