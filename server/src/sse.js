const clients = new Set();

function sseHandler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);
  clients.add(res);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

function broadcast(event = 'update', data = '{}') {
  const msg = `event: ${event}\ndata: ${data}\n\n`;
  clients.forEach(client => client.write(msg));
}

module.exports = { sseHandler, broadcast };
