/// <reference path="root.ts"/>
/// <reference path="ui.ts"/>
/// <reference path="game.ts"/>

class Main {

    input: Input;
    renderer: Renderer;
    soundManager: SoundManager;
    game: Game;

    phaser: Phaser.Game;

    private updateCounter = 0;
    private fps = 60;

    constructor(){
        var context = this;

        this.phaser = new Phaser.Game(
            res.width, res.height, Phaser.CANVAS, 'polydusContainer',
            {
                preload: function(){context.preload()},
                create: function(){context.create()},
                update: function(){context.update()}
            });
    }

    onPause(){
        //console.log('pause');
        this.game.pause();
        //this.phaser.input.enabled = false;
        //this.phaser.input.keyboard.enabled = false;                    
        //InputManager.enabled (game.input) 
    }

    onResume(){
        //console.log('resume');
        //this.phaser.input.enabled = true;     
        //this.phaser.input.keyboard.enabled = true;        
    }

    preload(){
        this.phaser.add.text(0, 0, "hack", {font:"1px kenvector_future_thin", fill:"#FFFFFF"});
        //this.phaser.load.crossOrigin = 'Anonymous';

        this.phaser.load.atlasJSONHash('game', 'img/game.png', 'img/game.json');
        this.phaser.load.atlasJSONHash('ui', 'img/ui/uipacks.png', 'img/ui/uipacks.json');
        //this.phaser.load.atlasJSONHash('buttons', 'img/ui/buttons.png', 'img/ui/buttons.json');
        //this.phaser.load.atlasJSONHash('icons', 'img/ui/icons.png', 'img/ui/icons.json');
        this.phaser.load.image('rankings_header_bg', 'img/ui/rankings_header_bg.png');
        this.phaser.load.image('ammo_bg', 'img/ui/ammo_bg.png');
        this.phaser.load.image('ammo_bg_selected', 'img/ui/ammo_bg_selected.png');   
        this.phaser.load.image('ui_help_content', 'img/ui/uihelpContent.png');
        
        this.phaser.load.image('glass_corner', 'img/glassCorner.png');
        this.phaser.load.image('tile_grass_dark', 'img/tile_grass_dark.png');
        
        this.phaser.load.audio('intro', 'audio/music/intro.ogg');
        this.phaser.load.audio('main', 'audio/music/main.ogg');

        this.phaser.load.audio('engine-idle', 'audio/sfx/engine-idle.ogg');
        this.phaser.load.audio('engine-full', 'audio/sfx/engine-full.ogg');

        this.phaser.load.audio('shot0', 'audio/sfx/shot0.ogg');  
        this.phaser.load.audio('shot1', 'audio/sfx/shot1.ogg');        
        this.phaser.load.audio('shot2', 'audio/sfx/shot2.ogg');        
        this.phaser.load.audio('shot3', 'audio/sfx/shot3.ogg');        
        this.phaser.load.audio('shot4', 'audio/sfx/shot4.ogg'); 

        this.phaser.load.audio('hit0', 'audio/sfx/hit0.ogg');  
        this.phaser.load.audio('hit1', 'audio/sfx/hit1.ogg');   
        
        this.phaser.load.audio('splat', 'audio/sfx/splat.ogg');     
        
        this.phaser.load.audio('crate', 'audio/sfx/crate.ogg');     
        this.phaser.load.audio('click', 'audio/sfx/click.ogg');                                      
    }

