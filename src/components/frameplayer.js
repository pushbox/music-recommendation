



function cloudmusic() {
    console.log('start')
    var _matchedAlbums = [];
    var _listAlbums =[]
    var _album = null
    var _searchKeyWord = null
    var _pengdingTaskCount = 0;

    function createLayer() {
      var div = document.createElement('div');
      div.setAttribute('style', 'height: 100%;  width: 100%;  position: fixed;z-index: 888888; top: 0; cursor: pointer;');
      div.addEventListener('click', function(evt) {
        alert('请从外部控制')
        evt.stopPropagation();
        return false
      })
      document.body.appendChild(div);
    }

    function similar(s, t, f) {
      if (!s || !t) {
          return 0
      }
      var l = s.length > t.length ? s.length : t.length
      var n = s.length
      var m = t.length
      var d = []
      f = f || 3
      var min = function(a, b, c) {
          return a < b ? (a < c ? a : c) : (b < c ? b : c)
      }
      var i, j, si, tj, cost
      if (n === 0) return m
      if (m === 0) return n
      for (i = 0; i <= n; i++) {
          d[i] = []
          d[i][0] = i
      }
      for (j = 0; j <= m; j++) {
          d[0][j] = j
      }
      for (i = 1; i <= n; i++) {
          si = s.charAt(i - 1)
          for (j = 1; j <= m; j++) {
              tj = t.charAt(j - 1)
              if (si === tj) {
                  cost = 0
              } else {
                  cost = 1
              }
              d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
          }
      }
      let res = (1 - d[n][m] / l)
      return res.toFixed(f)
  }
   

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
       
        if(doc.querySelector(".u-load")) {
          setTimeout(loop, 300);
          return;
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
         _searchKeyWord = searchKeyWord
         var matchedAlbums = listAlbums.filter((_) => {
           var artInKeyword = searchKeyWord.indexOf(_.artist) > -1;
           var albInKeyword = searchKeyWord.indexOf(_.album) > -1;
           if (artInKeyword && albInKeyword) {
             return true;
           }
           return false;
         });

         if(matchedAlbums.length == 0) {
           var hasArtist = searchKeyWord.split('  ').length > 1
          matchedAlbums = listAlbums.filter((_) => {
            var str1 = hasArtist ? _.album + ' ' +  _.artist : _.album;
            var sim = similar(searchKeyWord, str1);
            console.log('similar', str1, sim)
            if(parseFloat(sim) > 0.5) {
              return true;
            }
            // var artInKeyword = searchKeyWord.indexOf(_.artist) > -1;
            // var albInKeyword = searchKeyWord.indexOf(_.album) > -1;
            // if (artInKeyword && albInKeyword) {
            //   return true;
            // }
            return false;
          });

          
         }
         console.log(listAlbums, matchedAlbums, "done", listNodes.length);
         _matchedAlbums = matchedAlbums;
         _listAlbums = listAlbums;
         if (matchedAlbums.length) {
           _album = matchedAlbums[0];
         }

        if(cb) {
          cb();
        }
        //  sendMessage({
        //    method: "frameplayer.found",
        //    count: matchedAlbums.length,
        //  });
         // window.parent()
         return;
       }
     })();
   }

   findAndChoose();

    function searchAlbum(keyword) {
      _pengdingTaskCount += 1;
    //   doc.querySelector("#m-search-input").value = keyword;
      findAndChoose(keyword, function() {
        _pengdingTaskCount -= 1;
        if(_matchedAlbums.length) {
          playAlbum();
        } else {
          sendStatus({
            tip: '没有找到专辑'
          });
        }
      });   
    }

    function reportStatus() {
      try {
        sendStatus();
      } catch (e) {}
      setTimeout(reportStatus, 2 * 1000);
    }

    reportStatus();
    
    function makeSurePannelOpend() {
      var playListContainer = document.querySelector('#g_playlist')
      if(!playListContainer) {
        document.querySelector("[data-action=panel]").click();
      }
    }

    function isInAutoPlayPolicyError() {
      var pauseButton = document.querySelector("[data-action=pause]")
      if (pauseButton) {
        var status = getPlayerProgress();
        if(status && status.now === "00:00") {
          return true;
        }
      }
      return false
    }

    function playSong(songName) {
      makeSurePannelOpend();
      var nowList = getPlayList(true)
      var listSongs = nowList.filter(_ => _.song == songName);
      // searchAlbum(keyword);
      console.log("frameplayer.playSong", listSongs, nowList);
      if(listSongs.length) {
        listSongs[0].dom.click();
      }
      sendStatus()
    }

    function playAlbum() {
        if(!_album) {
          sendStatus();
          return;
        }
        console.log('_album', _album)
        _album.playDom.click();
        setTimeout(function(){
            document.querySelector(".m-playbar").style.top = "";
            var lockDom = document
              .querySelector(".m-playbar-unlock [data-action=lock]")
            if(lockDom) lockDom.click();
            makeSurePannelOpend();
            sendStatus();
        }, 1000)
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
      // make sure task done
      if(_pengdingTaskCount == 0) {
        _methods[name](args)
      } else {
        (function wait() {
          console.log('wait', _pengdingTaskCount)
          if(_pengdingTaskCount == 0) {
            _methods[name](args)
            return;
          }
          setTimeout(wait, 500);
        })();
      }
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

    function checkIsPlaying() {
      var dom = document.querySelector(_selectors.pause);
      if(dom) {
        return true;
      }
      return false;
    }

    function getPlayerProgress() {
      var progressDom = document.querySelector('.m-pbar .time')
      if(progressDom) {
        var valuePair = progressDom.innerText.split(" / ")
        return {
          percent: parseFloat(document.querySelector('.m-pbar .cur').style.width.replace("%", '')).toFixed(0),
          now: valuePair[0],
          total: valuePair[1]
        }
      }
      return null
    }

    function sendStatus(opt) {
      opt = opt || {};
      var status = {}
      makeSurePannelOpend();
      status.found_albums = _matchedAlbums.map(function(_) {
        return {
          album: _.album,
          artist: _.artist
        };
      });
      status.searchKeyWord = _searchKeyWord;
      status.currentAlbum = _album ? {
        album: _album.album,
        artist: _album.artist,
      } : null,
      status.isPlaying = checkIsPlaying();
      status.now = getNow();
      status.playList = getPlayList();
      status.progress = getPlayerProgress();
      console.log('sendStatus', status)
      status = Object.assign(status, opt);
      
      sendMessage({
        method: "frameplayer.status",
        args: status,
      });
    }

    function getNow() {
        var playDom = document.querySelector(".m-playbar .play");
        if(playDom) {
            return {
              song: playDom.querySelector(".name").innerText.trim(),
              song_detail: document.querySelector(".m-playbar .head a").href,
              artist: playDom.querySelector(".by a").innerText.trim(),
              cover: document
                .querySelector(".m-playbar .head img")
                .getAttribute("src")
                .split("?")[0],
            };
        }
        return null
    }
    function getPlayList(withDom) {
      withDom = withDom || false
        var playlistNodes = document.querySelectorAll(".listbdc li");
        playlistNodes = Array.prototype.slice.call(playlistNodes);
        var list = playlistNodes.map((_) => {
            var item = {
                song: _.querySelector(".col-2").innerText.trim(),
                time: _.querySelector(".col-5").innerText.trim(),
                artist: _.querySelector(".col-4").innerText.trim(),
                isPlay: _.querySelector(".playicn") == null ? false : true,
                //   song: _.querySelector("[data-res-action=play]"),
            };
            if(withDom) {
              item.dom = _;
            }
            return item;;
         });
        return list;;
    }

    var _isStarted = false;

    function initialStart() {
      if (!_isStarted && _album != null) {
        try {
          playAlbum();
          _isStarted = true;
          console.log('initialStart')
          // set
        } catch(e) {
          _isStarted = false;
          console.log(e)
        }
      }
    }

    window.onblur = function() {
      initialStart();
    }
    window.addEventListener('click', initialStart);
    window.addEventListener('mousemove', initialStart);

    addMethod('frameplayer.start', function() {
        console.log("frameplayer.start");
        // _album.playDom.click()
    });

     addMethod("frameplayer.playAlbum", function(keyword) {
       console.log("frameplayer.playAlbum", keyword);
       searchAlbum(keyword);
     });


     addMethod("frameplayer.playSong", function(songName) {
      console.log("frameplayer.playSong", songName);
      playSong(songName)
    });

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
    var frameWin = window.open(conf.url, '', 'width='+frameWidth+',height='+frameHeight+',resizable=0,left=300,top=300');
    // window.frameWin = frameWin
    var _isClosed = false

    function initlize() {
      window.$_musichelper.executeCode(frameWin, cloudmusic.toString() + '; '+cloudmusic.name+'()')
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
        if (_isClosed) {
            window.removeEventListener("message", callHandler);
            return
        } 
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
       emit("status", data);
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
    
    return {
        playAlbum: function(keyword) {
          callMethod("playAlbum", keyword);
          try {
            _hmt && _hmt.push(['_trackEvent', 'player', 'playAlbum', keyword]);
          } catch (e) {}
        }, 
        playSong: function(name) {
          callMethod("playSong", name);
          try {
            _hmt && _hmt.push(['_trackEvent', 'player', 'playSong', keyword]);
          } catch (e) {}
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
        _isClosed = true;
      },
      focus: function() {
        frameWin.focus();
      },
      emit: emit,
      on: on,
    };
}

// if (framep) framep.close();
// var framep = new FramePlayer({
//     url: "https://music.163.com/#/search/m/?s=Steve%20Hackett%20Spectral%20Mornings&type=10"
// })

export default FramePlayer;