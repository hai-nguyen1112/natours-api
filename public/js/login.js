/* eslint-disable */
import axios from 'axios';
import {showAlert} from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {email, password}
    })

    if (res.data.status === 'success') {
      console.log(res);
      showAlert('success', 'Logged in successfully!')
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

  } catch(err) {
    console.log(err)
    showAlert('error', 'Something went wrong!')
  } 
}

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    })
    console.log('I am here');
    if (res.data.status === 'success') {
      location.reload('true');
    }
  } catch(err) {
    showAlert('error', 'Error logging out! Try again.')
  }
}