const { spawn } = require('child_process');

console.log('Testing backend server startup...');

const server = spawn('npm', ['run', 'dev'], {
  cwd: 'C:\\Users\\Aditya\\OneDrive\\Desktop\\ChainYodha.Ai\\backend',
  shell: true
});

let output = '';
let hasStarted = false;

server.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  console.log(text);
  
  if (text.includes('ChainYodha.Ai Backend running on port')) {
    hasStarted = true;
    console.log('\n✅ SERVER STARTED SUCCESSFULLY!');
    setTimeout(() => {
      server.kill();
      process.exit(0);
    }, 2000);
  }
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  console.error('ERROR:', text);
  
  if (text.includes('SQLITE_ERROR') || text.includes('Failed to start server')) {
    console.log('\n❌ SERVER FAILED TO START');
    server.kill();
    process.exit(1);
  }
});

server.on('close', (code) => {
  if (!hasStarted && code !== 0) {
    console.log('\n❌ SERVER FAILED TO START');
    process.exit(1);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  if (!hasStarted) {
    console.log('\n⏰ TIMEOUT - Server did not start within 10 seconds');
    server.kill();
    process.exit(1);
  }
}, 10000);
