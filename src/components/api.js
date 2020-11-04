
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

const isChrome = window.navigator.userAgent.indexOf("Chrome") > -1;
const axios = require("axios");
if (!isChrome) {
  const api = axios.create({
    baseURL: "http://localhost:8956",
    timeout: 60 * 1000,
  });
  var bridge = {
    isDesktop: true,
    version: "0.0.2",
  };

  // bridge;
  bridge.httpGet = function(args, cb) {
    (async () => {
      try {
        const result = await api.get("/proxy/http/get", {
          params: {
            url: args.url,
          }
        });
        cb(null, result.data.response);
      } catch(e) {
        cb(e, null);
      }
    })();
  };

  window.$_musichelper = bridge;
}
