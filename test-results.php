<!DOCTYPE html>
<html>
<head>
    <title>Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .log { background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
        .refresh { margin-bottom: 15px; }
    </style>
</head>
<body>
    <h2>Recording Submission Test Log</h2>
    <div class="refresh">
        <button onclick="location.reload()">🔄 Refresh</button>
        <a href="/" style="margin-left: 10px;">← Back to App</a>
    </div>
    
    <h3>Test Submissions:</h3>
    <div class="log">
        <?php
        $logFile = 'test_submissions.log';
        if (file_exists($logFile)) {
            echo htmlspecialchars(file_get_contents($logFile));
        } else {
            echo "No test submissions yet. Try submitting a recording first.";
        }
        ?>
    </div>
    
    <h3>Production Submissions (if any):</h3>
    <div class="log">
        <?php
        $prodLogFile = 'recording_submissions.log';
        if (file_exists($prodLogFile)) {
            echo htmlspecialchars(file_get_contents($prodLogFile));
        } else {
            echo "No production submissions yet.";
        }
        ?>
    </div>
</body>
</html>