    create(){
        this.phaser.time.advancedTiming = config.debug;

        this.phaser.canvas.id = 'polydusCanvas';
        $('body').on('contextmenu', '#polydusCanvas', function(e){ return false; });
        $('#polydusCanvas').bind("wheel mousewheel", function(e) {e.preventDefault()});

        var context = this;
        $('#polydusCanvas').mouseenter(function() {
            //context.phaser.input.enabled = true;
            //context.phaser.input.keyboard.enabled = true;
            console.log(context.phaser);                                    
        });

        $('#polydusCanvas').mouseleave(function() {
            //context.phaser.input.enabled = false;
            //context.phaser.input.keyboard.enabled = false;            
            context.game.pause();    
        });
        this.phaser.stage.disableVisibilityChange = true;

        this.renderer = new Renderer(this);
        this.input = new Input(this);
        this.soundManager = new SoundManager(this);
        this.game = new Game(this);
        this.game.build();

        this.phaser.onPause.add(this.onPause, this);
        this.phaser.onResume.add(this.onResume, this);   
        
        //console.log(this.phaser.stage);
    }

    update(){
        this.input.update();
        this.game.update();

        this.updateCounter++;
        if(this.updateCounter === this.fps){
            this.updateCounter = 0;
            this.tick();
        }
    }

    tick(){
        this.game.tick();
    }

}

class Input {

    main: Main;

    private cursors;

    up = false;
    down = false;
    left = false;
    right = false;

    private mouse: SpriteView;

    mouseX;
    mouseY;

    //(line# -3) / 8
    private mouseFramePointer = 132;
    private mouseFrameCrosshair = 128;//126;

    private mouseStatus = 0;

    private STATUS_UI = 0;
    private STATUS_GAME = 1;

    private mouseWheelDirection = 0;

    private pressed1 = false;
    private pressed2 = false;
    private pressed3 = false;
    
    constructor(main){
        this.main = main;
        //if(this.main.phaser.device.desktop){
            this.cursors = this.main.phaser.input.keyboard.createCursorKeys();
        //}
        this.main.phaser.canvas.style.cursor = 'none';
        
        this.mouse = new SpriteView(999, 999, this.main, 
            main.renderer.SPRITE_SHEET_UI,
            main.renderer.SPRITE_PACK_UI_SPACE + 'cursor_pointer3D',
            main.renderer.UI_GROUP_MOUSE);
        this.mouse.element.anchor = new Phaser.Point(0.5, 0.5);
        this.mouse.setScale(1);
        this.mouse.setFixedToCamera(true);
        this.mouse.element.animations.frame = this.mouseFramePointer;

        var context = this;
        this.main.phaser.input.mouse.mouseWheelCallback = function(){
            if(context.mouseStatus === context.STATUS_GAME){
                if(context.main.phaser.input.mouse.wheelDelta === 1){
                    //forward
                    context.mouseWheelDirection = 1;
                } else if(context.main.phaser.input.mouse.wheelDelta === -1){
                    //back
                    context.mouseWheelDirection = -1;
                }
            }

        };
        
    }

    update(){
        //if(this.main.phaser.device.desktop){
        this.up = (this.cursors.up.isDown || this.main.phaser.input.keyboard.isDown(Phaser.Keyboard.W));
        this.down = (this.cursors.down.isDown || this.main.phaser.input.keyboard.isDown(Phaser.Keyboard.S));
        this.left = (this.cursors.left.isDown || this.main.phaser.input.keyboard.isDown(Phaser.Keyboard.A));
        this.right = (this.cursors.right.isDown || this.main.phaser.input.keyboard.isDown(Phaser.Keyboard.D));

        this.mouse.setPos(
            this.main.phaser.input.x,
            this.main.phaser.input.y);

        if(this.main.phaser.input.keyboard.event !== null){
            if(this.main.phaser.input.keyboard.event.type === 'keyup'){
                if(this.isKeyCode(Phaser.Keyboard.ESC) 
                    || this.isKeyCode(Phaser.Keyboard.P)){
                    this.main.game.togglePause();
                } else if(this.isKeyCode(Phaser.Keyboard.ONE)
                        || this.isKeyCode(Phaser.Keyboard.NUMPAD_1)){
                    if(this.mouseStatus === this.STATUS_GAME){
                        this.pressed1 = true;
                    }
                } else if(this.isKeyCode(Phaser.Keyboard.TWO) 
                        || this.isKeyCode(Phaser.Keyboard.NUMPAD_2)){
                    if(this.mouseStatus === this.STATUS_GAME){
                        this.pressed2 = true;
                    }
                } else if(this.isKeyCode(Phaser.Keyboard.THREE) 
                        || this.isKeyCode(Phaser.Keyboard.NUMPAD_3)){
                    if(this.mouseStatus === this.STATUS_GAME){
                        this.pressed3 = true;
                    }
                }
            }


            console.log(this.main.phaser.input.keyboard.event);
            this.main.phaser.input.keyboard.event = null;
        }
        //}
    }

