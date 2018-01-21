var storage = window.localStorage;
var song_list_key = 'song-list';

//溢出
function removeHis() {
    var song_list_his_str = storage.getItem(song_list_key);
    if (song_list_his_str) {
        var song_list_his_arr = song_list_his_str.split(',');

        for (var i in song_list_his_arr) {
            storage.removeItem(song_list_his_arr[i]);
        }

        storage.removeItem(song_list_key);
    }
}

$(document).ready(function () {

    $(document).keypress(function (e) {
        // 回车键事件
        if (e.which == 13) {
            $("#search-but").click();
        }
    });


    $("#search-but").on('click', function () {

        var keyword = $("#search-keyword").val();
        if (!keyword) {
            layer.alert("请输入要搜索的歌曲或歌星");
            return;
        }

        var apiurl = "https://api.imjad.cn/cloudmusic/?type=search";
        $.getJSON(apiurl, {"s": keyword}, function (res) {
            if (res.code == 200) {
                var len = res.result.songs.length;
                var html = "";
                var song_list = [];

                removeHis();

                for (var i = 0; i < len; i++) {
                    var song = res.result.songs[i];

                    html += '<div class="media">';
                    html += '<div class="media-left">';
                    html += '<a href="javascript:getSong(\'' + song.id + '\')">';
                    html += '<img class="media-object" src="' + song.al.picUrl + '" alt="' + song.al.name + '">';
                    html += '</a>';
                    html += '</div>';
                    html += '<div class="media-body">';
                    html += '<h4 class="media-heading">' + song.al.name + '</h4>';
                    html += '<p>' + song.ar[0].name + '</p>';
                    html += '</div>';
                    html += '</div>';

                    var info = {
                        'id': song.id,
                        'songname': song.al.name,
                        'singer': song.ar[0].name,
                        'songcover': song.al.picUrl
                    };

                    if (!storage.getItem(song.id)) {
                        song_list.push(song.id);
                    }

                    storage.setItem(song.id, JSON.stringify(info));
                }

                storage.setItem(song_list_key, song_list);

                $("#song-list").html(html);

            } else {
                layer.msg("请求失败");
            }

        });
    });


    /**
     * 播放
     */
    $("#player-control").on('click', function () {

        if (!$("#player").attr("src")) {

            var song_list_his_arr = getSongList();
            if (song_list_his_arr.length > 0) {
                var songid = song_list_his_arr[0];
                $(this).attr('data-songid', songid);
                $(this).attr('data-index', 0);
                getSong(songid);
                return true;
            }

            layer.msg("请先搜一搜吧");
            return false;
        }
        play();

    });

    //上一首
    $("#pre-control").on('click', function () {
        previousSong();
    });

    //下一首
    $("#next-control").on('click', function () {
        nextSong();
    });


    //音量
    $("#player-volume").on('input propertychange', function () {
        var volume = $(this).val();
        oldVolume = volume;
        setVolume(volume);
    });

    var isMute = false;

    //音量
    $("#volume-control").on('click', function () {
        if (isMute) {
            setVolume(0);
            isMute = false;
        } else {
            setVolume(oldVolume);
            isMute = true;
        }
    });

    //进度条
    $("#player").on('timeupdate', function (e) {
        var player = $("#player")[0];
        var duration = player.duration;
        var currentTime = e.currentTarget.currentTime;
        var timeSchedule = currentTime / duration * 100;
        var time_range = $(".time-range input[type=range]");

        time_range.css("background-size", timeSchedule + "% 100%");
        time_range.val(timeSchedule);
    });

    //封面图控制播放
    $("#song-show .show-song-cover").on('click', function () {
        play();
    })


});

var isplay = false;


/**
 * 播放
 */
function play() {
    var player_control = $("#player-control");
    var player = $("#player")[0];
    var volume = 0.5;
    setVolume(volume);

    var show_song_cover = $("#song-show .show-song-cover");

    if (isplay) {
        player_control.addClass('ion-play');
        player_control.removeClass('ion-ios-pause');
        show_song_cover.addClass('pause');
        player.pause();
        isplay = false;
    } else {
        player_control.removeClass('ion-play');
        player_control.addClass('ion-ios-pause');
        show_song_cover.removeClass('pause');
        player.play();
        isplay = true;
    }

}


//原来的音量
var oldVolume = 0.5;

/**
 * 设置音量
 * @param volume
 */
function setVolume(volume) {
    var player = $("#player")[0];
    var volume_position = volume * 100;
    var volume_range = $(".volume-range input[type=range]");

    volume_range.css("background-size", volume_position + "% 100%");

    var volume_control = $("#volume-control");
    if (volume > 0) {
        volume_control.removeClass("ion-ios-volume-low");
        volume_control.addClass("ion-ios-volume-high");
        volume_range.val(oldVolume);
    } else {
        volume_control.addClass("ion-ios-volume-low");
        volume_control.removeClass("ion-ios-volume-high");
        volume_range.val(0);
    }
    player.volume = volume;
}

/**
 * 获取远程的一首歌
 * @param id
 */
function getSong(id) {

    var info = storage.getItem(id);
    var obj = eval('(' + info + ')');

    // console.log(obj);
    var url = "https://api.imjad.cn/cloudmusic/?type=song";
    $.getJSON(url, {"id": id}, function (res) {


        if (res.code == 200) {

            $("#player").attr('src', res.data[0].url);
            $("#player").prop('autoplay', "autoplay");
            var picUrl = "";
            if (typeof(obj.songcover) !== "undefined") {
                picUrl = obj.songcover;
            }

            isplay = false;
            play();

            $("#song-show .show-song-cover").attr('src', picUrl);
            $("#song-show .show-song-cover").addClass('rotation');
            $("#song-show .show-song-name").html(obj.songname);
            $("#song-show .show-songer").html(obj.singer);

            show_song_info();

        } else {
            layer.msg("请求失败");
        }
    });

}

/**
 * 歌曲列表
 * @returns {string[]}
 */
function getSongList() {
    var song_list_his_str = storage.getItem(song_list_key);
    var song_list_his_arr = [];
    if (song_list_his_str) {
        song_list_his_arr = song_list_his_str.split(',');
    }
    return song_list_his_arr;
}

/**
 * 上一首
 */
function previousSong() {
    var player_control = $("#player-control");
    var index = player_control.attr('data-index');
    var songList = getSongList();
    if (index >= 0 || index > 20) {
        index--;
    } else {
        index = 0;
    }

    if (songList.length > 0) {
        var songId = songList[index];
        player_control.attr('data-songid', songId);
        player_control.attr('data-index', index);
        getSong(songId);
        return true;
    }
    layer.msg("请先搜一搜吧");
    return false;
}


/**
 * 下一首
 */
function nextSong() {
    var player_control = $("#player-control");
    var index = player_control.attr('data-index');
    var songList = getSongList();

    if (index > 20) {
        index = 0;
    } else {
        index++;
    }

    if (songList.length > 0) {
        var songId = songList[index];
        player_control.attr('data-songid', songId);
        player_control.attr('data-index', index);
        getSong(songId);
        return true;
    }
    layer.msg("请先搜一搜吧");
    return false;

}

//显示歌曲信息
function show_song_info() {
    var content_width = $(document).width();
    var content_height = $(window).height() - $("#my-header").height() - $("#my-footer").height();

    var song_show_width = content_width + "px";
    var song_show_height = content_height + "px";

    layer.open({
        type: 1,
        title: false,
        shade: false,
        closeBtn: true,
        area: [song_show_width, song_show_height],
        skin: 'layui-bg-black', //没有背景色
        shadeClose: true,
        content: $('#song-show')
    });
}
