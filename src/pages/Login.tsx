import { useState } from 'react';
import {
	IonContent,
	IonPage,
	IonInput,
	IonButton,
	IonText,
	IonSpinner,
	IonHeader,
	IonToolbar,
	IonTitle,
} from '@ionic/react';
import { mobileLogin, ApiError, API_BASE_URL } from '../services/api';
import { saveSessionToken } from '../services/storage';

type LoginPageProps = {
	onLoggedIn: () => void;
};

const LoginPage = ({ onLoggedIn }: LoginPageProps): JSX.Element => {
	const [username, setUsername] = useState('futbolista');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (): Promise<void> => {
		setError(null);

		if (!username || !password) {
			setError('Ingresa usuario y contraseña.');
			return;
		}

		setLoading(true);
		try {
			const sessionToken = await mobileLogin(username, password);
			await saveSessionToken(sessionToken);
			onLoggedIn();
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError('No se pudo conectar con el backend. Revisa la URL de la API y tu conexión.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>MyCoins</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				<div style={{ marginTop: '2rem' }}>
					<IonText color="medium">
						<p style={{ fontSize: '0.8rem' }}>API: {API_BASE_URL}</p>
					</IonText>

					<IonInput
						label="Usuario"
						labelPlacement="stacked"
						fill="outline"
						value={username}
						onIonInput={(e) => setUsername(e.detail.value ?? '')}
						style={{ marginBottom: '1rem' }}
					/>

					<IonInput
						label="Contraseña"
						labelPlacement="stacked"
						fill="outline"
						type="password"
						value={password}
						onIonInput={(e) => setPassword(e.detail.value ?? '')}
						style={{ marginBottom: '1rem' }}
					/>

					{error && (
						<IonText color="danger">
							<p>{error}</p>
						</IonText>
					)}

					<IonButton expand="block" onClick={handleSubmit} disabled={loading}>
						{loading ? <IonSpinner name="dots" /> : 'Iniciar sesión'}
					</IonButton>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default LoginPage;
