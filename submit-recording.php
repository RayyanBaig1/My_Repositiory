<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}


if (!isset($_FILES['recording']) || $_FILES['recording']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No recording file uploaded']);
    exit;
}


$fullName = $_POST['fullName'] ?? '';
$email = $_POST['email'] ?? '';
$message = $_POST['message'] ?? '';
$recordingType = $_POST['recordingType'] ?? '';
$recordingDate = $_POST['recordingDate'] ?? '';
$toEmail = $_POST['toEmail'] ?? 'recordingsubmit@gmail.com';


if (empty($fullName) || empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and email are required']);
    exit;
}


if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format']);
    exit;
}


$uploadedFile = $_FILES['recording'];
$fileName = $uploadedFile['name'];
$fileTmpPath = $uploadedFile['tmp_name'];
$fileSize = $uploadedFile['size'];
$fileSizeMB = round($fileSize / (1024 * 1024), 2);


if ($fileSize > 50 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 50MB.']);
    exit;
}


$allowedTypes = ['video/webm', 'audio/webm', 'video/mp4', 'audio/mp3', 'audio/wav'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $fileTmpPath);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only audio/video recordings are allowed.']);
    exit;
}


$fileContent = file_get_contents($fileTmpPath);
$encodedFile = chunk_split(base64_encode($fileContent));


$boundary = md5(time());
$headers = "From: Recording System <noreply@yourwebsite.com>\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

$subject = "New {$recordingType} recording from {$fullName}";


$emailBody = "--{$boundary}\r\n";
$emailBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
$emailBody .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$emailBody .= "New recording submission received:\r\n\r\n";
$emailBody .= "From: {$fullName} ({$email})\r\n";
$emailBody .= "Date: " . date('Y-m-d H:i:s', strtotime($recordingDate)) . "\r\n";
$emailBody .= "Type: " . ucfirst($recordingType) . " Recording\r\n";
$emailBody .= "File Size: {$fileSizeMB} MB\r\n\r\n";
$emailBody .= "Message:\r\n{$message}\r\n\r\n";
$emailBody .= "Best regards,\r\nRecording System\r\n\r\n";


$emailBody .= "--{$boundary}\r\n";
$emailBody .= "Content-Type: {$mimeType}; name=\"{$fileName}\"\r\n";
$emailBody .= "Content-Transfer-Encoding: base64\r\n";
$emailBody .= "Content-Disposition: attachment; filename=\"{$fileName}\"\r\n\r\n";
$emailBody .= $encodedFile . "\r\n";
$emailBody .= "--{$boundary}--";


$mailSent = mail($toEmail, $subject, $emailBody, $headers);

if ($mailSent) {
    
    $logEntry = date('Y-m-d H:i:s') . " - Recording submitted by {$fullName} ({$email}) - File: {$fileName} ({$fileSizeMB}MB)\n";
    file_put_contents('recording_submissions.log', $logEntry, FILE_APPEND | LOCK_EX);
    
    echo json_encode([
        'success' => true,
        'message' => 'Recording submitted successfully',
        'fileSize' => "{$fileSizeMB} MB"
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
}
?>
