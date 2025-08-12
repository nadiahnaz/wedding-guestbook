<?php
// Include the Composer autoloader
require_once __DIR__ . '/vendor/autoload.php';

// Set the content type to JSON for the response
header('Content-Type: application/json');

// --- CONFIGURATION ---
// The ID of the Google Drive folder to upload to
$folderId = '1P0liK_YXPaFNOblJqId6pR4olFfUovLO'; // Gantikan dengan ID Folder anda
// The path to your service account credentials .json file
$credentialsPath = __DIR__ . '/credentials.json'; // Gantikan dengan laluan fail .json anda
// --------------------

try {
    // Check if a file was uploaded
    if (!isset($_FILES['mediaFile']) || $_FILES['mediaFile']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File not uploaded or upload error.');
    }

    $tmpFilePath = $_FILES['mediaFile']['tmp_name'];
    $fileName = $_FILES['mediaFile']['name'];

    // --- GOOGLE API AUTHENTICATION ---
    $client = new Google_Client();
    $client->setAuthConfig($credentialsPath);
    $client->addScope(Google_Service_Drive::DRIVE_FILE); // Set the right scope
    
    $driveService = new Google_Service_Drive($client);

    // --- FILE UPLOAD LOGIC ---
    $fileMetadata = new Google_Service_Drive_DriveFile([
        'name' => $fileName,
        'parents' => [$folderId] // Specify the parent folder
    ]);

    $content = file_get_contents($tmpFilePath);
    
    $file = $driveService->files->create($fileMetadata, [
        'data' => $content,
        'mimeType' => mime_content_type($tmpFilePath), // Automatically detect MIME type
        'uploadType' => 'multipart',
        'fields' => 'id'
    ]);

    // Send a success response back to the JavaScript
    echo json_encode(['status' => 'success', 'fileId' => $file->id]);

} catch (Exception $e) {
    // Send an error response back to the JavaScript
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}