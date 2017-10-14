// var app = angular.module("myApp",['ui.router','ngMaterial','ngCookies']);
var app = angular.module("myApp",['ui.router','ngCookies']);

document.addEventListener('DOMContentLoaded', function () { // for notifications
    if (!Notification) {
        alert('Desktop notifications not available in your browser. Try Chrome.');
        return;
    }

    if (Notification.permission !== "granted")
        Notification.requestPermission();
});


// var socket= io.connect("http://protected-sierra-93361.herokuapp.com");
var socket= io.connect("http://localhost:3000");


app.controller("loginCtrl",($scope,$state,$cookieStore)=>{
    if($cookieStore.get('dbLogged'))
    {
        $state.go('home.inbox');
    }

    $scope.showlogin = true;
    $scope.showsignup = false;

    $scope.register = (email,pass,code)=>{
        console.log(email + pass);
        if(code != "123abc"){
            alert("Invalid Registration key");
        }else{
            console.log("Signup");
            socket.emit("registerUser",email,pass);
        }
    };

    $scope.resetPassword = (email)=>{
        socket.emit("resetPassword",email);
    };

    socket.on("errorMsg",(err)=>{
        alert(err);
        location.reload();
    });


    $scope.login = (email,pass)=>{
        // console.log(email + pass);
        socket.emit("loginUser",email,pass);
    };

    socket.on("registersuccess",()=>{
        location.reload();
        alert("Registered successfully!");
    });

    socket.on("notAdmin",()=>{
        alert("You are not an admin. ");
        location.reload();
    });

    socket.on("resetSuccessful",(mess)=>{
        alert(mess);
        location.reload();
    });

    socket.on("redirectToInbox",(user)=>{
        $state.go('home.inbox');

        $cookieStore.put('dbLogged',true);

    });

    socket.on("redirectToLogin",(user)=>{
        $state.go('login');
    });

});

app.controller("historyCtrl",($scope,inqService,userService)=>{
    $scope.orderByField = 'time';
    $scope.reverseSort = false;


    $scope.reload =()=>{
        location.reload();
    }

    $scope.$watch(function() {
        return inqService.getInq();
    }, function() {
        $scope.getInq();
    });

    $scope.$watch(function() {
        return userService.getUsers();
    }, function() {
        $scope.updateUsers();
    });

    $scope.users = {};


    $scope.updateUsers = ()=>{
        $scope.users = userService.getUsers();
    };


    $scope.openInq = (ID)=>{
        // window.open("http://protected-sierra-93361.herokuapp.com/#!/home/inbox/chat/"+ID);
        window.open("http://localhost:3000/#!/home/inbox/chat/"+ID);

    }
    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.payments = [];

        if(Object.keys($scope.allInq).length>0){

            for(k in $scope.allInq){
                if($scope.allInq[k].quotations != undefined && $scope.users[$scope.allInq[k].inquiryOwner]!=undefined){
                    // console.log("very true");
                    for(var i =0; i< $scope.allInq[k].quotations.length; i++){
                        if($scope.allInq[k].quotations[i].payment!=undefined)
                        {

                            $scope.toAdd = $scope.allInq[k].quotations[i].payment;
                            $scope.toAdd.time = $scope.allInq[k].quotations[i].payment.paymentDate;


                            // console.log(new Date($scope.allInq[k].quotations[i].payment.paymentDate));
                            $scope.toAdd.inquiryID = $scope.allInq[k].inquiryID;
                            $scope.toAdd.inquiryName = $scope.allInq[k].inquiryName;
                            $scope.toAdd.quote = $scope.allInq[k].quotations[i];
                            $scope.toAdd.quoteNumber = i + 1;
                            $scope.toAdd.customerID = $scope.allInq[k].inquiryOwner;

                            $scope.toAdd.customer = $scope.users[$scope.allInq[k].inquiryOwner].name;
                            $scope.toAdd.address = $scope.users[$scope.allInq[k].inquiryOwner].address;
                            $scope.toAdd.contact = $scope.users[$scope.allInq[k].inquiryOwner].contact
                            $scope.toAdd.email = $scope.users[$scope.allInq[k].inquiryOwner].email
                            // $scope.toAdd.comname = $scope.users[$scope.allInq[k].inquiryOwner].comname


                            $scope.payments.push($scope.toAdd);
                            // console.log($scope.payments)
                        }
                    }
                }

            }

            // console.log($scope.payments);
        }
    };

});

