const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());


let feroxProcess = null;
let isScanning = false;

io.on('connection', (socket) => {
    console.log('Client connected');

    if (isScanning) {
       socket.emit('scanStatus', { status: 'running' });
    }


    socket.on('startScan', (data) => {
        if (isScanning) {
          return;
        }
        isScanning = true;
        socket.emit('scanStatus', { status: 'running' });

        const { urls, wordlist } = data;
        const wordlistPath =  wordlist;
        const urlsFilePath = path.join(__dirname, 'urls.txt')
        fs.writeFileSync(urlsFilePath, urls.join('\n'));

        feroxProcess = spawn('feroxbuster', [
            '--stdin',
            '-w', wordlistPath,
            '-o', 'data.json',
            '--json'
        ]);

        const readStream = fs.createReadStream(urlsFilePath);
        readStream.pipe(feroxProcess.stdin);


        feroxProcess.stdout.on('data', (data) => {

            io.emit('terminalOutput', data.toString());
        });


        feroxProcess.stderr.on('data', (data) => {
           io.emit('terminalOutput', data.toString());
        });



        feroxProcess.on('close', (code) => {
            isScanning = false;
            io.emit('scanStatus', { status: 'stopped' });
            console.log(`feroxbuster process exited with code ${code}`);
             fs.readFile('data.json', 'utf8', (err, data) => {
                if (err) {
                   console.error("Error reading data.json:", err);
                    return;
               }

              try {
                  let jsonData = JSON.parse(data);
                   if (!Array.isArray(jsonData)) {
                       jsonData = [jsonData]; // Wrap single object in an array
                    }
                   io.emit('scanResults', jsonData);

                } catch (parseError) {
                     console.error("Error parsing JSON:", parseError);
                 }
            });


             feroxProcess = null;

        });
    });


    socket.on('stopScan', () => {
        if (feroxProcess) {
            feroxProcess.kill('SIGINT'); // Or SIGTERM
            feroxProcess = null; // Clear the process after stopping
        }
    });

     socket.on('getWordlists', () => {
        const wordlistDir = path.join(__dirname, 'public', 'common');
        fs.readdir(wordlistDir, (err, files) => {
            if (err) {
                socket.emit('wordlists', []); // Send empty array on error
                return;
            }
            const txtFiles = files.filter(file => file.endsWith('.txt'));
            socket.emit('wordlists', txtFiles);
        });
    });

      socket.on('importUrls', (urls) => {
          socket.emit('importedUrls', urls);

      });
      socket.on('getInitialResults', () => {
        fs.readFile('data.json', 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading data.json:", err);
                // Handle the case where the file doesn't exist or is empty
                socket.emit('scanResults', []); // Send an empty array
                return;
            }
            try {
                // Check if the file is empty or contains only whitespace
                if (data.trim() === '') {
                    socket.emit('scanResults', []); // Send empty array for empty file
                    return;
                }

                const jsonData = JSON.parse(data);
                 // Add this check: Ensure jsonData is an array
                if (!Array.isArray(jsonData)) {
                  console.error("Error: data.json does not contain a JSON array.");
                  socket.emit('scanResults', []);  // Send empty array if not an array
                  return;
                }

                socket.emit('scanResults', jsonData);
            } catch (parseError) {
                console.error("Error parsing initial JSON:", parseError);
                 socket.emit('scanResults', []); // Send empty array on parsing error
            }
        });
    });



    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});