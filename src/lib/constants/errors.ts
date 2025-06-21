export const ErrorCodes = {
	DB_OPEN_FAILED: () => 'DB_OPEN_FAILED' as const,
} as const;

export type ErrorCode = { [key in keyof typeof ErrorCodes]: ReturnType<(typeof ErrorCodes)[key]> };