    private isKeyCode(key){
        return key === this.main.phaser.input.keyboard.event.keyCode;
    }

    setMouseInGame(){
        if(this.mouseStatus !== this.STATUS_GAME){
            this.mouseStatus = this.STATUS_GAME;
            this.mouse.element.animations.frame = this.mouseFrameCrosshair;
            //this.main.phaser.canvas.style.cursor = 'none';            
        }
    }

    setMouseUI(){
        if(this.mouseStatus !== this.STATUS_UI){
            this.mouseStatus = this.STATUS_UI;
            this.mouse.element.animations.frame = this.mouseFramePointer;
            this.up = false;
            this.down = false;
            this.left = false;
            this.right = false;
            this.main.phaser.input.keyboard.reset();
            //this.main.phaser.canvas.style.cursor = 'none';            
        }
    }

    isInGame(){
        return this.mouseStatus === this.STATUS_GAME;
    }

    isInUI(){
        return this.mouseStatus === this.STATUS_UI;
    }

    justRightClickedInGame(){
        if(this.isInUI()){
            return false;
        }
        return this.main.phaser.input.activePointer.rightButton.justPressed();
    }

    justLeftClickedInGame(){
        if(this.isInUI()){
            return false;
        }
        return this.main.phaser.input.activePointer.leftButton.justPressed();
    }


    justMovedMouseWheelUp(){
        if(this.mouseWheelDirection === 1){
            this.mouseWheelDirection = 0;
            return true;
        }
        return false;
    }

    justMovedMouseWheelDown(){
        if(this.mouseWheelDirection === -1){
            this.mouseWheelDirection = 0;
            return true;
        }
        return false;
    }

    justPressed1(){
        if(this.pressed1){
            this.pressed1 = false;
            return true;
        }
        return false;
       // return this.justPressed(this.pressed1);
    }

    justPressed2(){
        if(this.pressed2){
            this.pressed2 = false;
            return true;
        }
        return false;
        //return this.justPressed(this.pressed2);
    }

    justPressed3(){
        if(this.pressed3){
            this.pressed3 = false;
            return true;
        }
        return false;
        //return this.justPressed(this.pressed3);        
    }

}

class Renderer {

    main: Main;

    private groups = [];

    GAME_BACKGROUND_GROUP; //tiles
    GAME_GROUND_GROUP;
    GAME_OBJECT_GROUP;
    GAME_VEHICLE_GROUP;
    UI_GROUP;
    UI_GROUP_SUPER;
    UI_GROUP_ULTRA;
    UI_GROUP_MOUSE;

    SPRITE_SHEET_GAME = 'game';
    SPRITE_SHEET_ICONS = 'icons';
    SPRITE_SHEET_BUTTONS = 'buttons';
    SPRITE_SHEET_UI = 'ui';

    SPRITE_PACK_TANKS = 'topdowntanks/';
    SPRITE_PACK_SHOOTER = 'topdown-shooter/';
    SPRITE_PACK_TD = 'tower-defense-top-down/';

    SPRITE_PACK_UI_RPG = 'uipack-rpg/';
    SPRITE_PACK_UI_SPACE = 'uipack-space/';
    SPRITE_PACK_UI_FIXED = 'uipack_fixed/';

    SPRITE_PACK_ICONS_EXP = 'gameicons-expansion/';
    SPRITE_PACK_ICONS = 'gameicons/';

