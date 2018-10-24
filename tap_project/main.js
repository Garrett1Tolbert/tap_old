console.log("App loaded");

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      console.log(user);
    }
    else{
      console.log("User is signed out.")
      document.getElementById('anonymousAlert').style.display = "block";
    }
  });

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
        console.log(user);
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
}



function postChallenge() {

  var inputs = document.getElementsByTagName('input');
  var labels = document.getElementById('labels').value;
  var option1 = document.getElementById("answer_choice1").value;
  var option2 = document.getElementById("answer_choice2").value;
  var option3 = document.getElementById("answer_choice3").value;
  var option4 = document.getElementById("answer_choice4").value;
  var answer, correct_option;
  var challengeLabels = [""];

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

    $("#postChallengeModal").modal("show");
    setTimeout("location.href = 'feed.html'", 3000);
  }
}

$(document).ready(function(){

  firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        document.getElementById('user_Name').innerHTML = user.displayName;
        document.getElementById('user_Photo').setAttribute("src",user.photoURL);
      } else {
        document.getElementById('feed_body').remove();
        document.getElementById('anonymousAlert').style.display = "block";

        $("#anonymousFAQView").click(function() {
          console.log("Anonymous FAQ Modal showing");
          $("#anonfaqModal").modal("show");
          console.log("Anonymous FAQ Modal shown...");
        });
      }
    });

  //-----------------
  // Create New Challenge
  //-----------------
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
  $("#view_FAQ").click(function() {
    console.log("FAQ Modal showing");
    $("#faqModal").modal("show");
    console.log("FAQ Modal shown...");
  });

});

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
