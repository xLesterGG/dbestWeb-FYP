 // var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io');
var uuid = require('node-uuid');

var config = {
    apiKey: "AIzaSyDBeAd9ZtPMV7NFMaNDAkW__qyDWjcFi_I",
    authDomain: "dbest-7485e.firebaseapp.com",
    databaseURL: "https://dbest-7485e.firebaseio.com",
    projectId: "dbest-7485e",
    storageBucket: "dbest-7485e.appspot.com",
    messagingSenderId: "642003666233"
};


// var config = {
//     apiKey: "AIzaSyCSqeJ0FYFDBpzFIF1rgHKHtyVpDjbE6Fg",
//     authDomain: "dbesttest-66a95.firebaseapp.com",
//     databaseURL: "https://dbesttest-66a95.firebaseio.com",
//     projectId: "dbesttest-66a95",
//     storageBucket: "dbesttest-66a95.appspot.com",
//     messagingSenderId: "554583986059"
//   };


// var config = {
//     apiKey: "AIzaSyDhSwnH4r5RcP-AFErHDdh3kjFfyyOr7kc",
//     authDomain: "cloudnotification-afe9c.firebaseapp.com",
//     databaseURL: "https://cloudnotification-afe9c.firebaseio.com",
//     projectId: "cloudnotification-afe9c",
//     storageBucket: "cloudnotification-afe9c.appspot.com",
//     messagingSenderId: "942434564935"
//   };

app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery


app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/fonts')); // redirect bootstrap JS

