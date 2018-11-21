console.log("App loaded");
var counter = 1;
var currChallenge = "";


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
  console.log("Observer called here.");
  if ((user && currentPageName() === "feed.html") || (user && currentPageName() == "my-challenges.html") || (user && currentPageName() == "liked-challenges.html")) {
    setProfileElements(user);
    setProfileModalElements(user);
    listenToEventsOnFeed();
  }
  else if ((!user && currentPageName() === "feed.html") || (!user && currentPageName() === "my-challenges.html") || (!user && currentPageName() === "liked-challenges.html")) {
    showAnonymous();
  }

}

function showAnonymous() {
  document.getElementById('anonymousAlert').style.display = 'block';
  document.getElementById('recordBtn').style.display = 'none';
  // document.getElementById('feed_body').remove();
  // document.getElementById('myChall_body').remove();
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
            console.log(err.code);
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
            // ...
            console.log(err.code);
        }
    });
}


// Returns the signed-in user's display name.
function getFirstNameLastName(user) {
  if (user.displayName){
    return {firstname : user.displayName.split(" ")[0],
            lastname : user.displayName.split(" ")[1]}
  }
  else{
    // If the displayName is null
    return {firstname :null,
            lastname : null}
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
        firstname: getFirstNameLastName(user).firstname,
        followers: [],
        following: [],
        lastname: getFirstNameLastName(user).lastname,
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
  const createFirstname = $("#create_fname").val();
  const createLastname = $("#create_lname").val();
  firebase.auth().createUserWithEmailAndPassword(createEmail, createPassword)
      .then(() => {
        if (isUserSignedIn()){
          var user = firebase.auth().currentUser;
          user.updateProfile({
              displayName: createFirstname + " " + createLastname,
              photoURL: "images/default_profile_pic.png"
            }).then(function() {
              // Update successful.
              console.log("Update successful.");
              var ref = firebase.firestore().collection('users').doc(user.uid);
              console.log(ref);
              ref.get()
              .then(doc => {if (doc.exists){}else{
                ref.set({
                      completedChallenges: [],
                      email: createEmail,
                      firstname: createFirstname,
                      followers: [],
                      following: [],
                      lastname: createLastname,
                      password: createPassword,
                      points : -99,
                      profilePhoto: user.photoURL,
                      likedChallenges : [],
                      unCompletedChallenges : []
                  })
                  .then(function() {
                      console.log("Document successfully written!");
                      location.replace('feed.html');
                  })
                  .catch(function(error) {
                      console.error("Error writing document: ", error);
                  });
                }
              }).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // ...
                window.alert("Error: " + errorMessage);
              });
            }).catch(function(error) {
              console.error("Error updating user: ", error);
            });

        }
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

  const db = firebase.firestore();
  // var usersRef = db.collection('users').doc(uid);

  firebase.auth().signInWithPopup(provider).then(result => {
    const user  = result.user;

    var ref = firebase.firestore().collection('users').doc(user.uid);
    console.log(ref);
    ref.get()
    .then(doc => {if (doc.exists){location.replace('feed.html');}else{
      ref.set({
            completedChallenges: [],
            email: user.email,
            firstname: getFirstNameLastName(user).firstname,
            followers: [],
            following: [],
            lastname: getFirstNameLastName(user).lastname,
            password: null,
            points : -99,
            profilePhoto: user.photoURL,
            unCompletedChallenges : [],
            likedChallenges : []
        })
        .then(function() {
            console.log("Document successfully written!");
            location.replace('feed.html');
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
      }
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
      window.alert("Error: " + errorMessage);
    });


  }).catch(function(error) {
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
    audio = null;
    $("#newChallengeModal").modal("show");
    
    // Set all the inputs to empty string
    var inputs = document.getElementsByTagName('input');
    for(var i = 0; i<inputs.length; i++) {
      inputs[i].value = '';
    }
    // Uncheck all the radio boxes
    for (var i = 1; i <= 4; ++i){
      var radioElement = document.getElementById('radio' + i)
      radioElement.checked = false;
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
function playChallenge(challengeIdentifier) {
  currChallenge = challengeIdentifier;
  const db = firebase.firestore();
  var doc = db.collection("challenges").doc(challengeIdentifier);
  doc.get().then(function(doc){
    if(doc.exists){
      var creatorId =  doc.data().creatorId.id;
      listOfOptions =  doc.data().options;
      var audioStr = doc.data().audio;
      var doc2 = db.collection("users").doc(creatorId);
      doc2.get().then(async function(doc){
        if(doc.exists){
          creator_fname = doc.data().firstname;

          document.getElementById('playChallengeModalLabel').innerHTML = creator_fname + "\'s Challenge";
          document.getElementById('playChallengeModalLabel').style.letterSpacing = "3px";
          document.getElementById('playChallengeModalLabel').style.marginLeft = "30%";
          for(var i=0;i<listOfOptions.length;i++){
            document.getElementsByClassName('form-control playchallengeAnswers')[i].value = listOfOptions[i];
          }
          $("#playChallengeModal").modal("show");

          var audioURL = await getURLFromStorage(challengeIdentifier);
          var audio = new Audio(audioURL);
          audio.play();


        }
      });
    }
  }).catch(function(error) {
      console.log("Error getting document:", error);
    });




  //-----------------------------------------------------------------------------------
  //Get challenge answers and other doc info from firebase from the challengeIdentifier
  //-----------------------------------------------------------------------------------


}

function checkAnswers() {
  window.alert("Challenge: " + currChallenge);
  //an answer is not selected as the correct answer
  if(!(document.getElementById('play_answer_radio1').checked || document.getElementById('play_answer_radio2').checked
  || document.getElementById('play_answer_radio3').checked || document.getElementById('play_answer_radio4').checked)) {
    document.getElementById('challengeFooter').style.marginTop = "0";
    document.getElementById('noAnswerAlert').style.display = "block";
  } else {
    document.getElementById('noAnswerAlert').style.display = "none";

    var inputs = document.getElementsByTagName('input');

    //get answer choices
    for(var i = 0; i<inputs.length; i++) {
      if(inputs[i].getAttribute('type')=='radio' && document.getElementById(inputs[i].id).checked) {
        correct_option = inputs[i].id;
        break;
      }
    }
    //get answer
    var answerString = "play_answer_choice";
    answerString += correct_option.slice(-1);
    answer = document.getElementById(answerString).value;

    const db = firebase.firestore();
    var getAnswer = db.collection("challenges").doc(currChallenge);
    getAnswer.get().then(function(doc){
      if(doc.exists){
        if(doc.data().answer == answer){
          console.log("YOU ARE CORRECT!!!!!!!");
        }
        else{
          console.log("WRONGGGG!!!")
        }
      }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
    addToCompletedChallenges(currChallenge);
  }
}

function addToCompletedChallenges(challengeToBeAdded){
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      const db = firebase.firestore();
      console.log("user id", user.uid);
      var completedChallenges = db.collection("users").doc(user.uid);
      completedChallenges.get().then(function(doc){
        if(doc.exists){
          var listOfCompleted = doc.data().completedChallenges;
          var challengeReference = db.collection("challenges").doc(challengeToBeAdded);
          listOfCompleted.push(challengeReference);
          completedChallenges.update({
            completedChallenges: listOfCompleted
          }).catch(function(error){console.log("Error updating documents: ", error);});
        }
      }).catch(function(error) {
          console.log("Error getting document:", error);
        });
    }
    else{
      console.log("User is not logged in!");
    }
  });
}


function anonymousFAQ() {
  $("#anonfaqModal").modal("show");
}

function setProfileElements(user){
  document.getElementById('user_Name').innerHTML = user.displayName;
  document.getElementById('user_Email').innerHTML = user.email;
  document.getElementById('user_Photo').setAttribute("src",user.photoURL);
}

function setFollowProfileElements(userPassed){
    document.getElementById('followPage_Name').innerHTML = userPassed.data().firstname + " "+ userPassed.data().lastname;
    document.getElementById('followPage_Email').innerHTML = userPassed.data().email;
    document.getElementById('followPage_Photo').setAttribute("src",userPassed.data().profilePhoto);
    document.getElementById('followersFollowCount').innerHTML = userPassed.data().followers.length;
    document.getElementById('followingFollowCount').innerHTML = userPassed.data().following.length;
}


function setProfileModalElements(user){
  document.getElementById('profilePage_Name').innerHTML = user.displayName;
  document.getElementById('profilePage_Email').innerHTML = user.email;
  document.getElementById('profilePage_Photo').setAttribute("src",user.photoURL);
}

function grabFollowers() {
  grabFollowing();
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var doc = db.collection("users").doc(user.uid);
     doc.get().then(function(doc) {
           if (doc.exists){
               console.log("Document data:", doc.data().followers);
               var followers = doc.data().followers;
               document.getElementById('followersCount').innerHTML = followers.length;
               return doc.data().followers;
           } else {
                 // doc.data() will be undefined in this case
               console.log("No such document!");
             }

           }).catch(function(error) {
               console.log("Error getting document:", error);
             });
    }
    else{
      console.log("No user logged in");
    }
  });
}

function grabFollowing() {
  const db = firebase.firestore();

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var doc = db.collection("users").doc(user.uid);
     doc.get().then(function(doc) {
           if (doc.exists){
              console.log("Document data:", doc.data().following);
              var following = doc.data().following;
              document.getElementById('followingCount').innerHTML = following.length;

           } else {
                 // doc.data() will be undefined in this case
               console.log("No such document!");
             }

           }).catch(function(error) {
               console.log("Error getting document:", error);
             });
    }
    else{
      console.log("No user logged in");
    }
  });
}

