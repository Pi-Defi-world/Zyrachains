require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 15000
}).then(() => {
  console.log('Connected');
  return mongoose.connection.collection('pct-balance-events').estimatedDocumentCount();
}).then(c => {
  console.log('Event count:', c);
  return mongoose.connection.collection('pct-wallet-movements').estimatedDocumentCount();
}).then(c => {
  console.log('Movement count:', c);
  mongoose.disconnect().then(() => process.exit(0));
}).catch(e => {
  console.log('Error:', e.message);
  process.exit(1);
});