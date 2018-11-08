console.log("App loaded");
var counter = 1;


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
  if ((user && currentPageName() === "feed.html") || (user && currentPageName() == "my-challenges.html")) {
    setProfileElements(user);
    listenToEventsOnFeed();
  }
  else if ((!user && currentPageName() === "feed.html") || (!user && currentPageName() === "my-challenges.html")) {
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
function playChallenge(challengeIdentifier) {
  const db = firebase.firestore();
  var doc = db.collection("challenges").doc(challengeIdentifier);
  doc.get().then(function(doc){
    if(doc.exists){
      var creatorId =  doc.data().creatorId.id;
      listOfOptions =  doc.data().options;
      var doc2 = db.collection("users").doc(creatorId);
      doc2.get().then(function(doc){
        if(doc.exists){
          creator_fname = doc.data().firstname;

          document.getElementById('playChallengeModalLabel').innerHTML = creator_fname + "\'s Challenge";
          document.getElementById('playChallengeModalLabel').style.letterSpacing = "3px";
          document.getElementById('playChallengeModalLabel').style.marginLeft = "30%";
          for(var i=0;i<listOfOptions.length;i++){
            document.getElementsByClassName('form-control playchallengeAnswers')[i].value = listOfOptions[i];
          }
        }
      })
    }
  }).catch(function(error) {
      console.log("Error getting document:", error);
    });
    $("#playChallengeModal").modal("show");



  //-----------------------------------------------------------------------------------
  //Get challenge answers and other doc info from firebase from the challengeIdentifier
  //-----------------------------------------------------------------------------------


}

function checkAnswers() {
  //an answer is not selected as the correct answer
  if(!(document.getElementById('answer_radio1').checked || document.getElementById('answer_radio2').checked
  || document.getElementById('answer_radio3').checked || document.getElementById('answer_radio4').checked)) {
    document.getElementById('challengeFooter').style.marginTop = "0";
    document.getElementById('noAnswerAlert').style.display = "block";
  } else {
    document.getElementById('noAnswerAlert').style.display = "none";
  }
}

function anonymousFAQ() {
  $("#anonfaqModal").modal("show");
}

function setProfileElements(user){

  document.getElementById('profilePage_Name').innerHTML = user.displayName;
  document.getElementById('profilePage_Email').innerHTML = user.email;
  document.getElementById('profilePage_Photo').setAttribute("src",user.photoURL);

  document.getElementById('user_Name').innerHTML = user.displayName;
  document.getElementById('user_Email').innerHTML = user.email;
  document.getElementById('user_Photo').setAttribute("src",user.photoURL);


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
    newlabel.innerHTML = "No Labels";
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
      newlabel.style.paddingRight = "17%";
      newlabel.style.color = "#525456";
    }
  }
}

