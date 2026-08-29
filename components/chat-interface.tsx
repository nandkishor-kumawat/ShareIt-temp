'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { TextMessage, FileMessage } from '@/types/message';
import { TextMessageBubble } from './text-message-bubble';
import { FileMessageBubble } from './file-message-bubble';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Paperclip, Send } from 'lucide-react';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { useClipboardPaste } from '@/lib/use-clipboard-paste';

// Each base64 chunk is ~256 KB — well within the 512 KB server limit
const CHUNK_SIZE = 256 * 1024; // bytes of base64 text per chunk

interface UploadProgress {
  name: string;
  sentChunks: number;
  totalChunks: number;
}

export const ChatInterface = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<(TextMessage | FileMessage)[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!socket) return;

    // Per-transfer reassembly buffers for incoming files
    const incomingTransfers = new Map<string, {
      name: string; size: number; type: string; sender: string;
      total: number; chunks: (string | null)[]; receivedCount: number;
    }>();

    socket.on('text-shared', (data: TextMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('file-chunk-broadcast', (payload: {
      transferId: string; name: string; size: number; type: string;
      sender: string; index: number; total: number; chunk: string;
    }) => {
      const { transferId, name, size, type, sender, index, total, chunk } = payload;

      if (!incomingTransfers.has(transferId)) {
        incomingTransfers.set(transferId, {
          name, size, type, sender, total,
          chunks: new Array(total).fill(null),
          receivedCount: 0,
        });
      }

      const buf = incomingTransfers.get(transferId)!;
      if (buf.chunks[index] === null) {
        buf.chunks[index] = chunk;
        buf.receivedCount++;
      }

      if (buf.receivedCount === buf.total) {
        const fileMessage: FileMessage = {
          id: transferId,
          name: buf.name,
          size: buf.size,
          type: buf.type,
          data: buf.chunks.join(''),
          timestamp: Date.now(),
          sender: buf.sender,
        };
        setMessages((prev) => [...prev, fileMessage]);
        incomingTransfers.delete(transferId);
      }
    });

    return () => {
      socket.off('text-shared');
      socket.off('file-chunk-broadcast');
      incomingTransfers.clear();
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    const text = inputValue.trim();
    if (text && socket) {
      console.log('Sending message:', text);
      socket.emit('share-text', { content: text });
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } else {
      console.log('Cannot send - text:', !!text, 'socket:', !!socket);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.currentTarget.value.trim()) handleSendMessage();
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !socket) return;

    for (const file of Array.from(files)) {
      try {
        // Read entire file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // strip "data:<mime>;base64," prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const transferId = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

        setUploadProgress({ name: file.name, sentChunks: 0, totalChunks });

        for (let i = 0; i < totalChunks; i++) {
          const chunk = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

          // Register ack listener BEFORE emitting to avoid missing a fast response
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              socket.off('chunk-ack', onAck);
              reject(new Error(`Chunk ${i} ack timed out`));
            }, 15_000);

            function onAck({ transferId: ackId, index }: { transferId: string; index: number }) {
              if (ackId === transferId && index === i) {
                clearTimeout(timeout);
                socket.off('chunk-ack', onAck);
                resolve();
              }
            }

            socket.on('chunk-ack', onAck);

            socket.emit('file-chunk', {
              transferId,
              name: file.name,
              size: file.size,
              type: file.type,
              index: i,
              total: totalChunks,
              chunk,
            });
          });

          setUploadProgress({ name: file.name, sentChunks: i + 1, totalChunks });
        }

        setUploadProgress(null);
        toast.success('File shared successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(null);
        toast.error('Failed to share file');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  useClipboardPaste({ socket, textareaRef, onFilesPasted: handleFileUpload });

  useEffect(() => {
    const onkeydown = (e: KeyboardEvent) => {
      if (document.activeElement !== textareaRef.current && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onkeydown);
    return () => {
      window.removeEventListener('keydown', onkeydown);
    };
  }, []);
  console.log(messages)
  return (
    <div
      className="flex flex-col h-screen max-w-6xl mx-auto bg-[#ECE5DD]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="bg-[#075E54] text-white p-4 shadow-md z-10">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-base font-medium">ShareIt</h1>
            <p className="text-sm opacity-80 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#25D366] animate-pulse' : 'bg-gray-400'}`} />
              {isConnected ? 'online' : 'Connecting...'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-5 space-y-2 ${isDragging ? 'bg-[#25D366]/10 border-4 border-dashed border-[#25D366]' : ''
          }`}
        style={{
          backgroundImage: isDragging ? 'none' : 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {messages.length === 0 && (
          <Card className="mx-auto my-12 max-w-sm bg-white/90 p-8 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-[#303030] mb-2">Share securely</h3>
            <p className="text-sm text-[#667781] mb-2">
              Messages and files are temporarily shared with connected users only.
            </p>
            <p className="text-xs text-[#667781] opacity-80">
              Nothing is saved to disk.
            </p>
          </Card>
        )}

        {messages.map((message) => {
          const isSent = 'sender' in message && socket?.id?.startsWith(message.sender);
          if ('content' in message) {
            return <TextMessageBubble key={message.id} message={message} isSent={!!isSent} />;
          } else {
            return <FileMessageBubble key={message.id} message={message} isSent={!!isSent} />;
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F0F0] p-4 border-t border-[#D1D7DB]">
        {uploadProgress && (
          <div className="mb-2 px-1">
            <div className="flex justify-between text-xs text-[#667781] mb-1">
              <span className="truncate max-w-[70%]">Sending {uploadProgress.name}…</span>
              <span>{Math.round((uploadProgress.sentChunks / uploadProgress.totalChunks) * 100)}%</span>
            </div>
            <div className="h-1 rounded-full bg-[#D1D7DB] overflow-hidden">
              <div
                className="h-full bg-[#25D366] rounded-full transition-all duration-200"
                style={{ width: `${(uploadProgress.sentChunks / uploadProgress.totalChunks) * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 bg-white rounded-[24px] px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-[#667781] hover:text-[#303030] shrink-0 h-9 w-9 p-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
            disabled={!!uploadProgress}
          >
            <Paperclip className="h-6 w-6" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 min-h-[24px] max-h-[100px] text-[15px] bg-transparent px-0 py-2 leading-5"
            rows={1}
          />

          <Button
            variant="ghost"
            size="icon"
            className="text-[#128C7E] hover:text-[#075E54] shrink-0 hover:scale-110 transition-transform h-9 w-9 p-0"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            <Send className="h-6 w-6 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );
};
