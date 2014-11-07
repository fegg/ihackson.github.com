/**************************** Helper *******************************/
(function() {
    /**************************** 重写zepto on方法避免事件穿透 *******************************/
    (function() {
        var INTERVAL_MIN = 500;
        var lastCalledTime = (new Date()).getTime();
        function throttle(handler) {
            return function() {
                var curTime = (new Date()).getTime();
                if(curTime - lastCalledTime > INTERVAL_MIN) {
                    //console.log('called', curTime - lastCalledTime);
                    lastCalledTime = curTime;
                    handler.apply(this, arguments);
                }
            }
        }

        var oldOn = $.fn.on;
        $.fn.on = function( evt ){
            if(evt === 'tap'){
                var args = Array.prototype.slice.call(arguments);
                var handlerIndex;
                for(var i = 0; i < args.length; i++) {
                    if(typeof args[i] === 'function') {
                        handlerIndex = i;
                        break;
                    }
                }
                args[handlerIndex] = throttle(args[handlerIndex]);
                this.on('click', function(e) {
                    e.preventDefault();
                });
                return oldOn.apply( this, args );
            }
            return oldOn.apply( this, arguments );
        };

    })();

    /**************************** form *******************************/
    $.fn.toJSON = function() {
      var form = $(this);
      var reqArr = form.serializeArray();
      var jsonObj = {};
      for(var i = 0, len = reqArr.length; i < len; i++) {
        var param = reqArr[i];
        jsonObj[param.name] = param.value;
      }

      return jsonObj;
    };

    /**************************** history *******************************/
    $.history = {
        pushState: function(stateObj) {
            $.setHash(stateObj); 
        },

        statechange: function(cb) {
            $(window).on('hashchange', function(e) {
                var hashObj = $.queryHash();
                cb(hashObj);
            });
        },
    };

    /**************************** url *******************************/
    $.querySearch = function(key, url) {
        if(!url) {
            url = window.location.search;
        }
        url = url.replace(/^[^?=]*\?/ig, '').split('#')[0]; 
        return decodeURI(url, key);
    }

    $.setSearch = function(key, value) {
        var state = {};
        var data = $.querySearch();

        if(arguments.length === 2) {
            state[key] = value;
        } else {
            state = key;
        }

        for(var attr in state) {
            if(state.hasOwnProperty(attr)) {
                data[attr] = state[attr];
            }
        }
        window.location.search = $.param(data);
    }

    $.queryHash = function(key) {
        var url = window.location.hash;
        url = url.replace(/^[^=]*#/ig, '');
        return decodeURI(url, key);
    }

    $.setHash = function(key, value) {
        var state = {};
        var data = $.queryHash();

        if(arguments.length === 2) {
            state[key] = value;
        } else {
            state = key;
        }

        for(var attr in state) {
            if(state.hasOwnProperty(attr)) {
                data[attr] = state[attr];
            }
        }
        window.location.hash = $.param(data);
    }

    /**************************** encode *******************************/
    $.encode4HtmlValue = function(s) {
        var el = document.createElement('pre'); //这里要用pre，用div有时会丢失换行，例如：'a\r\n\r\nb'
        var text = document.createTextNode(s);
        el.appendChild(text);
        return el.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }


    $.encode_xor = function xor_str(value) {
        var to_enc = value;
        var xor_key="9"
        var the_res="";
        for(i=0;i<to_enc.length;++i)
        {
            the_res+=String.fromCharCode(xor_key^to_enc.charCodeAt(i));
        }

        return $.base64.encode(the_res);
    }


    // a=1&b=2 to {a:1,b:2}
    function decodeURI(url, key) {
        var json = {};
        url.replace(/(^|&)([^&=]+)=([^&]*)/g, function (a, b, key , value){
            try {
                key = decodeURIComponent(key);
            } catch(e) {}

            try {
                value = decodeURIComponent(value);
            } catch(e) {}

            if (!(key in json)) {
                json[key] = /\[\]$/.test(key) ? [value] : value; //濡傛灉鍙傛暟鍚嶄互[]缁撳熬锛屽垯褰撲綔鏁扮粍
            }
            else if (json[key] instanceof Array) {
                json[key].push(value);
            }
            else {
                json[key] = [json[key], value];
            }
        });
        return key ? json[key] : json;
    }
})();