function addElement (div,userPhoto, docID, docData, didCreate, status) {
 //console.log("Challenge Id:::",docID);
  var newFavorite, newRepost;

  // create a new div element
  var newDiv = document.createElement("div");
  newDiv.id = docID;
  newDiv.className = "questions";
  newDiv.classList.add("rounded");
  newDiv.classList.add("shadow");
  newDiv.style.marginTop = "3%";


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

  newDiv.appendChild(labelDiv);
  labelDiv.className = "col-lg-3";
  labelDiv.classList.add("labels-area");
  labelDiv.style.display = "flex";
  labelDiv.style.flexDirection = "row";
  // labelDiv.style.border = "3px solid red";
  labelDiv.style.marginLeft = "16%";
  labelDiv.style.marginTop = "2%";
  labelDiv.style.padding = "0";
  // labelDiv.style.width = "inherit";

  // add each image node to the newly created div
  // contentDiv.appendChild(newAnswer);
  // newAnswer.className = "test-head";
  // newAnswer.innerHTML = docID;

  contentDiv.appendChild(newPhoto);
  newPhoto.className = "rounded-circle shadow";
  // newPhoto.src = user.photoURL;
  newPhoto.src = userPhoto;

  contentDiv.appendChild(newPlay);
  newPlay.className = "fas fa-play";
  newPlay.style.color = "#537EA6";
  newPlay.style.marginLeft = "5%";
  newPlay.style.height = "30px";
  newPlay.style.width = "30px";
  newPlay.style.marginTop = "1%";
  newPlay.style.paddingTop = "0.5%";
  newPlay.setAttribute("onclick","playChallenge('" + docID + "')");

  contentDiv.appendChild(newAudioLevel);
  newAudioLevel.className = "audio-levels";
  newAudioLevel.src = "images/fake_audio_level.png";

  contentDiv.appendChild(newFavorite);
  newFavorite.className = "favorite-button";

  if(status)
    newFavorite.src = "images/Favorite.png";
  else
    newFavorite.src = "images/unFavorite.png";

  newFavorite.setAttribute("onclick","likeChallenge('" + docID + "')");

  contentDiv.appendChild(newRepost);
  newRepost.className = "repost-button";
  newRepost.src = "images/repostFalse.png";
  // newRepost.setAttribute("onclick","repostChallenge()");



  if(didCreate == true) {
    var newDelete = document.createElement("img");
    contentDiv.appendChild(newDelete);
    newDelete.className = "delete-button";
    newDelete.src = "images/delete.png";
    var concatString = "deleteChallenge('"+ newDiv.id+"')";
    newDelete.setAttribute("onclick",concatString+"");
    newDiv.style.width = "60%";
  }

  populateLabels(labelDiv,docData.labels);

  // add the newly created div and its content into the DOM
  var currentDiv = document.getElementById(div);
  currentDiv.appendChild(newDiv);
  //document.body.insertBefore(newDiv, currentDiv);

  counter++;
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
          console.log(doc.id, " => ", doc.data());
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
      if(listOfFollowingPath.includes(creator)){
        var docUser = db.collection("users").doc(doc.data().creatorId.id);
        docUser.get().then(function(querySnapshot){
          if(querySnapshot.exists) {
            addElement("challenges-section",querySnapshot.data().profilePhoto,doc.id,doc.data(), false,status);
        }
        }).catch(function(error) {
              console.log("Error getting document:", error);});
      }
    });
  }).catch(function(error) {
        console.log("Error getting document:", error);});

}
//
// function getChallenges(value){
//   console.log("Uder im following: ",value.id);
//   const db = firebase.firestore();
//   firebase.auth().onAuthStateChanged(function(user) {
//     //console.log("GARRET: ", user);
//     if (user) {
//         var doc = db.collection("challenges").where("creatorId", "==", value)
//         .get()
//         .then(function(querySnapshot) {
//           querySnapshot.forEach(function(doc) {
//             console.log("Challenge::",doc.id, " => ", doc.data());
//           // doc.data() is never undefined for query doc snapshotsn
//           var profileUserPhoto = null;
//           var doc2 = db.collection("users").doc(value.id).get()
//           .then(function(doc2){
//             if(doc2.exists){
//               profileUserPhoto = doc2.data().profilePhoto;
//               addElement("challenges-section",profileUserPhoto,doc.id,doc.data(), false);
//               console.log(doc2.data().profilePhoto);
//             }
//             else{
//               console.log("User not found");
//             }
//           }).catch(function(error) {
//                 console.log("Error getting document:", error);});
//
//           // console.log(doc.id, " => ", doc.data());
//           // addElement("challenges-section",profileUserPhoto,doc.id,doc.data(), false);
//         });
//     })
//     .catch(function(error) {
//         console.log("Error getting documents: ", error);
//     });
//     }
//     else{
//       console.log("No user logged in");
//     }
//   });
// }
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
            var challengeUnlikeBtn = document.getElementById(challengeIdentifier).childNodes[0].childNodes[3];
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
            var challengeLikeBtn = document.getElementById(challengeIdentifier).childNodes[0].childNodes[3];
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
    console.log("Challenges", challenges.data());
  }).catch(function(error) {console.log("Error getting document:", error);});
}

function searchLabel(labelEntered){
  const db = firebase.firestore();
  db.collection("challenges").where("labels", "array-contains", labelEntered).get()
  .then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
    console.log(doc.id, " => ", doc.data());
  });}).catch(function(error) {
      console.log("Error getting documents: ", error);
  });
}
function searchEmail(emailEntered){
  const db = firebase.firestore();
  db.collection("users").where("email", "==", emailEntered).get()
  .then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
    console.log(doc.id, " => ", doc.data());
  });}).catch(function(error) {
      console.log("Error getting documents: ", error);
  });
}

function getChallengeData(audioString) {
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

      postChallenge(answer,challengeLabels,option1,option2,option3,option4,audioString);
    }
  }
}

function postChallenge(answer,label, option_1,option_2,option_3,option_4,audioString) {

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
        creatorId: firebase.firestore().doc('/users/'+user.uid),
        labels: label,
        options: [option_1, option_2, option_3, option_4],
        audio : audioString,
        likedBy: [],
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
    var blob = audio.audioBlob

   const reader = new FileReader();
   // This fires after the blob has been read/loaded.
   reader.addEventListener('loadend', (e) => {
     const text = e.srcElement.result;
     console.log(text);
     $("#postModal").click(function(){
       getChallengeData(text);
     });
   });
   // Start reading the blob as text.
   reader.readAsText(blob);
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
