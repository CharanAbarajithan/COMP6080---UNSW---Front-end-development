import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from './Header';
import './Listings.css';
import starIcon from '../assets/star-fill.svg';
import config from '../config';

function ViewHostedListing () {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { listingId } = useParams();
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nbReviews, setNbReviews] = useState(0);
  const [sumNotes, setSumNotes] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [published, setPublished] = useState(false);
  const [postedOn, setPostedOn] = useState('');
  const [owner, setOwner] = useState('');
  const [bookings, setBookings] = useState([]);
  const [totalDays, setTotalDays] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    if (!state || !state.token) {
      navigate('/login', { state: { return: '/hosted-listings' } });
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
        setThumbnail(data.listing.thumbnail);
        setType(data.listing.metadata.type);
        setNbBedrooms(data.listing.metadata.nbBedrooms);
        setNbBeds(data.listing.metadata.nbBeds);
        setNbBathrooms(data.listing.metadata.nbBathrooms);
        setAmenities(data.listing.metadata.amenities);
        setStartDate(data.listing.availability.length > 0 ? data.listing.availability[0].startDate : '');
        setEndDate(data.listing.availability.length > 0 ? data.listing.availability[0].endDate : '');
        setNbReviews(data.listing.reviews.length);
        setSumNotes(data.listing.reviews.reduce((a, v) => a + v.note, 0));
        setReviews(data.listing.reviews);
        setPublished(data.listing.published);
        setPostedOn(data.listing.postedOn);
        setOwner(data.listing.owner);

        if (state.token) {
          fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/bookings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + state.token
            }
          }).then(response => response.json())
            .then(data => {
              const filtedBookings = data.bookings.filter((booking) => booking.listingId === listingId);
              setBookings(filtedBookings);
              const acceptedBookings = filtedBookings.filter((booking) => booking.status === 'accepted');
              const nbDays = acceptedBookings.reduce((a, v) => a + (Date.parse(v.dateRange.endDate) - Date.parse(v.dateRange.startDate)) / (1000 * 60 * 60 * 24), 0);
              setTotalDays(nbDays);
              const sumPrice = acceptedBookings.reduce((a, v) => a + v.totalPrice, 0);
              setTotalProfit(sumPrice);
            });
        }
      });
  }, []);

  const handleBooking = async (bookingId, action) => {
    fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/bookings/' + action + '/' + bookingId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + state.token
      }
    }).then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/bookings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + state.token
            }
          }).then(response => response.json())
            .then(data => {
              const filtedBookings = data.bookings.filter((booking) => booking.listingId === listingId);
              setBookings(filtedBookings);
              const acceptedBookings = filtedBookings.filter((booking) => booking.status === 'accepted');
              const nbDays = acceptedBookings.reduce((a, v) => a + (Date.parse(v.dateRange.endDate) - Date.parse(v.dateRange.startDate)) / (1000 * 60 * 60 * 24), 0);
              setTotalDays(nbDays);
              const sumPrice = acceptedBookings.reduce((a, v) => a + v.totalPrice, 0);
              setTotalProfit(sumPrice);
            });
        }
      });
  }

  return (
    <>
      <Header/>
      <main role="main" className="offset-1 col-10">
        <div className="row justify-content-center">
          {owner === state.email
            ? <div className="col-12 mt-2">
            <h3 className="text-success mt-2">{title}</h3>
            <hr className="mt-0 mb-4"/>
            <div className="row">
              <div className="col-md-8">
                <div className="airbrb-listing">
                  <address className="text-primary text-lg">{street}, {postcode} {city}, {addressState !== '' ? addressState + ',' : ''} {country !== '' ? country : ''}</address>
                  <p className="font-weight-bold">
                  {type + ', ' + nbBedrooms + ' bedroom(s), ' + nbBeds + ' bed(s), ' + nbBathrooms + ' bathroom(s)'}</p>
                  <p>{amenities}</p>
                  <p className="font-weight-bold text-danger text-lg">${price} AUD / night</p>
                  <img src={thumbnail} alt={title} width="600" className="airbrb-thumbnail"/>
                  <p><img src={starIcon} alt="star" /> {nbReviews === 0 ? '0.0' : (sumNotes / nbReviews).toFixed(1)} ({nbReviews} reviews)</p>
                  {startDate !== '' && endDate !== ''
                    ? <span>Available from <strong>{startDate}</strong> to <strong>{endDate}</strong></span>
                    : <span className="text-info">No available for booking</span>}
                  {reviews.length > 0
                    ? <div>
                      <hr/>
                      <h5>Reviews</h5>
                      <ul className="list-group">
                      {reviews.map((review) => (
                        <li key={review.comment + '-' + review.note} className="list-group-item">
                          <p>{review.comment}</p>
                          {[...Array(Number(review.note)).keys()].map((i) => (
                            <img key={i} src={starIcon} alt="star" />
                          ))}
                          <span> ({review.note})</span>
                        </li>
                      ))}
                      </ul>
                    </div>
                    : ''}
                </div>
              </div>
              <div className="col-md-4">
                <div className="jumbotron">
                  {published
                    ? <h5>Listing has been published from <strong>{Math.floor((new Date() - Date.parse(postedOn)) / (1000 * 60 * 60 * 24))} day(s)</strong></h5>
                    : <h5>Listing is not published</h5>}
                  <h5>The listing been booked for <strong>{totalDays} day(s)</strong></h5>
                  <p className="text-danger text-lg">Total profit: <strong>${totalProfit} AUD</strong></p>
                </div>
                <ul className="list-group">
                  {bookings.map((booking) => (
                    <li key={booking.id} className="list-group-item">
                      <h5>{booking.owner}</h5>
                      <p>From <strong>{booking.dateRange.startDate}</strong> to <strong>{booking.dateRange.endDate}</strong></p>
                      <p className="text-danger text-lg">Total Price: ${booking.totalPrice} AUD</p>
                      {booking.status === 'pending'
                        ? <p><button className="btn btn-success btn-sm" onClick={() => handleBooking(booking.id, 'accept')}>Accept</button>
                        <button className="btn btn-warning btn-sm ml-2" onClick={() => handleBooking(booking.id, 'decline')}>Decline</button></p>
                        : <p className="text-primary">Status: <strong>{booking.status.toUpperCase()}</strong></p>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
            : <h5>It is not your listing</h5>}
        </div>
      </main>
    </>
  );
}

export default ViewHostedListing;
