import { useEffect, useMemo, useState } from 'react';
import {
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonContent,
	IonHeader,
	IonItem,
	IonLabel,
	IonList,
	IonPage,
	IonSpinner,
	IonText,
	IonTitle,
	IonToolbar,
} from '@ionic/react';
import { getDeviceInfo, requestLocationPermission, requestNotificationPermission, checkLocationPermission, checkNotificationPermission, getCurrentLocation, openSystemLocationSettings, scheduleReminder, type PermissionState } from '../services/native';
import { getLastKnownLocation, saveLastKnownLocation, savePermissionStatus } from '../services/storage';

const NativeDemo = (): JSX.Element => {
	const [locationPermission, setLocationPermission] = useState<PermissionState>('unknown');
	const [notificationPermission, setNotificationPermission] = useState<PermissionState>('unknown');
	const [statusMessage, setStatusMessage] = useState('Revisando permisos...');
	const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
	const [deviceInfo, setDeviceInfo] = useState<{ platform: string; model: string; osVersion: string } | null>(null);
	const [loading, setLoading] = useState(true);

	const permissionSummary = useMemo(() => [
		{ label: 'Ubicación', value: locationPermission },
		{ label: 'Notificaciones', value: notificationPermission },
	], [locationPermission, notificationPermission]);

	useEffect(() => {
		const boot = async (): Promise<void> => {
			const [device, locPerm, notifPerm, savedLocation] = await Promise.all([
				getDeviceInfo(),
				checkLocationPermission(),
				checkNotificationPermission(),
				getLastKnownLocation(),
			]);

			setDeviceInfo(device);
			setLocationPermission(locPerm);
			setNotificationPermission(notifPerm);
			setLocation(savedLocation ? { latitude: savedLocation.latitude, longitude: savedLocation.longitude, accuracy: savedLocation.accuracy } : null);
			setLoading(false);
		};

		void boot();
	}, []);

	const requestLocation = async (): Promise<void> => {
		setStatusMessage('Solicitando permiso de ubicación...');
		const next = await requestLocationPermission();
		await savePermissionStatus('location', next);
		setLocationPermission(next);

		if (next !== 'granted') {
			if (next === 'denied') {
				setStatusMessage('La ubicación quedó denegada. La app seguirá funcionando sin esa función.');
			} else {
				setStatusMessage('La ubicación no está disponible en este momento.');
			}
			return;
		}

		const current = await getCurrentLocation();
		if (!current) {
			setStatusMessage('No se pudo obtener la ubicación actual.');
			return;
		}

		const snapshot = {
			latitude: current.coords.latitude,
			longitude: current.coords.longitude,
			accuracy: current.coords.accuracy,
			capturedAt: new Date().toISOString(),
		};
		await saveLastKnownLocation(snapshot);
		setLocation({ latitude: snapshot.latitude, longitude: snapshot.longitude, accuracy: snapshot.accuracy });
		setStatusMessage(`Ubicación capturada: ${snapshot.latitude.toFixed(4)}, ${snapshot.longitude.toFixed(4)}`);
	};

	const requestNotifications = async (): Promise<void> => {
		setStatusMessage('Solicitando permiso de notificaciones...');
		const next = await requestNotificationPermission();
		await savePermissionStatus('notifications', next);
		setNotificationPermission(next);

		if (next !== 'granted') {
			setStatusMessage('Las notificaciones quedaron deshabilitadas. La app puede seguir funcionando con funcionalidad reducida.');
			return;
		}

		try {
			const when = new Date(Date.now() + 10000);
			await scheduleReminder('MyCoins', 'Revisa tu presupuesto del día.', when);
			setStatusMessage('Notificación programada correctamente.');
		} catch (error) {
			setStatusMessage(error instanceof Error ? error.message : 'No se pudo programar la notificación.');
		}
	};

	const openSettings = async (): Promise<void> => {
		await openSystemLocationSettings();
		const nextPermission = await checkLocationPermission();
		await savePermissionStatus('location', nextPermission);
		setLocationPermission(nextPermission);
		setStatusMessage('Verificación del ajuste del sistema completada.');
	};

	const canOpenSystemSettings = locationPermission === 'denied';

	if (loading) {
		return (
			<IonPage>
				<IonContent className="ion-padding">
					<div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
						<IonSpinner name="crescent" />
					</div>
				</IonContent>
			</IonPage>
		);
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Dispositivo y permisos</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Estado del equipo</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						{deviceInfo && (
							<IonText>
								<p>Plataforma: {deviceInfo.platform}</p>
								<p>Modelo: {deviceInfo.model}</p>
								<p>Versión OS: {deviceInfo.osVersion}</p>
							</IonText>
						)}
					</IonCardContent>
				</IonCard>

				<IonList>
					{permissionSummary.map((entry) => (
						<IonItem key={entry.label}>
							<IonLabel>
								<h2>{entry.label}</h2>
								<p>{entry.value}</p>
							</IonLabel>
						</IonItem>
					))}
				</IonList>

				<IonButton expand="block" onClick={requestLocation} style={{ marginTop: '1rem' }}>
					Solicitar ubicación
				</IonButton>

				<IonButton expand="block" fill="outline" onClick={requestNotifications} style={{ marginTop: '0.75rem' }}>
					Solicitar notificaciones
				</IonButton>

				{canOpenSystemSettings && (
					<IonButton expand="block" color="warning" onClick={openSettings} style={{ marginTop: '0.75rem' }}>
						Abrir ajustes del sistema
					</IonButton>
				)}

				<IonCard style={{ marginTop: '1rem' }}>
					<IonCardHeader>
						<IonCardTitle>Resultado</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonText>
							<p>{statusMessage}</p>
							{location && (
								<p>
									Última ubicación guardada: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
									({location.accuracy}m)
								</p>
							)}
						</IonText>
					</IonCardContent>
				</IonCard>
			</IonContent>
		</IonPage>
	);
};

export default NativeDemo;
