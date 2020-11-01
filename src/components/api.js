
export function httpGet(url, timeout = 5000) {
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