import type { Preview } from '@storybook/svelte-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/lib/styles/index.css';

const preview: Preview = {
	decorators: [
		withThemeByDataAttribute({
			themes: { dark: 'dark', light: 'light' },
			defaultTheme: 'dark',
			attributeName: 'data-theme'
		})
	],
	parameters: {
		backgrounds: { disable: true },
		layout: 'padded'
	}
};

export default preview;
