/// <reference path="root.ts"/>
/// <reference path="game.ts"/>
/// <reference path="main.ts"/>

class View {

    element = _;
    group = _;

    x = 0;
    y = 0;
    x1 = 0;
    y1 = 0;
    width = 0;
    height = 0;

    constructor(x, y, group){
        this.setPos(x, y);
        this.group = group;
    }

    setFixedToCamera(val){
        this.element.fixedToCamera = val;
    }

    setPos(x, y){
        this.x = x;
        this.y = y;
        if(this.element !== _){
            if(this.element.fixedToCamera){
                this.element.fixedToCamera = false;
                this.element.x = x;
                this.element.y = y;
                this.element.fixedToCamera = true;
            } else {
                this.element.x = x;
                this.element.y = y;
            }
            this.width = this.element.width;
            this.height = this.element.height;
        }
        this.x1 = this.x + this.width;
        this.y1 = this.y + this.height;
    }

    setCenterScreen(){
        this.setPos(
            Math.floor(res.width / 2 - this.width / 2),
            Math.floor(res.height / 2 - this.height / 2)
        );
    }

    setCenter(x, y){
        this.setPos(
            Math.floor(x - this.width / 2),
            Math.floor(y - this.height / 2));
    }

    setX(x){
        this.setPos(x, this.y);
    }

    setY(y){
        this.setPos(this.x, y);
    }

    setPositionBy(x, y){
        this.setPos(this.x + x, this.y + y);
    }

    setXBy(x){
        this.setPos(this.x + x, this.y);
    }

    setYBy(y){
        this.setPos(this.x, this.y + y);
    }

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    getCenterX(){
        return this.x + this.width / 2;
    }

    getCenterY(){
        return this.y + this.height / 2;
    }

    isVisible(){
        return this.element.visible;
    }

    contains(x, y){
        return (x >= this.x && x <= this.x1 && y >= this.y && y <= this.y1);
    }

    setVisible(visible){
        if(this.element !== _){
            this.element.visible = visible;
        }
    }

    setAlpha(a: number){
        this.element.alpha = a;
    }

    destroy() {
        this.element.destroy();
    }

}

class TextView extends View {

    content = '';
    style;

    main: Main;

    shadow = false;

    constructor(x, y, main: Main, content, style, group){
        super(x, y, group);
        this.main = main;
        //console.log(this.main);
        this.content = content;
        this.style = style;
        this.element = this.main.phaser.add.text(x, y, content, style, group);
        this.element.fixedToCamera = true;
        this.setPos(x, y);
        this.setShadow(true);

        var context = this;

        /*if(Main.timeSinceLoad() < 3000){
            setTimeout(function(){
                var fixed = context.element.fixedToCamera;
                //var render = context.element.renderable;
                var visible = context.element.visible;
               // console.log('1 ' + render);
                context.element.destroy();
                context.element = context.main.phaser.add.text(
                    context.x, context.y,
                    context.content, context.style, context.group);
                context.element.fixedToCamera = fixed;
                context.setShadow(context.shadow);
                context.setVisible(visible);
                context.setPos(context.x, context.y);
                //context.element.renderable = render;
                //console.log('2 ' + context.element.renderable);
            }, 3000);
        }*/
    }

    setContent(content){
        this.content = content;
        this.element.text = content;
        this.setPos(this.x, this.y);
    }

    /*setSize(val){
        this.element.fontSize = val;
        this.setShadow(this.shadow);
    }*/

    getContent(){
        return this.content;
    }

    setShadow(val){
        this.shadow = val;
        if(val){
            var color = '#212121';
            if(this.style.fill !== '#ffffff'){
                color = '#9e9e9e';
            }
            this.element.setShadow(Math.floor(this.element.fontSize / 10),
                Math.floor(this.element.fontSize / 10), color, 0, true, true);
        } else {
            this.element.setShadow(_, _, _, _, _);
        }
    }
}

class SpriteView extends View {

    key = '';

    main: Main;

    private arrayIndex = -1;

    constructor(x, y, main: Main, spriteAtlas, key, group){
        super(x, y, group);
        this.main = main;
        this.key = key;
        if(spriteAtlas === _){
            spriteAtlas = 'game';
            //console.log('no atlas: ' + key);
        }
        if(spriteAtlas !== 'none'){
            this.element = this.main.phaser.add.sprite(x, y, spriteAtlas, key, group);            
        } else {
            //console.log(key);
            this.element = this.main.phaser.add.sprite(x, y, key, _, group);    
            //console.log(this.element.width);        
        }
        this.setScale(0.5);
        //console.log(this.element);
    }

    setScale(val){
        this.element.scale.set(val);
        this.setPos(this.x, this.y);
    }

    rotate(rad){
        this.element.rotation += rad;
    }

    setFrame(frame){
        this.element.frame = frame;
    }

    setGroup(group: Phaser.Group){
        if(this.group !== group){
            if(this.group !== _){
                this.group.remove(this.element);
            }
            this.group = group;
            this.group.add(this.element);
        }
    }

    //protected colorIndex = getRandomInt(0, 4);
    /*colors: [
        "#2196f3", "#f44336", "4caf50", "#ffeb3b", "#673ab7"
    ]*/
    