app.use('/css',express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

app.use('/js',express.static(__dirname+'/node_modules/popper.js/dist/umd/'));

app.use('/js', express.static(__dirname + '/node_modules/firebase'));

app.use('/js', express.static(__dirname + '/node_modules/angular'));
app.use('/js', express.static(__dirname + '/assets'));
app.use('/css', express.static(__dirname + '/assets')); // for style.css
app.use('/socket.io',express.static(__dirname+'/node_modules/socket.io-client/dist'));
app.use('/js',express.static(__dirname + '/node_modules/firebase'));
app.use('/templates', express.static(__dirname + '/templates')); //template html
app.use('/js',express.static(__dirname + '/node_modules/angular-ui-router/release')); // redirect angular-ui-router

app.use('/js',express.static(__dirname + '/node_modules/material-design-lite/dist'));
app.use('/css',express.static(__dirname + '/node_modules/material-design-lite/dist'));

app.use('/css',express.static(__dirname + '/node_modules/angular-material/'));
app.use('/js',express.static(__dirname + '/node_modules/angular-material/'));
app.use('/js',express.static(__dirname + '/node_modules/angular-animate/'));
app.use('/js',express.static(__dirname + '/node_modules/angular-aria/'));


app.use('/js',express.static(__dirname + '/node_modules/imageviewer/dist'));
app.use('/css',express.static(__dirname + '/node_modules/imageviewer/dist'));

app.use('/js',express.static(__dirname+ '/node_modules/angular-cookies/'));


// app.use('/css',express.static(__dirname+'/assets/emoji-picker/lib/css'));
// app.use('/js',express.static(__dirname+'/assets/emoji-picker/lib/js'));
// app.use('/img',express.static(__dirname+'/assets/emoji-picker/lib/img'));

app.use('/css',express.static(__dirname+'/node_modules/chartist/dist/'));
app.use('/js',express.static(__dirname+'/node_modules/chartist/dist/'));



app.get('/',(req,res)=>{
    // res.send('hello');
    res.sendFile(__dirname +'/index1.html');
});

app.get('/firebase-messaging-sw.js',(req,res)=>{
    // res.send('hello');
    res.sendFile(__dirname +'/firebase-messanging-sw.js');
});



// server.listen(3000,"localhost");
server.listen(process.env.PORT || 3000);

var socket = io.listen(server);
// var people = {};
var inquiries = {};
var conversations = {};
var users = {};
var promo = {};

var firebase = require('firebase');
firebase.initializeApp(config);

var database = firebase.database();

var ready = false;
var isReady = false;




socket.on("connection",(client)=>{
    var currentUser;

    // console.log(client.id);
    // console.log(Object.keys(socket.sockets.sockets));

    // client.on("getConfig",()=>{
        client.emit("getConfig",config);
    // });

    client.on("getUser",()=>{
        if(currentUser == undefined){
            console.log("no user")
            // if(Object.keys(socket.sockets.sockets).length<=1)
            // {
               client.emit("redirectToLogin1");
               console.log(config);
            // }
        }
    });


    client.on("retrieveInfo",()=>{
        console.log('retrieving');

        var a = database.ref('/inquiries'); // get changes to rooms
        var b = database.ref('/conversations');
        var c = database.ref('/conversations/'); // to receive incoming messages and update view
        var d = database.ref('/users');

        var e = database.ref('/product'); // for change

        database.ref('/conversations').once('value').then((res)=>{ // retrieve once client is connected
            console.log('get once');
            if(res.val() != null ){
                for(var key in res.val()){
                    conversations[key] = res.val()[key];
                }

                for(var k in conversations){
                  for(var j in conversations[k]){
                    var temp = conversations[k][j];
                    temp.inquiryID = k;
                    client.emit("loadMessage",temp);
                  }
                }

                isReady = true;
            }
            else{
                //something to say no enquiries yet
                isReady = true;
            }
        });

        d.on('value',(res)=>{
            for(var x in res.val()){
                 users[x] = res.val()[x];
            }
            socket.sockets.emit("updateUserList",users);
            // console.log(users);
        });

        a.on('value',function(res){
            // console.log('loaded / new inquiry');
            for(var r in res.val()){
                 inquiries[r] = res.val()[r];

                //  console.log(inquiries);
            }

            ready = true;
            socket.sockets.emit("updateInquiryList",inquiries);
        });


        e.on('value',(res)=>{
            for(var x in res.val()){
                for(var y in res.val()[x])
                {
                    promo[y] = res.val()[x][y];
                }
                // console.log(res.val()[x]);

            }
            // console.log('getting value from promo')
            socket.sockets.emit("updatePromoList",promo);
        });







        b.on('child_added',(res)=>{ // when a new chat is created (called when person in new room sends message), create new entry in associative array
            if(isReady){

                if(conversations[res.key] == undefined)
                {
                    conversations[res.key] = {};
                    for(var k in res.val()){

                        // console.log(res.val()[k]);
                        conversations[res.key][k] = res.val()[k];
                        var temp = conversations[res.key][k];
                        temp.inquiryID = res.key;

                        console.log(temp);
                        socket.sockets.emit("recieveMessage",temp);

                    }
                }

            }
        });

        c.on('child_changed',(res)=>{
            // console.log('child changed')
            var l = Object.keys(conversations[res.key]).length;
            var c = 0;

            for(var key in res.val()){
                c++;
                if(c > l){
                    console.log('new message')
                    conversations[res.key][key] = (res.val()[key]);
                    var temp = res.val()[key];
                    temp.inquiryID = res.key
                    // client.emit("recieveMessage",temp)
                    socket.sockets.emit("recieveMessage",temp);

                }
            }

        });
    });


    client.on("joinRoom", (id)=>{
        var inq = inquiries[id];
        if(inq != undefined){
            if('admin' === inq.inquiryOwner){
                // client.emit("systemMessage","You are the owner of this room and you have already been joined.");
            }else{

                var found = false;
                for(var i=0;i<inq.inquiryPeoples.length;i++){
                    if(inq.inquiryPeoples[i] == 'admin'){
                        found = true;
                        break;
                    }
                }

                if(!found){

                    inq.inquiryPeoples.push('admin');

                    var msg = inq.lastMessage;
                    msg.messageRead = true;

                    var data = inq;
                    data.lastMessage = msg;


                    var update = {};
                    update['/inquiries/'+ inq.inquiryID] = data;
                    database.ref().update(update);

                }
            }
        }

    });

    client.on("sendImage",(link,inqID)=>{
        var inq = inquiries[inqID];

        var sender="admin"

        if(inq){


            var unread = 0;

            if(inq.msgUnreadCountForMobile == undefined){
                unread = 1;
            }
            else{
                unread = inq.msgUnreadCountForMobile + 1;
            }

            var uid = uuid.v4();

            var message = {
                messageText: "Image",
                messageTime : parseInt(new Date().getTime()),
                messageUser : sender,
                messageRead: false,
                messageID:uid,
                inquiryOwner:inq.inquiryOwner,
                link: link
            }

            var a = database.ref('/conversations/'+inq.inquiryID).push({
                messageText: "Image",
                messageTime : parseInt(new Date().getTime()),
                messageUser : sender,
                messageRead: false,
                messageID:uid,
                inquiryOwner:inq.inquiryOwner,
                link: link
            }); // update convo

            database.ref('/adconversations/'+inq.inquiryOwner+'/'+inq.inquiryID+'?'+inq.inquiryName+'/'+a.key).set({
                messageText: "Image",
                messageTime : parseInt(new Date().getTime()),
                messageUser : sender,
                messageRead: false,
                messageID:uid,
                inquiryOwner:inq.inquiryOwner,
                link: link
            });
// --------------------------------------

            var data = inq;
            data.lastMessage =message;
            data.msgUnreadCountForMobile = unread;

            var msg1 = JSON.parse(JSON.stringify(message));
            msg1.messageTime = parseInt('-'+parseInt(new Date().getTime()));

            var data1= JSON.parse(JSON.stringify(data));
            data1.lastMessage = msg1;


            if(data1.quotations){
                for(var i = 0; i < data1.quotations.length;i++){
                    data1.quotations[i].time = parseInt('-'+data1.quotations[i].time);
                }
            }

            var update = {};
            var update1 = {};


            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);

            update1['/adinquiries/'+ inq.inquiryOwner+'/'+ inq.inquiryID] =data1;
            database.ref().update(update1);

        }

    });

    client.on("sendMessage",(message,inqOwner)=>{ // message, room id,
        var inq = inquiries[message.dest]; // inquiry id
        console.log('sending');
        console.log()

        if(inq== null){
            // do something
        }else{
            var found = false;
            for(i=0;i<inq.inquiryPeoples.length;i++){
                if(inq.inquiryPeoples[i] === 'admin'){ // check if in room

                    var msg = {};
                    msg.msg = message.mess;
                    msg.sender = 'admin';

                    var unread = 0;

                    if(inq.msgUnreadCountForMobile == undefined){
                        unread = 1;
                    }
                    else{
                        unread = inq.msgUnreadCountForMobile + 1;
                    }

                    var uid = uuid.v4();

/**************************************************************************************/
                    var a = database.ref('/conversations/'+inq.inquiryID).push({
                        messageText: msg.msg,
                        messageTime : parseInt(new Date().getTime()),
                        messageUser : msg.sender,
                        messageRead: false,
                        messageID:uid,
                        inquiryOwner:inqOwner,
                        link:''
                    });


                    database.ref('/adconversations/'+inqOwner+'/'+inq.inquiryID+'?'+inq.inquiryName+'/'+a.key).set({
                        messageText: msg.msg,
                        messageTime : parseInt(new Date().getTime()),
                        messageUser : msg.sender,
                        messageRead: false,
                        messageID:uid,
                        inquiryOwner:inqOwner,
                        link:''
                    });

/**************************************************************************************/


                    var msg = {
                        messageText: msg.msg,
                        messageTime : parseInt(new Date().getTime()),
                        messageUser : msg.sender,
                        messageRead: false,
                        messageID:uid,
                        inquiryOwner:inqOwner,
                        link:''
                    }


                    var msg1 = {
                        messageText: msg.messageText,
                        messageTime : parseInt('-'+parseInt(new Date().getTime())),
                        messageUser : msg.messageUser,
                        messageRead: false,
                        messageID:uid,
                        inquiryOwner:inqOwner,
                        link:''
                    }

                    // var msg1 = msg;
                    // msg1.messageTime = parseInt('-'+parseInt(new Date().getTime()));



                    if(inq.quotations!=undefined)
                    {
                        var data = inq;
                        data.lastMessage = msg;
                        data.msgUnreadCountForMobile = unread;


                        var data1 = { // no status coz no need
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            lastMessage: msg1,
                            msgUnreadCountForMobile: unread,
                            items : inq.items,
                            userStatus:inq.userStatus,
                            quotations:JSON.parse(JSON.stringify(inq.quotations)),
                            inquiryTime: inq.inquiryTime
                        }

                        if(data1.quotations){
                            for(var i = 0; i < data1.quotations.length;i++){
                                data1.quotations[i].time = parseInt('-'+parseInt(data1.quotations[i].time));
                                // console.log(data1.quotations[i].time);
                            }
                        }



                        var update = {};
                        var update1 = {};

/**************************************************************************************/

                        update['/inquiries/'+ inq.inquiryID] = data;
                        database.ref().update(update);
                        //
                        update1['/adinquiries/'+ inqOwner+'/'+ inq.inquiryID] =data1;
                        database.ref().update(update1);


/**************************************************************************************/

                    }
                    else{
                        var data = {
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            lastMessage: msg,
                            msgUnreadCountForMobile: unread,
                            items : inq.items,
                            userStatus:inq.userStatus,
                            inquiryTime: inq.inquiryTime,
                            status: inq.status
                        }

                        var data1 = {
                            inquiryPeoples: inq.inquiryPeoples,
                            inquiryName:inq.inquiryName,
                            inquiryID:inq.inquiryID,
                            inquiryOwner: inq.inquiryOwner,
                            lastMessage: msg1,
                            msgUnreadCountForMobile: unread,
                            items : inq.items,
                            userStatus:inq.userStatus,
                            inquiryTime: inq.inquiryTime
                        }

                        var update = {};
                        var update1 = {};
/**************************************************************************************/

                        update['/inquiries/'+ inq.inquiryID] = data;
                        database.ref().update(update);

                        update1['/adinquiries/'+ inqOwner+'/'+ inq.inquiryID] =data1;
                        database.ref().update(update1);
/**************************************************************************************/

                    }


                    // database.ref('/inquiries/'+ inq.inquiryID)

                    break;
                }
            }
        }

    });


    client.on("updateUser",(key,user)=>{
        var update = {};
        update['/users/'+key] = user;
        database.ref().update(update).then(()=>{
            client.emit("updateUserSuccess");
        });
    });

    client.on("updateProduct",(key,product,oriType)=>{
        console.log('trying to update product');
        var update = {};
        update['/product/'+oriType+'/'+key] = {};

        // database.ref('/adconversations/'+inq.inquiryOwner+'/'+inq.inquiryID+'?'+inq.inquiryName+'/'+a.key).set({
        database.ref().update(update);


        database.ref('/product/'+product.productType+'/'+key).set(product)
        .then(()=>{
            client.emit("updateProductSuccess");
        });

        // database.ref('/product/'+product.productType).push(product)
        // .then(()=>{
        //     client.emit("updateProductSuccess");
        // });


        // database.ref('/product/'+product.productType).push(product)
        // .then(()=>{
        //
        //     client.emit("updateProductSuccess");
        // });


    });

    client.on("addProduct",(product)=>{
        console.log('trying to add product');
        var a = database.ref('/product/'+product.productType+'/').push(product)
        .then(()=>{
            client.emit("productSuccess");
        });
    });


    client.on("sendPush",(message)=>{
        var a = database.ref('/push/0/').set(message)
        .then(()=>{
            client.emit("pushSuccess");
        });
    });


    client.on("toTrash",(inq)=>{
        var data = inq;
        data.status="trash";


        var update = {};
        update['/inquiries/'+ inq.inquiryID] = data;
        database.ref().update(update);
    });

    client.on("toInbox",(inq)=>{
        var data = inq;
        data.status="none";

        var update = {};
        update['/inquiries/'+ inq.inquiryID] = data;
        database.ref().update(update);
    });

    client.on("updateLastRead",(inq)=>{

        if(inq.lastMessage!= undefined && inq.lastMessage.messageUser!='admin'){

            var msg = inq.lastMessage;
            msg.messageRead = true;

            // console.log(msg);
            var data = inq;
            data.lastMessage = msg
            // console.log(data.lastMessage.messageTime + 'aaa');


            var data1 = JSON.parse(JSON.stringify(inq))
            data1.lastMessage = JSON.parse(JSON.stringify(msg));
            data1.lastMessage.messageTime = parseInt('-'+data1.lastMessage.messageTime);

            if(data1.quotations){
                for(var i = 0; i < data1.quotations.length;i++){
                    data1.quotations[i].time = parseInt('-'+data1.quotations[i].time);
                }
            }


            var update = {};
            var update1 = {};

/**************************************************************************************/
            // console.log(data.lastMessage.messageTime + 'aaa');
            // console.log(data1.lastMessage.messageTime + 'bbb');

            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);

            update1['/adinquiries/'+inq.inquiryOwner +'/'+inq.inquiryID] = data1;
            database.ref().update(update1);

/**************************************************************************************/

        }


    });

    client.on("updateLastRead2",(inqID)=>{

        var inq = inquiries[inqID];
        // console.log(inq);
        if(inq.lastMessage!= undefined && inq.lastMessage.messageUser!='admin'){


            var msg = inq.lastMessage;
            msg.messageRead = true;

            var data = inq;
            data.lastMessage = msg;

            var data1 = JSON.parse(JSON.stringify(inq))
            data1.lastMessage = JSON.parse(JSON.stringify(msg));
            data1.lastMessage.messageTime = parseInt('-'+data1.lastMessage.messageTime);

            if(data1.quotations){
                for(var i = 0; i < data1.quotations.length;i++){
                    data1.quotations[i].time = parseInt('-'+data1.quotations[i].time);
                    // console.log(data1.quotations[i].time);
                }
            }


            var update = {};
            var update1 = {};
/**************************************************************************************/
            // console.log(data.lastMessage.messageTime + 'aaa');
            // console.log(data1.lastMessage.messageTime + 'bbb');

            update['/inquiries/'+ inq.inquiryID] = data;
            database.ref().update(update);

            update1['/adinquiries/'+inq.inquiryOwner +'/'+inq.inquiryID] = data1;
            database.ref().update(update1);
/**************************************************************************************/
        }

    });

    client.on("registerUser",(email,password)=>{
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user) {
           // user signed up

           var userD = {
               email:email,
               type:"admin"
           };
           var update = {};
           update['/users/'+user.uid] = userD;
           database.ref().update(update).then(()=>{
               client.emit("registersuccess");

           });




        }).catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;

            client.emit("errorMsg",errorMessage);
        });
    });

    // client.on("loginUser",(email,password)=>{
    //     console.log('user with '+ email + ' trying to log in');
    //     firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
    //       // Handle Errors here.
    //     //   console.log(error);
    //       var errorCode = error.code;
    //       var errorMessage = error.message;
    //
    //       if(errorCode == 'auth/wrong-password'){
    //           client.emit("errorMsg","Wrong password, please try again");
    //       }else if(errorCode == 'auth/user-not-found'){
    //           client.emit("errorMsg","No such account, please try again");
    //       }else{
    //           client.emit("errorMsg",errorMessage);
    //       }
    //
    //     });
    //
    //     firebase.auth().onAuthStateChanged(user => {
    //         if(user!=undefined) {
    //             console.log('user logged in');
    //         // window.location = 'home.html'; //After successful login, user will be redirected to home.html
    //             currentUser = user
    //
    //             var z = database.ref('/users').once('value')
    //             .then((res)=>{
    //                 var b = false;
    //
    //                 for(var x in res.val()){
    //                     //  us[x] = res.val()[x];
    //                     if(res.val()[x].email == email && 'type' in res.val()[x] && res.val()[x].type =='admin'){
    //                         b = true;
    //                         break;
    //                     }
    //                 }
    //
    //                 if(b){
    //                     client.emit("redirectToInbox",user);
    //                 }else{
    //                     client.emit("notAdmin");
    //                 }
    //             });
    //
    //         }else{
    //             // console.log('logged out');
    //             // client.emit("redirectToLogin1");
    //         }
    //     });
    //
    //
    // });

    // client.on("logoutUser",()=>{
    //     firebase.auth().signOut().then(function() {
    //       // Sign-out successful.
    //     }, function(error) {
    //       // An error happened.
    //     });
    // });

    client.on("sendQuote",(b,inq)=>{

        if(inq.quotations!=undefined){
            var c= inq.quotations;
            c.push(b);

            var data = inq;
            data.quotations = c;
        }
        else{
            var temp = [];
            temp.push(b);

            var data = inq;
            data.quotations  = temp;

        }



        var update = {};
        var update1 = {};

        var data1 = JSON.parse(JSON.stringify(data));
        // data1.time = parseInt('-'+parseInt(new Date().getTime()));
        for(var i = 0; i < data1.quotations.length;i++){
            data1.quotations[i].time = parseInt('-'+data1.quotations[i].time);
            // console.log(data1.quotations[i].time);
        }

/**************************************************************************************/
        update['/inquiries/'+ inq.inquiryID] = data;
        database.ref().update(update);

        update1['/adinquiries/'+inq.inquiryOwner +'/'+inq.inquiryID] = data1;
        database.ref().update(update1);

/**************************************************************************************/




    });

    client.on("resetPassword",(email)=>{
        firebase.auth().sendPasswordResetEmail(email).then(function() {
            client.emit("resetSuccessful","Reset email sent successfully");
          // Email sent.
        }, function(error) {
          // An error happened.
        });

    });






});
