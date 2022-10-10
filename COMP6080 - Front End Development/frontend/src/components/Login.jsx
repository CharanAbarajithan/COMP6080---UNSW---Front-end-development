import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import config from '../config';

async function loginUser (email, password) {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/user/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email, password: password })
  }).then(response => response.json());
}

function Login () {
  const { state } = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    const result = await loginUser(email, password);
    if (result.token) {
      navigate(state && state.return ? state.return : '/hosted-listings', { state: { token: result.token, email: email } });
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <Header/>
      <main role="main" className="mt-sm-60 offset-1 col-10 offset-md-3 col-md-6">
        <div className="row justify-content-center">
          <div className="col-12 mt-2">
            <h3 className="mt-2">Login Here</h3>
            <hr className="mt-0 mb-4"/>
            { error &&
              <div className="alert alert-danger" role="alert">{error}</div>
            }
            <form method="POST" onSubmit={handleLogin} className="from-group">
              <div className="form-group mt-2">
                <label>Email</label>
                <input type="email" onChange={e => setEmail(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <label>Password</label>
                <input type="password" onChange={e => setPassword(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <button type="submit" className="btn btn-success">Login</button>
              </div>
            </form>
            <br/>
            <p>Don&apos;t have an account? Create one <a href="./register">here</a></p>
          </div>
        </div>
      </main>
    </>
  );
}

export default Login;
