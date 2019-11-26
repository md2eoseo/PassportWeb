// 의존 모듈 포함
const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const mongoClient = require('mongodb').MongoClient;
// var compression = require('compression');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

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
const app = express();

// 개발자 도구 html 정리
app.locals.pretty = true;

// app setting
app.set('appTitle', 'Passport');
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));
// Handles post requests body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(compression());
app.use(session({
    secret: '@#@$2eoseo#@$#$',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
   }));

// 라우터 모듈 사용
// var router = express.Router();
// app.use('/', router);

var authUser = function (db, id, password, callback) {
    var members = db.collection("member");
    var result = members.find({ "_id": id, "password": password });

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
    var members = db.collection('member');
    members.findOne({ "_id": id }, function(err, member){
        if(err) {
            callback(err, null);
            return;
        }
        if (member == null) {
            members.insertOne({ "_id": id, "password": password, "name": name, "mail": mail },
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
        } else {
            callback(null, null);
        }
    });
};

var postCreate = function (db, title, slug, text, userid, callback) {
    var posts = db.collection('post');
    posts.findOne({ "_id": slug }, function(err, post){
        if(err) {
            callback(err, null);
            return;
        }
        if (post == null) {
            posts.insertOne({ "_id": slug, "title": title, "text": text, "userid": userid },
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
        } else {
            callback(null, null);
        }
    })
}

// route 정의
app.get('/', function(req, res){
    var sess = req.session;
    res.render('index', {
        login: sess.login,
        userid: sess.userid,
        msg: '' 
    });
});

app.get('/index', function(req, res){
    var sess = req.session;
    res.render('index', {
        login: sess.login,
        userid: sess.userid,
        msg: '' 
    });
});

app.get('/post', function(req, res){
    var sess = req.session;
    res.render('post', {
        login: sess.login,
        userid: sess.userid,
        msg: '' 
    });
});

app.post('/post', function(req, res){
    var sess = req.session;
    var title = req.body.title || req.query.title;
    var slug = req.body.slug || req.query.slug;
    var text = req.body.text || req.query.text;

    if (db){
        postCreate(db, title, slug, text, sess.userid,
            function (err, result)  {
                var sess = req.session;
                if (err) {
                    console.log('Post Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.render('mypost', {
                        login: sess.login,
                        userid: sess.userid,
                        msg: '포스트 성공!!!' 
                    });
                } else {
                    console.log('Same Slug Error!!');
                    res.render('post', {
                        login: sess.login,
                        userid: sess.userid,
                        msg: '이미 등록된 슬러그입니다.' 
                    });
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

app.get('/mypost', function(req, res){
    var sess = req.session;
    res.render('mypost', {
        login: sess.login,
        userid: sess.userid,
        msg: '' 
    });
});

app.get('/login', function(req, res){
    var sess = req.session;
    res.render('login', {
        login: sess.login,
        userid: sess.userid,
        msg: '' 
    });
});

app.post('/login', function (req, res) {
    var paramID = req.body.id || req.query.id;
    var paramPW = req.body.password || req.query.password;

    if (db) {
        authUser(db, paramID, paramPW,
            function (err, docs) {
                var sess = req.session;
                if (db) {
                    if (err) {
                        console.log('Login Error!!');
                        res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                        res.write('<h1>' + err + '</h1>');
                        res.end();
                        return;
                    }
                    if (docs) {
                        sess.login = true;
                        sess.userid = paramID;
                        console.dir(docs);
                        res.render('post', {
                            login: sess.login,
                            userid: sess.userid,
                            msg: '로그인 성공!!' 
                        });
                    }
                    else {
                        console.log('Login Error!!');
                        res.render('login', {
                            login: sess.login,
                            userid: sess.userid,
                            msg: '잘못된 아이디 또는 비밀번호입니다...' 
                        });
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
    var sess = req.session;
    res.render('signup', {
        login: sess.login,
        userid: sess.userid,
        msg: '' 
    });
});

app.post('/signup', function (req, res) {
    var paramID = req.body.id || req.query.id;
    var paramPW = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;
    var paramMail = req.body.mail || req.query.mail;

    if (db){
        signup(db, paramID, paramPW, paramName, paramMail,
            function (err, result)  {
                var sess = req.session;
                if (err) {
                    console.log('Signup Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.render('login', {
                        login: sess.login,
                        userid: sess.userid,
                        msg: '회원가입 성공!!!' 
                    });
                } else {
                    console.log('Same Memeber Error!!');
                    res.render('signup', {
                        login: sess.login,
                        userid: sess.userid,
                        msg: '이미 등록된 아이디입니다...' 
                    });
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
    var sess = req.session;
    if(sess){
        sess.destroy(function(err){
            if(err){
                console.log(err);
            }else{
                res.render('login', {
                    msg: '로그아웃 성공!!!' 
                });
            }
        })
    } else {
        res.render('login', {
            msg: '로그인된 사용자가 없습니다...' 
        });
    }
});



// 서버 시작
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on http://localhost:' + app.get('port'));
    connectDB();
});