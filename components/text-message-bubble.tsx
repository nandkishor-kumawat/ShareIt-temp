'use client';

import { TextMessage } from '@/types/message';
import { formatTimestamp, copyTextToClipboard } from '@/lib/chat-utils';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface TextMessageBubbleProps {
  message: TextMessage;
  isSent: boolean;
}

export const TextMessageBubble = ({ message, isSent }: TextMessageBubbleProps) => {
  const handleCopy = async () => {
    const success = await copyTextToClipboard(message.content);
    if (success) {
      toast.success('Text copied!');
    } else {
      toast.error('Failed to copy text');
    }
  };

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[65%] rounded-lg p-3 shadow-sm animate-in slide-in-from-bottom-2 duration-200 ${isSent
          ? 'bg-[#DCF8C6] rounded-tr-none'
          : 'bg-white rounded-tl-none'
        }`}>
        <div className="text-sm text-[#303030] whitespace-pre-wrap wrap-break-word">
          {message.content}
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-[#667781]">
          <span>{formatTimestamp(message.timestamp)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-60 hover:opacity-100"
            onClick={handleCopy}
            title="Copy"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
