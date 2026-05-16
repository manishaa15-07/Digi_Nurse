import { Server } from 'socket.io';

// In-memory chat store (replace with DB in production)
const rooms = new Map(); // roomId -> { participants: Set<string>, messages: Array }

function getOrCreateRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, { participants: new Set(), messages: [] });
    }
    return rooms.get(roomId);
}

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        console.log('🔌 [Socket] New connection:', socket.id);

        socket.on('join', ({ roomId, userId, role }) => {
            console.log('🔌 [Socket] Join request:', { socketId: socket.id, roomId, userId, role });
            if (!roomId || !userId) {
                console.log('🔌 [Socket] Invalid join request - missing roomId or userId');
                return;
            }
            // If this socket already joined the same room as the same user, ignore duplicate
            if (socket.data && socket.data.roomId === roomId && socket.data.userId === userId) {
                console.log('🔌 [Socket] Duplicate join from same socket ignored', { socketId: socket.id, roomId, userId });
                return;
            }
            // If socket already in the room, skip re-adding
            if (socket.rooms && socket.rooms.has(roomId)) {
                console.log('🔌 [Socket] Socket already in room, skipping join', { socketId: socket.id, roomId });
                socket.data = { roomId, userId, role };
                socket.emit('joined', { roomId });
                return;
            }
            const room = getOrCreateRoom(roomId);
            room.participants.add(userId);
            // Join both the conversation room and a personal room for user-specific notifications
            socket.join(roomId);
            socket.join(userId);
            socket.data = { roomId, userId, role };
            console.log('🔌 [Socket] User joined room:', { socketId: socket.id, roomId, userId, role, participants: Array.from(room.participants) });
            socket.emit('history', { roomId, messages: room.messages });
            socket.to(roomId).emit('presence', { userId, role, status: 'online' });
        });

        socket.on('leave', ({ roomId, userId }) => {
            try {
                const room = getOrCreateRoom(roomId);
                room.participants.delete(userId);
                socket.leave(roomId);
                socket.leave(userId);
                socket.data = {};
                console.log('🔌 [Socket] User left room:', { socketId: socket.id, roomId, userId, participants: Array.from(room.participants) });
                socket.to(roomId).emit('presence', { userId, status: 'offline' });
            } catch (e) {
                console.warn('🔌 [Socket] Error handling leave:', e);
            }
        });

        socket.on('message', (payload) => {
            console.log('🔌 [Socket] Message received:', payload);
            const { roomId, text, clientId, senderId, senderRole } = payload || {};
            if (!roomId || !text || !senderId) {
                console.log('🔌 [Socket] Invalid message - missing required fields');
                return;
            }
            const room = getOrCreateRoom(roomId);
            const message = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                clientId: clientId || null,
                text,
                senderId,
                senderRole: senderRole || 'patient',
                timestamp: Date.now(),
                readBy: [senderId],
                roomId: roomId
            };
            room.messages.push(message);
            console.log('🔌 [Socket] Message saved and broadcasting:', { roomId, messageId: message.id, participants: Array.from(room.participants) });

            // Send message to other sockets in the conversation room (excluding sender socket)
            socket.to(roomId).emit('message', message);
            // Ensure the sending socket also receives the message once
            socket.emit('message', message);

            // Notify any participant sockets that are NOT currently joined in the conversation room
            // This avoids duplicate deliveries to devices that are already in the room.
            try {
                const roomSockets = io.sockets.adapter.rooms.get(roomId) || new Set();
                for (const participantId of room.participants) {
                    const personalSockets = io.sockets.adapter.rooms.get(participantId);
                    if (!personalSockets) continue;
                    for (const sid of personalSockets) {
                        if (!roomSockets.has(sid)) {
                            io.to(sid).emit('message', message);
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to selectively emit to participant sockets:', e);
            }
        });

        socket.on('typing', ({ roomId, userId, isTyping }) => {
            if (!roomId || !userId) return;
            socket.to(roomId).emit('typing', { userId, isTyping: !!isTyping });
        });

        socket.on('read', ({ roomId, userId, messageIds }) => {
            if (!roomId || !userId || !Array.isArray(messageIds)) return;
            const room = getOrCreateRoom(roomId);
            for (const m of room.messages) {
                if (messageIds.includes(m.id) && !m.readBy.includes(userId)) {
                    m.readBy.push(userId);
                }
            }
            socket.to(roomId).emit('read', { userId, messageIds });
        });

        socket.on('disconnect', () => {
            const { roomId, userId, role } = socket.data || {};
            if (roomId && userId) {
                const room = getOrCreateRoom(roomId);
                room.participants.delete(userId);
                socket.to(roomId).emit('presence', { userId, role, status: 'offline' });
            }
        });
    });

    return io;
}

export { initSocket };