function populateLabels(div,labelsArray) {
  var newlabel = document.createElement("p");
  // newlabel.style.backgroundColor = "lightgray";
  if(labelsArray.length == 0) {
    div.appendChild(newlabel);
    // newlabel.innerHTML = "No Labels";
    newlabel.style.textAlign = "center";
    newlabel.style.paddingBottom = "3%";
    newlabel.style.color = "#525456";
    newlabel.style.margin = "0";

    return;
  } else {
    for (var i = 0; i < labelsArray.length; i++) {
      var newlabel = document.createElement("p");
      div.appendChild(newlabel);
      // newlabel.style.backgroundColor = "lightgray";
      newlabel.innerHTML = "#" + labelsArray[i];
      newlabel.style.textAlign = "left";
      newlabel.style.fontStyle = "italic";
      newlabel.style.paddingRight = "15%";
      newlabel.style.color = "#525456";
    }
  }
}

function addElement (div,userPhoto, docID, docData, didCreate, status) {
  // window.alert(screen.width);
 //console.log("Challenge Id:::",docID);
 console.log("User photo: ", userPhoto);
 console.log("Doc Id: ", docID);
 console.log("doc Data", docData);
 console.log("Did create ", didCreate);
  var newFavorite, newRepost;

  // create a new div element
  var newDiv = document.createElement("div");
  newDiv.id = docID;
  newDiv.className = "questions";
  // newDiv.classList.add("rounded");
  newDiv.classList.add("shadow-sm");
  newDiv.style.marginTop = "4%";


  // create a new element
  var newAnswer = document.createElement("h3");
  var newPlay = document.createElement("i");
  var newPhoto = document.createElement("img");
  var newAudioLevel = document.createElement("img");
  newFavorite = document.createElement("img");
  newRepost = document.createElement("img");
  newPhoto = document.createElement("img");
  // var rowDiv = document.createElement("div");
  var contentDiv = document.createElement("div");
  var labelDiv = document.createElement("div");

  // newDiv.appendChild(rowDiv);
  // rowDiv.className = "row";

  newDiv.appendChild(contentDiv);


  // rowDiv.appendChild(contentDiv);
  // contentDiv.className = "col-lg-9";
  // contentDiv.style.border = "3px solid black";

  // newDiv.appendChild(labelDiv);
  // labelDiv.className = "col-lg-10";
  // labelDiv.classList.add("labels-area");
  // labelDiv.style.display = "flex";
  // labelDiv.style.flexDirection = "row";
  // // labelDiv.style.border = "3px solid red";
  // labelDiv.style.marginLeft = "16%";
  // labelDiv.style.marginTop = "2%";
  // labelDiv.style.padding = "0";
  // labelDiv.style.overflowX = "scroll";

  // add each image node to the newly created div
  // contentDiv.appendChild(newAnswer);
  // newAnswer.className = "test-head";
  // newAnswer.innerHTML = docID;

  // contentDiv.appendChild(newPhotoParent);
  // newPhotoParent.setAttribute("href", console.log("CLICKING"));

  contentDiv.appendChild(newPhoto);
  newPhoto.className = "challengePhotos rounded-circle shadow";
  newPhoto.src = userPhoto;
  newPhoto.setAttribute("aria-label","challenge creator's profile photo");
  newPhoto.setAttribute("onclick","showProfile('"+newDiv.id+"')");

  contentDiv.appendChild(newPlay);
  newPlay.className = "fas fa-play";
  newPlay.style.color = "#537EA6";
  newPlay.style.marginLeft = "5%";
  newPlay.style.height = "4%";
  newPlay.style.width = "4%";
  newPlay.style.marginTop = "1%";
  newPlay.style.paddingTop = "0.5%";
  newPlay.setAttribute("onclick","playChallenge('" + docID + "')");
  newPlay.setAttribute("aria-label","play a challenge");

  contentDiv.appendChild(newAudioLevel);
  newAudioLevel.className = "audio-levels";
  newAudioLevel.src = "images/fake_audio_level.png";
  newAudioLevel.setAttribute("aria-label","audio levels");

  contentDiv.appendChild(newFavorite);
  newFavorite.className = "favorite-button";

  if(status)
    newFavorite.src = "images/Favorite.png";
  else
    newFavorite.src = "images/unFavorite.png";

  newFavorite.style.transitionProperty = "src";
  newFavorite.style.transitionDuration = "0.5s";
  newFavorite.setAttribute("onclick","likeChallenge('" + docID + "')");
  newFavorite.setAttribute("aria-label","like/unlike a challenge");

  // contentDiv.appendChild(newRepost);
  // newRepost.className = "repost-button";
  // newRepost.src = "images/repostFalse.png";
  // newRepost.setAttribute("aria-label","repost a challenge");



  if(didCreate == true) {

    //add trash icon
    var newDelete = document.createElement("i");
    contentDiv.appendChild(newDelete);
    newDelete.className = "fas fa-trash fa-2x";
    var concatString = "deleteChallenge('"+ newDiv.id+"')";
    newDelete.setAttribute("onclick",concatString+"");
    newDelete.setAttribute("aria-label","delete your challenge");
    newDelete.style.color = "red";
    newDelete.style.paddingTop = "3%";
    // newDiv.style.width = "33%";

    newDelete.classList.add("delete-button");

    //add edit icon
    var newEdit = document.createElement("i");
    contentDiv.appendChild(newEdit);
    newEdit.className = "fas fa-pencil-alt fa-2x";
    newEdit.style.color = "#525456";
    // newEdit.style.float = "right";
    newEdit.style.marginLeft = "1%";
    newEdit.style.paddingTop = "3%";
    var concatString = "getEditChallengeInfo('"+ newDiv.id+"')";
    newEdit.setAttribute("onclick",concatString);
    newEdit.setAttribute("aria-label","edit a challenge");
    newEdit.classList.add("edit-button");

    // if(screen.width < 601) {
    //   newDiv.style.width = "95%";
    //   newDelete.style.marginLeft = "0";
    //   newEdit.style.float = "right";
    // } else {
    //   newDiv.style.width = "33%";
    //
    // }
}

  populateLabels(labelDiv,docData.labels);

  // add the newly created div and its content into the DOM
  var currentDiv = document.getElementById(div);
  console.log("parameter",  div);
  console.log("currentDic", currentDiv);
  currentDiv.appendChild(newDiv);
  //document.body.insertBefore(newDiv, currentDiv);

  counter++;
}

