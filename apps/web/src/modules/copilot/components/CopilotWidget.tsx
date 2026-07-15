import { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Loader2, Send, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';
import { httpClient } from '@/api/http.client';

interface Message { role: 'user' | 'assistant'; content: string; actionPath?: string }
interface CopilotResponse { answer: string; action?: { type: string; params?: { path?: string } }; latencyMs?: number }

const SUGGESTIONS: Record<string, string[]> = {
  '/produtos': ['Quais produtos têm estoque baixo?', 'Quais produtos têm maior margem?'],
  '/clientes': ['Qual cliente compra mais?', 'Clientes com risco de abandono'],
  '/financeiro': ['Qual meu saldo atual?', 'Qual foi meu lucro este mês?'],
  '/fiscal': ['Notas rejeitadas hoje', 'Status do certificado digital'],
  '/oficina': ['Ordens de serviço em aberto', 'Qual mecânico é mais produtivo?'],
  '/bi': ['Quanto vendi este mês?', 'Qual fornecedor entrega mais rápido?'],
};

/**
 * CopilotWidget — IA Copilot flutuante integrado em todas as telas (Sprint 16).
 * Comandos em linguagem natural com verificação de permissões no backend.
 */
export function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const cmd = useMutation({
    mutationFn: (command: string) =>
      httpClient.post<CopilotResponse>('/copilot/command', { command, screen: location.pathname }),
    onSuccess: (data) => {
      const actionPath = data.action?.params?.path;
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, actionPath }]);
      if (actionPath) setTimeout(() => { window.location.href = actionPath; }, 1200);
    },
    onError: () => setMessages((prev) => [...prev, { role: 'assistant', content: 'Não foi possível processar o comando. Tente novamente.' }]),
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, cmd.isPending]);

  const suggestions = SUGGESTIONS[location.pathname] ?? ['Quanto vendi hoje?', 'Quais produtos vão acabar?', 'Abrir PDV'];

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    cmd.mutate(text);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105" aria-label="Copilot IA">
        <Sparkles className="size-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl" style={{ width: 340, height: 480 }}>
      <div className="flex items-center justify-between bg-primary px-3 py-2 text-primary-foreground">
        <div className="flex items-center gap-2"><Bot className="size-4" /><span className="text-sm font-medium">Copilot IA</span></div>
        <button onClick={() => setOpen(false)}><ChevronDown className="size-4 opacity-80" /></button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Como posso ajudar?</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-md border border-border px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted">{s}</button>
            ))}
          </div>
        ) : messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && <Bot className="mr-1.5 mt-0.5 size-4 shrink-0 text-primary" />}
            <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 text-xs ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {msg.content}
              {msg.actionPath && <p className="mt-0.5 text-xs opacity-60">Redirecionando...</p>}
            </div>
          </div>
        ))}
        {cmd.isPending && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Processando...</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-1.5 border-t border-border p-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite um comando..." disabled={cmd.isPending} className="h-7 flex-1 text-xs" />
        <Button type="submit" size="sm" disabled={!input.trim() || cmd.isPending}><Send className="size-3.5" /></Button>
      </form>
    </div>
  );
}
