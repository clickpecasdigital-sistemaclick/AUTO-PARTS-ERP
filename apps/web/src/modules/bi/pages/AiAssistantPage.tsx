import { useState, useRef, useEffect } from 'react';
import { Bot, Clock, Loader2, Send, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAiQuery, useAiHistory } from '../services/bi.service';

const SUGGESTIONS = [
  'Quanto vendi hoje?',
  'Qual foi meu lucro este mês?',
  'Quais produtos vão acabar?',
  'Qual mecânico é mais produtivo?',
  'Qual cliente compra mais?',
  'Qual fornecedor entrega mais rápido?',
  'Qual é minha inadimplência atual?',
  'Qual foi meu ticket médio no mês?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  latencyMs?: number;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const aiQuery = useAiQuery();
  const { data: history } = useAiHistory();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiQuery.isPending]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: `u${Date.now()}`, role: 'user', content: text }]);
    setInput('');

    try {
      const result = await aiQuery.mutateAsync(text);
      setMessages((prev) => [...prev, { id: `a${Date.now()}`, role: 'assistant', content: result.answer, latencyMs: result.latencyMs }]);
    } catch {
      setMessages((prev) => [...prev, { id: `e${Date.now()}`, role: 'assistant', content: 'Não foi possível processar sua consulta. Tente novamente.' }]);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader title="Assistente IA" description="Consulte os dados do ERP em linguagem natural." />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex flex-1 flex-col gap-2 overflow-hidden">
          <Card className="flex-1 overflow-y-auto">
            <CardContent className="flex flex-col gap-3 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Sparkles className="size-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Pergunte qualquer coisa sobre os dados do seu ERP</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {SUGGESTIONS.map((s) => (
                      <Button key={s} variant="outline" size="sm" className="h-auto whitespace-normal py-2 text-left text-xs" onClick={() => sendMessage(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && <Bot className="mt-1 size-5 shrink-0 text-primary" />}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.latencyMs && <p className="mt-1 text-xs opacity-50">{msg.latencyMs}ms</p>}
                    </div>
                  </div>
                ))
              )}
              {aiQuery.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Consultando dados...
                </div>
              )}
              <div ref={bottomRef} />
            </CardContent>
          </Card>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Faça uma pergunta sobre os dados do ERP..." disabled={aiQuery.isPending} className="flex-1" />
            <Button type="submit" disabled={!input.trim() || aiQuery.isPending}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>

        {history && history.length > 0 && (
          <Card className="hidden w-64 overflow-y-auto lg:block">
            <CardContent className="p-3">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Clock className="size-3" /> Histórico
              </p>
              {history.slice(0, 15).map((h) => (
                <button key={h.id} onClick={() => sendMessage(h.query)} className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted">
                  {h.query}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
