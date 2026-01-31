const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  query: { role: 'ADMIN' }
});

socket.on('connect', () => {
  console.log('✅ Admin connected');
});

socket.on('qs_registered', (data) => {
  console.log('📢 QS registered:', data);
});
