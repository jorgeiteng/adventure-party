#!/usr/bin/env python3

import http.server
import os
import socket
import sys

PORT = 8080
REPO_DIR = os.path.dirname(os.path.abspath(__file__))


class AdventurePartyServer(http.server.HTTPServer):
    allow_reuse_address = True


class AdventurePartyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=REPO_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"  {args[0]}")


def main():
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port: {sys.argv[1]}")
            sys.exit(1)

    host = "0.0.0.0"
    with AdventurePartyServer((host, port), AdventurePartyHandler) as httpd:
        public_ip = socket.gethostbyname(socket.gethostname())
        print("=================================================")
        print("  Adventure Party Local Server Running!")
        print(f"  Local:  http://localhost:{port}")
        print(f"  Public: http://{public_ip}:{port}")
        print("=================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
