"""
Single-command launcher for the Trimodal Emotion Recognition AI Web Application.
Starts the FastAPI backend and serves the compiled React production frontend.

Usage:
  python run_app.py
"""

import os
import sys
import subprocess
import webbrowser
import time

def ensure_frontend_built():
    dist_index = os.path.join("frontend", "dist", "index.html")
    if not os.path.exists(dist_index):
        print("[run_app] Frontend build not found. Building React frontend now...")
        try:
            subprocess.run(["npm", "run", "build"], cwd="frontend", check=True, shell=True)
            print("[run_app] Frontend built successfully.")
        except Exception as e:
            print(f"[run_app] Warning: Frontend build failed ({e}). Proceeding anyway.")

def main():
    print("\n" + "=" * 70)
    print("      TRIMODAL EMOTION RECOGNITION AI — FULL-STACK WEB APP")
    print("=" * 70)

    ensure_frontend_built()

    import uvicorn

    host = "127.0.0.1"
    port = 8000
    url = f"http://{host}:{port}"

    print(f"\n[run_app] Launching unified server at {url} ...")
    print(f"[run_app] - Frontend Web App UI : {url}")
    print(f"[run_app] - OpenAPI Documentation : {url}/docs")
    print(f"[run_app] - Backend Health Check  : {url}/api/health\n")
    print("[run_app] Press CTRL+C to terminate.\n")

    # Launch browser after a short pause
    try:
        webbrowser.open(url)
    except Exception:
        pass

    uvicorn.run("backend.app:app", host=host, port=port, reload=False)

if __name__ == "__main__":
    main()
