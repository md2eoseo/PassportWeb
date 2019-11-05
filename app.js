// 의존 모듈 포함
var express = require('express');
var http = require('http');
var path = require('path');

// Express.js 객체 초기화
var app = express();

// app setting
app.set('appName', 'passport-web');
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// middleware 정의

// route 정의
app.all('*', function(req, res){
    res.render('index', { msg: 'Passport!' });
});

// 서버 시작
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});