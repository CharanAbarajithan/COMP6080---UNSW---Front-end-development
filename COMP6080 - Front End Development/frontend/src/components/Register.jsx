import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import config from '../config';

async function registerUser (email, password, name) {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/user/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: email, password: password, name: name })
  }).then(response => response.json());
}

function Register () {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleRegister = async e => {
    e.preventDefault();
    if (password !== password2) {
      setError('Password and confirm password are not identical!');
      return;
    }
    const result = await registerUser(email, password, name);
    if (result.token) {
      navigate('/hosted-listings', { state: { token: result.token, email: email } });
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
            <h3 className="mt-2">Create an account</h3>
            <hr className="mt-0 mb-4"/>
            { error &&
              <div className="alert alert-danger" role="alert">{error}</div>
            }
            <form method="POST" onSubmit={handleRegister} className="from-group">
              <div className="form-group mt-2">
                <label>Email</label>
                <input type="email" onChange={e => setEmail(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <label>Password</label>
                <input type="password" onChange={e => setPassword(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <label>Confirm password</label>
                <input type="password" onChange={e => setPassword2(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <label>Name</label>
                <input type="text" onChange={e => setName(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <button type="submit" className="btn btn-success">Register</button>
              </div>
            </form>
            <br/>
            <p>Already have an account &gt; <a href="./login">Login</a></p>
          </div>
        </div>
      </main>
    </>
  );
}

export default Register;
