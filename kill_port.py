"""
Script helper để kill process đang sử dụng port 8000
Sử dụng: python kill_port.py [port]
"""
import sys
import subprocess
import re

def kill_port(port=8000):
    """Tìm và kill process đang sử dụng port"""
    try:
        # Tìm process đang dùng port
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True,
            text=True,
            shell=True
        )
        
        # Tìm PID từ output
        pattern = rf"TCP\s+.*:{port}\s+.*LISTENING\s+(\d+)"
        match = re.search(pattern, result.stdout)
        
        if match:
            pid = match.group(1)
            print(f"🔍 Tìm thấy process PID {pid} đang sử dụng port {port}")
            
            # Kill process
            kill_result = subprocess.run(
                ["taskkill", "/PID", pid, "/F"],
                capture_output=True,
                text=True,
                shell=True
            )
            
            if kill_result.returncode == 0:
                print(f"✅ Đã kill process {pid} thành công!")
                return True
            else:
                print(f"❌ Không thể kill process: {kill_result.stderr}")
                return False
        else:
            print(f"ℹ️  Không tìm thấy process nào đang sử dụng port {port}")
            return True
            
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        return False

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    kill_port(port)

