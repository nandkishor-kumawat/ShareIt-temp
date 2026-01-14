# ShareIt - Real-time File & Text Sharing

A simple, elegant web application for sharing text, images, and files in real-time using WebSocket technology.

## Features

- 📝 **Text Sharing**: Share text instantly with copy functionality
- 🖼️ **Image Sharing**: Upload and share images with copy and download options
- 📁 **File Sharing**: Upload any file type with download capability
- 🎯 **Drag & Drop**: Easy file upload via drag and drop
- 📋 **Paste Support**: Paste files and images directly from clipboard
- ⚡ **Real-time**: All changes sync instantly across all connected clients
- 🎨 **Beautiful UI**: Modern, responsive design with smooth animations

## Installation

All dependencies are already installed via npm. The project includes:

- Express.js for the web server
- Socket.io for real-time communication
- Multer for file uploads
- TypeScript for type safety

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will start on http://localhost:3000

## How to Use

1. **Share Text**: Type or paste text in the textarea and click "Share Text"
2. **Share Files**:
   - Click "Choose Files" button
   - Drag and drop files onto the drop zone
   - Paste images directly (Ctrl+V / Cmd+V)
3. **Copy Content**: Click the "Copy" button on any text or image
4. **Download Files**: Click the "Download" button on files and images

## Project Structure

```
ShareIt/
├── src/
│   └── server.ts          # TypeScript server code
├── public/
│   ├── index.html         # Single-page application
│   ├── styles.css         # Styling
│   └── app.js            # Client-side JavaScript
├── dist/                  # Compiled JavaScript (generated)
├── uploads/               # Uploaded files storage (generated)
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript + HTML5 + CSS3

## Configuration

- Default port: 3000 (can be changed via PORT environment variable)
- File size limit: 50MB
- Files are stored in the `uploads/` directory

## Notes

- All shared items are stored in memory and will be lost on server restart
- For production use, consider adding persistent storage
- HTTPS is recommended for clipboard API features to work in all browsers