    setColor(color){
        this.element.tint = parseInt(color.replace(/^#/, ''), 16); 
        /*this.colorIndex++;
        if(this.colorIndex === 5){
            this.colorIndex = 0;
        }
        if(!Main.development){
            //this.phGame.load.crossOrigin = "Anonymous";
            try {
                this.backgroundImg.view.tint = parseInt(
                    colors.game.guitar[this.colorIndex].replace(/^#/, ""), 16);
            }catch(e){
                //console.error();
            }
        }*/
    }

    removeColor(){
        this.element.tint = 0xFFFFFF;
    }


    setArrayIndex(val){
        this.arrayIndex = val;
    }

    getArrayIndex(){
        return this.arrayIndex;
    }
}

class ButtonView extends View {

    key = '';

    context;

    main: Main;

    constructor(x, y, main: Main, spriteAtlas, key, group, callback, ctxt){
        super(x, y, group);
        this.main = main;
        this.key = key;
        if(spriteAtlas === _){
            spriteAtlas = 'game';
        }

        this.context = this;

        this.element = this.main.phaser.add.button(x, y, 
            spriteAtlas, callback, ctxt, key, key, key, key, group);
        this.element.group = group;

        this.element.onInputDown.add(
            this.onInputDown, this
        );

        this.element.onInputUp.add(
            this.onInputUp, this
        );

        this.element.onInputOver.add(
            this.onInputOver, this
            
        );

        this.element.onInputOut.add(
            this.onInputOut, this
            
        );

        this.element.input.useHandCursor = false;

        //        this.main.phaser.canvas.style.cursor = 'none';

        this.setFixedToCamera(true);      
        this.setPos(this.x, this.y);        
        //this.setScale(0.5);
    }

    private onInputDown() {
        if(this.key !== this.main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button12'){
            this.setYBy(4);            
        }
        this.main.soundManager.playSound(SoundManager.SOUND_CLICK, 0.3);
        //this.main.phaser.canvas.style.cursor = 'none';                    
    }

    private onInputUp() {
        if(this.key !== this.main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button12'){
            this.setYBy(-4);            
        }
        //this.main.phaser.canvas.style.cursor = 'none';                    
    }

    private onInputOver() {
        this.main.input.setMouseUI();        
    }
      
    private onInputOut() {
        if(this.main.game.state === this.main.game.STATE_GAME){
            this.main.input.setMouseInGame();            
        }        
    }      

    setFrames(over, out, down, up){
        this.element.setFrames(over, out, down, up);
        this.element.group = this.group;        
    }

}

class MultiView {

    views = [];
    group = _;

    x = 0;
    y = 0;
    x1 = 0;
    y1 = 0;
    width = 0;
    height = 0;


    constructor(x, y, group){
        this.setPos(x, y);
        this.group = group;
    }

    setFixedToCamera(val){
        for(var i = 0; i < this.views.length; i++){
            this.views[i].setFixedToCamera(val);
        }
    }

    setPos(x, y){
        var deltaX = x - this.x;
        var deltaY = y - this.y;

        for(var i = 0; i < this.views.length; i++){
            this.views[i].setPositionBy(deltaX, deltaY);
        }

        this.x = x;
        this.y = y;
        this.x1 = this.x + this.width;
        this.y1 = this.y + this.height;
    }

    setCenterScreen(){
        this.setPos(
            res.width / 2 - this.width / 2,
            res.height / 2 - this.height / 2
        );
    }

    setCenter(x, y){
        this.setPos(x - this.width / 2, y - this.height / 2);
    }

    setX(x){
        this.setPos(x, this.y);
    }

    setY(y){
        this.setPos(this.x, y);
    }

    setPositionBy(x, y){
        this.setPos(this.x + x, this.y + y);
    }

    setXBy(x){
        this.setPos(this.x + x, this.y);
    }

    setYBy(y){
        this.setPos(this.x, this.y + y);
    }

    getX(){
        return this.x;
    }

    getY(){
        return this.y;
    }

    getCenterX(){
        return this.x + this.width / 2;
    }

    getCenterY(){
        return this.y + this.height / 2;
    }

    isVisible(){
        return this.views[0].element.visible;
    }

    setVisible(visible){
        for(var i = 0; i < this.views.length; i++){
            this.views[i].setVisible(visible);
        }
    }

    setAlpha(a: number){
        for(var i = 0; i < this.views.length; i++){
            this.views[i].setAlpha(a);
        }
    }

    contains(x, y){
        return (x >= this.x && x <= this.x1 && y >= this.y && y <= this.y1);
    }

    destroy() {
        for(var i = 0; i < this.views.length; i++){
            this.views[i].destroy();
        }
    }

}

class UIPanel extends MultiView{

    private cropRect = new Phaser.Rectangle(0, 0, 0, 0);

    private main: Main;

    textViews: TextView[] = [];

    currentType;
    currentKey = '';

    static TYPE_METALPANEL = 0;
    static TYPE_GLASSPANEL = 1;

    //in px
    panelWidthPx;
    panelHeightPx;
    panelcutOffPx;

    //in panels
    panelWidth;
    panelHeight;

    setCornerTopLeft = false;
    setCornerBottomLeft = false;
    setCornerTopRight = false;
    setCornerBottomRight = false;

    constructor(x, y, group, type){
        super(x, y, group);
        this.currentType = type;
        if(type === UIPanel.TYPE_METALPANEL || type === UIPanel.TYPE_GLASSPANEL){
            this.panelWidthPx = 100;
            this.panelHeightPx = 100;
            this.panelcutOffPx = 14;
            this.currentKey = this.getViewString();
        }
    }

    build(panelWidth, panelHeight, main, setcorners){
        this.main = main;
        this.panelWidth = panelWidth;
        this.panelHeight = panelHeight;
        this.setCornerTopLeft = setcorners[0];
        this.setCornerBottomLeft = setcorners[1];
        this.setCornerTopRight = setcorners[2];
        this.setCornerBottomRight = setcorners[3];
        if(panelWidth === 1 && panelHeight === 1){
            this.views.push(new SpriteView(this.x, this.y, main,
                main.renderer.SPRITE_SHEET_UI,
                main.renderer.SPRITE_PACK_UI_SPACE + this.currentKey,
                this.group));
        } else {
            var x = 0;
            var y = 0;

            for(var i = 0; i < panelWidth; i++){
                for(var j = 0; j < panelHeight; j++){

                    if(i === 0){
                        if(j === 0){
                            this.addPanel(x, y, false, false, true, true);
                        } else if (j === panelHeight - 1){
                            this.addPanel(x, y, false, true, true, false);
                        } else {
                            this.addPanel(x, y, false, true, true, true);
                        }

                    } else if (i === panelWidth - 1){
                        if(j === 0){
                            this.addPanel(x, y, true, false, false, true);
                        } else if (j === panelHeight - 1){
                            this.addPanel(x, y,  true, true, false, false);
                        } else {
                            this.addPanel(x, y,  true, true, false, true);
                        }
                    } else {
                        if(j === 0){
                            this.addPanel(x, y, true, false, true, true);
                        } else if (j === panelHeight - 1){
                            this.addPanel(x, y,  true, true, true, false);
                        } else {
                            this.addPanel(x, y,  true, true, true, true);
                        }
                    }

                    y += (this.panelHeightPx - this.panelcutOffPx);
                    if(j > 0){
                        y -= this.panelcutOffPx;
                    }

                }
                x += (this.panelWidthPx - this.panelcutOffPx);
                if(i > 0){
                    x -= this.panelcutOffPx;
                }
                y = 0;
            }

            this.width = this.x + 
            (this.panelWidthPx - this.panelcutOffPx * 2) * panelWidth + this.panelcutOffPx;
            this.height = this.y + 
            (this.panelHeightPx - this.panelcutOffPx * 2) * panelHeight + this.panelcutOffPx;
            this.setPos(this.x, this.y);
        }
    }

    /*private setPanelManually(x, y, key){
        //var view = this.views[y * this.panelHeight + x];
        var view = this.views[x * this.panelHeight + y];

       // this.frame = tile.frame;

        view.element.animations.frame = key;
        console.log(view);
       // this.speedFactor = tile.speedFactor;
    }*/

    /*setAllCorners(){
        this.setCorner(0, 0);
        this.setCorner(0, 1);
        this.setCorner(1, 0);
        this.setCorner(1, 1);
    }

    setCorner(x, y){
        if(this.currentType === UIPanel.TYPE_GLASSPANEL){
            if(x === 0 && y === 0){
                this.setPanelManually(0, 0, 146);
            } else if(x === 0 && y === 1){
                this.setPanelManually(0, this.panelHeight - 1, 143);
            } else if(x === 1 && y === 0){
                this.setPanelManually(this.panelWidth - 1, 0, 147);
            } else if(x === 1 && y === 1){
                this.setPanelManually(this.panelWidth - 1, this.panelHeight - 1, 144);
            }
        }
    }*/

    private addPanel(xOffset, yOffset, left, top, right, bottom){
        var key = this.currentKey;
        if(this.currentType === UIPanel.TYPE_GLASSPANEL){
            if(this.setCornerTopLeft && !left && !top){
                if((this.panelHeight === 1 && this.setCornerBottomLeft)
                    || (this.panelWidth === 1 && this.setCornerTopRight)){
                    key = 'glassPanel_corners';
                } else {
                    key = 'glassPanel_cornerTL';
                }
            } else if(this.setCornerBottomLeft && !left && !bottom){
                key = 'glassPanel_cornerBL';
            } else if(this.setCornerTopRight 
                && ((!right && !top) || (top && this.panelWidth === 1))){

                if(this.panelHeight === 1 && this.setCornerBottomRight){
                    key = 'glassPanel_corners';
                } else {
                    key = 'glassPanel_cornerTR';
                }
            } else if(this.setCornerBottomRight && !right && !bottom){
                key = 'glassPanel_cornerBR';
            }
        }

        if(this.setCornerTopRight && this.panelWidth === 1 && top){
            //console.log();
        }

        this.views.push(new SpriteView(this.x + xOffset, this.y + yOffset, this.main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + key,
            this.group));

        this.views[this.views.length - 1].setScale(1);
        this.views[this.views.length - 1].setFixedToCamera(true);
        if(this.panelHeight === 1){
            bottom = false;
        }
        if(this.panelWidth === 1){
            left = false;
            right = false;
        }

        this.crop(this.views[this.views.length - 1], left, top, right, bottom);
        //}
    }

    private crop(view, left, top, right, bottom){
        if(left){
            this.cropRect.x = this.panelcutOffPx;
        } else {
            this.cropRect.x = 0;
        }
        if(top){
            this.cropRect.y = this.panelcutOffPx;
        } else {
            this.cropRect.y = 0;
        }
        if(right){
            this.cropRect.width = view.width / view.element.scale.x - this.panelcutOffPx - this.cropRect.x;
        } else {
            this.cropRect.width = view.width / view.element.scale.x - this.cropRect.x;
        }
        if(bottom){
            this.cropRect.height = view.height / view.element.scale.y - this.panelcutOffPx - this.cropRect.y;
        } else {
            this.cropRect.height = view.height / view.element.scale.y - this.cropRect.y;
        }

        view.element.crop(this.cropRect);
    }

    getViewString(){
        switch (this.currentType){
            case UIPanel.TYPE_METALPANEL:
                return 'metalPanel';
            case UIPanel.TYPE_GLASSPANEL:
                return 'glassPanel';
        }
    }
}

class ProgressBar {

    main;
    x;
    y;
    group;

    left;

    bgLeft;
    bgMids = [];
    bgRight;

    fgLeft;
    fgMids = [];
    fgRight;

    color;

    currentPercentage = 100;
    targetPercentage = 100;

    private currentSegment = 5;

    private cropRect = new Phaser.Rectangle(0, 0, 0, 0);

    setFgInvisible = false;

    constructor(x, y, color, group, main){
        this.x = x;
        this.y = y;
        this.group = group;
        this.main = main;
        this.color = color;

        this.bgLeft = new SpriteView(this.x, this.y, main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + this.getKey('shadow', 'left'),
            this.group);

        this.bgLeft.setScale(1);
        this.bgLeft.setFixedToCamera(true);

        for(var i = 0; i < 6; i++){
            this.bgMids.push(new SpriteView(this.x + 6 + i * 16, this.y, main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + this.getKey('shadow', 'mid'),
            this.group));

            this.bgMids[i].setScale(1);
            this.bgMids[i].setFixedToCamera(true);

            if(i === 5){
                this.crop(this.bgMids[i], 8);
            }
        }
        
        this.bgRight = new SpriteView(this.x + 100 - 6, this.y, main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + this.getKey('shadow', 'right'),
            this.group);
        
        this.bgRight.setScale(1);
        this.bgRight.setFixedToCamera(true);



        this.fgLeft = new SpriteView(this.x, this.y, main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + this.getKey(color, 'left'),
            this.group);

        this.fgLeft.setScale(1);
        this.fgLeft.setFixedToCamera(true);      
        
        for(var i = 0; i < 6; i++){
            this.fgMids.push(new SpriteView(this.x + 6 + i * 16, this.y, main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + this.getKey(color, 'mid'),
            this.group));

            this.fgMids[i].setScale(1);
            this.fgMids[i].setFixedToCamera(true);

            if(i === 5){
                this.crop(this.fgMids[i], 8);
            }
        }

        this.fgRight = new SpriteView(this.x + 100 - 6, this.y, main,
            this.main.renderer.SPRITE_SHEET_UI,
            this.main.renderer.SPRITE_PACK_UI_SPACE + this.getKey(color, 'right'),
            this.group);

        this.fgRight.setScale(1);
        this.fgRight.setFixedToCamera(true);

        //this.targetPercentage = 0;
    }

    update(){
        if(this.targetPercentage !== this.currentPercentage){
            if(this.targetPercentage < this.currentPercentage){
                if(this.currentPercentage < 13){
                    /*if(this.currentPercentage < 6){
                        this.crop(this.fgRight, 0);
                        //this.crop(this.fgRight, 1);
                    } else {
                        this.crop(this.fgLeft, this.currentPercentage - 6);
                    }  */ 
                    //this.set  
                    this.setFgVisible(false);
                    this.setFgInvisible = true;
                    this.currentPercentage = this.targetPercentage;
                    return;
                } else{
                    if(this.cropRect.width === 0){
                        this.currentSegment--;
                        this.cropRect.width = 16;
                    }
                    this.crop(this.fgMids[this.currentSegment], this.cropRect.width - 1);
                }
                this.fgRight.setX(this.x - 6 + this.currentPercentage - 1);    
                this.currentPercentage--;
            } else {
                if(this.currentPercentage < 13){
                    /*if(this.currentPercentage < 6){
                        this.crop(this.fgRight, 0);
                    } else {
                        this.crop(this.fgLeft, this.currentPercentage - 6);
                    }   */         
                    this.currentPercentage = 13;
                    this.setFgInvisible = false;
                    this.setFgVisible(true);
                    return;
                } else {
                    if(this.cropRect.width === 16){
                        this.currentSegment++;
                        this.cropRect.width = 0;
                    }
                    this.crop(this.fgMids[this.currentSegment], this.cropRect.width + 1);
                }
                
                this.fgRight.setX(this.x - 6 + this.currentPercentage + 1);    
                this.currentPercentage++;
            }
            if(this.currentPercentage === 100){
                this.fixCrops();
            /*} else if (this.currentPercentage === this.targetPercentage){
                console.log(this);
                console.log(this.targetPercentage);
                if(this.currentPercentage === 80){
                    this.crop(this.fgMids[4], 4); //01234
                    this.fgMids[4].setX(this.x + 6 + 4 * 16);       
                    //console.log(this);
                    
                } else if (this.currentPercentage === 60){
                    this.crop(this.fgMids[2], 16); //01234  
                    this.fgMids[2].setX(this.x + 6 + 2 * 16);                                        
                } else if (this.currentPercentage === 40){
                    this.crop(this.fgMids[1], 12); //01234  
                    this.fgMids[1].setX(this.x + 6 + 1 * 16);                                        
                }
                
                /* else if (this.currentPercentage === 20){
                    this.crop(this.fgMids[1], 16); //01234   
                    this.fgMids[1].setX(this.x + 6 + 4 * 16);                                        
                }*/
            }
        }
    }

    tick(){
    }

    fixCrops(){
        for(var i = 0; i < this.fgMids.length; i++){
            this.crop(this.fgMids[i], 16);
            if(i === 5){
                this.crop(this.fgMids[i], 8);
            }
            this.fgMids[i].setX(this.x + 6 + i * 16);
        }
        this.fgRight.setX(this.x + 100 - 6);
    }

    setPercentage(val){
        this.targetPercentage = Math.floor(val);
        //console.log(this.currentPercentage + ', ' + this.targetPercentage);
    }

    private getKey(color, side){
        return 'barHorizontal_' + color + '_' + side;
    }

    
    private crop(view, width){

        this.cropRect.width = width;//view.width / view.element.scale.x - width;
        this.cropRect.height = view.height / view.element.scale.y;

        //this.cropRect.setTo(3, 3, 10, 10);

        view.element.crop(this.cropRect);
    }

    setVisible(val){
        //console.log('set all visible: ' + val);
        
        this.bgLeft.setVisible(val);
        this.bgRight.setVisible(val);
        for(var i = 0; i < this.bgMids.length; i++){
            this.bgMids[i].setVisible(val);
        }
        if(this.setFgInvisible){
            //this.setFgVisible(val);            
        } else {
            this.setFgVisible(val);            
        }
    }

    setFgVisible(val){
        //console.log('set fg visible: ' + val);
        this.fgLeft.setVisible(val);
        this.fgRight.setVisible(val);
        for(var i = 0; i < this.fgMids.length; i++){
            this.fgMids[i].setVisible(val);
        }
    }

}

class MainMenuUI {

    main: Main;

    bg;
    header;
    score;

    startButton;
    startButtonText;

    toggleInfo;
    toggleInfoText;
    
    constructor(main){
        this.main = main;

        this.bg = new UIPanel(8, 8, main.renderer.UI_GROUP_SUPER, UIPanel.TYPE_METALPANEL);
        this.bg.build(4, 3, main, [true, false, false, false]);

        this.bg.setCenterScreen();

        this.header = new TextView(16, 200, main,
            'Endless Tank War!',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        this.header.setCenterScreen();
        this.header.setY(this.bg.getY() + 18);

        this.score = new TextView(16, 200, main,
            '',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        this.score.setCenterScreen();
        this.score.setY(this.header.getY() + 16);

        this.startButton = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button00',//0
            main.renderer.UI_GROUP_SUPER, function(){
                this.main.game.start();                
            }, this);

        this.startButton.setCenterScreen();
        this.startButton.setY(this.bg.getY() 
        + this.bg.height - this.startButton.height - 20);

        this.startButton.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button04',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button00',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button05'//5
        );

        this.startButtonText = new TextView(16, 200, main,
            'start',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        
        this.startButtonText.setCenter(
            this.startButton.getCenterX(), this.startButton.getCenterY());


        this.toggleInfo = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button00',//0
            main.renderer.UI_GROUP_SUPER, function(){
                //console.log('show info');
                this.toggleInfoText.setCenter(this.toggleInfo.getCenterX(),
                    this.toggleInfo.getCenterY()); 
                this.setVisible(false);
                this.main.game.infoUI.setVisible(true);                                  
            }, this);

        this.toggleInfo.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button04',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button00',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button05'//5
        );

        this.toggleInfo.setCenterScreen();
        this.toggleInfo.setY(this.startButton.y - this.toggleInfo.height - 18);
        
        this.toggleInfoText = new TextView(0, 0, main,
            'how to play',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);

        this.toggleInfoText.setCenter(this.toggleInfo.getCenterX(),
            this.toggleInfo.getCenterY());               

        this.setVisible(false);
    }

    setVisible(val){
        this.bg.setVisible(val);
        this.header.setVisible(val);
        this.startButton.setVisible(val);
        this.startButtonText.setVisible(val);
        this.toggleInfo.setVisible(val);
        this.toggleInfoText.setVisible(val);
        this.score.setVisible(val);
        if(this.main.game !== _){
            this.main.game.creditUI.setVisible(val);        
        }
    }

    setScore(val){
        this.score.setContent('score: ' + val);
        this.score.setCenterScreen();
        this.score.setY(this.header.getY() + 48 - 9);
    }

}

class PauseUI {

