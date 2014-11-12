var user = (localStorage.gamerDesc || '萌萌') +"的"+ (localStorage.gamerName || '你');
var score = $("#score").text();
var text = $(".final-score").text();
var shareContent = user+"在宅猫爱吃甜食得了"+score+"分，"+text+"小伙伴们快来一决高下~";

var wxData = {
    'appId': '', // 服务号可以填写appId，没有则留空
    'imgUrl': 'http://p9.qhimg.com/t014c5284508e44b1e5.png', // 分享显示的图标
    'link': 'http://www.60sky.com', // 分享链接
    'title': '宅猫爱吃甜食', // 分享标题
    'desc': shareContent // 分享内容
};
WeixinAPI.ready(wxData);

