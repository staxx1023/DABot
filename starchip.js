const Discord = require('discord.js');
var glicko2 = require('glicko2');
const client = new Discord.Client();
var os = require("os");
var fs = require('fs');
var path = require("path");

//I admit I copy pasted this from the glicko2 github and my understanding of the math in this system is limited so I dont want to change it.
var settings = {
  // tau : "Reasonable choices are between 0.3 and 1.2, though the system should
  //      be tested to decide which value results in greatest predictive accuracy."
  tau: 0.5,
  // rating : default rating
  rating: 1500,
  //rd : Default rating deviation 
  //     small number = good confidence on the rating accuracy
  rd: 200,
  //vol : Default volatility (expected fluctation on the player rating)
  vol: 0.06
};
var ranking = new glicko2.Glicko2(settings);

//map for storing challenges
var challengeList = new Map();

//startup
client.on('ready', () => {
  console.log('I am ready!');
});

client.on('message', message => {
  try {
    var args = message.content.split(' ');
    //Check if its from a pm so as to not crash on some functions
    if (message.channel instanceof Discord.TextChannel) {
      if (message.content.startsWithIgnoreCase('!defeated')) {
        //This command takes the challenge and adds it to the map with another user and the bet you want
        //They are supposed to respond with !confirm @user so that way people cant steal others chips
        if (args.length == 3) {
          var userID = trimMention(args[1]);
          if (typeof message.author != "undefined" && userID != message.author.id) {
            challengeList.delete(message.author);
            var userChallenge = { user: userID, bet: parseInt(args[2]) };
            challengeList.set(message.author.id, userChallenge);
            message.channel.send(args[1] + ', ' + message.author + ' is claiming to have defeated you with a bet of ' + parseInt(args[2]) + '.');
          }
          else {
            if (typeof message.author == "undefined") {
              console.log('undefined');
              console.log('undefined or equals name');
            }
          }
        }
        else {
          message.reply('Error: wrong number of arguments. !challenge <@user> <bet>');
        }
      }
      else if (message.content.startsWithIgnoreCase('!chips')) {
        //Used for checking how many chips someone has
        if (args.length == 1) {
          //Used for checking your own chips
          if (fs.existsSync('users/' + message.author.id)) {
            message.reply('You have ' + fs.readFileSync('users/' + message.author.id) + ' starchips.');
          }
          else {
            message.reply('You have 10 starchips.');
          }
        }
        else {
          //Used for checking someone elses
          var userID = trimMention(args[1]);
          if (fs.existsSync('users/' + userID)) {
            message.reply('They have ' + fs.readFileSync('users/' + userID) + ' starchips.');
          }
          else {
            message.reply('They have 10 starchips.');
          }
        }
      }
      else if (message.content.startsWithIgnoreCase('!set')) {
        //Sets the mentioned chips to the second argument
        if (typeof message.guild.roles.find("name", "botcommander") != "undefined" && message.member.roles.has(message.guild.roles.find("name", "botcommander").id)) {
          //Checks to make sure the user has the role 'botcommander'
          if (args.length == 3 && typeof parseInt(args[2]) == 'number') {
            var userID = trimMention(args[1]);
            if (fs.existsSync('users/' + userID)) {
              starChips = parseInt(fs.readFileSync('users/' + userID, 'utf8'));
              fs.unlinkSync('users/' + userID);
            }
            fs.appendFileSync('users/' + userID, parseInt(args[2]));
            message.reply(args[1] + ' now has ' + parseInt(args[2]) + ' starchips.');
          }
          else {
            message.reply('Error: wrong number of arguments, ! <@user> <number>.');
          }
        }
        else {
          message.reply('This command requires the role: "botcommander."');
        }
      }
      else if (message.content.startsWithIgnoreCase('!leaderboard')) {
        //Gets the map ready to sort
        var starChipList = new Map();
        var files = fs.readdirSync('users/');
        files.forEach(function (file) {
          starChipList.set(file, parseInt(fs.readFileSync('users/' + file)));
        });
        //attempt at bubble sort.\
        var keys = Array.from(starChipList.keys());
        console.log(starChipList.size);
        console.log(keys.length);
        for (var i = keys.length - 1; i >= 0; i--) {
          for (var j = 1; j <= i; j++) {
            //Changed > to < to make it descending
            if (starChipList.get(keys[j - 1]) < starChipList.get(keys[j])) {
              var temp = keys[j - 1];
              keys[j - 1] = keys[j];
              keys[j] = temp;
            }
          }
        }
        var toPrint = '';
        //Find the top 5 users from my now sorted list
        for (var i = 0; i < keys.length || i > 4; i++) {
          if (typeof client.users.get(keys[i]) != "undefined") {
            var tmpToPrint = toPrint;
            //Add them to the toPrint so its basically a string builder.
            toPrint = tmpToPrint + '\n' + client.users.get(keys[i]).username + ' ' + starChipList.get(keys[i]);
          }
        }
        message.channel.send(toPrint);
      }
      else if (message.content.startsWithIgnoreCase('!topelo')) {
        //This currently reads all the players ratings and prints the top 5 highest ones.(very ineffcient I know)
        //Most of this should just be copy pasted from !leaderboard so if theres a issue look to that
        var starChipList = new Map();
        var files = fs.readdirSync('elos/');
        console.log(files);
        files.forEach(function (file) {
          console.log(file);
          starChipList.set(file, parseInt(fs.readFileSync('elos/' + file)));
        });
        //attempt at bubble sort.
        var keys = Array.from(starChipList.keys());
        console.log(starChipList.size);
        console.log(keys.length);
        for (var i = keys.length - 1; i >= 0; i--) {
          for (var j = 1; j <= i; j++) {
            //Changed > to < to make it descending
            if (starChipList.get(keys[j - 1]) < starChipList.get(keys[j])) {
              var temp = keys[j - 1];
              keys[j - 1] = keys[j];
              keys[j] = temp;
            }
          }
        }
        //Select the top five users
        var toPrint = '';
        for (var i = 0; i < keys.length || i > 4; i++) {
          if (typeof client.users.get(keys[i]) != "undefined") {
            var tmpToPrint = toPrint;
            toPrint = tmpToPrint + '\n' + client.users.get(keys[i]).username + ' ' + starChipList.get(keys[i]);
          }
        }
        message.channel.send(toPrint);
      }
      else if (message.content.startsWithIgnoreCase('!confirm')) {
        if (args.length == 2) {
          //Getting info on the users
          var challengeID = trimMention(args[1]);
          var acceptedChallenge = challengeList.get(challengeID);
          //Makes sure that info is real
          if (typeof acceptedChallenge != 'undefined' &&
            typeof acceptedChallenge.user != 'undefined' &&
            typeof acceptedChallenge.bet != 'undefined') {
            if (acceptedChallenge.user == message.author.id) {
              //Sets default values
              var userID = trimMention(args[1]);
              var loserStarChips = 10;
              var giveBonus = 1;
              if (fs.existsSync('users/' + message.author.id)) {
                loserStarChips = parseInt(fs.readFileSync('users/' + message.author.id, 'utf8'));
                fs.unlinkSync('users/' + message.author.id);
              }
              //So I was having a Concurency problem so I did this but now I am coming to realise that =- woulda worked I think but shhhhhhhh
              var tmpLoserStarChips = loserStarChips;
              loserStarChips = tmpLoserStarChips - acceptedChallenge.bet;
              //Checks to make sure they can foot the bill(the bet)
              if (loserStarChips < 0) {
                message.reply('error: below zero chips');
                fs.appendFileSync('users/' + message.author.id, tmpLoserStarChips);
                challengeList.delete(userID);
              }
              else {
                fs.appendFileSync('users/' + message.author.id, loserStarChips);
                //Default starchips
                var starChips = 10;
                if (fs.existsSync('users/' + userID)) {
                  starChips = parseInt(fs.readFileSync('users/' + userID, 'utf8'));
                  fs.unlinkSync('users/' + userID);
                  //This is suppose to give a bonus if at 0 and both players are even if the bet is 0 but iirc doesnt work.
                  //Currently I think it just gives the bonus if the bet is over 1 but doesnt give any at all if the bet 0.
                  if (acceptedChallenge.bet == 0 && starChips != 0 || loserStarChips != 0) {
                    giveBonus = 0;
                  }
                  else {
                    giveBonus = 1;
                  }
                }
                //Same thing with concurency problems here
                var tmpStarChips = starChips;
                starChips = tmpStarChips + acceptedChallenge.bet + giveBonus;

                //Updates files
                message.channel.send(args[1] + " new starchip total is: " + starChips);
                fs.appendFileSync('users/' + userID, starChips);
                fs.appendFileSync('history', '' + userID + ' ' + message.author.id + ' ' + acceptedChallenge.bet + os.EOL);
                challengeList.delete(userID);

                //Function for updating rating
                updateRating(userID, message.author.id);

              }
            }
            else {
              console.log('player confirming doesnt match needed.');
            }
          }
          else {
            console.log('somethings undefined dog ' + acceptedChallenge);
          }
        }
        else {
          message.reply('Error: wrong number of arguments. !confirm <@user>');
        }
      }
      else if (message.content.startsWithIgnoreCase('!retry')) {
        //Tells the user until how long they can test again
        var date = new Date();
        //61 hours, 1 minute, 1 second and 1 milisecond
        var nextTest = 219661001;
        if (args.length > 1) {
          //So this one is to find when another user can test
          var userID = trimMention(args[1]);
          var time = 0;
          if (fs.existsSync('tests/' + userID)) {
            time = parseInt(fs.readFileSync('tests/' + userID));
          }
          if (time + nextTest < date.getTime()) {
            message.reply('That user can currently test.');
          }
          else {
            message.reply('That user can\'t test for another ' + Math.round(((time + nextTest) - date.getTime()) / 3600000) + ' hours.');
          }
        }
        else {
          //Assumed if no user stated they want to check themself
          var userID = message.author.id;
          var time = 0;
          if (fs.existsSync('tests/' + userID)) {
            time = parseInt(fs.readFileSync('tests/' + userID));
          }
          if (time + nextTest < date.getTime()) {
            message.reply('You can currently test.');
          }
          else {
            message.reply('You can\'t test for another ' + Math.round(((time + nextTest) - date.getTime()) / 3600000) + ' hours.');
          }
        }
      }
      else if (message.content.startsWithIgnoreCase('!tested')) {
        //So this command saves the unix time to the players tests/ file
        var date = new Date();
        if (typeof message.guild.roles.find("name", "botcommander") != "undefined" && message.member.roles.has(message.guild.roles.find("name", "botcommander").id)) {
          //Makes sure the player has the role botcommander
          if (args.length > 1) {
            var userID = trimMention(args[1]);
            if (fs.existsSync('tests/' + userID)) {
              fs.unlinkSync('tests/' + userID);
              console.log('deleteing file...')
            }
            else {
              console.log('file doesnt exist.')
            }
            fs.appendFileSync('tests/' + userID, date.getTime());
            if (args.length == 3) {
              //Feature added at a later date that takes the third argument and adds it to there starchips.
              var toAdd = parseInt(args[2]);
              var starChips = 10;
              if (fs.existsSync('users/' + userID)) {
                starChips = parseInt(fs.readFileSync('users/' + userID, 'utf8'));
                fs.unlinkSync('users/' + userID);
              }
              fs.appendFileSync('users/' + userID, starChips + toAdd);
            }
            message.reply('The user has been tested');
          }
        }
        else {
          message.reply('This command requires the role: "botcommander."');
        }
      }
      else if (message.content.startsWithIgnoreCase('!detest')) {
        //Finds and deletes the users file on when they last tested so they can test again
        //lolololooloolololololololololo I DETEST @USER!!!!!
        if (typeof message.guild.roles.find("name", "botcommander") != "undefined" && message.member.roles.has(message.guild.roles.find("name", "botcommander").id)) {
          if (args.length > 1) {
            var userID = trimMention(args[1]);
            if (fs.existsSync('tests/' + userID)) {
              fs.unlinkSync('tests/' + userID);
              console.log('deleteing file...')
            }
            message.reply("That user can test again.")
          }
        }
        else {
          message.reply('This command requires the role: "botcommander."');
        }
      }
      else if (message.content.startsWithIgnoreCase('!eloregen')) {
        //Regenerates all the players rating based of the history file 'history'
        //Very ineffcient, dont use unless you need to.
        if (typeof message.guild.roles.find("name", "botcommander") != "undefined" && message.member.roles.has(message.guild.roles.find("name", "botcommander").id)) {
          var elos = new Map();
          if (fs.existsSync('history')) {
            var contents = fs.readFileSync('history', 'utf8');
            var lines = contents.split(/\r?\n/);
            console.log(lines.length);
            lines.forEach(function (line) {
              var args = line.split(' ');
              console.log(args.length);
              if (args.length >= 2 && args[0] != args[1]) {
                var p1ID = args[0];
                var p2ID = args[1];
                //Default fallback vars
                var p1ELO = 1500;
                var p2ELO = 1500;
                var p1RD = 200;
                var p2RD = 200;
                var p1V = 0.06;
                var p2V = 0.06;
                //Okay so this took me awhile to understand but whats happening is I am looping throught the history file and going through all the matches 1by1
                //So instead of writing them all to the file after each of the games I make it slightly more effcient by just using a map to store the values for a bit a bit
                if (elos.has(p1ID)) {
                  p1ELO = elos.get(p1ID).elo;
                  p1RD = elos.get(p1ID).rd;
                  p1V = elos.get(p1ID).v;
                }
                if (elos.has(p2ID)) {
                  p2ELO = elos.get(p2ID).elo;
                  p2RD = elos.get(p2ID).rd;
                  p2V = elos.get(p2ID).v;
                }
                //Use Glicko2 for math
                var p1match = ranking.makePlayer(p1ELO, p1RD, p1V);
                var p2match = ranking.makePlayer(p2ELO, p2RD, p2V);
                var matches = [];
                matches.push([p1match, p2match, 1]);
                ranking.updateRatings(matches);
                //Add them back to the map I was talking about earlier for temporary storage
                elos.set(p1ID, { elo: p1match.getRating(), rd: p1match.getRd(), v: p1match.getVol() });
                elos.set(p2ID, { elo: p2match.getRating(), rd: p2match.getRd(), v: p2match.getVol() });
              }
            });
          }
          else {
            console.log('no history file');
          }
          if (fs.existsSync('elo')) {
            fs.unlinkSync('elo');
          }
          //Loop through the keys and rewrite all the files with the new values
          var keys = Array.from(elos.keys());
          keys.forEach(function (key) {
            if (typeof client.users.get(key) != "undefined") {
              if (fs.existsSync('elos/' + key)) {
                fs.unlinkSync('elos/' + key);
              }
              if (fs.existsSync('vs/' + key)) {
                fs.unlinkSync('vs/' + key);
              }
              if (fs.existsSync('rds/' + key)) {
                fs.unlinkSync('rds/' + key);
              }
              //Saving all the data to text files, very effcient.
              fs.appendFileSync('elos/' + key, elos.get(key).elo);
              fs.appendFileSync('rds/' + key, elos.get(key).rd);
              fs.appendFileSync('vs/' + key, elos.get(key).v);
              //Now this is a general file that stores all the elo values but its never really used
              fs.appendFileSync('elo', client.users.get(key).username + ' ' + elos.get(key) + os.EOL);
            }
          });
        }
      }
      else if (message.content.startsWithIgnoreCase('!elo')) {
        if (args.length == 1) {
          if (fs.existsSync('elos/' + message.author.id)) {
            message.reply('You have ' + Math.round(fs.readFileSync('elos/' + message.author.id)) + ' ELO.');
          }
          else {
            message.reply('You have 1500 ELO.')
          }
        }
        else {
          var userID = trimMention(args[1]);
          if (fs.existsSync('elos/' + userID)) {
            message.reply('They have ' + Math.round(fs.readFileSync('elos/' + userID)) + ' ELO.');
          }
          else {
            message.reply('They have 1500 ELO.')
          }
        }
      }
      else if (message.content.startsWithIgnoreCase('!commands')) {
        //DM them a list of the commands with syntax.
        message.reply('DMing you a reply.');
        message.author.send('!defeated <@user> <number>. Claim to have won a duel vs @user with the number as a bet.\n!confirm <@user>. Confirms @users claims to have defeated you.\n!chips [@user]. Tells you how many chips @user has, if no @user checks how many chips you have.\n!leaderboard [number]. Shows you the top x players, where is the number.\n!retry Tells you how long until you can test again.\n!tested <@user> Botcommanders only, marks that you test the <@user>\n!set <@user> <number>. Admins only. Sets @users chips to x, where x is the number.\n!elo [@user]. Checks the Elo of yourself or the named user.\n!topelo. Checks the players with the highest Elo.');
      }
    }
  }
  catch (err) {
    //Fallback try/catch so the bot doesnt crash over 1 error
    console.log(err);
    message.reply('ERROR');
    fs.appendFileSync('errors', '\n ERROR: ' + err);
  }
});

