import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'accent', 'elevated'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: 'Default Card',
    description: 'A standard brutalist card with a bold border and shadow.',
  },
};

export const Accent: Story = {
  args: {
    variant: 'accent',
    title: 'Accent Card',
    description: 'An accent card that demands attention.',
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    title: 'Elevated Card',
    description: 'Floating above the rest with extra shadow.',
  },
};

export const WithoutTitle: Story = {
  args: {
    children: <p className="text-body">Just some content without a title.</p>,
  },
};
