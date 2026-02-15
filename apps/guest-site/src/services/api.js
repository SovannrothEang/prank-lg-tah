import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const getAvailableRooms = async () => {
    const response = await axios.get(`${API_URL}/rooms/available`);
    return response.data.data;
};

export const createBookingRequest = async (bookingData) => {
    const response = await axios.post(`${API_URL}/bookings`, {
        ...bookingData,
        room_uuid: bookingData.roomUuid || bookingData.room_id // Support both for transition
    });
    return response.data;
};

export const guestLogin = async (phoneNumber) => {
    const response = await axios.post(`${API_URL}/guest/login`, { phone_number: phoneNumber });
    return response.data;
};

export const getRestaurantMenu = async () => {
    const response = await axios.get(`${API_URL}/restaurant/menu`);
    return response.data.data;
};
