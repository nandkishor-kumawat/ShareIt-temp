'use client';

import { PendingFileMessage } from '@/types/message';
import { formatFileSize, formatTimestamp } from '@/lib/chat-utils';

interface PendingFileBubbleProps {
  message: PendingFileMessage;
}

export const PendingFileBubble = ({ message }: PendingFileBubbleProps) => {
  const progress = message.totalChunks > 0
    ? Math.round((message.sentChunks / message.totalChunks) * 100)
    : 0;

  const fileExt = message.name.split('.').pop()?.toUpperCase().substring(0, 4) || 'FILE';
  const isImage = message.fileType.startsWith('image/');

  return (
    <div className="flex justify-end">
      <div className="max-w-[65%] rounded-lg overflow-hidden shadow-sm bg-[#DCF8C6] rounded-tr-none animate-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-3 p-3">
          {/* Icon */}
          <div className="relative w-12 h-12 shrink-0">
            <div className="w-12 h-12 bg-[#075E54] rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {isImage ? '🖼' : fileExt}
            </div>
            {/* Circular progress overlay */}
            <svg
              className="absolute inset-0 w-12 h-12 -rotate-90"
              viewBox="0 0 48 48"
            >
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="4"
              />
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="#25D366"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                className="transition-all duration-200"
              />
            </svg>
          </div>

          {/* File info + progress bar */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-[#303030] truncate">{message.name}</div>
            <div className="text-xs text-[#667781] mb-1.5">{formatFileSize(message.size)}</div>
            <div className="h-1 rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full bg-[#25D366] rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-[#667781] mt-1">{progress}%</div>
          </div>
        </div>

        <div className="px-3 pb-2 text-xs text-[#667781] text-right">
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
