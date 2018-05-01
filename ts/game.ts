/// <reference path="root.ts"/>
/// <reference path="ui.ts"/>
/// <reference path="main.ts"/>

class Game {

    main: Main;

    private time = 0;

    debugString;

    inGameUI: InGameUI;
    mainMenuUI: MainMenuUI;
    pauseUI: PauseUI;
    infoUI: InfoUI;
    creditUI: CreditUI;

    private world;

    state = 0;
    STATE_MAINMENU = 0;
    STATE_PAUSED = 1;
    STATE_GAME = 2;
    
    running = false;

    pickupString;

    introMusic;
    mainMusic;

    constructor(main: Main){
        this.main = main;

        this.introMusic = this.main.phaser.add.audio('intro');
        this.mainMusic = this.main.phaser.add.audio('main');
        this.introMusic.volume = config.musicVolume;
        this.mainMusic.volume = config.musicVolume;
        this.mainMusic.loop = true;
        this.introMusic.onStop.add(function(){
            if(config.playMusic){
                this.mainMusic.play();                
            }
        }, this);

        if(config.playMusic){
            this.introMusic.play();
        }
        
        if(config.debug) {
            this.debugString = new TextView(12, 136, main,
                '', font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        }

        this.pickupString = new TextView(0, 0, main,
            '',
            font.medThin, main.renderer.UI_GROUP_SUPER);

        this.world = new World(this);

        this.creditUI = new CreditUI(this.main);        
        this.inGameUI = new InGameUI(this.main, this.world.player);
        this.mainMenuUI = new MainMenuUI(this.main);
        this.pauseUI = new PauseUI(this.main);
        this.infoUI = new InfoUI(this.main);
        //this.creditUI.setVisible(false);

        //this.mainMenuUI.setVisible(true);
    }

    showPickupString(content){
        this.pickupString.setContent(content);
        this.pickupString.setCenterScreen();
    }

    build(){
        this.time = 999;
        this.world.build();
        this.mainMenuUI.setVisible(true);        
        this.inGameUI.player = this.world.player;
        //console.log('build ready');
        //this.running = true;
        this.world.player.alive = false; //to prevent engine sound :D
        this.world.update();
        this.world.tick();
        this.world.player.alive = true;        
    }

    start(){
        if(this.state !== this.STATE_GAME){
            this.time = 0;
            this.running = true;
    
            this.mainMenuUI.setVisible(false);
            this.inGameUI.setVisible(true);
            this.inGameUI.resetShellCounters();
    
            this.submitScores();
            this.world.onRestart();
            
            this.main.input.setMouseInGame();
            this.setState(this.STATE_GAME);
        }
    }

    stop(){
        if(this.state === this.STATE_GAME){
            this.running = false;
            
            this.inGameUI.setVisible(false);
            this.submitScores();
            this.mainMenuUI.setScore(this.world.player.score);
            this.mainMenuUI.setVisible(true);
            
            this.main.input.setMouseUI();
    
            //this.world.onRestart();
            this.setState(this.STATE_MAINMENU);            
        }

    }


    togglePause(){
        if(this.state === this.STATE_PAUSED){
            this.resume();
        } else if (this.state === this.STATE_GAME){
            this.pause();
        }
        this.submitScores();        
    }

    pause(){
        if(this.state === this.STATE_GAME){
            this.running = false;      
            this.inGameUI.setVisible(false);
            this.pauseUI.setScore(this.world.player.score);
            this.pauseUI.setVisible(true);  
            this.infoUI.setVisible(false);
            this.main.input.setMouseUI();            
            this.setState(this.STATE_PAUSED);         
        }
    }

    resume(){
        if(this.state === this.STATE_PAUSED){
            this.running = true;      
            this.inGameUI.setVisible(true);
            this.pauseUI.setVisible(false);  
            this.infoUI.setVisible(false);            
            this.main.input.setMouseInGame();            
            this.setState(this.STATE_GAME);         
        }
    }

    setState(state){
        this.state = state;
    }

    setSound(val){
        config.playSound = val;
        if(!val){
            this.world.player.engineIdleSound.stop();
            this.world.player.engineFullSound.stop();
        } else {
        }        
    }

    setMusic(val){
        config.playMusic = val;
        if(!val){
            this.introMusic.stop();
            this.mainMusic.stop();
        } else {
            this.introMusic.stop();
            this.mainMusic.stop();            
            this.introMusic.play();
        }
    }

    update(){
        if(this.running && this.time > 1){
            this.world.update();
            this.inGameUI.update();
        }

        if(this.pickupString.getY() > 150){
            this.pickupString.setYBy(-1);
        } else if (this.pickupString.content !== ''){
            this.pickupString.setContent('');
        }
    }

    tick(){
        if(this.running && this.time > 1){
            if(config.debug){
                this.debugString.setContent(
                    '[Mouse x:' + Math.floor(this.main.phaser.input.x)
                    + ' y: ' + Math.floor(this.main.phaser.input.y) + ']\n' +
                    '[Camera x:' + Math.floor(this.main.phaser.camera.x) + ' y: ' + Math.floor(this.main.phaser.camera.y) + ']\n' +
                    'FPS:' + this.main.phaser.time.fps
                );

            }

            this.world.tick();
            this.inGameUI.tick();
            if(this.time % 30 === 0){
                this.submitScores();                
            }
        }
        this.time++;
    }

    submitScores(){
        if(this.world.player.score > scores.highestScore){
            scores.highestScore = this.world.player.score;
        }
        uploadStats(this.world.player.score);
    }
}

class GameObject {

    world: World;
    main: Main;

    view: SpriteView;

    chunk: Chunk;
    tiles: Tile[] = []; //tiles on which this obj is on

    pixelBounds = new Phaser.Rectangle(0, 0, 0, 0);

    solid = false; //cant collide
    givesWay = false; //if true, things that collide effect the delta of this obj

    anchorCentered = false;

    avgSpeedFactor = 1;

    alive = _;

    constructor(chunk, x, y){
        this.world = chunk.world;
        this.chunk = chunk;
        this.main = this.world.game.main;
    }

    anchorCenter(){
        this.view.element.anchor = new Phaser.Point(0.5, 0.5);
        this.anchorCentered = true;
    }

    update(){

    }

    tick(){

    }

    onHit(obj){

    }

    inBounds(rect){
        return this.pixelBounds.intersects(rect, 0);
    }

    init(x, y, view){
        this.view = view;
        this.view.setPos(x, y);
        //console.log(this.view.element.width);
    }

    initBounds(x, y){
        if(this.view !== _){
            this.pixelBounds.setTo(
                x, y,
                this.view.width, this.view.height
            );
        }

        if(this.chunk.inBounds(this)){
            for(var i = 0; i < this.chunk.tiles.length; i++){
                if(this.chunk.tiles[i].canAddObj(this)){
                    this.tiles.push(this.chunk.tiles[i]);
                    this.tiles[this.tiles.length - 1].addObj(this);
                    //break;
                }
            }
        } else {
            console.log('err: cant init bounds on this chunk');
            for(var i = 0; i < this.chunk.adjacentChunks.length; i++){
                if(this.chunk.adjacentChunks[i].inBounds(this)){
                    
                    for(var j = 0; j < this.chunk.adjacentChunks[i].tiles.length; j++){
                        if(this.chunk.adjacentChunks[i].tiles[j].canAddObj(this)){
                            this.tiles.push(this.chunk.adjacentChunks[i].tiles[j]);
                            this.tiles[this.tiles.length - 1].addObj(this);
                            this.chunk = this.chunk.adjacentChunks[i];
                            //break;
                        }
                    }
                }
            }
        }



        this.checkAdjacentTiles();
    }

    removeBounds(){
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].removeObj(this);
            // console.log(this.tiles[i].pixelBounds);
        }
        this.tiles = [];
    }

    protected checkAdjacentTiles(){
        for(var i = 0; i < this.tiles.length; i++){
            if(!this.tiles[i].inBounds(this.pixelBounds)){
                this.tiles[i].removeObj(this);
                this.tiles.splice(i, 1);
                break;
            }
        }

        var toAdd = [];

        var breaking = false;

        for(var i = 0; i < this.tiles.length; i++){
            for(var j = 0; j < this.tiles[i].adjacentTiles.length; j++){
                if(this.tiles[i].adjacentTiles[j] !== _ &&
                    this.tiles[i].adjacentTiles[j].canAddObj(this)){
                    toAdd.push(this.tiles[i].adjacentTiles[j]);
                    breaking = true;
                    break;
                    //this.tiles[i].adjacentTiles[j].addObj(this);
                }
            }
            if(breaking){
                break;
            }
        }

        for(var i = 0; i < toAdd.length; i++){
            this.tiles.push(toAdd[i]);
            toAdd[i].addObj(this);
        }

        this.setSpeedFactor();

        if(toAdd.length > 0){
            //console.log(this.tiles[i]);
            //console.log(this.pixelBounds);
            //console.log(this.view);
            //console.log(this.tiles.length);
        }

    }

    /*hasDirt = false;
    hasSand = false;
    hasGrass = false;
    string = '';*/

    private setSpeedFactor(){
        this.avgSpeedFactor = 0;

        /*if(this instanceof Player){
            this.hasDirt = false;
            this.hasSand = false;
            this.hasGrass = false;
            for(var i = 0; i < this.tiles.length; i++){
                this.avgSpeedFactor += this.tiles[i].speedFactor;
                if(this.tiles[i].frame === Renderer.STATICSPRITE_TILE_DIRT){
                    this.hasDirt = true;
                } else if(this.tiles[i].frame === Renderer.STATICSPRITE_TILE_GRASS){
                    this.hasGrass = true;
                } else if(this.tiles[i].frame === Renderer.STATICSPRITE_TILE_SAND){
                    this.hasSand = true;
                }
            }
            this.string = '';
            if(this.hasDirt){
                this.string += 'dirt\n';
            }
            if(this.hasGrass){
                this.string += 'grass\n';                
            }
            if(this.hasSand){
                this.string += 'sand';                
            }
            this.world.game.inGameUI.statsString.setContent(
                this.string
            );
        } else {*/
            for(var i = 0; i < this.tiles.length; i++){
                this.avgSpeedFactor += this.tiles[i].speedFactor;
            }


        //}

        /*for(var i = 0; i < this.tiles.length; i++){
            this.avgSpeedFactor += this.tiles[i].speedFactor;
        }*/

        this.avgSpeedFactor /= this.tiles.length;        
    }

    /*
    onCantMove(){

    }

    onCollideWith(obj){
        if(obj === _){//coll with world edge

        }
    }*/

    setPos(x, y){
        if(this.anchorCentered){
            if(x < 0 + this.view.width / 2){
                x = 0 + this.view.width / 2;
                this.onHit(_);
            } else if (x > this.world.worldBounds.width - this.view.width / 2){
                x = this.world.worldBounds.width - this.view.width / 2;
                this.onHit(_);
            }
            if(y < 0 + this.view.height / 2){
                y = 0 + this.view.height / 2;
                this.onHit(_);
            } else if (y > this.world.worldBounds.height - this.view.height / 2){
                y = this.world.worldBounds.height - this.view.height / 2;
                this.onHit(_);
            }
        } else {
            if(x < 0){
                x = 0;
                this.onHit(_);
            } else if (x > this.world.worldBounds.width){
                x = this.world.worldBounds.width;
                this.onHit(_);
            }
            if(y < 0){
                y = 0;
                this.onHit(_);
            } else if (y > this.world.worldBounds.height){
                y = this.world.worldBounds.height;
                this.onHit(_);
            }
        }


        for(var i = 0; i < this.tiles.length; i++){
            if(!this.tiles[i].canMove(this, x - this.pixelBounds.x, y - this.pixelBounds.y)){
                return;
            }
        }

        if(this.anchorCentered){
            this.pixelBounds.x = x - this.pixelBounds.halfWidth;
            this.pixelBounds.y = y - this.pixelBounds.halfHeight;
        }

        if(this.view !== _){
            this.view.setPos(x, y);
        }


        this.checkAdjacentTiles();

        //if(!this.chunk.inBounds(this.pixelBounds)){

        //console.log(this.toString + ' not in chunk bounds');
        //}
    }

    setCenter(x, y){
        this.view.setCenter(x, y);
    }

    setCenterScreen(){
        this.view.setCenterScreen();
    }

    setX(x){
        this.setPos(x, this.view.y);
    }

    setY(y){
        this.setPos(this.view.x, y);
    }

    setPositionBy(x, y){
        this.setPos(this.view.x + x, this.view.y + y);
    }

    setXBy(x){
        this.setPos(this.view.x + x, this.view.y);
    }

    setYBy(y){
        this.setPos(this.view.x, this.view.y + y);
    }

    getX(){
        return this.view.getX();
    }

    getY(){
        return this.view.getY();
    }

    getCenterX(){
        return this.view.getCenterX();
    }

    getCenterY(){
        return this.view.getCenterY();
    }

    isVisible(){
        return this.view.isVisible();
    }

    setVisible(visible){
        this.view.setVisible(visible);
    }

    destroy() {
        this.view.destroy();
    }

}

class PickUp extends GameObject{

    canBeRemoved = false;

    type = 0;

    constructor(chunk, x, y){
        super(chunk, x, y);
    }

    onHit(obj){
        if(this.alive){
            if(obj instanceof Projectile){
                obj.onHaltFire();
            } else if (obj instanceof EnemyTank || obj instanceof Player){
                this.alive = false;
                obj.onPickup(this);
            }
        }
    }

