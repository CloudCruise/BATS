'use client';

import type { ComponentProps } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageProps = ComponentProps<'div'> & {
  from: 'user' | 'assistant' | 'system';
};

export const Message = ({ className, from, children, ...props }: MessageProps) => {
  return (
    <div className={cn('flex gap-3', className)} {...props}>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {from === 'user' ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>
      <div className="flex-1 pt-1">
        {children}
      </div>
    </div>
  );
};

export type MessageContentProps = ComponentProps<'div'>;

export const MessageContent = ({ className, children, ...props }: MessageContentProps) => {
  return (
    <div className={cn('text-sm text-foreground', className)} {...props}>
      {children}
    </div>
  );
};

Message.displayName = 'Message';
MessageContent.displayName = 'MessageContent';
