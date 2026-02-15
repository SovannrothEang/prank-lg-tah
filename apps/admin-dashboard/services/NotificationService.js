const axios = require('axios');

/**
 * Notification Service
 * Production MVP: Handles automated staff alerts.
 */
class NotificationService {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_STAFF_CHAT_ID;
        this.apiUrl = `https://api.telegram.org/bot${this.token}/sendMessage`;
    }

    async sendStaffAlert(bookingData) {
        if (!this.token || !this.chatId) {
            console.warn('[NOTIFY_WARN]: Telegram credentials missing. Skipping alert.');
            return;
        }

        const message = `
🔔 *NEW BOOKING REQUEST*
--------------------------
👤 *Guest:* ${bookingData.guest_name}
📞 *Phone:* ${bookingData.phone_number}
✈️ *Telegram:* ${bookingData.telegram}
🏨 *Room Type:* ${bookingData.type_name}
📅 *Stay:* ${bookingData.check_in_date} to ${bookingData.check_out_date}
💰 *Total:* $${bookingData.total_price.toFixed(2)}
📝 *Special Req:* ${bookingData.special_requests || 'None'}

[Open Admin Dashboard](http://your-production-ip:3000/requests)
        `;

        try {
            await axios.post(this.apiUrl, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log('[NOTIFY_SUCCESS]: Staff alerted via Telegram.');
        } catch (error) {
            console.error('[NOTIFY_ERROR]: Failed to send Telegram alert', error.message);
        }
    }
}

module.exports = new NotificationService();