    main: Main;

    bg;
    header;

    score;

    startButton;  
    startButtonText;

    toggleSound;
    toggleSoundText;    

    toggleMusic; 
    toggleMusicText;    

    toggleInfo;
    toggleInfoText;    

    //infoUI;
    //creditUI;
    
    constructor(main){
        this.main = main;
        
        this.bg = new UIPanel(8, 8, main.renderer.UI_GROUP_SUPER, UIPanel.TYPE_METALPANEL);
        this.bg.build(3, 5, main, [true, false, false, false]);

        this.bg.setCenterScreen();

        this.header = new TextView(16, 200, main,
            'Paused',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        this.header.setCenterScreen();
        this.header.setY(this.bg.getY() + 16);

        this.score = new TextView(16, 200, main,
            'Score: 0',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        this.score.setCenterScreen();
        this.score.setY(this.header.getY() + 16);

        this.startButton = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button00',//0
            main.renderer.UI_GROUP_SUPER, function(){
                this.main.game.resume();
            }, this);
        this.startButton.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button04',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button00',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button05'//5
        );
        this.startButton.setCenterScreen();
        this.startButton.setY(this.bg.getY() + 
        this.bg.height - this.startButton.height - 18);      
        
        this.startButtonText = new TextView(0, 0, main,
            'continue',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);

        this.startButtonText.setCenter(
            this.startButton.getCenterX(),
            this.startButton.getCenterY());        
        
        this.toggleSound = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button00',//0
            main.renderer.UI_GROUP_SUPER, function(){
                //this.main.game.resume();
                //config.playSound = !config.playSound;
                this.main.game.setSound(!config.playSound);
                if(config.playSound){
                    this.toggleSoundText.setContent('sound on');
                } else {
                    this.toggleSoundText.setContent('sound off');                    
                }
                this.toggleSoundText.setCenter(this.toggleSound.getCenterX(),
                    this.toggleSound.getCenterY());                
            }, this);
        this.toggleSound.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button04',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button00',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'green_button05'//5
        );
        this.toggleSound.setCenterScreen();
        this.toggleSound.setY(this.startButton.y - this.toggleSound.height - 20);

