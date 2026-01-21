const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const tokens = [
  'd9KqmcEdRyyt6vKqD52TuK:APA91bFb9bj4XuMvJCWsR3bdsDwV3_dhTyXxPPhe9xIfpJrYz6lcSNzpLQD-etJa5NjkO75-H67aCw13IL4vUTd-Ajy3SzOAXdrQVlLpzgpHuRVkn17aY2I'
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


