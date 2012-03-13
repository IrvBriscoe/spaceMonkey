// TODO: investigate fps drop after game reset
// TODO: add game start screen

// ===================================================================
// Game initialization
// ===================================================================
var SpaceMonkey = function(settings) {
    // Settings recognition
    this.options = $.extend({
        showfps: true,
        accelmx: 3.5,
        preload: true//,
        //debug
    }, settings);
    
    if (typeof this.options.debug === 'function') {
        this.debug = this.options.debug;
    }
    
    // Rendering initialization
    this.ready = false;
    this.active = false;
    this.renderid = 0;
    this.rendert = +(new Date());
    this.renderf = 0; // frames calculator
    this.rendermxf = 60; // max frames to calculate
    this.fps = 0; // current fps value
    
    this.score = 0;
    this.scored = false;
    this.scoret = Date.now();

    // Resources management
    this.resources = ['src/img/object_banana.png', 'src/img/object_bomb.png', 'src/img/player.png'];
    this.options.preload && this.preload();
    
    // Canvas preparation
    this.width = document.width;
    this.height = document.height;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');

    // Game objects initialization
    this.objects = [];
    
    this.player = new SpaceMonkey.prototype.player(this);
    this.initObjects();
};

// ===================================================================
// Game logic
// ===================================================================
SpaceMonkey.prototype.start = function() {
    var that = this;

    if (!this.ready && !this.options.preload) {
        this.debug('[SpaceMonkey]: Preload resources first');
    }
    
    if (!this.ready) {
        $.subone('spacemonkey_loaded', function() {
            that.start();
        });
    }
    
    this.active = true;
    
    this.logic();

    this.render();
};
SpaceMonkey.prototype.reset = function() {
    var i = 0,
        l = this.objects.length;
    
    for (;i < l; i++) {
        this.objects[i].reset();
    }
};
SpaceMonkey.prototype.logic = function() {
    var that = this;
    var handleDeviceMotion = function(e) {
        that.player.move(e.accelerationIncludingGravity.x * that.options.accelmx);
    };
    var handleMouseMove = function(e) {
        that.player.move(e.pageX - that.player.x);
    };
    window.addEventListener('devicemotion', handleDeviceMotion, false);
    this.canvas.addEventListener('mousemove', handleMouseMove, false);
};

SpaceMonkey.prototype.over = function() {
    var that = this;
    // this game is over, broheim
    this.active = false;
    
    var handleCanvasClick = function() {
        that.reset();
        that.start();
        
        that.canvas.removeEventListener('click', handleCanvasClick, false);
    };
    
    this.canvas.addEventListener('click', handleCanvasClick, false);
};


// ===================================================================
// Player
// ===================================================================
SpaceMonkey.prototype.player = function(parent) {
    var that = this;
    var imageLoaded = function() {
        that.width = that.img.width;
        that.height = that.img.height

        that.x = (that.game.width / 2) - (that.width / 2);
        that.y = that.game.height - that.height;
        
        that.ready = true;
    };
    
    // parent refers to original SpaceMonkey
    this.game = parent;
    this.img = new Image();
    this.img.src = 'src/img/player.png';
    this.ready = false;

    this.img.onload = imageLoaded;
};
SpaceMonkey.prototype.player.prototype.collision = function(i) {
    if (this.game.objects[i].collidable) {
        this.game.objects[i].reset();
        this.game.score += this.game.objects[i].value;
        
        (this.game.score <= 0) && this.game.over();
        
        (this.game.scored) || (this.game.scored = true);
    }
};
SpaceMonkey.prototype.player.prototype.checkCollision = function() {
    var i = 0,
        l = this.game.objects.length;
    
    for (;i < l; i++) {
        if (((this.game.objects[i].y + this.game.objects[i].height >= this.y) && (this.game.objects[i].y <= this.y)) ||
            ((this.game.objects[i].y >= this.y) && (this.game.objects[i].y <= this.y + this.height))) {
            // collision by Y;
            if (((this.game.objects[i].x <= this.x) && (this.game.objects[i].x + this.game.objects[i].width >= this.x)) ||
                ((this.game.objects[i].x >= this.x) && (this.game.objects[i].x <= this.x + this.width))) {
                //collision by X coord
                this.collision(i);
            }
        }
    }
};
SpaceMonkey.prototype.player.prototype.move = function(x, y) {
    x && (this.x = Math.min(Math.max(0, this.x + x), this.game.width - this.width));
    y && (this.y = Math.min(Math.max(0, this.y + y), this.game.height - this.height));
};
SpaceMonkey.prototype.player.prototype.draw = function() {
    if (!this.ready) {
        return;
    }
    
    this.checkCollision();
    
	try {
		this.game.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
	} 
	catch (e) {
        this.game.debug(e);
	};
};