        this.toggleSoundText = new TextView(0, 0, main,
            'Sound off',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        if(config.playSound){
            this.toggleSoundText.setContent('sound on');
        }
        this.toggleSoundText.setCenter(
            this.toggleSound.getCenterX(),
            this.toggleSound.getCenterY());

        this.toggleMusic = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'red_button11',//0
            main.renderer.UI_GROUP_SUPER, function(){
                this.main.game.setMusic(!config.playMusic);
                if(config.playMusic){
                    this.toggleMusicText.setContent('music on');
                } else {
                    this.toggleMusicText.setContent('music off');                    
                }
                this.toggleMusicText.setCenter(this.toggleMusic.getCenterX(),
                    this.toggleMusic.getCenterY());                                   
            }, this);
        this.toggleMusic.setCenterScreen();
        this.toggleMusic.setY(this.toggleSound.y - this.toggleMusic.height - 20);
        
        this.toggleMusic.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'red_button01',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'red_button11',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'red_button02'//5
        );
        this.toggleMusicText = new TextView(0, 0, main,
            'music off',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        if(config.playMusic){
            this.toggleMusicText.setContent('music on');
        }
        this.toggleMusicText.setCenter(
            this.toggleMusic.getCenterX(),
            this.toggleMusic.getCenterY());

        this.toggleInfo = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button00',//0
            main.renderer.UI_GROUP_SUPER, function(){
                //console.log('show info');
                this.toggleInfoText.setCenter(this.toggleInfo.getCenterX(),
                    this.toggleInfo.getCenterY()); 
                this.setVisible(false);
                this.main.game.infoUI.setVisible(true);                                  
            }, this);

        this.toggleInfo.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button04',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button00',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button05'//5
        );

        this.toggleInfo.setCenterScreen();
        this.toggleInfo.setY(this.toggleMusic.y - this.toggleInfo.height - 20);
        
        this.toggleInfoText = new TextView(0, 0, main,
            'how to play',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);

        this.toggleInfoText.setCenter(this.toggleInfo.getCenterX(),
            this.toggleInfo.getCenterY());   

        //this.infoUI = new InfoUI(main, this);
        //this.infoUI.setVisible(false);

        //this.creditUI = new CreditUI(main, this);
        //this.creditUI.setVisible(false);
        
        this.setScore(0);

        this.setVisible(false);        
    }

    setScore(val){
        this.score.setContent('score: ' + val);
        this.score.setCenterScreen();
        this.score.setY(this.header.getY() + 48 - 5);
    }

    setVisible(val){
        this.bg.setVisible(val);
        this.header.setVisible(val);
        this.score.setVisible(val);
        this.toggleMusic.setVisible(val);
        this.toggleSound.setVisible(val);
        this.toggleSoundText.setVisible(val);
        this.toggleMusicText.setVisible(val);
        this.startButtonText.setVisible(val);
        this.startButton.setVisible(val);
        this.toggleInfoText.setVisible(val);
        this.toggleInfo.setVisible(val);
        if(this.main.game !== _){
            this.main.game.creditUI.setVisible(val);        
        }
    }

}

