import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import userIcon from '../assets/person-circle.svg';
import loginIcon from '../assets/box-arrow-in-left.svg';
import logoutIcon from '../assets/box-arrow-right.svg';
import config from '../config';

function BrandName () {
  return (
    <ul className="navbar-nav bd-navbar-nav">
      <li className="nav-item"><h5 className="ml-2 mt-2 text-light">AirBrB</h5></li>
    </ul>
  );
}

async function logoutUser (token) {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/user/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    }
  }).then(response => response.json());
}

function Header () {
  const { state } = useLocation();

  const navigate = useNavigate();

  const handleLogout = async e => {
    e.preventDefault();

    const result = await logoutUser(state.token);
    if (result.error) {
      alert(result.error);
    } else {
      navigate('/', { state: { token: '', username: '' } });
    }
  }

  const username = state && state.email ? state.email.substr(0, state.email.indexOf('@')) : 0;

  return state && state.token
    ? (
      <header className="navbar navbar-expand navbar-airbrb">
        <BrandName/>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav">
            <li className="nav-item text-light p-2">
              <a className="nav-link" onClick={() => navigate('/hosted-listings', { state: { token: state.token, email: state.email } })}>Hosted Listings</a>
            </li>
            <li className="nav-item text-light p-2">
              <a className="nav-link" onClick={() => navigate('/published-listings', { state: { token: state.token, email: state.email } })}>Published Listings</a>
            </li>
          </ul>
          <ul className="navbar-nav ml-auto">
            <li className="nav-item text-light p-2">
              <img src={userIcon} alt="user" /> Welcome <strong>{username}</strong>
            </li>
            <li className="nav-item">
              <button className="btn btn-warning btn-sm text-light mt-1" onClick={handleLogout}><img src={logoutIcon} alt="logout" /> Logout</button>
            </li>
          </ul>
        </div>
      </header>
      )
    : (
      <header className="navbar navbar-expand navbar-airbrb">
        <BrandName/>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <a className="btn btn-primary btn-sm text-light" href="/login"><img src={loginIcon} alt="login" /> Login</a>
          </li>
        </ul>
      </header>
      );
}

export default Header;
