// 1. mongoose 모듈 가져오기
var mongoose = require('mongoose');

// 2. testDB 세팅
mongoose.connect('mongodb://localhost:27017/member', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// 3. 연결된 testDB 사용
var db = mongoose.connection;

// 4. 연결 실패
db.on('error', function(){
    console.log('Connection Failed!');
});

// 5. 연결 성공
db.once('open', function() {
    console.log('Connected!');
});

// 6. Schema 생성
var member = mongoose.Schema({
    id : 'string',
    password : 'string',
    name : 'string',
    mail : 'string'
});

// 7. 정의된 스키마를 객체처럼 사용할 수 있도록 model() 함수로 컴파일
var Member = mongoose.model('Schema', member);

// 8. Student 객체를 new 로 생성해서 값을 입력
var newMember = new Member({id:'a', password:'a', name:'알파벳', mail:'a@mail.com'});

// 9. 데이터 저장
newMember.save(function(error, data){
    if(error){
        console.log(error);
    }else{
        console.log('Saved!')
    }
});

// 10. Student 레퍼런스 전체 데이터 가져오기
Member.find(function(error, members){
    console.log('--- Read all ---');
    if(error){
        console.log(error);
    }else{
        console.log(members);
    }
})