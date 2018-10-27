console.log("App loaded");



// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Initiate firebase auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

function authStateObserver(user){
  if (user && currentPageName() === "feed.html"){
    setProfileElements(user);
    listenToEventsOnFeed();

  }
  else{

  }
}

function initCloudFirestore(){
  // Initialize Cloud Firestore through Firebase
  var db = firebase.firestore();
  // Disable deprecated features
  db.settings({
    timestampsInSnapshots: true
  });
  db.enablePersistence()
      .catch(function(err) {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled
            // in one tab at a a time.
            // ...
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
            // ...
        }
    });
}


// Returns the signed-in user's display name.
function getUserName(user) {
  if (user.displayName){
    return {firstname : user.displayName.split(" ")[0],
            lastname : user.displayName.split(" ")[1]}
  }
}

function currentPageName(){
  var path = window.location.pathname;
  var page = path.split("/").pop();
  return page;
}



function storeUserInfoByUID(uid, user, password=null){
  console.log(user);
  const db = firebase.firestore();
  var usersRef = db.collection('users').doc(uid);
  usersRef.set({
        completedChallenges: [],
        email: user.email,
        firstname: user.displayName.split(" ")[0],
        followers: [],
        following: [],
        lastname: user.displayName.split(" ")[1],
        password: password,
        points : -99,
        unCompletedChallenges : []
    })
    .then(function() {
        console.log("Document successfully written!");
    })
    .catch(function(error) {
        console.error("Error writing document: ", error);
    });
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

function logout() {
  firebase.auth().signOut().then(function() {
    console.log("Logging out...");
    location.replace('index.html');
    // Sign-out successful.
  }).catch(function(error) {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    window.alert("Error: " + errorMessage);
  });
}

function login() {
  //Get elements
  const loginEmail = document.getElementById('login_email').value;
  const loginPassword = document.getElementById('login_password').value;


  firebase.auth().signInWithEmailAndPassword(loginEmail, loginPassword)
    .then(() => {
       location.replace('feed.html');
    })
    .catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
      window.alert("Error: " + errorMessage);
    });

}

function create() {

  const createEmail = document.getElementById('create_email').value;
  const createPassword = document.getElementById('create_password').value;

  firebase.auth().createUserWithEmailAndPassword(createEmail, createPassword)
      .then(() => {
         //
         const user  = firebase.auth().currentUser;
         console.log(user);
         storeUserInfoByUID(user.uid, user, createPassword);
         location.replace('feed.html');
      })
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        window.alert("Error: " + errorMessage);
      });

}

function googleLogin() {
  console.log("Google login called...");
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)
      .then(result => {
        const user = result.user;

        storeUserInfoByUID(user.uid,user);

        location.replace('feed.html');
      })
      .catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        window.alert("Error: " + errorMessage);
      });

}

function listenToEventsOnFeed(){
  $("#recordBtn").click(function() {
    console.log("New Challenge Modal showing");
    $("#newChallengeModal").modal("show");
    var inputs = document.getElementsByTagName('input');
    for(var i = 0; i<inputs.length; i++) {
      inputs[i].value = '';
    }
    document.getElementById('correctAnswerAlert').style.display = "none";
    console.log("New Challenge Modal shown");
  });

  $("#view_Profile").click(function() {
    console.log("Profile Modal showing");
    $("#profileModal").modal("show");
    console.log("Profile Modal shown...");
  });

  $("#view_FAQ").click(function() {
    console.log("FAQ Modal showing");
    $("#faqModal").modal("show");
    console.log("FAQ Modal shown...");
  });
}

function setProfileElements(user){

  console.log(user);
  document.getElementById('user_Name').innerHTML = user.displayName;
  document.getElementById('profilePage_Name').innerHTML = user.displayName;
  document.getElementById('profilePage_Email').innerHTML = user.email;

  document.getElementById('user_Photo').setAttribute("src",user.photoURL);
  document.getElementById('profilePage_Photo').setAttribute("src",user.photoURL);

}



function grabFollowers() {
  const db = firebase.firestore();
  var docRef = db.collection("follows").doc("liannes");

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
}


