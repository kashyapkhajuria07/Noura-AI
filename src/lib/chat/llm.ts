const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';

const SYSTEM_PROMPT = `You are a supportive AI assistant for a student burnout detection system. Your tone must be warm, empathetic, and grounded in Cognitive Behavioral Therapy (CBT) principles.

Guidelines:
- Respond with short, supportive messages (2-4 sentences)
- Validate the student's feelings without judgment
- Offer practical, actionable suggestions when appropriate
- Never diagnose or prescribe medication
- If a student expresses suicidal thoughts or self-harm, gently encourage them to contact a crisis line
- Use a conversational, human tone — not clinical or robotic
- Suggest quick actions: breathing exercises, planning help, talking to someone
- Keep responses concise and focused on the student's stated concern`;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  quickReplies?: string[];
}

const QUICK_REPLIES: Record<string, string[]> = {
  default: ['Help me plan', 'Breathing exercise', 'Talk to someone', 'Not now'],
  planning: ['Morning routine', 'Study schedule', 'Break timer', 'Not now'],
  breathing: ['4-7-8 method', 'Box breathing', '5-4-3-2-1 grounding', 'Not now'],
};

export function getQuickReplies(context: string): string[] {
  const lower = context.toLowerCase();
  if (lower.includes('plan') || lower.includes('schedule') || lower.includes('organize')) {
    return QUICK_REPLIES.planning;
  }
  if (lower.includes('breath') || lower.includes('calm') || lower.includes('anxiet') || lower.includes('anxious') || lower.includes('stress')) {
    return QUICK_REPLIES.breathing;
  }
  return QUICK_REPLIES.default;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<LLMResponse> {
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: fullMessages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`LLM API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    if (!content) {
      throw new Error('Empty response from LLM');
    }

    return { content, quickReplies: getQuickReplies(content) };
  } catch (e) {
    console.warn('[LLM] API call failed, using fallback response:', e);
    return fallbackResponse(messages);
  }
}

export function fallbackResponse(messages: ChatMessage[]): LLMResponse {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = lastUser?.content?.toLowerCase() ?? '';

  if (text.includes('breath') || text.includes('calm') || text.includes('anxiety')) {
    return {
      content: "Take a slow breath in through your nose for 4 counts, hold for 4, and exhale through your mouth for 6. Repeat a few times. You've got this.",
      quickReplies: getQuickReplies('breathing'),
    };
  }
  if (text.includes('plan') || text.includes('schedule') || text.includes('organize')) {
    return {
      content: "Let's break it down. What's the one thing you need to do next? Start small — even 5 minutes of focused work can build momentum.",
      quickReplies: getQuickReplies('planning'),
    };
  }
  if (text.includes('talk') || text.includes('alone') || text.includes('help')) {
    return {
      content: "You're not alone in this. Your school likely has counseling services available. Would you like me to help you find the right contact?",
      quickReplies: getQuickReplies('default'),
    };
  }
  return {
    content: "I hear you. It's okay to feel this way. Let's take it one step at a time. What would be most helpful for you right now?",
    quickReplies: getQuickReplies('default'),
  };
}
