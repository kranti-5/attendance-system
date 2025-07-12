#!/usr/bin/env python3
"""
Startup script for the Face Recognition Attendance Backend
"""

import os
import sys

def check_dependencies():
    """Check if required Python packages are installed"""
    package_imports = {
        'flask': 'flask',
        'flask_cors': 'flask_cors',
        'face_recognition': 'face_recognition',
        'opencv-python': 'cv2',
        'numpy': 'numpy',
        'werkzeug': 'werkzeug',
        'pillow': 'PIL'
    }

    missing_packages = []

    for package, module_name in package_imports.items():
        try:
            __import__(module_name)
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print("Missing required packages:")
        for package in missing_packages:
            print(f"  - {package}")
        print("\nInstall missing packages with:")
        print("pip install -r requirements.txt")
        return False

    return True

def create_directories():
    """Create necessary directories"""
    directories = ['uploads']

    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"Created directory: {directory}")

def main():
    print("Face Recognition Attendance Backend")
    print("=" * 40)

    # Check dependencies
    print("Checking dependencies...")
    if not check_dependencies():
        sys.exit(1)

    # Create directories
    print("Setting up directories...")
    create_directories()

    # Start the Flask server
    print("Starting Flask server...")
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print("-" * 40)

    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
