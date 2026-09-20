import { Preferences } from '@capacitor/preferences';

const SESSION_TOKEN_KEY = 'mycoins_session_token';
const LAST_LOCATION_KEY = 'mycoins_last_known_location';
const NOTIFICATION_PERMISSION_KEY = 'mycoins_notification_permission';
const LOCATION_PERMISSION_KEY = 'mycoins_location_permission';

export type SavedLocation = {
	latitude: number;
	longitude: number;
	accuracy: number;
	capturedAt: string;
};

/**
 * `@capacitor/preferences` guarda en UserDefaults (iOS) / SharedPreferences (Android) —
 * no es cifrado a nivel de disco, pero está fuera del alcance del WebView y de otras apps.
 * Para producción real se recomienda `@capacitor-community/secure-storage` o Keychain/Keystore
 * directo; para el alcance del taller, Preferences es suficiente y documenta la limitación.
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

export const saveLastKnownLocation = async (location: SavedLocation): Promise<void> => {
	await Preferences.set({ key: LAST_LOCATION_KEY, value: JSON.stringify(location) });
};

export const getLastKnownLocation = async (): Promise<SavedLocation | null> => {
	const { value } = await Preferences.get({ key: LAST_LOCATION_KEY });
	if (!value) return null;

	try {
		return JSON.parse(value) as SavedLocation;
	} catch {
		return null;
	}
};

export const clearLastKnownLocation = async (): Promise<void> => {
	await Preferences.remove({ key: LAST_LOCATION_KEY });
};

export const savePermissionStatus = async (key: 'location' | 'notifications', value: string): Promise<void> => {
	const storageKey = key === 'location' ? LOCATION_PERMISSION_KEY : NOTIFICATION_PERMISSION_KEY;
	await Preferences.set({ key: storageKey, value });
};

export const getPermissionStatus = async (key: 'location' | 'notifications'): Promise<string | null> => {
	const storageKey = key === 'location' ? LOCATION_PERMISSION_KEY : NOTIFICATION_PERMISSION_KEY;
	const { value } = await Preferences.get({ key: storageKey });
	return value;
};