function showProfile(challengeIdentifier){
  //$("#followingProfileModal").modal("show");
  const db = firebase.firestore();
  db.collection("challenges").doc(challengeIdentifier).get().then(function(doc){
    if(doc.exists){
      var user = db.collection("users").doc(doc.data().creatorId.id);
      user.get().then(function(queryResult){
        if(queryResult.exists){
          setFollowProfileElements(queryResult);
          $("#followingProfileModal").modal("show");
        }
      }).catch(function(error) {
        console.error("Could not find challenge: ", error);
      });
    }
  }).catch(function(error) {
    console.error("Could not find challenge: ", error);
  });

}
function grabMyChallenges(){
  var userChallenges = {};
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        var reference = db.collection("users").doc(user.uid);
        var docs = db.collection("challenges").where("creatorId", "==", reference)
        .get()
        .then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            likedBy = doc.data().likedBy;
            likedByPath = [];
            var status = false;
            var j=0;
            for(j=0;j<likedBy.length;j++){
              likedByPath.push(likedBy[j].id);
            }
            if(likedByPath.includes(user.uid)) status=true;
            addElement("myChallenges-section",user.photoURL,doc.id,doc.data(), true,status);
        });
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
    }
    else{
      console.log("No user logged in");
    }
  });
}

function grabFeedChallenges(){
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var doc = db.collection("users").doc(user.uid);
      var listOfFollowing = 0;
      doc.get().then(function(doc) {
        if (doc.exists){
          listOfFollowing = doc.data().following;
          listOfFollowingPath = [];
          var i=0;
          for(i=0;i<listOfFollowing.length;i++){
            listOfFollowingPath.push(listOfFollowing[i].path);
          }
          getChallenges(listOfFollowingPath, user.uid);
          ///console.log("Arrived List: ", challengesList);

        }}).catch(function(error) {
          console.log("Error getting document:", error);});
    }
    else{
      console.log("No user logged in");
    }
  });
}
function getChallenges(listOfFollowingPath, currentUser){
  const db = firebase.firestore();
  var profileUserPhoto;
  var challengeList=[];
  var likedBy = [];
  var challenges = db.collection("challenges").orderBy("time", "desc");
  challenges.get().then(function(querySnapshot){
    querySnapshot.forEach(function(doc){
      var creator = doc.data().creatorId.path;
      var query = doc.data();
      var status = false;
      likedBy = doc.data().likedBy;
      likedByPath = [];
      var j=0;
      for(j=0;j<likedBy.length;j++){
        likedByPath.push(likedBy[j].id);
      }

      if(likedByPath.includes(currentUser)) status=true;
      if(doc.data().public){
        if(listOfFollowingPath.includes(creator)){
          var docUser = db.collection("users").doc(doc.data().creatorId.id);
          docUser.get().then(function(querySnapshot){
            if(querySnapshot.exists) {
              var completedChallenges = querySnapshot.data();
              console.log("JUMMMM INTERESTING", completedChallenges);
              var isChallengeComplete = checkifChallengeisCompleted(doc.path, completedChallenges);
              if(!isChallengeComplete)
                addElement("challenges-section",querySnapshot.data().profilePhoto,doc.id,doc.data(), false,status);
          }
          }).catch(function(error) {
                console.log("Error getting document:", error);});
        }
      }
    });
  }).catch(function(error) {
        console.log("Error getting document:", error);});

}

