const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require("path");

let dir
/**
 * Downloads file from remote HTTP[S] host and puts its contents to the
 * specified location.
 */
async function download(url, savedFileName) {
  // set download folder
  !dir && download.setDownloadFolder()

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true})
  }
  const filePath = path.resolve(dir, new Date().getTime() + '_' + savedFileName)
  const proto = !url.charAt(4).localeCompare('s') ? https : http;

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    let fileInfo = null;

    const request = proto.get(url, response => {
      if (response.statusCode !== 200) {
        fs.unlink(filePath, () => {
          reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        });
        return;
      }

      fileInfo = {
        mime: response.headers['content-type'],
        size: parseInt(response.headers['content-length'], 10),
      };

      response.pipe(file);
    });

    // The destination stream is ended by the time it's called
    file.on('finish', () => resolve(fileInfo));

    request.on('error', err => {
      fs.unlink(filePath, () => reject(err));
    });

    file.on('error', err => {
      fs.unlink(filePath, () => reject(err));
    });

    request.end();
  });
}

download.setDownloadFolder = absoluteDirPath => {
  dir = absoluteDirPath || process.env.ABSOLUTE_DIR_PATH || path.resolve(__dirname, '../../downloads')
}

const downloads = (urls) => {
  urls.reduce((pre, curLink, index) => pre.then(()=> {
    const list = curLink.split('/')
    download(curLink, list[list.length - 1])
  }),Promise.resolve());
}

module.exports.download = download
module.exports.setDownloadFolder = download.setDownloadFolder
module.exports.downloads = downloads