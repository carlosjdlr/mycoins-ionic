import { LocalNotifications, type Schedule } from '@capacitor/local-notifications';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'limited' | 'unknown';

const NOTIFICATION_CHANNEL_ID = 'mycoins-finance';
let notificationSequence = 0;

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

const mapNotificationState = (state: string): PermissionState => {
	if (state === 'granted') return 'granted';
	if (state === 'denied') return 'denied';
	if (state === 'prompt') return 'prompt';
	if (state === 'limited') return 'limited';
	return 'unknown';
};
