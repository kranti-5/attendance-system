from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import json
from datetime import datetime
import base64
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
EMPLOYEES_FILE = 'employees.json'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_employees():
    if os.path.exists(EMPLOYEES_FILE):
        with open(EMPLOYEES_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_employees(employees):
    with open(EMPLOYEES_FILE, 'w') as f:
        json.dump(employees, f, indent=2)

def encode_face(image_path):
    """Encode face from image path using OpenCV"""
    try:
        print(f'Loading image from: {image_path}')
        print(f'File exists: {os.path.exists(image_path)}')
        if os.path.exists(image_path):
            print(f'File size: {os.path.getsize(image_path)} bytes')
        
        # Load image with OpenCV
        image = cv2.imread(image_path)
        if image is None:
            print('Failed to load image with OpenCV')
            return None
            
        print(f'Image shape: {image.shape}, dtype: {image.dtype}')
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Load face cascade classifier
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        print(f'Faces detected: {len(faces)}')
        
        if len(faces) == 0:
            print('No faces detected in image')
            return None
        
        # For each detected face, create a simple encoding
        # This is a simplified approach - in production you'd want a proper face recognition library
        face_encodings = []
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Resize to standard size
            face_roi = cv2.resize(face_roi, (128, 128))
            
            # Create a simple encoding (flatten and normalize)
            encoding = face_roi.flatten().astype(np.float32) / 255.0
            
            # Pad or truncate to 128 dimensions
            if len(encoding) < 128:
                encoding = np.pad(encoding, (0, 128 - len(encoding)), 'constant')
            else:
                encoding = encoding[:128]
            
            face_encodings.append(encoding)
        
        if face_encodings:
            print(f'Successfully encoded {len(face_encodings)} face(s)')
            return face_encodings[0]  # Return first face encoding
        return None
        
    except Exception as e:
        print(f"Error encoding face: {e}")
        import traceback
        traceback.print_exc()
        return None

def compare_faces(encoding1, encoding2, tolerance=0.6):
    """Compare two face encodings using Euclidean distance"""
    if encoding1 is None or encoding2 is None:
        return False
    
    # Calculate Euclidean distance
    distance = np.linalg.norm(encoding1 - encoding2)
    print(f'Face distance: {distance}')
    
    return distance < tolerance

def encode_face_from_base64(base64_string):
    """Encode face from base64 string"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            print('Failed to decode image from base64')
            return None
            
        print(f'Base64 image shape: {image.shape}, dtype: {image.dtype}')
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Load face cascade classifier
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        print(f'Faces detected in base64 image: {len(faces)}')
        
        if len(faces) == 0:
            print('No faces detected in base64 image')
            return None
        
        # For each detected face, create a simple encoding
        face_encodings = []
        for (x, y, w, h) in faces:
            # Extract face region
            face_roi = gray[y:y+h, x:x+w]
            
            # Resize to standard size
            face_roi = cv2.resize(face_roi, (128, 128))
            
            # Create a simple encoding (flatten and normalize)
            encoding = face_roi.flatten().astype(np.float32) / 255.0
            
            # Pad or truncate to 128 dimensions
            if len(encoding) < 128:
                encoding = np.pad(encoding, (0, 128 - len(encoding)), 'constant')
            else:
                encoding = encoding[:128]
            
            face_encodings.append(encoding)
        
        if face_encodings:
            print(f'Successfully encoded {len(face_encodings)} face(s) from base64')
            return face_encodings[0]  # Return first face encoding
        return None
        
    except Exception as e:
        print(f"Error encoding face from base64: {e}")
        import traceback
        traceback.print_exc()
        return None

def process_multiple_photos(files):
    """Process multiple photos and return the best face encoding"""
    encodings = []
    saved_files = []
    
    try:
        # Process each photo
        for i in range(1, 10):  # Check for photo1, photo2, etc.
            photo_key = f'photo{i}'
            if photo_key not in files:
                break
                
            file = files[photo_key]
            if file.filename == '':
                continue
                
            if not allowed_file(file.filename):
                print(f'Invalid file type for {photo_key}: {file.filename}')
                continue
                
            # Save the file temporarily
            filename = secure_filename(f"temp_{i}_{file.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            saved_files.append(filepath)
            
            print(f'Processing {photo_key}: {filepath}')
            print(f'File saved successfully, size: {os.path.getsize(filepath)} bytes')
            print(f'File content type: {file.content_type}')
            print(f'File headers: {dict(file.headers)}')
            
            # Try to encode face
            encoding = encode_face(filepath)
            if encoding is not None:
                encodings.append(encoding)
                print(f'Successfully encoded face from {photo_key}')
            else:
                print(f'No face detected in {photo_key}')
        
        # If we have multiple encodings, average them for better accuracy
        if len(encodings) > 1:
            print(f'Averaging {len(encodings)} face encodings')
            avg_encoding = np.mean(encodings, axis=0)
            return avg_encoding
        elif len(encodings) == 1:
            print('Using single face encoding')
            return encodings[0]
        else:
            print('No valid face encodings found in any photo')
            return None
            
    except Exception as e:
        print(f'Error processing multiple photos: {e}')
        return None
    finally:
        # Clean up temporary files
        for filepath in saved_files:
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as e:
                print(f'Error cleaning up {filepath}: {e}')

@app.route('/register', methods=['POST'])
def register_employee():
    try:
        print('--- /register endpoint hit ---')
        print('Form data:', request.form)
        print('Files:', list(request.files.keys()))
        for key in request.files:
            file = request.files[key]
            print(f'File {key}: filename={file.filename}, content_type={file.content_type}')
        
        name = request.form.get('name', '')
        employee_id = request.form.get('employee_id', '')
        
        print('Received name:', name)
        print('Received employee_id:', employee_id)
        
        if not name or not employee_id:
            print('Name and Employee ID are required')
            return jsonify({'error': 'Name and Employee ID are required'}), 400
        
        # Process multiple photos
        face_encoding = process_multiple_photos(request.files)
        
        if face_encoding is None:
            print('No face detected in any of the provided photos')
            return jsonify({'error': 'No face detected in any of the provided photos. Please ensure clear, front-facing photos are taken.'}), 400
        
        # Load existing employees
        employees = load_employees()
        
        # Check if employee already exists
        if employee_id in employees:
            print('Employee ID already exists:', employee_id)
            return jsonify({'error': 'Employee ID already exists'}), 400
        
        # Save the best photo (first one that had a face)
        best_photo_path = None
        for i in range(1, 10):
            photo_key = f'photo{i}'
            if photo_key in request.files:
                file = request.files[photo_key]
                if file.filename != '':
                    filename = secure_filename(f"{employee_id}_{name}.jpg")
                    best_photo_path = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(best_photo_path)
                    break
        
        # Store employee data
        employees[employee_id] = {
            'name': name,
            'employee_id': employee_id,
            'photo_path': best_photo_path,
            'face_encoding': face_encoding.tolist(),
            'registered_at': datetime.now().isoformat()
        }
        
        save_employees(employees)
        print('Employee registered successfully:', employee_id)
        
        return jsonify({
            'success': True,
            'message': 'Employee registered successfully',
            'employee': {
                'name': name,
                'employee_id': employee_id
            }
        }), 200
        
    except Exception as e:
        print(f"Error registering employee: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/attendance', methods=['POST'])
def mark_attendance():
    try:
        print('--- /attendance endpoint hit ---')
        print('Form data:', request.form)
        print('Files:', list(request.files.keys()))
        for key in request.files:
            file = request.files[key]
            print(f'File {key}: filename={file.filename}, content_type={file.content_type}')

        # Multi-photo support (like /register)
        encodings = []
        saved_files = []
        for i in range(1, 10):
            photo_key = f'photo{i}'
            if photo_key not in request.files:
                break
            file = request.files[photo_key]
            if file.filename == '':
                continue
            if not allowed_file(file.filename):
                print(f'Invalid file type for {photo_key}: {file.filename}')
                continue
            filename = secure_filename(f"attendance_{i}_{file.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            saved_files.append(filepath)
            print(f'Processing {photo_key}: {filepath}')
            print(f'File saved successfully, size: {os.path.getsize(filepath)} bytes')
            print(f'File content type: {file.content_type}')
            print(f'File headers: {dict(file.headers)}')
            encoding = encode_face(filepath)
            if encoding is not None:
                encodings.append(encoding)
                print(f'Successfully encoded face from {photo_key}')
            else:
                print(f'No face detected in {photo_key}')
        # Clean up temp files
        for filepath in saved_files:
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as e:
                print(f'Error cleaning up {filepath}: {e}')
        if len(encodings) > 1:
            print(f'Averaging {len(encodings)} face encodings')
            attendance_encoding = np.mean(encodings, axis=0)
        elif len(encodings) == 1:
            print('Using single face encoding')
            attendance_encoding = encodings[0]
        else:
            print('No valid face encodings found in any photo')
            return jsonify({'error': 'No face detected in any of the provided photos. Please ensure clear, front-facing photos are taken.'}), 400
        # Load employees
        employees = load_employees()
        if not employees:
            return jsonify({'error': 'No employees registered in the system'}), 400
        # Compare with registered employees
        best_match = None
        best_distance = float('inf')
        tolerance = 0.6
        print(f'Comparing with {len(employees)} registered employees')
        for employee_id, employee_data in employees.items():
            try:
                stored_encoding = np.array(employee_data['face_encoding'])
                distance = np.linalg.norm(attendance_encoding - stored_encoding)
                print(f'Distance to {employee_data["name"]}: {distance}')
                if distance < tolerance and distance < best_distance:
                    best_distance = distance
                    best_match = employee_data
            except Exception as e:
                print(f"Error comparing with employee {employee_id}: {e}")
                continue
        if best_match:
            attendance_record = {
                'employee_id': best_match['employee_id'],
                'name': best_match['name'],
                'timestamp': datetime.now().isoformat(),
                'confidence': 1 - best_distance
            }
            attendance_file = f"attendance_{datetime.now().strftime('%Y%m%d')}.json"
            attendance_path = os.path.join(UPLOAD_FOLDER, attendance_file)
            attendance_records = []
            if os.path.exists(attendance_path):
                with open(attendance_path, 'r') as f:
                    attendance_records = json.load(f)
            attendance_records.append(attendance_record)
            with open(attendance_path, 'w') as f:
                json.dump(attendance_records, f, indent=2)
            print(f'Attendance marked for {best_match["name"]} with confidence {1 - best_distance:.2f}')
            return jsonify({
                'success': True,
                'message': f'Attendance marked for {best_match["name"]}',
                'employee': {
                    'name': best_match['name'],
                    'employee_id': best_match['employee_id'],
                    'confidence': 1 - best_distance
                }
            }), 200
        else:
            print('No matching employee found')
            return jsonify({'error': 'No matching employee found. Please ensure you are registered and use a clear, front-facing photo.'}), 400
    except Exception as e:
        print(f"Error marking attendance: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/employees', methods=['GET'])
def get_employees():
    try:
        employees = load_employees()
        employee_list = []
        for employee_id, employee_data in employees.items():
            employee_list.append({
                'employee_id': employee_id,
                'name': employee_data['name'],
                'registered_at': employee_data['registered_at']
            })
        return jsonify({'employees': employee_list}), 200
    except Exception as e:
        print(f"Error getting employees: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/attendance/<date>', methods=['GET'])
def get_attendance(date):
    try:
        attendance_file = f"attendance_{date}.json"
        attendance_path = os.path.join(UPLOAD_FOLDER, attendance_file)
        
        if os.path.exists(attendance_path):
            with open(attendance_path, 'r') as f:
                attendance_records = json.load(f)
            return jsonify({'attendance': attendance_records}), 200
        else:
            return jsonify({'attendance': []}), 200
    except Exception as e:
        print(f"Error getting attendance: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 