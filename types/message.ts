export interface TextMessage {
  id: string;
  type: 'text';
  content: string;
  timestamp: number;
  sender: string;
}

export interface FileMessage {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
  timestamp: number;
  sender: string;
}

/** Shown in the message list while a file is still being uploaded */
export interface PendingFileMessage {
  id: string;
  pending: true;
  name: string;
  size: number;
  fileType: string;
  sentChunks: number;
  totalChunks: number;
  timestamp: number;
}

export type Message = TextMessage | FileMessage | PendingFileMessage;