class InfoUI {

    main: Main;
    parent;

    bg;

    returnButton;
    returnButtonText;

    views = [];

    content;

    constructor(main){
        this.main = main;
        //this.parent = parent;

        this.bg = new UIPanel(8, 8, main.renderer.UI_GROUP_SUPER, UIPanel.TYPE_METALPANEL);
        this.bg.build(9, 5, main, [true, false, false, false]);
        this.bg.setCenterScreen();

        this.content = new SpriteView(this.bg.getX(), this.bg.getY(), main, 'none', 
        'ui_help_content', 
        main.renderer.UI_GROUP_SUPER);
        this.content.setFixedToCamera(true);
        this.content.setScale(1);

        this.returnButton = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button00',//0
            main.renderer.UI_GROUP_SUPER, function(){
                ///this.main.game.start();    
                this.setVisible(false);
                if(this.main.game.state === this.main.game.STATE_PAUSED){
                    this.main.game.pauseUI.setVisible(true);                                                  
                } else if (this.main.game.state === this.main.game.STATE_MAINMENU){
                    this.main.game.mainMenuUI.setVisible(true);                                                  
                }
            }, this);

        this.returnButton.setCenterScreen();
        this.returnButton.setY(this.bg.getY() 
        + this.bg.height - this.returnButton.height - 10);

