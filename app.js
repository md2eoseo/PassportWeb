// 의존 모듈 포함
var express = require('express');
var http = require('http');
var path = require('path');

// Express.js 객체 초기화
var app = express();
app.locals.pretty = true;

// app setting
app.set('appName', 'passport-web');
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.set('view engine', 'pug');

// middleware 정의

// route 정의
app.get('/', function(req, res){
    res.render('index', { msg: 'Passport!' });
});

app.get('/index', function(req, res){
    res.render('index', { msg: 'Passport!' });
});

app.get('/post', function(req, res){
    res.render('post', { msg: 'Passport!' });
});

app.get('/admin', function(req, res){
    res.render('admin', { msg: 'Passport!' });
});

app.get('/login', function(req, res){
    res.render('login', { msg: 'Passport!' });
});

app.get('/logout', function(req, res){
    res.render('logout', { msg: 'Passport!' });
});


// 서버 시작
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port') + '.');
});