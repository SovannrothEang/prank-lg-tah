import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const getAvailableRooms = async () => {
    const response = await axios.get(`${API_URL}/rooms/available`);
    return response.data;
};

export const createBookingRequest = async (bookingData) => {
    const response = await axios.post(`${API_URL}/bookings`, bookingData);
    return response.data;
};