// ===================================================================
// Non-player game objects init
// ===================================================================
SpaceMonkey.prototype.initObjects = function() {
    var i = 0;

    var bananas = 2,
        bombs = 1;
    
    for (i = 0; i < bananas; i++) {
        this.objects.push(new SpaceMonkey.prototype.objectBanana(this, i));
    }
    
    for (i = 0; i < bombs; i++) {
        this.objects.push(new SpaceMonkey.prototype.objectBomb(this, i));
    }
    
    this.objects.push(new SpaceMonkey.prototype.scoreBoard(this))
};

// ===================================================================
// objectBanana
// ===================================================================
SpaceMonkey.prototype.objectBanana = function(parent, mx) {
    var that = this;
    var imageLoaded = function() {
        that.width = that.img.width;
        that.height = that.img.height

        that.reset();

        that.ready = true;
    };
    
    // parent refers to original SpaceMonkey
    this.game = parent;
    this.img = new Image();
    this.img.src = 'src/img/object_banana.png';
    this.ready = false;
    
    this.mx = mx;
    
    this.name = 'banana';
    this.type = 'score';
    this.value = 10;
    this.collidable = true;
    
    this.velocity = 0;
    this.accelerated = false;

    this.img.onload = imageLoaded;
};
SpaceMonkey.prototype.objectBanana.prototype.reset = function() {
    this.x = Math.random() * this.mx * (this.game.width - this.width);
    this.y = Math.random() * this.mx * (- this.game.height / 2 - this.height) - this.height;
};
SpaceMonkey.prototype.objectBanana.prototype.move = function() {
    if (this.accelerated) {
        this.velocity++;
        this.y += this.game.options.accelmx + this.velocity / 2;
    }
    else {
        this.y += this.game.options.accelmx;
    }

    if (this.y >= this.game.height) {
        this.velocity = 0;
        this.reset();
    }
};
SpaceMonkey.prototype.objectBanana.prototype.draw = function() {
    if (!this.ready) {
        return;
    }

    this.move();

	try {
		this.game.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
	} 
	catch (e) {
        this.game.debug(e);
	};
};

// ===================================================================
// objectBomb
// ===================================================================
SpaceMonkey.prototype.objectBomb = function(parent, mx) {
    var that = this;
    var imageLoaded = function() {
        that.width = that.img.width;
        that.height = that.img.height

        that.reset();

        that.ready = true;
    };
    
    // parent refers to original SpaceMonkey
    this.game = parent;
    this.img = new Image();
    this.img.src = 'src/img/object_bomb.png';
    this.ready = false;
    
    this.mx = mx || Math.random();
    
    this.name = 'bomb';
    this.type = 'loose';
    this.value = -30;
    this.collidable = true;
    
    this.velocity = 0;
    this.accelerated = false;

    this.img.onload = imageLoaded;
};
SpaceMonkey.prototype.objectBomb.prototype.reset = function() {
    this.x = Math.random() * this.mx * (this.game.width - this.width);
    this.y = Math.random() * this.mx * (- this.game.height / 2 - this.height) - this.height;
};
SpaceMonkey.prototype.objectBomb.prototype.move = function() {
    if (this.accelerated) {
        this.velocity++;
        this.y += this.game.options.accelmx + this.velocity / 2;
    }
    else {
        this.y += this.game.options.accelmx;
    }
    
    if (this.y >= this.game.height) {
        this.velocity = 0;
        this.reset();
    }
};
SpaceMonkey.prototype.objectBomb.prototype.draw = function() {
    if (!this.ready) {
        return;
    }

    this.move();
    
	try {
		this.game.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
	} 
	catch (e) {
        this.game.debug(e);
	};
};

