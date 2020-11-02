

function cloudmusic() {
    console.log('start')
    var _matchedAlbums = [];
    var _listAlbums =[]
    var _album = null

    function removeBlankToSpace(str) {
        if(str == null) return str
        return str.replace(new RegExp(String.fromCharCode(160), "g"), " ");
    }

    function sendMessage(msg) {
        var win = window.opener ? window.opener : window.parent
        win.postMessage(JSON.stringify(msg), "*");
    }
    
   function findAndChoose(keyword, cb) {
     (function loop() {
       var palyWindow = window.frames[0];
       if (!palyWindow) {
         setTimeout(loop, 300);
         return;
       }
       var doc = window.frames[0].document;
       var tab = doc.querySelector(".m-tabs");
       if (!tab) {
         setTimeout(loop, 300);
         return;
       }

        if (keyword) {
            doc.querySelector("#m-search-input").value = keyword;
            doc.querySelector("a[title=搜索]").click();
            setTimeout(function(){
                findAndChoose(null, cb)
            }, 800);
            return
        }
       
     
       if (tab) {
         var listNodes = tab.nextElementSibling.querySelectorAll("li");
         listNodes = Array.prototype.slice.call(listNodes);
         var listAlbums = listNodes
           .map((_) => {
             return {
               album: _.querySelector("p a[href*=album]").getAttribute("title"),
               artist: _.querySelector(
                 "p a[href*=artist]"
               ).parentNode.getAttribute("title"),
               playDom: _.querySelector("[data-res-action=play]"),
             };
           })
           .map((_) => {
             _.album = _.album && removeBlankToSpace(_.album);
             _.artist = _.album && removeBlankToSpace(_.artist);
             return _;
           });

         var searchKeyWord = doc.querySelector("#m-search-input").value;
         var matchedAlbums = listAlbums.filter((_) => {
           var artInKeyword = searchKeyWord.indexOf(_.artist) > -1;
           var albInKeyword = searchKeyWord.indexOf(_.album) > -1;
           if (artInKeyword && albInKeyword) {
             return true;
           }
           return false;
         });
         console.log(listAlbums, matchedAlbums, "done");
         _matchedAlbums = matchedAlbums;
         _listAlbums = listAlbums;
         if (matchedAlbums.length) {
           _album = matchedAlbums[0];
           if(cb) {
               cb();
           }
         }
         sendMessage({
           method: "frameplayer.found",
           count: matchedAlbums.length,
         });
         // window.parent()
         return;
       }
     })();
   }

   findAndChoose();

    function searchAlbum(keyword) {
    //   doc.querySelector("#m-search-input").value = keyword;
      findAndChoose(keyword, function() {
        playAlbum();
      });   
    }

    function playAlbum() {
        _album.playDom.click();
        setTimeout(function(){
            document.querySelector(".m-playbar").style.top = "";
            document.querySelector("[data-action=lock]").click();
            document.querySelector("[data-action=panel]").click();
            sendStatus();
        }, 2000)
    }

    // function play() {
    //     _album.playDom.click()
    // }
  
    var _methods = {};
    function addMethod(name, fun) {
        _methods[name] = fun
    }

    function hasMethod(name) {
        return !!_methods[name]
    }

    function executeMethod(name, args) {
        _methods[name](args)
    }

    function callHandler(evt) {
        console.log(evt)
        var action = JSON.parse(evt.data);
        if(hasMethod(action.method)) {
            try {
                executeMethod(action.method, action.args)
            } catch (e) {
                console.log('executeMethod.failed', e)
            }
        }
    }

    var _selectors = {
      next: "[data-action=next]",
      prev: "[data-action=prev]",
      play: "[data-action=play]",
      pause: "[data-action=pause]",
      pannel: "[data-action=panel]",
    };

    function triggerDomClick(type) {
        var dom = document.querySelector(_selectors[type]);
        if (dom) {
          dom.click();
          sendStatus();
        }
    }

    function sendStatus() {
        var status = {}
        status.playList = getPlayList();
        sendMessage({
          method: "frameplayer.status",
          args: status,
        });
    }

    function getPlayList() {
        var playlistNodes = document.querySelectorAll(".listbdc li");
        playlistNodes = Array.prototype.slice.call(playlistNodes);
        var list = playlistNodes.map((_) => {
            return {
                song: _.querySelector(".col-2").innerText.trim(),
                time: _.querySelector(".col-5").innerText.trim(),
                artist: _.querySelector(".col-4").innerText.trim(),
                isPlay: _.querySelector(".playicn") == null ? false : true,
                //   song: _.querySelector("[data-res-action=play]"),
            };
         });
        return list;;
    }

    var _isStarted = false;
    window.onblur = function() {
        console.log("onfocus");
        if (!_isStarted) {
            playAlbum();
            // _album.playDom.click();
            _isStarted = true;
            setTimeout(function() {
                
                // sendStatus();
            }, 300);
        }
    }

    addMethod('frameplayer.start', function() {
        console.log("frameplayer.start");
        // _album.playDom.click()
    });

     addMethod("frameplayer.playAlbum", function(keyword) {
       console.log("frameplayer.playAlbum", keyword);
       searchAlbum(keyword);
     });

    ;

    var actions = ['play', 'next', 'pause', 'prev'];
    actions.forEach(function(actionType) {
        var methodName = "frameplayer." + actionType;
         addMethod(methodName, function() {
           // console.log("frameplayer.next");
           triggerDomClick(actionType);
         });
    })

    window.addEventListener("message", callHandler);
}