    spawn(chunk, x, y){
        this.chunk = chunk;

        if(this.view !== _){
            this.main.renderer.stopRender(Renderer.STATICSPRITE_CRATE, this.view);
        }
        this.view = this.main.renderer.startRender(
            Renderer.STATICSPRITE_CRATE, x, y, this.main.renderer.GAME_OBJECT_GROUP);
        
        this.view.setAlpha(1);        
        this.anchorCenter();    
        this.view.element.rotation = Math.random() * (Math.PI * 2);

        this.type = Projectile.getRandType();

        this.alive = true;
        this.canBeRemoved = false;

        this.setPos(x, y);      
        this.initBounds(x, y);        
    }

    update(){
        super.update();
        
        if(!this.alive && !this.canBeRemoved){
            
            this.view.setAlpha(this.view.element.alpha - 0.06);
            //this.hitDust.setAlpha(this.view.element.alpha - 0.03);
            if(this.view.element.alpha < 0){
                this.view.setAlpha(0);
               // this.hitDust.setAlpha(0);
                this.canBeRemoved = true;
            }
            
        }
    }

    onRemove(){
        if(this.view !== _){
            this.main.renderer.stopRender(Renderer.STATICSPRITE_CRATE, this.view);
            this.view = _;
        }

        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].removeObj(this);
        }
        this.tiles = [];

        this.alive = false;
        this.canBeRemoved = false;
    }

    setPos(x, y){
        super.setPos(x, y);
    }
}

class Projectile extends GameObject {

    parent: Tank;

    firing = false;
    distSinceFire = 0;

    maxDist = 300;

    speed = 5;
    varSpeed = 3;
    delta = 0;

    direction = 0;

    color;

    static TYPE_NORMAL = 0;
    static TYPE_BONUS_SPEED = 1;
    static TYPE_FIRE = 2;
    static TYPE_EXPLOSIVE = 3;
    
    currentType = 0;

    constructor(chunk, x, y){
        super(chunk, x, y);
        this.solid = true;
        this.givesWay = true;
    }

    build(parent){
        this.parent = parent;

        this.color = 'Beige';

        this.init(0, 0, new SpriteView(0, 0, 
            this.main, _, 
            this.main.renderer.SPRITE_PACK_TANKS + 'Bullets/bullet' + this.color + '_outline', 
            this.world.renderer.GAME_VEHICLE_GROUP));

        this.anchorCenter();
        this.setVisible(false);
    }

    initBounds(x, y){
        if(this.view !== _){
            this.pixelBounds.setTo(
                x, y,
                this.view.width, this.view.height
            );
        }

        for(var i = 0; i < this.parent.tiles.length; i++){
            if(this.parent.tiles[i].canAddObj(this)){
                this.tiles.push(this.parent.tiles[i]);
                this.tiles[this.tiles.length - 1].addObj(this);
            }
        }

        if(this.tiles.length === 0){ //if no tiles are valid, check the adj ones
            for(var i = 0; i < this.parent.tiles.length; i++){
                for(var j = 0; j < this.parent.tiles[i].adjacentTiles.length; j++){
                    if(this.parent.tiles[i].adjacentTiles[j] !== _
                        && this.parent.tiles[i].adjacentTiles[j].canAddObj(this)){
                        this.tiles.push(this.parent.tiles[i].adjacentTiles[j]);
                        this.tiles[this.tiles.length - 1].addObj(this);
                    }
                }
            }
        }

        this.checkAdjacentTiles();

        if(this.tiles.length === 0){
            console.log('proj fired without bounds');
        }
    }

    fire(ammoType){
        if(!this.firing){
            if(this.currentType !== ammoType){
                this.currentType = ammoType;

                if(this.currentType === Projectile.TYPE_NORMAL){
                    this.color = 'Beige';
                } else if (this.currentType === Projectile.TYPE_BONUS_SPEED){
                    this.color = 'Blue';                    
                } else if (this.currentType === Projectile.TYPE_FIRE){
                    this.color = 'Yellow';                    
                } else if (this.currentType === Projectile.TYPE_EXPLOSIVE){
                    this.color = 'Red';                    
                }

                this.view.key =
                    this.main.renderer.SPRITE_PACK_TANKS + 'Bullets/bullet' + this.color + '_outline';
                this.view.element.loadTexture(
                    this.view.element.key, this.view.key);

            }

            this.chunk = this.parent.chunk; //for bounds init
            this.direction = this.parent.barrelDirection - (180 * (Math.PI / 180)); //AKA PI
            this.view.element.rotation = this.parent.barrelDirection - (90 * (Math.PI / 180));
            /*var x = this.parent.view.x +
             (((this.view.width * 0) + this.parent.barrel.width) * Math.cos(this.direction));
             var y = this.parent.view.y +
             (((this.view.height * 1) + this.parent.barrel.width) * Math.sin(this.direction));*/
            var x = this.parent.view.x + ((this.parent.barrel.height * 1.5) * Math.cos(this.direction)); //+ (this.view.height * Math.sin(this.direction));
            var y = this.parent.view.y + ((this.parent.barrel.height * 1.5) * Math.sin(this.direction)); //+ (this.view.height * Math.sin(this.direction));
            this.setPos(x, y);

            this.initBounds(x, y);
            this.setVisible(true);
            this.firing = true;
            this.delta = this.speed;
            this.distSinceFire = 0;
        }
    }


    onHit(obj){
        if(obj === _){//coll with world edge
            //this.delta = -this.delta / 4;
            this.onHaltFire();


        } else if(obj instanceof Projectile){
            if(obj.parent !== this.parent){
                obj.onHaltFire();
                this.onHaltFire();
                //this.onHitByEnemyProjectile();
            }
        } else if (obj instanceof Player || obj instanceof EnemyTank){
            if(obj !== this.parent){
                //console.log(obj.parent);
                //console.log(this);
                obj.onHitByEnemyProjectile(this, false);
                this.onHaltFire();
            }
        } else if(obj instanceof Man){
            if(obj.alive){
                this.parent.onHitMan();
                obj.onRunOver();
            }
        } else if (obj instanceof PickUp){
            if(obj.alive){
                this.onHaltFire();                            
            }
        }
    }

    onHaltFire(){
        this.setVisible(false);
        this.removeBounds();
        this.firing = false;
        this.parent.returnProj(this);
    }

    update(){
        if(this.firing){
            this.delta = this.speed * Math.pow(0.85, this.distSinceFire / 60);

            //- this.varSpeed * (this.distSinceFire / this.maxDist);

            this.setPositionBy(
                this.delta * Math.cos(this.direction),
                this.delta * Math.sin(this.direction));

            this.distSinceFire += this.delta;
            if(this.distSinceFire > this.maxDist){
                this.onHaltFire();
            }
        }
    }

    static getRandType(){
        return getRandomInt(Projectile.TYPE_BONUS_SPEED, Projectile.TYPE_EXPLOSIVE);
    }

}

class Tank extends GameObject {

    name;
    score = 0;// getRandomInt(0, 100);

    maxSpeed = 1;
    maxSpeedBase = 1;
    delta = 0;
    acceleration = 0.05;
    accelerationBase = 0.05;

    turnSpeed = 0.0174533 / 2;
    turnSpeedBase = 0.0174533 / 2;
    directionRads = 270 * Math.PI / 180;

    speedMultiplier = 2;

    health = 100;
    hasRamSpeed = false;
    ramSpeedLimit = 6;
    canBeRemoved = false;
    lastHitTime = 0;

    barrel: SpriteView;
    protected barrelTurnSpeed = 0.0174533;
    barrelTurnSpeedBase = 0.0174533;

    barrelDirection = 270 * Math.PI / 180;
    protected barrelDirectionTarget = 0;

    protected firing = false;
    protected firingTimer = 0;
    protected fireDelta;
    protected fireCooldown = 30;
    protected fireCooldownTimer = 0;

    protected tracks = [];
    protected tracksLimit = 5;
    protected distSinceLastTracks = 0;

    color = '';

    projPool: Projectile[] = [];
    activeProjs: Projectile[] = [];
    //projectile: Projectile;

    altProjectileType = 1;
    ammo = [0, 0, 0, 0];

    private dust: SpriteView; //for proj fire
    private hitDust: SpriteView;
    protected text: TextView;

    onFire = false;
    onFireCounter = 0; //counts down to not being on fire
    onFireLimit = 300;
    fireColorPercentage = 0;
    fireHitBy = _;

    constructor(chunk, x, y){
        super(chunk, x, y);

        this.solid = true;
        this.givesWay = true;
        this.alive = true;

        this.text = new TextView(0, 0,  this.main, 'cpu',
            font.medThin, this.world.renderer.UI_GROUP);
        this.text.setFixedToCamera(false);


        //this.engineAudio = this.main.phaser.add.audio('engine');
        //this.engineAudio.loop = true;
        //this.engineAudio.volume = 0.5;
        //this.engineAudio.play();

        this.build(chunk, x, y);

        //this.projectile = new Projectile(chunk, x, y);
        //this.projectile.build(this);
        for(var i = 0; i < 5; i++){
            this.projPool.push(new Projectile(chunk, x, y));
            this.projPool[this.projPool.length - 1].build(this);
        }


        this.dust = new SpriteView(0, 0, this.main,_,
            this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'White' + '5',
            this.world.renderer.GAME_VEHICLE_GROUP);
        this.dust.setVisible(false);


        this.hitDust = new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'Yellow' + '5',
            this.world.renderer.GAME_VEHICLE_GROUP);
        this.hitDust.setVisible(false);


