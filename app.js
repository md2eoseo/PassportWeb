// 의존 모듈 포함
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoClient = require('mongodb').MongoClient;
const compression = require('compression');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const methodOverride = require('method-override');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, __dirname + '/upload/')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  });
const upload = multer({ storage: storage });
const urlSlug = require('url-slug');
const no_slug = ['login', 'logout', 'signup', 'post', 'mypost', 'search'];

var db;
function connectDB() {
    // var databaseURL = 'mongodb://localhost:27017';
    var databaseURL = process.env.MONGODB_URI;
    mongoClient.connect(databaseURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, cluster){
            if (err) {
                console.log('Database Connect Error!!');
                return;
            }
            console.log('DB Connected to ' + databaseURL);
            // db = cluster.db('test');
            db = cluster.db('heroku_kkdgbql2');
        }
    );
}

// app setting
const app = express(); // Express.js 객체 초기화
app.locals.pretty = true; // 개발자 도구 html 정리
app.set('appTitle', 'Passport');
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true })); // Handles post requests body parsing
app.use(bodyParser.json());
app.use(compression());
app.use(session({
    secret: '@#@$2eoseo#@$#$',
    resave: false,
    saveUninitialized: true,
    store: new FileStore()
   }));
app.use(methodOverride('_method'));
app.use('/:slug', express.static('upload'));

