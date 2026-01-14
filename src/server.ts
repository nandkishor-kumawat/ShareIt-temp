import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

// Configure multer for memory storage (temporary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// File upload endpoint (temporary, in-memory)
app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileData = {
    id: Date.now() + '-' + Math.round(Math.random() * 1E9),
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    data: req.file.buffer.toString('base64'),
    timestamp: Date.now()
  };

  // Broadcast to all currently connected clients only
  io.emit('file-shared', fileData);

  res.json({ success: true });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  console.log('Total connected users:', io.engine.clientsCount);

  // Handle text sharing - broadcast to all connected clients
  socket.on('share-text', (data) => {
    const textData = {
      id: Date.now() + '-text',
      type: 'text',
      content: data.content,
      timestamp: Date.now(),
      sender: socket.id.substring(0, 8)
    };

    // Broadcast to all connected clients
    io.emit('text-shared', textData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    console.log('Total connected users:', io.engine.clientsCount);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
