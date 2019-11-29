var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commentSchema = new Schema({
    text: String,
    userid: String,
    date: { type: Date, default: Date.now() }
});
 
module.exports = mongoose.model('comment', commentSchema);