var authUser = function (db, id, password, callback) {
    var members = db.collection("member");
    var result = members.find({ "_id": id, "password": password });

    result.toArray(function (err, docs) {
            if (err) {
                callback(err, null);
                return;
            }
            if (docs.length > 0) {
                console.log('find user [ ' + docs.length + ' ]');
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

var postCreate = function (db, title, slug, text, file, userid, callback) {
    var posts = db.collection('post');

    if(slug == null)
        slug = urlSlug(title);

    for (var i in no_slug){
        if (slug == no_slug[i]){
            callback(null, null);
            return;
        }
    }

    posts.findOne({ "_id": slug }, function(err, post){
        if(err) {
            callback(err, null);
            return;
        }
        if (post == null) {
            posts.insertOne({
                "_id": slug,
                "title": title,
                "text": text,
                "file": file,
                "userid": userid,
                "date": { type: Date, default: new Date() },
                "modate": null
            }, function (err, result) {
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
}

var postList = function (db, callback) {
    var posts = db.collection('post');
    posts.find({  }).sort({ "date": -1 }).toArray(function(err, post){
        if(err) {
            callback(err, null);
            return;
        }
        if(post){
            callback(null, post);
        }
    });
}

var postSearchList = function (db, q, type, callback) {
    var posts = db.collection('post');
    if (type == "title"){
        posts.find({ "title": { $regex: q } }).sort({ "date": -1 }).toArray(function(err, post){
            if(err) {
                callback(err, null);
                return;
            }
            if(post){
                callback(null, post);
            }
        });
    }
    else if (type == "text"){
        posts.find({ "text": { $regex: q } }).sort({ "date": -1 }).toArray(function(err, post){
            if(err) {
                callback(err, null);
                return;
            }
            if(post){
                callback(null, post);
            }
        });
    }
    else if (type == "user"){
        posts.find({ "userid": { $regex: q } }).sort({ "date": -1 }).toArray(function(err, post){
            if(err) {
                callback(err, null);
                return;
            }
            if(post){
                callback(null, post);
            }
        });
    }
    else {
        posts.find({ "title": { $regex: q } }).sort({ "date": -1 }).toArray(function(err, post){
            if(err) {
                callback(err, null);
                return;
            }
            if(post){
                callback(null, post);
            }
        });
    }
}

var postMyList = function (db, userid, callback) {
    var posts = db.collection('post');
    posts.find({ "userid": userid }).sort({ "date": -1 }).toArray(function(err, post){
        if(err) {
            callback(err, null);
            return;
        }
        if(post){
            callback(null, post);
        }
    });
}

var postRead = function (db, slug, callback) {
    var posts = db.collection('post');
    posts.findOne({ "_id": slug }, function(err, post){
        if(err) {
            callback(err, null);
            return;
        } else {
            callback(null, post);
        }
    });
}

var postEdit = function (db, title, slug, text, file_oriname, file_ori, file, callback){
    var posts = db.collection('post');

    if(file_ori == null || file_ori == undefined){
        if(file == null || file == undefined){
            if(file_oriname != null)
                fs.unlink('upload/' + JSON.parse(file_oriname).filename, (err) => { if (err) { console.error(err) } })
            posts.updateOne({ "_id": slug }, { $set: {
                "title": title,
                "text": text,
                "file": null,
                "modate": { type: Date, default: new Date() }
            }}, { upsert: true }, function(err, result){
                if(err) {
                    callback(err, null);
                    return;
                }
            });
        } else {
            if(file_oriname != null)
                fs.unlink('upload/' + JSON.parse(file_oriname).filename, (err) => { if (err) { console.error(err) } })
            posts.updateOne({ "_id": slug }, { $set: {
                "title": title,
                "text": text,
                "file": file,
                "modate": { type: Date, default: new Date() }
            }}, { upsert: true }, function(err, result){
                if(err) {
                    callback(err, null);
                    return;
                }
            });
        }
    } else {
        if(file == null || file == undefined){
            posts.updateOne({ "_id": slug }, { $set: {
                "title": title,
                "text": text,
                "file": JSON.parse(file_ori),
                "modate": { type: Date, default: new Date() }
            }}, { upsert: true }, function(err, result){
                if(err) {
                    callback(err, null);
                    return;
                }
            });
        } else {
            if(file_ori != null)
                fs.unlink('upload/' + JSON.parse(file_ori).filename, (err) => { if (err) { console.error(err) } })
            posts.updateOne({ "_id": slug }, { $set: {
                "title": title,
                "text": text,
                "file": file,
                "modate": { type: Date, default: new Date() }
            }}, { upsert: true }, function(err, result){
                if(err) {
                    callback(err, null);
                    return;
                }
            });
        }
    }

    posts.findOne({ "_id": slug }, function(err, result){
        if(err) {
            callback(err, null);
            return;
        }
        if(result)
            callback(null, result);
    });
}

var postDelete = function(db, slug, callback){
    var posts = db.collection('post');

    // 첨부 이미지 upload 폴더에서 삭제
    posts.findOne({ "_id": slug }, function(err, result){
        if(err) {
            callback(err, null);
            return;
        }
        if(result.file != null)
            fs.unlink('upload/' + result.file.filename, (err) => { if (err) { console.error(err) } } )
    });

    posts.deleteOne({ "_id": slug }, function(err, result){
        if(err) {
            callback(err, null);
            return;
        }
        callback(null, result);
    });
}

// var userSetting = function(db, userid, callback){
//     var members = db.collection("member");
//     members.findOne({ "_id": userid }, function (err, doc) {
//         if (err) {
//             callback(err, null);
//             return;
//         }
//         if (doc.length > 0) {
//             console.log('found user!!');
//             callback(null, doc);
//         } else {
//             console.log('cannot find user!!');
//             callback(null, null);
//         }
//     });
// }

// route 정의
app.get('/', function(req, res){
    if (db){
        postList(db, function (err, result)  {
                var sess = req.session;
                if (err) {
                    console.log('Home Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.render('index', {
                        login: sess.login,
                        userid: sess.userid,
                        posts: result,
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

app.get('/post', function(req, res){
    var sess = req.session;
    if(sess.login != true){
        res.render('login', {
            msg: '로그인을 해주세요!!' 
        });
    } else {
        res.render('post', {
        login: sess.login,
        userid: sess.userid
    });
    }
});

app.post('/post', upload.single('file'), function(req, res){
    var sess = req.session;
    var title = req.body.title || req.query.title;
    var slug = req.body.slug || req.query.slug;
    var text = req.body.text || req.query.text;
    var file = req.file;
    var errors = '';

    if (!(/^[\-0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]/).test(String(title)) || title==undefined){
        errors = '제목이 유효하지 않습니다...';
    }
    
    if (errors != ''){
        res.render('post', {
            title: title,
            slug: slug,
            text: text,
            file: file,
            errors: errors
        });
    } else {
        if (db){
            postCreate(db, title, slug, text, file, sess.userid,
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
                        res.redirect('/mypost');
                    } else {
                        console.log('Same Slug Error!!');
                        res.render('post', {
                            login: sess.login,
                            userid: sess.userid,
                            title: title,
                            slug: slug,
                            text: text,
                            file: file,
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
    }
});

app.get('/mypost', function(req, res){
    var sess = req.session;
    if(sess.login != true){
        res.render('login', {
            msg: '로그인을 해주세요!!' 
        });
    } else {
        if (db){
            postMyList(db, sess.userid, function (err, result)  {
                    if (err) {
                        console.log('Home Error!!');
                        res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                        res.write('<h1>' + err + '</h1>');
                        res.end();
                        return;
                    }
                    if (result) {
                        res.render('mypost', {
                            login: sess.login,
                            userid: sess.userid,
                            posts: result,
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
    }
});

app.get('/search', function(req, res){
    var q = req.query.q;
    var type = req.query.type;

    if (db){
        postSearchList(db, q, type, function (err, result)  {
                var sess = req.session;
                if (err) {
                    console.log('search Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.render('search', {
                        login: sess.login,
                        userid: sess.userid,
                        posts: result,
                        q: q,
                        msg: '\'' + q + '\'로 검색한 결과' 
                    });
                } else {
                    console.log('search Error!!');
                    res.render('search', {
                        login: sess.login,
                        userid: sess.userid,
                        posts: result,
                        msg: '글이 검색되지 않습니다...' 
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

app.post('/edit', upload.single('file'), function(req, res){
    var sess = req.session;
    var title = req.body.title || req.query.title;
    var slug = req.body.slug || req.query.slug;
    var text = req.body.text || req.query.text;
    var file_oriname = req.body.file_oriname || req.query.file_oriname;
    var file_ori = req.body.file_ori || req.query.file_ori;
    var file = req.file;

    if (db){
        postEdit(db, title, slug, text, file_oriname, file_ori, file, function (err, result)  {
                if (err) {
                    console.log('postEdit Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.redirect('/'+slug);
                } else {
                    console.log('postEdit Error!!');
                    res.render('article', {
                        login: sess.login,
                        userid: sess.userid,
                        post: result,
                        msg: '글이 수정되지 않았습니다.' 
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

app.get('/edit/:slug', function(req, res){
    var slug = req.params.slug;

    if (db){
        postRead(db, slug, function (err, result)  {
                var sess = req.session;

                if(sess.login != true || sess.userid != result.userid){
                    res.render('index', {
                        msg: '접근 불가!!' 
                    });
                }

                if (err) {
                    console.log('postRead Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.render('edit', {
                        login: sess.login,
                        userid: sess.userid,
                        post: result,
                    });
                } else {
                    console.log('No post Error!!');
                    res.render('edit', {
                        login: sess.login,
                        userid: sess.userid,
                        post: result,
                        msg: '글이 없습니다...' 
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

// app.get('/setting', function(req, res){
//     var sess = req.session;

//     if (db){
//         userSetting(db, sess.userid, function (err, user)  {
//                 if(sess.login != true || sess.userid != user.userid){
//                     res.render('index', {
//                         msg: '접근 불가!!' 
//                     });
//                 }

//                 if (err) {
//                     console.log('userSetting Error!!');
//                     res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
//                     res.write('<h1>' + err + '</h1>');
//                     res.end();
//                     return;
//                 }
//                 if (user) {
//                     res.render('setting', {
//                         login: sess.login,
//                         userid: sess.userid,
//                         user: user,
//                     });
//                 } else {
//                     console.log('No user Error!!');
//                     res.render('index', {
//                         login: sess.login,
//                         userid: sess.userid,
//                         msg: '존재하지 않는 사용자입니다...' 
//                     });
//                 }
//             }
//         );
//     } else {
//         console.log('DB Connect Error!!');
//         res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
//         res.write('<h1>DB Connect Error!!</h1>');
//         res.end();
//     }
// });

app.get('/login', function(req, res){
    var sess = req.session;
    res.render('login', {
        login: sess.login,
        userid: sess.userid,
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
                        postList(db, function(err, result){
                            if(err) {
                                console.log('postList Error!!');
                                res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                                res.write('<h1>postList Error!!</h1>');
                                res.end();
                            }
                            if (result) {
                                sess.login = true;
                                sess.userid = paramID;
                                res.render('index', {
                                    login: sess.login,
                                    userid: sess.userid,
                                    posts: result,
                                });
                            }
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
    });
});

app.post('/signup', function (req, res) {
    const id = req.body.id || req.query.id;
    const password = req.body.password || req.query.password;
    const name = req.body.name || req.query.name;
    const mail = req.body.mail || req.query.mail;
    var errors = '';

    if (!(/^[\-0-9a-zA-Z\.\+_]+@[\-0-9a-zA-Z\.\+_]+\.[a-zA-Z]{2,}$/)
    .test(String(mail)) || mail==undefined){
        errors = '유효한 메일을 입력해주세요.';
    }
    if (!(/[a-zA-Zㄱ-ㅎㅏ-ㅣ가-힣]{1,20}/).test(String(name)) || name==undefined){
        errors = '유효한 이름을 입력해주세요. 한글, 영문만 입력이 가능합니다. 1~20자리 제한!';
    }
    if (!(/[0-9a-zA-Z_]{8,20}/).test(String(password)) || password==undefined){
        errors = '유효한 비밀번호를 입력해주세요. 영문, 숫자, 기호(_)만 입력이 가능합니다. 8~20자리 제한!';
    }
    if (!(/[0-9a-zA-Z_]{6,20}/).test(String(id)) || id==undefined){
        errors = '유효한 아이디를 입력해주세요. 영문, 숫자, 기호(_)만 입력이 가능합니다. 6~20자리 제한!';
    }
    
    if (errors != ''){
        res.render('signup', {
            id: id,
            password: password,
            name: name,
            mail: mail,
            errors: errors
        });
    } else {
        if (db){
            signup(db, id, password, name, mail,
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
                            msg: '회원가입이 완료되었습니다. 글을 작성하시려면 로그인을 해주세요.' 
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
    }
});

app.get('/logout', function(req, res){
    var sess = req.session;
    if(sess.login != true){
        res.render('login', {
            msg: '로그인 유저가 없습니다!!' 
        });
    } else {
        sess.destroy(function(err){
            if(err){
                console.log(err);
            }else{
                res.render('login', {
                    msg: '로그아웃이 되었습니다.' 
                });
            }
        })
    }
});

app.get('/:slug', function(req, res){
    var slug = req.params.slug;

    if (db){
        postRead(db, slug, function (err, result)  {
                var sess = req.session;
                if (err) {
                    console.log('postRead Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.render('article', {
                        login: sess.login,
                        userid: sess.userid,
                        post: result,
                    });
                } else {
                    console.log('No post Error!!');
                    res.render('article', {
                        login: sess.login,
                        userid: sess.userid,
                        post: result,
                        msg: '글이 없습니다...' 
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

app.delete('/:slug', function(req, res){
    var slug = req.params.slug;

    if (db){
        postDelete(db, slug, function (err, result)  {
                var sess = req.session;
                if (err) {
                    console.log('postDelete Error!!');
                    res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
                    res.write('<h1>' + err + '</h1>');
                    res.end();
                    return;
                }
                if (result) {
                    res.redirect('/mypost');
                } else {
                    console.log('postDelete Error!!');
                    res.render('article', {
                        login: sess.login,
                        userid: sess.userid,
                        post: result,
                        msg: '삭제 실패!!!' 
                    });
                }
            }
        );
    } else {
        res.writeHead(200, { "Content-Type": "text/html;charset=utf8" });
        res.write('<h1>DB Connect Error!!</h1>');
        res.end();
    }
});

// 서버 시작
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on http://localhost:' + app.get('port'));
    connectDB();
});