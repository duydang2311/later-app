<script lang="ts">
	import { useRuntime } from '$lib/services/runtime';
	import { applyTheme, isDarkColorScheme } from '$lib/utils';
	import { Laptop, Moon, Sun } from '@lucide/svelte';

	const { theme, colorScheme } = useRuntime();

	const onClick = () => {
		colorScheme.current =
			colorScheme.current === 'light'
				? 'dark'
				: colorScheme.current === 'dark'
					? 'system'
					: 'light';
		localStorage.setItem('theme', colorScheme.current);

		const dark = isDarkColorScheme(colorScheme.current);
		if (dark) {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.removeAttribute('data-theme');
		}
		if (theme.current) {
			applyTheme(theme.current, dark);
		}
	};
</script>

<button type="button" onclick={onClick}>
	{#if colorScheme.current === 'light'}
		<Sun class="w-5 h-5" />
	{:else if colorScheme.current === 'dark'}
		<Moon class="w-5 h-5" />
	{:else}
		<Laptop class="w-5 h-5" />
	{/if}
</button>
