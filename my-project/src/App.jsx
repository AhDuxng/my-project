import { useState, useEffect } from 'react';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Dọn dẹp URL ảnh preview khi component unmount hoặc file thay đổi
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setJsonData(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const uploadImageToBackend = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn một file ảnh trước!");
      return;
    }

    setLoading(true);
    setError(null);
    setJsonData(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile); 

      // Gọi API sang Python Backend
      const response = await fetch("http://localhost:8000/analyze-invoice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Lỗi kết nối Server");
      }

      const result = await response.json();
      setJsonData(result);

    } catch (err) {
      console.error("Lỗi:", err);
      setError(err.message || "Không thể kết nối tới Backend Python. Hãy kiểm tra server đã chạy chưa.");
    } finally {
      setLoading(false);
    }
  };

  const downLoadJson = () => {
    if (!jsonData) return;

    const jsonString = JSON.stringify (jsonData, null, 2);
    const blob = new Blob([jsonString], {type: "application/json"}); //đóng gói
    const url =  URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = selectedFile ? `ket_qua_${selectedFile.name}.json` : "data.json";
    document.body.appendChild(link); // đảm bảo chạy trên mọi trình duyệt
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif", color: "#333", boxSizing: "border-box", width: "100%"}}>
      <h1 style={{ textAlign: "center", color: "#2c3e50" }}>Chuyển dữ liệu ảnh hóa đơn sang Json</h1>

      {/* Khu vực Upload */}
      <div style={{ 
        border: "2px dashed #3498db", 
        borderRadius: "10px", 
        padding: "40px", 
        textAlign: "center",
        backgroundColor: "#ecf0f1",
        marginBottom: "20px",
        transition: "all 0.3s ease"
      }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: "none" }} 
          id="file-upload"
        />
        <label htmlFor="file-upload" style={{
          backgroundColor: "#3498db",
          color: "white",
          padding: "12px 24px",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          display: "inline-block"
        }}>
          Chọn ảnh hóa đơn
        </label>
        
        {selectedFile && <p style={{ marginTop: "15px", color: "#2980b9" }}>Đã chọn: <strong>{selectedFile.name}</strong></p>}

        {previewUrl && (
          <div style={{ marginTop: "20px" }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }} 
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
            padding: "14px 40px",
            fontSize: "18px",
            backgroundColor: loading ? "#95a5a6" : "#27ae60",
            color: "white",
            border: "none",
            marginTop: "10px",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          {loading ? " Đang xử lý..." : " Phân tích ngay"}
        </button>
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          color: "#c0392b", 
          padding: "15px", 
          borderRadius: "6px", 
          marginBottom: "20px",
          border: "1px solid #e74c3c"
        }}>
          <strong>❌ Lỗi:</strong> {error}
        </div>
      )}

      {/* Kết quả JSON */}
      {jsonData && (
        <div style={{ animation: "fadeIn 0.5s" }}>
          <h3 style={{color: "#27ae60"}}>Kết quả phân tích:</h3>
          <div style={{ 
            backgroundColor: "#2c3e50", 
            color: "#ecf0f1", 
            padding: "20px", 
            borderRadius: "8px", 
            overflowX: "auto",
            fontSize: "14px",
            lineHeight: "1.5"
          }}>
            <pre style={{ margin: 0, fontFamily: "Consolas, monospace" }}>
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Nút Tải JSON */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button onClick={downLoadJson} 
        style={{
          marginTop: "10px", 
          backgroundColor: "#2980b9", 
          color: "white", 
          padding: "10px 20px", 
          border: "none", 
          cursor: "pointer", 
          borderRadius: "6px",
          textAlign: "center",
          fontWeight: "bold"
          }}
          >
          Tải kết quả JSON
        </button>
      </div>
    </div>
  );
}

export default App;