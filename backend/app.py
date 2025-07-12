from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import json
from datetime import datetime
import base64
from werkzeug.utils import secure_filename
from deepface import DeepFace

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
        # Get embedding using DeepFace (default model: VGG-Face)
        embedding_objs = DeepFace.represent(img_path=image_path, model_name='VGG-Face', enforce_detection=True)
        if embedding_objs and len(embedding_objs) > 0:
            embedding = embedding_objs[0]['embedding']
            print('DeepFace embedding generated')
            return np.array(embedding)
        else:
            print('No face detected by DeepFace')
            return None
    except Exception as e:
        print(f"DeepFace error: {e}")
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

        employee_id = request.form.get('employee_id', '').strip()
        name = request.form.get('name', '').strip()
        if not employee_id or not name:
            return jsonify({'error': 'Employee ID and Name are required'}), 400

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
        # Only compare with the provided employee_id and name
        employee_data = employees.get(employee_id)
        if not employee_data or employee_data['name'].strip().lower() != name.lower():
            print('No matching employee found for provided ID and name')
            return jsonify({'error': 'No matching employee found for provided ID and name.'}), 400
        stored_encoding = np.array(employee_data['face_encoding'])
        # Use cosine similarity for DeepFace embeddings
        from numpy.linalg import norm
        def cosine_similarity(a, b):
            return np.dot(a, b) / (norm(a) * norm(b))
        similarity = cosine_similarity(attendance_encoding, stored_encoding)
        print(f'Cosine similarity to {employee_data["name"]}: {similarity}')
        threshold = 0.4  # VGG-Face recommended threshold for cosine similarity
        if similarity > threshold:
            attendance_record = {
                'employee_id': employee_data['employee_id'],
                'name': employee_data['name'],
                'timestamp': datetime.now().isoformat(),
                'similarity': float(similarity)
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
            print(f'Attendance marked for {employee_data["name"]} with similarity {similarity:.2f}')
            return jsonify({
                'success': True,
                'message': f'Attendance marked for {employee_data["name"]}',
                'employee': {
                    'name': employee_data['name'],
                    'employee_id': employee_data['employee_id'],
                    'similarity': float(similarity)
                }
            }), 200
        else:
            print('Face does not match stored image (similarity too low)')
            return jsonify({'error': 'Face does not match stored image. Please ensure you are the correct employee and use a clear, front-facing photo.'}), 400
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