    SPRITE_PACK_ONSCREENCONTROLS = 'onscreencontrols/';

    private spritePools: StaticSprite[] = [];    

    static STATICSPRITE_TILE_GRASS = 0;
    static STATICSPRITE_TILE_DIRT = 1;
    static STATICSPRITE_TILE_SAND = 2;

    static STATICSPRITE_MAN = 3; 
    static STATICSPRITE_CRATE = 4;    

    static STATICSPRITE_WINDOW = 5;    
    static STATICSPRITE_WINDOW_CORNER = 6;    

    static STATICSPRITE_TILE_GRASS_DARK = 7;    
    
    constructor(main){
        this.main = main;
        for(var i = 0; i < 8; i++){
            this.groups.push(this.main.phaser.add.group());
        }

        this.GAME_BACKGROUND_GROUP = this.groups[0];
        this.GAME_GROUND_GROUP = this.groups[1];
        this.GAME_OBJECT_GROUP = this.groups[2];        
        this.GAME_VEHICLE_GROUP = this.groups[3];
        this.UI_GROUP = this.groups[4];
        this.UI_GROUP_SUPER = this.groups[5];
        this.UI_GROUP_ULTRA = this.groups[6];
        this.UI_GROUP_MOUSE = this.groups[7];

        this.spritePools.push(new StaticSprite(
            this.SPRITE_SHEET_GAME, this.SPRITE_PACK_TANKS + 'Environment/grass', this));
        this.spritePools.push(new StaticSprite(
            this.SPRITE_SHEET_GAME, this.SPRITE_PACK_TANKS + 'Environment/dirt', this));
        this.spritePools.push(new StaticSprite(
            this.SPRITE_SHEET_GAME, this.SPRITE_PACK_TANKS + 'Environment/sand', this));    
            
        this.spritePools.push(new StaticSprite(
            this.SPRITE_SHEET_GAME, this.SPRITE_PACK_SHOOTER + 'Soldier 1/soldier1_gun', this));   
        this.spritePools.push(new StaticSprite(
            this.SPRITE_SHEET_GAME, this.SPRITE_PACK_SHOOTER + 'Tiles/tile_156', this));
            
        this.spritePools.push(new StaticSprite(
            this.SPRITE_SHEET_GAME, this.SPRITE_PACK_SHOOTER + 'Tiles/tile_437', this));
              
        this.spritePools.push(new StaticSprite(
            'none', 'glass_corner', this));

        this.spritePools.push(new StaticSprite(
            'none', 'tile_grass_dark', this));
    }

    startRender(key, x, y, group): SpriteView{
        return this.spritePools[key].startRender(x, y, group);
    }

    stopRender(key, val){
        this.spritePools[key].stopRender(val);
    }

    removeFromGroups(element){
        for(var i = 0; i < this.groups.length; i++){
            if(this.groups[i].children.indexOf(element) > -1){
                this.groups[i].remove(element);
                break;
            }
        }
    }

}

class StaticSprite {

    key;
    atlas;

    pool: SpriteView[] = [];
    //actives: SpriteView[] = [];
    //all: SpriteView[] = [];
    totalSize = 0;

    renderer: Renderer;

    constructor(atlas, key, renderer){
        this.key = key;
        this.atlas = atlas;
        this.renderer = renderer;
    }

    startRender(x, y, group): SpriteView{
        if(this.pool.length === 0){
            this.addSprite();
        }

        var sprite = this.pool[0];//.play(_, _, vol);
        this.pool.splice(0, 1);
       // this.actives.push(sprite);
        sprite.setPos(x, y);
        sprite.setGroup(group);
        sprite.setVisible(true);
        sprite.setAlpha(1);

        sprite.element.rotation = 0;
        
        return sprite;
    }

