// Socket client wrapper to handle dynamic imports
// Implements a singleton so the app creates only one physical socket connection.
let socketInstance: any = null;

export const createSocketConnection = async (url: string, options?: any) => {
    try {
        if (socketInstance && socketInstance.connected) {
            return socketInstance;
        }

        const socketModule = await import('socket.io-client');
        const { io } = socketModule;

        // Ensure we don't force multiple connections. Use default options merged with given ones.
        socketInstance = io(url, {
            transports: ['websocket'],
            autoConnect: true,
            ...options,
        });

        return socketInstance;
    } catch (error) {
        console.error('Failed to load socket.io-client:', error);
        throw error;
    }
};

export const getSocketInstance = () => socketInstance;
