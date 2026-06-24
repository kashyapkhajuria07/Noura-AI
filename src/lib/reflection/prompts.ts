import type { Prompt } from './types';

export const PROMPTS: Prompt[] = [
  { id: 'p01', category: 'energy', text: "What's draining your energy right now?" },
  {
    id: 'p02',
    category: 'energy',
    text: 'When did you feel most tired today, and what triggered it?',
  },
  { id: 'p03', category: 'energy', text: 'What gave you energy this week?' },
  { id: 'p04', category: 'energy', text: 'Describe a moment today when you felt overwhelmed.' },
  {
    id: 'p05',
    category: 'energy',
    text: 'What is one thing you can remove from your plate tomorrow?',
  },
  { id: 'p06', category: 'gratitude', text: 'What went well today?' },
  {
    id: 'p07',
    category: 'gratitude',
    text: 'Name three small things you are grateful for right now.',
  },
  { id: 'p08', category: 'gratitude', text: 'Who or what made you smile today?' },
  {
    id: 'p09',
    category: 'gratitude',
    text: 'What is something kind someone did for you recently?',
  },
  {
    id: 'p10',
    category: 'gratitude',
    text: 'What part of your day would you relive if you could?',
  },
  { id: 'p11', category: 'reflection', text: 'What would you tell your past self one year ago?' },
  {
    id: 'p12',
    category: 'reflection',
    text: 'What is a mistake you made that taught you something?',
  },
  { id: 'p13', category: 'reflection', text: 'How do you feel about the person you are becoming?' },
  {
    id: 'p14',
    category: 'reflection',
    text: 'What is something you need to forgive yourself for?',
  },
  {
    id: 'p15',
    category: 'reflection',
    text: 'If your best friend wrote about your day, what would they say?',
  },
  { id: 'p16', category: 'cbt', text: 'What negative thought is repeating in your mind?' },
  { id: 'p17', category: 'cbt', text: 'What evidence do you have that this thought is true?' },
  { id: 'p18', category: 'cbt', text: 'What would you say to a friend who had this thought?' },
  { id: 'p19', category: 'cbt', text: 'Is this thought helpful? What could you think instead?' },
  {
    id: 'p20',
    category: 'cbt',
    text: 'What is the worst that could happen, and how likely is it?',
  },
  {
    id: 'p21',
    category: 'goals',
    text: "What's one small thing you can do tomorrow to feel better?",
  },
  {
    id: 'p22',
    category: 'goals',
    text: 'What is one academic goal you want to achieve this week?',
  },
  {
    id: 'p23',
    category: 'goals',
    text: 'What is a habit you want to build, and what is the smallest first step?',
  },
  {
    id: 'p24',
    category: 'goals',
    text: 'How will you celebrate when you finish your next big task?',
  },
  {
    id: 'p25',
    category: 'goals',
    text: 'What boundary do you need to set to protect your well-being?',
  },
];

export function getPromptsByCategory(category: Prompt['category']): Prompt[] {
  return PROMPTS.filter((p) => p.category === category);
}

export function getPromptById(id: string): Prompt | undefined {
  return PROMPTS.find((p) => p.id === id);
}

export function getRandomPrompt(): Prompt {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}
