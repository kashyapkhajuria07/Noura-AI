import type { Preview } from '@storybook/nextjs-vite';
import { inter, instrumentSans, departureMono } from '../src/lib/fonts';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <div className={`${inter.variable} ${instrumentSans.variable} ${departureMono.variable} font-sans`}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
