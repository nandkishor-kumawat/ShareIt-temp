// Connect to Socket.io server
const socket = io();

// DOM Elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const messagesArea = document.getElementById('messagesArea');
const userCount = document.getElementById('userCount');

let connectedUsers = 0;

// Auto-resize textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = messageInput.scrollHeight + 'px';
});

// Send message on Enter (Shift+Enter for new line)
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button click
sendBtn.addEventListener('click', sendMessage);

// Attach button click
attachBtn.addEventListener('click', () => {
  fileInput.click();
});

// File selection
fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = ''; // Reset input
});

// Drag and drop
document.body.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('drag-over');
});

document.body.addEventListener('dragleave', (e) => {
  if (e.target === document.body) {
    document.body.classList.remove('drag-over');
  }
});

document.body.addEventListener('drop', (e) => {
  e.preventDefault();
  document.body.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

// Paste functionality
document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  let hasFile = false;

  for (let item of items) {
    if (item.kind === 'file') {
      hasFile = true;
      const file = item.getAsFile();
      if (file) handleFiles([file]);
    }
  }

  // If pasting files into messageInput, prevent default text paste
  if (hasFile && document.activeElement === messageInput) {
    e.preventDefault();
  }
});

// Send message function
function sendMessage() {
  const text = messageInput.value.trim();
  if (text) {
    socket.emit('share-text', { content: text });
    messageInput.value = '';
    messageInput.style.height = 'auto';
  }
}

// Handle file uploads
async function handleFiles(files) {
  for (let file of files) {
    await uploadFile(file);
  }
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    showToast('File shared successfully!');
  } catch (error) {
    console.error('Upload error:', error);
    showToast('Failed to upload file');
  }
}

// Socket event handlers
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('text-shared', (data) => {
  addMessageToUI(data);
  scrollToBottom();
});

socket.on('file-shared', (data) => {
  addFileToUI(data);
  scrollToBottom();
});

socket.on('disconnect', () => {
  userCount.textContent = 'Disconnected';
});

// Update user count (simple estimate based on events)
socket.on('connect', () => {
  updateUserCount();
});

function updateUserCount() {
  // Simple display - in a real app, server would track this
  userCount.textContent = 'online';
}

// Add text message to UI
function addMessageToUI(data) {
  // Remove welcome message if it exists
  const welcome = messagesArea.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble sent';

  const timestamp = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.innerHTML = `
    <div class="message-content">${escapeHtml(data.content)}</div>
    <div class="message-footer">
      <span>${timestamp}</span>
      <button class="copy-btn-small" onclick="copyText(\`${escapeHtml(data.content).replace(/`/g, '\\`')}\`)" title="Copy">📋</button>
    </div>
  `;

  messagesArea.appendChild(bubble);
}

// Add file/image to UI
function addFileToUI(data) {
  // Remove welcome message if it exists
  const welcome = messagesArea.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble file-message sent';

  const timestamp = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isImage = data.type && data.type.startsWith('image/');

  // Convert base64 to blob URL
  const binaryString = atob(data.data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: data.type });
  const url = URL.createObjectURL(blob);

  if (isImage) {
    bubble.innerHTML = `
      <div class="image-content">
        <img src="${url}" alt="${data.name}" />
      </div>
      <div class="file-actions">
        <button class="action-btn" onclick="copyImageFromUrl('${url}')">📋 Copy</button>
        <button class="action-btn" onclick="downloadFromUrl('${url}', '${data.name}')">⬇️ Download</button>
      </div>
      <div class="message-footer" style="padding: 0 12px 8px;">
        <span>${timestamp}</span>
      </div>
    `;
  } else {
    const fileExt = data.name.split('.').pop().toUpperCase().substring(0, 4);
    bubble.innerHTML = `
      <div class="file-info-box">
        <div class="file-icon-box">${fileExt}</div>
        <div class="file-details-box">
          <div class="file-name-text">${data.name}</div>
          <div class="file-size-text">${formatFileSize(data.size)}</div>
        </div>
      </div>
      <div class="file-actions">
        <button class="action-btn" onclick="downloadFromUrl('${url}', '${data.name}')">⬇️ Download</button>
      </div>
      <div class="message-footer" style="padding: 0 12px 8px;">
        <span>${timestamp}</span>
      </div>
    `;
  }

  messagesArea.appendChild(bubble);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Copy text to clipboard
function copyText(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  const decodedText = textarea.value;

  navigator.clipboard.writeText(decodedText).then(() => {
    showToast('Text copied!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

// Copy image from URL
async function copyImageFromUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
    showToast('Image copied!');
  } catch (err) {
    console.error('Failed to copy image:', err);
    showToast('Failed to copy image');
  }
}

// Download file from URL
function downloadFromUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Downloading...');
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);
}

// Initialize
updateUserCount();
