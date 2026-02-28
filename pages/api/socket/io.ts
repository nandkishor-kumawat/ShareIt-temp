import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';
import { setIO } from '@/lib/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = '/api/socket/io';
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
    });

    // Store the io instance globally immediately
    setIO(io);
    res.socket.server.io = io;

    console.log('Socket.IO server initialized');

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      console.log('Total connected users:', io.engine.clientsCount);

      socket.on('share-text', (data) => {
        const textData = {
          id: Date.now() + '-text',
          type: 'text',
          content: data.content,
          timestamp: Date.now(),
          sender: socket.id.substring(0, 8)
        };

        io.emit('text-shared', textData);
      });

      socket.on('file-upload', (data) => {
        console.log('Received file upload, broadcasting:', data.name);
        io.emit('file-shared', { ...data, sender: socket.id.substring(0, 8) });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        console.log('Total connected users:', io.engine.clientsCount);
      });
    });
  } else {
    console.log('Socket.IO server already initialized');
  }

  res.end();
};

export default ioHandler;
