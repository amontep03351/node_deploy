const fs = require('fs');
const FTPClient = require('ftp');
const AdmZip = require('adm-zip');

const configA = {
  host: '192.168.19.92',
  user: 'administrator',
  password: '1q2w3e4r=-', 
  port: 54, 
};

const configB = {
    host: '192.168.19.92',
    user: 'administrator',
    password: '1q2w3e4r=-', 
    port: 51, 
};

const zipFileName = 'deploy.zip';

// Step 1: Connect to Server A and check if the file exists before downloading
const downloadFromServerA = () => {
  const ftpA = new FTPClient();

  ftpA.on('ready', () => {
    // Check if the file exists on Server A
    ftpA.size(zipFileName, (err, size) => {
      if (err) {
        console.error(`Error checking file existence on Server A: ${err.message}`);
        ftpA.end();
        return;
      }

      if (size > 0) {
        // File exists, proceed to download
        ftpA.get(zipFileName, (downloadErr, stream) => {
          if (downloadErr) throw downloadErr;

          const fileStream = fs.createWriteStream(zipFileName);
          stream.pipe(fileStream);

          fileStream.on('close', () => {
            console.log('File downloaded from Server A');
            ftpA.end();
            extractFile();
          });
        });
      } else {
        // File does not exist on Server A
        console.log(`File '${zipFileName}' does not exist on Server A`);
        ftpA.end();
      }
    });
  });

  ftpA.connect(configA);
};

// Step 2: Extract the ZIP file
const extractFile = () => {
  const zip = new AdmZip(zipFileName);
  zip.extractAllTo('/deploy/');

  console.log('File extracted');
  uploadToServerB();
};

// Step 3: Connect to Server B and upload the extracted files
const uploadToServerB = () => {
  const ftpB = new FTPClient();

  ftpB.on('ready', () => {
    // Upload the extracted files to Server B
    // Make sure to handle the correct destination path on Server B
    ftpB.put('/deploy.zip', '/deploy.zip', (err) => {
      if (err) throw err;

      console.log('Files uploaded to Server B');
      ftpB.end();
      cleanup();
    });
  });

  ftpB.connect(configB);
};

// Step 4: Cleanup - Delete the local ZIP file and extracted files
const cleanup = () => {
  fs.unlinkSync(zipFileName);
  // Optionally, you may want to delete the extracted files too
  // fs.rmdirSync(/* specify the local extracted files path */, { recursive: true });

  console.log('Cleanup completed');
};

// Start the process
downloadFromServerA();
