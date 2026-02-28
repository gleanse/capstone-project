const { getAllServices } = require('./queries');

const getServices = async (req, res) => {
  try {
    const services = await getAllServices();
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getServices };