        this.returnButton.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button04',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button00',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'blue_button05'//5
        );

        this.returnButtonText = new TextView(16, 200, main,
            'return',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        
        this.returnButtonText.setCenter(
            this.returnButton.getCenterX(), this.returnButton.getCenterY());

        this.views.push(this.bg);
        this.views.push(this.content);
        this.views.push(this.returnButton); 
        this.views.push(this.returnButtonText);   
        
        this.setVisible(false);
    }

    setVisible(val){
        for(var i = 0; i < this.views.length; i++){
            this.views[i].setVisible(val);
        }
    }

}

class CreditUI{

    main;
    //parent;

    bg;
    text;
    textVersion;

    views = [];

    constructor(main){
        this.main = main;
        //this.parent = parent;

        /*this.bg = new UIPanel(8, 8, main.renderer.UI_GROUP_SUPER, UIPanel.TYPE_METALPANEL);
        this.bg.build(2, 1, main, [true, false, false, false]);
        this.bg.setPos(res.width - this.bg.width - 8, res.height - this.bg.height - 8);*/

        this.text = new TextView(16, 200, main,
            '   created\nby Polydus',
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        
        this.text.setPos(16, res.height - this.text.height - 8);

        this.textVersion = new TextView(16, 200, main,
            strings.version,
            font.medThinAlt, main.renderer.UI_GROUP_SUPER);
        
        this.textVersion.setPos(res.width - this.textVersion.width - 16, res.height - this.textVersion.height - 8);

        //this.views.push(this.bg);
        this.views.push(this.text); 
        this.views.push(this.textVersion);  
        this.setVisible(false); 
    }

    setVisible(val){
        for(var i = 0; i < this.views.length; i++){
            this.views[i].setVisible(val);
        }
    }
}

class InGameUI {

    main: Main;

