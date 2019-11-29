var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var postSchema = new Schema({
    title: String,
    text: String,
    userid: String,
    date: { type: Date, default: Date.now() },
    comments: [commentSchema]
});

var commentSchema = new Schema({
    text: String,
    userid: String,
    date: { type: Date, default: Date.now() }
});
 
module.exports = mongoose.model('post', postSchema);