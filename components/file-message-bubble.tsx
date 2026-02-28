'use client';

import { FileMessage } from '@/types/message';
import { formatTimestamp, formatFileSize, base64ToBlob, copyImageToClipboard, downloadFile } from '@/lib/chat-utils';
import { Copy, Download } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface FileMessageBubbleProps {
  message: FileMessage;
  isSent: boolean;
}

export const FileMessageBubble = ({ message, isSent }: FileMessageBubbleProps) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const isImage = message.type && message.type.startsWith('image/');

  useEffect(() => {
    const blob = base64ToBlob(message.data, message.type);
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [message.data, message.type]);

  const handleCopyImage = async () => {
    const success = await copyImageToClipboard(blobUrl);
    if (success) {
      toast.success('Image copied!');
    } else {
      toast.error('Failed to copy image');
    }
  };

  const handleDownload = () => {
    downloadFile(blobUrl, message.name);
    toast.success('Downloading...');
  };

  if (isImage) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-75 rounded-lg overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-200 ${isSent ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'
          }`}>
          <div className="relative w-full">
            {blobUrl && (
              <img
                src={blobUrl}
                alt={message.name}
                className="w-full h-auto rounded-t-lg"
              />
            )}
          </div>
          <div className="flex gap-2 p-2 border-t border-black/5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleCopyImage}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>
          <div className="px-3 pb-2 text-xs text-[#667781]">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  const fileExt = message.name.split('.').pop()?.toUpperCase().substring(0, 4) || 'FILE';

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[65%] rounded-lg overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-200 ${isSent ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'
        }`}>
        <div className="flex items-center gap-3 p-3">
          <div className="w-12 h-12 bg-[#075E54] rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
            {fileExt}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-[#303030] truncate">
              {message.name}
            </div>
            <div className="text-xs text-[#667781]">
              {formatFileSize(message.size)}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-2 border-t border-black/5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
        <div className="px-3 pb-2 text-xs text-[#667781]">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
