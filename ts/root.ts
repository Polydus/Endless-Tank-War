/// <reference path="lib/typings/phaser.d.ts"/>

/*

 ENDLESS TANK WAR

 theme:
 "It's a feature, not a bug!"


 ideas:
 play as a tank, use cannon for movement
 top down graphics
 little free open world w/enemies. Maybe some buildings
 some powerups
 tiled map
 see how far this idea goes



 general game progression concept.

 Player is thrown into the game as a tank with cpu tanks.
 Player can get health by running over men
 player can kill enemy tanks and/or get hurt by them


 improvement ideas

 easy to implement & most effective

regenerate map



BUGS

controls don't always work
sometimes the player becomes invincible, probably a coll bounds issue



21 09 DEV PROGRESS:

mouse input fixed, sound/music as well
123 buttons added
there is still a bug with keyboard input in chrome. STILL Not sure why that happens!
keyboard events don't fire when canvas is focused in chrome. They do fire before that.
Also, the game never freeze because of this. That was related to the visibility change flag.

 


 */

var _ = undefined;

var config = {
    debug: false,
    debugColl: false,
    musicVolume: 0.2,
    soundBoost: 0.2,
    playMusic: false,    
    playSound: false,
    kongregate: false
};

var strings = {
    version: 'v 1.0.1'
}

var scores = {
    highestScore: 0
}

var res = {
    width: 800,
    height: 450,
    scale: 1
};

var font = {
    medThin : {font: "24px kenvector_future_thin", fill: "#ffffff"},
    medThinAlt : {font: "24px kenvector_future_thin", fill: "#424242"},
    smallThin : {font: "16px kenvector_future_thin", fill: "#ffffff"},
    smallThinAlt : {font: "16px kenvector_future_thin", fill: "#424242"}
};

function initApi(){
    if(config.kongregate){
        kongregateAPI.loadAPI(function(){
            window.kongregate = kongregateAPI.getAPI();
          });
    }
}

function uploadStats(score){
    if(config.kongregate){
        try{
            kongregate.stats.submit('High Score', score);
        } catch(e){
            console.log('err: stat upload failed!');
            console.log(e);
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumberWithZeroes(number: number, amount: number){
    if(amount === 0){
        return;
    }
    var numberLength = number.toString().length;
    if(numberLength < amount){
        var result = '';
        for(var i = 0; i < (amount - numberLength); i++){
            result += '0';
        }
        return result + number;
    } else {
        return number;
    }
}

function shadeColor(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return '#'+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

window.onload = () => {
    initApi();
    
    var main = main || new Main();
};
