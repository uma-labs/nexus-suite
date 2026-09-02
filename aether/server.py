#!/usr/bin/env python3
"""AETHER static file server — port 8790."""
import http.server
import socketserver
import os

PORT = 8790
ROOT = os.path.dirname(os.path.abspath(__file__))

os.chdir(ROOT)
Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"AETHER v1.0 serving {ROOT} at http://127.0.0.1:{PORT}/")
    httpd.serve_forever()
