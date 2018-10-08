

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

  // When the authorization state changes
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      window.location.replace('dummy_profile_page.html');

    } else {
        // Not sure what happens when the user is not signed in
    }
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

  // When the authorization state changes
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      window.location.replace('dummy_profile_page.html');

    } else {
        // Not sure what happens when the user is not signed in
    }
  });
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider).then(function(result) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;

    // When the authorization state changes
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        window.location.replace('dummy_profile_page.html');

      } else {
          // Not sure what happens when the user is not signed in
      }
    });
    // ...
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // The email of the user's account used.
    var email = error.email;
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential;
    // ...
  });


}

  // //Add login event
  // loginBtn.addEventListener('click', e => {
  //   const auth = firebase.auth();
  //   //Sign in
  //   const promise = auth.signInWithEmailAndPassword(loginEmail,loginPassword);
  //
  //   promise.catch(e => console.log(e.message));
  // });
  //
  // //Add create account event
  // createBtn.addEventListener('click', e => {
  //   const auth = firebase.auth();
  //   //Sign in
  //   const promise = auth.createUserWithEmailAndPassword(createEmail,createPassword);
  //
  //   promise.catch(e => console.log(e.message));
  //
  // });
  //
  // //Sign out
  // logoutBtn.addEventListener('click', e => {
  //   firebase.auth().signOut();
  // });
  //
  //
  // //Add a realtime listener
  // firebase.auth().onAuthStateChanged(firebaseUser => {
  //   if(firebaseUser) {
  //     console.log(firebaseUser);
  //     window.location = 'signin_success.html';
  //   } else {
  //     console.log('Not logged in');
  //   }
  // });




  //
  // document.addEventListener("DOMContentLoaded", event => {
  //   const app = firebase.app();
  //   console.log(app);
  // });
  //