function checkifChallengeisCompleted(challengePath, listOfChallenges){
  var result = false;
  console.log("PATH: ",challengePath);
  console.log("LIST of CHALLENGES", listOfChallenges);
  for(var i=0;i<listOfChallenges.length;i++){
    if(listOfChallenges.get(i).path == challengePath){
      result = true;
    }
  }
  return result;
}

function follow(userToFollowIdentifier){
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var myself = db.collection("users").doc(user.uid);
      var toFollow = db.collection("users").doc(userToFollowIdentifier);
      console.log("TO FOLLOW: ", toFollow);
      myself.get().then(function(myself) {
        if (myself.exists){
          var following = myself.data().following;
          console.log("FOLLOWING ARRAY", following);
          if(following.some(value => value.id === userToFollowIdentifier)){
            var filtered = following.filter(function(value, index, arr){return value.id != userToFollowIdentifier;});
            var filteredUpdate = db.collection("users").doc(user.uid).update({
              following: filtered }).catch(function(error){console.log("Error updating document: ", error);});
            toFollow.get().then(function(toFollow){
              if(toFollow.exists){
                var followersOf = toFollow.data().followers;
                console.log("Followers: ", followersOf);
                var filteredFollowers = followersOf.filter(function(valueFollow, indexF, arrF){
                  return valueFollow.id != user.uid;});
                var followerUpdate = db.collection("users").doc(userToFollowIdentifier).update({
                  followers: filteredFollowers
                }).catch(function(error){console.log("Error updating document: ", error);});
              }
              }).catch(function(error){console.log("Error getting person to follow doc: ", error);});

              }
            else{
              console.log("PLACE AT:", following);
              following.push(toFollow); //Push to the array the person you want to follow!
              var pushUpdate = db.collection("users").doc(user.uid).update({
                following: following }).catch(function(error){console.log("Error updating document: ", error);});
              var toFollow2 = db.collection("users").doc(userToFollowIdentifier);
              toFollow2.get().then(function(doc){
                if(doc.exists){
                  var followersOf2 = doc.data().followers;
                  var myself2 = db.collection("users").doc(user.uid);
                  myself2.get().then(function(doc2){
                    if(doc2.exists){
                      followersOf2.push(myself2);
                      var pushFollowerUpdate = db.collection("users").doc(toFollow.id);
                      pushFollowerUpdate.update({
                        followers: followersOf2
                      }).catch(function(error){console.log("Error updating documentsss: ", error);});
                    }
                  }).catch(function(error){console.log("Error updating document2: ", error);});
                }
              }).catch(function(error){console.log("Error getting toFollow user: ", error);});//good
            }//close else
          }
      }).catch(function(error) {console.log("Error getting document:", error);});
    }
    else{
      console.log("No user logged in");
    }
  });
}

