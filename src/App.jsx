import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './assets/components/Home.jsx';
import Login from './assets/components/login.jsx';
import ProtectedRoute from './assets/components/ProtectedRoute.jsx';
import Signup from './assets/components/signup.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './App.css';

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route element={<ProtectedRoute />}>
						<Route path="/" element={<Home />} />
						<Route path="/welcome" element={<Home />} />
					</Route>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
