import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number'],
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Text: Story = {
  args: {
    label: 'Name',
    placeholder: 'Enter your name',
  },
};

export const Email: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
    placeholder: "Can't touch this",
  },
};

export const WithError: Story = {
  args: {
    label: 'With Error',
    error: 'This field is required',
    placeholder: 'Enter value',
  },
};

export const WithoutLabel: Story = {
  args: {
    placeholder: 'No label here',
  },
};