    playerStatsBg;
    statsString;

    playerHealthBar;
    playerHealthHeader;

    player: Player;

    rankingBg;
    rankingHeaderBg;
    rankingHeaderText;    
    rankingsNumbers;
    rankingsNames;
    rankingsScores;

    menuButton;

    gameMessage;
    gameMessageCounter = 0;
    showingGameMessage = false;

    shells = [];
    shellsTexts = [];
    shellsBgs = [];
    shellBgSelected;

    //showShellSelected = false;
    //shellIndex = 0;

    constructor(main, player){
        this.main = main;
        this.player = player;
        this.playerStatsBg = new UIPanel(8, 8, main.renderer.UI_GROUP_SUPER, UIPanel.TYPE_GLASSPANEL);
        this.playerStatsBg.build(3, 1, main, [true, false, false, false]);

        this.playerHealthHeader = new TextView(24, 19, main,
            'Health\n',
            font.medThin, main.renderer.UI_GROUP_SUPER);

        this.playerHealthBar = new ProgressBar(
            this.playerHealthHeader.x1 + 8 + 5, 19, 'green', main.renderer.UI_GROUP_SUPER, main);

        this.shellsBgs.push(new SpriteView(24, 64 - 12, main, 'none', 
            'ammo_bg', 
            main.renderer.UI_GROUP_SUPER));
        this.shellsBgs.push(new SpriteView(24 + 73, 64 - 12, main, 'none', 
            'ammo_bg', 
            main.renderer.UI_GROUP_SUPER));
        this.shellsBgs.push(new SpriteView(24 + 73 + 73, 64 - 12, main, 'none', 
            'ammo_bg', 
            main.renderer.UI_GROUP_SUPER));  
            
        this.shellBgSelected = new SpriteView(24, 64 - 12, main, 'none', 
        'ammo_bg_selected', 
        main.renderer.UI_GROUP_SUPER);
        this.shellBgSelected.setScale(1);
        this.shellBgSelected.setFixedToCamera(true);

        this.shells.push(new SpriteView(30, 64 - 6, main, _, 
            this.main.renderer.SPRITE_PACK_TANKS + 'Bullets/bullet' + 'Blue' + '_outline', 
            main.renderer.UI_GROUP_SUPER));

        this.shells.push(new SpriteView(30 + 73, 64 - 6, main, _, 
            this.main.renderer.SPRITE_PACK_TANKS + 'Bullets/bullet' + 'Yellow' + '_outline', 
            main.renderer.UI_GROUP_SUPER));

        this.shells.push(new SpriteView(30 + 73 + 73, 64 - 6, main, _, 
            this.main.renderer.SPRITE_PACK_TANKS + 'Bullets/bullet' + 'Red' + '_outline', 
            main.renderer.UI_GROUP_SUPER));

        this.shellsTexts.push(new TextView(24, 64, main,
            '00',
            font.medThin, main.renderer.UI_GROUP_SUPER));

        this.shellsTexts.push(new TextView(24, 64, main,
            '00',
            font.medThin, main.renderer.UI_GROUP_SUPER));
                
        this.shellsTexts.push(new TextView(24, 64, main,
            '00',
            font.medThin, main.renderer.UI_GROUP_SUPER));                

        for(var i = 0; i < this.shells.length; i++){
            this.shells[i].setScale(1);
            this.shellsTexts[i].setCenter(this.shells[i].getX() + 40, this.shells[i].getCenterY() + 2);
            this.shells[i].setFixedToCamera(true);
            this.shellsBgs[i].setScale(1);
            this.shellsBgs[i].setFixedToCamera(true);            
        }
        

        this.rankingBg = new UIPanel(8, 8, main.renderer.UI_GROUP_SUPER, UIPanel.TYPE_GLASSPANEL);
        this.rankingBg.build(2, 3, main, [false, false, false, false]);
        this.rankingBg.setPos(
            res.width - this.rankingBg.width - 8 - 6, 8 + 48 + 6);

        this.rankingHeaderBg = new SpriteView(0, 0, 
            main, 'none', 'rankings_header_bg', main.renderer.UI_GROUP_SUPER);
        this.rankingHeaderBg.setScale(1);
        this.rankingHeaderBg.setPos(this.rankingBg.getX(), 8);
        this.rankingHeaderBg.setFixedToCamera(true);
        //this.rankingHeaderBg.setCenterScreen();

        this.rankingsNumbers = new TextView(24, 20, main,
            '',//'1   CPU 1\n2  CPU 2 \n3  CPU 3\n4  Player',
            font.smallThin, main.renderer.UI_GROUP_SUPER);
        this.rankingsNumbers.setPos(
            this.rankingBg.getX() + 8 + 9,
            this.rankingBg.getY() + 14
        );

        this.rankingsNames = new TextView(24, 20, main,
            '',//'1   CPU 1\n2  CPU 2 \n3  CPU 3\n4  Player',
            font.smallThin, main.renderer.UI_GROUP_SUPER);
        this.rankingsNames.setPos(
            this.rankingBg.getX() + 8 + 9 + 32,
            this.rankingBg.getY() + 14
        );

        this.rankingsScores = new TextView(24, 20, main,
            '',//'1   CPU 1\n2  CPU 2 \n3  CPU 3\n4  Player',
            font.smallThin, main.renderer.UI_GROUP_SUPER);
        this.rankingsScores.setPos(
            this.rankingBg.getX() + 8 + 9 + 128,
            this.rankingBg.getY() + 14
        );

        this.menuButton = new ButtonView(
            0, 0, main, main.renderer.SPRITE_SHEET_UI, 
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button12',//0
            main.renderer.UI_GROUP_SUPER, function(){
                this.main.game.pause();
            }, this);

        this.menuButton.setPos(
            res.width - this.menuButton.width - 8, 8);

        /*this.menuButton.setFrames(
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button11',//4
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button07',//0
            main.renderer.SPRITE_PACK_UI_FIXED + 'yellow_button12'//5
        );*/

        this.rankingHeaderText = new TextView(635, 24, main,
            'Rankings',//'1   CPU 1\n2  CPU 2 \n3  CPU 3\n4  Player',
            font.smallThin, main.renderer.UI_GROUP_SUPER);

       this.rankingHeaderText.setCenter(
            this.rankingHeaderBg.getCenterX(), this.rankingHeaderBg.getCenterY());
        
        this.rankingHeaderText.setPositionBy(3, 3);

        this.gameMessage = new TextView(24, 20, main,
            '',font.medThin, main.renderer.UI_GROUP_SUPER);


        /*this.statsString = new TextView(24, 200, main,
            'a',font.medThin, main.renderer.UI_GROUP_SUPER);*/
            
        this.setVisible(false);
    }