        //this.dust.element.anchor = new Phaser.Point(0.5, 0.5);
    }

    build(chunk, x, y){
        this.color = this.getRandColor();

        this.init(0, 0, new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/tank' + this.color + '_outline',
            this.world.renderer.GAME_VEHICLE_GROUP));

        this.view.element.anchor = new Phaser.Point(0.5, 0.5);
        this.anchorCentered = true;

        this.barrel = new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/barrel' + this.color + '_outline',
            this.world.renderer.GAME_VEHICLE_GROUP);

        this.barrel.element.anchor = new Phaser.Point(0.5, 0.1);

        this.initBounds(x, y);
        this.setPos(x, y);
        for(var i = 0; i < this.tracksLimit; i++){
            this.tracks.push(new SpriteView(0, 0, this.main, _,
                this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/tracksLarge',
                this.world.renderer.GAME_GROUND_GROUP));
            this.tracks[i].element.anchor = new Phaser.Point(0.5, 0.5);
        }

        this.maxSpeed = this.maxSpeedBase * this.speedMultiplier;
        this.acceleration = this.accelerationBase * this.speedMultiplier;
        this.turnSpeed = this.turnSpeedBase * this.speedMultiplier;

        this.barrelTurnSpeed = this.barrelTurnSpeedBase * this.speedMultiplier;
    }

    onRemove(){
        this.view.setVisible(false);
        this.barrel.setVisible(false);
        this.dust.setVisible(false);
        this.hitDust.setVisible(false);
        this.text.setVisible(false);

        this.view.setAlpha(0);
        this.barrel.setAlpha(0);

        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].removeObj(this);
        }
        this.tiles = [];

        this.alive = false;
        this.canBeRemoved = false;
    }

    removeProjectiles(){
        for(var i = 0; i < this.activeProjs.length; i++){
            this.activeProjs[i].onHaltFire();
        }
    }
    removeTracks(){
        for(var i = 0; i < this.tracks.length; i++){
            this.tracks[i].setVisible(false);
        }
    }

    reset(chunk, x, y){
        this.chunk = chunk;
        this.view.setVisible(true);
        this.barrel.setVisible(true);
        this.dust.setVisible(false);
        this.hitDust.setVisible(false);
        this.text.setVisible(true);

        this.view.setAlpha(1);
        this.barrel.setAlpha(1);

        var color = this.getRandColor();
        if(color != this.color){
            this.color = color;

            this.view.key =
                this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/tank' + this.color + '_outline';
            this.view.element.loadTexture(
                this.view.element.key, this.view.key);

            this.barrel.key =
                this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/barrel' + this.color + '_outline';
            this.barrel.element.loadTexture(
                this.barrel.element.key, this.barrel.key);
        }

        this.removeColor();
        this.onFire = false;
        //this.setColor('#f44336');

        this.initBounds(x, y);
        this.setPos(x, y);

        this.alive = true;
        this.canBeRemoved = false;
        this.onFire = false;

        this.setHealth(100);    
        this.score = 0;    

        this.maxSpeed = this.maxSpeedBase * this.speedMultiplier;
        this.acceleration = this.accelerationBase * this.speedMultiplier;
        this.turnSpeed = this.turnSpeedBase * this.speedMultiplier;

        this.barrelTurnSpeed = this.barrelTurnSpeedBase * this.speedMultiplier;
    }

    private getRandColor(){
        var colors = ['Beige', 'Red', 'Black', 'Blue'];
        return colors[getRandomInt(0, colors.length - 1)];
    }

    onCantMove(){
        //this.delta = -this.delta / 4;
    }

    onHit(obj){
        if(obj === _){//coll with world edge
            this.delta = -this.delta / 4;
        } else if (obj instanceof PickUp){
            if(obj.alive){
                this.onPickup(obj);
                obj.alive = false;
            }
        }else if (obj instanceof EnemyTank || obj instanceof Player){

            if(!obj.alive){
                return;
            }

            var thisDelta = this.delta;
            var objDelta = obj.delta;

            var thisDeltaAbs = Math.abs(this.delta);
            var objDeltaAbs = Math.abs(obj.delta);

            if(this instanceof Player || obj instanceof Player){
                //console.log('going same dir: ' + this.goingSameDirection(obj));
                /*if(Math.abs(this.delta) > 1 && Math.abs(obj.delta) > 1){
                    if(this.delta > 0 && objDelta > 0){
                        console.log('both > 0');
                        console.log('this delta: ' + this.delta + ', obj delta: ' + obj.delta);
                        console.log('this dir: ' + this.directionRads + ', obj dir: ' + obj.directionRads);
                    } else if(this.delta < 0 && objDelta < 0){
                        console.log('both < 0');
                        console.log('this delta: ' + this.delta + ', obj delta: ' + obj.delta);
                        console.log('this dir: ' + this.directionRads + ', obj dir: ' + obj.directionRads);
                    }
                }*/
            }

            if(this.goingSameDirection(obj)){
                //hitting head on
                if(this.hasRamSpeed || obj.hasRamSpeed){
                    if(thisDeltaAbs > objDeltaAbs){
                        obj.onHitByEnemyProjectile(_, true);
                    } else {
                        this.onHitByEnemyProjectile(_, true);
                    }
                }
                this.delta = this.delta / 2;
                obj.delta = obj.delta / 2;
            } else{
                if(Math.abs(thisDeltaAbs - objDeltaAbs) > this.ramSpeedLimit){
                    if(thisDeltaAbs > objDeltaAbs){
                        obj.onHitByEnemyProjectile(_, true);
                        this.delta = this.delta / 2;
                    } else {
                        this.onHitByEnemyProjectile(_, true);
                        obj.delta = obj.delta / 2;
                    }
                }
            }

            if(this.alive && obj.alive){
                this.onCrashedIntoBy(obj);
            }

        } else if(obj instanceof Projectile){
            if(obj.parent !== this){
                obj.onHaltFire();
                this.onHitByEnemyProjectile(obj, false);
            }
        } else if(obj instanceof Man){
            if(obj.alive){
                this.onHitMan();
                obj.onRunOver();
            }
        }
    }

    private goingSameDirection(obj){
        if(this.delta > 0 && obj.delta > 0){
            if(Math.abs(this.directionRads - obj.directionRads) < Math.PI / 2){
                return true;
            }
        } else if(this.delta < 0 && obj.delta < 0){
            if(Math.abs(this.directionRads - obj.directionRads) < Math.PI / 2){
                return true;
            }
        } else {
            if(Math.abs(this.directionRads - obj.directionRads) < Math.PI / 2){
                return false;
            }
            return true;
        }
        return false;
    }

    onHitMan(){
        this.setHealth(this.health + 20);
    }

    onKillTarget(){ //for ai
        this.score++;
    }

    onShotAtBy(obj){ //for ai

    }

    onCrashedIntoBy(obj){ //hit but not dead. for ai

    }

    onPickup(obj){
        //this.altProjectileType = obj.type;        
        switch(obj.type){
            case Projectile.TYPE_BONUS_SPEED:
                this.ammo[Projectile.TYPE_BONUS_SPEED] += getRandomInt(3, 9);
            break;
            case Projectile.TYPE_FIRE:
                this.ammo[Projectile.TYPE_FIRE] += getRandomInt(3, 9);
            break;
            case Projectile.TYPE_EXPLOSIVE:
                this.ammo[Projectile.TYPE_EXPLOSIVE] += getRandomInt(3, 9);
            break;
        }
    }   

    onHitByEnemyProjectile(obj, rammed){ //if _, hit by ram thus dead
        if(obj === _){
            this.setHealth(0);
        } else if(obj instanceof Projectile){

            switch(obj.currentType){
                case Projectile.TYPE_NORMAL:
                    this.setHealth(this.health - 20);                                   
                break;
                case Projectile.TYPE_BONUS_SPEED:
                    this.setHealth(this.health - 20);                                   
                break;
                case Projectile.TYPE_FIRE:
                    this.fireHitBy = obj;
                    this.onFire = true;
                    this.onFireCounter = 0;
                    this.fireColorPercentage = 0;
                break;
                case Projectile.TYPE_EXPLOSIVE:
                    this.setHealth(this.health - 50);                                                   
                break;
            }

            this.onShotAtBy(obj.parent);  
                
        }
        this.lastHitTime = Date.now();
        if(this.health <= 0 && this.alive){
            if(obj instanceof Projectile){
                this.onDeath(obj, obj.currentType);
            } else if (rammed){
                this.onDeath(obj, _);
            }
        }

        if(this.health <= 40 && this.hitDust.key !==
            this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'Orange' + '5'){
            this.hitDust.key =
                this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'Orange' + '5';
            this.hitDust.element.loadTexture(
                this.hitDust.element.key, this.hitDust.key);
        } else if (this.health > 40 && this.hitDust.key !==
            this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'Yellow' + '5'){
            this.hitDust.key =
                this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'Yellow' + '5';
            this.hitDust.element.loadTexture(
                this.hitDust.element.key, this.hitDust.key);
        }

        this.hitDust.setVisible(true);
        if(obj !== _){
            this.hitDust.setCenter(obj.getX(), obj.getY());
        } else{
            this.hitDust.setCenter(this.getX(), this.getY());
        }
        this.hitDust.setAlpha(1);
    }

    onDeath(obj, type){
        this.alive = false;
        if(obj instanceof Projectile){
            obj.parent.onKillTarget();
            this.world.onKill(obj.parent, this, type);
        } else if (obj instanceof Tank 
            || obj instanceof EnemyTank || obj instanceof Player){
                obj.onKillTarget();
                this.world.onKill(obj, this, type);                    
        }
    }

    addTracks(){
        var newTracks: SpriteView = this.tracks[0];
        for(var i = 1; i < this.tracks.length; i++){
            if(this.tracks[i].element.alpha < newTracks.element.alpha){
                newTracks = this.tracks[i];
                break;
            }
        }

        if(newTracks === _){
            console.log('newtracks err');
        }

        newTracks.element.alpha = 1;
        newTracks.setVisible(true);

        newTracks.setPos(
            this.view.x, this.view.y
        );
        newTracks.element.rotation = this.view.element.rotation;
    }

    setPos(x, y){
        super.setPos(x, y);
        if(this.barrel !== _){
            this.text.setCenter(x, y - this.view.height);
            this.barrel.setPos(x, y);
            if(this.firing){
                this.barrel.setPositionBy(
                    this.fireDelta * Math.cos(this.barrelDirection),
                    this.fireDelta * Math.sin(this.barrelDirection));
            }
        }
    }

    getProj(){
        var result = this.projPool[0];
        this.activeProjs.push(result);
        this.projPool.splice(0, 1);
        return result;
    }

    returnProj(obj){
        for(var i = 0; i < this.activeProjs.length; i++){
            if(this.activeProjs[i] === obj){
                this.activeProjs.splice(i, 1);
                this.projPool.push(obj);
                return;
            }
        }
        console.log('err couldnt return proj!');
    }

    fire(ammoType){
        if(!this.firing && this.fireCooldownTimer === 0 && this.projPool.length > 0){
            //console.log('fire!');
            this.dust.setVisible(true);
            this.dust.setPos(
                this.pixelBounds.x + ((this.barrel.height * 1) * Math.cos(this.barrelDirection - Math.PI)),
                this.pixelBounds.y + ((this.barrel.height * 1) * Math.sin(this.barrelDirection - Math.PI))
            );
            this.dust.element.alpha = 1;

            this.firing = true;
            this.firingTimer = 0;
            this.fireDelta = 6;
            this.fireCooldownTimer = this.fireCooldown;

            var proj = this.getProj();
            proj.fire(ammoType);

            this.playShotSound();

            var diff = Math.abs(this.directionRads - this.barrelDirection);
            if(diff > Math.PI){
                diff = Math.PI - (diff - Math.PI);
            }

            if(ammoType === Projectile.TYPE_BONUS_SPEED){
                this.delta += Math.cos(diff) * 15;
            } else {
                this.delta += Math.cos(diff) * 3;
            }

            diff = Math.abs(this.directionRads - this.barrelDirection);

            var turnDiff = (this.turnSpeed * 20) * Math.sin(diff);

            if(this.delta < 0){
                this.directionRads -= turnDiff;
                this.view.rotate(-turnDiff);
            } else {
                this.directionRads += turnDiff;
                this.view.rotate(+turnDiff);
            }

        }
    }

    //colorPercentage = 0;

    update(){
        this.updateFire();

        if(this.alive){
            this.updateInput();
            this.updateBarrel();
        }

        if(this.onFire){

            this.fireColorPercentage -= 0.01;
            
            if(this.onFireCounter % 60 === 0){
                this.setHealth(this.health - 5);     
                this.fireColorPercentage = 0;     
                if(this.health <= 0){
                    this.onDeath(this.fireHitBy, Projectile.TYPE_FIRE);
                    this.onFire = false;
                    return;
                }      
            }
            this.setColor(shadeColor('#f44336', this.fireColorPercentage));

            this.onFireCounter++;
            if(this.onFireCounter === this.onFireLimit){
                this.onFire = false;
                this.removeColor();
                this.onFireCounter = 0;
                this.fireColorPercentage = 0;
            }
        }

        //this.view.element.tint -= 1;
        //this.barrel.element.tint -= 1;
        //this.setColor('#ff0000');
        //this.setColor(shadeColor('#ffcdd2', this.colorPercentage));
        /*this.colorPercentage -= 0.02;
        if(this.colorPercentage < -0.5){
            this.colorPercentage = 0;
        }*/
        
        this.updateTracks();

        if(this.delta != 0){
            if(this.delta > 0){
                this.delta -= this.acceleration / 2;
            } else {
                this.delta += this.acceleration / 2;
            }
        }

        this.hasRamSpeed = (Math.abs(this.delta) >= this.ramSpeedLimit);
        this.maxSpeed = (this.maxSpeedBase * this.speedMultiplier) * this.avgSpeedFactor;

        this.setPositionBy(
            this.delta * Math.cos(this.directionRads),
            this.delta * Math.sin(this.directionRads));
    }

    protected updateFire(){
        if(this.firing){
            this.firingTimer++;
            this.fireDelta -= (this.firingTimer / 5);
            this.dust.element.alpha -= (1 / 10);
            //console.log(this.fireDelta);
            if(this.firingTimer === 10){
                this.firing = false;
                this.dust.setVisible(false);
            }
        }

        if(this.hitDust.isVisible()){
            this.hitDust.setAlpha(this.hitDust.element.alpha - 0.1);
            if(this.hitDust.element.alpha < 0){
                this.hitDust.setVisible(false);
            }
        }

        if(!this.alive && !this.canBeRemoved){
            this.view.setAlpha(this.view.element.alpha - 0.03);
            this.barrel.setAlpha(this.barrel.element.alpha - 0.03);
            if(this.view.element.alpha < 0){
                this.view.setAlpha(0);
                this.barrel.setAlpha(0);
                this.canBeRemoved = true;
            }
        }

        if(this.fireCooldownTimer > 0){
            this.fireCooldownTimer--;
        }

        for(var i = 0; i < this.activeProjs.length; i++){
            this.activeProjs[i].update();
        }

    }

    protected updateInput(){
    }

    protected updateBarrel(){
        if(Math.abs(this.barrelDirectionTarget - this.barrelDirection) > this.barrelTurnSpeed){

            if(this.barrelDirection < 0){
                this.barrelDirection += 360 * (Math.PI / 180);
            } else if(this.barrelDirection > 360 * (Math.PI / 180)){
                this.barrelDirection -= 360 * (Math.PI / 180);
            }
            if(this.barrelDirectionTarget < 0){
                this.barrelDirectionTarget += 360 * (Math.PI / 180);
            } else if(this.barrelDirectionTarget > 360 * (Math.PI / 180)){
                this.barrelDirectionTarget -= 360 * (Math.PI / 180);
            }

            var diff = (this.barrelDirectionTarget - this.barrelDirection) / (Math.PI / 180);

            if(diff < -180 || (diff > 0 && diff < 180)){
                this.barrelDirection += this.barrelTurnSpeed;
                this.barrel.rotate(this.barrelTurnSpeed);
            } else if (diff > 180 || diff < 0){
                this.barrelDirection -= this.barrelTurnSpeed;
                this.barrel.rotate(-this.barrelTurnSpeed);
            }

        }
    }

    protected updateTracks(){
        this.distSinceLastTracks += Math.abs(this.delta);
        if(this.distSinceLastTracks > 40){
            this.distSinceLastTracks = 0;
            this.addTracks();
        }

        for(var i = 0; i < this.tracks.length; i++){
            if(this.tracks[i].element.alpha > 0){
                this.tracks[i].element.alpha -= 0.005;
                if(this.tracks[i].element.alpha < 0){
                    this.tracks[i].element.alpha = 0;
                    this.tracks[i].setVisible(false);
                }
            }
        }

    }

    tick(){

    }

    setHealth(val){
        this.health = val;
        if(this.health > 100){
            this.health = 100;
        } else if (this.health < 0){
            this.health = 0;
        }
    }

    setColor(color){
        this.view.setColor(color);    
        this.barrel.setColor(color); 
    }

    removeColor(){
        this.view.removeColor();   
        this.barrel.removeColor();
    }

    playShotSound(){
    }

    destroy(){
        super.destroy();
        this.dust.destroy();
        this.hitDust.destroy();
        for(var i = 0; i < this.activeProjs.length; i++){
            this.activeProjs[i].destroy();
        }
        for(var i = 0; i < this.tracks.length; i++){
            this.tracks[i].destroy();
        }
        for(var i = 0; i < this.projPool.length; i++){
            this.projPool[i].destroy();
        }
        this.text.destroy();
        this.barrel.destroy();
    }

}

class Player extends Tank{

    private engineIdleSound;
    private engineFullSound;

    private currentEngineSound;

    //private shots = [];
    //private currentShotIndex;

