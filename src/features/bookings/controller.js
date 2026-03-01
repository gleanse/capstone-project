const path = require('path');
const {
  getServiceById,
  getAvailableDates,
  lockSlot,
  releaseSlot,
  updateBookingDetails,
} = require('./queries');

const getBookingPage = (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.html'));
};

const getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await getServiceById(serviceId);

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, data: service });
  } catch (error) {
    console.error('Get service details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const dates = await getAvailableDates(serviceId);
    res.json({ success: true, data: dates });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const lockBookingSlot = async (req, res) => {
  try {
    const { availabilityId, serviceId, variantId } = req.body;
    const userId = req.session?.user?.id || null;

    if (!availabilityId || !serviceId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const booking = await lockSlot({
      availabilityId,
      serviceId,
      variantId,
      userId,
    });
    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Lock slot error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const releaseBookingSlot = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing bookingId' });
    }

    const booking = await releaseSlot(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already released',
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Release slot error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      guestName,
      guestEmail,
      guestPhone,
      motorcyclePlate,
      motorcycleModel,
      motorcycleColor,
      motorcycleDescription,
    } = req.body;

    if (
      !bookingId ||
      !guestName ||
      !guestEmail ||
      !guestPhone ||
      !motorcyclePlate ||
      !motorcycleModel ||
      !motorcycleColor
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    const booking = await updateBookingDetails(bookingId, {
      guestName,
      guestEmail,
      guestPhone,
      motorcyclePlate,
      motorcycleModel,
      motorcycleColor,
      motorcycleDescription,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already confirmed',
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBookingPage,
  getServiceDetails,
  getAvailability,
  lockBookingSlot,
  releaseBookingSlot,
  updateBooking,
};
