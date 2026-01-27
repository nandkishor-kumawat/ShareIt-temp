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

export const ChatInterface = () => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<(TextMessage | FileMessage)[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('text-shared', (data: TextMessage) => {
      console.log('Received text:', data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on('file-shared', (data: FileMessage) => {
      console.log('Received file:', data.name);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('text-shared');
      socket.off('file-shared');
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
      handleSendMessage();
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !socket) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        console.log('Uploading file:', file.name);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        console.log('Upload response:', result);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        // Emit the file data via socket so all clients receive it
        if (result.fileData) {
          socket.emit('file-upload', result.fileData);
        }

        toast.success('File shared successfully!');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload file');
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

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasFile = false;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        hasFile = true;
        const file = items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    // Handle file paste
    if (files.length > 0) {
      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      handleFileUpload(dataTransfer.files);

      // If pasting files into the textarea, prevent default text paste
      if (document.activeElement === textareaRef.current) {
        e.preventDefault();
      }
    }
    // If not focused on textarea and pasting text, send it directly
    else if (document.activeElement !== textareaRef.current) {
      const text = e.clipboardData?.getData('text');
      if (text && socket) {
        e.preventDefault();
        socket.emit('share-text', { content: text });
      }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [socket]);

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
          if ('content' in message) {
            return <TextMessageBubble key={message.id} message={message} />;
          } else {
            return <FileMessageBubble key={message.id} message={message} />;
          }
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F0F0] p-4 border-t border-[#D1D7DB]">
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