app.controller("chatCtrl",($scope, $log,$stateParams, messageService,$state,inqService,userService,$cookieStore,promoService)=>{

    window.onfocus = ()=>{
        $scope.$apply();
    }

    if(firebase.apps.length === 0){
        socket.emit("getConfig");
    }

    var config = {};
    var fbApp;
    var defaultStorage ;


    socket.on("getConfig",(c)=>{
        // console.log('getting on chat');
        config = c;
        fbApp = firebase.initializeApp(config);
        defaultStorage  = fbApp.storage().ref();
    });

    $scope.file_changed = function(element) {
        $scope.$apply(function(scope) {


            var imgRef = defaultStorage.child('photos'+ '/'+$stateParams.id+'/'+element.files[0].name);

            var fileReader = new FileReader();
            fileReader.onload = ()=>{
                $scope.loadedFile = fileReader.result;
                   $scope.$apply();
            };

            fileReader.readAsDataURL(element.files[0]);

            $('#imgModal').modal('show');

            var files = element.files; //FileList object

            $scope.upload = ()=>{
                $('#imgModal').modal('hide');

                var uploadTask = imgRef.put(element.files[0]);
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,function(snapshot) {

                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    $scope.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // console.log('Upload is ' + progress + '% done');
                }, function(error) {

                    alert("error uploading, please try again")
                }, function() {
                    // Upload completed successfully, now we can get the download URL
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    // console.log(downloadURL);

                    socket.emit("sendImage", downloadURL,$stateParams.id);

                });
            }

        });
    };


    $scope.getRead = (inq)=>{
        // console.log(inq.lastMessage);
        if(inq.lastMessage.messageUser=="admin")
        {
            return true;
        }else if(inq.lastMessage.messageUser!="admin" && inq.lastMessage.messageRead== true){
            return true;
        }
        else{
          return false;
        }
    };

    $scope.getUnread = (inq)=>{
        if(inq.lastMessage.messageUser=="admin"){
            return false;
        } else if(inq.lastMessage.messageUser!="admin" && inq.lastMessage.messageRead== false){
            return true;
        }else if(inq.lastMessage.messageUser!="admin" && inq.lastMessage.messageRead== true){
            return false;
        }
    };

    $scope.getPaid = (inq)=>{
        if('quotations' in inq)
        {
            for(var i = 0; i < inq.quotations.length; i++)
            {
                // console.log(inq.quotations[i]);
                if('payment' in inq.quotations[i]){
                    return true;
                }
            }

            return false;
        }
    }

    $scope.getInbox = (inq)=>{ // filtering
        if(inq.status=="trash")
        {
            return false;
        }

        return true;
    }

    $scope.getTrash = (inq)=>{ // filtering
        if(inq.status=="trash")
        {
            return true;
        }

        return false;
    }

    $scope.getUnpaid = (inq)=>{
        if('quotations' in inq)
        {
            for(var i = 0; i < inq.quotations.length; i++)
            {
                // console.log(inq.quotations[i]);
                if('payment' in inq.quotations[i]){
                    return false;
                }
            }

            return true;
        }
        else{
            return true;
        }

    }

    $scope.selected = "inbox";

    if(!$cookieStore.get('dbLogged')){
        socket.emit("getUser");
    }

    $scope.abc= function logshit(){
        console.log($cookieStore.get('dbLogged'));
    }

    $scope.$watch(function() {
        return $cookieStore.get('dbLogged');
    }, function(newValue) {
        if(!newValue){
            window.location.href = "http://localhost:3000/#!/login";
        }
    });



    $scope.view = ()=>{
        $('.image').viewer();
    };

    socket.emit("retrieveInfo");

    socket.on("redirectToLogin1",()=>{


        $state.go('login');
        // window.location = "http://localhost/#!/home/inbox";

        // window.location = "http://localhost:3000/#!/login";
        window.location.reload();
    });

    $scope.logout = ()=>{
        $cookieStore.remove('dbLogged');

        window.location.reload();

    };

    $scope.rname = '';
    $scope.inputMessage = '';
    $scope.hideSend = true;
    $scope.hideRoom = true;
    $scope.allInquiryList = [];

    $scope.messages = [];

    $scope.hideName = true;
    $scope.hideRoom = false;

    socket.on("loadMessage",(msg)=>{
        var message = msg;
        messageService.addMessage(message);
        $scope.$apply();

    });


    socket.on("recieveMessage",(msg)=>{
        // console.log('recieving message');
        // console.log(msg);
        var message = {};
        var message = msg;

        $scope.notificationtitle = $scope.allInquiryList[msg.inquiryID].inquiryName;

        messageService.addMessage(message);
        $scope.$apply();

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });

        // console.log(message);
        var notification;


        if(message.messageUser!= 'admin'){
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {

                console.log(notification);
                if(notification){
                    // console.log("got");
                    // notification.body = message.messageText;
                }else{
                    // console.log("dont have")

                    notification = new Notification($scope.notificationtitle, {
                        icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd0XHy-MpwWSHpn4RbwC8dKSWeabXTe3jf6uIZGldY26367BPL',
                        body: message.messageText,
                    });

                    setTimeout(notification.close.bind(notification), 3000);

                }
                // notification = new Notification($scope.notificationtitle, {
                //     icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQd0XHy-MpwWSHpn4RbwC8dKSWeabXTe3jf6uIZGldY26367BPL',
                //     body: message.messageText,
                // });


                notification.close();


                if(message.messageType== "payment"){
                    notification.onclick = function () {
                        window.open("http://protected-sierra-93361.herokuapp.com/#!/home/history");
                        // window.open("http://localhost/#!/home/inbox/chat/"+ID);
                    };
                }else{
                    notification.onclick = function () {
                        window.open("http://protected-sierra-93361.herokuapp.com/#!/home/inbox/chat/"+msg.inquiryID.trim());
                        // window.open("http://localhost/#!/home/inbox/chat/"+ID);
                    };
                }

            }
        }

    });

    socket.on("updatePromoList",(promoList)=>{
        promoService.addPromo(promoList);
        $scope.$apply();
    });

    socket.on("updateUserList",(userList)=>{
        userService.addUsers(userList);
        $scope.$apply();

    });

    socket.on("updateInquiryList",(inquiryList)=>{
        $scope.allInquiryList = inquiryList;

        inqService.addInq(inquiryList);
        $scope.$apply();
    });

    $scope.updateRead = (inq)=>{

        socket.emit("updateLastRead",inq);
    };
});



