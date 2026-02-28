import { useEffect, RefObject } from 'react';
import { Socket } from 'socket.io-client';

interface UseClipboardPasteOptions {
  socket: Socket | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onFilesPasted: (files: FileList) => void;
}

export function useClipboardPaste({ socket, textareaRef, onFilesPasted }: UseClipboardPasteOptions) {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
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
        onFilesPasted(dataTransfer.files);

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

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [socket, textareaRef, onFilesPasted]);
}
