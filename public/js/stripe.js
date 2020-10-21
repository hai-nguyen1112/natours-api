/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51HeS3zG4T7YbP0gdhJLJMR5qssSmAVhWEOVM1CTOuDGXlrST89xnjtg7XCBKcQCj28Y3UuTk4IPn35ODkhZQuCmK00VSl4pkz0'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
    console.log(session)

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    })
  } catch(err) {
    console.log(err);
    showAlert('error', err);
  }
}
