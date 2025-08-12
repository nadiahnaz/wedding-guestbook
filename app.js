// Dapatkan semua elemen DOM seperti sebelum ini
const greetingSection = document.getElementById('greeting-section');
const cameraSection = document.getElementById('camera-section');
const thankYouSection = document.getElementById('thank-you-section');
// ... dan butang-butang lain serta elemen video/canvas/img

const startCameraBtn = document.getElementById('start-camera-btn');
const snapPhotoBtn = document.getElementById('snap-photo-btn');
const uploadBtn = document.getElementById('upload-btn');
const retakeBtn = document.getElementById('retake-btn');

const videoFeed = document.getElementById('camera-feed');
const photoCanvas = document.getElementById('photo-canvas');
const photoPreview = document.getElementById('photo-preview');

let capturedBlob = null; // To store the captured photo/video data

// --- PERUBAHAN PENTING DI SINI ---
// Tampal URL Google Apps Script yang anda salin tadi
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoYgbo4ej1Z51v5SgU-3Eqr-hDdugp2qPxJD2GexThWeLzxJvDY_ciEEYze5ENEnCzYQ/exec";

// 1. Event listener to start the camera
startCameraBtn.addEventListener('click', async () => {
    try {
        // Request access to the user's camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, // 'user' for front camera, 'environment' for back
            audio: false 
        });
        
        greetingSection.classList.add('d-none');
        cameraSection.classList.remove('d-none');
        
        videoFeed.srcObject = stream;
    } catch (error) {
        console.error("Error accessing camera: ", error);
        alert("Tidak dapat mengakses kamera. Sila benarkan akses kamera pada pelayar anda.");
    }
});

// 2. Event listener to snap a photo
snapPhotoBtn.addEventListener('click', () => {
    // Set canvas dimensions to match video feed
    photoCanvas.width = videoFeed.videoWidth;
    photoCanvas.height = videoFeed.videoHeight;
    
    // Draw the current video frame onto the canvas
    const context = photoCanvas.getContext('2d');
    context.drawImage(videoFeed, 0, 0, photoCanvas.width, photoCanvas.height);
    
    // Show the preview and hide the live feed
    videoFeed.classList.add('d-none');
    photoPreview.src = photoCanvas.toDataURL('image/jpeg');
    photoPreview.classList.remove('d-none');
    
    // Show/hide relevant buttons
    snapPhotoBtn.classList.add('d-none');
    uploadBtn.classList.remove('d-none');
    retakeBtn.classList.remove('d-none');

    // Convert canvas image to a Blob for upload
    photoCanvas.toBlob(blob => {
        capturedBlob = blob;
    }, 'image/jpeg', 0.9); // 90% quality
});

// 4. Event listener to retake the photo
retakeBtn.addEventListener('click', () => {
    // Reset the interface to show the live camera feed again
    capturedBlob = null;
    videoFeed.classList.remove('d-none');
    photoPreview.classList.add('d-none');
    snapPhotoBtn.classList.remove('d-none');
    uploadBtn.classList.add('d-none');
    retakeBtn.classList.add('d-none');
});

// --- PERUBAHAN BESAR PADA FUNGSI UPLOAD ---
uploadBtn.addEventListener('click', async () => {
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Memuat Naik...';

    // Dapatkan data gambar sebagai Base64 dari canvas
    // Kita buang bahagian 'data:image/jpeg;base64,' dari string
    const base64ImageData = photoCanvas.toDataURL('image/jpeg').split(',')[1];
    
    // Cipta nama fail yang unik
    const fileName = `guest-photo-${Date.now()}.jpeg`;

    // Cipta objek data untuk dihantar ke Google Apps Script
    const payload = {
        imageData: base64ImageData,
        fileName: fileName,
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script lebih gemar text/plain untuk POST
            },
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Tunjuk mesej terima kasih jika berjaya
            cameraSection.classList.add('d-none');
            thankYouSection.classList.remove('d-none');
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Upload failed:', error);
        alert(`Gagal memuat naik: ${error.message}`);
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Muat Naik';
    }
});