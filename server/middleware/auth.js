const jwt = require('jsonwebtoken');

// this middleware checks if the user has a valid token or not
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  // if no token is sent
  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // token comes as "Bearer <token>" so splitting it
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  try {
    // verifying the token with our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // saving user info in request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = { verifyToken };
