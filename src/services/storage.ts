import { Preferences } from '@capacitor/preferences';

const SESSION_TOKEN_KEY = 'mycoins_session_token';
const NOTIFICATION_PERMISSION_KEY = 'mycoins_notification_permission';

/**
 * `@capacitor/preferences` guarda en UserDefaults (iOS) / SharedPreferences (Android) —
 * no es cifrado a nivel de disco, pero está fuera del alcance del WebView y de otras apps.
 * Para producción real se recomienda `@capacitor-community/secure-storage` o Keychain/Keystore
 * directo; para el alcance actual de la app, Preferences es suficiente y documenta la limitación.
 */
export const saveSessionToken = async (token: string): Promise<void> => {
	await Preferences.set({ key: SESSION_TOKEN_KEY, value: token });
};

export const getSessionToken = async (): Promise<string | null> => {
	const { value } = await Preferences.get({ key: SESSION_TOKEN_KEY });
	return value;
};

export const clearSessionToken = async (): Promise<void> => {
	await Preferences.remove({ key: SESSION_TOKEN_KEY });
};

export const savePermissionStatus = async (value: string): Promise<void> => {
	await Preferences.set({ key: NOTIFICATION_PERMISSION_KEY, value });
};

export const getPermissionStatus = async (): Promise<string | null> => {
	const { value } = await Preferences.get({ key: NOTIFICATION_PERMISSION_KEY });
	return value;
};
