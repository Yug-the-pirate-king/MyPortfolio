#!/usr/bin/env python3
"""
Simple HTTP server for the portfolio with cache control headers.
Serves static files on port 5000 for Replit deployment.
"""
import http.server
import socketserver
from functools import partial

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with cache control headers."""
    
    def end_headers(self):
        # Add cache control headers to prevent caching
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

class ReusableTCPServer(socketserver.TCPServer):
    """TCP server that allows address reuse."""
    allow_reuse_address = True

def run_server(port=5000):
    """Start the HTTP server on the specified port."""
    handler = NoCacheHTTPRequestHandler
    
    with ReusableTCPServer(("0.0.0.0", port), handler) as httpd:
        print(f"Server running at http://0.0.0.0:{port}/")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
