<script lang="ts">
	import './+layout.css';

	import { browser } from '$app/environment';
	import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
	import { createRef } from '$lib/runes/ref.svelte';
	import { createIndexedDb } from '$lib/services/db';
	import { applyTheme as __applyTheme } from '@material/material-color-utilities';
	import { setRuntime } from '$lib/services/runtime';
	import {
		applyTheme,
		generateThemeFromArgb,
		getDominantArgb,
		getUserPreferredColorScheme,
		isDarkColorScheme,
	} from '$lib/utils';
	import type { Theme } from '@material/material-color-utilities';
	import { onMount, type Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	const scrollEl = createRef<HTMLElement>();
	const theme = createRef<Theme>();
	const colorScheme = createRef<'light' | 'dark' | 'system'>(
		browser ? getUserPreferredColorScheme() : 'system',
	);
	const db = createIndexedDb();
	const runtime = setRuntime({
		db,
		scrollEl,
		theme,
		colorScheme,
	});
	let src = $state.raw<string>();

	if (browser && isDarkColorScheme(colorScheme.current)) {
		document.documentElement.setAttribute('data-theme', 'dark');
	}

	onMount(() => {
		(async () => {
			const entry = await runtime.db.get<string>('preferences', 'theme');
			if (entry) {
				theme.current = JSON.parse(entry.value);
				applyTheme(theme.current!, isDarkColorScheme(colorScheme.current));
			}
		})();
		(async () => {
			const entry = await runtime.db.get<File>('preferences', 'bg');
			if (entry) {
				src = URL.createObjectURL(entry.value);
			}
		})();
		return () => {
			if (src) {
				URL.revokeObjectURL(src);
			}
		};
	});

	$effect(() => {
		if (colorScheme.current !== 'system') {
			return;
		}

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = (e: MediaQueryListEvent) => {
			const dark = e.matches;
			if (dark) {
				document.documentElement.setAttribute('data-theme', 'dark');
			} else {
				document.documentElement.removeAttribute('data-theme');
			}
			if (theme.current) {
				applyTheme(theme.current, dark);
			}
		};
		media.addEventListener('change', handler);
		return () => {
			media.removeEventListener('change', handler);
		};
	});
</script>

{#if src}
	<img {src} alt="Background" class="fixed inset-0 w-full h-full object-cover object-center" />
{/if}
<div class="fixed inset-0 bg-base/95 dark:bg-base/80 backdrop-blur"></div>
<div class="fixed inset-0 bg-radial from-transparent to-primary/20 from-70% dark:hidden"></div>
<div
	bind:this={scrollEl.current}
	role="region"
	aria-label="File drop zone"
	class="relative w-[100dvw] h-[100dvh] flex flex-col overflow-auto"
	ondrop={(e) => {
		e.preventDefault();
		if (!e.dataTransfer) {
			return;
		}

		const item = [...e.dataTransfer.items].find(
			(item) => item.kind === 'file' && item.type.includes('image'),
		);
		const file = item?.getAsFile();
		if (!file) {
			return;
		}

		if (src) {
			URL.revokeObjectURL(src);
		}

		const img = new Image();
		src = img.src = URL.createObjectURL(file);
		runtime.db
			.put('preferences', {
				id: 'bg',
				value: file,
			})
			.catch(console.error);
		img.onload = () => {
			const argb = getDominantArgb(img);
			theme.current = generateThemeFromArgb(argb);
			runtime.db
				.put('preferences', {
					id: 'theme',
					value: JSON.stringify(theme.current),
				})
				.catch(console.error);
			applyTheme(theme.current, isDarkColorScheme(colorScheme.current));
			img.remove();
		};
	}}
	ondragover={(e) => {
		if (e.dataTransfer == null) {
			return;
		}

		e.preventDefault();
		for (let i = 0; i < e.dataTransfer.items.length; ++i) {
			if (
				e.dataTransfer.items[i].kind === 'file' &&
				e.dataTransfer.items[i].type.includes('image')
			) {
				e.dataTransfer.dropEffect = 'copy';
				return;
			}
		}
		e.dataTransfer.dropEffect = 'none';
	}}
>
	<div class="relative flex-1 max-h-full flex flex-col">
		<div class="flex justify-between p-4">
			<span class="font-playful lowercase font-medium text-2xl">Later</span>
			<ThemeSwitch />
		</div>
		{@render children()}
	</div>
</div>
