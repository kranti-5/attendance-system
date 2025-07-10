import sys
import face_recognition

if len(sys.argv) != 3:
    print('no_match')
    sys.exit(1)

profile_path = sys.argv[1]
attendance_path = sys.argv[2]

try:
    known_image = face_recognition.load_image_file(profile_path)
    unknown_image = face_recognition.load_image_file(attendance_path)
    known_encodings = face_recognition.face_encodings(known_image)
    unknown_encodings = face_recognition.face_encodings(unknown_image)
    if not unknown_encodings:
        print('no_face')
        sys.exit(0)
    if not known_encodings:
        print('no_match')
        sys.exit(0)
    results = face_recognition.compare_faces([known_encodings[0]], unknown_encodings[0])
    print('match' if results[0] else 'no_match')
except Exception as e:
    print('no_match')
