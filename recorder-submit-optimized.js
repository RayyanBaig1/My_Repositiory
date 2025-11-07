let currentMode = null;
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let isPaused = false;
let recordingTimer = null;
let recordingSeconds = 0;
const homeScreen = document.getElementById('homeScreen');
const recordingScreen = document.getElementById('recordingScreen');
const recordingIcon = document.getElementById('recordingIcon');
const recordingTypeTitle = document.getElementById('recordingTypeTitle');
const videoPreviewContainer = document.getElementById('videoPreviewContainer');
const audioPreviewContainer = document.getElementById('audioPreviewContainer');
const videoPreview = document.getElementById('videoPreview');
const videoPlayback = document.getElementById('videoPlayback');
const audioPlayback = document.getElementById('audioPlayback');
const recordingStatusOverlay = document.getElementById('recordingStatusOverlay');
const recordingStatusText = document.getElementById('recordingStatusText');
const recordingTimerElement = document.getElementById('recordingTimer');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const stopButton = document.getElementById('stopButton');
const downloadSection = document.getElementById('downloadSection');
function startRecording(mode) {
    currentMode = mode;
    setupRecordingScreen();
    showRecordingScreen();
    initializeMedia();
}
function setupRecordingScreen() {
    if (currentMode === 'video') {
        recordingIcon.textContent = '🎥';
        recordingIcon.className = 'recording-title-icon video-icon';
        recordingTypeTitle.textContent = 'Video Recording';
        videoPreviewContainer.classList.remove('hidden');
        audioPreviewContainer.classList.add('hidden');
    } else {
        recordingIcon.textContent = '🎙️';
        recordingIcon.className = 'recording-title-icon audio-icon';
        recordingTypeTitle.textContent = 'Audio Recording';
        videoPreviewContainer.classList.add('hidden');
        audioPreviewContainer.classList.remove('hidden');
    }
    resetRecordingState();
}
function showRecordingScreen() {
    homeScreen.style.display = 'none';
    recordingScreen.style.display = 'block';
}
function goHome() {
    stopAllStreams();
    resetRecordingState();
    homeScreen.style.display = 'flex';
    recordingScreen.style.display = 'none';
    currentMode = null;
}
async function initializeMedia() {
    try {
        if (currentMode === 'video') {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            videoPreview.srcObject = mediaStream;
            videoPreview.classList.remove('hidden');
        } else {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            updateAudioVisualization('ready');
        }
        startButton.disabled = false;
    } catch (error) {
        showError('Could not access your camera/microphone. Please allow permissions and try again.');
    }
}
function toggleRecording() {
    if (!isRecording) {
        startRecordingProcess();
    } else if (isPaused) {
        resumeRecording();
    } else {
        pauseRecording();
    }
}
async function startRecordingProcess() {
    try {
        const options = {};
        if (currentMode === 'video') {
            if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
                options.mimeType = 'video/webm; codecs=vp9';
            }
        } else {
            if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
                options.mimeType = 'audio/webm; codecs=opus';
            }
        }
        mediaRecorder = new MediaRecorder(mediaStream, options);
        recordedChunks = [];
        recordingSeconds = 0;
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        mediaRecorder.onstop = () => {
            handleRecordingComplete();
        };
        mediaRecorder.start(1000);
        isRecording = true;
        isPaused = false;
        startButton.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        stopButton.disabled = false;
        showRecordingOverlay();
        startTimer();
        if (currentMode === 'audio') {
            updateAudioVisualization('recording');
        }
    } catch (error) {
        showError('Failed to start recording. Please try again.');
    }
}
function pauseRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.pause();
        isPaused = true;
        pauseButton.classList.add('hidden');
        resumeButton.classList.remove('hidden');
        recordingStatusText.textContent = 'Paused';
        recordingStatusOverlay.classList.add('paused');
        stopTimer();
        if (currentMode === 'audio') {
            updateAudioVisualization('paused');
        }
    }
}
function resumeRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.resume();
        isPaused = false;
        resumeButton.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        recordingStatusText.textContent = 'Recording';
        recordingStatusOverlay.classList.remove('paused');
        startTimer();
        if (currentMode === 'audio') {
            updateAudioVisualization('recording');
        }
    }
}
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        isPaused = false;
        stopTimer();
        stopAllStreams();
        hideRecordingOverlay();
        pauseButton.classList.add('hidden');
        resumeButton.classList.add('hidden');
        startButton.classList.remove('hidden');
        startButton.textContent = '🔄 Record Again';
        startButton.disabled = false;
        stopButton.disabled = true;
        if (currentMode === 'audio') {
            updateAudioVisualization('stopped');
        }
    }
}
function handleRecordingComplete() {
    const blob = new Blob(recordedChunks, { type: currentMode === 'video' ? 'video/webm' : 'audio/webm' });
    const url = URL.createObjectURL(blob);
    if (currentMode === 'video') {
        videoPreview.classList.add('hidden');
        videoPlayback.src = url;
        videoPlayback.classList.remove('hidden');
    } else {
        audioPlayback.src = url;
        audioPlayback.classList.remove('hidden');
    }
    downloadSection.classList.add('active');
    const submitSection = document.getElementById('submitSection');
    submitSection.classList.add('active');
}
function downloadRecording() {
    if (recordedChunks.length === 0) {
        showError('No recording available to download.');
        return;
    }
    const blob = new Blob(recordedChunks, { type: currentMode === 'video' ? 'video/webm' : 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMode}_recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success feedback - look for download icon in submit section
    const submitSection = document.getElementById('submitSection');
    const downloadIcon = submitSection ? submitSection.querySelector('.download-icon') : null;
    if (downloadIcon) {
        const originalContent = downloadIcon.textContent;
        downloadIcon.textContent = '✅';
        setTimeout(() => {
            downloadIcon.textContent = originalContent;
        }, 2000);
    }
    
    // Also show a temporary success message
    showSuccessMessage('Recording downloaded successfully!');
}
function showRecordingOverlay() {
    recordingStatusOverlay.classList.add('active');
    recordingStatusText.textContent = 'Recording';
}
function hideRecordingOverlay() {
    recordingStatusOverlay.classList.remove('active');
    recordingStatusOverlay.classList.remove('paused');
}
function updateAudioVisualization(state) {
    const visualization = document.getElementById('audioVisualization');
    switch (state) {
        case 'ready':
            visualization.innerHTML = '<div style="color: white; text-align: center;"><div style="font-size: 48px; margin-bottom: 1rem;">🎙️</div><div style="font-size: 1.125rem;">Ready to record audio</div></div>';
            break;
        case 'recording':
            visualization.innerHTML = '<div style="color: white; text-align: center;"><div style="font-size: 48px; margin-bottom: 1rem; animation: pulse 2s infinite;">🔴</div><div style="font-size: 1.125rem;">Recording in progress...</div></div>';
            break;
        case 'paused':
            visualization.innerHTML = '<div style="color: white; text-align: center;"><div style="font-size: 48px; margin-bottom: 1rem;">⏸️</div><div style="font-size: 1.125rem;">Recording paused</div></div>';
            break;
        case 'stopped':
            visualization.innerHTML = '<div style="color: white; text-align: center;"><div style="font-size: 48px; margin-bottom: 1rem;">✅</div><div style="font-size: 1.125rem;">Recording complete</div></div>';
            break;
    }
}
function startTimer() {
    updateTimerDisplay();
    recordingTimer = setInterval(() => {
        recordingSeconds++;
        updateTimerDisplay();
    }, 1000);
}
function stopTimer() {
    if (recordingTimer) {
        clearInterval(recordingTimer);
        recordingTimer = null;
    }
}
function updateTimerDisplay() {
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    recordingTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function resetRecordingState() {
    isRecording = false;
    isPaused = false;
    recordedChunks = [];
    recordingSeconds = 0;
    startButton.classList.remove('hidden');
    pauseButton.classList.add('hidden');
    resumeButton.classList.add('hidden');
    startButton.textContent = '⏺️ Start Recording';
    startButton.disabled = true;
    stopButton.disabled = true;
    hideRecordingOverlay();
    downloadSection.classList.remove('active');
    const submitSection = document.getElementById('submitSection');
    submitSection.classList.remove('active');
    videoPlayback.classList.add('hidden');
    audioPlayback.classList.add('hidden');
    videoPreview.classList.add('hidden');
    stopTimer();
    recordingTimerElement.textContent = '00:00';
}
function stopAllStreams() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (videoPreview.srcObject) {
        videoPreview.srcObject = null;
    }
}
function showError(message) {
    alert(message);
}

function showSuccessMessage(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        z-index: 1000;
        font-weight: 500;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && recordingScreen.style.display === 'block') {
        if (!isRecording) {
            goHome();
        }
    }
    if (event.key === ' ' && recordingScreen.style.display === 'block') {
        event.preventDefault();
        if (!startButton.disabled) {
            toggleRecording();
        }
    }
});
window.addEventListener('beforeunload', () => {
    stopAllStreams();
    stopTimer();
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRecording && !isPaused) {
    }
});

