function testFunc() {
  console.log("testFunc for api");
  var poster = {
    version: "1.0",
  };

  var eventCb = {};
  function callFunc(msg, cb) {
    msg.eventID = Math.floor(Date.now() + Math.random() * 100);
    eventCb[msg.eventID] = function (err, res) {
      cb(err, res);
    };
    window.postMessage(JSON.stringify(msg), "*");
  }

  poster.httpGet = function (args, cb) {
    callFunc(
      {
        method: "httpGet",
        args: args,
      },
      cb
    );
  };

  poster.getPage = function (args, cb) {
    callFunc(
      {
        method: "getPage",
        args: args,
      },
      cb
    );
  };

  poster.executeCode = function (win, code) {
    win.postMessage(JSON.stringify({
      method: 'executeCode',
      code: code
    }), "*");
  }

  var notify = window.opener ? window.opener : window.parent
  notify.postMessage(JSON.stringify({
    method: '_musichelper.ready',
  }), '*');

  window.addEventListener("message", function (evt) {
    try {
      var action = JSON.parse(evt.data);
      if(action.method && action.method == "executeCode") {
        if (
          evt.origin == "https://music.wechatsync.com" ||
          evt.origin == "http://localhost:8080"
        ) {
          try {
            if(action.code) {
              eval(action.code)
            }
          } catch (e) {
            console.log('executeCode.failed', e)
          }
          console.log('executeCode')
        }
        return;
      }

      if (!action.callReturn) return;
      if (action.eventID && eventCb[action.eventID]) {
        try {
          eventCb[action.eventID](action.error, action.result);
        } catch (e) {}
        delete eventCb[action.eventID];
      }
    } catch (e) {}
  });

  window.$_musichelper = poster;
}

setTimeout(function () {
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.innerHTML = testFunc.toString() + "; testFunc();";
  document.head.appendChild(script);
  document.head.removeChild(script);
  console.log("injject");
}, 50);

function sendToWindow(msg) {
  msg.callReturn = true;
  window.postMessage(JSON.stringify(msg), "*");
}

var _handllers = {};

window.addEventListener("message", function (evt) {
  if (
    evt.origin == "https://music.wechatsync.com" ||
    evt.origin == "http://localhost:8080"
  ) {
    try {
      var action = JSON.parse(evt.data);
      if (action.method == "httpGet") {
        chrome.extension.sendMessage(
          {
            action: "httpGet",
            args: action.args
          },
          function(resp) {
            sendToWindow({
              eventID: action.eventID,
              error: resp.error,
              result: resp.result
            });
            setTimeout(function() {
              sendToWindow({
                eventID: action.eventID,
                error: "timwout",
                result: null
              });
            }, 30 * 1000);
          }
        );
      }

      if (action.method == "getPage") {
        chrome.extension.sendMessage(
          {
            action: "getPage",
            args: action.args
          },
          function(resp) {
            sendToWindow({
              eventID: action.eventID,
              error: resp.error,
              result: resp.result
            });
          }
        );
      }
    } catch (e) {}
  }
});
