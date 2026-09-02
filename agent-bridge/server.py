#!/usr/bin/env python3
"""Serve AGENT BRIDGE static dashboard on 0.0.0.0:8791."""
from __future__ import annotations

import http.server
import os
import socketserver
import sys

PORT = 8791
HOST = "0.0.0.0"
ROOT = os.path.dirname(os.path.abspath(__file__))


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main() -> None:
    os.chdir(ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), QuietHandler) as httpd:
        print(f"AGENT BRIDGE serving {ROOT} at http://{HOST}:{PORT}/", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.", flush=True)


if __name__ == "__main__":
    main()