function deleteChallenge(challengeIdentifier){
  const db = firebase.firestore();
  db.collection("challenges").doc(challengeIdentifier).delete().then(function() {
    console.log("Document successfully deleted!");
  }).catch(function(error) {
    console.error("Error removing document: ", error);
  });
  setTimeout("location.href = 'my-challenges.html'", 500);
}

function editChallenge(challengeIdentifier){
  console.log("Challenge Identifier", challengeIdentifier);
  const db = firebase.firestore();
  db.collection("challenges").doc(challengeIdentifier).update({
    public: setPrivacy(),
    labels: getLabels()
  }).catch(function(error){console.log("Error updating document: ", error);});
    setTimeout("location.href = 'my-challenges.html'", 3000);
}


function getEditChallengeInfo(challengeIdentifier){
  const db = firebase.firestore();
  db.collection("challenges").doc(challengeIdentifier).get().then(function(doc){
    if(doc.exists){
      var options = doc.data().options;
      var labels = doc.data().labels;
      var labelString="";
      var publicStatus = doc.data().public;
      for(var answers=1;answers<=options.length;answers++){
        document.getElementById('answer_choice'+answers).value = options[answers-1];
        document.getElementById('answer_choice'+answers).readOnly = true;
        if(options[answers-1]==doc.data().answer){
          document.getElementById('radio'+answers).checked = true;
        }
        document.getElementById('radio'+answers).disabled = true;
      }
      for(var currLabel=0; currLabel<labels.length; currLabel++){
        if(currLabel==0){labelString = labelString+labels[currLabel];}
        else{labelString = labelString + ','+ labels[currLabel];}
      }
      document.getElementById('labels').value =labelString;
      if (!publicStatus) {
        document.getElementById('privacySetting').innerHTML = 'Private';
        document.getElementById('privacyFilter').checked = true;
      }
      else{
        document.getElementById('privacySetting').innerHTML = 'Public';
        document.getElementById('privacyFilter').checked = false;
      }
      document.getElementById('challengeId').innerHTML=challengeIdentifier;
      $("#editChallengeModal").modal("show");
    }
  }).catch(function(error) {
    console.error("Could not find challenge: ", error);
  });
}

