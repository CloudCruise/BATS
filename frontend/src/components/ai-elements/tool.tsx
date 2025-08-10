'use client';

import { useControllableState } from '@radix-ui/react-use-controllable-state';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { WrenchIcon, ChevronDownIcon, CheckCircleIcon, XCircleIcon, Loader2Icon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { createContext, memo, useContext } from 'react';
import { cn } from '@/lib/utils';

type ToolState = 'idle' | 'running' | 'completed' | 'error';

type ToolContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  state: ToolState;
};

const ToolContext = createContext<ToolContextValue | null>(null);

const useTool = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('Tool components must be used within Tool');
  }
  return context;
};

export type ToolProps = ComponentProps<typeof Collapsible> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  state?: ToolState;
};

export const Tool = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    state = 'idle',
    children,
    ...props
  }: ToolProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
    };

    return (
      <ToolContext.Provider value={{ isOpen, setIsOpen, state }}>
        <Collapsible
          className={cn('not-prose mb-4 border rounded-lg', className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ToolContext.Provider>
    );
  },
);

export type ToolHeaderProps = ComponentProps<typeof CollapsibleTrigger> & {
  toolType: string;
  state?: ToolState;
};

export const ToolHeader = memo(
  ({ className, toolType, state = 'idle', children, ...props }: ToolHeaderProps) => {
    const { isOpen } = useTool();

    const getStateIcon = () => {
      switch (state) {
        case 'running':
          return <Loader2Icon className="size-4 animate-spin text-blue-500" />;
        case 'completed':
          return <CheckCircleIcon className="size-4 text-green-500" />;
        case 'error':
          return <XCircleIcon className="size-4 text-red-500" />;
        default:
          return <WrenchIcon className="size-4 text-muted-foreground" />;
      }
    };

    const getStateBadge = () => {
      switch (state) {
        case 'running':
          return <Badge variant="secondary" className="text-blue-600 bg-blue-50">Running</Badge>;
        case 'completed':
          return <Badge variant="secondary" className="text-green-600 bg-green-50">Completed</Badge>;
        case 'error':
          return <Badge variant="destructive">Error</Badge>;
        default:
          return <Badge variant="outline">Idle</Badge>;
      }
    };

    return (
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50',
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            <div className="flex items-center gap-2">
              {getStateIcon()}
              <span className="font-mono text-sm">{toolType}</span>
              {getStateBadge()}
            </div>
            <ChevronDownIcon
              className={cn(
                'size-4 text-muted-foreground transition-transform',
                isOpen ? 'rotate-180' : 'rotate-0',
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  },
);

export type ToolContentProps = ComponentProps<'div'>;

export const ToolContent = memo(
  ({ className, children, ...props }: ToolContentProps) => (
    <CollapsibleContent
      className={cn(
        'border-t bg-muted/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    >
      <div className="p-3 space-y-3">{children}</div>
    </CollapsibleContent>
  ),
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: Record<string, unknown> | string | number | boolean | null;
};

export const ToolInput = memo(
  ({ className, input, ...props }: ToolInputProps) => (
    <div className={cn('space-y-1', className)} {...props}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Input
      </div>
      <div className="bg-background rounded p-2 text-xs font-mono">
        <pre className="whitespace-pre-wrap break-words">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
    </div>
  ),
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output?: React.ReactNode;
  errorText?: string;
};

export const ToolOutput = memo(
  ({ className, output, errorText, ...props }: ToolOutputProps) => {
    if (errorText) {
      return (
        <div className={cn('space-y-1', className)} {...props}>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Error
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
            {errorText}
          </div>
        </div>
      );
    }

    if (!output) return null;

    return (
      <div className={cn('space-y-1', className)} {...props}>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Output
        </div>
        <div className="bg-background rounded p-2 text-xs">
          {typeof output === 'string' ? (
            <pre className="whitespace-pre-wrap break-words font-mono">
              {output}
            </pre>
          ) : (
            output
          )}
        </div>
      </div>
    );
  },
);

Tool.displayName = 'Tool';
ToolHeader.displayName = 'ToolHeader';
ToolContent.displayName = 'ToolContent';
ToolInput.displayName = 'ToolInput';
ToolOutput.displayName = 'ToolOutput';
