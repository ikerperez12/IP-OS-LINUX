import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AIRequest {
  task: 'compose' | 'summarize' | 'code' | 'terminal' | 'context';
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AIResponse {
  text: string;
  provider?: string;
}

export const isAiConfigured = isSupabaseConfigured;

export async function invokeIPLinuxAI(request: AIRequest): Promise<AIResponse> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.functions.invoke<AIResponse>('iplinux-ai', {
    body: request,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.text) {
    throw new Error('iplinux-ai returned an empty response.');
  }

  return data;
}