// Configuration
const TEST_MODE = true; // Set to false for production
const TEST_ENDPOINT = './test-submit.php';
const PRODUCTION_ENDPOINT = './submit-recording.php';

// EmailJS Configuration (for production use)
// To enable EmailJS in production:
// 1. Sign up at emailjs.com
// 2. Replace the placeholder values below with your actual EmailJS credentials
// 3. Uncomment the initialization code

const EMAILJS_CONFIG = {
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID'
};

// Only initialize EmailJS if valid credentials are provided
if (typeof emailjs !== 'undefined' && 
    EMAILJS_CONFIG.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' && 
    EMAILJS_CONFIG.publicKey.trim() !== '') {
    try {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        console.log('EmailJS initialized successfully');
    } catch (error) {
        console.warn('EmailJS initialization failed:', error);
    }
} else {
    console.log('EmailJS not configured - using local fallback methods');
}

document.getElementById('submitForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submitButton');
    const submitStatus = document.getElementById('submitStatus');
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    if (!fullName || !email) {
        submitStatus.innerHTML = '<div style="color: var(--danger-red); text-align: center; margin-top: 1rem;">Please fill in all required fields.</div>';
        return;
    }
    
    if (recordedChunks.length === 0) {
        submitStatus.innerHTML = '<div style="color: var(--danger-red); text-align: center; margin-top: 1rem;">No recording available to send.</div>';
        return;
    }
    
    submitButton.disabled = true;
    submitButton.textContent = '📧 Sending...';
    submitStatus.innerHTML = '<div style="color: var(--primary-blue); text-align: center; margin-top: 1rem;">Preparing your recording for email...</div>';
    
    try {
        const blob = new Blob(recordedChunks, { type: currentMode === 'video' ? 'video/webm' : 'audio/webm' });
        const fileSizeKB = Math.round(blob.size / 1024);
        const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        
        // EmailJS cannot handle true file attachments, so we'll use form submission methods
        // that can send proper attachments
        await sendViaFormSubmit(fullName, email, message, blob);
        
    } catch (error) {
        console.error('Email sending failed:', error);
        submitStatus.innerHTML = '<div style="color: var(--danger-red); text-align: center; margin-top: 1rem;">❌ Failed to send email. Please try downloading instead. Error: ' + error.message + '</div>';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = '📧 Send Email';
    }
});

