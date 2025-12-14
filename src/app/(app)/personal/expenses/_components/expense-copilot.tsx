"use client";

import { useChat } from 'ai/react';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Bot,
  User,
  Loader2,
  Send,
  Paperclip,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatRequestOptions, Message } from 'ai';

type Attachment = { name?: string; contentType?: string; url?: string };
type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  state: 'call' | 'result';
  result?: unknown;
};
type ChatMessage = Message & {
  experimental_attachments?: Attachment[];
  toolInvocations?: ToolInvocation[];
};

interface ExpenseCopilotProps {
  onExpenseSaved?: () => void;
}

export function ExpenseCopilot({ onExpenseSaved }: ExpenseCopilotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
  } = useChat({
    api: '/api/chat/expense-agent',
    onFinish: (message) => {
      console.log('Message finished:', message);

      // Check if expense was saved (commit tool was called)
      if (message.content.toLowerCase().includes('expense saved') ||
          message.content.toLowerCase().includes('successfully saved')) {
        onExpenseSaved?.();
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    if (validFiles.length > 0) {
      // Convert files to base64 data URLs
      const filePromises = validFiles.map((file) => {
        return new Promise<{ name: string; contentType: string; url: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              contentType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then((attachments) => {
        setAttachedFiles((prev) => [...prev, ...validFiles]);

        // Auto-send message with attachment
        setTimeout(() => {
          handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>, {
            experimental_attachments: attachments,
          } as ChatRequestOptions);
        }, 100);
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() && attachedFiles.length === 0) return;

    // Send with attachments if any
    if (attachedFiles.length > 0) {
      // Convert files to base64 data URLs
      const filePromises = attachedFiles.map((file) => {
        return new Promise<{ name: string; contentType: string; url: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              contentType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then((attachments) => {
        handleSubmit(e, {
          experimental_attachments: attachments,
        } as ChatRequestOptions);
        setAttachedFiles([]);
      });
    } else {
      handleSubmit(e);
    }
  };

  return (
    <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50/30 to-white">
      <CardHeader className="border-b border-primary-100">
        <CardTitle className="flex items-center gap-2 text-primary-900">
          <Sparkles className="h-5 w-5" />
          Bizflow Copilot
          <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-normal text-primary-700">
            AI-Powered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages area */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="rounded-full bg-primary-100 p-4">
                <Bot className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-ink-900">
                  Hi! I&apos;m your expense assistant
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Upload a receipt or describe an expense, and I&apos;ll help you record it
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload Receipt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput('Add a manual expense')}
                >
                  Manual Entry
                </Button>
              </div>
            </div>
          )}

          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                )}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message content */}
              <div
                className={cn(
                  'flex-1 space-y-2 overflow-hidden',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'inline-block rounded-lg px-4 py-2 max-w-[85%]',
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  )}
                >
                  {/* Handle tool calls in message */}
                  {(message as ChatMessage).toolInvocations?.map((toolInvocation) => (
                    <div key={toolInvocation.toolCallId} className="text-xs opacity-75 mb-2">
                      <Loader2 className="h-3 w-3 inline-block animate-spin mr-1" />
                      {toolInvocation.state === 'call' && `Calling ${toolInvocation.toolName}...`}
                      {toolInvocation.state === 'result' && `✓ ${toolInvocation.toolName} complete`}
                    </div>
                  ))}

                  {/* Message text with markdown-like formatting */}
                  <div className="prose prose-sm max-w-none">
                    {/* Vercel AI SDK may return string or array content; normalize to string for rendering */}
                    {(() => {
                      const content = message.content as unknown;
                      if (typeof content === 'string') return content;
                      if (Array.isArray(content)) {
                        return content
                          .map((block) => {
                            if (typeof block === 'string') return block;
                            if (typeof block === 'object' && block) {
                              if ('text' in block && typeof (block as { text?: string }).text === 'string') {
                                return (block as { text: string }).text;
                              }
                              if ('content' in block && typeof (block as { content?: string }).content === 'string') {
                                return (block as { content: string }).content;
                              }
                            }
                            return '';
                          })
                          .join('\n');
                      }
                      return '';
                    })()
                      .split('\n')
                      .map((line, i) => {
                      // Detect headings
                      if (line.startsWith('## ')) {
                        return (
                          <h3 key={i} className="font-semibold mt-2 mb-1">
                            {line.replace('## ', '')}
                          </h3>
                        );
                      }
                      // Detect bullet points
                      if (line.trim().startsWith('- ')) {
                        return (
                          <li key={i} className="ml-4">
                            {line.replace(/^- /, '')}
                          </li>
                        );
                      }
                      // Detect [DRAFT] sections
                      if (line.includes('[DRAFT]')) {
                        return (
                          <div key={i} className="bg-white/50 rounded p-2 mt-2 mb-2 font-medium">
                            {line}
                          </div>
                        );
                      }
                      // Detect warnings
                      if (line.toLowerCase().includes('warning')) {
                        return (
                          <div key={i} className="flex items-start gap-1 text-amber-700 text-xs mt-1">
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            {line}
                          </div>
                        );
                      }
                      // Regular paragraph
                      return line.trim() ? <p key={i}>{line}</p> : null;
                    })}
                  </div>

                  {/* Show attachments for user messages */}
                  {message.role === 'user' &&
                    (message as ChatMessage).experimental_attachments?.map(
                      (attachment, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 mt-2 text-xs bg-white/20 rounded px-2 py-1"
                        >
                          <Paperclip className="h-3 w-3" />
                          {attachment.name}
                        </div>
                      )
                    )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
              </div>
              <div className="flex-1">
                <div className="inline-block rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  Thinking...
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error.message}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reload()}
                  className="mt-2 text-red-700 hover:text-red-800"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 bg-white p-4">
          {/* Attached files preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                >
                  <Paperclip className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-700">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message or upload a receipt..."
              disabled={isLoading}
              className="flex-1"
            />

            {isLoading ? (
              <Button type="button" variant="outline" size="icon" onClick={stop}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim() && attachedFiles.length === 0}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>

          <p className="mt-2 text-xs text-slate-500">
            Upload receipts or describe expenses. I&apos;ll extract details and create drafts for your review.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
