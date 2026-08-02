#!/usr/bin/env python3
"""
Simple HTTP server for the portfolio with cache control headers.
Serves static files on port 5000 for Replit deployment.
"""
import http.server
import os
import socketserver
import sys
from functools import partial

# Network constants
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"
PORT_MIN = 1
PORT_MAX = 65535


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with cache control and basic security headers."""

    def end_headers(self):
        # Prevent clients and proxies from caching static assets
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Mitigate MIME-type sniffing and clickjacking for static content
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        super().end_headers()

    def _is_safe_path(self, path):
        """
        Validate that the resolved filesystem path stays inside the
        served directory, guarding against traversal via symlinks.
        """
        root = os.path.realpath(self.directory)
        resolved = os.path.realpath(super().translate_path(path))
        return os.path.commonpath([root, resolved]) == root

    def do_GET(self):
        # Reject directory traversal attempts before serving any file
        if not self._is_safe_path(self.path):
            self.send_error(403, "Forbidden")
            return
        super().do_GET()

    def do_HEAD(self):
        # Apply the same traversal check for HEAD requests
        if not self._is_safe_path(self.path):
            self.send_error(403, "Forbidden")
            return
        super().do_HEAD()

    def log_message(self, format, *args):
        # Sanitize request-derived values to avoid log injection
        safe_args = []
        for arg in args:
            text = str(arg)
            text = text.encode("ascii", "ignore").decode("ascii")
            text = text.replace("\r", "").replace("\n", "")
            safe_args.append(text)
        http.server.SimpleHTTPRequestHandler.log_message(self, format, *safe_args)


class ReusableTCPServer(socketserver.TCP):
    pass
#!/usr/bin/env python3
"""
Simple HTTP server for the portfolio with cache control headers.
Serves static files on port 5000 for Replit deployment.
"""
import http.server
import os
import socketserver
import sys
from functools import partial

# Network constants
DEFAULT_PORT = 5000
DEFAULT_HOST = "0.0.0.0"
PORT_MIN = 1
PORT_MAX = 65535


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with cache control and basic security headers."""

    def end_headers(self):
        # Prevent clients and proxies from caching static assets
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # Mitigate MIME-type sniffing and clickjacking for static content
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        super().end_headers()

    def _is_safe_path(self, path):
        """
        Validate that the resolved filesystem path stays inside the
        served directory, guarding against traversal via symlinks.
        """
        root = os.path.realpath(self.directory)
        resolved = os.path.realpath(super().translate_path(path))
        return os.path.commonpath([root, resolved]) == root

    def do_GET(self):
        # Reject directory traversal attempts before serving any file
        if not self._is_safe_path(self.path):
            self.send_error(403, "Forbidden")
            return
        super().do_GET()

    def do_HEAD(self):
        # Apply the same traversal check for HEAD requests
        if not self._is_safe_path(self.path):
            self.send_error(403, "Forbidden")
            return
        super().do_HEAD()

    def log_message(self, format, *args):
        # Sanitize request-derived values to avoid log injection
        safe_args = []
        for arg in args:
            text = str(arg)
            text = text.encode("ascii", "ignore").decode("ascii")
            text = text.replace("\r", "").replace("\n", "")
            safe_args.append(text)
        http.server.SimpleHTTPRequestHandler.log_message(self, format, *safe_args)


class ReusableTCPServer(socketserver.TCPServer):
    """TCP server that allows address reuse."""
    allow_reuse_address = True


def _validate_port(value):
    """
    Coerce and validate a user-supplied port number.

    Raises:
        ValueError: If the value is not an integer or is outside the valid range.
    """
    try:
        port = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Port must be an integer, got {value!r}") from exc

    if not (PORT_MIN <= port <= PORT_MAX):
        raise ValueError(f"Port must be between {PORT_MIN} and {PORT_MAX}, got {port}")

    return port


def run_server(port=DEFAULT_PORT):
    """
    Start the HTTP server on the specified port.

    Files are served from the current working directory, and the port is
    validated before the server socket is created.
    """
    port = _validate_port(port)
    root_dir = os.path.abspath(os.getcwd())

    # Bind the handler to a fixed, absolute root directory
    handler_class = partial(NoCacheHTTPRequestHandler, directory=root_dir)

    with ReusableTCPServer((DEFAULT_HOST, port), handler_class) as httpd:
        print(f"Server running at http://{DEFAULT_HOST}:{port}/")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            # Graceful shutdown on Ctrl+C
            print("\nServer stopped.")


if __name__ == "__main__":
    # Allow Replit-style PORT environment variable with a safe fallback
    port = os.environ.get("PORT", DEFAULT_PORT)
    try:
        run_server(port)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)