// ===================================================================
// scoreBoard
// ===================================================================
SpaceMonkey.prototype.scoreBoard = function(parent) {
    // parent refers to original SpaceMonkey
    this.game = parent;
    
    this.name = 'scoreboard';
    this.collidable = false;
};
SpaceMonkey.prototype.scoreBoard.prototype.reset = function() {
    this.game.score = 0;
    this.game.scoret = Date.now();
    this.game.scored = false;
};
SpaceMonkey.prototype.scoreBoard.prototype.draw = function() {
	try {
    	this.game.ctx.fillStyle = '#f00';
    	this.game.ctx.font = 'bold 16px/16px Monospace, Fixedsys, sans-serif';

    	this.game.ctx.fillText('SCORE: ' + this.game.score, this.game.width / 2 - 50, 16);
	} 
	catch (e) {
        this.game.debug(e);
	};
};

// ===================================================================
// Rendering functions
// ===================================================================
SpaceMonkey.prototype.render = function() {
    var that = this;
    var proxyRender = function() {
        that.render();
    };
    
    // Render clean background
    this.clear();
    
    if (this.active) {
        // Render player
        this.player.draw();

        // Call rendering of all the objects
        for (var i = 0, l = this.objects.length; i < l; i++) {
            this.objects[i].draw();
        }
        
        this.renderid = setTimeout(proxyRender, 1000 / this.rendermxf);
    }
    else {
        this.renderGameStats();
    }
    
    this.options.showfps && this.renderFPS();
    
    console.log('render')
};
SpaceMonkey.prototype.renderFPS = function() {
    this.renderf++;
    if (this.renderf === this.rendermxf) {
        var now = +(new Date());
        this.fps = ((this.rendermxf / (now - this.rendert)) * 1000) | 0;
        this.rendert = now;
        this.renderf = 0;
    }

	this.ctx.fillStyle = '#0f0';
	this.ctx.font = '10px/10px Monospace, Fixedsys, sans-serif';

	this.ctx.fillText('FPS: ' + this.fps, 0, 10);
};
SpaceMonkey.prototype.renderGameStats = function() {
    var cx = this.width / 2,
        cy = this.height / 2;

    this.ctx.fillStyle = '#f00';
	this.ctx.font = 'bold 20px/20px Monospace, Fixedsys, sans-serif';

	this.ctx.fillText('GAME OVER!', cx - 60, cy - 20);
    this.ctx.fillText('PLAYED: ' + ((Date.now() - this.scoret) / (1000 * 60)).toFixed(2) + ' min.', cx - 100, cy);
    
    this.ctx.font = 'bold 15px/15px Monospace, Fixedsys, sans-serif';
	this.ctx.fillText('PLAY AGAIN?', cx - 50, cy + 60);
};

SpaceMonkey.prototype.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);

	this.ctx.beginPath();
	this.ctx.rect(0, 0, this.width, this.height);
	this.ctx.closePath();
    this.ctx.fillStyle = '#0f2e60';
	this.ctx.fill();
};

// ===================================================================
// Boring utility functions section
// ===================================================================
SpaceMonkey.prototype.preload = function() {
    var image,
        loaded = 0,
        i = 0,
        l = this.resources.length,
        that = this;
        
    var imageLoaded = function() {
        loaded++;
        if (loaded >= l) {
            that.ready = true;
            $.pub('spacemonkey_loaded');
        }
    };

    for (; i < l; i++) {
        image = new Image();
        image.src = this.resources[i];
        image.onload = imageLoaded;
    }
};
SpaceMonkey.prototype.debug = function() {
    if ('console' in window) {
        (arguments.length > 1) ? console.log(Array.prototype.slice.call(arguments)) : console.log(arguments[0]);
    }
};

$(document).ready(function() {
    var game = new SpaceMonkey();
    game.start();
});
