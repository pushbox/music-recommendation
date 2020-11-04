
export function httpGet(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    console.log("window.$_musichelper", url);
    window.$_musichelper.httpGet({ url: url }, function(error, data) {
      //   console.log("window.$_musichelper", error, data);
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
    setTimeout(function() {
      reject("timeout");
    }, timeout);
  });
}

export function removeBlankToSpace(str) {
    if(str == null) return str
    return str.replace(new RegExp(String.fromCharCode(160), "g"), " ");
}


export function getResizeImage (src, size = null) {
  console.log('getResizeImage')
  const serverNum = Math.floor(Math.random() * 4)
  const rawPath = src.replace('https://', '').replace('http://', '')
  return size ? `https://i${serverNum}.wp.com/${rawPath}?resize=${size.width}%2C${size.height}` :  `https://i${serverNum}.wp.com/${rawPath}`
}