function likeChallenge(challengeIdentifier){
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var doc = db.collection("challenges").doc(challengeIdentifier);
      doc.get().then(function(doc){
        var doc2 = db.collection("users").doc(user.uid);
        doc2.get().then(function(doc2){
          var likedChallenge = doc2.data().likedChallenges;
          var likedby = doc.data().likedBy;
          if (likedChallenge.some(value => value.id === doc.id)) { //unlike
            var challengeUnlikeBtn = document.getElementById(challengeIdentifier).childNodes[0].childNodes[4];
            challengeUnlikeBtn.src = "images/unFavorite.png";
            var filtered = likedChallenge.filter(function(value, index, arr){
              return value.id != doc.id;});
              var filteredLikedBy = likedby.filter(function(value, index, arr){
                return value.id != user.uid;});
              console.log("FILTERED LIKED BY: ", filteredLikedBy);
            var doc3 = db.collection("users").doc(user.uid).update({
              likedChallenges: filtered
            }).catch(function(error){console.log("Error updating document: ", error);});
            var docLike = db.collection("challenges").doc(challengeIdentifier).update({
              likedBy: filteredLikedBy
            }).catch(function(error){console.log("Error updating document: ", error);});
          }else{//push the like
            var challengeLikeBtn = document.getElementById(challengeIdentifier).childNodes[0].childNodes[4];
            challengeLikeBtn.src = "images/Favorite.png";
            var doc5 = db.collection("challenges").doc(challengeIdentifier);
            doc5.get().then(function(doc){
              likedChallenge.push(doc5);
              var doc4 = db.collection("users").doc(user.uid);
              likedby.push(doc4);
              doc4.update({
                likedChallenges: likedChallenge
              }).catch(function(error){console.log("Error updating documents: ", error);});

              var docLike2 = db.collection("challenges").doc(challengeIdentifier).update({
                likedBy: likedby
              }).catch(function(error){console.log("Error getting documents: ", error);});
            }).catch(function(error){console.log("Error getting documents: ", error);});
          } //CLOSES ELSE
        }).catch(function(error){console.log("Error getting documents: ", error);});//CLOSES DOC 2 QUERY
    }).catch(function(error){console.log("Error getting documents: ", error);});//CLOSES DOC QUERY
  } //CLOSES IF USER EXISTS
}); //CLOSES ON AUTH
}

