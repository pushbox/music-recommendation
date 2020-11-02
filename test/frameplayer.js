

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
    
    ;(function loop() {
        var palyWindow = window.frames[0];
        if(!palyWindow) {
            setTimeout(loop, 300);
            return
        }
        var doc = window.frames[0].document
        var tab = doc.querySelector('.m-tabs');
        if(!tab) {
            setTimeout(loop, 300);
            return
        }
        if(tab){
            var listNodes = tab.nextElementSibling.querySelectorAll('li')
            listNodes = Array.prototype.slice.call(listNodes);
            var listAlbums = listNodes.map(_ => {
                return {
                    album: _.querySelector('p a[href*=album]').getAttribute('title'),
                    artist: _.querySelector('p a[href*=artist]').parentNode.getAttribute('title'),
                    playDom: _.querySelector("[data-res-action=play]")
                }
            }).map(_ => {
                _.album = _.album && removeBlankToSpace(_.album )
                _.artist = _.album && removeBlankToSpace(_.artist)
                return _;
            });

            var searchKeyWord = doc.querySelector('#m-search-input').value;
            var matchedAlbums = listAlbums.filter(_ => {
                var artInKeyword = searchKeyWord.indexOf(_.artist) > -1;
                var albInKeyword = searchKeyWord.indexOf(_.album) > -1;
                if(artInKeyword && albInKeyword) {
                    return true;
                }
                return false
            })
            console.log(listAlbums, matchedAlbums, 'done')
            _matchedAlbums = matchedAlbums
            _listAlbums = listAlbums
            if(matchedAlbums.length) {
                _album = matchedAlbums[0]
            }
            sendMessage({
                method: 'frameplayer.found',
                count: matchedAlbums.length
            })
            // window.parent()
            return
        }
    })();

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

    addMethod('frameplayer.play', function() {
        console.log('frameplayer.play')
        _album.playDom.click()
    });

    window.addEventListener("message", callHandler);
}





function FramePlayer(conf) {
    conf = conf || {};
    var frameWidth = conf.width || 980;
    var frameHeight = conf.height || 700;
    var frameWin = window.open(conf.url, '', 'width='+frameWidth+',height='+frameHeight+',resizable=0');
    window.frameWin = frameWin

    function initlize() {
        window.$_musichelper.executeCode(frameWin, cloudmusic.toString() + '; cloudmusic()')
    }

    var _isReady = false;
    var _pendingMsgs = [];

    function callMethod(methd, args) {
        if(!_isReady) {
            _pendingMsgs.push({
                methd: methd,
                args: args
            })
            return
        }
        frameWin.postMessage(JSON.stringify({
            method: 'frameplayer.' + methd,
            args: args
        }), "*")
    }

    function _triggerPendingMsg () {
        _pendingMsgs.forEach(function(msg) {
            callMethod(msg.methd, msg.args)
        })
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
        _isReady = true
        // _album.playDom.click()
        console.log('_musichelper.ready.recived')
        initlize();
        _triggerPendingMsg();
    })

    window.addEventListener("message", callHandler);
    // setTimeout(function() {
    //     initlize();
    // }, 800)
    return {
        play: function() {
            callMethod('play')
        },
        close: function() {
            frameWin.close()
        },
        focus: function() {
            frameWin.focus()
        }
    }
}

var framep = new FramePlayer({
    url: "https://music.163.com/#/search/m/?s=Steve%20Hackett%20Spectral%20Mornings&type=10"
})