import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const setIO = (ioInstance: SocketIOServer) => {
  io = ioInstance;
};

export const getIO = () => {
  return io;
};
