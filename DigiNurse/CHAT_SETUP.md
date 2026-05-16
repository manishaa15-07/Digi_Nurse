# Chat System Setup Guide

## Backend Setup ✅

The backend socket server is already configured in:
- `backend/chat/socket.js` - Socket.IO server implementation
- `backend/server.js` - Socket server initialization

## Frontend Setup

### 1. Install Socket.IO Client

Run this command in the DigiNurse directory:

```bash
cd /Users/manisha/Desktop/real/DigiNurse/DigiNurse
npm install socket.io-client
```

### 2. Files Created/Updated

#### New Files:
- `app/(tabs)/chat.tsx` - Patient chat screen
- `app/(caretaker-tabs)/chat.tsx` - Caretaker chat screen  
- `contexts/NotificationContext.tsx` - Notification system
- `utils/socket-client.ts` - Socket client wrapper

#### Updated Files:
- `app/_layout.tsx` - Added NotificationProvider and chat route
- `app/(tabs)/my-caregivers.tsx` - Added chat navigation
- `app/(caretaker-tabs)/my-patients.tsx` - Added chat navigation
- `backend/server.js` - Integrated socket server

## How It Works

### 1. Chat Flow:
1. Patient clicks "Chat" on a caregiver → Opens chat screen
2. Caretaker clicks "Chat" on a patient → Opens chat screen
3. Both users join the same room (sorted user IDs)
4. Messages are sent via WebSocket in real-time

### 2. Room System:
- Room ID: `userId1_userId2` (sorted alphabetically)
- Both users join the same room for bidirectional chat
- Messages persist in memory (backend)

### 3. Notifications:
- Real-time notifications for new messages
- Connection status indicators
- Typing indicators

### 4. Features:
- ✅ Real-time messaging
- ✅ Message history
- ✅ Typing indicators  
- ✅ Online/offline status
- ✅ Notifications
- ✅ Cross-platform (patient ↔ caretaker)

## Testing

1. **Start Backend**: Make sure MongoDB and backend server are running
2. **Install Dependencies**: Run `npm install socket.io-client`
3. **Login**: Use patient and caretaker accounts
4. **Link Users**: Connect patient and caretaker
5. **Test Chat**: Click "Chat" button to open chat screen
6. **Send Messages**: Test real-time messaging

## Socket Events

### Client → Server:
- `join` - Join chat room
- `message` - Send message
- `typing` - Typing indicator
- `read` - Mark messages as read

### Server → Client:
- `history` - Chat history
- `message` - New message
- `typing` - Typing status
- `presence` - User online/offline
- `connection_request` - New connection request

## Troubleshooting

1. **Socket Connection Failed**: Check if backend server is running
2. **Messages Not Sending**: Verify socket.io-client is installed
3. **No Notifications**: Check NotificationProvider is wrapped in app
4. **Chat Not Opening**: Verify route is added to _layout.tsx

The chat system is now fully integrated with WebSocket real-time communication! 🚀
