'use strict';
window.onload = function(){
    document.getElementById("bottom").onclick = function(){
        window.open("./bug.html");
    };
    //FIX: Everything that doesn't need to be seen by the player is on the host's computer
    var local = firebase;
    local.auth().signInAnonymously().catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // ...
    });
    local.auth().onAuthStateChanged(function(user) {
        console.log(user);
        if (user) {
            // User is signed in.
            var isAnonymous = user.isAnonymous;
            var uid = user.uid;
            // ...
            function padZero(str, len) {
                len = len || 2;
                var zeros = new Array(len).join('0');
                return (zeros + str).slice(-len);
            }
            function getRandomColor() {
              var colors = ["#54C64E", "#3B968F", "#4D60A6", "#6A4CA7", "#C26C9B", "#F09086", "#F0EC86", "#27D7D0"];
              //var textColors = ["#1C8A16", "#116963", "#1E3074", "#372167", "#7A1E50", "#973025", "#979225", "#008580"];
              var random = Math.floor(Math.random() * colors.length);
              var color = {
                  color: colors[random]
              };
              return color;
            }
            var color = getRandomColor();
            document.body.style.backgroundColor = color.color;
            document.getElementById("statusText").style.color = "#ffffff";
            var statusText = document.getElementById("statusText");
            document.getElementById("name").onkeydown = function(e){
                var key = window.event.keyCode;
                console.log(e);
                if(key === 190 || key === 191 || key === 220 || key === 188){
                    e.preventDefault();
                }
            };
            document.getElementById("submit").onclick = function(){
                var database = local.database();
                var code = document.getElementById("code").value;
                var name = document.getElementById("name").value;
                document.getElementById("form").innerHTML = "";
                statusText.innerHTML = "Hey! Wait for a prompt...";
                var serverData;
                database.ref('/' + code + '/statuses/').once('value').then(function(dat){
                    var data = dat.val();
                    serverData = data;
                    if(data.invites === true){
                        var player = {
                            name: name,
                            color: color.color,
                            uid: uid
                        };
                        database.ref('/' + code + '/players/' + uid).set(player);
                    } else {
                        window.alert("Sorry, too many players have joined. Disconnecting...");
                        location.reload();
                    }
                });
                var responding = false;
                var response;
                var responded = false;
                function getResponse(){
                    statusText.innerHTML = "";
                    responding = true;
                    document.getElementById("form").innerHTML = "<span style=\"color: white;\">Answer the prompt:</span> <input id=\"answer\" maxlength=\"30\"/> <button id=\"submit\">Submit</button>";
                    document.getElementById("answer").onkeydown = function(e){
                        var key = window.event.keyCode;
                        console.log(e);
                        if(key === 190 || key === 191 || key === 220){
                            e.preventDefault();
                        }
                    };
                    document.getElementById("submit").onclick = function(){
                        response = document.getElementById("answer").value;
                        database.ref('/' + code + '/statuses/').once('value').then(function(dat){
                            var data = dat.val();
                            database.ref('/' + code + '/players/' + uid + '/response/').set(response);
                            document.getElementById("form").innerHTML = "";
                        });
                    };
                }
                console.log(name);
                console.log('/' + code + '/players/' + uid)
                database.ref('/' + code + '/players/' + uid).on('value', function(dat){
                    var data = dat.val();
                    console.log(data);
                    if(data.isAnswer === true && responded === false){
                        window.alert("Please enter in something besides the correct response");
                        responded = true;
                        getResponse();
                    }
                });
                database.ref('/' + code + '/statuses/').on('value', function(dat){
                    var data = dat.val();
                    if(data === null){
                        window.alert("The host disconnected. ");
                        location.reload();
                    }
                    if(data.question === true && responding === false){
                        getResponse();
                    } else if (data.question === false){
                        responding = false;
                        responded = false;
                    }
                    if(data.voting === true && responding === false){
                        statusText.innerHTML = "Choose what you think is the correct answer!";
                        responding = true;
                        console.log(data.players);
                        database.ref('/' + code + '/responses/').once('value').then(function(dat){
                            data.responses = dat.val();
                            var totalResponses = data.responses;
                            var possibleResponses = [];
                            console.log(totalResponses);
                            for(var rspn in totalResponses){
                                if(totalResponses[rspn] && totalResponses[rspn] !== response){
                                    possibleResponses.push(totalResponses[rspn]);
                                    console.log(document.getElementById("form").innerHTML);
                                }
                            };
                            possibleResponses.sort();
                            console.log(possibleResponses);
                            possibleResponses.forEach(function(rspn, index){
                                document.getElementById("form").innerHTML += "<button class=\"chooseAnswer\" id=\"player" + index + "\">" + rspn.toUpperCase() + "</button>";
                                //For some reason, it takes time to load this, so we set a timeout.
                                window.setTimeout(function(){
                                    document.getElementById("player" + index).onclick = function(){
                                        database.ref('/' + code + '/players/' + uid + "/submission").set(rspn);
                                        document.getElementById("form").innerHTML = "";
                                    };
                                }, 500);
                            });
                        });
                    } else if (data.voting === false){
                        responding = false;
                    }
                    serverData = data;
                });
                database.ref('/' + code + '/players/' + uid).onDisconnect().remove();
            };
        } else {
        // User is signed out.
        // ...
        }
// ...
    });
};