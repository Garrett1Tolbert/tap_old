(function() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyAIpR8O8xEDrSitpVI6jpVBEvXU5reQLNM",
    authDomain: "alphabetter-tap-v1.firebaseapp.com",
    databaseURL: "https://alphabetter-tap-v1.firebaseio.com",
    projectId: "alphabetter-tap-v1",
    storageBucket: "alphabetter-tap-v1.appspot.com",
    messagingSenderId: "806333716389"
  };
  firebase.initializeApp(config);

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var user = firebase.auth().currentUser;

      if(window.location.href.indexOf("feed") > -1) {
        console.log("You're on the right page " + user.displayName);
      }
      // window.location = 'feed.html';
      console.log("User signed in");

    } else {
      // No user is signed in.
      console.log("User signed out");
    }
  });

  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })
}());


function logout() {
  firebase.auth().signOut().then(function() {
    console.log("Logging out...");
    location.replace('index.html');
    // Sign-out successful.
  }).catch(function(error) {
    // An error happened.
  });
}

function login() {
  //Get elements
  const loginEmail = document.getElementById('login_email').value;
  const loginPassword = document.getElementById('login_password').value;
  const loginBtn = document.getElementById('btn_login');

  firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    window.alert("Error: " + errorMessage);
    location.replace = 'feed.html';
  });
}

function create() {
  //Get elements
  const createEmail = document.getElementById('create_email').value;
  const createPassword = document.getElementById('create_password').value;
  const createBtn = document.getElementById('btn_create_account');

  firebase.auth().createUserWithEmailAndPassword(createEmail, createPassword).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    window.alert("Error: " + errorMessage);
    location.replace = 'feed.html';
  });
}

function googleLogin() {
  console.log("here");
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)

          .then(result => {
            const user = result.user;
            // location = "feed.html";
            // location.reload(true);
            location.replace('feed.html');
          })
          .catch(console.log);
}

function grabFollowers() {
  window.alert("Grabbing friends...🔄");
}
function recordAudio() {
  window.alert("Recording audio...");
}
function playbackAudio() {
  window.alert("Playing audio...");
}

function createChallenge() {

  //correct answer is not selected
  if(!(document.getElementById('radio1').checked || document.getElementById('radio2').checked
  || document.getElementById('radio3').checked || document.getElementById('radio4').checked)) {
    document.getElementById('correctAnswerAlert').style.display = "block";
  }
  else { //correct answer is selected
    document.getElementById('correctAnswerAlert').style.display = "none";
    $("#postChallengeModal").modal("show");
    setTimeout("location.href = 'feed.html'", 3000);
  }
}

$(document).ready(function(){
  //-----------------
  // Record Challenge
  //-----------------
  $("#recordBtn").click(function() {
    console.log("Modal showing");
    $("#newChallengeModal").modal("show");
    console.log("Modal shown...");
  });
});
