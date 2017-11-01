importScripts('/js/firebase-app.js');
importScripts('/js/firebase-messaging.js');


var config = {
   apiKey: "AIzaSyDhSwnH4r5RcP-AFErHDdh3kjFfyyOr7kc",
   authDomain: "cloudnotification-afe9c.firebaseapp.com",
   databaseURL: "https://cloudnotification-afe9c.firebaseio.com",
   projectId: "cloudnotification-afe9c",
   storageBucket: "cloudnotification-afe9c.appspot.com",
   messagingSenderId: "942434564935"
 };

 firebase.initializeApp(config);
 const messaging = firebase.messaging();