function FramePlayer(conf) {
    conf = conf || {};
    var frameWidth = conf.width || 980;
    var frameHeight = conf.height || 348;
    var frameWin = window.open(conf.url, '', 'width='+frameWidth+',height='+frameHeight+',resizable=0');
    window.frameWin = frameWin

    function initlize() {
        window.$_musichelper.executeCode(frameWin, cloudmusic.toString() + '; cloudmusic()')
    }

    function callMethod(methd, args) {
        frameWin.postMessage(JSON.stringify({
            method: 'frameplayer.' + methd,
            args: args
        }), "*")
    }

    var _methods = {};
    function addMethod(name, fun) {
        _methods[name] = fun
    }

    function hasMethod(name) {
        return !!_methods[name]
    }

    function executeMethod(name, args) {
        _methods[name](args)
    }

    function callHandler(evt) {
        var action = JSON.parse(evt.data);
        if(hasMethod(action.method)) {
            try {
                executeMethod(action.method, action.args)
            } catch (e) {
                console.log('executeMethod.failed', e)
            }
        }
    }

    // make sure api is readdy
    addMethod('_musichelper.ready', function() {
         document.body.click();
        // _album.playDom.click()
        console.log('_musichelper.ready.recived')
        initlize();
    })


     addMethod("frameplayer.status", function(data) {
        console.log("frameplayer.status", data);
       emit("playlist", data);
     });

    window.addEventListener("message", callHandler);

    var _listenners = {};

    function on(type, func) {
        _listenners[type] = _listenners[type] || [];
        _listenners[type].push(func);
    }

    function emit(type, data) {
        var handlers = _listenners[type] || [];
        for(var k in handlers) {
            var handler = handlers[k];
            try {
                handler(data);
            } catch(e) {}
        }
    }

    // setTimeout(function() {
    //     initlize();
    // }, 800)
    return {
        playAlbum: function(keyword) {
            callMethod("playAlbum", keyword);
        }, 
      start: function() {
        callMethod("start");
      },
      play: function() {
        callMethod("play");
      },
      pause: function() {
        callMethod("pause");
      },
      next: function() {
        callMethod("next");
      },
      prev: function() {
        callMethod("prev");
      },
      mute: function() {
        callMethod("mute");
      },
      close: function() {
        frameWin.close();
      },
      focus: function() {
        frameWin.focus();
      },
      emit: emit,
      on: on,
    };
}

var framep = new FramePlayer({
    url: "https://music.163.com/#/search/m/?s=Steve%20Hackett%20Spectral%20Mornings&type=10"
})