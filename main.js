var provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().signInWithPopup(provider).then(function(result){
    //  The Google WebFont Loader will look for this object, so create it before loading the script.
    WebFontConfig = {
    
        //  'active' means all requested fonts have finished loading
        //  We set a 1 second delay before calling 'createText'.
        //  For some reason if we don't the browser cannot render the text the first time it's created.
    
        //  The Google Fonts we want to load (specify as many as you like in the array)
        google: {
          families: ['Passion One', 'Oxygen']
        }
    
    };
    var data = {
        players: []
    };
    var database = firebase.database();
    var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'game', Phaser.AUTO);
    var connectState = function(){};
    connectState.prototype = {
        preload: function(){
            game.load.image("atkinson", "./Atkeensang.png");
            game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
        },
        create: function(){
            game.stage.backgroundColor = 0xf4a460;
            game.servers;
            console.log(result.user);
            database.ref('/').once('value').then(function(dat){
                var data = dat.val();
                game.servers = data;
                var roomCode;
                function generateRoom(){
                    roomCode = "";
                    for(var i = 0; i < 5; i++){
                        roomCode += String.fromCharCode(Math.floor(Math.random() * (90-65)) + 65);
                    }
                    if(game.servers !== null){
                    for(var server in game.servers){
                        if(server === roomCode){
                            return generateRoom();
                        } else {
                            return roomCode;
                        }
                    }
                    } else {
                        return roomCode;
                    }
                }
                var statusText = game.add.text(game.width/2, game.height/2, "Please wait, creating game...", {
                    fill: "#ffffff",
                    font: "35px Oxygen"
                });
                statusText.anchor.setTo(0.5);
                game.code = generateRoom();
                statusText.text = "Use this code to join:";
                var codeText = game.add.text(game.width/2, game.height/2 + 35, game.code, {
                    fill: "#ffffff",
                    font: "35px Oxygen"
                });
                codeText.anchor.setTo(0.5);
                var players = [];
                players["ignore"] = {
                    ignore: "Ignore me"
                };
                database.ref('/' + game.code).set({
                    code: game.code,
                    statuses: {
                        invites: true,
                        question: false,
                        voting: false
                    },
                    players: players
                });
                database.ref('/' + game.code).onDisconnect().remove();
                game.serverData = {
                    code: game.code,
                    statuses: {
                        invites: true,
                        question: false,
                        voting: false
                    },
                    players: ""
                };
                var playersText = game.add.text(40, 40, "Players in the game:" + game.serverData.players, {
                    fill: "#ffffff",
                    font: "35px Oxygen"
                });
                playersText.wordWrap = true;
                playersText.wordWrapWidth = game.width;
                database.ref('/' + game.code).on('value', function(dat){
                    var data = dat.val();
                    console.log(data);
                    game.serverData = data;
                    var playerList = "";
                    if(game.serverData.players !== null && game.serverData.players !== undefined){
                        if(Object.keys(game.serverData.players).length > 1){
                            if(game.serverData.players.ignore !== null){
                                database.ref('/' + game.code + '/players/ignore/').remove();
                            }
                        } else if (Object.keys(game.serverData.players).length <= 1){
                            if(game.serverData.players.ignore === null){
                                database.ref('/' + game.code + '/players/ignore/').set({
                                    ignore: "Please ignore"
                                });
                            }
                        }
                    } else {
                        database.ref('/' + game.code + '/players/ignore/').set({
                            ignore: "Please ignore"
                        });
                    }
                    var totalPlayers = 0;
                    console.log(game.serverData.players);
                    var playersLength = Object.keys(game.serverData.players).length;
                    for(var p in game.serverData.players){
                        playersLength -= 1;
                        console.log(p);
                        var player = game.serverData.players[p];
                        if(game.serverData.players.ignore === null || game.serverData.players.ignore === undefined){
                            playersLength -= 1;
                        }
                        console.log(game.serverData.players);
                        if(p !== "ignore" && p !== "undefined"){
                            
                            var endingChar = (playersLength > 0)? "," : ".";
                            playerList += player.name + endingChar;
                            totalPlayers += 1;
                            data.players[player.uid] = {
                                name: player.name,
                                color: player.color,
                                score: 0
                            };
                        }
                    }
                    playersText.text = "Players in the game: " + playerList;
                    console.log(totalPlayers);
                    if(totalPlayers >= 10){
                        database.ref('/' + game.code + "/statuses/invites/").set(false);
                    }
                    if(totalPlayers >= 1){
                        game.button = game.add.button(game.width/2, game.height/2 + 80, "atkinson", function(){
                            database.ref('/' + game.code).off('value');
                            game.state.start('playState');
                        });
                        game.button.anchor.setTo(0.5);
                    } else if (totalPlayers <= 0){
                        if(game.button !== undefined){
                            game.button.destroy();
                        }
                    }
                });
                codeText.anchor.setTo(0.5);
            });
        },
        update: function(){}
    };
    game.state.add('connectState', connectState);
    var playState = function(){};
    playState.prototype = {
        preload: function(){
            game.load.json("questions","./questions.json");
            game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
            var graphics = game.add.graphics();
            graphics.beginFill(0x000000);
            graphics.drawRect(0, 0, 300, 50);
            game.responseGraphic = graphics.generateTexture();
            graphics.destroy();
            graphics = game.add.graphics();
            graphics.beginFill(0x000000);
            graphics.drawRect(0, 0, game.width/4, game.height/8);
            game.responseGraphicLarge = graphics.generateTexture();
            graphics.destroy();
        },
        create: function(){
            game.stage.backgroundColor = 0xf4a460;
            var totalPlayers;
            database.ref('/' + game.code).on('value', function(dat){
                var data = dat.val();
                game.serverData = data;
                totalPlayers = Object.keys(game.serverData.players).length;
                if(game.serverData.statuses.question === true){
                    // var playerSubmitted = true;
                    // if(Object.keys(game.serverData.players).length < game.serverData.responses.length){
                    //     playerSubmitted = false;
                    // }
                    // if(game.serverData.responses !== null && game.serverData.responses !== undefined){
                    //     var verify = true;
                    //     for(var item in game.serverData.responses){
                    //         if(game.serverData.responses[item] === game.jsonObj.answer){
                    //             verify = false;
                    //         }
                    //     }
                    //     if(verify){
                    //         database.ref('/' + game.code + '/responses/').push(game.jsonObj.answer);
                    //         database.ref('/' + game.code + '/responses/').push(game.jsonObj.fakeAnswer);
                    //     }
                    // }
                    // if(playerSubmitted === true){
                    //     displayAnswer();
                    //     window.clearInterval(game.interval);
                    // }
                    var playerSubmitted = true;
                    for(var player in game.serverData.players){
                        var p = game.serverData.players[player];
                        if(p.response === game.jsonObj.answer && p.isAnswer !== true){
                            database.ref('/' + game.code + '/players/' + player + '/isAnswer/').set(true);
                        } else if(p.isAnswer !== true) {
                            database.ref('/' + game.code + '/players/' + player + '/isAnswer/').set(false);
                        }
                    }
                    for(var player in game.serverData.players){
                        console.log((game.serverData.players[player].response === null || game.serverData.players[player].response === undefined) || game.serverData.players[player].response === game.jsonObj.answer);
                        console.log(game.serverData.players[player]);
                        if((game.serverData.players[player].response === null || game.serverData.players[player].response === undefined) || game.serverData.players[player].response === game.jsonObj.answer){
                            playerSubmitted = false;
                        }
                    }
                    if(playerSubmitted === true){
                        displayAnswer();
                        window.clearInterval(game.interval);
                    }
                }
                if(game.serverData.statuses.voting === true){
                    var playerSubmitted = true;
                    for(var player in game.serverData.players){
                        if(game.serverData.players[player].submission === undefined){
                            playerSubmitted = false;
                        }
                    }
                    if(playerSubmitted === true){
                        
                        getResults();
                        window.clearInterval(game.interval);
                    }
                }
            });
            var json = game.cache.getJSON('questions');
            var questionText = game.add.text(game.width/2, game.height/2, "", {
                fill: "#ffffff",
                font: "35px Oxygen"
            });
            var statusText = game.add.text(game.width/2, game.height/2 + 35, "", {
                fill: "#ffffff",
                font: "35px Oxygen"
            });
            statusText.anchor.setTo(0.5);
            questionText.anchor.setTo(0.5);
            var time = 45000;
            function getScores(){
                var playersC = [];
                var totalCount = 0;
                for(var i = 0; i < Math.round(data.players.length/2); i++){
                    var playersR = [];
                    for(var j = 0; j < 2; j++){
                        playersR.push(data.players[totalCount]);
                        totalCount += 1;
                    }
                    playersC.push(playersR);
                }
                playersC.forEach(function(playerR, indexH){
                    playerR.forEach(function(player, indexW){
                        var sprite = game.add.sprite((game.width/(game.serverData.players.length + 1)) * (indexW + 1), (game.height/(game.serverData.players.length + 1)) * (indexH + 1), game.responseGraphic);
                        var text = game.add.text(0, 0, player.name + ": " + player.score, {
                            
                        });
                        sprite.anchor.setTo(0.5);
                    });
                });
            }
            function getResults(){
                var responseArr = [];
                database.ref('/' + game.code + "/statuses/voting").set(false);
                statusText.text = "Time to see what you voted for!";
                game.responses.forEach(function(responseR){
                    responseR.forEach(function(response){
                        responseArr.push(response.children[0]);
                        response.destroy();
                    });
                });
                var playerArr = [];
                for(var player in game.serverData.players){
                    playerArr.push(game.serverData.players[player]);
                }
                var queue = [];
                var previousResponses = [];
                //TODO: Have each response contain no creator, and instead read each player's response to check if they're the creator.
                responseArr.forEach(function(response){
                    var playersSubmitted = [];
                    var creator = "Us";
                    playerArr.forEach(function(player){
                        if(player.submission === response && response !== game.jsonObj.answer){
                            playersSubmitted.push({uid: player.uid, name: player.name});
                        }
                        if(player.response === response){
                            creator = player.name;
                        }
                    });
                    previousResponses.forEach(function(rspn){
                        if(rspn !== response){
                            if(playersSubmitted.length > 0){
                                queue.push({
                                    players: playersSubmitted,
                                    creator: creator,
                                    text: response
                                });
                            }
                            previousResponses.push(rspn);
                        } else {
                            queue.forEach(function(item){
                                if(item.text === rspn){
                                    var crt = item.creator;
                                    queue.creator = [crt, creator];
                                }
                            });
                        }
                    });
                });
                var rightPlayers = [];
                playerArr.forEach(function(player){
                    if(player.submission === game.jsonObj.answer){
                        rightPlayers.push({name: player.name, uid: player.uid});
                    }
                });
                queue.push({
                    players: rightPlayers,
                    creator: "Us",
                    text: game.jsonObj.answer
                });
                queue.reverse();
                var index = 0;
                function getSubmission(){
                    if(!(index >= queue.length)){
                        var sprite = game.add.sprite(game.width/2, game.height/2, game.responseGraphicLarge);
                        sprite.anchor.setTo(0.5);
                        var text = game.add.text(0, 0, queue[index].text.toUpperCase(), {
                            fill: "#ffffff",
                            font: "35px Passion One"
                        });
                        text.anchor.setTo(0.5);
                        statusText.text = "Let's see who voted for this...";
                        console.log(game.serverData.players);
                        console.log(data);
                        window.setTimeout(function(){
                            var textResponses = [];
                            var totalCount = 0;
                            for(var i = 0; i < Math.ceil(queue[index].players.length/4); i++){
                                var textResponsesJ = [];
                                for(var j = 0; j < 4; j++){
                                    if(totalCount < queue[index].players.length){
                                        textResponsesJ.push(queue[index].players[totalCount]);
                                    }
                                    totalCount += 1;
                                }
                                textResponses.push(textResponsesJ);
                            }
                            console.log(textResponses);
                            totalCount = 0;
                            var pText = [];
                            textResponses.forEach(function(textResponseR, indexH){
                                textResponseR.forEach(function(textResponse, indexW){
                                    console.log(game.serverData.players);
                                    console.log(queue[index].players[totalCount]);
                                    var text = game.add.text(game.width/(textResponseR.length + 1) * (indexW + 1), (game.height/(textResponses.length + 1) * (indexH + 1)) + game.height/4, queue[index].players[totalCount].name, {
                                        fill: game.serverData.players[queue[index].players[totalCount].uid].color,
                                        font: "35px Oxygen"
                                    });
                                    text.anchor.setTo(0.5);
                                    pText.push(text);
                                    totalCount += 1;
                                });
                            });
                            window.setTimeout(function(){
                                var pointGain = 0;
                                statusText.y = game.height/2 - 35 - game.height/4;
                                if(!Array.isArray(queue[index].creator)){
                                    if(queue[index].creator !== "Us"){
                                        statusText.fill = game.serverData.players[queue[index].creator].color;
                                        statusText.text = queue[index].creator  + "'s lie!";
                                        pointGain = 100;
                                    } else if (queue[index].creator === "Us" && queue[index].text === game.jsonObj.answer){
                                        statusText.text = "THE TRUTH!";
                                        pointGain = 1000;
                                    } else {
                                        statusText.text = "Our lie!";
                                        pointGain = -100;
                                    }
                                } else {
                                    var finalText = "";
                                    queue[index].creator.forEach(function(creator, indx){
                                        finalText += queue[index].creator + (indx === queue[index].creator.length)? ",":".";
                                    });
                                    statusText.fill = game.serverData.players[queue[index].creator].color;
                                    statusText.text = queue[index].creator  + "'s lie!";
                                    pointGain = 100;
                                }
                                
                                var players = [];
                                pText.forEach(function(text) {
                                    players.push(text.text);
                                    text.text = pointGain;
                                });
                                window.setTimeout(function(){
                                    if(queue[index].creator === "Us" && queue[index].text === game.jsonObj.answer){
                                        players.forEach(function(player){
                                            console.log(data.players);
                                            data.players[player] = (game.serverData.players[player].score + pointGain);
                                        });
                                    } else if (queue[index].creator === "Us" && queue[index].text === game.jsonObj.fakeAnswer){
                                        players.forEach(function(player){
                                            data.players[player] = (game.serverData.players[player].score + pointGain);
                                        });
                                    } else {
                                        var totalScore = 0;
                                        players.forEach(function(player){
                                            totalScore += pointGain;
                                        });
                                        data.players[queue[index].creator] = (game.serverData.players[queue[index].creator].score + totalScore);
                                    }
                                    sprite.destroy();
                                    text.destroy();
                                    pText.forEach(function(text){
                                        text.destroy();
                                    });
                                    statusText.text = "";
                                    index += 1;
                                    getSubmission();
                                }, 2000);
                            }, 2000);
                        }, 1000);
                        sprite.addChild(text);
                    } else {
                        getScores();
                    }
                }
                getSubmission();
            }
            function displayAnswer(){
                database.ref('/' + game.code + '/statuses/question/').set(false);
                for(var player in game.serverData.players){
                    var p = game.serverData.players[player];
                    database.ref('/' + game.code + '/responses/').push(p.response);
                }
                database.ref('/' + game.code + '/responses/').push(game.jsonObj.answer);
                database.ref('/' + game.code + '/responses/').push(game.jsonObj.fakeAnswer);
                database.ref('/' + game.code + '/answers/answer').set(game.jsonObj.answer);
                database.ref('/' + game.code + '/answers/fakeAnswer').set(game.jsonObj.fakeAnswer);
                var playerResponses = [];
                for(var response in game.serverData.responses){
                    playerResponses.push(game.serverData.responses[response]);
                }
                console.log(playerResponses);
                //Alphabets:
                playerResponses.sort();
                console.log(playerResponses);
                window.setTimeout(function(){
                    statusText.y = 50;
                    statusText.text = "";
                    questionText.text = "";
                    var responses = [];
                    var totalCount = 0;
                    var seenBefore = false;
                    var previousSubmissions = [];
                    for(var i = 0; i < Math.round(playerResponses.length/4); i++){
                        var responsesJ = [];
                        for(var j = 0; j < 4; j++){
                            if(totalCount < playerResponses.length){
                                console.log(playerResponses[totalCount]);
                                if(playerResponses[totalCount] !== game.jsonObj.answer){
                                    previousSubmissions.forEach(function(response){
                                        if(response !== playerResponses[totalCount]){
                                            responsesJ.push(playerResponses[totalCount]);
                                            previousSubmissions.push(playerResponses[totalCount]);
                                        }
                                    });
                                } else if(playerResponses[totalCount] === game.jsonObj.answer && seenBefore === true) {
                                    responsesJ.push("Angry Stork");
                                    for(var rspn in game.serverData.responses){
                                        var response = game.serverData.responses[rspn];
                                        if(response === game.jsonObj.answer){
                                            firebase.database().ref('/' + game.code + '/responses/' + response).set("Angry Stork");
                                        }
                                    }
                                } else if (playerResponses[totalCount] === game.jsonObj.answer){
                                    seenBefore = true;
                                    responsesJ.push(playerResponses[totalCount]);
                                }
                            }
                            totalCount += 1;
                        }
                        responses.push(responsesJ);
                    }
                    responses.forEach(function(responseR, indexH){
                        responseR.forEach(function(response, index){
                            var sprite = game.add.sprite((game.width/(responseR.length + 1)) * (index + 1), (game.height/(responses.length + 1)) * (indexH + 1), game.responseGraphic);
                            sprite.anchor.setTo(0.5)
                            var text = game.add.text(0, 0, response.toUpperCase(), {
                                fill: "#ffffff",
                                font: "35px Passion One"
                            });
                            var size = 35;
                            function scaleDown(){
                                if(text.width > 300){
                                    size -= 1;
                                    text.fontSize = size + "px";
                                    scaleDown();
                                }
                            }
                            scaleDown();
                            text.anchor.setTo(0.5);
                            sprite.addChild(text);
                            responseR[index] = sprite;
                            database.ref('/' + game.code + "/statuses/voting/").set(true);
                        });
                    });
                    statusText.text = game.jsonObj.question + "\n You have: " + time/1000 + " seconds.";
                    game.responses = responses;
                    game.interval = window.setInterval(function(){
                        time -= 1000;
                        statusText.text = game.jsonObj.question + "\n You have: " + time/1000 + " seconds.";
                        if(time <= 0){
                            time = 45000;
                            window.clearInterval(game.interval);
                            statusText.text = "Time's up!";
                            getResults();
                        }
                    }, 1000);
                    console.log(statusText.width);
                }, 2000);
            }
            function displayQuestion(questionObj){
                game.jsonObj = questionObj;
                database.ref('/' + game.code + '/statuses/question/').set(true);
                questionText.text = questionObj.question;
                console.log(statusText);
                statusText.text = "You have: " + time/1000 + " seconds.";
                game.interval = window.setInterval(function(){
                    time -= 1000;
                    statusText.text = "You have: " + time/1000 + " seconds.";
                    if(time === 0){
                        time = 45000;
                        window.clearInterval(game.interval);
                        statusText.text = "Time's up!";
                        displayAnswer();
                    }
                }, 1000);
            }
            function getQuestion(){
                var randomQuestion = Math.floor(Math.random() * json.questions.length);
                statusText.y = game.height/2 + 35;
                console.log(Math.floor(Math.random() * json.questions.length));
                displayQuestion(json.questions[randomQuestion]);
            }
            getQuestion();
        },
        update: function(){}
    };
    game.state.add('playState', playState);
    game.state.start('connectState');
});