    constructor(chunk, x, y){
        super(chunk, x, y);
        this.health = 100;

        this.name = 'You';
        //this.text.setContent(this.name);
        this.text.setVisible(false);

        //if(config.playSound){
        this.engineIdleSound = this.main.phaser.add.sound('engine-idle');
        this.engineIdleSound.loop = true;
        this.engineIdleSound.volume = 0.15 + config.soundBoost;

        this.engineFullSound = this.main.phaser.add.sound('engine-full');
        this.engineFullSound.loop = true;
        this.engineFullSound.volume = 0.15 + config.soundBoost;
        //this.engineIdleSound.play();

        for(var i = 0; i < 5; i++){
            //this.shots.push(this.main.phaser.add.sound('shot' + i));
            //this.shots[i].volume = 0.2;
            //this.currentShotIndex = 0;
        }
        //}
    }

    build(chunk, x, y){
        this.color = 'Green';
        //this.text.setContent('player');

        this.init(0, 0, new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/tank' + this.color + '_outline',
            this.world.renderer.GAME_VEHICLE_GROUP));

        this.view.element.anchor = new Phaser.Point(0.5, 0.5);
        this.anchorCentered = true;

        this.barrel = new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/barrel' + this.color + '_outline',
            this.world.renderer.GAME_VEHICLE_GROUP);

        this.barrel.element.anchor = new Phaser.Point(0.5, 0.1);

        //this.engineAudio.volume = 0.3;

        this.initBounds(x, y);
        this.setPos(x, y);
        for(var i = 0; i < this.tracksLimit; i++){
            this.tracks.push(new SpriteView(0, 0, this.main, _,
                this.main.renderer.SPRITE_PACK_TANKS + 'Tanks/tracksLarge',
                this.world.renderer.GAME_GROUND_GROUP));
            this.tracks[i].element.anchor = new Phaser.Point(0.5, 0.5);
        }

        this.maxSpeed *= this.speedMultiplier;
        this.acceleration *= this.speedMultiplier;
        this.turnSpeed *= this.speedMultiplier;

        this.barrelTurnSpeed *= this.speedMultiplier;
    }

    reset(chunk, x, y){
        this.chunk = chunk;
        this.view.setVisible(true);
        this.barrel.setVisible(true);
        this.text.setVisible(true);

        this.view.setAlpha(1);
        this.barrel.setAlpha(1);

        this.initBounds(x, y);
        this.setPos(x, y);

        this.alive = true;
        this.canBeRemoved = false;
        this.onFire = false;

        this.setHealth(100);    
        this.score = 0;    

        this.removeColor();
        //this.setColor('#f44336');
        this.onFire = false;

        this.text.setContent('');
        this.ammo = [0, 0, 0, 0];


        this.maxSpeed = this.maxSpeedBase * this.speedMultiplier;
        this.acceleration = this.accelerationBase * this.speedMultiplier;
        this.turnSpeed = this.turnSpeedBase * this.speedMultiplier;

        this.barrelTurnSpeed = this.barrelTurnSpeedBase * this.speedMultiplier;
    }

    setPos(x, y){
        super.setPos(x, y);
    }

    update(){
        super.update();
    }

    setHealth(val){
        super.setHealth(val);
        this.world.game.inGameUI.playerHealthBar.setPercentage(this.health);
    }

    onHitMan(){
        super.onHitMan();
        this.world.game.inGameUI.playerHealthBar.setPercentage(this.health);
        this.world.game.showPickupString('+20 HP!');
        this.main.soundManager.playSound(SoundManager.SOUND_SPLAT, 0.3 + config.soundBoost);
    }

    onShotAtBy(obj){ //for ai
        super.onShotAtBy(obj);
        this.main.soundManager.playRandHit(0.6);        
    }

    onDeath(obj, type){
        super.onDeath(obj, type);
        this.stopEngineSound();
    }

    onPickup(obj){
        super.onPickup(obj);
        this.main.soundManager.playSound(
            SoundManager.SOUND_CRATE, 0.3 + config.soundBoost);

        if(this.altProjectileType !== obj.type){
            var setAmmo = true;
            for(var i = 1; i < this.ammo.length;i++){
                if(obj.type !== i && this.ammo[i] > 0){
                    setAmmo = false;
                }
            }
            if(setAmmo){
                this.altProjectileType = obj.type;
                this.main.game.inGameUI.onSetShellType(this.altProjectileType);                
            }
        }
        switch(obj.type){
            case Projectile.TYPE_BONUS_SPEED:
                this.world.game.showPickupString('Picked up blue shells!');     
                this.world.game.inGameUI.updateShellCounters(Projectile.TYPE_BONUS_SPEED, this.ammo[Projectile.TYPE_BONUS_SPEED]);       
            break;
            case Projectile.TYPE_FIRE:
                this.world.game.showPickupString('Picked up yellow shells!');  
                this.world.game.inGameUI.updateShellCounters(Projectile.TYPE_FIRE, this.ammo[Projectile.TYPE_FIRE]);                       
            break;
            case Projectile.TYPE_EXPLOSIVE:
                this.world.game.showPickupString('Picked up red shells!');     
                this.world.game.inGameUI.updateShellCounters(Projectile.TYPE_EXPLOSIVE, this.ammo[Projectile.TYPE_EXPLOSIVE]);                       
            break;
        }
    }

    updateInput(){
        if(this.main.input.justMovedMouseWheelUp()){
            if(this.altProjectileType === Projectile.TYPE_EXPLOSIVE){
                this.altProjectileType = Projectile.TYPE_BONUS_SPEED;
            } else {
                this.altProjectileType++;
            }
            this.main.game.inGameUI.onSetShellType(this.altProjectileType);
        } else if (this.main.input.justMovedMouseWheelDown()){
            if(this.altProjectileType === Projectile.TYPE_BONUS_SPEED){
                this.altProjectileType = Projectile.TYPE_EXPLOSIVE;
            } else {
                this.altProjectileType--;
            }
            this.main.game.inGameUI.onSetShellType(this.altProjectileType);
        }

        if(this.main.input.justPressed1()){
            this.altProjectileType = Projectile.TYPE_BONUS_SPEED;
            this.main.game.inGameUI.onSetShellType(this.altProjectileType);            
        } else if (this.main.input.justPressed2()){
            this.altProjectileType = Projectile.TYPE_FIRE;
            this.main.game.inGameUI.onSetShellType(this.altProjectileType);   
        } else if (this.main.input.justPressed3()){
            this.altProjectileType = Projectile.TYPE_EXPLOSIVE;
            this.main.game.inGameUI.onSetShellType(this.altProjectileType);   
        }

        if(!this.firing && this.fireCooldownTimer === 0 && this.projPool.length > 0){
            if(this.main.input.justLeftClickedInGame()){
                this.fire(Projectile.TYPE_NORMAL);
            } else if (this.main.input.justRightClickedInGame()){
                if(this.altProjectileType !== -1 && this.ammo[this.altProjectileType] > 0){
                    this.fire(this.altProjectileType);  
                    this.ammo[this.altProjectileType]--;
                    this.world.game.inGameUI.updateShellCounters(
                        this.altProjectileType, this.ammo[this.altProjectileType]);                       
                }
            }
        }

        if(this.main.input.up || this.main.input.down 
            || this.main.input.left || this.main.input.right){
            this.setEngineSound(this.engineFullSound);
        } else{
            this.setEngineSound(this.engineIdleSound);
        }

        if(this.main.input.up){
            if(this.delta > -this.maxSpeed){
                this.delta -= this.acceleration;
                //this.engineAudio.volume = 0.3 + (0.5 * (Math.abs(this.delta) / this.maxSpeed));
            }
        } else if (this.main.input.down){
            if(this.delta < this.maxSpeed){
                this.delta += this.acceleration;
                //this.engineAudio.volume = 0.3 + (0.5 * (Math.abs(this.delta) / this.maxSpeed));
            }
        } else {
            if(this.delta > -this.acceleration * 0.9 && this.delta < this.acceleration * 0.9){
                this.delta = 0;
                //this.engineAudio.volume = 0.3;
            }
        }

        if(this.main.input.left){
            this.directionRads -= this.turnSpeed;
            this.view.rotate(-this.turnSpeed);
        } else if (this.main.input.right){
            this.directionRads += this.turnSpeed;
            this.view.rotate(this.turnSpeed);
        }

        this.barrelDirectionTarget = Math.atan2(
            this.main.phaser.input.y - (this.view.getY() - this.main.phaser.camera.y),
            this.main.phaser.input.x - (this.view.getX() - this.main.phaser.camera.x)) + (180 * Math.PI / 180);
    }

    tick(){
        super.tick();
        //console.log(this.delta);
        /*if(this.hasRamSpeed){
            this.world.game.statsString.setContent(
                'Health: ' + this.health + '%\nSpeed: ' + Math.abs(Math.floor(this.delta)) +'\nRamming speed: yes\n'
            );
        } else {
            this.world.game.statsString.setContent(
                'Health: ' + this.health + '%\nSpeed: ' + Math.abs(Math.floor(this.delta)) +'\nRamming speed: No\n'
            );
        }*/
    }

    setEngineSound(sound){
        if(this.alive && config.playSound){
            if(this.currentEngineSound !== sound){
                if(this.currentEngineSound !== _){
                    this.currentEngineSound.stop();
                }
                this.currentEngineSound = sound;
                if(this.currentEngineSound !== _){
                    this.currentEngineSound.play();
                }            
            }          
        }
    }

    stopEngineSound(){
        if(config.playSound){
            if(this.currentEngineSound !== _){
                this.currentEngineSound.stop();
            }          
        }
    }

    playShotSound(){
        if(config.playSound){
            this.main.soundManager.playRandShot(0.4);                    
        }
    }

}

class EnemyTank extends Tank {

    target;

    private player: Player;
    private otherAis: EnemyTank[] = [];

    distToPlayer = 0;
    angleToPlayer = 0;

    distToTarget = 0;
    angletoTarget = 0;

    angleToMakeWay = 0;

    currentBehaviour = -1;

    BEHAV_GOTO_TARGET = 0;
    //BEHAV_MAKEWAY = 1;
    BEHAV_ENG_TARGET = 2;
    BEHAV_RAM_TARGET = 3;


    constructor(chunk, x, y){
        super(chunk, x, y);
    }

    build(chunk, x, y){
        super.build(chunk, x, y);
    }

    setPos(x, y){
        super.setPos(x, y);
    }

    setName(name){
        this.name = name;
        this.text.setContent(name);
    }

    reset(chunk, x, y){
        super.reset(chunk, x, y);        
        this.barrelDirectionTarget = Math.random() * (Math.PI * 2);
    }

    initAi(player){
        this.player = player;
        this.target = _;
        this.currentBehaviour = -1;
    }

    onAddAi(otherAis){ //array w all ais except this
        if(otherAis.length === 0){
            return;
        }
        this.otherAis = [];
        this.otherAis = otherAis.concat();
        for(var i = 0; i < this.otherAis.length; i++){
            if(this.otherAis[i] === this){
                this.otherAis.splice(i, 1);
                //console.log('removed self');
            }
        }
        if(this.otherAis){

        }
    }

    onHitMan(){
        super.onHitMan();
        this.calcDistToPlayer();
        if(this.distToPlayer < 500){
            this.main.soundManager.playSound(SoundManager.SOUND_SPLAT, 0.3 + config.soundBoost);
        }
    }

    onPickup(obj){
        super.onPickup(obj);
        this.calcDistToPlayer();      
        if(this.distToPlayer < 500){
            this.main.soundManager.playSound(
                SoundManager.SOUND_CRATE, 0.2 + config.soundBoost);
        }  
        this.altProjectileType = obj.type;
    }

    update(){
        super.update();
    }

    updateInput(){
        /*switch (this.currentBehaviour){
            case this.BEHAV_GOTO_TARGET:

                this.calcDistToPlayer();
                this.moveToTarget();

                if(this.distToPlayer < getRandomInt(200, 250)){
                    this.currentBehaviour = this.BEHAV_ENG_TARGET;
                }
                this.checkForMakeWay();

                break;
            case this.BEHAV_MAKEWAY:

                this.angletoTarget = Math.sqrt(
                    Math.pow((this.target.view.x - this.view.x), 2) +
                    Math.pow((this.target.view.y - this.view.y), 2)
                );
                this.distToTarget = Math.sqrt(
                    Math.pow((this.target.view.x - this.view.x), 2) +
                    Math.pow((this.target.view.y - this.view.y), 2)
                );

                this.angletoTarget -= Math.PI;

                this.moveToTarget();

                if(this.distToTarget > 250){
                    this.currentBehaviour = this.BEHAV_GOTO_TARGET;
                }

                break;
            case this.BEHAV_ENG_TARGET:

                this.calcDistToPlayer();

                this.attemptFire();

                if(this.distToPlayer > 300){
                    this.currentBehaviour = this.BEHAV_GOTO_TARGET;
                }
                this.checkForMakeWay();

                break;
            case this.BEHAV_RAM_TARGET:
                break;
        }*/
        this.updateAi();

        if(this.delta > -this.acceleration * 0.9 && this.delta < this.acceleration * 0.9){
            this.delta = 0;
        }

    }

    onShotAtBy(obj){ 
        super.onShotAtBy(obj);
        if(obj.alive){
            this.setTargetTo(obj);     
        }
    }
        
    onCrashedIntoBy(obj){ 
        super.onCrashedIntoBy(obj);
        if(obj.alive){
            this.setTargetTo(obj);     
        }
    }

    onKillTarget(){ //for ai
        super.onKillTarget();
        this.setHealth(100);
    }

    private setTargetTo(obj){
        if(obj !== this.target){
            this.target = obj;        
            this.currentBehaviour = this.BEHAV_GOTO_TARGET;  
            //console.log(this.name + ' set target to ' + obj.name);   
        }
    }

