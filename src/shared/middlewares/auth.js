// MIDDLEWARES AUTH
const isAuth = (req, res, next) => {
  if (!req.session?.user) {
    if (req.accepts('html')) return res.redirect('/auth/login');
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

const isStaff = (req, res, next) => {
  if (
    !req.session?.user ||
    !['staff', 'admin'].includes(req.session.user.role)
  ) {
    if (req.accepts('html')) return res.redirect('/auth/login');
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    if (req.accepts('html')) return res.redirect('/auth/login');
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

const isCustomer = (req, res, next) => {
  if (!req.session?.user || req.session.user.role !== 'customer') {
    if (req.accepts('html')) return res.redirect('/customer/login');
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

module.exports = { isAuth, isStaff, isAdmin, isCustomer };
