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

// Each chunk is 256 KB of base64 text. 512 KB gives comfortable headroom for the JSON envelope.
const MAX_BUFFER_SIZE = 100 * 1024 * 1024; // 100 MB

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const path = '/api/socket/io';
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
      addTrailingSlash: false,
      maxHttpBufferSize: MAX_BUFFER_SIZE,
    });

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
          sender: socket.id.substring(0, 8),
        };
        io.emit('text-shared', textData);
      });

      // Relay each chunk directly to all clients — no server-side reassembly.
      // Each receiver accumulates chunks and reconstructs the file independently.
      socket.on(
        'file-chunk',
        (payload: {
          transferId: string;
          name: string;
          size: number;
          type: string;
          index: number;
          total: number;
          chunk: string;
          sender?: string;
        }) => {
          // Acknowledge to the sender so it can proceed to the next chunk
          socket.emit('chunk-ack', { transferId: payload.transferId, index: payload.index });

          // Broadcast the chunk (including sender id) to everyone
          io.emit('file-chunk-broadcast', {
            ...payload,
            sender: socket.id.substring(0, 8),
          });
        },
      );

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
