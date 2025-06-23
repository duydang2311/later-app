<script lang="ts">
	import './+layout.css';

	import { onNavigate } from '$app/navigation';
	import { createRef } from '$lib/runes/ref.svelte';
	import { setRuntime } from '$lib/services/runtime';
	import {
		applyTheme,
		generateThemeFromArgb,
		getDominantArgb,
		isDarkColorScheme,
		logError,
	} from '$lib/utils';
	import { attempt } from '@duydang2311/attempt';
	import type { Theme } from '@material/material-color-utilities';
	import { onMount, type Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	const { data, children }: { data: LayoutData; children: Snippet } = $props();

	const scrollEl = createRef<HTMLElement>();
	const theme = createRef<Theme | undefined>(data.theme);
	const colorScheme = createRef<'light' | 'dark' | 'system'>(data.colorScheme);
	const runtime = setRuntime({
		db: data.db,
		scrollEl,
		theme,
		colorScheme,
		lastClickedTodoId: createRef<string>(),
	});
	let src = $state.raw<string | undefined>(data.bg ? URL.createObjectURL(data.bg) : undefined);

	if (isDarkColorScheme(colorScheme.current)) {
		document.documentElement.setAttribute('data-theme', 'dark');
	}
	if (data.theme) {
		applyTheme(data.theme, isDarkColorScheme(colorScheme.current));
	}

	onMount(() => {
		return () => {
			if (src) {
				URL.revokeObjectURL(src);
			}
		};
	});

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
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
	ondrop={async (e) => {
		e.preventDefault();
		if (!e.dataTransfer) {
			return;
		}

		const item = [...e.dataTransfer.items].find(
			(item) => item.kind === 'file' && item.type.includes('image')
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
		img.onload = async () => {
			const argb = getDominantArgb(img);
			theme.current = generateThemeFromArgb(argb);
			applyTheme(theme.current, isDarkColorScheme(colorScheme.current));

			const openTx = await runtime.db.transaction('preferences', 'readwrite');
			if (openTx.failed) {
				logError('Failed to open transaction for preferences')(openTx.error);
				return;
			}

			await Promise.all([
				attempt.async(() => openTx.data.store.put(JSON.stringify(theme.current), 'theme'))(
					logError('Failed to put theme in DB')
				),
				attempt.async(() => openTx.data.done)(
					logError('Failed to commit transaction for updating theme')
				),
			]);
			img.remove();
		};

		const openTx = await runtime.db.transaction('preferences', 'readwrite');
		if (openTx.failed) {
			logError('Failed to open transaction for preferences')(openTx.error);
			return;
		}

		await Promise.all([
			attempt.async(() => openTx.data.store.put(file, 'bg'))(
				logError('Failed to put background image in DB')
			),
			attempt.async(() => openTx.data.done)(
				logError('Failed to commit transaction for updating background image')
			),
		]);
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
		{@render children()}
	</div>
</div>
