'use client';

import type { ComponentProps } from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LoaderProps = ComponentProps<'div'>;

export const Loader = ({ className, ...props }: LoaderProps) => {
  return (
    <div className={cn('flex gap-3', className)} {...props}>
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-primary" />
      </div>
      <div className="text-sm text-muted-foreground pt-1">
        <div className="flex items-center gap-1">
          <span>Thinking</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

Loader.displayName = 'Loader';
