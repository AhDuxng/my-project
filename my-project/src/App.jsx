import { useState } from 'react';
// import './App.css'; // Đã comment lại dòng này để tránh lỗi nếu file không tồn tại

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Xử lý khi người dùng chọn file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setJsonData(null);
      // Tạo url ảnh ảo để xem trước
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // Hàm gửi ảnh sang Python Backend
  const uploadImageToBackend = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn một file ảnh trước!");
      return;
    }

    setLoading(true);
    setError(null);
    setJsonData(null);

    try {
      // 1. Tạo FormData (giống như form HTML truyền thống)
      const formData = new FormData();
      // 'file' ở đây phải trùng tên với tham số trong server.py: file: UploadFile
      formData.append("file", selectedFile); 

      // 2. Gọi API sang Python (Port 8000)
      const response = await fetch("http://localhost:8000/analyze-invoice", {
        method: "POST",
        body: formData,
        // Lưu ý: Khi gửi FormData, KHÔNG cần set Content-Type header thủ công
      });

      if (!response.ok) {
        // Nếu server trả về lỗi (4xx, 5xx)
        const errorData = await response.json();
        throw new Error(errorData.detail || "Lỗi kết nối Server");
      }

      // 3. Nhận kết quả JSON
      const result = await response.json();
      setJsonData(result);

    } catch (err) {
      console.error("Lỗi:", err);
      setError(err.message || "Không thể kết nối tới Backend Python.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>🧾 Phân tích Hóa đơn AI</h1>
      <p style={{ textAlign: "center", color: "#666" }}>React (Vite) + Python (FastAPI) + Gemini</p>

      {/* Khu vực Upload */}
      <div style={{ 
        border: "2px dashed #ccc", 
        borderRadius: "10px", 
        padding: "30px", 
        textAlign: "center",
        backgroundColor: "#f9f9f9",
        marginBottom: "20px"
      }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: "none" }} 
          id="file-upload"
        />
        <label htmlFor="file-upload" style={{
          backgroundColor: "#007bff",
          color: "white",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px"
        }}>
          📁 Chọn ảnh hóa đơn
        </label>
        
        {selectedFile && <p style={{ marginTop: "10px" }}>Đã chọn: <strong>{selectedFile.name}</strong></p>}

        {previewUrl && (
          <div style={{ marginTop: "20px" }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }} 
            />
          </div>
        )}
      </div>

      {/* Nút Submit */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <button 
          onClick={uploadImageToBackend} 
          disabled={loading || !selectedFile}
          style={{
            padding: "12px 30px",
            fontSize: "18px",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s"
          }}
        >
          {loading ? "⏳ Đang xử lý..." : "🚀 Phân tích ngay"}
        </button>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div style={{ 
          backgroundColor: "#ffebee", 
          color: "#c62828", 
          padding: "15px", 
          borderRadius: "5px", 
          marginBottom: "20px",
          border: "1px solid #ef9a9a"
        }}>
          <strong>❌ Lỗi:</strong> {error}
          <br/>
          <small>Gợi ý: Hãy chắc chắn bạn đã chạy lệnh "npm run start" để bật cả Python server.</small>
        </div>
      )}

      {/* Kết quả JSON */}
      {jsonData && (
        <div style={{ animation: "fadeIn 0.5s" }}>
          <h3>✅ Kết quả phân tích:</h3>
          <div style={{ 
            backgroundColor: "#2d2d2d", 
            color: "#f8f8f2", 
            padding: "20px", 
            borderRadius: "8px", 
            overflowX: "auto",
            textAlign: "left"
          }}>
            <pre style={{ margin: 0, fontFamily: "Consolas, monospace" }}>
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;