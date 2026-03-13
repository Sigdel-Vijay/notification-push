const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const tokens = [
  'd5KEw3JzRLmJxs0bnEiMAY:APA91bEz0WdJ8MfSyMTseoq4TqTk-q4tqjXjZiQo5XLKZnzqoRUeTULqXSx5uQOb0VeYvDdewhXr8jnDW6F21zT3BjbkRQw2Q4YvsCUkY-c0LHNKN_b8Nlc'
];

const message = {
  tokens,
  notification: {
    title: 'Test Promo',
    body: 'This is a test notification',
  },
};

admin.messaging()
  .sendEachForMulticast(message)
  .then(response => {
    console.log('✅ Success:', response.successCount);
    console.log('❌ Failed:', response.failureCount);
  })
  .catch(err => {
    console.error('🔥 Error:', err);
  });


