const { USER_ROLES } = require('../config/constants');

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
};

// Check if user is not authenticated (for login/register pages)
const isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  return next();
};

// Check if user is client
const isClient = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === USER_ROLES.CLIENT) {
    return next();
  }
  return res.status(403).render('error', {
    title: 'Access Denied',
    error: {
      status: 403,
      message: 'You do not have permission to access this page.'
    }
  });
};

// Check if user is worker
const isWorker = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === USER_ROLES.WORKER) {
    return next();
  }
  return res.status(403).render('error', {
    title: 'Access Denied',
    error: {
      status: 403,
      message: 'You do not have permission to access this page.'
    }
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === USER_ROLES.ADMIN) {
    return next();
  }
  return res.status(403).render('error', {
    title: 'Access Denied',
    error: {
      status: 403,
      message: 'You do not have permission to access this page.'
    }
  });
};

// Check if user is worker or admin
const isWorkerOrAdmin = (req, res, next) => {
  if (req.session && req.session.user && 
      (req.session.user.role === USER_ROLES.WORKER || req.session.user.role === USER_ROLES.ADMIN)) {
    return next();
  }
  return res.status(403).render('error', {
    title: 'Access Denied',
    error: {
      status: 403,
      message: 'You do not have permission to access this page.'
    }
  });
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
  isClient,
  isWorker,
  isAdmin,
  isWorkerOrAdmin
};

