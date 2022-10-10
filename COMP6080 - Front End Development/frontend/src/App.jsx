import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Listings from './components/Listings';
import HostedListings from './components/HostedListings';
import CreateListing from './components/CreateListing';
import EditListing from './components/EditListing';
import ViewListing from './components/ViewListing';
import ViewHostedListing from './components/ViewHostedListing';

function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Listings/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/hosted-listings" element={<HostedListings/>} />
        <Route path="/new-listing" element={<CreateListing/>} />
        <Route path="/edit-listing/:listingId" element={<EditListing/>} />
        <Route path="/published-listings" element={<Listings/>} />
        <Route path="/view-listing/:listingId" element={<ViewListing/>} />
        <Route path="/view-hosted-listing/:listingId" element={<ViewHostedListing/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