app.controller("listProductCtrl",($scope,promoService)=>{
    $scope.$watch(function() {
        return promoService.getPromo();
    }, function() {
        $scope.updatePromo();
    });

    $scope.updatePromo = ()=>{
        $scope.promo = promoService.getPromo();

        console.log($scope.promo);
    };

    $scope.update = (key,productName,type,desc,promotion,discountAmount,img)=>{
        var data = {};
        data.productName = productName;
        data.productType = type;
        data.description = desc;
        data.promotion = promotion;
        data.discountPercent = discountAmount;
        data.imageFileUrl = img;

        socket.emit("updateProduct",key,product);
    };




});

app.controller("addProductCtrl",($scope,$state,promoService)=>{


    // $scope.promo = promoService.getPromo();
    $scope.dothis = ()=>{
        console.log($scope.discount);
    };

    $scope.selected = false;
    // console.log(firebase.apps.length);
    var defaultStorage ;

    function checkFlag() {
        if(!firebase.apps.length) {
           window.setTimeout(checkFlag, 1); /* this checks the flag every 100 milliseconds*/
        } else {

          defaultStorage  = firebase.storage().ref();
        }
    }
    checkFlag();


    socket.on("productSuccess",()=>{
        alert('Product added successfully');

        location.reload();

    });

    $scope.file_changed = (element)=> {
        $scope.$apply((scope)=> {
            console.log($scope.type);
            $scope.selected = true;
            var fileReader = new FileReader();
            fileReader.onload = ()=>{
                $scope.loadedFile = fileReader.result;
                $scope.$apply();
            };

            fileReader.readAsDataURL(element.files[0]);

            var files = element.files;

            $scope.upload = ()=>{
                // console.log("trying to upload");
                if($scope.pName=='' || !$scope.pName){
                    alert('Product Name cannot be empty');
                    return ;
                }

                if($scope.selected){
                    var imgRef = defaultStorage.child('promo'+ '/'+ $scope.type +'/'+element.files[0].name);

                    var uploadTask = imgRef.put(element.files[0]);
                    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,function(snapshot) {

                        $scope.progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        // console.log('Upload is ' + progress + '% done');
                    }, function(error) {

                        alert("error uploading, please try again")
                    }, function() {
                        // Upload completed successfully, now we can get the download URL
                        var downloadURL = uploadTask.snapshot.downloadURL;

                        $scope.submitForm(downloadURL);

                    });
                }
                else{
                    alert('Please pick a photo');
                }

            }

        });
    };

    $scope.submitForm = (url)=>{
        var product = {};
        product.productName = $scope.pName;
        product.productType = $scope.type;
        product.description = $scope.desc;
        product.promotion = $scope.promo;

        if(product.promotion){
            product.discountPercent = $scope.discount;
        }
        else{
            product.discountPercent = 0;
        }
        console.log(product)
        product.imageFileUrl = url;
        socket.emit("addProduct",product);
    };

});


