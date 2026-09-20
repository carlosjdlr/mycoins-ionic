import { Device } from '@capacitor/device';
import { Geolocation, type GeolocationPosition, type PositionOptions } from '@capacitor/geolocation';
import { LocalNotifications, type Schedule } from '@capacitor/local-notifications';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'limited' | 'unknown';

const NOTIFICATION_CHANNEL_ID = 'mycoins-finance';
let notificationSequence = 0;

export const getDeviceInfo = async (): Promise<{ platform: string; model: string; osVersion: string }> => {
	const info = await Device.getInfo();
	return {
		platform: info.platform,
		model: info.model,
		osVersion: info.osVersion ?? 'unknown',
	};
};

export const requestLocationPermission = async (): Promise<PermissionState> => {
	const status = await Geolocation.requestPermissions();
	return mapGeolocationState(status.location);
};

export const checkLocationPermission = async (): Promise<PermissionState> => {
	const status = await Geolocation.checkPermissions();
	return mapGeolocationState(status.location);
};

export const getCurrentLocation = async (): Promise<GeolocationPosition | null> => {
	try {
		const permission = await checkLocationPermission();
		if (permission !== 'granted') {
			return null;
		}

		const options: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
		return await Geolocation.getCurrentPosition(options);
	} catch {
		return null;
	}
};

export const openSystemLocationSettings = async (): Promise<void> => {
	const locationSettingsUrl = 'app-settings:';
	window.location.href = locationSettingsUrl;
};

export const requestNotificationPermission = async (): Promise<PermissionState> => {
	await ensureNotificationChannel();
	const status = await LocalNotifications.requestPermissions();
	return mapNotificationState(status.display ?? 'prompt');
};

export const checkNotificationPermission = async (): Promise<PermissionState> => {
	const status = await LocalNotifications.checkPermissions();
	return mapNotificationState(status.display ?? 'prompt');
};

export const scheduleReminder = async (title: string, body: string, at: Date): Promise<void> => {
	const permission = await checkNotificationPermission();
	if (permission !== 'granted') {
		throw new Error('Necesitas permitir las notificaciones para programar un recordatorio.');
	}

	await ensureNotificationChannel();
	const schedule: Schedule = { at };
	notificationSequence = (notificationSequence + 1) % 2147483647;
	const notificationId = notificationSequence || 1;
	await LocalNotifications.schedule({ notifications: [{ title, body, id: notificationId, channelId: NOTIFICATION_CHANNEL_ID, schedule }] });
};

const ensureNotificationChannel = async (): Promise<void> => {
	await LocalNotifications.createChannel({
		id: NOTIFICATION_CHANNEL_ID,
		name: 'Recordatorios financieros',
		description: 'Avisos para revisar ingresos, gastos y movimientos.',
		importance: 5,
		visibility: 1,
		sound: 'default',
		vibration: true,
	});
};

const mapGeolocationState = (state: string): PermissionState => {
	if (state === 'granted') return 'granted';
	if (state === 'denied') return 'denied';
	if (state === 'prompt') return 'prompt';
	if (state === 'limited') return 'limited';
	return 'unknown';
};

const mapNotificationState = (state: string): PermissionState => {
	if (state === 'granted') return 'granted';
	if (state === 'denied') return 'denied';
	if (state === 'prompt') return 'prompt';
	if (state === 'limited') return 'limited';
	return 'unknown';
};