    update(){
        this.playerHealthBar.update();
        if(this.showingGameMessage){
            if(this.gameMessageCounter < 18){
                this.gameMessage.setYBy(3);
            } else if (this.gameMessageCounter > 240){
                this.gameMessage.setYBy(-3);  
                if(this.gameMessage.getY() < 0){
                    this.stopShowingGameMessage();
                }              
            }
            this.gameMessageCounter++;
        }
    }

    showGameMessage(content){
        this.gameMessageCounter = 0;
        this.gameMessage.setContent(content);
        this.gameMessage.setCenterScreen();
        this.gameMessage.setXBy(36);
        this.gameMessage.setY(0 - this.gameMessage.height - 4);
        this.showingGameMessage = true;
    }

    stopShowingGameMessage(){
        this.gameMessageCounter = 0;
        this.showingGameMessage = false;
        this.gameMessage.setContent('');
    }

    updateShellCounters(type, amount){
        if(amount < 10){
            amount = '0' + amount;
        }

        switch(type){
            case Projectile.TYPE_BONUS_SPEED:
                this.shellsTexts[0].setContent(amount);
                this.shellsTexts[0].setCenter(this.shells[0].getX() + 40, this.shells[0].getCenterY() + 2);                
            break;
            case Projectile.TYPE_FIRE:
                this.shellsTexts[1].setContent(amount);
                this.shellsTexts[1].setCenter(this.shells[1].getX() + 40, this.shells[1].getCenterY() + 2);                
            break;
            case Projectile.TYPE_EXPLOSIVE:
                this.shellsTexts[2].setContent(amount);
                this.shellsTexts[2].setCenter(this.shells[2].getX() + 40, this.shells[2].getCenterY() + 2);                
            break;                    
        }
    }

    resetShellCounters(){
        for(var i = 0; i < this.shells.length; i++){
            this.shellsTexts[i].setContent('00');  
            this.shellsTexts[i].setCenter(this.shells[i].getX() + 40, this.shells[i].getCenterY() + 2);                            
        }
    }

    onSetShellType(type){
        switch(type){
            case Projectile.TYPE_BONUS_SPEED:
                this.shellBgSelected.setX(24);
            break;
            case Projectile.TYPE_FIRE:
                this.shellBgSelected.setX(24 + 73);
            break;
            case Projectile.TYPE_EXPLOSIVE:
                this.shellBgSelected.setX(24 + 73 + 73);            
            break;                    
        }
    }

    updateRankings(numbers, names, scores, topScore, topPlayer, newTopPlayer){
        this.rankingsNumbers.setContent(numbers);        
        this.rankingsNames.setContent(names);
        this.rankingsScores.setContent(scores);     

        if(newTopPlayer){
            this.showGameMessage(topPlayer.name + ' took the lead!');
        }

        if(topScore < 10){
            this.rankingsScores.setX(this.rankingBg.getX() + 8 + 9 + 128);
        } else if (topScore < 100){
            this.rankingsScores.setX(this.rankingBg.getX() + 8 + 9 + 116);            
        } else if (topScore < 1000){
            this.rankingsScores.setX(this.rankingBg.getX() + 8 + 9 + 104);            
        } else if (topScore < 10000){
            this.rankingsScores.setX(this.rankingBg.getX() + 8 + 9 + 92);            
        } else if (topScore < 100000){
            this.rankingsScores.setX(this.rankingBg.getX() + 8 + 9 + 80);            
        } else {
            this.rankingsScores.setX(this.rankingBg.getX() + 8 + 9 + 68);                        
        }
    }

    tick(){
        if(config.debug){

        }
    }

    setVisible(val){
        this.playerStatsBg.setVisible(val);
        this.playerHealthHeader.setVisible(val);
        this.playerHealthBar.setVisible(val);
        this.rankingBg.setVisible(val);
        this.rankingHeaderBg.setVisible(val);
        this.rankingsNames.setVisible(val);
        this.rankingsNumbers.setVisible(val);
        this.rankingsScores.setVisible(val);        
        this.menuButton.setVisible(val);
        this.rankingHeaderText.setVisible(val);
        this.gameMessage.setVisible(val);
        this.shells[0].setVisible(val);
        this.shells[1].setVisible(val);
        this.shells[2].setVisible(val);        
        for(var i = 0; i < this.shells.length; i++){
            this.shells[i].setVisible(val);
            this.shellsTexts[i].setVisible(val);    
            this.shellsBgs[i].setVisible(val);        
        }
        //if(val && this.showShellSelected){
            //this.shellBgSelected.setVisible(val);
        //} else if (!val){
            this.shellBgSelected.setVisible(val);            
        //}
                
        if(!val){
            this.stopShowingGameMessage();
        }
       // this.statsString.setVisible(val);
    }

}
