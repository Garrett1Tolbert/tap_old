console.log("App loaded");



// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();
// Disable deprecated features
db.settings({
  timestampsInSnapshots: true
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });



function logout() {
  firebase.auth().signOut().then(function() {
    console.log("Logging out...");
    location.replace('index.html');
    // Sign-out successful.
  }).catch(function(error) {
    // An error happened.
    console.log("Error occurerd");
  });
}

function login() {
  //Get elements
  const loginEmail = document.getElementById('login_email').value;
  const loginPassword = document.getElementById('login_password').value;


  firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    window.alert("Error: " + errorMessage);
  });


  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
       location.replace('feed.html');
      }
      else{
        console.log("User is signed out.")
      }
    });

}

function create() {

  const createEmail = document.getElementById('create_email').value;
  const createPassword = document.getElementById('create_password').value;

  firebase.auth().createUserWithEmailAndPassword(createEmail, createPassword).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    window.alert("Error: " + errorMessage);
  });

  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
       location.replace('feed.html');
      }
      else{
        console.log("User is signed out.")
      }
    });

}

function googleLogin() {
  console.log("here");
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)

          .then(result => {
            const user = result.user;

            location.replace('feed.html');
          })
          .catch(console.log);


}

function grabFollowers() {
  const db = firebase.firestore();
  var docRef = db.collection("users").doc("liannes");

  docRef.get()
    .then(function(doc) {
        if (doc.exists) {
            console.log("Document data:", doc.data());
        } else {
              // doc.data() will be undefined in this case
            console.log("No such document!");
          }

        })
    .catch(function(error) {
    console.log("Error getting document:", error);
    });
  //window.alert("Grabing followers");
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

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Checks that Firebase has been imported.
checkSetup();
