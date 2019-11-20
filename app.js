// 의존 모듈 포함
var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient;

// DB 연결
var db;

function connectDB() {
    var databaseURL = 'mongodb://localhost:27017';
    mongoClient.connect(databaseURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, cluster){
            if (err) {
                console.log('Database Connect Error!!');
                return;
            }
            console.log('DB Connected to ' + databaseURL);
            db = cluster.db('test'); 
        }
    );
}

// Express.js 객체 초기화
var app = express();
// Handles post requests
app.use(bodyParser.urlencoded({ extended: true })); // body parsing
// app.use(bodyParser.json());
// 개발자 도구 html 정리
app.locals.pretty = true;

// app setting
app.set('appTitle', 'Passport');
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));

// 라우터 모듈 사용
// var router = express.Router();
// app.use('/', router);

var authUser = function (db, id, password, callback) {
    var members = db.collection("members");
    var result = members.find({ "id": id, "password": password });

    result.toArray(
        function (err, docs) {
            if (err) {
                callback(err, null);
                return;
            }
            if (docs.length > 0) {
                console.log('find user [ ' + docs + ' ]');
                callback(null, docs);
            } else {
                console.log('cannot find user!!');
                callback(null, null);
            }
        }
    );
};
 
var signup = function (db, id, password, name, mail, callback) {
    var members = db.collection('members');

    members.insertMany([{ "id": id, "password": password, "name": name, "mail": mail }],
        function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }
            if (result.insertedCount > 0) {
                callback(null, result);
            } else {
                callback(null, null);
            }
        }
    );
};



// route 정의
app.get('/', function(req, res){
    res.render('index', { appTitle: 'Passport' });
});

app.get('/index', function(req, res){
    res.render('index', { appTitle: 'Passport' });
});

app.get('/post', function(req, res){
    res.render('post', { appTitle: 'Passport' });
});

app.get('/admin', function(req, res){
    res.render('admin', { appTitle: 'Passport' });
});

app.get('/login', function(req, res){
    res.render('login', { appTitle: 'Passport' });
});

app.post('/login', function (req, res) {
    var paramID = req.body.id || req.query.id;
    var paramPW = req.body.password || req.query.password;

    if (db) {
        authUser(db, paramID, paramPW,
            function (err, docs) {
                if (db) {
                    if (err) {
                        console.log('Login Error!!');
                        res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                        res.write('<h1>' + err + '</h1>');
                        res.end();
                        return;
                    }
                    if (docs) {
                        console.dir(docs);
                        res.render('post', { msg: '로그인 성공!!' });
                    }
                    else {
                        console.log('Login Error!!');
                        res.render('login', { msg: '잘못된 아이디 또는 비밀번호입니다...' });
                    }
                } else {
                    console.log('DB Connect Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>DB Connect Error!!</h1>');
                    res.end();
                }
            }
        );
    }
});

app.get('/signup', function(req, res){
    res.render('signup', { appTitle: 'Passport' });
});

app.post('/signup', function (req, res) {
    var paramID = req.body.id || req.query.id;
    var paramPW = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var paramMail = req.body.mail || req.query.mail;

    if (db){
        signup(db, paramID, paramPW, paramName, paramMail,
            function (err, result)  {
                if (err) {
                    console.log('Signup Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    console.dir(result);
                    res.render('login', { msg : "회원가입 성공!!" });
                } else {
                    console.log('Signup Same Memeber Error!!');
                    res.render('signup', { msg : "이미 등록된 아이디입니다..." });
                }
            }
        );
    } else {
        console.log('DB Connect Error!!');
        res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
        res.write('<h1>DB Connect Error!!</h1>');
        res.end();
    }
});

app.get('/logout', function(req, res){
    res.render('logout', { appTitle: 'Passport' });
});



// 서버 시작
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port') + '.');
    connectDB();
});