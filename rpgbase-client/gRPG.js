"use strict";

/* TODO:
 * 
 * setMenuPositions for menu modes
 * image loader, loadThemAll()
 * start method for engine
 * registerMap, getCurrentMapId, 

 * probably apply GameModeMixin directly to BattleSystem, FieldMenu, MapScreen,
 * MazeScreen instead of having these awkward mode classes that are just thin wrappers around
 * them. We could even apply the mixin here, in this file, so that if you don't include gRPG
 * then the basic classes remain un-mixed.

 * onSerialize, onDeserialize:
 *     allow each game mode to do whatever serialization/deserialization it wants
 *     and then record which mode is currently the main

 * Clean API for saving game data:
 *     saveGlobalGameState({})
 *     or just  engine.globalGameState['key'] = "value"
 *     and then anything written in engine.globalGameData gets saved

 */

var gRPG = (function(){
/* gRPG Namepsace */
  
  function GameEngine(canvasElem, width, height, options) {

    this.settings = {htmlElem: canvasElem,
                     screenWidth: width,
                     screenHeight: height};
    console.log("Instantiated game engine, htmlElem is " + this.settings.htmlElem);
    if (!!options) {
      this.setOptions(options);
    }
    console.log("Now htmlElem is " + this.settings.htmlElem);

    this._modeRegistry = {};
    this._monsterRegistry = {};
    this._characterRegistry = {};
    this._itemRegistry = {};
    this._commandRegistry = {};
    this._vehicleRegistry = {};
    this._keypressCallbacks = {};

    this._mainMode = null;
    this._subMode = null; // TODO be a stack? Probably not.

    this._canonicalSize = {width: width,
                           height: height};
    var self = this;
    this._menuInputHandler = new NoRepeatKeyHandler(
      function(key) {
        if (self._subMode) {
          self._subMode.handleKey(key);
        }
      });

    this._mapInputHandler = new DPadStyleKeyHandler(40, // TODO NO HARDCODE KEY REPEAT RATE
      function(key) {
        if (self._mainMode) {
          self._mainMode.handleKey(key);
        }
      });
    
    this.loader = new AssetLoader()

    // implement scaling:
    this.canvas = this.settings.htmlElem[0];
    var ctx = this.canvas.getContext("2d");
    if (this.settings.scale && this.settings.scale != 1) {
      // Zoom in the canvas to given factor, without anti-aliasing:
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      if (this.settings.scale == "auto") {
        this.scaleToWindow();
      } else {
        ctx.scale(this.settings.scale, this.settings.scale);
      }
    }

    this.player = new Player();
  }
  GameEngine.prototype = {
    // TODO Needs to have mechanism for saving/loading globals

    scaleToWindow: function() {
      var windowSize = {width: $(window).width(),
                        height: $(window).height()};
      var gameSize = {width: this.settings.screenWidth,
                      height: this.settings.screenHeight};

      var ratios = {width: windowSize.width/gameSize.width,
                    height: windowSize.height/gameSize.height};

      var ratio = ratios.width < ratios.height ? ratios.width : ratios.height;
      $("#mapscreen-canvas").attr("width", gameSize.width * ratio);
      $("#mapscreen-canvas").attr("height", gameSize.height * ratio);
      var ctx = this.canvas.getContext("2d");
      ctx.scale(ratio, ratio);
      
      this._calculatedScale = ratio; // TODO pass this to all modes that are added...
      // and if it changes, pass the change to all current modes.

     /* var fontSize = Math.ceil( 18 * ratio);
      $("body").css("font-size", fontSize + "pt");
      console.log("Set font size to " + fontSize);*/
    },

    /*rescale: function(newScale) {
      // Does not work, do not use
      var ctx = this.canvas.getContext("2d");
      //ctx.restore();
      //ctx.save();
      this.settings.scale = newScale;
      ctx.scale(this.settings.scale, this.settings.scale);
      
      this.settings.screenWidth = this._canonicalSize.width * newScale;
      this.settings.screenHeight = this._canonicalSize.height * newScale;
      this.canvas.setAttribute("width", this.settings.screenWidth);
      this.canvas.setAttribute("height", this.settings.screenHeight);
    },*/

    setOptions: function(options) {
      // Needs to support options like:
      // default to CSS or canvas menus?
      // if css menus, needs base HTML elem to use (or it could just create one)
      // if canvas menus, needs menu cursor image and font image
      // default text styles
      // controls? (i.e. keyboard mappings)
      // scale factor

      var optionKeys = ["htmlElem", "screenWidth", "screenHeight", 
                        "menuImpl", "menuBaseElem", "scale"];
      var self = this;

      // Set global options:
      $(optionKeys).each(function(index, fieldName) {
        if (options.hasOwnProperty(fieldName)) {
          self.settings[fieldName] = options[fieldName];
        }
      });

      // Propagate to already-registered modes:
      for (var mode in self._modeRegistry) {
        if (self._modeRegistry.hasOwnProperty(mode)) {
          self._modeRegistry[mode].setOptions(options);
        }
      }
    },
    
    addMode: function(name, modeObject) {
      console.log("Adding mode " + name );
      this._modeRegistry[name] = modeObject;
      // Let the mode know about the global settings:
      console.log("Adding mode " + name + ", will give it my htmlElem = " + this.settings.htmlElem);
      modeObject.engine = this;
      modeObject.setOptions(this.settings); // TODO not good if setting options a second time
      // has side-effects
    },
    
    getModeByName: function(name) {
      return this._modeRegistry[name];
    },

    getActiveMode: function() {
      if (this._subMode) {
        return this._subMode;
      } else {
        return this._mainMode;
      }
    },

    mainMode: function(name) {
      // TODO raise an exception if the named mode cannot be
      // a main mode
      if (!this._modeRegistry.hasOwnProperty(name)) {
        throw "There is no mode named " + name;
      }

      if (this._mainMode) {
        this._mainMode.stop();
        this._mapInputHandler.stopListening();
      }

      this._mainMode = this._modeRegistry[name];

      // start animator of new mode:
      this._mainMode.start();

      this._mapInputHandler.startListening();      
      // TODO weird things might happen if you called this while a 
      // sub-mode was active...
    },

    openMode: function(name) {
      // TODO raise an exception if the named mode cannot be
      // a sub mode
      if (!this._modeRegistry.hasOwnProperty(name)) {
        throw "There is no mode named " + name;
      }
      this._subMode = this._modeRegistry[name];

      // switch input to menu style:
      this._mapInputHandler.stopListening();
      this._menuInputHandler.startListening();

      // TODO in some cases we want to do subMode.menuSystem.open(self.player);
      // ... but not in all cases?

      // if the submode has an animator (e.g. battlesystem),
      // stop the old mode and start the new mode:
      if (this._subMode.hasOwnAnimator) {
        this._mainMode.stop();
      }
      // otherwise, just start the new one:
      this._subMode.start();
    },
    
    closeMode: function() {
      if (this._subMode.hasOwnAnimator) {
        this._subMode.stop();
        this._mainMode.start();
      }

      // switch input to map style:
      this._menuInputHandler.stopListening();
      this._mapInputHandler.startListening();
      this._subMode = null;
    },

    loadImage: function(filename) {
      return this.loader.add(filename);
    },
    
    addMap: function(name, map) {
    },
    
    getMap: function(name) {
    },

    addMonster: function(name, monster) {
    },

    getMonster: function(name) {
    },

    addCharacter: function(name, character) {
      // doesn't immediately add them to your party,
      // just stores their data for now
    },

    getCharacter: function(name) {
    },

    addItem: function(name, item) {
    },

    getItem: function(name) {
    },

    addCommand: function(name, command) {
    },

    getCommand: function(name) {
    },

    addVehicle: function(name, vehicle) {
    },

    getVehicle: function(name) {
    },
    
    mainMenu: function(callback) {
    },

    onButtonPress: function(keycode, callback) {
      // all main modes will listen for this keycode and call the
      // callback when it's pressed.

      this._keypressCallbacks[keycode] = callback;
    },

    handleKey: function(keycode) {
      if (this._keypressCallbacks.hasOwnProperty(keycode)) {
        this._keypressCallbacks[keycode](this);
      }
    },
    
    onStartGame: function(callback) {
      // called whether it's a new game or a loaded save game
    },

    onNewGame: function(callback) {
      // called only when you start a new game
    },

    onLoadGame: function(callback) {
      // called only when you load a save
    },

    onSaveGame: function(callback) {
    },

    onGameOver: function(callback) {
      // might be cleaner to implement this by having a GameSession object that we
      // can create and destroy, while GameEngine remains persistent?
      // (player object probably belongs to session)
    },

    start: function(startingMode, callback) {
      var self = this;
      console.log("Gonna loadThemAll");
      // This is a common place for startup to fail, because if
      // any of the loading files doesnt' load, the callback never
      // gets called
      this.loader.loadThemAll(function() {
        console.log("Loaded them all");
        $("#loading-progress").hide();
        self.mainMode(startingMode);
        if (callback) {
          callback();
        }
      },
      function(progress) {
        // the progress bar callback function
        $("#loading-progress").html("LOADING IMAGES " + Math.floor(progress * 100) + "% ..."); 
      });
	window.setTimeout(function() {
	    self.loader.listUnloaded(); // just for debug
	}, 5000);

    }

    // do save?
    // do load?

    // send player to ('mapname', x, y) ?
  };

  function GameModeMixin(subclassPrototype) {
    /* All game modes need to have:
     * - an input interpreter
     * - either their own animator or to piggyback on another mode's renderer
     * - functions for switching into and out of the mode */

    subclassPrototype.saveNamedOptions = function(options, fieldNames){
      if (!options) {
        // nothing to do here
        return;
      }
      var self = this;
      if (!self.settings) {
        self.settings = {};
      }
      $(fieldNames).each(function(index, fieldName) {
        if (options.hasOwnProperty(fieldName)) {
          self.settings[fieldName] = options[fieldName];
        }
      });
    };
  }

  
  function MapMode(options) {
    // Defaults:
    this.settings = {scale: 1.0,
                     pixelsPerSquare: 16,
                     widthSquares: 20,
                     heightSquares: 18,
                     mapAnimFrameTime: 40,
                     tileOffset: {x: 0, y: 0},
                     spriteDimensions: {width: 16, height: 16,
                                        offsetX: 0, offsetY: 0},
                     walkAnimationFrames: 5,
                     scrollMargins: {left: 6, top: 5, right: 6, bottom: 5},
                     animationCallback: function() {}
                    };
    this.setOptions(options);
    this.hasOwnAnimator = true;
    this.engine = null;
    this.animator = new Animator(this.settings.mapAnimFrameTime);

    this._mapRegistry = {};

  }
  MapMode.prototype = {
    setOptions: function(options) {
      this.saveNamedOptions(options, ["htmlElem", "screenWidth", "screenHeight",
                                      "scale", "widthSquares", "heightSquares",
                                      "pixelsPerSquare", "mapAnimFrameTime",
                                      "tileOffset", "walkAnimationFrames",
                                      "spriteDimensions",
                                      "scrollMargins", "animationCallback"]);
      // TODO maybe better to read this list from my own defaults?

      if (this.settings.htmlElem) {
        // i'm assuming this gets called only once...
        this._realMapScreen = new MapScreen(this.settings.htmlElem[0],
                                            this.settings.widthSquares,
                                            this.settings.heightSquares,
                                            this.settings.pixelsPerSquare,
                                            this.settings.pixelsPerSquare,
                                            this.settings.mapAnimFrameTime
                                           );
        
        this._realMapScreen.setTileOffset(this.settings.tileOffset);
        this._realMapScreen.setScrollMargins(this.settings.scrollMargins);
        
        MapSprite.setDefault("spriteDimensions", this.settings.spriteDimensions);
        MapSprite.setDefault("walkAnimationFrames", this.settings.walkAnimationFrames);
        MapSprite.setDefault("_animationCallback", this.settings.animationCallback);

      }
    },

    handleKey: function(key) {
      var self = this;

      var delX = 0, delY =0;
      switch (key) {
      case DOWN_ARROW:
        delX = 0; delY = 1;
        break;
      case LEFT_ARROW:
        delX = -1; delY = 0;
        break;
      case UP_ARROW:
        delX = 0; delY = -1;
        break;
      case RIGHT_ARROW:
        delX = 1; delY = 0;
        break;
      default:
        this.engine.handleKey(key);
        break;
      }

      if (delX != 0 || delY != 0) {
        // Animate the player moving, wait for animation to finish:
        var anim = self.player.move(delX, delY);
        self.engine._mapInputHandler.waitForAnimation(anim); // encapsulation breaky
        self._realMapScreen.animate(anim); // ??
      }
    },

    getAnimator: function() {
      return this._realMapScreen._animator;
    },

    start: function() {
      //this.animator.start();
      this._realMapScreen.start();
    },

    stop: function() {
      //this.animator.stop();
      this._realMapScreen.stop();
    },

    addMap: function(name, map) {
      this._mapRegistry[name] = map;
    },

    getMap: function(name) {
      return this._mapRegistry[name];
    },
    
    putPlayerAt: function(player, mapName, x, y) {
      this.player = player;
      this._realMapScreen.setNewDomain(this.getMap(mapName)._realMap);
      player.enterMapScreen(this._realMapScreen, x, y);
    },

    switchTo: function(mapName, x, y) {
      this._realMapScreen.setNewDomain(this.getMap(mapName)._realMap);
      this.player.enterMapScreen(this._realMapScreen, x, y);
    }


    // Figure out the best place to set which land types are crossable
    // (on foot and in each vehicle)
  };
  GameModeMixin(MapMode.prototype);


  function BattleMode(options) {
    // Defaults:
    this.settings = {
      menuBaseElem: null,
      menuImpl: "css",
      battleCmdSet: [],
      menuPositions: {msgLeft: 10,
                      msgTop: 100,
                      menuLeft: 100,
                      menuTop: 100,
                      menuXOffset: 25},
      menuTextStyles: {
      }
    };
    this.startBattleMsg = null;
    this.setOptions(options);
    this.hasOwnAnimator = true;
  }
  BattleMode.prototype = {
    setOptions: function(options) {
      this.saveNamedOptions(options, ["menuBaseElem", "menuImpl",
                                      "screenWidth", "screenHeight",
                                      "stdBattleCmds", "menuPositions",
                                      "menuTextStyles", "startBattleMsg"]);

      // Should support options like:
      // animation frame rate
      // defaultCmdSet -- just a list of command NAMES which refer to command registry
      // onDrawBattle
      // canvas or css menus?
      // menuPositions
      // if these are "options" then they should have sensible defaults!

      if (this.engine && !this._realBattleSystem) {
        this._realBattleSystem = new BattleSystem(this.settings.menuBaseElem,
                                                  this.engine.canvas,
                                                  {defaultCmdSet: this.settings.stdBattleCmds,
                                                   width: this.settings.screenWidth,
                                                   height: this.settings.screenHeight,
                                                   startBattleMsg: this.settings.startBattleMsg
                                                  });
        this._realBattleSystem.setMenuPositions(this.settings.menuPositions);
        var self = this;
        this._realBattleSystem.onClose(function() {
          self.engine.closeMode();
        });
      }
    },

    getAnimator: function() {
      return this._realBattleSystem._animator;
    },

    start: function() {
      //this._realBattleSystem._animator.start();
    },

    stop: function() {
      //this._realBattleSystem._animator.stop();
    },

    startBattle: function(player, encounter, landType) {
      this._realBattleSystem.startBattle(player, encounter, landType);
    },

    onDrawBattle: function(callback) {
      this._realBattleSystem.onDrawBattle(callback);
    },

    onStartBattle: function(callback) {
      this._realBattleSystem.onStartBattle(callback);
    },

    handleKey: function(key) {
      this._realBattleSystem.handleKey(key);
    }
  };
  GameModeMixin(BattleMode.prototype);


  function MazeMode(options) {
    // Defaults:
    this.settings = {
      mazeAnimFrameTime: 100
    };
    this.setOptions(options);
    this.hasOwnAnimator = true;
    this.engine = null;
    this.animator = new Animator(this.settings.mazeAnimFrameTime);

    this._mapRegistry = {};
  }
  MazeMode.prototype = {
    setOptions: function(options) {
      this.saveNamedOptions(options, ["mazeAnimFrameTime"]);
    },

    handleKey: function(key) {
      var self = this;
      var anim;
      switch (key) {
      case DOWN_ARROW:
        anim = self.mazeScreen.goBackward();
        break;
      case LEFT_ARROW:
        anim = self.mazeScreen.turnLeft();
        break;
      case UP_ARROW:
        anim = self.mazeScreen.goForward();
        break;
      case RIGHT_ARROW:
        anim = self.mazeScreen.turnRight();
        break;
      default:
        this.engine.handleKey(key);
        break;
      }
      if (anim) {
        self.engine._mapInputHandler.waitForAnimation(anim); // encapsulation breaky
        self.animator.runAnimation(anim);
      }
    },

    getAnimator: function() {
      return this.animator;
    },

    start: function() {
      this.animator.start();
    },

    stop: function() {
      this.animator.stop();
    },

    addMap: function(name, map) {
      this._mapRegistry[name] = map;
    },

    getMap: function(name, map) {
      return this._mapRegistry[name];
    }
  };
  GameModeMixin(MazeMode.prototype);

  
  function MenuMode(options) {
    // Defaults:
    this.settings = {
      menuBaseElem: null,
      menuImpl: "css",
      defaultCmdSet: [],
      menuPositions: {msgLeft: 10,
                      msgTop: 100,
                      menuLeft: 100,
                      menuTop: 100,
                      menuXOffset: 25},
      menuTextStyles: {
      }
    };
    this.setOptions(options);
    this.hasOwnAnimator = false;
  }
  MenuMode.prototype = {
    setOptions: function(options) {
      this.saveNamedOptions(options, ["menuBaseElem", "menuImpl",
                                      "screenWidth", "screenHeight",
                                      "defaultCmdSet", "menuPositions",
                                      "menuTextStyles"]);
      // Should support options like:
      // default command set (do these go in the command registry or not?)
      // include spell menu? include item menu?
      // canvas vs css menus, and text style are set globally in game engine
      // but menu positions are set here
      var self = this;

      // TODO this setOptions function has side-effects, which is not what we want!
      // especially since it may end up getting called multiple times, in which case
      // the original field menu gets replaced by a new one!
      // Switch to a lazy instantiation of the field menu
      this._realFieldMenu = new FieldMenu(this.settings.menuBaseElem, 
                                          null, this.settings.screenWidth,
                                          this.settings.screenHeight,
                                          this.settings.defaultCmdSet);

      this._realFieldMenu.setMenuPositions(this.settings.menuPositions);

      this._realFieldMenu.onClose(function() {
        self.engine.closeMode();
      });
    },

    handleKey: function(key) {
      this._realFieldMenu.handleKey(key);
    },

    start: function() {
      this._realFieldMenu.open(this.engine.player);
    },

    stop: function() {

    }
  };
  GameModeMixin(MenuMode.prototype);


  function DialogMode(options) {
    // Defaults:
    this.settings = {
      menuBaseElem: null,
      menuImpl: "css",
      defaultCmdSet: [],
      menuPositions: {msgLeft: 20,
                      msgTop: 128},
      menuTextStyles: {
      }
    };
    this.setOptions(options);
    this.hasOwnAnimator = false;
  }
  DialogMode.prototype = {
    setOptions: function(options) {
      this.saveNamedOptions(options, ["menuBaseElem", "menuImpl",
                                      "screenWidth", "screenHeight",
                                      "menuPositions", "menuTextStyles"]);

      this._realDialog = new Dialoglog(this.settings.menuBaseElem, 
                                       null, this.settings.screenWidth,
                                       this.settings.screenHeight);
      this._realDialog.setMenuPositions(this.settings.menuPositions);

      var self = this;
      this._realDialog.onClose(function() {
        self.engine.closeMode();
      });

    },

    handleKey: function(key) {
      this._realDialog.handleKey(key);
    },

    start: function() {
      this._realDialog.open(this.engine.player);
    },

    stop: function() {

    }
    
  };
  GameModeMixin(DialogMode.prototype);



  function MapMixin(subclassPrototype) {
  }


  function TileMap(mapname, data, tileset) {
    this._mapData = data;
    this._tileset = tileset;
    this._realMap = new Map(mapname, data, tileset, "tilemap");
  }
  TileMap.prototype = {

    drawMap: function(ctx, drawX, drawY) {
    },

    onStep: function(trigger, callback) {
      this._realMap.onStep(trigger, callback);
    }
  };
  MapMixin(TileMap.prototype);


  function SingleImageMap(mapname, data, imagefile) {
    this._mapData = data;
    this._imagefile = imagefile;

    this._realMap = new Map(mapname, data, imagefile, "singleImage");
    // TODO:
    // Maybe just delete these two classes and make the changes in 
    // worldMapClasses.Map ?
  }
  SingleImageMap.prototype = {
    drawMap: function(ctx, drawX, drawY) {
    },

    onStep: function(trigger, callback) {
      this._realMap.onStep(trigger, callback);
    }
  };
  MapMixin(SingleImageMap.prototype);



  return { GameEngine: GameEngine,
           MapMode: MapMode,
           BattleMode: BattleMode,
           MazeMode: MazeMode,
           MenuMode: MenuMode,
           DialogMode: DialogMode,
           TileMap: TileMap,
           SingleImageMap: SingleImageMap
         };

})();