app.controller("chatBoxCtrl",($scope,$stateParams,messageService,inqService,userService)=>{

    var rT = 0;
    $scope.discount = false;

    $scope.toggleDiscount = ()=>{
        if($scope.discount){
            $scope.dis=0;
            $scope.discount = false;
            $scope.getTotal();

        }
        else{
            $scope.dis=0;
            $scope.discount = true;
            $scope.getTotal();

        }
    };

    $("#usermsg").keypress(function (e) {
        if(e.which == 13 && !e.shiftKey) {
            $scope.sendMessage2();
            e.preventDefault();
            return false;
        }
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })

    $scope.chatID = $stateParams.id; //get chat id
    $scope.messages = messageService.getMessage(); //get messages

    $scope.all = {};

    // $scope.allInq = inqService.getInq();

    $scope.$watch(function() {
        return userService.getUsers();
    }, function() {
        $scope.updateUsers();
    });

    $scope.users = {};

    $scope.toTrash = (inq)=>{
        socket.emit("toTrash",inq);

    }

    $scope.toInbox = (inq)=>{
        socket.emit("toInbox",inq);

    }

    $scope.updateUsers = ()=>{
        $scope.users = userService.getUsers();
    };


    $scope.$watch(function() {
        return inqService.getInq();
    }, function(newContacts) {

        $scope.getInq();
    });

    $scope.currentInq = {};
    $scope.item1= [];
    $scope.allInq = {};


    $scope.addRow = ()=>{
        $scope.currentInq1.items.push({});

        $scope.item1.push('');
    };

    $scope.removeRow= (index)=>{
        if(index>-1)
        {
            $scope.currentInq1.items.splice(index,1);
            $scope.ppu.splice(index,1);
            $scope.quantity.splice(index,1);
            // $scope.total.splice(index,1);

            $scope.item1.splice(index,1);

            // console.log($scope.total);
            $scope.getTotal();
        }
    };

    $scope.getInq = ()=>{
        $scope.allInq = inqService.getInq();

        $scope.currentInq = angular.copy($scope.allInq[$scope.chatID]);
        if($scope.currentInq)
        // console.log($scope.currentInq);

        if($scope.currentInq != undefined)
        {
            $scope.currentInq1 = angular.copy($scope.currentInq);
        }

        if($scope.currentInq!=undefined)
        {
            for(var i=0;i<$scope.currentInq['items'].length;i++ ){
                $scope.item1.push($scope.currentInq['items'][i].itemName);
            }
            // console.log($scope.users);
            $scope.currentUser = $scope.users[$scope.currentInq.inquiryOwner];
            // console.log($scope.currentUser);
        }
    };


    $scope.ppu = [];
    $scope.quantity = [];
    $scope.total = [];
    // $scope.bearing= [];

    $scope.itemsx = [] ;
    $scope.gTotal = 0;

    $scope.getTotal = ()=>{

        var l = $scope.ppu.length;

        var total = 0;
        for(var i =0; i<l; i++)
        {
            total = total + ($scope.ppu[i] * $scope.quantity[i]);
        }
        // console.log("total is" + total);

        $scope.realTotal = total;
        rT = total;

        if($scope.discount && $scope.realTotal != 0){
            total = total - ($scope.realTotal* $scope.dis/100) ;
        }

        $scope.gTotal = total;
    };


    $scope.updateItems = (index,itemName)=>{
        $scope.item1[index] = itemName;
    };

    $scope.sendQuote = ()=>{
        $scope.data = [];
        // console.log($scope.ppu);

        for(var i = 0; i < $scope.ppu.length;i++){
            var name = $scope.item1[i];
            var q = $scope.quantity[i];
            var ppu = $scope.ppu[i];
            var t = $scope.total[i];

            var c = {};
            c['itemName']= name;
            c['quantity'] = q;
            c['pricePerUnit'] = ppu;
            c['total'] = q * ppu;

            $scope.data.push(c);
            // console.log(c);
        }

        $scope.tosend = {};
        $scope.tosend.quoteItems = $scope.data;

        $scope.tosend.discountAmount = $scope.realTotal* $scope.dis/100;
        $scope.tosend.discountPercent = $scope.dis;

        $scope.tosend.discountPercent = parseFloat($scope.tosend.discountPercent);

        $scope.tosend.rTotal = rT;
        $scope.tosend.gTotal = $scope.gTotal;

        socket.emit("sendQuote",$scope.tosend,$scope.currentInq);
        console.log($scope.tosend.quoteItems);
        console.log($scope.currentInq.items);

        var toSend = {};
        toSend.dest = $scope.chatID;
        toSend.mess = "I have sent you a Quotation";
        socket.emit("sendMessage",toSend,$scope.currentInq.inquiryOwner);
    };




    $scope.updateFilter = ()=>{
        $scope.filterR = {'inquiryID': $stateParams.id};
        $(document).ready(function(){
        $('#convo').animate({
            scrollTop: $('#convo')[0].scrollHeight}, 0);
        });
    };


    $scope.sendMessage2 = ()=>{
        if($scope.inputMessage!=''){
            var toSend = {};
            // console.log($scope.inputMessage);
            toSend.dest = $scope.chatID;
            toSend.mess = $scope.inputMessage;
            socket.emit("sendMessage",toSend,$scope.currentInq.inquiryOwner);
            $scope.inputMessage = '';
        }
    };

    $scope.autojoinRoom = ()=>{
        socket.emit("joinRoom",$scope.chatID);
    };

    $scope.updateRead = ()=>{
        socket.emit("updateLastRead2",$scope.chatID);
        // console.log('chatboxctrl');
    };

});

