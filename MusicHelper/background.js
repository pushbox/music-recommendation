

$.get("https://xiami.com").then(
  function (data) {
    console.log(data);
  },
  function (er) {
    console.log(er);
  }
);

chrome.runtime.onMessage.addListener(function(
      request,
      sender,
      sendResponseA
    ) {
      if (request.action && request.action == 'httpGet') {
        const args = request.args
        $.get(args.url).then(
          function (data) {
            console.log("sucess", args.url);
            sendResponseA({
              error: null,
              result: data,
            });
          },
          function (er) {
            console.log("faile", er, args.url);
            sendResponseA({
              error: er,
              result: null,
            });
          }
        ).catch(function(er){
            console.log('catch', er)
        });
        return true
      }

      if (request.action && request.action == "getPage") {
        const args = request.args;
        chrome.tabs.create({
            url: args.url,
            active: false
        }, function (tab) {
            setTimeout(function () {
              chrome.tabs.executeScript(
                tab.id,
                {
                  code: args.code,
                },
                function (res) {
                    chrome.tabs.remove(tab.id);
                  console.log("sendResponseA", res);
                    sendResponseA({
                      error: null,
                      result: res,
                    });
                }
              );
            }, args.wait);
        })
        // $.get(args.url).then(
        //   function (data) {
        //     console.log(arguments);
        //     sendResponseA({
        //       error: null,
        //       result: data,
        //     });
        //   },
        //   function (er) {
        //     console.log(er);
        //     sendResponseA({
        //       error: er,
        //       result: null,
        //     });
        //   }
        // );
        return true;
      }
    })
