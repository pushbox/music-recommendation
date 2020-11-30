const axios = require("axios");
const proxyAPI = axios.create({
  baseURL: "https://api.wechatsync.com",
  timeout: 15 * 1000,
});

export function httpGetByExtension(url, timeout = 30000) {
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

window.httpGetByExtension = httpGetByExtension

export async function httpGet(url, timeout = 30000) {
  if(url.indexOf('last.fm') > -1) {
    try {
      const { data } = await proxyAPI.get('/music/http', {
        params: {
          url: url
        }
      });
      if(data.response) {
        return data.response
      }
    } catch (e) {}
  }
  return await httpGetByExtension(url, timeout);
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

const isElectron = window.navigator.userAgent.indexOf("Electron") > -1;
const isChrome = window.navigator.userAgent.indexOf("Chrome") > -1;

if (!isChrome || isElectron) {
  
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
          },
        });
        cb(null, result.data.response);
      } catch (e) {
        cb(e, null);
      }
    })();
  };

  bridge.executeCode = function (win, code) {
    win.postMessage(JSON.stringify({
      method: 'executeCode',
      code: code
    }), "*");
  }

  window.$_musichelper = bridge;
}
