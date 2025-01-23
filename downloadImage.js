const fs = require('fs');
const https = require('https');
const path = require('path');

async function downloadImage(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, response => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', error => {
      fs.unlink(destination, () => {}); // Delete the file
      reject(error);
    });
  });
}

// Example usage:
// downloadImage('https://example.com/image.jpg', './images/example.jpg')
//   .then(() => console.log('Image downloaded successfully'))
//   .catch(err => console.error('Error downloading image:', err));

module.exports = downloadImage;