    stopRender(val){
        /*console.log('returning tilesprite to pool');
        console.log('act length: ' + this.actives.length 
                + ', pool: ' + this.pool.length);
        console.log(this);*/

        /*for(var i = 0; i < this.actives.length; i++){
                if(this.actives[i] === val){
                    this.actives.splice(i, 1);
                    break;
                }
        }*/
        this.pool.push(val);
        val.setVisible(false);
        //this.totalSize++;
        //console.log(this.key + ' pool: ' + this.pool.length + ', all: ' + this.totalSize);
       
    }

    addSprite(){
        this.pool.push(new SpriteView(
            0, 0, this.renderer.main, this.atlas, this.key, _));
        this.pool[this.pool.length - 1].setVisible(false);
        this.totalSize++;
        //this.all.push(this.pool[this.pool.length - 1]);
        //this.pool[this.pool.length - 1].setArrayIndex(this.all.length - 1);
    }
}

class SoundManager {

    main: Main;

    soundPools: Sound[] = [];

    static SOUND_SHOT_0 = 0;
    static SOUND_SHOT_1 = 1;
    static SOUND_SHOT_2 = 2;
    static SOUND_SHOT_3 = 3;
    static SOUND_SHOT_4 = 4;

    static SOUND_ENGINE_IDLE = 5;
    static SOUND_ENGINE_FULL = 6;

    static SOUND_SPLAT = 7;
    static SOUND_CRATE = 8;
    static SOUND_CLICK = 9;
    
    static SOUND_HIT_0 = 10;
    static SOUND_HIT_1 = 11;

    constructor(main){
        this.main = main;
        this.soundPools.push(new Sound('shot0', this));
        this.soundPools.push(new Sound('shot1', this));
        this.soundPools.push(new Sound('shot2', this));
        this.soundPools.push(new Sound('shot3', this));
        this.soundPools.push(new Sound('shot4', this));

        this.soundPools.push(new Sound('engine-idle', this));
        this.soundPools.push(new Sound('engine-full', this));

        this.soundPools.push(new Sound('splat', this));
        this.soundPools.push(new Sound('crate', this));
        this.soundPools.push(new Sound('click', this));

        this.soundPools.push(new Sound('hit0', this));
        this.soundPools.push(new Sound('hit1', this));
    }

    playSound(key, vol){
        if(config.playSound){
            this.soundPools[key].playSound(vol);            
        }
    }

    playRandShot(vol){
        if(config.playSound){
            this.soundPools[getRandomInt(0, 4)].playSound(vol);                    
        }
    }

    playRandHit(vol){
        if(config.playSound){
            this.soundPools[getRandomInt(10, 11)].playSound(vol);                    
        }
    }
}

class Sound {

    key;

    pool: Phaser.Sound[] = [];
    actives: Phaser.Sound[] = [];

    soundManager;

    constructor(key, soundManager){
        this.soundManager = soundManager;
        this.key = key;
        //this.addSound();
    }

    playSound(vol){
        if(this.pool.length === 0){
            this.addSound();
        }
        //console.log('act length: ' + this.actives.length + ', pool: ' + this.pool.length);                
        var sound = this.pool[0];//.play(_, _, vol);
        this.pool.splice(0, 1);
        this.actives.push(sound);
        sound.play(_, _, vol + config.soundBoost);
        //console.log('act length: ' + this.actives.length + ', pool: ' + this.pool.length);        
    }

    private addSound(){
        var newSound = this.soundManager.main.phaser.add.sound(this.key);
        newSound.parent = this;
        this.pool.push(newSound);

        newSound.onStop.add(function(){
                this.parent.returnToPool(this);
                }, newSound);

    }

    private returnToPool(val){
        /*console.log('returning sound to pool');
        console.log('act length: ' + this.actives.length 
                + ', pool: ' + this.pool.length);
        console.log(this);*/

        for(var i = 0; i < this.actives.length; i++){
                if(this.actives[i] === val){
                    this.actives.splice(i, 1);
                    break;
                }
        }
        this.pool.push(val);
        /*console.log('act length: ' + this.actives.length 
            + ', pool: ' + this.pool.length);*/
    }

}


