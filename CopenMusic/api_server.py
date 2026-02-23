#!/usr/bin/env python3
"""
Simple API server to serve concert data via HTTP endpoint
Run with: python3 api_server.py
"""

import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import socket

class ConcertAPIHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/concerts':
            self.send_response(200, 'application/json', self.get_concerts_data())
        elif parsed_path.path == '/health':
            self.send_response(200, 'text/plain', 'OK')
        else:
            self.send_response(404, 'text/plain', 'Not Found')
    
    def send_response(self, status_code, content_type, content):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.end_headers()
        self.wfile.write(content.encode('utf-8'))
    
    def get_concerts_data(self):
        try:
            with open('output/concerts.json', 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            return json.dumps({"error": "Concert data not found"})
        except Exception as e:
            return json.dumps({"error": str(e)})

def main():
    port = 3001
    
    # Try to find an available port
    while port <= 3010:
        try:
            server = HTTPServer(('localhost', port), ConcertAPIHandler)
            print(f"🚀 CopenMusic API Server running on http://localhost:{port}")
            print(f"📊 Concerts endpoint: http://localhost:{port}/concerts")
            print(f"❤️  Health check: http://localhost:{port}/health")
            print("Press Ctrl+C to stop the server")
            server.serve_forever()
        except socket.error:
            port += 1
    
    print("❌ No available ports found")

if __name__ == '__main__':
    main()
