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

      window.location = 'signin_success.html';
    } else {
      // No user is signed in.
      // window.location = 'index.html';
    }
  });

  $("form").click(function(event){
    event.preventDefault();
  });

}());



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
  });
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)

          .then(result => {
            const user = result.user;
            window.location = 'sigin_success.html';
          })
          .catch(console.log);

}

function createChallenge() {
  window.alert("Creating challenge...");
}
