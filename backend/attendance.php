<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'] ?? null;
$attendancePhotoBase64 = $input['attendancePhoto'] ?? null;

if (!$userId || !$attendancePhotoBase64) {
    http_response_code(400);
    echo json_encode(['error' => 'userId and attendancePhoto are required']);
    exit;
}

$uploadDir = __DIR__ . '/attendance_photos/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$attendanceFilename = 'attendance_' . uniqid() . '.jpg';
$attendancePath = $uploadDir . $attendanceFilename;
$photoData = base64_decode($attendancePhotoBase64);

if ($photoData === false || file_put_contents($attendancePath, $photoData) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save attendance photo']);
    exit;
}

try {
    $pdo = getDB();
    $stmt = $pdo->prepare('SELECT avatar_url FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user || !$user['avatar_url']) {
        http_response_code(404);
        echo json_encode(['error' => 'Profile photo not found for user']);
        exit;
    }

    $profilePhotoPath = __DIR__ . '/../' . $user['avatar_url'];
    if (!file_exists($profilePhotoPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Profile photo file not found']);
        exit;
    }

    // Face match using Python
    $pythonScript = __DIR__ . '/face_match.py';
    $cmd = escapeshellcmd("python3 $pythonScript " . escapeshellarg($profilePhotoPath) . ' ' . escapeshellarg($attendancePath));
    $matchResult = trim(shell_exec($cmd));

    if ($matchResult === 'match') {
        echo json_encode(['success' => true, 'message' => 'Face matched! Attendance marked.']);
    } elseif ($matchResult === 'no_face') {
        http_response_code(400);
        echo json_encode(['error' => 'No face detected in the attendance photo. Please try again.']);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Face did not match.']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
