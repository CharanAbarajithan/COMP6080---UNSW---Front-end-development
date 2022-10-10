import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import './Listings.css';
import starIcon from '../assets/star-fill.svg';
import config from '../config';

async function getDetailOfListing (listingId) {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/' + listingId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json());
}

async function getListings () {
  return fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json())
    .then(async (data) => {
      const publishedListings = data.listings.map((listing) => (
        {
          ...listing,
          nbReviews: listing.reviews.reduce((a, v) => a + 1, 0),
          sumNotes: listing.reviews.reduce((a, v) => a + v.note, 0),
        }));
      for (const listing of publishedListings) {
        listing.metadata = (await getDetailOfListing(listing.id)).listing.metadata;
        listing.availability = (await getDetailOfListing(listing.id)).listing.availability;
        listing.published = (await getDetailOfListing(listing.id)).listing.published;
      }
      return publishedListings.filter((listing) => listing.published === true).sort((a, b) => (a.title > b.title) ? 1 : -1);
    });
}

function Listings () {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [searchString, setSearchString] = useState();
  const [nbBedrooms, setNbBedrooms] = useState();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [priceMin, setPriceMin] = useState();
  const [priceMax, setPriceMax] = useState();
  const [rating, setRating] = useState();

  useEffect(async () => {
    const publishedListings = await getListings();
    setListings(publishedListings);
  }, []);

  const handleSearch = async e => {
    e.preventDefault();
    const publishedListings = await getListings();
    const newListings = publishedListings.filter((listing) =>
      (searchString === undefined || listing.title.indexOf(searchString) !== -1 || (listing.address.city && listing.address.city.indexOf(searchString) !== -1)) &&
      (nbBedrooms === undefined || (listing.metadata.nbBedrooms && Number(listing.metadata.nbBedrooms) >= Number(nbBedrooms))) &&
      (startDate === undefined || (listing.availability.length > 0 && listing.availability[0].startDate <= startDate)) &&
      (endDate === undefined || (listing.availability.length > 0 && listing.availability[0].endDate >= endDate)) &&
      (priceMin === undefined || Number(listing.price) >= Number(priceMin)) &&
      (priceMax === undefined || Number(listing.price) <= Number(priceMax)) &&
      (rating === undefined || Number(listing.sumNotes) >= Number(rating) * Number(listing.nbReviews)));
    setListings(newListings);
  }

  const handleReset = async e => {
    e.preventDefault();
    setSearchString('');
    setNbBedrooms('');
    setStartDate('');
    setEndDate('');
    setPriceMin('');
    setPriceMax('');
    setRating('');
    const publishedListings = await getListings();
    setListings(publishedListings);
  }

  const today = new Date();
  const todayDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

  return (
    <>
      <Header/>
      <main role="main" className="offset-1 col-10">
        <div className="row justify-content-center">
          <div className="col-12 mt-2">
            <div className="jumbotron">
              <form method="POST" onSubmit={handleSearch} className="from-group">
                <div className="form-group mt-2">
                  <label>Search by Title or City</label>
                  <input type="text" value={searchString} onChange={e => setSearchString(e.target.value)} className="form-control"/>
                </div>
                <div className="form-row mt-2">
                  <div className="form-group col-md-4">
                    <label>Number of bedrooms</label>
                    <input type="number" value={nbBedrooms} onChange={e => setNbBedrooms(e.target.value)} className="form-control"/>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Available from</label>
                    <input type="date" value={startDate} min={todayDate} placeholder="yyyy-MM-dd" onChange={e => setStartDate(e.target.value)} className="form-control"/>
                  </div>
                  <div className="form-group col-md-4">
                    <label>to</label>
                    <input type="date" value={endDate} min={todayDate} placeholder="yyyy-MM-dd" onChange={e => setEndDate(e.target.value)} className="form-control"/>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Price min</label>
                    <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="form-control"/>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Price max</label>
                    <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="form-control"/>
                  </div>
                  <div className="form-group col-md-4">
                    <label>Review ratings from</label>
                    <input type="number" value={rating} onChange={e => setRating(e.target.value)} className="form-control"/>
                  </div>
                </div>
                <div className="form-group mt-2">
                  <button type="submit" className="btn btn-success">Search</button>
                  <button type="button" onClick={handleReset} className="btn btn-danger ml-2">Reset</button>
                </div>
              </form>
            </div>
            <div className="row">
              {listings && listings.length > 0
                ? listings.map((listing) => (
                <div key={listing.id} className="col-md-6 mt-2">
                  <div className="airbrb-listing">
                    <h5>
                      <a className="text-success" onClick={() => navigate('/view-listing/' + listing.id,
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
                    <span>Available from <strong>{listing.availability[0].startDate}</strong> to <strong>{listing.availability[0].endDate}</strong></span>
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

export default Listings;
