import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import './Listings.css';
import config from '../config';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from '../assets/helpers.js';

async function updateListing (token, listingId, title, street, city, state, postcode, country, price, thumbnail, type, nbBedrooms, nbBeds, nbBathrooms, amenities) {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/' + listingId, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      title: title,
      address: { street: street, city: city, state: state, postcode: postcode, country: country },
      price: price,
      thumbnail: thumbnail,
      metadata: { type: type, nbBedrooms: nbBedrooms, nbBeds: nbBeds, nbBathrooms: nbBathrooms, amenities: amenities }
    })
  }).then(response => response.json());
}

function EditListing () {
  const { listingId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [postcode, setPostcode] = useState('');
  const [country, setCountry] = useState('');
  const [price, setPrice] = useState(0);
  const [thumbnail, setThumbnail] = useState('');
  const [type, setType] = useState('');
  const [nbBedrooms, setNbBedrooms] = useState(0);
  const [nbBeds, setNbBeds] = useState(0);
  const [nbBathrooms, setNbBathrooms] = useState(0);
  const [amenities, setAmenities] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state || !state.token) {
      navigate('/login', { state: { return: '/new-listing' } });
    }

    fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/' + listingId, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => response.json())
      .then(data => {
        setTitle(data.listing.title);
        setStreet(data.listing.address.street);
        setCity(data.listing.address.city);
        setAddressState(data.listing.address.state);
        setPostcode(data.listing.address.postcode);
        setCountry(data.listing.address.country);
        setPrice(data.listing.price);
        setType(data.listing.metadata.type);
        setNbBedrooms(data.listing.metadata.nbBedrooms);
        setNbBeds(data.listing.metadata.nbBeds);
        setNbBathrooms(data.listing.metadata.nbBathrooms);
        setAmenities(data.listing.metadata.amenities);
      });
  }, []);

  const handleUpdateListing = async e => {
    e.preventDefault();
    const result = await updateListing(state.token, listingId, title, street, city, addressState, postcode, country, price, thumbnail, type, nbBedrooms, nbBeds, nbBathrooms, amenities);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/hosted-listings', { state: { token: state.token, email: state.email } });
    }
  }

  const handleUploadFile = uploadedFiles => {
    fileToDataUrl(uploadedFiles[0]).then(v => {
      setThumbnail(v);
    });
  }

  const nbRoomsArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <>
      <Header/>
      <main role="main" className="offset-1 col-10">
        <div className="row justify-content-center">
          <div className="col-12 mt-2">
            <h3 className="mt-2">Edit your hosted listing {listingId}</h3>
            <hr className="mt-0 mb-4"/>
            { error &&
              <div className="alert alert-danger" role="alert">{error}</div>
            }
            <form method="POST" onSubmit={handleUpdateListing} className="from-group">
              <div className="form-group mt-2">
                <label>Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-control"/>
              </div>
              <div className="form-row mt-2">
                <div className="form-group col-md-9">
                  <label>Street</label>
                  <input type="text" value={street} onChange={e => setStreet(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group col-md-3">
                  <label>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group col-md-3">
                  <label>State</label>
                  <input type="text" value={addressState} onChange={e => setAddressState(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group col-md-3">
                  <label>Postcode</label>
                  <input type="text" value={postcode} onChange={e => setPostcode(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group col-md-3">
                  <label>Country</label>
                  <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="form-control"/>
                </div>
              </div>
              <div className="form-group mt-2">
                <label>Price (per night)</label>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)} className="form-control"/>
              </div>
              <div className="form-group mt-2">
                <label>Thumbnail</label>
                <input type="file" onChange={e => handleUploadFile(e.target.files)} className="form-control"/>
              </div>
              <div className="form-row mt-2">
                <div className="form-group col-md-3">
                  <label>Property type</label>
                  <input type="text" value={type} onChange={e => setType(e.target.value)} className="form-control"/>
                </div>
                <div className="form-group col-md-3">
                  <label>Number of bedrooms</label>
                  <select value={nbBedrooms} onChange={e => setNbBedrooms(e.target.value)} className="form-control">
                    {nbRoomsArray.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Number of beds</label>
                  <select value={nbBeds} onChange={e => setNbBeds(e.target.value)} className="form-control">
                    {nbRoomsArray.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </div>
                <div className="form-group col-md-3">
                  <label>Number of bathrooms</label>
                  <select value={nbBathrooms} onChange={e => setNbBathrooms(e.target.value)} className="form-control">
                    {nbRoomsArray.map((value) => <option key={value}>{value}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group mt-2">
                <label>Amenities</label>
                <textarea value={amenities} onChange={e => setAmenities(e.target.value)} className="form-control"></textarea>
              </div>
              <div className="form-group mt-2">
                <button type="submit" className="btn btn-success">Update</button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default EditListing;
