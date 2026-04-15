module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinQueueRoom', (queueId) => {
      socket.join(queueId);
      console.log(`Socket ${socket.id} joined room ${queueId}`);
    });

    socket.on('leaveQueueRoom', (queueId) => {
      socket.leave(queueId);
      console.log(`Socket ${socket.id} left room ${queueId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
