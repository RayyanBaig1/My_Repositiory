<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = [
        'success' => true,
        'message' => 'TEST MODE: Data received successfully!',
        'received_data' => [
            'fullName' => $_POST['fullName'] ?? 'Not provided',
            'email' => $_POST['email'] ?? 'Not provided',
            'message' => $_POST['message'] ?? 'Not provided',
            'recordingType' => $_POST['recordingType'] ?? 'Not provided'
        ],
        'file_info' => []
    ];
    
    if (isset($_FILES['recording'])) {
        $file = $_FILES['recording'];
        $response['file_info'] = [
            'name' => $file['name'],
            'size' => round($file['size'] / 1024, 2) . ' KB',
            'type' => $file['type'],
            'error' => $file['error']
        ];
    } else {
        $response['file_info'] = 'No file uploaded';
    }
    
    
    $logData = date('Y-m-d H:i:s') . " - TEST SUBMISSION\n";
    $logData .= "Name: " . ($_POST['fullName'] ?? 'N/A') . "\n";
    $logData .= "Email: " . ($_POST['email'] ?? 'N/A') . "\n";
    $logData .= "File: " . (isset($_FILES['recording']) ? $_FILES['recording']['name'] : 'None') . "\n";
    $logData .= "Size: " . (isset($_FILES['recording']) ? round($_FILES['recording']['size'] / 1024, 2) . ' KB' : 'N/A') . "\n";
    $logData .= "---\n\n";
    
    file_put_contents('test_submissions.log', $logData, FILE_APPEND | LOCK_EX);
    
    echo json_encode($response);
} else {
    echo json_encode(['success' => false, 'error' => 'Only POST requests allowed']);
}
?>