app.filter('customFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            if (item.inquiryID === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
});


app.filter('reverse', function() {
  return function(items) {
      if(items){
          return items.slice().reverse();
      }
  };
});

app.filter('inqFilter', function(){
    return function (items,id) {
        var filtered = [];
        angular.forEach(items, function(item){
            // console.log(id);
            // console.log(item.inquiryOwner.length);
            if (item.inquiryOwner === id){
                filtered.push(item);
            }
        });
        return filtered;
    };
});

app.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])

app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
        if(a!=undefined && b!=undefined)
        {
            return (a.lastMessage.messageTime > b.lastMessage.messageTime ? 1 : -1);
        }
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});

app.config(function($stateProvider,$urlRouterProvider) {
//  $urlRouterProvider.otherwise('/home');
$urlRouterProvider.otherwise('home/inbox');
  $stateProvider
    .state('home',{
        url:"/home",
        abstract: true,
        templateUrl: "templates/home.html"
    })
    .state('home.history',{
      url: '/history',
      templateUrl: "templates/history.html"
    })
    .state('home.inbox',{
      url: '/inbox',
      templateUrl: "templates/inbox.html"
    })
    .state('home.inbox.chat',{
      url: '/chat/:id',
      templateUrl: "templates/chats.html"
    })
    .state('login',{
        url:'/login',
        templateUrl:"templates/login1.html"
    })
    .state('home.stats',{
        url:'/stats',
        templateUrl: "templates/stats.html"
    })
    .state('home.addproduct',{
        url:'/addproduct',
        templateUrl: "templates/addproduct.html"
    })
    .state('home.productlist',{
        url:'/productlist',
        templateUrl: "templates/productlist.html"
    })

    ;
})


app.service('inqService', function() {
    var inqList = [];

    var addInq = function(newObj) {
    //   inqList.push(newObj);
        inqList = newObj;
        // console.log(inqList);
    };

    var getInq = function(){
      return inqList;
    };

    return {
        addInq: addInq,
        getInq: getInq
    };

});

app.service('promoService', function() {
    var promoList = [];

    var addPromo = function(newObj) {
        promoList = newObj;
    };

    var getPromo = function(){
      return promoList;
    };

    return {
        addPromo: addPromo,
        getPromo: getPromo
    };

});



app.service('userService', function() {
    var userList = [];

    var addUsers = function(newObj) {
        userList = newObj;
    };

    var getUsers = function(){
      return userList;
    };

    return {
        addUsers: addUsers,
        getUsers: getUsers
    };

});

app.service('messageService',function() {

    var messageConvo = [];
    var addMessage = function(newObj){
      messageConvo.push(newObj);
    };

    var getMessage = function(){
        return messageConvo;
    };

    return {
        addMessage: addMessage,
        getMessage: getMessage
    };
});
