const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
      done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: "47163792352-vo9t9bc1r60mqss8j72bt9h69dimeasm.apps.googleusercontent.com",
    clientSecret: "prv7WfnRXs5sPyI_4ESwPx8t",
    callbackURL: "https://www.mccpapp.com:8080/google/callback" //https://www.mccpapp.com:8080/google/callback   //http://localhost:8080/google/callback
  },
  function(accessToken, refreshToken, profile, done) {
      return done(null, profile);
  }
));