    private attemptFire(){
        this.barrelDirectionTarget = this.angletoTarget;

        if(Math.random() < 0.01
            && (Math.abs(this.barrelDirectionTarget - this.barrelDirection)
            < this.barrelTurnSpeed * 15 ||
            Math.abs(this.barrelDirectionTarget - this.barrelDirection) - Math.PI * 2
            < this.barrelTurnSpeed * 15)){
            this.fire(Projectile.TYPE_NORMAL);
        }
    }

    /*private calcDistToPlayer(){
        this.distToPlayer = Math.sqrt(
            Math.pow((this.player.view.x - this.view.x), 2) +
            Math.pow((this.player.view.y - this.view.y), 2)
        );

        this.angleToPlayer = Math.atan2(
            this.view.getY() - this.player.getY(),
            this.view.getX() - this.player.getX());

        if(this.target instanceof Player){
            this.angletoTarget = this.angleToPlayer;
            this.distToTarget = this.distToPlayer;
        }
    }*/

    private calcDistToTarget(){
        this.distToTarget = Math.sqrt(
            Math.pow((this.target.view.x - this.view.x), 2) +
            Math.pow((this.target.view.y - this.view.y), 2)
        );

        this.angletoTarget = Math.atan2(
            this.view.getY() - this.target.getY(),
            this.view.getX() - this.target.getX());

        if(this.target instanceof Player){
            this.angleToPlayer = this.angletoTarget;
            this.distToPlayer = this.distToTarget;
        }
    }

    private calcDistToPlayer(){
        this.distToPlayer = Math.sqrt(
            Math.pow((this.player.view.x - this.view.x), 2) +
            Math.pow((this.player.view.y - this.view.y), 2)
        );

        this.angleToPlayer = Math.atan2(
            this.view.getY() - this.player.getY(),
            this.view.getX() - this.player.getX());
    }

    private moveToTarget(){
        if(Math.abs(this.angletoTarget - this.directionRads) > this.turnSpeed){
            if(this.directionRads < 0){
                this.directionRads += 360 * (Math.PI / 180);
            } else if(this.directionRads > 360 * (Math.PI / 180)){
                this.directionRads -= 360 * (Math.PI / 180);
            }
            if(this.angletoTarget < 0){
                this.angletoTarget += 360 * (Math.PI / 180);
            } else if(this.angletoTarget > 360 * (Math.PI / 180)){
                this.angletoTarget -= 360 * (Math.PI / 180);
            }

            var diff = (this.angletoTarget - this.directionRads) / (Math.PI / 180);

            if(diff < -180 || (diff > 0 && diff < 180)){
                this.directionRads += this.turnSpeed;
                this.view.rotate(this.turnSpeed);
            } else if (diff > 180 || diff < 0){
                this.directionRads -= this.turnSpeed;
                this.view.rotate(-this.turnSpeed);
            }

        }

        if(this.delta > -this.maxSpeed){
            this.delta -= this.acceleration;
        }
    }

    /*checkForMakeWay(){
        var dist = 0;
        for(var i = 0; i < this.otherAis.length; i++){
            dist = Math.sqrt(
                Math.pow((this.otherAis[i].view.x - this.view.x), 2) +
                Math.pow((this.otherAis[i].view.y - this.view.y), 2)
            );
            //console.log(dist);
            if(dist < 150){
                this.target = this.otherAis[i];
                this.currentBehaviour = this.BEHAV_MAKEWAY;
                break;
            }
        }
    }*/

    private updateAi(){
        this.determineTarget();
        this.determineBehaviour();
        this.calcDistToTarget();
        this.makeMove();
    }

    private determineBehaviour(){
        switch(this.currentBehaviour){
            case -1:
                this.currentBehaviour = this.BEHAV_GOTO_TARGET;
            break;
            case this.BEHAV_GOTO_TARGET: 
            if(this.distToTarget < getRandomInt(200, 250)){
                this.currentBehaviour = this.BEHAV_ENG_TARGET;
            }
            break;
            case this.BEHAV_ENG_TARGET: 
            if(this.distToTarget > 300){
                this.target = _;
                this.determineTarget();
            }
            break;
            case this.BEHAV_RAM_TARGET:

            break;
        }
    }

    private determineTarget(){
        if(this.target === _ || !this.target.alive){
            if(this.otherAiTargetsPlayer() < 2){
                this.setTargetTo(this.player);
            } else if(this.otherAis.length > 0){
                this.setTargetTo(this.otherAis[getRandomInt(0, this.otherAis.length - 1)]);                
            } else {
                this.setTargetTo(this.player);
            }
        }
    }

    private otherAiTargetsPlayer(){
        var amount = 0;
        for(var i = 0; i < this.otherAis.length; i++){
            if(this.otherAis[i].target === this.player){
                amount++;
            }
        }
        return amount;
    }

    private makeMove(){
        switch(this.currentBehaviour){
            case -1:

            break;
            case this.BEHAV_GOTO_TARGET: 
            this.moveToTarget();
            break;
            case this.BEHAV_ENG_TARGET: 
            this.attemptFire();
            break;
            case this.BEHAV_RAM_TARGET:

            break;
        }
    }

    tick(){
        super.tick();

        /*switch (this.currentBehaviour){
            case this.BEHAV_GOTO_PLAYER:
                if(this.distToPlayer < 200){
                    this.currentBehaviour = this.BEHAV_ENG_PLAYER;
                }
                this.checkForMakeWay();
                break;
            case this.BEHAV_MAKEWAY:
                if(this.distToTarget > 250){
                    this.currentBehaviour = this.BEHAV_GOTO_PLAYER;
                }
                break;
            case this.BEHAV_ENG_PLAYER:

                if(this.distToPlayer > 300){
                    this.currentBehaviour = this.BEHAV_GOTO_PLAYER;
                }
                this.checkForMakeWay();
                break;
            case this.BEHAV_RAM_PLAYER:
                break;
        }*/

    }

    playShotSound(){
        this.calcDistToPlayer();
        if(this.distToPlayer < 500){
            this.main.soundManager.playRandShot(0.1);            
        }
    }
}

class Man extends GameObject {

    maxSpeed = 1;
    maxSpeedBase = 1;
    delta = 0;
    acceleration = 0.05;
    accelerationBase = 0.05;

    turnSpeed = 0.0174533;
    turnSpeedBase = 0.0174533;
    directionRads = 180 * Math.PI / 180;

    speedMultiplier = 2;

    health = 100;

    protected firing = false;
    protected firingTimer = 0;
    protected fireDelta;
    protected fireCooldown = 30;
    protected fireCooldownTimer = 0;

    color = '';

    //protected text: TextView;

    player;

    canBeRemoved = false;

    hitDust;

    distSinceLastAngleChange = 0;
    nextDistLimit = 0;
    targetDirection = 0;

    constructor(chunk, x, y) {
        super(chunk, x, y);

        //this.solid = true;
        this.alive = true;

        /*this.text = new TextView(0, 0, 'cpu',
            font.smallThin, this.world.renderer.UI_GROUP);
        this.text.setFixedToCamera(false);*/

        /*this.init(0, 0, new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_SHOOTER + 'Soldier 1/soldier1_gun',
            this.world.renderer.GAME_OBJECT_GROUP));*/
        this.view = this.main.renderer.startRender(
            Renderer.STATICSPRITE_MAN, 
            x, y, this.world.renderer.GAME_OBJECT_GROUP);  
        
        this.init(x, y, this.view);

        this.view.element.anchor = new Phaser.Point(0.5, 0.5);
        this.anchorCentered = true;

        this.hitDust = new SpriteView(0, 0, this.main, _,
            this.main.renderer.SPRITE_PACK_TANKS + 'Smoke/smoke' + 'Orange' + '4',
            this.world.renderer.GAME_VEHICLE_GROUP);
        this.hitDust.setVisible(false);

        this.hitDust.element.anchor = new Phaser.Point(0.5, 0.5);

        this.initBounds(x, y);
        this.setPos(x, y);

        this.maxSpeed = this.maxSpeedBase * this.speedMultiplier;
        this.acceleration = this.accelerationBase * this.speedMultiplier;
        this.turnSpeed = this.turnSpeedBase * this.speedMultiplier;
    }

    initAi(player){
        this.player = player;
    }

    onHit(obj){
        if(this.alive){
            if(obj === _){
                if(this.distSinceLastAngleChange > 50){
                    this.onDirChange();
                }
            } else if(obj instanceof Projectile){
                if(this.alive){
                    obj.parent.onHitMan();
                    this.onRunOver();
                }
            } else if (obj instanceof EnemyTank || obj instanceof Player){
                obj.onHitMan();
                this.onRunOver();
            } else if (obj instanceof PickUp){
                //if(obj.alive){
                //    this.onDirChange();                                    
                //}
            }
        }
    }

    onRunOver(){
        //console.log('man run over');
        this.hitDust.setCenter(
            this.getCenterX() + 6, this.getCenterY() + 6);
        this.hitDust.setVisible(true);
        this.hitDust.setAlpha(1);
        this.delta = 0;
        this.alive = false;
        this.canBeRemoved = false;
    }

    onRemove(){
        //this.view.setVisible(false);
        this.hitDust.setVisible(false);
        //this.text.setVisible(false);

        //this.view.setAlpha(0);
        this.main.renderer.stopRender(Renderer.STATICSPRITE_MAN, this.view);
        this.view = _;

        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].removeObj(this);
        }
        this.tiles = [];

        this.alive = false;
        this.canBeRemoved = false;
    }

    reset(chunk, x, y){
        this.chunk = chunk;
        if(this.view === _){
            this.view = this.main.renderer.startRender(
                Renderer.STATICSPRITE_MAN, 
                x, y, this.world.renderer.GAME_VEHICLE_GROUP);
                this.view.element.anchor = new Phaser.Point(0.5, 0.5);                
        }
        this.view.element.rotation = this.directionRads;
        
        //this.view.setVisible(true);
        this.hitDust.setVisible(false);
        //this.text.setVisible(true);

        this.view.setAlpha(1);

        this.initBounds(x, y);
        this.setPos(x, y);

        this.health = 100;
        this.alive = true;
        this.canBeRemoved = false;

        this.distSinceLastAngleChange = 0;
        this.nextDistLimit = getRandomInt(200, 400);

        if(Math.random() < 0.5){
            this.targetDirection = this.directionRads + Math.random() * Math.PI;
        } else{
            this.targetDirection = this.directionRads - Math.random() * Math.PI;
        }

        var randAngle = (Math.random() * (Math.PI * 2)); //+ Math.PI;
        this.directionRads = randAngle;
        this.view.element.rotation = randAngle;

        this.maxSpeed = this.maxSpeedBase * this.speedMultiplier;
        this.acceleration = this.accelerationBase * this.speedMultiplier;
        this.turnSpeed = this.turnSpeedBase * this.speedMultiplier;
    }

    setPos(x, y){
        super.setPos(x, y);
    }

    update(){
        super.update();

        if(this.alive){

            if(this.directionRads !== this.targetDirection &&
                Math.abs(this.directionRads - this.targetDirection) < this.turnSpeed * 2){
                this.view.element.rotation = this.targetDirection;
                this.directionRads = this.targetDirection;
                //console.log('kk');
            } else if(this.directionRads < this.targetDirection){
                this.directionRads += this.turnSpeed;
                this.view.rotate(this.turnSpeed);
                if(this.delta > this.maxSpeed / 3){
                    this.delta -= this.acceleration / 3;
                } else if(this.delta < this.maxSpeed){
                    this.delta += this.acceleration / 3;
                }
            } else if (this.directionRads > this.targetDirection){
                this.directionRads -= this.turnSpeed;
                this.view.rotate(-this.turnSpeed);
                if(this.delta > this.maxSpeed / 3){
                    this.delta -= this.acceleration / 3;
                } else if(this.delta < this.maxSpeed){
                    this.delta += this.acceleration / 3;
                }
            } else {
                if(this.delta < this.maxSpeed){
                    this.delta += this.acceleration;
                }
            }
           // console.log(this.directionRads + ', ' + this.targetDirection);

            this.distSinceLastAngleChange += Math.abs(this.delta);
            if(this.distSinceLastAngleChange > this.nextDistLimit){
                this.onDirChange();

            }

            this.setPositionBy(
                this.delta * Math.cos(this.directionRads),
                this.delta * Math.sin(this.directionRads));

        } else if(!this.canBeRemoved){

            this.view.setAlpha(this.view.element.alpha - 0.03);
            this.hitDust.setAlpha(this.view.element.alpha - 0.03);
            if(this.view.element.alpha < 0){
                this.view.setAlpha(0);
                this.hitDust.setAlpha(0);
                this.canBeRemoved = true;
            }

        }

    }

    private onDirChange(){
        this.distSinceLastAngleChange = 0;
        this.nextDistLimit = getRandomInt(200, 400);

        var newDir = this.getRandDir();

        while(!this.isDirValid(newDir)){
            newDir = this.getRandDir();
        }

        this.targetDirection = newDir;
    }

    private getRandDir(){
        if(Math.random() < 0.5){
            return Math.random() * (Math.PI * 2);
        } else {
            return Math.random() * (Math.PI * 2);
        }
    }

    private isDirValid(dir){
        if(this.view.x > 100
            && this.view.x < this.main.phaser.world.width - 100
            && this.view.y > 100
            && this.view.y < this.main.phaser.world.height - 100){
            return true;
        }

        if(this.view.x < 100
            && dir > Math.PI / 2 && dir < Math.PI * 1.5){
            return false;
        }
        if(this.view.x > this.main.phaser.world.width - 100
            && (dir < Math.PI / 2 || dir > Math.PI * 1.5)){
            return false;
        }
        if(this.view.y < 100
            && dir > Math.PI){
            return false;
        }
        if(this.view.y > this.main.phaser.world.height - 100
            && dir < Math.PI){
            return false;
        }
        return true;
    }


    destroy(){
        super.destroy();
        this.hitDust.destroy();
    }

}