//TASKS DELETE FROM LIKEDBY IN CHALLENGES
function getLikedChallenges(){
  const db = firebase.firestore();
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      var doc = db.collection("users").doc(user.uid);
      doc.get().then(function(doc) {
        if (doc.exists){
          //make inside query that gets each challenge
          var likedChallenges = doc.data().likedChallenges;
          likedChallenges.forEach(challengesLikedSearch);
        }}).catch(function(error) {
          console.log("Error getting document:", error);});
    }
    else{
      console.log("No user logged in");
    }
  });
}

function challengesLikedSearch(value){
  const db1 = firebase.firestore();
  var challenges = db1.collection("challenges").doc(value.id);
  challenges.get().then(function(challenges){
    if(challenges.data().public){
      var creator = db1.collection("users").doc(challenges.data().creatorId.id);
      creator.get().then(function(creator){
        if(creator.exists){
          addElement("myChallenges-section",creator.data().profilePhoto,challenges.id,challenges.data(), false,true);
        }
      }).catch(function(error) {console.log("Error getting document:", error);});
    }
    //addElement("challenges-section",images/Favorite.png,challenges.id,challenges.data(), false,true);
  }).catch(function(error) {console.log("Error getting document:", error);});
}


function searchUsingEnter(e) {
  searchBar_value = document.getElementById('search');
  document.getElementById('resultsItem').innerHTML = "";


  searchLabel(searchBar_value.value);
  searchEmail(searchBar_value.value);
  console.log("INPUT");

}

function addSearchResult(id) {
  var newResult = document.createElement("p");
  var currentDiv = document.getElementById('resultsItem');

  if ($('#resultsItem').height() >= 300) {
    currentDiv.style.height = $('#resultsItem').height() + 'px';
    currentDiv.style.overflowY = "scroll";
  } else {
    currentDiv.style.height = "auto";
  }

  newResult.innerHTML = id;
  newResult.style.paddingLeft = "20px";
  currentDiv.appendChild(newResult);
}

