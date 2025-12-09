/**
 * OcrProcessPage
 * Trang xử lý OCR hoàn chỉnh: Upload → OCR → JSON → SQL → Database
 */
import { useState } from 'react';
import UploadDocument from '../components/UploadDocument';
import OcrResult from '../components/OcrResult';
import SqlPreview from '../components/SqlPreview';
import SaveToDatabase from '../components/SaveToDatabase';

const OcrProcessPage = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: OCR Result, 3: SQL Preview, 4: Save
  const [ocrData, setOcrData] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  const handleOcrComplete = (data) => {
    setOcrData(data);
    setProcessedData(data);
    setStep(2);
  };

  const handleDataChange = (data) => {
    setProcessedData(data);
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setOcrData(null);
    setProcessedData(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Xử lý OCR Chứng Từ</h2>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                <div className="mt-2 text-xs text-center">
                  {s === 1 && 'Upload Ảnh'}
                  {s === 2 && 'Kết quả OCR'}
                  {s === 3 && 'Xem SQL'}
                  {s === 4 && 'Lưu Database'}
                </div>
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <UploadDocument onOcrComplete={handleOcrComplete} />
        </div>
      )}

      {/* Step 2: OCR Result */}
      {step === 2 && processedData && (
        <div className="space-y-6">
          <OcrResult ocrData={processedData} onDataChange={handleDataChange} />
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Bắt đầu lại
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tiếp theo: Xem SQL →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: SQL Preview */}
      {step === 3 && processedData && (
        <div className="space-y-6">
          <SqlPreview invoiceData={processedData} />
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tiếp theo: Lưu Database →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Save to Database */}
      {step === 4 && processedData && (
        <div className="space-y-6">
          <SaveToDatabase invoiceData={processedData} />
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Tạo chứng từ mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrProcessPage;

