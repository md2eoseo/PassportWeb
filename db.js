var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

const db = mongoose.connection;

const handleOpen = () => console.log("➡️ connected to DB");
const handleError = (err) => console.log(`❌ Error on DB Connection : ${err}`);

db.once("open", handleOpen);
db.on("error", handleError);