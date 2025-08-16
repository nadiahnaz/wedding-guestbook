// Google Apps Script URL
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

const previewSection = document.getElementById('preview-section');
const previewVideo = document.getElementById('preview-video');
const retakeBtn = document.getElementById('retake-btn');
const uploadBtn = document.getElementById('upload-btn');

const snapPhotoBtn = document.getElementById('snap-photo-btn');
const yesSelfieBtn = document.getElementById('yes-selfie-btn');
const noSelfieBtn = document.getElementById('no-selfie-btn');
const photoPreviewSection = document.getElementById('photo-preview-section');
const previewPhoto = document.getElementById('preview-photo');
const retakePhotoBtn = document.getElementById('retake-photo-btn');
const uploadPhotoBtn = document.getElementById('upload-photo-btn');

// -- STATE --
let currentStream;
let mediaRecorder;
let recordedChunks = [];
let facingMode = 'user'; // 'environment' or 'user'
let capturedPhotoBlob = null;

// Start camera
async function startCamera(mode) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode },
            audio: true
        });
        cameraFeed.srcObject = currentStream;
        cameraFeed.muted = true; // prevent echo
    } catch (error) {
        alert("Gagal mengakses kamera. Sila semak kebenaran.");
        console.error("Camera Error:", error);
    }
}

// Upload helper
async function uploadFile(base64Data, fileName, mimeType) {
    const payload = { fileData: base64Data, fileName, mimeType };
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        return true;
    } catch (error) {
        console.error('Upload failed:', error);
        alert(`Gagal memuat naik fail: ${error.message}`);
        return false;
    }
}

// -- EVENTS --
initCameraBtn.addEventListener('click', () => {
    greetingSection.classList.add('d-none');
    cameraSection.classList.remove('d-none');
    startRecordBtn.classList.remove('d-none');
    stopRecordBtn.classList.add('d-none');
    snapPhotoBtn.classList.add('d-none');
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
        if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });

        // Stop camera
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());

        // Show preview
        cameraSection.classList.add('d-none');
        previewSection.classList.remove('d-none');
        previewVideo.src = URL.createObjectURL(videoBlob);
        previewVideo.controls = true;
        previewVideo.play();

        // Retake: Go back to camera, show Start button
        retakeBtn.onclick = () => {
            previewSection.classList.add('d-none');
            cameraSection.classList.remove('d-none');
            startRecordBtn.classList.remove('d-none');
            stopRecordBtn.classList.add('d-none');
            snapPhotoBtn.classList.add('d-none');
            switchCameraBtn.disabled = false;
            startCamera(facingMode); // camera on, no recording yet
        };

        // Upload
        uploadBtn.onclick = async () => {
            previewSection.classList.add('d-none');
            loadingSection.classList.remove('d-none');
            loadingText.textContent = "Memuat Naik Video...";
            const reader = new FileReader();
            reader.readAsDataURL(videoBlob);
            reader.onloadend = async () => {
                const base64String = reader.result.split(',')[1];
                const success = await uploadFile(base64String, `guest-video-${Date.now()}.webm`, 'video/webm');
                loadingSection.classList.add('d-none');
                if (success) selfiePromptSection.classList.remove('d-none');
                else greetingSection.classList.remove('d-none');
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
    startRecordBtn.classList.add('d-none');
    stopRecordBtn.classList.add('d-none');
    snapPhotoBtn.classList.remove('d-none');
    switchCameraBtn.disabled = false;

    if (facingMode !== 'user') {
        facingMode = 'user';
        startCamera(facingMode);
    } else {
        startCamera(facingMode);
    }
});

noSelfieBtn.addEventListener('click', () => {
    selfiePromptSection.classList.add('d-none');
    thankYouSection.classList.remove('d-none');
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
});

snapPhotoBtn.addEventListener('click', () => {
    photoCanvas.width = cameraFeed.videoWidth;
    photoCanvas.height = cameraFeed.videoHeight;
    photoCanvas.getContext('2d').drawImage(cameraFeed, 0, 0);

    // Convert to blob
    photoCanvas.toBlob((blob) => {
        capturedPhotoBlob = blob;

        // Show preview
        cameraSection.classList.add('d-none');
        photoPreviewSection.classList.remove('d-none');
        previewPhoto.src = URL.createObjectURL(blob);

        // Stop camera
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    }, 'image/jpeg');
});

retakePhotoBtn.addEventListener('click', () => {
    photoPreviewSection.classList.add('d-none');
    cameraSection.classList.remove('d-none');
    snapPhotoBtn.classList.remove('d-none');
    switchCameraBtn.disabled = false;
    startCamera(facingMode);
});

uploadPhotoBtn.addEventListener('click', async () => {
    if (!capturedPhotoBlob) return;

    photoPreviewSection.classList.add('d-none');
    loadingSection.classList.remove('d-none');
    loadingText.textContent = "Memuat Naik Gambar...";

    const reader = new FileReader();
    reader.readAsDataURL(capturedPhotoBlob);
    reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1];
        const success = await uploadFile(base64String, `guest-photo-${Date.now()}.jpeg`, 'image/jpeg');
        loadingSection.classList.add('d-none');
        if (success) {
            thankYouSection.classList.remove('d-none');
        } else {
            selfiePromptSection.classList.remove('d-none');
        }
    };
});
