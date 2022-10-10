import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Header from './Header';
import './Listings.css';
import starIcon from '../assets/star-fill.svg';
import config from '../config';

function ViewListing () {
  const { state } = useLocation();
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
  const [bookingStartDate, setBookingStartDate] = useState('');
  const [bookingEndDate, setBookingEndDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [booking, setBooking] = useState({});
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [note, setNote] = useState(0);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
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
        setStartDate(data.listing.availability[0].startDate);
        setEndDate(data.listing.availability[0].endDate);
        setNbReviews(data.listing.reviews.length);
        setSumNotes(data.listing.reviews.reduce((a, v) => a + v.note, 0));
        setReviews(data.listing.reviews);

        if (state.token) {
          fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/bookings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + state.token
            }
          }).then(response => response.json())
            .then(data => {
              const filtedBookings = data.bookings.filter((booking) => booking.owner === state.email && booking.listingId === listingId);
              if (filtedBookings && filtedBookings.length > 0) {
                setBooking(filtedBookings[0]);
              } else {
                setBooking({});
              }
            });
        }
      });
  }, []);

  const handleBookingListing = async (id, pricePerNight) => {
    if (bookingStartDate !== '' && bookingEndDate !== '' && Date.parse(bookingEndDate) > Date.parse(bookingStartDate)) {
      const bookingTotalPrice = (Date.parse(bookingEndDate) - Date.parse(bookingStartDate)) / (1000 * 60 * 60 * 24) * pricePerNight;
      setTotalPrice(bookingTotalPrice);
      fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/bookings/new/' + id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + state.token
        },
        body: JSON.stringify({ dateRange: { startDate: bookingStartDate, endDate: bookingEndDate }, totalPrice: bookingTotalPrice })
      }).then(response => response.json())
        .then(data => {
          if (data.bookingId) {
            setMessage('Your booking has been sent to the listing owner.');
            setError('');
          } else {
            setMessage('');
            setError(data.error ? data.error : 'An error happens!');
          }
        });
    } else {
      setMessage('');
      if (bookingStartDate === '' || bookingEndDate === '') {
        setError('You have to enter the start and end dates for availability range!');
      } else {
        setError('The end date must be after the start date!');
      }
    }
  }

  const handleReviewListing = async () => {
    if (state.token) {
      if (comment !== '' && Number(note) >= 1 && Number(note) <= 5) {
        fetch(config.BACKEND_HOST + ':' + config.BACKEND_PORT + '/listings/' + listingId + '/review/' + booking.id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + state.token
          },
          body: JSON.stringify({ review: { comment: comment, note: Number(note) } })
        }).then(response => response.json())
          .then(data => {
            setReviews([...reviews, { comment: comment, note: note }]);
            setComment('');
            setNote(0);
          });
      } else if (comment === '' || Number(note) === 0) {
        setReviewError('You should enter a comment and a note.');
      } else {
        setReviewError('The note should be between 1 and 5.');
      }
    } else {
      setReviewError('Should not happen.');
    }
  }

  return (
    <>
      <Header/>
      <main role="main" className="offset-1 col-10">
        <div className="row justify-content-center">
          <div className="col-12 mt-2">
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
                  <span>Available from <strong>{startDate}</strong> to <strong>{endDate}</strong></span>
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
                  {booking.status
                    ? <div>
                        <hr/>
                        <h5>You can enter a review:</h5>
                        <div className="from-group">
                          <div className="form-group mt-2">
                            <label>Comment</label>
                            <input type="text" value={comment} onChange={e => setComment(e.target.value)} className="form-control"/>
                          </div>
                          <div className="form-group mt-2">
                            <label>Note (score)</label>
                            <input type="number" value={note} min="1" max="5" onChange={e => setNote(e.target.value)} className="form-control"/>
                          </div>
                          <div className="form-group mt-2">
                            <p className="font-weight-bold text-danger">{reviewError}</p>
                            <button onClick={() => handleReviewListing()} className="btn btn-success">Send review</button>
                          </div>
                        </div>
                      </div>
                    : ''
                  }
                </div>
              </div>
              {state.token
                ? <div className="col-md-4">
                    {booking.status
                      ? <div className="mt-2">
                        <h5>Booking status</h5>
                        <p className="text-info">You already booked this listing.<br/>
                        From <strong>{booking.dateRange.startDate}</strong> to <strong>{booking.dateRange.endDate}</strong><br/>
                        Total price: ${booking.totalPrice} AUD</p>
                        <h5><span className="badge badge-info">Status: {booking.status}</span></h5>
                        </div>
                      : <div className="mt-2">
                        <h5>Booking this listing</h5>
                        <div className="form-inline mt-2">
                            <div className="form-group">
                            <label>Start Date</label>
                            <input type="date" min={startDate} max={endDate} placeholder="yyyy-MM-dd" onChange={e => setBookingStartDate(e.target.value)} className="form-control"/>
                            </div>
                        </div>
                        <div className="form-inline mt-2">
                            <div className="form-group">
                            <label>End Date&nbsp;</label>
                            <input type="date" min={startDate} max={endDate} placeholder="yyyy-MM-dd" onChange={e => setBookingEndDate(e.target.value)} className="form-control"/>
                            </div>
                        </div>
                        <div className="mt-2">
                            <p className="text-primary text-lg">Total: {isNaN(totalPrice) || totalPrice === 0 ? '' : '$' + totalPrice + ' AUD'}</p>
                        </div>
                        <div className="form-group mt-2">
                            <button className="btn btn-success" onClick={() => handleBookingListing(listingId, price)}>Book</button>
                        </div>
                        <div className="mt-2">
                            <p className="font-weight-bold text-warning">{message}</p>
                            <p className="font-weight-bold text-danger">{error}</p>
                        </div>
                        </div>}
                  </div>
                : ''}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default ViewListing;
