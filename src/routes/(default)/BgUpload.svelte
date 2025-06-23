<script lang="ts">
	import { useRuntime } from '$lib/services/runtime';
	import {
		applyTheme,
		generateThemeFromArgb,
		getDominantArgb,
		isDarkColorScheme,
		logError,
	} from '$lib/utils';
	import { attempt } from '@duydang2311/attempt';
	import { ImageUp } from '@lucide/svelte';
	import type { EventHandler } from 'svelte/elements';

	const { db, theme, bgFile, colorScheme } = useRuntime();

	const onChange: EventHandler<Event, HTMLInputElement> = async (e) => {
		const file = e.currentTarget.files?.[0];
		if (!file) {
			return;
		}

		bgFile.current = file;

		const img = new Image();
		const objectUrl = URL.createObjectURL(file);
		img.src = objectUrl;
		img.onload = async () => {
			const argb = getDominantArgb(img);
			const newTheme = generateThemeFromArgb(argb);
			theme.current = newTheme;
			applyTheme(newTheme, isDarkColorScheme(colorScheme.current));

			const openTx = await db.transaction('preferences', 'readwrite');
			if (openTx.ok) {
				await Promise.all([
					attempt.async(() => openTx.data.store.put(JSON.stringify(newTheme), 'theme'))(
						logError('Failed to put theme in DB')
					),
					attempt.async(() => openTx.data.done)(
						logError('Failed to commit transaction for updating theme')
					),
				]);
			} else {
				logError('Failed to open transaction for preferences')(openTx.error);
			}

			img.remove();
			URL.revokeObjectURL(objectUrl);
		};

		const openTx = await db.transaction('preferences', 'readwrite');
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
	};
</script>

<div class="[view-transition-name:bg-upload]">
	<input
		id="bg-upload"
		type="file"
		style="border: 0px; clip: rect(0px, 0px, 0px, 0px); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; white-space: nowrap; overflow-wrap: normal;"
		onchange={onChange}
	/>
	<label for="bg-upload" class="c-button" title="Upload background image">
		<ImageUp />
	</label>
</div>
