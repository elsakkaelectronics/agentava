import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os

class TTSHandler(BaseHTTPRequestHandler):
    # This handles the browser's security preflight check
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        text = data.get('text', '').replace('"', '\\"')

        # Path to your piper setup
        piper_exe = r"C:\piper\piper.exe"
        model_file = r"C:\piper\en_GB-jenny_dioco-medium.onnx"
        out_file = r"C:\piper\out.wav"

        # Run Piper
        cmd = f'echo "{text}" | "{piper_exe}" --model "{model_file}" --output_file "{out_file}"'
        
        # Execute silently
        subprocess.run(cmd, shell=True, creationflags=subprocess.CREATE_NO_WINDOW)

        # Send audio back to browser
        self.send_response(200)
        self.send_header('Content-Type', 'audio/wav')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            with open(out_file, 'rb') as f:
                self.wfile.write(f.read())
        except Exception as e:
            print("Error reading wav file:", e)

if __name__ == '__main__':
    print("Piper TTS Bridge running on http://127.0.0.1:5000")
    HTTPServer(('127.0.0.1', 5000), TTSHandler).serve_forever()