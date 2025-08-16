// Tampal URL Google Apps Script yang anda salin tadi
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoYgbo4ej1Z51v5SgU-3Eqr-hDdugp2qPxJD2GexThWeLzxJvDY_ciEEYze5ENEnCzYQ/exec";

// -- DOM ELEMENTS --
const greetingSection = document.getElementById('greeting-section');
const cameraSection = document.getElementById('camera-section');
const loadingSection = document.getElementById('loading-section');
const selfiePromptSection = document.getElementById('selfie-prompt-section');
const thankYouSection = document.getElementById('thank-you-section');
const loadingText = document.getElementById('loading-text');

const cameraFeed = document.getElementById('camera-feed');
const photoCanvas = document.getElementById('photo-canvas');

const initCameraBtn = document.getElementById('init-camera-btn');
const startRecordBtn = document.getElementById('start-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn');
const snapPhotoBtn = document.getElementById('snap-photo-btn');
const yesSelfieBtn = document.getElementById('yes-selfie-btn');
const noSelfieBtn = document.getElementById('no-selfie-btn');

// -- STATE MANAGEMENT --
let currentStream;
let mediaRecorder;
let recordedChunks = [];
let facingMode = 'environment'; // 'environment' = back, 'user' = front

// -- FUNCTIONS --

// Function to start the camera
async function startCamera(mode) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode },
            audio: true, // Enable audio for video
        });
        cameraFeed.srcObject = currentStream;
        cameraFeed.muted = true; // 🔇 Prevent echo by muting preview
    } catch (error) {
        alert("Gagal mengakses kamera. Sila semak kebenaran dan pastikan tiada aplikasi lain menggunakannya.");
        console.error("Camera Error:", error);
    }
}

// Generic file upload function
async function uploadFile(base64Data, fileName, mimeType) {
    const payload = { fileData: base64Data, fileName, mimeType };
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message);
        }
        return true;
    } catch (error) {
        console.error('Upload failed:', error);
        alert(`Gagal memuat naik fail: ${error.message}`);
        return false;
    }
}

// -- EVENT LISTENERS --

initCameraBtn.addEventListener('click', () => {
    greetingSection.classList.add('d-none');
    cameraSection.classList.remove('d-none');
    startCamera(facingMode);
});

switchCameraBtn.addEventListener('click', () => {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(facingMode);
});

startRecordBtn.addEventListener('click', () => {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(currentStream, { mimeType: 'video/webm' });

    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });

        // Stop camera to save resources
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Show preview section
        cameraSection.classList.add('d-none');
        previewSection.classList.remove('d-none');

        // Load the recorded video into the preview element
        const previewURL = URL.createObjectURL(videoBlob);
        document.getElementById('preview-video').src = previewURL;

        // Handle Retake
        document.getElementById('retake-btn').onclick = () => {
            previewSection.classList.add('d-none');
            cameraSection.classList.remove('d-none');
            startCamera(facingMode);
        };

        // Handle Upload
        document.getElementById('upload-btn').onclick = async () => {
            previewSection.classList.add('d-none');
            loadingSection.classList.remove('d-none');
            loadingText.textContent = "Memuat Naik Video...";

            const reader = new FileReader();
            reader.readAsDataURL(videoBlob);
            reader.onloadend = async () => {
                const base64String = reader.result.split(',')[1];
                const success = await uploadFile(
                    base64String,
                    `guest-video-${Date.now()}.webm`,
                    'video/webm'
                );
                loadingSection.classList.add('d-none');
                if (success) {
                    selfiePromptSection.classList.remove('d-none');
                } else {
                    greetingSection.classList.remove('d-none'); // back to start on fail
                }
            };
        };
    };

    mediaRecorder.start();
    startRecordBtn.classList.add('d-none');
    stopRecordBtn.classList.remove('d-none');
    switchCameraBtn.disabled = true;
});

stopRecordBtn.addEventListener('click', () => {
    mediaRecorder.stop();
});

yesSelfieBtn.addEventListener('click', () => {
    selfiePromptSection.classList.add('d-none');
    cameraSection.classList.remove('d-none');
    
    // Switch to photo mode UI
    startRecordBtn.classList.add('d-none');
    stopRecordBtn.classList.add('d-none');
    snapPhotoBtn.classList.remove('d-none');
    switchCameraBtn.disabled = false;

    // Force selfie camera
    if (facingMode !== 'user') {
        facingMode = 'user';
        startCamera(facingMode);
    }
});

noSelfieBtn.addEventListener('click', () => {
    selfiePromptSection.classList.add('d-none');
    thankYouSection.classList.remove('d-none');
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});

snapPhotoBtn.addEventListener('click', async () => {
    photoCanvas.width = cameraFeed.videoWidth;
    photoCanvas.height = cameraFeed.videoHeight;
    photoCanvas.getContext('2d').drawImage(cameraFeed, 0, 0);
    
    cameraSection.classList.add('d-none');
    loadingSection.classList.remove('d-none');
    loadingText.textContent = "Memuat Naik Gambar...";

    const base64String = photoCanvas.toDataURL('image/jpeg').split(',')[1];
    const success = await uploadFile(base64String, `guest-photo-${Date.now()}.jpeg`, 'image/jpeg');
    
    loadingSection.classList.add('d-none');
    if (success) {
        thankYouSection.classList.remove('d-none');
    } else {
        selfiePromptSection.classList.remove('d-none'); // Go back to prompt on failure
    }
     if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});