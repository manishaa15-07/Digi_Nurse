// test_socket.js - small socket.io-client test (ESM)
import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';
const ROOM = 'room-test-1';
const USER = 'testpatient@example.com';

const socket = io(URL, { transports: ['websocket'], reconnectionDelayMax: 10000 });

socket.on('connect', () => {
  console.log('socket connected', socket.id);
  socket.emit('join', { roomId: ROOM, userId: USER, role: 'patient' });

  setTimeout(()=>{
    socket.emit('message', { roomId: ROOM, text: 'Hello from test client', senderId: USER, senderRole: 'patient' });
  }, 500);
});

socket.on('history', (payload) => {
  console.log('history:', payload);
});

socket.on('message', (msg) => {
  console.log('message received:', msg);
  // close after receiving one message
  setTimeout(()=>socket.close(), 500);
});

socket.on('disconnect', () => console.log('socket disconnected'));

socket.on('connect_error', (err) => console.error('connect_error', err.message));
