import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import NavBar from "../components/Navbar";
import { useAuth } from '../context/AuthContext';

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-md shadow-lg bg-base-100">
          <div className="card-body">
            <h1 className="card-title">Create an Account</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label" htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>

              {error && <p className="text-error">{error}</p>}

              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="mt-4 text-center">Already have an account? <NavLink to="/login" className="link">Log in</NavLink></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