class Garage extends GameObject{

    x = 0;
    y = 0;

    parts = [];

    constructor(chunk, x, y){
        super(chunk, x, y);

        for(var i = 0; i < 6; i++){
            this.parts.push(new SpriteView(i * 32, 0, this.main, _,
                this.main.renderer.SPRITE_PACK_SHOOTER + 'Tiles/tile_142',
                this.world.renderer.GAME_VEHICLE_GROUP));
        }

        this.pixelBounds.setTo(x, y, 32 * 6, 32 * 1);

        this.initBounds(x, y);
        this.setPos(x, y);
    }

    init(x, y, view){
    }

    onHit(obj){
        if(obj instanceof Projectile){
            obj.onHaltFire();
        }
    }

    setPos(x, y){
        super.setPos(x, y);
        this.pixelBounds.setTo(x, y, 32 * 6, 32 * 1);

        var deltaX = x - this.x;
        var deltaY = y - this.y;

        for(var i = 0; i < this.parts.length; i++){
            this.parts[i].setPositionBy(deltaX, deltaY);
        }

        this.x = x;
        this.y = y;
    }

}

class Tile {

    world: World;
    main: Main;
    view: SpriteView;
    chunk: Chunk;

    index = 0;

    xIndex = 0;
    yIndex = 0;

    size = 64;

    pixelBounds = new Phaser.Rectangle(0, 0, 0, 0);

    adjacentTiles: Tile[] = [];

    objs: GameObject[] = []; // all objs on this tile

    isNode = false;

    top = false;
    bottom = false;
    left = false;
    right = false;

    text: TextView;

    speedFactor = 1;

    frame;

    //frame_sand = //607;
    //frame_grass = //606;
    //frame_dirt = //605;

    constructor(chunk, index, x, y){
        this.world = chunk.world;
        this.chunk = chunk;
        this.main = this.world.game.main;

        //var key = '';

        /*if(index === 0){
            this.frame = Renderer.STATICSPRITE_TILE_SAND;//this.frame_sand;///'Environment/sand';
            //key = 'Environment/sand';
            this.speedFactor = 0.5;
            this.isNode = true;
        } else if(Math.random() < 0.01){
            this.frame = Renderer.STATICSPRITE_TILE_GRASS;//this.frame_grass;//'Environment/grass';
            //key = 'Environment/grass';
            this.speedFactor = 1.5;
            this.isNode = true;
        } else {
            this.frame = Renderer.STATICSPRITE_TILE_DIRT;//this.frame_dirt;//'Environment/dirt';
            //key = 'Environment/dirt';
        }*/

        this.frame = Renderer.STATICSPRITE_TILE_DIRT;
        this.isNode = false;
        this.speedFactor = 1;

        /*this.init(x, y, 
            new SpriteView(x, y, this.main, _, this.world.renderer.SPRITE_PACK_TANKS + key,
            this.world.renderer.BACKGROUND_GROUP));*/

        this.pixelBounds.setTo(
            x, y,
            this.size, this.size
        );
        this.setPos(x, y);

        this.index = index;
        this.xIndex = (x - this.chunk.pixelBounds.x) / this.size;
        this.yIndex = (y - this.chunk.pixelBounds.y) / this.size;
        this.size = this.world.tileSize;

        if(config.debugColl){
            this.text = new TextView(x + 16, y + 16, this.main, '0', font.medThin, this.world.renderer.UI_GROUP);
            this.text.element.fixedToCamera = false;
            this.text.element.addColor('#90CAF9', 0);

            this.text.setCenter(x + 32, y + 32);

            this.text.setVisible(false);
        }

        this.setVisible(false);
    }

    setAdjTiles(){
        if(this.yIndex === 0){//top
            this.top = true;
        }
        if (this.yIndex === this.chunk.sizeInTiles - 1) {//bottom
            this.bottom = true;
        }
        if(this.xIndex === 0){//left
            this.left = true;
        }
        if (this.xIndex === this.chunk.sizeInTiles - 1){//right
            this.right = true;
        }

        this.addAdjTile(0, -1);
        this.addAdjTile(1, -1);

        this.addAdjTile(1, 0);
        this.addAdjTile(1, 1);

        this.addAdjTile(0, 1);
        this.addAdjTile(-1, 1);

        this.addAdjTile(-1, 0);
        this.addAdjTile(-1, -1);

        //this.setTypeBasedOnNodes();
    }

    private addAdjTile(xOffset, yOffset){
        var tile = this.chunk.getTile(this.xIndex + xOffset, this.yIndex + yOffset);

        if(tile === _){
            //the tile is either _ or exists in another chunk
            //var chunk;

            if(xOffset === 0 && yOffset === -1){ //0

                tile = this.addMissingTile(
                    this.chunk.xIndex, this.chunk.yIndex - 1,
                    this.xIndex, this.chunk.sizeInTiles - 1
                );
            } else if (xOffset === 1 && yOffset === -1){ //1

                if(this.top && this.right){
                    tile = this.addMissingTile(
                        this.chunk.xIndex + 1, this.chunk.yIndex - 1,
                        0, this.chunk.sizeInTiles - 1
                    );
                } else if(this.top){
                    tile = this.addMissingTile(
                        this.chunk.xIndex, this.chunk.yIndex - 1,
                        this.xIndex + 1, this.chunk.sizeInTiles - 1
                    );
                } else if (this.right){
                    tile = this.addMissingTile(
                        this.chunk.xIndex + 1, this.chunk.yIndex,
                        0, this.yIndex - 1
                    );
                }

            } else if (xOffset === 1 && yOffset === 0){ //2

                if(!this.right){
                    console.log('lolwatt');
                } else {
                    tile = this.addMissingTile(
                        this.chunk.xIndex + 1, this.chunk.yIndex,
                        0, this.yIndex
                    );
                }
            } else if (xOffset === 1 && yOffset === 1){ //3

                if(this.bottom && this.right){
                    tile = this.addMissingTile(
                        this.chunk.xIndex + 1, this.chunk.yIndex + 1,
                        0, 0
                    );
                } else if (this.bottom){
                    tile = this.addMissingTile(
                        this.chunk.xIndex, this.chunk.yIndex + 1,
                        this.xIndex + 1, 0
                    );
                } else if (this.right){
                    tile = this.addMissingTile(
                        this.chunk.xIndex + 1, this.chunk.yIndex,
                        0, this.yIndex + 1
                    );
                }

            } else if (xOffset === 0 && yOffset === 1){ //4

                if(!this.bottom){
                    console.log('lolwatt');
                } else {
                    tile = this.addMissingTile(
                        this.chunk.xIndex, this.chunk.yIndex + 1,
                        this.xIndex, 0
                    );
                }
            } else if (xOffset === -1 && yOffset === 1){ //5

                if(this.left && this.bottom){
                    tile = this.addMissingTile(
                        this.chunk.xIndex - 1, this.chunk.yIndex + 1,
                        this.chunk.sizeInTiles - 1, 0
                    );
                } else if (this.left){
                    tile = this.addMissingTile(
                        this.chunk.xIndex - 1, this.chunk.yIndex,
                        this.chunk.sizeInTiles - 1, this.yIndex - 1
                    );
                } else if (this.bottom){
                    tile = this.addMissingTile(
                        this.chunk.xIndex, this.chunk.yIndex + 1,
                        this.xIndex - 1, 0
                    );
                }

            } else if (xOffset === -1 && yOffset === 0){ //6

                if(!this.left){
                    console.log('lolwatt');
                } else {
                    tile = this.addMissingTile(
                        this.chunk.xIndex - 1, this.chunk.yIndex,
                        this.chunk.sizeInTiles - 1, this.yIndex
                    );
                }
            } else if (xOffset === -1 && yOffset === -1){ //7

                if(this.top && this.left){
                    tile = this.addMissingTile(
                        this.chunk.xIndex - 1, this.chunk.yIndex - 1,
                        this.chunk.sizeInTiles - 1, this.chunk.sizeInTiles - 1
                    );
                } else if (this.top){
                    tile = this.addMissingTile(
                        this.chunk.xIndex, this.chunk.yIndex - 1,
                        this.xIndex - 1, this.chunk.sizeInTiles - 1
                    );
                } else if(this.left){
                    tile = this.addMissingTile(
                        this.chunk.xIndex - 1, this.chunk.yIndex,
                        this.chunk.sizeInTiles - 1, this.yIndex - 1
                    );
                }

            }

        }

        this.adjacentTiles.push(tile);
    }

    private addMissingTile(chunkX, chunkY, tileX, tileY){
        var chunk = this.world.getChunk(chunkX, chunkY);
        if(chunk === _){
            return _;
        }
        return chunk.getTile(tileX, tileY);
    }

    update(){

    }

    tick(){

    }

    canMove(movingObj: GameObject, dX, dY){
        movingObj.pixelBounds.x += dX;
        movingObj.pixelBounds.y += dY;

        if(movingObj.anchorCentered){
            movingObj.pixelBounds.x -= movingObj.pixelBounds.halfWidth;
            movingObj.pixelBounds.y -= movingObj.pixelBounds.halfHeight;
        }

        for(var i = 0; i < this.objs.length; i++) {
            if(this.objs[i].alive === _ || this.objs[i].alive){
                if(this.objs[i] !== movingObj
                    && this.objs[i].inBounds(movingObj.pixelBounds)) {

                    //if(!this.canMoveDoubleCheck(movingObj, this.objs[i], dX, dY)){
                    movingObj.pixelBounds.x -= dX;
                    movingObj.pixelBounds.y -= dY;

                    if (movingObj.anchorCentered) {
                        movingObj.pixelBounds.x += movingObj.pixelBounds.halfWidth;
                        movingObj.pixelBounds.y += movingObj.pixelBounds.halfHeight;
                    }

                    this.objs[i].onHit(movingObj);

                    if(this.objs[i] instanceof Man || this.objs[i] instanceof PickUp){
                        return true;
                    }// else {

                    //}

                    return false;
                }
            }
        }

        if(movingObj.anchorCentered){
            movingObj.pixelBounds.x += movingObj.pixelBounds.halfWidth;
            movingObj.pixelBounds.y += movingObj.pixelBounds.halfHeight;
        }

        movingObj.pixelBounds.x -= dX;
        movingObj.pixelBounds.y -= dY;
        return true;
    }

    private canMoveDoubleCheck(movingObj, obj, dX, dY){
        movingObj.pixelBounds.x += dX * 3;
        movingObj.pixelBounds.y += dY * 3;

        if(!obj.inBounds(movingObj.pixelBounds)){
            movingObj.pixelBounds.x -= dX * 3;
            movingObj.pixelBounds.y -= dY * 3;
            return true;
        }
        movingObj.pixelBounds.x -= dX * 3;
        movingObj.pixelBounds.y -= dY * 3;
        return false;
    }

    canAddObj(obj){
        if(this.inBounds(obj.pixelBounds)){
            for(var i = 0; i < this.objs.length; i++){
                if(this.objs[i] === obj){
                    return false;
                }
            }

            return true;
        }
        return false;
    }

    addObj(obj){
        this.objs.push(obj);
        if(config.debugColl){
            this.text.setContent(this.objs.length);
            this.text.setVisible(true); //lol
        }
    }

    removeObj(obj){
        for(var i = 0; i < this.objs.length; i++){
            if(this.objs[i] === obj){
                this.objs.splice(i, 1);
                if(config.debugColl){
                    this.text.setContent(this.objs.length);
                    if(this.objs.length === 0){
                        this.text.setVisible(false);
                        //this.view.setVisible(false);
                    }
                }

                return;
            }
        }
        console.log('this tile didn\'t have that object!');
    }

    setPos(x, y){
        if(this.view !== _){
            this.view.setPos(x, y);
        }
        this.pixelBounds.x = x;
        this.pixelBounds.y = y;
    }

    distFromTile(tile: Tile){
        return Math.sqrt(
            Math.pow((tile.pixelBounds.x - this.pixelBounds.x), 2) +
            Math.pow((tile.pixelBounds.y - this.pixelBounds.y), 2)
        );
    }

    setTypeOf(tile: Tile){
        if(this.view !== _){
            this.main.renderer.stopRender(this.frame, this.view);
            this.view = _;
        }
        this.frame = tile.frame;
        this.speedFactor = tile.speedFactor;
    }

    reset(){
        if(getRandomInt(0, 40) === 0){
            if(this.chunk.index === this.world.centerChunkIndex){
                var rand = getRandomInt(0, 1);
            } else {
                var rand = getRandomInt(0, 2);
            }
            this.isNode = true;            
            if(rand === 0){
                this.frame = Renderer.STATICSPRITE_TILE_DIRT;
                this.speedFactor = 1;
            } else if(rand === 1){
                this.frame = Renderer.STATICSPRITE_TILE_GRASS;
                this.speedFactor = 1.6;
            } else if(rand === 2){
                this.frame = Renderer.STATICSPRITE_TILE_SAND;
                this.speedFactor = 0.4;
            }
        } else {
            this.frame = Renderer.STATICSPRITE_TILE_DIRT;
            this.speedFactor = 1;
            this.isNode = false;
        }
        if(this.view !== _){
            this.main.renderer.stopRender(this.frame, this.view);
            this.view = _;
        }
        //this.frame = Renderer.STATICSPRITE_TILE_GRASS;
        //this.speedFactor = 10;
        /*if(this.view !== _){
            this.setVisible(false);
            this.setVisible(true);
        }*/
    }