// EmailJS function removed - it was causing base64 data in emails instead of proper attachments
// Use the form submission methods instead for proper file attachments

async function sendViaFormSubmit(fullName, email, message, blob) {
    const submitStatus = document.getElementById('submitStatus');
    
    // Create file details
    const fileName = `${currentMode}_recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    const fileSizeKB = Math.round(blob.size / 1024);
    const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
    
    // Try PHP backend first (for testing with local SMTP server)
    try {
        const endpoint = TEST_MODE ? TEST_ENDPOINT : PRODUCTION_ENDPOINT;
        const statusMessage = TEST_MODE ? 'Testing backend connection...' : 'Sending via local backend...';
        
        submitStatus.innerHTML = `<div style="color: var(--primary-blue); text-align: center; margin-top: 1rem;">📧 ${statusMessage}</div>`;
        
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('message', message || 'Please find my recording attached.');
        formData.append('recordingType', currentMode);
        formData.append('recording', blob, fileName);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            submitStatus.innerHTML = `
                <div style="color: var(--success-green); text-align: center; margin-top: 1rem;">
                    ✅ ${result.message}<br>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Check the SMTP server console for the email details
                    </small>
                </div>
            `;
            document.getElementById('submitForm').reset();
            return;
        } else {
            throw new Error(result.error || 'Backend submission failed');
        }
    } catch (error) {
        console.error('Backend submission failed:', error);
        submitStatus.innerHTML = `
            <div style="color: var(--warning-orange); text-align: center; margin-top: 1rem;">
                ⚠️ Backend submission failed: ${error.message}<br>
                <small>Falling back to download + email client method...</small>
            </div>
        `;
    }
    
    // Fallback method: download + email client
    setTimeout(() => {
        submitStatus.innerHTML = '<div style="color: var(--primary-blue); text-align: center; margin-top: 1rem;">📧 Opening email client and downloading recording...</div>';
        
        // Download the file automatically
        downloadRecording();
        
        // Create mailto link with proper instructions
        const mailtoSubject = `New ${currentMode} recording from ${fullName}`;
        const mailtoBody = `Hello,

I am sending you a ${currentMode} recording.

From: ${fullName} (${email})
Date: ${new Date().toLocaleString()}
Recording Type: ${currentMode}
File Size: ${fileSizeMB} MB
Message: ${message || 'Please find my recording attached.'}

IMPORTANT: A recording file (${fileName}) has been downloaded to your computer. 
Please attach the downloaded .webm file to this email before sending.

Best regards,
${fullName}`;
        
        const mailtoLink = `mailto:recordingsubmit@gmail.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;
        
        // Open email client
        setTimeout(() => {
            window.open(mailtoLink);
            submitStatus.innerHTML = `
                <div style="color: var(--success-green); text-align: center; margin-top: 1rem;">
                    ✅ Recording prepared for email!<br>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Your email client should open. Please attach the downloaded file (${fileName}) to your email and send.
                    </small>
                </div>
            `;
            document.getElementById('submitForm').reset();
        }, 1500);
        
    }, 2000);
    
    // Note: For production deployment, you would configure one of these:
    
    /*
    // Option 1: Formspree (requires account and endpoint)
    try {
        const formspreeData = new FormData();
        formspreeData.append('_subject', `New ${currentMode} recording from ${fullName}`);
        formspreeData.append('_replyto', email);
        formspreeData.append('name', fullName);
        formspreeData.append('email', email);
        formspreeData.append('message', message || 'Please find my recording attached.');
        formspreeData.append('recording_type', currentMode);
        formspreeData.append('file', blob, fileName);
        
        const response = await fetch('https://formspree.io/f/YOUR_ENDPOINT_HERE', {
            method: 'POST',
            body: formspreeData
        });
        
        if (response.ok) {
            submitStatus.innerHTML = '<div style="color: var(--success-green); text-align: center; margin-top: 1rem;">📧 Recording sent successfully!</div>';
            document.getElementById('submitForm').reset();
            return;
        }
    } catch (error) {
        console.error('Formspree submission failed:', error);
    }
    */
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
