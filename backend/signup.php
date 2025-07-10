<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$name = $input['name'] ?? '';
$emailOrMobile = $input['emailOrMobile'] ?? '';
$password = $input['password'] ?? '';
$profilePhotoBase64 = $input['profilePhoto'] ?? null;
$profilePhotoPath = null;

if (empty($name) || empty($emailOrMobile) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, email/mobile and password are required']);
    exit;
}

// Handle profile photo upload
if ($profilePhotoBase64) {
    $uploadDir = __DIR__ . '/profile_photos/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $filename = 'profile_' . uniqid() . '.jpg';
    $filePath = $uploadDir . $filename;
    $photoData = base64_decode($profilePhotoBase64);
    if ($photoData === false) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid profile photo data']);
        exit;
    }
    if (file_put_contents($filePath, $photoData) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save profile photo']);
        exit;
    }
    // Save relative path for DB
    $profilePhotoPath = 'backend/profile_photos/' . $filename;
}

try {
    $pdo = getDB();
    
    // Check if input is email or mobile
    $isEmail = filter_var($emailOrMobile, FILTER_VALIDATE_EMAIL);
    
    // Check if user already exists
    if ($isEmail) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    } else {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE mobile = ?");
    }
    
    $stmt->execute([$emailOrMobile]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        http_response_code(409);
        echo json_encode(['error' => 'User already exists with this email/mobile']);
        exit;
    }
    
    // Insert new user
    $stmt = $pdo->prepare("INSERT INTO users (name, email, mobile, password, avatar_url) VALUES (?, ?, ?, ?, ?)");
    
    if ($isEmail) {
        $stmt->execute([$name, $emailOrMobile, null, $password, $profilePhotoPath]);
    } else {
        $stmt->execute([$name, null, $emailOrMobile, $password, $profilePhotoPath]);
    }
    
    $userId = $pdo->lastInsertId();
    
    // Get the created user (without password)
    $stmt = $pdo->prepare("SELECT id, name, email, mobile, role, status, avatar_url, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'user' => $user
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?> 