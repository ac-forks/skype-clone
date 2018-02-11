'use strict';

let ObjectId= require('mongoose').Types.ObjectId;

module.exports = class {
  constructor(messageModel, chatModel) {
    this.messageModel = messageModel;
    this.chatModel = chatModel;
  };
  get(req,res,next) {
    let userID = req.body.userID;
    let friendID = req.body.friendID;
    
    this.chatModel.findOne({participants:{ "$in" : [userID]}})
    .exec((err, chat) => {
      console.log(chat);
      if(err) next(err);
      if(!chat) {
          console.log('doesnot exist');
          this.chatModel.create({participants:[ userID, friendID ]})
          .then(data=> res.json(data))
          .catch(err=> console.log(err));
      } else {
          let friendObjId = new ObjectId(friendID);
          console.log(JSON.stringify(chat.participants[1]) === JSON.stringify(friendID));
              if(JSON.stringify(chat.participants[1]) !== JSON.stringify(friendID) && JSON.stringify(chat.participants[0]) !== JSON.stringify(friendID) ){
                this.chatModel.create({participants:[ userID, friendID ]})
                .then(data=> res.json(data))
                .catch(err=> console.log(err));
              }else{
                res.json({chat: chat});
              }
      }
    });
  };
  send(req,res,next) {

    let roomID = req.body.roomID;
    let newMessage = {userID: req.body.userID, message: req.body.message};

    this.messageModel.findOne({roomID: roomID})
    .exec((err, chat) => {
      if(err) next(err);
      if(!chat) {
          this.messageModel.create({
            roomID: roomID,
            messages: [newMessage], 
          })
          .then(data=> res.json(data))
          .catch(err=> console.log(err));         
      } else {
         let messages = chat.messages;
         messages.push(newMessage);
         if(messages.length>0){
            this.messageModel.findOneAndUpdate({_id: chat._id},
                            {
                             $set:{messages : messages
                              }
                            },{upsert: false ,multi: true}, (err, chat)=>{
                                    if (err || !chat)return next(err);
                                    return res.json({ success : true, message : 'message is updated successfully...'});
            });
        }

      }
    });

  };
  messageHistory (req, res, next){
    this.chatModel.collection.findOne({participants: {$all: [req.body.sender, req.body.receiver]}}, (err, chat) => {
      if(err) {
        next(err);
      } else {
        this.messageModel.find({chatID: chat._id}, (err, message) => {
          if(err) {
            next(err);
          } else {
            res.json(message);
          }
        });
      }
    });
  }
}
