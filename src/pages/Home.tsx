import { useEffect, useState } from 'react';
import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonButtons,
	IonSpinner,
	IonText,
	IonList,
	IonItem,
	IonLabel,
} from '@ionic/react';
import { fetchSession, logout as apiLogout, type SessionUser, ApiError } from '../services/api';
import { getSessionToken, clearSessionToken } from '../services/storage';

type HomePageProps = {
	onLoggedOut: () => void;
};

const HomePage = ({ onLoggedOut }: HomePageProps): JSX.Element => {
	const [user, setUser] = useState<SessionUser | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async (): Promise<void> => {
			const token = await getSessionToken();
			if (!token) {
				onLoggedOut();
				return;
			}

			try {
				// Ésta es la "solicitud exitosa hacia un endpoint de su propio backend"
				// que pide el taller: GET /api/auth/session con el Bearer guardado.
				const sessionUser = await fetchSession(token);
				setUser(sessionUser);
			} catch (err) {
				setError(err instanceof ApiError ? err.message : 'No se pudo cargar la sesión.');
			} finally {
				setLoading(false);
			}
		};

		void load();
	}, [onLoggedOut]);

	const handleLogout = async (): Promise<void> => {
		const token = await getSessionToken();
		if (token) {
			await apiLogout(token);
		}
		await clearSessionToken();
		onLoggedOut();
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Mi cuenta</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleLogout}>Salir</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				{loading && <IonSpinner name="dots" />}

				{error && (
					<IonText color="danger">
						<p>{error}</p>
					</IonText>
				)}

				{user && (
					<IonList>
						<IonItem>
							<IonLabel>
								<h2>{user.name}</h2>
								<p>{user.email}</p>
							</IonLabel>
						</IonItem>
						<IonItem>
							<IonLabel>
								<h3>Roles</h3>
								<p>{user.roles.length > 0 ? user.roles.map((r) => r.name).join(', ') : 'Sin roles asignados'}</p>
							</IonLabel>
						</IonItem>
					</IonList>
				)}
			</IonContent>
		</IonPage>
	);
};

export default HomePage;
