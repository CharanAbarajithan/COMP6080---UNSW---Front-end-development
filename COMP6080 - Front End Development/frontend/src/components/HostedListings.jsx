import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import './Listings.css';
import starIcon from '../assets/star-fill.svg';
import config from '../config';

async function dealWithListing (url, method, token, data) {
  return fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(data)
  }).then(response => response.json());
}

async function getDetailOfListing (listingId) {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/' + listingId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json());
}

function HostedListings () {
  const { state } = useLocation();

  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!state || !state.token) {
      navigate('/login', { state: { return: '/hosted-listings' } });
    }

    fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
      .then(async (data) => {
        const ownedListings = data.listings.filter((listing) => listing.owner === state.email)
          .map((listing) => (
            {
              ...listing,
              nbReviews: listing.reviews.reduce((a, v) => a + 1, 0),
              sumNotes: listing.reviews.reduce((a, v) => a + v.note, 0),
            }));
        for (const listing of ownedListings) {
          listing.metadata = (await getDetailOfListing(listing.id)).listing.metadata;
          listing.availability = (await getDetailOfListing(listing.id)).listing.availability;
          listing.published = (await getDetailOfListing(listing.id)).listing.published;
        }
        setListings(ownedListings);
      });
  }, []);

  const handleDeleteListing = async id => {
    const result = await dealWithListing(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/' + id, 'DELETE', state.token, {});
    if (result.error) {
      alert(result.error);
    } else {
      const newListings = listings.filter((listing) => listing.id !== id);
      setListings(newListings);
    }
  }

  const handlePublishListing = async id => {
    if (startDate !== '' && endDate !== '' && Date.parse(endDate) > Date.parse(startDate)) {
      const result = await dealWithListing(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/publish/' + id, 'PUT', state.token,
        { availability: [{ startDate: startDate, endDate: endDate }] });
      if (result.error) {
        alert(result.error);
      } else {
        const newListings = listings.map(listing => (listing.id === id ? { ...listing, published: true, availability: [{ startDate: startDate, endDate: endDate }] } : listing));
        setListings(newListings);
        setStartDate('');
        setEndDate('');
      }
    } else if (startDate === '' || endDate === '') {
      alert('You have to enter the start and end dates for availability range!');
    } else {
      alert('The end date must be after the start date!');
    }
  }

  const handleUnpublishListing = async id => {
    const result = await dealWithListing(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/unpublish/' + id, 'PUT', state.token, {});
    if (result.error) {
      alert(result.error);
    } else {
      const newListings = listings.map(listing => (listing.id === id ? { ...listing, published: false, availability: [] } : listing));
      setListings(newListings);
    }
  }

  const today = new Date();
  const todayDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  return (
    <>
      <Header/>
      <main role="main" className="offset-1 col-10">
        <div className="row justify-content-center">
          <div className="col-12 mt-2">
            <h3 className="mt-2">Your hosted listings</h3>
            <hr className="mt-0 mb-2"/>
            <a className="btn btn-primary" onClick={() => navigate('/new-listing', { state: { token: state.token, email: state.email } })}>Create a new listing</a>
            <div className="row">
              {listings && listings.length > 0
                ? listings.map((listing) => (
                <div key={listing.id} className="col-md-6 mt-2">
                  <div className="airbrb-listing">
                    <h5>
                      <a className="text-success" onClick={() => navigate('/view-hosted-listing/' + listing.id,
                        { state: { token: state ? state.token : '', email: state ? state.email : '' } })}>{listing.title}</a>
                    </h5>
                    <p className="font-weight-bold">
                      {listing.metadata
                        ? listing.metadata.type + ', ' +
                        (listing.metadata.nbBedrooms ? listing.metadata.nbBedrooms : '-') + ' bedroom(s), ' +
                        (listing.metadata.nbBeds ? listing.metadata.nbBeds : '-') + ' bed(s), ' +
                        (listing.metadata.nbBathrooms ? listing.metadata.nbBathrooms : '-') + ' bathroom(s)'
                        : ''}</p>
                    <p>{listing.metadata
                      ? listing.metadata.amenities
                      : ''}</p>
                    <p className="font-weight-bold text-danger text-lg">${listing.price} AUD / night</p>
                    <img src={listing.thumbnail} alt={listing.title} width="300" className="airbrb-thumbnail"/>
                    <p><img src={starIcon} alt="star" /> {listing.nbReviews === 0 ? '0.0' : (listing.sumNotes / listing.nbReviews).toFixed(1)} ({listing.nbReviews} reviews)</p>
                    <button className="btn btn-warning btn-sm" onClick={() => navigate('/edit-listing/' + listing.id, { state: { token: state.token, email: state.email } })}>Edit</button>
                    <button className="btn btn-danger btn-sm ml-2" onClick={() => handleDeleteListing(listing.id)}>Delete</button>
                    {listing.published
                      ? <div>
                          <span>Available from <strong>{listing.availability[0].startDate}</strong> to <strong>{listing.availability[0].endDate}</strong></span>
                          <button className="btn btn-secondary btn-sm ml-2" onClick={() => handleUnpublishListing(listing.id)}>Unpublish</button>
                        </div>
                      : <div className="form-inline mt-2">
                          <div className="form-group">
                            <label>Available from</label>
                            <input type="date" min={todayDate} placeholder="yyyy-MM-dd" onChange={e => setStartDate(e.target.value)} className="form-control"/>
                            <label>to</label>
                            <input type="date" min={todayDate} placeholder="yyyy-MM-dd" onChange={e => setEndDate(e.target.value)} className="form-control"/>
                            <button className="btn btn-success btn-sm" onClick={() => handlePublishListing(listing.id)}>Publish</button>
                          </div>
                        </div>}
                    </div>
                </div>
                  ))
                : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default HostedListings;
