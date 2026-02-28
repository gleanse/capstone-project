const path = require('path');
const { getServiceById, getAvailableDates, lockSlot } = require('./queries');

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

module.exports = {
  getBookingPage,
  getServiceDetails,
  getAvailability,
  lockBookingSlot,
};
