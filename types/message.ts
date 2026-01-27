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
}

export type Message = TextMessage | FileMessage;
