<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LogoMark from './LogoMark.svelte';

	const { Story } = defineMeta({
		title: 'Components/LogoMark',
		component: LogoMark,
		tags: ['autodocs'],
		args: { size: 'md' },
		argTypes: {
			size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
			children: { control: false }
		}
	});
</script>

<Story name="Default" />

<Story name="Small" args={{ size: 'sm' }} />

<Story name="Large" args={{ size: 'lg' }} />

<Story name="Extra large" args={{ size: 'xl' }} />

<Story name="With label" args={{ label: 'Study Atelier' }} />

<Story name="With content in the window" args={{ size: 'lg' }}>
	{#snippet template(args)}
		<LogoMark {...args}>
			<path d="M7 20V11A5 5 0 0 1 17 11V20Z" />
		</LogoMark>
	{/snippet}
</Story>
