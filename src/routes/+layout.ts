import { createIndexedDb } from '$lib/services/db';
import { getUserPreferredColorScheme, logError } from '$lib/utils';
import { attempt } from '@duydang2311/attempt';
import type { LayoutLoad } from './$types';
import type { Theme } from '@material/material-color-utilities';

export const ssr = false;

export const load: LayoutLoad = async () => {
	console.log('layout load');
	const db = createIndexedDb();

	let bg: File | undefined;
	let theme: Theme | undefined;

	const openTx = await db.transaction('preferences', 'readonly');
	if (openTx.failed) {
		logError('Failed to open transaction for preferences')(openTx.error);
	} else {
		const tx = openTx.data;
		const [getTheme, getBg] = await Promise.all([
			attempt.async(() => tx.store.get('theme') as Promise<string | undefined>)(
				logError('Failed to get theme from DB')
				
			),
			attempt.async(() => tx.store.get('bg') as Promise<File | undefined>)(
				logError('Failed to get bg from DB')
			),
		]);

		if (getBg.ok) {
			bg = getBg.data;
		}
		if (getTheme.ok) {
			const parseTheme = attempt.sync(() => JSON.parse(getTheme.data!) as Theme)(
				logError('Failed to parse theme from DB')
			);
			if (parseTheme.ok) {
				theme = parseTheme.data;
			}
		}
	}

	return {
		db,
		bg,
		theme,
		colorScheme: getUserPreferredColorScheme(),
	} as const;
};