function getChallengeData() {
  var inputs = document.getElementsByTagName('input');
  var labels = document.getElementById('labels').value;
  var option1 = document.getElementById("answer_choice1").value;
  var option2 = document.getElementById("answer_choice2").value;
  var option3 = document.getElementById("answer_choice3").value;
  var option4 = document.getElementById("answer_choice4").value;
  var answer, correct_option;
  var challengeLabels = [""];

  const db = firebase.firestore();
  var chosen_option;

  //check to see if any answer choices have no value
  if(option1 == "" || option2 == "" ||option3 == "" || option4 == ""
     || option1 == " " || option2 == " " ||option3 == " " || option4 == " ") {
    document.getElementById('allAnswersRequiredAlert').style.display = "block";
  }
  else { //all answer choices have values
    document.getElementById('allAnswersRequiredAlert').style.display = "none";

    //an answer is not selected as the correct answer
    if(!(document.getElementById('radio1').checked || document.getElementById('radio2').checked
    || document.getElementById('radio3').checked || document.getElementById('radio4').checked)) {
      document.getElementById('correctAnswerAlert').style.display = "block";
    }
    else { //an answer is selected as the correct answer
      document.getElementById('correctAnswerAlert').style.display = "none";

      //get answer choices
      for(var i = 0; i<inputs.length; i++) {
        if(inputs[i].getAttribute('type')=='radio' && document.getElementById(inputs[i].id).checked) {
          correct_option = inputs[i].id;
          break;
        }
      }


      //get answer
      var answerString = "answer_choice";
      answerString += correct_option.slice(-1);
      // console.log("AnswerID: " + answerString);
      answer = document.getElementById(answerString).value;
      console.log("Answer chosen: " + answer);

      //get labels
      var labelPos = 0;
      for(var a = 0; a < labels.length; a++) {
        if(labels.charAt(a) == ',') {
          labelPos++;
          challengeLabels[labelPos] = "";
          continue;
        }
        else if (labels.charAt(a) == ' ' && labels.charAt(a-1) == ',') {
          continue;
        }
        else {
          challengeLabels[labelPos] += labels.charAt(a);
        }
      }
      console.log(challengeLabels);

      postChallenge(answer,challengeLabels,option1,option2,option3,option4);
    }
  }
}

function postChallenge(answer,label, option_1,option_2,option_3,option_4) {

  const db = firebase.firestore();
  $("#postChallengeModal").modal("show");

  //add challenge to firebase
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
     //location.replace('feed.html');
     console.log("User is signed in.")
     // Add a new document with a generated id.
     let date = Date.parse('01 Jan 2000 00:00:00 GMT');
     db.collection("challenges").add({
        answer: answer,
        creatorId: firebase.firestore().doc('/users/'+user.email),
        labels: label,
        options: [option_1, option_2, option_3, option_4],
        time: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function(error) {
        console.error("Error adding document: ", error);
      });
    }
  });
  setTimeout("location.href = 'feed.html'", 3000);
}



//-----------------
// Record Challenge
//-----------------
const recordAudio = () =>
 new Promise(async resolve => {
   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   const mediaRecorder = new MediaRecorder(stream);
   const audioChunks = [];
   mediaRecorder.addEventListener("dataavailable", event => {
     audioChunks.push(event.data);
   });
   const start = () => mediaRecorder.start();
   const stop = () =>
     new Promise(resolve => {
       mediaRecorder.addEventListener("stop", () => {
         const audioBlob = new Blob(audioChunks);
         const audioUrl = URL.createObjectURL(audioBlob);
         const audio = new Audio(audioUrl);
         const play = () => audio.play();
         resolve({ audioBlob, audioUrl, play });
       });
       mediaRecorder.stop();
     });
   resolve({ start, stop });
 });
let recorder = null;
let audio = null;
async function recordStop() {
  console.log("Anurag");
  if (recorder) {
   audio = await recorder.stop();
   recorder = null;
   document.querySelector("#record_stopBtn").setAttribute("src", "images/record_audio.png");
   document.querySelector("#playbackAudioBtn").removeAttribute("disabled");
  } else {
   recorder = await recordAudio();
   recorder.start();
   document.querySelector("#record_stopBtn").setAttribute("src", "images/stop_recording.png");
  }
};
const playAudio = () => {
   if (audio && typeof audio.play === "function") {
     audio.play();
   }
};




//-----------------
// Code that MUST be initlialized first when each HTML page loads
//-----------------

// Checks that Firebase has been imported.
checkSetup();

// initialize Firebase Auth
initFirebaseAuth();

// Initialise firestore and its necessary settings
initCloudFirestore();

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
    $('.collapse').collapse();
  });
