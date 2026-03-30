# Process Management

MemoirOS supports multiple process management options:

## Development Monitoring (All Platforms)

### Nodemon (Recommended for Development)

```bash
npm run dev:watch
```

Nodemon automatically restarts the server when files change.

Configuration: `nodemon.json`

### Manual Development Server

```bash
npm run server
```

## Production Process Management

### PM2 (Linux/Production)

PM2 provides advanced process management for production deployments.

#### Installation

```bash
npm install -g pm2
```

#### Usage

```bash
# Start in production mode
npm run pm2:prod

# Start in development mode
npm run pm2:dev

# Stop all processes
npm run pm2:stop

# Restart all processes
npm run pm2:restart

# Reload (zero-downtime reload)
npm run pm2:reload

# Delete all processes
npm run pm2:delete

# Show process list
npm run pm2:list

# Show logs
npm run pm2:logs

# Show monitoring dashboard
npm run pm2:monit

# Save process list
npm run pm2:save
```

#### Direct PM2 Commands

```bash
# Start with ecosystem config
pm2 start ecosystem.config.js --env production

# Restart specific app
pm2 restart memoir-os-api

# Stop specific app
pm2 stop memoir-os-api

# Delete specific app
pm2 delete memoir-os-api

# Show logs for specific app
pm2 logs memoir-os-api

# Show info
pm2 info memoir-os-api

# Monitor
pm2 monit
```

#### Configuration

The PM2 configuration is in `ecosystem.config.js`:

- **instances**: Number of instances (1 for now, can be increased for clustering)
- **max_memory_restart**: Restart if memory exceeds 500MB
- **autorestart**: Automatically restart on crash
- **max_restarts**: Maximum restarts before giving up (10)
- **min_uptime**: Minimum uptime before considering app stable (10s)
- **restart_delay**: Delay between restarts (4 seconds)

#### Startup Script (Linux)

To automatically start MemoirOS on system boot:

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

#### Monitoring

```bash
# PM2 monitoring dashboard
pm2 monit

# Web-based monitoring (optional)
pm2 link <secret_key> <public_key>
```

### Windows Service (Production on Windows)

For Windows production deployments, consider using:

1. **node-windows** - Create native Windows service
2. **IISNode** - Host in IIS
3. **Docker** - Containerized deployment

Example using node-windows:

```bash
npm install -g node-windows
```

Create `windows-service.js`:
```javascript
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'MemoirOS API',
  description: 'MemoirOS API Server',
  script: 'C:\\path\\to\\server\\index.js',
  nodeOptions: ['--import', 'tsx/esm']
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

## Log Management

Logs are stored in `logs/` directory:
- `pm2-error.log` - PM2 error logs (PM2 only)
- `pm2-out.log` - PM2 output logs (PM2 only)
- `pm2-combined.log` - PM2 combined logs (PM2 only)
- `api-server-*.log` - Winston application logs
- `api-server-error-*.log` - Winston error logs

## Troubleshooting

### High Memory Usage

1. Check for memory leaks in code
2. Adjust `max_memory_restart` in ecosystem.config.js
3. Check Winston logs for patterns

### Frequent Restarts

1. Check error logs: `pm2 logs --err` (PM2) or `logs/api-server-error-*.log`
2. Increase `max_restarts` if needed
3. Check `min_uptime` threshold

### Startup Issues

1. Check if port 3000 is available
2. Check if Ollama is running
3. Check environment variables in `.env`
4. Review logs for specific errors