    setTypeBasedOnNodes(){
        if(!this.isNode){
            var dist = 999999999;
            var closestNodeId = 0;
            for(var i = 0; i < this.world.nodeTiles.length; i++){
                if(this.distFromTile(this.world.nodeTiles[i]) < dist){
                    dist = this.distFromTile(this.world.nodeTiles[i]);
                    closestNodeId = i;                    
                }
                //dist += ((Math.random() * 66) - 33);

                //if(dist < 200){
                    //if(!(dist < 100 && dist / 100 < Math.random())){
                        //this.setTypeOf(this.world.nodeTiles[i]);
                        //if(this.view !== _){
                            //this.setVisible(false);
                            //this.setVisible(true);
                        //}
                        //break;
                    //}
                //}
            }
            this.setTypeOf(this.world.nodeTiles[closestNodeId]);

        }
    }

    setVisible(val){
        /*if(this.speedFactor !== 10 && this.frame === Renderer.STATICSPRITE_TILE_GRASS){
            console.log('err');
        }*/
        if(this.view !== _ /*&& !val*/){
            this.main.renderer.stopRender(this.frame, this.view);
            this.view = _;
        }
        if(val){
            this.view = this.main.renderer.startRender(
                this.frame, this.pixelBounds.x, this.pixelBounds.y, 
                this.world.renderer.GAME_BACKGROUND_GROUP);
        }
    }

    destroy(){
       //this.view.destroy();
        if(this.text !== _){
            this.text.destroy();
        }
    }

    inBounds(rect){
        if(this.pixelBounds.intersects(rect, 0)){
            return true;
        }
        return false;
    }
}

class Chunk{

    world: World;
    main: Main;

    tiles: Tile[] = [];
    nodeTiles: Tile[] = [];
    sizeInTiles = 0;
    sizeInPixels = 0;

    adjacentChunks = [];

    //chunk index, so 1, 2, 3 etc
    index;
    xIndex;
    yIndex;

    //pixel bounds, so multiplied by chunk size
    pixelBounds = new Phaser.Rectangle(0, 0, 0, 0);

    visible = false;

    oobWallSprites = [];
    oobWallPosX = [];
    oobWallPosY = [];
    oobWallRotation = [];

    oobTileSprites = [];
    oobTilePosX = [];
    oobTilePosY = [];

    corner = _;

    constructor(world, index, x, y){
        this.world = world;
        this.main = this.world.game.main;
        this.index = index;
        this.xIndex = x;
        this.yIndex = y;

        this.sizeInTiles = world.chunkSize;
        this.sizeInPixels = world.chunkSize * world.tileSize;

        this.pixelBounds.setTo(
            this.xIndex * this.sizeInPixels, this.yIndex * this.sizeInPixels,
            this.sizeInPixels, this.sizeInPixels
        );

        if(y === 0){

            for(var i = 0; i < this.world.chunkSize * 2; i++){
                    this.oobWallSprites.push(_);
                    this.oobWallPosX.push(32 + this.pixelBounds.x + i * 32);
                    this.oobWallPosY.push(-10);  
                    this.oobWallRotation.push(Math.PI / 2);                  
            }

            for(var i = 0; i < 4; i++){
                for(var j = 0; j < this.world.chunkSize * 2; j++){
                    this.oobTileSprites.push(_);
                    this.oobTilePosX.push(
                        -this.pixelBounds.width + this.pixelBounds.x + j * 64);
                    this.oobTilePosY.push(-64 - (i * 64));  
                }
            }

        } else if (y === this.world.size - 1){

            for(var i = 0; i < this.world.chunkSize * 2; i++){
                this.oobWallSprites.push(_);
                this.oobWallPosX.push(this.pixelBounds.x + i * 32);
                this.oobWallPosY.push(this.pixelBounds.y 
                    + this.pixelBounds.height + 10);  
                this.oobWallRotation.push(Math.PI * 1.5);                                      
            }

            var extraWidth = 0;

            if(x === this.world.size - 1){
                extraWidth = 6;
            }
            for(var i = 0; i < 4; i++){
                for(var j = 0; j < this.world.chunkSize * 2 + extraWidth; j++){
                    this.oobTileSprites.push(_);
                    this.oobTilePosX.push(
                        -this.pixelBounds.width + this.pixelBounds.x + j * 64);
                    this.oobTilePosY.push(this.pixelBounds.y 
                        + this.pixelBounds.height + (i * 64));  
                }
            }
        }

        if(x === 0){
            for(var i = 0; i < this.world.chunkSize * 2; i++){
                this.oobWallSprites.push(_);
                this.oobWallPosX.push(-10);  
                this.oobWallPosY.push(this.pixelBounds.y + i * 32);                
                this.oobWallRotation.push(0);                  
            }

            for(var i = 0; i < 6; i++){
                for(var j = 0; j < this.world.chunkSize * 2; j++){
                    this.oobTileSprites.push(_); 

                    this.oobTilePosX.push(
                        -64 - (i * 64));
                    this.oobTilePosY.push(0 + this.pixelBounds.y + j * 64);  

                }
            }

        } else if (x === this.world.size - 1){

            for(var i = 0; i < this.world.chunkSize * 2; i++){
                this.oobWallSprites.push(_);

                this.oobWallPosX.push(
                    this.pixelBounds.x + this.pixelBounds.width + 10
                );
                this.oobWallPosY.push(32 + this.pixelBounds.y + i * 32);                
                
                this.oobWallRotation.push(Math.PI);                                      
            }

            for(var i = 0; i < 6; i++){
                for(var j = 0; j < this.world.chunkSize * 2; j++){
                    this.oobTileSprites.push(_); 

                    this.oobTilePosX.push(
                        this.pixelBounds.x + this.pixelBounds.width + (i * 64));
                    this.oobTilePosY.push(
                        this.pixelBounds.y - this.pixelBounds.height + j * 64);  

                }
            }
        }


    }

    inBounds(rect){
        return this.pixelBounds.intersects(rect, 0);
    }


    update(){
        if(this.visible && !this.inBounds(this.main.phaser.camera.view)){
            for(var i = 0; i < this.tiles.length; i++){
                this.tiles[i].setVisible(false);
            }
            for(var i = 0; i < this.oobWallSprites.length; i++){
                if(this.oobWallSprites[i] !== _){
                    this.main.renderer.stopRender(Renderer.STATICSPRITE_WINDOW, 
                        this.oobWallSprites[i]);   
                    this.oobWallSprites[i] = _;                 
                }
            }
            for(var i = 0; i < this.oobTileSprites.length; i++){
                if(this.oobTileSprites[i] !== _){
                    this.main.renderer.stopRender(Renderer.STATICSPRITE_TILE_GRASS_DARK, 
                        this.oobTileSprites[i]);   
                    this.oobTileSprites[i] = _;                 
                }
            }

            if(this.corner !== _){
                this.main.renderer.stopRender(Renderer.STATICSPRITE_WINDOW_CORNER, 
                    this.corner);   
            }
            this.visible = false;
        
        } else if (!this.visible && this.inBounds(this.main.phaser.camera.view)){
            for(var i = 0; i < this.tiles.length; i++){
                this.tiles[i].setVisible(true);
            }
            for(var i = 0; i < this.oobWallSprites.length; i++){
                if(this.oobWallSprites[i] === _){
                    this.oobWallSprites[i] = this.main.renderer.startRender(
                        Renderer.STATICSPRITE_WINDOW, 
                        this.oobWallPosX[i], this.oobWallPosY[i], 
                        this.world.renderer.GAME_VEHICLE_GROUP);
                    this.oobWallSprites[i].element.rotation = this.oobWallRotation[i];            
                }
            }
            
            for(var i = 0; i < this.oobTileSprites.length; i++){
                if(this.oobTileSprites[i] === _){
                    this.oobTileSprites[i] = this.main.renderer.startRender(
                        Renderer.STATICSPRITE_TILE_GRASS_DARK, 
                        this.oobTilePosX[i], this.oobTilePosY[i], 
                        this.world.renderer.GAME_BACKGROUND_GROUP);          
                }
            }

            if(this.xIndex === 0 && this.yIndex === 0){
                this.corner = this.main.renderer.startRender(
                    Renderer.STATICSPRITE_WINDOW_CORNER, 
                    -10, 0, 
                    this.world.renderer.GAME_VEHICLE_GROUP);
                this.corner.element.rotation = Math.PI * 1.5;
            } else if (this.xIndex === 0 && this.yIndex === this.world.size - 1){
                this.corner = this.main.renderer.startRender(
                    Renderer.STATICSPRITE_WINDOW_CORNER, 
                    0, this.pixelBounds.y + this.pixelBounds.height + 10, 
                    this.world.renderer.GAME_VEHICLE_GROUP);
                this.corner.element.rotation = Math.PI;
            } else if (this.xIndex === this.world.size - 1 && this.yIndex === 0){
                this.corner = this.main.renderer.startRender(
                    Renderer.STATICSPRITE_WINDOW_CORNER, 
                    this.pixelBounds.x + this.pixelBounds.width, -10, 
                    this.world.renderer.GAME_VEHICLE_GROUP);
                this.corner.element.rotation = 0;
            } else if (this.xIndex === this.world.size - 1 && this.yIndex === this.world.size - 1){
                this.corner = this.main.renderer.startRender(
                    Renderer.STATICSPRITE_WINDOW_CORNER, 
                    this.pixelBounds.x + this.pixelBounds.width + 10,
                    this.pixelBounds.y + this.pixelBounds.height, 
                    this.world.renderer.GAME_VEHICLE_GROUP);
                this.corner.element.rotation = Math.PI / 2;
            }

            this.visible = true;
            
        }

    }

    tick(){
        /*for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].tick();
        }*/
    }

    forceInvisible(){
        this.visible = false;
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].setVisible(false);
        }
    }

    build(){
        for(var y = 0; y < this.sizeInTiles; y++){
            for(var x = 0; x < this.sizeInTiles; x++){
                this.tiles.push(new Tile(this,
                    x + y * this.sizeInTiles,
                    this.xIndex * this.sizeInPixels + x * this.world.tileSize,
                    this.yIndex * this.sizeInPixels + y * this.world.tileSize));
                if(this.tiles[this.tiles.length - 1].isNode){
                    this.nodeTiles.push(this.tiles[this.tiles.length - 1]);
                }
            }
        }
    }

    setAdjTiles(){

        var x;
        var y;

        for(var i = 0; i < this.world.chunks.length; i++){
            if(this.world.chunks[i].index !== this.index){
                x = this.world.chunks[i].xIndex;
                y = this.world.chunks[i].yIndex;

                if(Math.abs(this.xIndex - x) < 2 && Math.abs(this.yIndex - y) < 2){
                    this.adjacentChunks.push(this.world.chunks[i]);                    
                } else if (Math.abs(this.yIndex - y) < 2 && Math.abs(this.xIndex - x) < 2){
                    this.adjacentChunks.push(this.world.chunks[i]);                                        
                }
            }
        }

        /*console.log('chunk ' + this.index + ':');
        var str = '';
        for(var i = 0; i < this.adjacentChunks.length; i++){
            str += this.adjacentChunks[i].index + ' ';
        }            
        console.log(str);*/


        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].setAdjTiles();
        }
    }

    setVisible(val){
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].setVisible(val);
        }
    }

    isFree(x, y){
        return (this.getTile(x, y).objs.length === 0);
    }

    getFreeTile(){
        var randX;
        var randY;
        for(var y = 0; y < this.sizeInTiles; y++){
            for(var x = 0; x < this.sizeInTiles; x++){
                randX = getRandomInt(0, this.world.chunkSize - 1);
                randY = getRandomInt(0, this.world.chunkSize - 1);
                if(this.isFree(randX, randY)){
                    return this.getTile(randX, randY);
                }
            }
        }
    }

    getFreeMiddle(){
        var randX;
        var randY;
        for(var y = 0; y < this.sizeInTiles; y++){
            for(var x = 0; x < this.sizeInTiles; x++){
                randX = getRandomInt(1, this.world.chunkSize - 2);
                randY = getRandomInt(1, this.world.chunkSize - 2);
                if(this.isFree(randX, randY)){
                    return this.getTile(randX, randY);
                }
            }
        }
    }

    reset(){
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].reset();
        }
        this.nodeTiles = [];

        for(var i = 0; i < this.tiles.length; i++){
            if(this.tiles[i].isNode){
                this.nodeTiles.push(this.tiles[i]);
            }
        }
    }

    setTypes(){
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].setTypeBasedOnNodes();
        }
    }

    

    getTile(x, y){
        if(x < 0 || x > this.sizeInTiles - 1 || y < 0 || y > this.sizeInTiles - 1){
            return _;
        }
        return this.tiles[x + y * this.sizeInTiles];
    }

    destroy(){
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].destroy();
        }
    }

}

class World{

    game: Game;
    main: Main;
    renderer: Renderer;

    worldBounds: Phaser.Rectangle = new Phaser.Rectangle(0, 0, 0, 0);

    chunks: Chunk[] = [];
    nodeTiles: Tile[] = [];

    size = 9; //in chunks. 5x5 chunks === 75x75 tiles
    chunkSize = 8;
    centerChunkIndex;
    tileSize = 64;

    tanksAmount = 9;

    player: Player;
    garage: Garage;

    menPool: Man[] = [];
    activeMen: Man[] = [];

    enemyTanksPool: EnemyTank[] = [];
    activeEnemyTanks: EnemyTank[] = [];

    cratesPool: PickUp[] = [];
    activeCrates: PickUp[] = [];    