function trimMention(mention) {
  //Example mention is <!@2998729381293>. Want to grab the ID from the center there.
  var userID = mention.replace('@', '');
  userID = userID.replace('<', '');
  userID = userID.replace('!', '');
  userID = userID.replace('>', '');
  return userID;
}

function updateRating(winner, loser) {

  var p1ID = winner;
  var p2ID = loser;
  //Set default vars for in the case when the files dont exist
  var p1ELO = 1500;
  var p2ELO = 1500;
  var p1RD = 200;
  var p2RD = 200;
  var p1V = 0.06;
  var p2V = 0.06;
  //Try to override the files above with data from files
  if (fs.existsSync('elos/' + p1ID)) {
    p1ELO = parseInt(fs.readFileSync('elos/' + p1ID));
    fs.unlinkSync('elos/' + p1ID);
  }
  if (fs.existsSync('elos/' + p2ID)) {
    p2ELO = parseInt(fs.readFileSync('elos/' + p2ID));
    fs.unlinkSync('elos/' + p2ID);
  }
  if (fs.existsSync('rds/' + p1ID)) {
    p1RD = parseInt(fs.readFileSync('rds/' + p1ID));
    fs.unlinkSync('rds/' + p1ID);
  }
  if (fs.existsSync('rds/' + p2ID)) {
    p2RD = parseInt(fs.readFileSync('rds/' + p2ID));
    fs.unlinkSync('rds/' + p2ID);
  }
  if (fs.existsSync('vs/' + p1ID)) {
    p1V = parseInt(fs.readFileSync('vs/' + p1ID));
    fs.unlinkSync('vs/' + p1ID);
  }
  if (fs.existsSync('vs/' + p2ID)) {
    p2V = parseInt(fs.readFileSync('vs/' + p2ID));
    fs.unlinkSync('vs/' + p2ID);
  }
  //Use glicko2 libary for math because its easier.
  var p1match = ranking.makePlayer(p1ELO, p1RD, p1V);
  var p2match = ranking.makePlayer(p2ELO, p2RD, p2V);
  var matches = [];
  matches.push([p1match, p2match, 1]);
  ranking.updateRatings(matches);
  //Record all the data to files
  fs.appendFileSync('elos/' + p1ID, p1match.getRating());
  fs.appendFileSync('elos/' + p2ID, p2match.getRating());
  fs.appendFileSync('rds/' + p1ID, p1match.getRd());
  fs.appendFileSync('rds/' + p2ID, p2match.getRd());
  fs.appendFileSync('vs/' + p1ID, p1match.getVol());
  fs.appendFileSync('vs/' + p2ID, p2match.getVol());

}

//This logs us into the bot itself so make sure this stays private
client.login('');