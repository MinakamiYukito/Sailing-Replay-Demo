function displayFileStatus() {
    const fileInput = document.getElementById('fileInput');
    const fileStatus = document.getElementById('fileStatus');
    const uploadButton = document.getElementById('uploadButton');
    
    if (fileInput.files.length > 0) {
        fileStatus.textContent = '1 file selected';
        uploadButton.disabled = false;
    } else {
        fileStatus.textContent = 'No file selected';
        uploadButton.disabled = true;
    }
}