    rankings = [];
    private rankingsString = '';
    private rankingsNamesString = '';
    private rankingsScoresString = '';
    private topPlayer;
    
    cpuNameCounter = 0;

    stopping = false;
    stoppingCounter = 0;

    constructor(game){
        this.game = game;
        this.main = game.main;
        this.renderer = game.main.renderer;

        this.centerChunkIndex = Math.floor((this.size * this.size) / 2);
    }

    update(){
        this.player.update();
        
        if(this.stopping){
            if(this.stoppingCounter > 60){
                this.game.stop();
                return;
            } 
            this.stoppingCounter++;
        }

        if(this.player.health <= 0 && !this.stopping){
            //this.game.stop();
            this.stopping = true;
            return;
        }

        for(var i = 0; i < this.activeEnemyTanks.length; i++){
            this.activeEnemyTanks[i].update();
        }

        for(var i = 0; i < this.activeMen.length; i++){
            this.activeMen[i].update();
        }

        for(var i = 0; i < this.activeCrates.length; i++){
            this.activeCrates[i].update();
        }

        this.main.phaser.camera.setPosition(
            this.player.getX() - res.width / 2,
            this.player.getY() - res.height / 2
        );

        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].update();
        }
    }

    tick(){
        this.player.tick();

        //tanks
        for(var i = 0; i < this.activeEnemyTanks.length; i++){
            this.activeEnemyTanks[i].tick();
            if(this.activeEnemyTanks[i].canBeRemoved){

                for(var j = 0; j < this.rankings.length; j++){
                    if(this.activeEnemyTanks[i] === this.rankings[j]){
                        this.rankings.splice(j, 1);
                        break;
                    }
                }

                this.spawnMan(this.activeEnemyTanks[i].tiles[0].chunk,
                    this.activeEnemyTanks[i].tiles[0]);
                this.activeEnemyTanks[i].onRemove();
                this.enemyTanksPool.push(this.activeEnemyTanks[i]);
                this.activeEnemyTanks.splice(i, 1);

                this.updateRanking();

                break;
            }
        }

        if(/*this.activeEnemyTanks.length < 5 && */this.enemyTanksPool.length > 0){
            var rand = getRandomInt(0, this.chunks.length - 1);

            var newTile: Tile = this.chunks[rand].getFreeTile();

            this.enemyTanksPool[0].reset(this.chunks[rand],
                newTile.pixelBounds.x, newTile.pixelBounds.y,
            );
            this.cpuNameCounter++;
            
            this.enemyTanksPool[0].setName('cpu ' + this.cpuNameCounter);

            this.activeEnemyTanks.push(this.enemyTanksPool[0]);
            this.rankings.push(this.enemyTanksPool[0]);            
            this.enemyTanksPool.splice(0, 1);

            for(var i = 0; i < this.activeEnemyTanks.length; i++){
                this.activeEnemyTanks[i].onAddAi(this.activeEnemyTanks);
            }

            this.updateRanking();
        }

        //mans

        for(var i = 0; i < this.activeMen.length; i++){
            this.activeMen[i].tick();
            if(this.activeMen[i].canBeRemoved){
                this.activeMen[i].onRemove();
                this.menPool.push(this.activeMen[i]);
                this.activeMen.splice(i, 1);
                break;
            }
        }

        if(this.activeMen.length < this.chunks.length - this.tanksAmount
             && this.menPool.length > 0){
            var rand = getRandomInt(0, this.chunks.length - 1);

            this.spawnMan(this.chunks[rand], this.chunks[rand].getFreeMiddle());
        }

        //crate

        for(var i = 0; i < this.activeCrates.length; i++){
            this.activeCrates[i].tick();
            if(this.activeCrates[i].canBeRemoved){
                this.activeCrates[i].onRemove();
                this.cratesPool.push(this.activeCrates[i]);
                this.activeCrates.splice(i, 1);
                break;
            }
        }

        if(this.activeCrates.length < this.chunks.length - this.tanksAmount
            && this.cratesPool.length > 0){
           var rand = getRandomInt(0, this.chunks.length - 1);
           //rand = 0;

           this.spawnCrate(this.chunks[rand], this.chunks[rand].getFreeMiddle());
           //console.log('crate spawned, am: ' + this.activeCrates.length);
       }

    }

    updateRanking(){
        this.topPlayer = this.rankings[0].name;
        this.rankings.sort(function(a, b){
            return (b.score - a.score);
        });

        this.rankingsString = '';
        this.rankingsNamesString = '';
        this.rankingsScoresString = '';
        
        for(var i = 0; i < this.rankings.length; i++){
            this.rankingsString += (i + 1) + '\n';

            this.rankingsNamesString += this.rankings[i].name + '\n';

            if(i > 0){
                this.rankingsScoresString += 
                formatNumberWithZeroes(
                    this.rankings[i].score, 
                    this.rankings[0].score.toString().length
                                    ) + '\n';                
            } else {
                this.rankingsScoresString += this.rankings[i].score + '\n';                
            }
        }

        if(this.topPlayer !== this.rankings[0].name){
            this.game.inGameUI.updateRankings(this.rankingsString,
                this.rankingsNamesString, this.rankingsScoresString, 
                this.rankings[0].score, this.rankings[0], true);
        } else {
            this.game.inGameUI.updateRankings(this.rankingsString,
                this.rankingsNamesString, this.rankingsScoresString, 
                this.rankings[0].score, _, false);
        }

    }

    onKill(killer, target, type){
        if(killer === _){
            this.game.inGameUI.showGameMessage(target.name + ' died!');
        } else {
            if(type === _ || type === Projectile.TYPE_NORMAL){
                this.game.inGameUI.showGameMessage(
                    killer.name + ' took out ' + target.name + '!');
            } else if(type === Projectile.TYPE_FIRE){
                this.game.inGameUI.showGameMessage(
                    killer.name + ' burnt down ' + target.name + '!');
            } else if(type === Projectile.TYPE_EXPLOSIVE){
                this.game.inGameUI.showGameMessage(
                    killer.name + ' blew up ' + target.name + '!');
            }
        }
    }

    spawnMan(chunk, tile){
        if(this.menPool.length === 0){
            return;
        }

        var newTile: Tile = tile;

        this.menPool[0].reset(chunk,
            newTile.pixelBounds.x,
            newTile.pixelBounds.y
        );
        this.activeMen.push(this.menPool[0]);
        this.menPool.splice(0, 1);
    }

    spawnCrate(chunk, tile){
        if(this.cratesPool.length === 0){
            return;
        }
        var newTile: Tile = tile;

        this.cratesPool[0].spawn(chunk,
            newTile.pixelBounds.x,
            newTile.pixelBounds.y
        );
        this.activeCrates.push(this.cratesPool[0]);
        this.cratesPool.splice(0, 1);
    }

    onRestart(){
        this.stopping = false;
        this.stoppingCounter = 0;

        this.cpuNameCounter = 0;
        this.player.health = 100;
        this.player.reset(this.player.chunk, this.player.getX(), this.player.getY());

        //this.resetTiles();

        while(this.activeEnemyTanks.length > 0){
            for(var i = 0; i < this.activeEnemyTanks.length; i++){
                for(var j = 0; j < this.rankings.length; j++){
                    if(this.activeEnemyTanks[i] === this.rankings[j]){
                        this.rankings.splice(j, 1);
                        break;
                    }
                }
                this.activeEnemyTanks[i].removeProjectiles();
                this.activeEnemyTanks[i].onRemove();
                this.enemyTanksPool.push(this.activeEnemyTanks[i]);
                this.activeEnemyTanks.splice(i, 1);
            }      
        }

        while(this.activeMen.length > 0){
            for(var i = 0; i < this.activeMen.length; i++){
                this.activeMen[i].onRemove();
                this.menPool.push(this.activeMen[i]);
                this.activeMen.splice(i, 1);
                break;
            }
        }

        while(this.activeCrates.length > 0){
            for(var i = 0; i < this.activeCrates.length; i++){
                this.activeCrates[i].onRemove();
                this.cratesPool.push(this.activeCrates[i]);
                this.activeCrates.splice(i, 1);
                break;
            }
        }

        for(var i = 0; i < this.enemyTanksPool.length; i++){
            this.enemyTanksPool[i].removeTracks();
        }

        while(this.enemyTanksPool.length > 0){
            var rand = getRandomInt(0, this.chunks.length - 1);
            if(rand === this.player.chunk.index){
                rand = 0;
            }
            
            var newTile: Tile = this.chunks[rand].getFreeTile();

            this.enemyTanksPool[0].reset(this.chunks[rand],
                newTile.pixelBounds.x, newTile.pixelBounds.y,
            );
            this.cpuNameCounter++;
            
            this.enemyTanksPool[0].setName('cpu ' + this.cpuNameCounter);

            this.activeEnemyTanks.push(this.enemyTanksPool[0]);
            this.rankings.push(this.enemyTanksPool[0]);            
            this.enemyTanksPool.splice(0, 1);

            for(var i = 0; i < this.activeEnemyTanks.length; i++){
                this.activeEnemyTanks[i].onAddAi(this.activeEnemyTanks);
            }
        }

        this.updateRanking();

    }

    build(){
        for(var y = 0; y < this.size; y++){
            for(var x = 0; x < this.size; x++){
                this.chunks.push(new Chunk(this, x + y * this.size,
                    x, y));
            }
        }

        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].build();
            Array.prototype.push.apply(this.nodeTiles, this.chunks[i].nodeTiles);
        }

        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].setAdjTiles();
        }

        for(var i = 0; i < 1; i++){
            this.resetTiles();        
        }

        this.worldBounds.setTo(0, 0,
            this.size * this.chunkSize * this.tileSize,
            this.size * this.chunkSize * this.tileSize);

        var oobSize = res.height;//10;

        this.main.phaser.world.setBounds(0 - oobSize, 0 - oobSize,
            this.size * this.chunkSize * this.tileSize + oobSize * 2,
            this.size * this.chunkSize * this.tileSize + oobSize * 2);


        this.main.phaser.camera.setPosition(
            this.main.phaser.world.centerX - res.width / 2,
            this.main.phaser.world.centerY - res.height / 2
        );

        this.player = new Player(
            this.chunks[this.centerChunkIndex],
            this.main.phaser.world.centerX,
            this.main.phaser.world.centerY
        );
        this.rankings.push(this.player);

        //this.garage = new Garage(this.chunks[0], 256, 256);

        this.player.setCenter(this.main.phaser.world.centerX, this.main.phaser.world.centerY);


        for(var i = 0; i < this.tanksAmount; i++){
            this.enemyTanksPool.push(new EnemyTank(this.chunks[i],
                this.chunks[i].pixelBounds.x + ((Math.random() * 0.8) + 0.1)
                * this.chunks[i].pixelBounds.width,
                this.chunks[i].pixelBounds.y + ((Math.random() * 0.8) + 0.1)
                * this.chunks[i].pixelBounds.height
            ));
            this.enemyTanksPool[this.enemyTanksPool.length - 1].initAi(
                this.player);
            this.enemyTanksPool[this.enemyTanksPool.length - 1].onRemove();
        }

        for(var i = 0; i < this.chunks.length; i++){
            this.menPool.push(new Man(this.chunks[i],
                this.chunks[i].pixelBounds.x + ((Math.random() * 0.8) + 0.1)
                * this.chunks[i].pixelBounds.width,
                this.chunks[i].pixelBounds.y + ((Math.random() * 0.8) + 0.1)
                * this.chunks[i].pixelBounds.height
            ));
            this.menPool[this.menPool.length - 1].initAi(
                this.player);
            this.menPool[this.menPool.length - 1].onRemove();
        }

        for(var i = 0; i < this.tanksAmount; i++){
            this.cratesPool.push(new PickUp(this.chunks[i], 
                this.chunks[i].pixelBounds.x + ((Math.random() * 0.8) + 0.1)
            * this.chunks[i].pixelBounds.width,
            this.chunks[i].pixelBounds.y + ((Math.random() * 0.8) + 0.1)
            * this.chunks[i].pixelBounds.height));


        }


    }

    resetTiles(){

       this.nodeTiles = [];        
        //var length = 0;
        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].reset();
            for(var j = 0; j < this.chunks[i].tiles.length; j++){
                if(this.chunks[i].tiles[j].isNode){
                    this.nodeTiles.push(this.chunks[i].tiles[j]);
                }
            }
            //Array.prototype.push.apply(this.nodeTiles, this.chunks[i].nodeTiles);  
            //length += this.chunks[i].nodeTiles.length;       
        }
        console.log(this.nodeTiles.length + ' ' + length);

        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].setTypes();
        }

        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].forceInvisible();
        }

        var yes = 0;
        
        for(var i = 0; i < this.chunks.length; i++){
            for(var j = 0; j < this.chunks[i].tiles.length; j++){
                if(this.chunks[i].tiles[j].isNode){
                    yes++;
                }
            }
        }
        console.log(yes);
    }

    getChunk(x, y){
        if(x < 0 || x > this.size - 1 || y < 0 || y > this.size - 1){
            return _;
        }
        return this.chunks[x + y * this.size];
    }
/*
    destroy(){
        for(var i = 0; i < this.chunks.length; i++){
            this.chunks[i].destroy();
        }
        for(var i = 0; i < this.enemyTanksPool.length; i++){
            this.enemyTanksPool[i].destroy();
        }
        for(var i = 0; i < this.menPool.length; i++){
            this.menPool[i].destroy();
        }
        for(var i = 0; i < this.activeEnemyTanks.length; i++){
            this.activeEnemyTanks[i].destroy();
        }
        for(var i = 0; i < this.activeMen.length; i++){
            this.activeMen[i].destroy();
        }
    } */   
}