function searchLabel(labelEntered){
  const db = firebase.firestore();
  db.collection("challenges").get()
  .then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      var labels = doc.data().labels;
      for(var i=0;i<labels.length;i++){
        if(labels[i].toLowerCase().indexOf(labelEntered.toLowerCase())>=0){
        //  console.log("INDICE: ", labels[i].indexOf(labelEntered));
            console.log("\nChallenge\n",doc.id, " => ", doc.data());
            addSearchResult("Challenge: " + doc.id);
        }
      }
  });}).catch(function(error) {
      console.log("Error getting documents: ", error);
  });
}

function searchEmail(emailEntered){
  const db = firebase.firestore();
  db.collection("users").get()
  .then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      var labels = doc.data().email;
        if(labels.toLowerCase().indexOf(emailEntered.toLowerCase())>=0){
          //console.log("INDICE: ", labels.indexOf(emailEntered));
            console.log("\nUsers\n",doc.id, " => ", doc.data());
            addSearchResult("User: " + doc.id);
        }

  });}).catch(function(error) {
      console.log("Error getting documents: ", error);
  });
}


// function searchEmail(emailEntered){
//   const db = firebase.firestore();
//   db.collection("users").where("email", "==", emailEntered).get()
//   .then(function(querySnapshot) {
//     querySnapshot.forEach(function(doc) {
//     console.log(doc.id, " => ", doc.data());
//   });}).catch(function(error) {
//       console.log("Error getting documents: ", error);
//   });
// }

function setPrivacy() {
  var publicStatus = true;
  if (document.getElementById('privacyFilter').checked) {
    publicStatus = false;
    document.getElementById('privacySetting').innerHTML = 'Private';
  } else {
    publicStatus = true;
    document.getElementById('privacySetting').innerHTML = 'Public';
  }
  return publicStatus;
}

function getChallengeData(audioBlob) {
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

      postChallenge(answer,challengeLabels,option1,option2,option3,option4, audioBlob, setPrivacy());
    }
  }
}

function getLabels(){
  //get labels
  var labels = document.getElementById('labels').value;
  console.log("LABELS", labels);
  var challengeLabels = [""];
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
  return challengeLabels;
}

function postChallenge(answer,label, option_1,option_2,option_3,option_4, audioBlob, publicStatus) {

  const db = firebase.firestore();
  $("#postChallengeModal").modal("show");

  //add challenge to firebase
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
     //location.replace('feed.html');
     console.log("User is signed in.")
     // Add a new document with a generated id.
     db.collection("challenges").add({
        answer: answer,
        creatorId: firebase.firestore().doc('/users/'+user.uid),
        labels: label,
        options: [option_1, option_2, option_3, option_4],
        // isAudioStored : storeBlobInStorage(),
        likedBy: [],
        time: firebase.firestore.FieldValue.serverTimestamp(),
        public: publicStatus
      })
      .then(function(docRef) {
        console.log("Document written with ID: ", docRef.id);
        console.log( storeBlobInStorage(docRef.id, audioBlob) );
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

   $("#postModal").click(function(){
     console.log(typeof blob);
     getChallengeData(blob);
   });

    var blob = audio.audioBlob;
    console.log(typeof blob);

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


function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}


function storeBlobInStorage(challengeID, blob){
    // Create a root reference
  var storageRef = firebase.storage().ref();

  // Create a reference to 'recordings/challengeID'

  // var pathToBlob = "recordings/" + challengeID;
  var recordingsChallengeIDRef = storageRef.child('recordings/' + challengeID);

  console.log(typeof blob);

  recordingsChallengeIDRef.put(blob).then(function(snapshot) {
    console.log('Uploaded a blob or file!');
    //return true;
  })
  .catch(function(error){
    console.log(error);
    //return false;
  });

}

function getURLFromStorage(challengeID){
  return new Promise(async (resolve) => {
    var storageRef = firebase.storage().ref();
    // Create a reference to 'recordings/challengeID'
    var recordingsChallengeIDRef = storageRef.child('recordings/' + challengeID);

    var returnURL = "not defined";

    returnURL = await recordingsChallengeIDRef.getDownloadURL();
    // `url` is the download URL for 'images/stars.jpg'

    console.log(returnURL);

    resolve(returnURL);
  });

  // return returnURL;
}
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
