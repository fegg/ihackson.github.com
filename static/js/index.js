

/* 音乐播放相关代码 */
(function() {
    var $play = $('.play');
    var interval = null;
    var rotate = 0;
    var loginAudio = document.getElementById('login-audio');
    startPlay();
    function startPlay() {
        if(loginAudio.paused === true) {
            loginAudio.play();
        }
        interval = setInterval(function() {
            $play.css('-webkit-transform', 'rotate('+(rotate+=7)+'deg)');
        }, 100);
    }
    function endPlay() {
        clearInterval(interval);
        loginAudio.pause();
    }

    $play.click(function() {
        if(loginAudio.paused === false) {
            endPlay();
        } else {
            startPlay();
        }
    });
})();

/* 排行榜相关代码 */
(function () {
    window.rank = function(submit) {//submit 为submit是提交成绩，为空时只取回排名
        var $items = $('.rank-items'),
            oneItem = $('#oneItem').html(),
            twoItem = $('#twoItem').html();

        var name = localStorage.getItem('gamerDesc')+"的"+localStorage.getItem('gamerName');
        $.ajax({
            url: 'http://www.60sky.com/api',
            dataType: 'jsonp',
            data: {
                username: name,
                score: $('#score').text(),
                category: 'normal',
                q:submit
            }
        }).done(function(data) {
            format(data.record_list);
        });

        function format(data) {
            var html = [];
            for(var i = 0; i < 3; i++) {
                var tmp = data[i];
                html.push(oneItem.replace('{num}', (i+1))
                    .replace('{name}', tmp.username)
                    .replace('{score}', tmp.score));
            }
            for(var i = 3; i < 5; i++) {
                var tmp = data[i];
                html.push(twoItem.replace('{num}', (i+1))
                    .replace('{name}', tmp.username)
                    .replace('{score}', tmp.score));
            }
            html = html.join('');
            $items.html(html);
        }
    }
    $('.page').on('click', '.rank', function(e) {
        $('.rank-main').addClass('active');
        $('.happy-ratio').fadeOut();

        rank();
        return false;
    });

    $('.reback').click(function() {
        $('.rank-main').removeClass('active');
        $('.happy-ratio').fadeIn();
    });
})();