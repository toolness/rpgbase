function CmdMenuMixin(subClassProto) {
  subClassProto._init = function() {
    this.cmdList = [];
    this.selectedIndex = 0;
    this.title = null;
  };

  subClassProto.clear = function() {
    this.cmdList = [];
  };

  subClassProto.setTitle = function(title) {
    this.title = title;
  };

  subClassProto.addCommand = function(name, callback) {
    this.cmdList.push({name: name, execute: callback});
  };
    
  subClassProto.moveSelectionUp = function() {
    this.selectedIndex --;
    if (this.selectedIndex < 0) {
      this.selectedIndex = this.cmdList.length - 1;
    }
    this.showArrowAtIndex(this.selectedIndex);
  };
  
  subClassProto.moveSelectionDown = function() {
    this.selectedIndex ++;
    if (this.selectedIndex >= this.cmdList.length) {
      this.selectedIndex = 0;
    }
    this.showArrowAtIndex(this.selectedIndex);
  };

  subClassProto.chooseSelected =  function() {
    var cmd = this.cmdList[this.selectedIndex];
    cmd.execute();
  };

  subClassProto.onKey = function(keyCode) {
    switch(keyCode) {
    case UP_ARROW:
      this.moveSelectionUp();
      break;
    case DOWN_ARROW:
      this.moveSelectionDown();
      break;
    case CONFIRM_BUTTON: // enter or space
      this.chooseSelected();
      break;
    }
  };

  subClassProto.reset = function() {
    this.selectedIndex = 0;
  };

  subClassProto.hasCmd = function(cmdName) {
    for (var i = 0; i < this.cmdList.length; i++) {
      if (this.cmdList[i].name == cmdName) {
        return true;
      }
    }
    return false;
  };

  subClassProto.listCmdNames = function() {
    var names = [];
    for (var i = 0; i < this.cmdList.length; i++) {
      names.push(this.cmdList[i].name);
    }
    return names;
  };

}

var CanvasTextUtils = {
  // singleton object
  _fontImg: null,

  setFontImg: function(img) {
    this._fontImg = img;
  },

  oldDrawTextBox: function(ctx, x, y, width, height, textLines) {
    var cornerRadius = this.styles.cornerRadius;
    ctx.beginPath();
    // top edge:
    var right = x + width;
    var bottom = y + height;
    ctx.moveTo( x + cornerRadius, y);
    ctx.lineTo( right - cornerRadius, y);
    // top-right curve
    ctx.arc( right - cornerRadius,
	     y + cornerRadius,
	     cornerRadius, 3 * Math.PI/2, 0, false);
    ctx.lineTo( right, bottom - cornerRadius);
    //bottom-right curve:
    ctx.arc( right - cornerRadius,
	     bottom - cornerRadius,
	     cornerRadius, 0, Math.PI/2, false);
    ctx.lineTo( x + cornerRadius, bottom);
    //bottom-left curve:
    ctx.arc( x + cornerRadius,
	     bottom - cornerRadius,
	     cornerRadius, Math.PI/2, Math.PI, false);
    ctx.lineTo( x, y + cornerRadius);
    //top-left curve:
    ctx.arc( x + cornerRadius,
	     y + cornerRadius,
	     cornerRadius, Math.PI, 3*Math.PI/2, false);
    // clear area
    ctx.fillStyle = this.styles.bgColor;
    ctx.strokeStyle = this.styles.borderColor;
    ctx.fill();
    ctx.stroke();

    if (textLines && textLines.length > 0) {
      ctx.font = this.styles.font;
      ctx.fillStyle = this.styles.fontColor;
      // draw each line:
      for (var i = 0; i < textLines.length; i++) {
        var plotX = x + this.styles.leftMargin;
        var plotY = y + this.styles.topMargin + this.styles.lineHeight*i;
        this.customRenderText(ctx, textLines[i], plotX, plotY);
      }
    }
  },

  drawTextBox: function(ctx, x, y, width, height, textLines, options) {

    var W = 0;
    for (var i =0; i < textLines.length; i++) {
      if (textLines[i].length > W) {
        W = textLines[i].length;
      }
    }
    var L = textLines.length;

    W *= this.styles.fontSize;
    L *= this.styles.lineHeight;

    // opional overrides:
    // (HORRIBLE HACKERY here. If we're going to calc our own width/height for most
    // things, then we shouldn't take width and height as required arguments only to ignore
    // them! options should be the only optional argument. TODO refactor.
    // we could have that args are ctx, x, y, textLines, width, height, and width/height are
    // optional args. Or that passing "auto" to width and/or height lets this function calculate.
    if (options && options.width) {
        // Should calculate width/height correctly instead of adjusting it on the fly here.
        // TODO refactor
        W = options.width;
    }
    if (options && options.height) {
        L = options.height;
    }

    /*White pixels from 0,1 to 1,(8*L+2,)
      Characters placed from font.png starting at 2,2 with an 8 pixel offset.
      Black pixels from 2,(8*L+2) to (8*W+1),(8*L+2)
      Black pixels from (8*W+2),2 to (8*W+2),(8*L+1)
      White pixels from 1,(8*L+4) to (8*W+2),(8*L+5)
      While pixels from (8*W+4),1 to (8*W+5),(8*L+2,)*/
    ctx.fillStyle = this.styles.bgColor;
    ctx.fillRect(x+1.5, y+1.5, W+2.5, L+1.5);

      // Top side:
    ctx.strokeStyle = this.styles.borderColor;
    ctx.beginPath();
    ctx.moveTo(x+1, y + 0.5);
    ctx.lineTo(x + W + 4, y + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+1, y+1.5);
    ctx.lineTo(x + W + 4, y+1.5);
    ctx.stroke();

      // Left side:
    ctx.beginPath();
    ctx.moveTo(x + 0.5, y+1);
    ctx.lineTo(x +0.5, y+L + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+1.5, y+1);
    ctx.lineTo(x+1.5, y+L + 2);
    ctx.stroke();

      // Bottom side:
    ctx.beginPath();
    ctx.moveTo(x+1, y+ L + 1.5);
    ctx.lineTo(x+ W +4, y+ L + 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+1, y+ L + 2.5);
    ctx.lineTo(x+ W +4, y+ L + 2.5);
    ctx.stroke();

      // Right side:
    ctx.beginPath();
    ctx.moveTo(x+ W + 3.5, y+ 1);
    ctx.lineTo(x+ W + 3.5, y + L+2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+ W + 4.5, y+ 1);
    ctx.lineTo(x+ W + 4.5, y + L+2);
    ctx.stroke();

    
    if (textLines && textLines.length > 0) {
      ctx.font = this.styles.font;
      ctx.fillStyle = this.styles.fontColor;
      // draw each line:
      for (var i = 0; i < textLines.length; i++) {
        var plotX = x + 2; // + this.styles.leftMargin;
        var plotY = y + this.styles.lineHeight*i + 2; //+ this.styles.topMargin + this.styles.lineHeight*i;
        this.customRenderText(ctx, textLines[i], plotX, plotY);
      }
    }
  },

  customRenderText: function(ctx, text, x, y) {
    if (!this._fontImg) {
      ctx.fillText(text, x, y);
      return;
    }
    // using jake's font
    // they're 8 by 8
    var textSize = 8;
    for (var i = 0; i < text.length; i++) {
      var asciiCode = text.charCodeAt(i); 
      var slice;
      if (asciiCode >= 97 && asciiCode <= 122) {
        // lower case letters -- map to gibberish
          slice = asciiCode - 40; // was 87;
      }
      else if (asciiCode >= 65 && asciiCode <= 90) {
        // capital letters
        slice = asciiCode - 55;
      }
      else if (asciiCode >= 48 && asciiCode <= 57) {
        // numerals
        slice = asciiCode - 48;
      }
      else {
        var punctuation = ".,!?:&/'\"~ ";           // starts at pos 36
        var index = punctuation.indexOf(text[i]);
        if (index > -1) {
          slice = 36 + index;
        } else {
          continue;
        }
      } 
      ctx.drawImage(this._fontImg,
                    textSize*slice, 0,
                    textSize, textSize,
                    x + textSize*i, y,
                    textSize, textSize);
    }
    
  },

  splitLines: function(text) {
    // split text up into lines:
    var words = text.split(" ");
    var lines = [];
    var currLine = words.shift();
    var maxLineLength = this.styles.maxLineLength;
    while (words.length > 0) {
      var word = words.shift();
      if (currLine.length + word.length + 1 <= maxLineLength) {
        currLine = currLine + " " + word;
      } else {
        lines.push(currLine);
        currLine = word;
      }
    }
    if (currLine.length > 0) {
      lines.push(currLine);
    }
    return lines;
  },

  setStyles: function(options) {
    for (var prop in options) {
      this.styles[prop] = options[prop];
    }
  },

  getStyles: function() {
    return this.styles;
  },

  styles: {
    leftMargin: 5,
    rightMargin: 5,
    topMargin: 5,
    bottomMargin: 5,
    lineHeight: 12,
    fontSize: 6,
    cornerRadius: 3,
    maxLineLength: 32,
    font: "6pt monospace",
    fontColor: "white",
    bgColor: "black",
    borderColor: "white",
    scrollBoxLines: 2
  }
};


function CanvasMixin(subclassPrototype) {
  subclassPrototype.display = subclassPrototype.parentDisplay = function(ctx) {
    if (!ctx) {
      return;
    }
    var styles = CanvasTextUtils.getStyles();
    // calc width and height based on text size of
    // contents

    this.width = styles.leftMargin + styles.rightMargin;
    var textLines = this.getTextLines();
    var longestCommand = 0;
    $.each(textLines, function(i, line) {
      if (line.length > longestCommand) {
        longestCommand = line.length;
      }
    });
    // TODO use that method that calcs text size:
    this.width = styles.leftMargin + styles.rightMargin + styles.fontSize * longestCommand;
    this.height = this.cmdList.length * styles.lineHeight + styles.topMargin + styles.bottomMargin;
    
    var x = this.x;
    var y = this.y;

    if (this.title) {
        //var titleHeight = styles.topMargin + styles.lineHeight + styles.bottomMargin;
      var titleHeight = styles.lineHeight + 3; // TODO this is moonserpent-specific!!
      CanvasTextUtils.drawTextBox(ctx, x, y, this.width, titleHeight,
                                 [this.title]);
      y += titleHeight;
    }
    
    CanvasTextUtils.drawTextBox(ctx, x, y,
                                this.width, this.height, textLines);
  };

  subclassPrototype.close = function() {
    // TODO anything to do here? Just stop drawing it right?
  };

  subclassPrototype.setPos = function(x, y) {
    this.x = x;
    this.y = y;
  };

  subclassPrototype.getPos = function() {
    return {x: this.x, y: this.y};
  };
}



function CanvasCmdMenu(cursorImg) {
  this._init();
  this.x = 0; 
  this.y = 0;
  this.width = 50;
  this.height = 150;
  this._cursorImg = cursorImg;
}
CanvasMixin(CanvasCmdMenu.prototype);
CmdMenuMixin(CanvasCmdMenu.prototype);
CanvasCmdMenu.prototype.getTextLines = function() {
  var textLines = [];
  // prepend space before each line of text, to give room for cursor
  for (var i =0; i < this.cmdList.length; i++) {
    textLines.push( " " + this.cmdList[i].name);
  }
  return textLines;
};
CanvasCmdMenu.prototype.display = function(ctx) {
  this.parentDisplay(ctx);
    // If cursorImg is defined, draw that; otherwise,
    // draw the triangular indicator:
    var yBase = this.y + styles.lineHeight * this.selectedIndex;
    if (this._cursorImg) {
      ctx.drawImage(this._cursorImg, this.x + 2, yBase + 2);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 4, yBase + 5);
      ctx.lineTo(x + 8, yBase + 9);
      ctx.lineTo(x + 4, yBase + 13);
      ctx.lineTo(x + 4, yBase + 5);;
      ctx.fill();
    }
};
CanvasCmdMenu.prototype.showArrowAtIndex = function(index) {
  // TODO  -- if display is getting called on
  // the animation loop, do I even need this?
};


/* Canvas menus TODO: 
   (check) * - the showMsg must be drawn in this way too -- preferrably somewhere NOT overlapping default menu position the way it does now!

   (check) * - share the margins, corner radius, line height, etc etc
       with the cmd menus. Make some sort of style object owned by
       the MenuSystem

   (check) * - dialoglog must be drawn in this way.
   (check) * - dialoglog must be explicitly overlaid over map screen using an afterRender callback.
   (check) * - Provide userland with an API for specifying font, font size, line height, margins, border radius, colors, border thickness, and positioning of menus.
     ** - share this style object - store it somewhere where everyone
          can refer to it. Owned by the MenuSystem?
     how do they specify position of menus?
     ** - first chara stats go here
     ** - each chara stats after that goes at +x +y from there
     ** - message window goes here
     ** - set width and height to a number OR 'auto' where auto means
           calculate based on size of text inside
     ** - main menu goes here
     ** - each submenu gets offset by +x +y from there


 * - don't let canvas menus go off the edge of the canvas -- if bottom is below bottom edge, bump it up. if right is past right edge, bump it left.
 (done) * - during input of character combat actions, pop or hide some of the already-chosen submenus -- they don't need to take up space on the screen.
 * - bug: if i have multiple items with the same name, only one seems to show up on the item menu in combat!  (a useful, if accidental, space-saving feature?)


 (check)  * - Show titles on canvas menus! (currently not shown)

 (check) * - Jake's battle system wants main menu for each character to appear
    - in same place, submenus to appear relative to it. So we can't
    - just have one xoffset/yoffset that's always applied. Easy enough
    - to hard code this in but think about how to do it more flexibly.
    - maybe one of the options to setMenuPositions could be
    - menus-per-character: reset or relative
*/


function CssMixin(subclassPrototype) {
   subclassPrototype.display = subclassPrototype.parentDisplay = function() {
      this.parentTag = $("<div></div>");
      this.parentTag.addClass("menu");
      if (this.title) {
        var titleSpan = $("<span></span>");
        titleSpan.addClass("menu");
        titleSpan.html(this.title);
        this.parentTag.append(titleSpan);
      }
      this.table = $("<table></table>");
      this.parentTag.css("left", this.screenX);
      this.parentTag.css("top", this.screenY);
      this.parentTag.append(this.table);
      this.container.append(this.parentTag);

	var self = this;

	for (var c in this.cmdList) {
	    var row = $("<tr></tr>");
	    var cell = $("<td></td>");
	    cell.html();
	    row.append(cell);
	    cell = $("<td></td>");
	    var name = this.cmdList[c].name;
	    cell.html(name);
	    row.append(cell);
	    /*(function(row, c) {
		row.on("mouseover", function(e) {
		    self.showArrowAtIndex(c);
		});
		row.on("click", function(e) {
		    self.selectedIndex = c;
		    self.chooseSelected();
		});
	    })(row, c);*/
	    this.table.append(row);
	}
	this.showArrowAtIndex(0);
	this.parentTag.focus();
   };
  
  subclassPrototype.close = function() {
    this.parentTag.remove();
  };

  subclassPrototype.setPos = function(x, y) {
    this.screenX = x;
    this.screenY = y;
    if (this.parentTag) {
      this.parentTag.css("left", x);
      this.parentTag.css("top", y);
    }
  };

  subclassPrototype.getPos = function() {
    return {x: this.screenX, y: this.screenY};
  };
}


function CssCmdMenu(container) {
  this._init();
  this.container = container;
  this.cursorHtml = "<blink>&#x25B6;</blink>";
}
CssCmdMenu.prototype = {
    showArrowAtIndex: function(index) {
      var rows = this.table.find("tr");
      for (var r = 0; r < rows.length; r++) {
	var cell = $(rows[r]).find("td")[0];
	if (r == index) {
	  $(cell).html(this.cursorHtml);
	} else {
	  $(cell).empty();
	}
      }
    }
};
CmdMenuMixin(CssCmdMenu.prototype);
CssMixin(CssCmdMenu.prototype);


function MenuSystemMixin(subClassPrototype) {
  subClassPrototype._init = function(htmlElem, cursorImg, width, height) {
      
    this.menuStack = [];
    this._htmlElem = htmlElem;
    if (htmlElem) {
      this.displayElem = this._htmlElem.find(".msg-display");
      this.menuImpl = "css";
      this._calculatedScale = 1.0;
    } else {
      // If no html elem specified, use in-canvas menus:
      this.displayElem = null;
      this.menuImpl = "canvas";
    }
    this._screenWidth = width;
    this._screenHeight = height;
    this._rootMenu = null;
    this._party = null;
    this._closeCallbacks = [];
    this._openCallbacks = [];
    this._resourceVisible = false;
    this._statDisplayType = "short";
    this._fixedDisplayBoxes = [];
    this._savedStackDepth = 0;

    // cursor image is optional
    this._cursorImg = cursorImg;

    this._positioning = {
      statsLeft: 0,
      statsTop: 0, // stats width and height?
      statsWidth: "auto",
      statsHeight: "auto",
      statsXOffset: 0,
      statsYOffset: 0,
      
      msgLeft: 25,
      msgTop: 125,
      msgWidth: "auto", // not yet used
      msgHeight: "auto", // not yet used
      
      menuLeft: 0,
      menuTop: 0,
      menuWidth: "auto", // not yet used
      menuHeight: "auto", // not yet used
      menuXOffset: 0,
      menuYOffset: 0,

      resourceLeft: 160,
      resourceTop: 10,
      resourceWidth: 90,
      resourceHeight: 20
    };
  };

  subClassPrototype.menuFromCmdSet = function (title, cmdSet) {
    var self = this;
    var subMenu = this.makeMenu();
    if (title && title != "") {
      subMenu.setTitle(title);
    }
    
    var addOneCmd = function(name, cmd) {
      // allow recursive submenus
      if (cmd.isContainer) {
        subMenu.addCommand(name, function() {
          self.pushMenu(self.menuFromCmdSet(name, cmd));
        });
      } else {
        subMenu.addCommand(name, function() {
          cmd.effect(self, self._party);
        });
      }
    };
    cmdSet.forEach(addOneCmd);
    return subMenu;
  };

  subClassPrototype.open = function(player) {
    this._player = player;
    this._party = player.getParty();
    if (this.menuImpl != "canvas") {
      this._htmlElem.show();
    }
    if (this._rootMenu) {
      this.pushMenu(this._rootMenu);
    }
    this.clearMsg();
    this.hidePartyStats();
    this.hidePartyResources();
    for (var i = 0; i < this._openCallbacks.length; i++) {
      this._openCallbacks[i]();
    }
  };

  subClassPrototype.close = function() {
    this.emptyMenuStack();
    if (this._rootMenu) {
      this._rootMenu.reset();
    }
    this.canvasStyleMsgText = null;
    this.hidePartyStats();
    this.hidePartyResources();
    this.hide();
    for (var i = 0; i < this._closeCallbacks.length; i++) {
      this._closeCallbacks[i]();
    }
  };

  subClassPrototype.makeMenu = function() {
    if (this.menuImpl == "canvas") {
      return new CanvasCmdMenu(this._cursorImg);
    } else {
      return new CssCmdMenu(this._htmlElem, this._cursorImg);
    }
  };

  subClassPrototype.makeScrollingTextBox = function(dialogText) {
    if (this.menuImpl == "canvas") {
      return new CanvasScrollingTextBox(dialogText, this);
    } else {
      return new CssScrollingTextBox(dialogText, this);
    }
  };

  subClassPrototype.makeFixedTextBox = function(dialogText) {
    if (this.menuImpl == "canvas") {
      return new CanvasFixedTextBox(dialogText, this);
    } else {
      return new CssFixedTextBox(dialogText, this);
    }
  };

  // TODO will need a function that instantiates fixed or scrolling text boxes
  // also according to this.menuImpl

  subClassPrototype.getScaledMenuPos = function() {
    return this._scalePositions(this._positioning.menuLeft,
                                this._positioning.menuTop);
  };

  subClassPrototype.getScaledStatsPos = function() {
    return this._scalePositions(this._positioning.statsLeft,
                                this._positioning.statsTop);
  };
  
  subClassPrototype._scalePositions = function(x, y) {
    if (y > 0 && this.menuImpl == "css") {
      y *= this._calculatedScale;
    }
    if (x > 0 && this.menuImpl == "css") {
      x *= this._calculatedScale;
    }
    // TODO in the future we want to scale the position regardless of whether it's
    // positive, but for now that causes too many problems.

    if (y < 0) {
      // negative value means offset from bottom
      var offset = this._screenHeight - 20; // -20 is for margins/padding
      if (this.menuImpl == "css") {
        offset *= this._calculatedScale;
      }
      y += offset;
    }
    if (x < 0) {
      offset= this._screenwidth - 20;
      if (this.menuImpl == "css") {
        offset *= this._calculatedScale;
      }
      x += offset;
    }

    return {x: x, y: y};
  };

  subClassPrototype.pushMenu = function(newMenu) {
    var x, y;
    
    if (this.menuStack.length > 0) {
      var topMenu = this.menuStack[this.menuStack.length -1];
      var pos = topMenu.getPos();
      x = pos.x + this._positioning.menuXOffset;
      y = pos.y + this._positioning.menuYOffset;
    } else {
      var pos = this.getScaledMenuPos();
      x = pos.x;
      y = pos.y;
    }

    newMenu.setPos(x, y);
    this.menuStack.push(newMenu);
    if (this.menuImpl != "canvas") {
      newMenu.display();
    }
  };

  subClassPrototype.popMenu = function() {
    if (this.menuStack.length > 0) {
      this.menuStack[ this.menuStack.length - 1].close();
      this.menuStack.pop();
    }
  };

  subClassPrototype.returnToRoot = function() {
    while(this.menuStack.length > 1) {
      this.popMenu();
    }
  };

  subClassPrototype.emptyMenuStack = function() {
    for (var i = 0; i < this.menuStack.length; i++) {
      this.menuStack[i].close();
    }
    this.menuStack = [];
  };

  subClassPrototype.hide = function() {
    if (this.menuImpl == "css") {
      this._htmlElem.hide();
    }
  };

  subClassPrototype.onOpen = function(callback) {
    this._openCallbacks.push(callback);
  };

  subClassPrototype.onClose = function(callback) {
    this._closeCallbacks.push(callback);
  },

  subClassPrototype.showMsg = function(msg) {
    if (this.menuImpl == "canvas") {
      this.canvasStyleMsgText = msg;
      this.canvasStyleMsgLines = CanvasTextUtils.splitLines(msg);
    } else {
      this.displayElem.css("left", this._positioning.msgLeft);
      this.displayElem.css("top", this._positioning.msgTop);
      this.displayElem.append($("<span></span>").html(msg));
      this.displayElem.append($("<br>"));
      this.displayElem.show();
    }
    this._lastMsgShown = msg; // for debugging/unit testing
  };

  subClassPrototype.clearMsg = function() {
    if (this.menuImpl == "canvas" ) {
      this.canvasStyleMsgText = null;
      this.canvasStyleMsgLines = [];
    } else {
      this.displayElem.hide();
      this.displayElem.empty();
    }
  };

  subClassPrototype.scrollText = function(dialogText) {
    // Turn into a scrolling message box and push onto stack
    this.clearMsg();
    var textBox = this.makeScrollingTextBox(dialogText);
    this.pushMenu(textBox);
    textBox.setPos(this._positioning.msgLeft,
                   this._positioning.msgTop);
    return textBox;
  },

  subClassPrototype.chooseOne = function(title, set, callback) {
    var charMenu = this.makeMenu();
    charMenu.setTitle(title);
    var self = this;
    var addOneCmd = function(target) {
      charMenu.addCommand(target.name, function() {
        callback(target);
      });
    };
    for (var i = 0; i < set.length; i++) {
      addOneCmd(set[i]);
    }
    this.pushMenu(charMenu);
  };

  subClassPrototype.chooseCharacter = function(title, callback) {
    this.chooseOne(title, this._party, callback);
  };
  
  subClassPrototype.showPartyStats = function() {
    // If impl is canvas, draw these in canvas instead!!
    // use this._positioning.statsLeft, statsTop, statsXOffset etc.
    if (this.menuImpl == "canvas") {
        this.canvasPartyStats = true;
    } else {
      this._htmlElem.find(".stats").remove();
      var pos = this.getScaledStatsPos();
      var left = pos.x;
      var top = pos.y;
      for (var i = 0; i < this._party.length; i++) {
        var statHtml = this._party[i].getStatDisplay(this._statDisplayType);
        var statBox = $("<div></div>").html(statHtml);
        statBox.addClass("stats");
        statBox.css("left", left + "px");
        statBox.css("top", top + "px");
        statBox.css("width", this._positioning.statsWidth);
        statBox.css("height", this._positioning.statsHeight);
        this._htmlElem.append(statBox);
        left += this._positioning.statsXOffset;
        top += this._positioning.statsYOffset;
      }
    }
  };

  subClassPrototype.hidePartyStats = function() {
    if (this.menuImpl == "canvas") {
      this.canvasPartyStats = null;
    } else {
      this._htmlElem.find(".stats").remove();
    }
  };

  subClassPrototype.yesOrNo = function(callback) {
    var yesOrNoMenu = this.makeMenu();
    yesOrNoMenu.addCommand("YES", function() {
      callback(true);
    });
    yesOrNoMenu.addCommand("NO", function() {
      callback(false);
    });
    this.pushMenu(yesOrNoMenu);
  },

  subClassPrototype.drawCanvasMenus = function(ctx) {
    if (this.menuImpl == "canvas") {
      // do this next part only if using canvas menus and
      // only if they're open:
      for (var i = 0; i < this.menuStack.length; i++) {
        this.menuStack[i].display(ctx);
      }
      if (this.canvasStyleMsgText) {
        // Draw any open message set by showMsg
        this.drawCanvasMsgText(ctx, this.canvasStyleMsgText);
      }
      if (this.canvasPartyStats) {
          this.drawCanvasPartyStats(ctx, this._party);
      }
      if (this._resourceVisible) {
        // TODO turn this into a special case of fixedDisplayBoxes?
        this.drawCanvasPartyResources(ctx);
      }
      for (var i = 0; i < this._fixedDisplayBoxes.length; i++) {
        this._fixedDisplayBoxes[i].display(ctx);
      }
    }
  };

  subClassPrototype.drawCanvasMsgText = function(ctx, text) {
    var styles = CanvasTextUtils.getStyles();

    var x = this._positioning.msgLeft;
    var y = this._positioning.msgTop;

    var lines = this.canvasStyleMsgLines;
    var width = styles.leftMargin + styles.rightMargin 
      + styles.maxLineLength * styles.fontSize;
    var numLines = lines.length;
    var height = styles.topMargin + styles.bottomMargin
      + numLines * styles.lineHeight;

    CanvasTextUtils.drawTextBox(ctx, x, y, width, height, lines);
  };

  subClassPrototype.drawCanvasPartyStats = function(ctx, party) {
    var x = this._positioning.statsLeft;
    var y = this._positioning.statsTop;
    var width = this._positioning.statsWidth;
    var height = this._positioning.statsHeight;
    for (var i = 0; i < party.length; i++) {
      party[i].displayStats(ctx, x, y, width, height,
			    this._statDisplayType);
      x += this._positioning.statsXOffset;
      y += this._positioning.statsYOffset;
    }
  };
  
  subClassPrototype.handleKey = function(keyCode) {
    if (keyCode == CANCEL_BUTTON) {
      // cancel -> pop top menu off menu stack, go back to previous one
      if (!this._freelyExit) {
        // If this is not a freely-exitable menu system, then ignore
        // cancel buttons when we're on the root menu of the stack.
        if (this.menuStack.length <= 1) {
          // Yes, this can be zero -- e.g. when a battle is starting before
          // the menus appear
          return;
        }
      }
      if (this.menuStack.length > 0) {
        this.popMenu();
      }
      if (this.menuStack.length == 0) {
        // If you just closed the root menu, close whole menu sysetm:
        this.close();
      }
    } else {
      // if it's not the cancel button, pass it on to the topmost
      // menu of the stack:
      if (this.menuStack.length > 0) {
        this.menuStack[ this.menuStack.length - 1].onKey(keyCode);
      }
    }
  };

  subClassPrototype.setMenuPositions = function(options) {
    // TODO these are currently only applied to Canvas menus.
    // Apply them to CSS menus too?
    for (var prop in options) {
      this._positioning[prop] = options[prop];
    }
  };

  subClassPrototype.saveStackDepth = function() {
    this._savedStackDepth = this.menuStack.length;
  };

  subClassPrototype.restoreStackDepth = function() {
    while (this.menuStack.length > this._savedStackDepth) {
      this.popMenu();
    }
  };

  subClassPrototype.showPartyResources = function() {
    if (this.menuImpl == "canvas") {
      this._resourceVisible = true;
    }
    // TODO implement me for css menus too
  };

  subClassPrototype.hidePartyResources = function() {
    if (this.menuImpl == "canvas") {
      this._resourceVisible = null;
    }
    // TODO implement me for css menus too
  },

  subClassPrototype.drawCanvasPartyResources = function(ctx) {
    // This duplicates a lot from stats windows... should basically
    // be considered part of the stats windows??
    var x = this._positioning.resourceLeft;
    var y = this._positioning.resourceTop;
    var width = this._positioning.resourceWidth;
    var height = this._positioning.resourceHeight;
    var textLines = [];
    var resources;
    if (this._resourceNames) {
        resources = this._resourceNames;
    } else {
        resources = this._player.listResources();
    }
    for (var i = 0; i < resources.length; i++) {
      textLines.push(this._player.getResource(resources[i])
		     + resources[i]);
    }
    CanvasTextUtils.drawTextBox(ctx, x, y, width, height,
                                textLines);
  };

  subClassPrototype.getHilitedCmd = function() {
    if (this.menuStack.length < 1) {
      return null;
    }
    var topMenu = this.menuStack[this.menuStack.length - 1];
    return topMenu.cmdList[topMenu.selectedIndex];
  };

}

function FieldMenu(htmlElem, cursorImg, width, height, commandSet) {
  this._init(htmlElem, cursorImg, width, height);
  this._rootMenu = this.menuFromCmdSet("", commandSet);
  this._freelyExit = true;
  // field menu can always be exited with cancel button,
  // unlike battle menu.
  this._itemSubMenuCmdNames = ["USE", "EQUIP", "GIVE", "DROP"];
  this._resourceNames = [];
}
FieldMenu.prototype = {
  customizeItemSubMenu: function(cmds) {
    this._itemSubMenuCmdNames = cmds;
  },

  customizeResourceDisplay: function(resources) {
    this._resourceNames = resources;
  },

  showItemSubMenu: function(item, character) {
    // do what with this item?
    var self = this;
    var subMenu = this.makeMenu();
    subMenu.setTitle("DO WHAT?");

    for (var i = 0; i < this._itemSubMenuCmdNames.length; i++) {
	switch (this._itemSubMenuCmdNames[i]) {
	case "USE":
    subMenu.addCommand("USE", function() {
      if (item.target == "ally") {
        // If using it requires selecting a target...
        self.chooseCharacter("USE ON?", function(target) {
          self.returnToRoot();
          item.effect(self, character, target);
        });
      } else {
        // TODO are there other target types?
        // e.g. target type "environment" means that
        // item.effect should be passed the map/maze screen
        self.returnToRoot();
        item.effect(self, character, null);
      }
    });
	    break;
	case "EQUIP":
    subMenu.addCommand("EQUIP", function() {
      if (character.canEquipItem(item.reference)) {
        self.showMsg(character.name + " EQUIPS "
                     + item.name);
        character.equipItem(item.reference);
      } else {
        self.showMsg(character.name + " CAN'T EQUIP "
                     + item.name);
      }
      self.returnToRoot();
    });
	    break;
	case "GIVE":
    subMenu.addCommand("GIVE", function() {
      self.chooseCharacter("GIVE TO?", function(target) {
        self.showMsg(character.name + " GIVES THE " + item.name
                    + " TO " + target.name);
        target.receiveItemFrom(item.reference, character);
        self.returnToRoot();
      });
    });
	    break;
	case "DROP":
    subMenu.addCommand("DROP", function() {
      self.showMsg(character.name + " DROPS THE " + item.name);
      character.loseItem(item.reference);
      self.returnToRoot();
    });
	    break;
	}
    }
    this.pushMenu(subMenu);
  },

  showItemMenu: function(character) {
    // TODO will have a lot of parallel code for casting spells
    // outside of battle.
    var self = this;
    var menu = this.makeMenu();
    menu.setTitle("ITEMS:");

    // After selecting an item, give options of
    // Use, Equip, Give, or Drop.
    var itemCmds = character.getInventoryCmds(false); // isBattle=false
    for (var i = 0; i < itemCmds.length; i++) {
      (function(item) {
        menu.addCommand(item.name,
                      function() {
                        self.showItemSubMenu(item, character);
                      });
      })(itemCmds[i]);
    }
    // if item menu is empty:
    if (itemCmds.length == 0) {
      menu.addCommand("NO ITEMS", function() {});
    }

    this.pushMenu(menu);
  },

  executeFieldSpell: function(character, spell) {
    var self = this;
    if (!spell.canUse(character)) {
      self.showMsg("NOT ENOUGH MP."); // TODO maybe other reason?
    } else if (spell.target == "ally") {
      self.chooseCharacter("ON WHO?", function(target) {
        self.popMenu();
        self.popMenu();
        spell.effect(self, character, target);
	// update stats display to show effect of heal:
	self.showPartyStats();
      });
    } else if (spell.target == "all_allies") {
      var party = self._player.getAliveParty();
      self.popMenu();
      spell.effect(self, character, party);
      self.showPartyStats();
    } else {
      // non-target spells:
      self.popMenu();
      spell.effect(self, character); // TODO pass party?
      // update stats display to show effect of heal:
      self.showPartyStats();
    }
  },

  showSpellMenu: function(character) {
    var self = this;
    var menu = this.makeMenu();
    menu.setTitle("SPELLS:");
    var fieldSpells = character._fieldSpells;
    $.each(fieldSpells, function(i, spell) {
      menu.addCommand(spell.name, function() {
        self.executeFieldSpell(character, spell);
      });
    });

    // if no spells:
    if (fieldSpells.length == 0) {
      menu.addCommand("NO MAGIC", function() {});
    }

    this.pushMenu(menu);
  }
};
MenuSystemMixin(FieldMenu.prototype);
FieldMenu.prototype.showMsg = function(text) {
  // field menu always uses scrolling text box for text, never the
  // stack-independent status display
  this.scrollText(text);
  // TODO this needs to respect this._menuImpl
};



function ScrollingTextBoxMixin(subclassPrototype) {
  subclassPrototype.onKey = function(key) {
    if (this.currLine + this.linesAtOnce < this.lines.length) { 
      // advance through scroll text, if large
      this.currLine ++;
      this.update();
    } else {
      // if done, treat any key as cancel button
      this.menuSystem.handleKey(CANCEL_BUTTON);
      for (var i = 0; i < this._closeCallbacks.length; i++) {
        this._closeCallbacks[i]();
      }
    }
  },

  subclassPrototype.onClose = function(callback) {
    this._closeCallbacks.push(callback);
  };

  subclassPrototype.update = function() {
  };
};


function CanvasScrollingTextBox(text, menuSystem) {
  this.lines = CanvasTextUtils.splitLines(text);
  // currently hard-coded to show 2 lines at a time
  this.currLine = 0;
  this.menuSystem = menuSystem;
  var styles = CanvasTextUtils.getStyles();
  this.linesAtOnce = styles.scrollBoxLines;
  this.width = styles.leftMargin + styles.rightMargin 
    + styles.maxLineLength * styles.fontSize;

  this.height = styles.topMargin + styles.bottomMargin
    + this.linesAtOnce * styles.lineHeight;
  this._closeCallbacks = [];
}
// Satisfies same interface as a CmdMenu, so it can go on
  // the menu stack.
ScrollingTextBoxMixin(CanvasScrollingTextBox.prototype);
CanvasMixin(CanvasScrollingTextBox.prototype);
CanvasScrollingTextBox.prototype.display = function(ctx) {
    if (!ctx) { return; }
    var lines = this.lines.slice(this.currLine,
                                 this.currLine + this.linesAtOnce);
    CanvasTextUtils.drawTextBox(ctx, this.x, this.y, 
                                this.width, this.height, lines);
};


function CssScrollingTextBox(text, menuSystem) {
  // TODO rewrite this constructor -- how do we decide where to split lines?
  this.lines = CanvasTextUtils.splitLines(text);
  this.currLine = 0;
  this.menuSystem = menuSystem;
  this.container = menuSystem._htmlElem;
  this.linesAtOnce = 3; // TODO don't hardcode me
  this._closeCallbacks = [];
};
ScrollingTextBoxMixin(CssScrollingTextBox.prototype);
CssMixin(CssScrollingTextBox.prototype);
CssScrollingTextBox.prototype.display = function() {
  // Mostly copied from CssCmdMenu
  this.parentTag = $("<div></div>");
  this.parentTag.css("left", this.screenX);
  this.parentTag.css("top", this.screenY);
  //this.parentTag.append(this.table);
  this.container.append(this.parentTag);
  this.update();
};
CssScrollingTextBox.prototype.update = function() {
  this.textLines = this.lines.slice(this.currLine,
                                    this.currLine + this.linesAtOnce).join("<br>");
  this.parentTag.html(this.textLines);
};



function CanvasFixedTextBox(textLines, menuSystem) {
  // tries to open window big enough to show all lines of text
  // at once.
  this.menuSystem = menuSystem;
  var styles = CanvasTextUtils.getStyles();
  // TODO this duplicates code from CanvasCmdMenu
  var longestLine = 0;
  for (var i =0; i < textLines.length; i++) {
      if (textLines[i].length > longestLine) {
        longestLine = textLines[i].length;
      }
    }
  this.width = styles.leftMargin + styles.rightMargin 
    + longestLine * styles.fontSize;
  this.height = styles.topMargin + styles.bottomMargin
    + textLines.length * styles.lineHeight;
  this.textLines = textLines;
}
CanvasFixedTextBox.prototype = {
  // Satisfies same interface as a CmdMenu, so it can go on
  // the menu stack.
  onKey: function(key) {
    // do nothing
  },
  setPos: function(x, y) {
    this.x = x;
    this.y = y;
  },
  getPos: function() {
    return {x: this.x, y: this.y};
  },
  display: function(ctx) {
    if (!ctx) { return; }
    // TODO only works in Canvas world - make it work in CSS world
    CanvasTextUtils.drawTextBox(ctx, this.x, this.y, 
                                this.width, this.height,
                                this.textLines);
  },
  close: function() {
    // not used
  },
  setText: function(newTextLines) {
    this.textLines = newTextLines;
  },
  outsideWidth: function() {
    // TODO this is specific to the moonserepent implementation of
    // drawTextBox, which adds 4 columns of white pixels and 1 column of black pixels.
    return this.width + 5;
  }
};


function CssFixedTextBox(textLines, menuSystem) {
  //this._init();
  this.container = menuSystem._htmlElem; //container;
  //this.cursorHtml = "<blink>&#x25B6;</blink>";
  this.textLines = textLines;
}
CssMixin(CssFixedTextBox.prototype);
CssFixedTextBox.prototype.onKey = function(key) {
  // do nothing
};
CssFixedTextBox.prototype.setText = function(newTextLines) {
  this.textLines = newTextLines;
  if (this.parentTag) {
    this.parentTag.html(this.textLines.join("<br>"));
  }
};
CssFixedTextBox.prototype.display = function() {
  // Mostly copied from CssCmdMenu
  this.parentTag = $("<div></div>");
  this.parentTag.css("left", this.screenX);
  this.parentTag.css("top", this.screenY);
  this.container.append(this.parentTag);
  this.parentTag.html(this.textLines.join("<br>"));
};
CssFixedTextBox.prototype.outsideWidth = function() {
    // TODO implement me
};



function BackgroundImgBox(width, height) {
  this.x = this.y = 0;
  this._img = null;
  this._width = width;
  this._height = height;
}
BackgroundImgBox.prototype = {
  // Satisfies same interface as a CmdMenu, so it can go on
  // the menu stack.
  onKey: function(key) {
  },
  setPos: function(x, y) {
    this.x = x;
    this.y = y;
  },
  getPos: function() {
    return {x: this.x, y: this.y};
  },
  display: function(ctx) {
    if (this._black) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this._width, this._height);
      if (this._img != null) {
          ctx.drawImage(this._img,
                        this._imgXOffset, this._imgYOffset);
      }
    }
  },
  close: function() {
    // serves as root menu for scripted events' menu system,
    // so it can't be closed.
  },
  reset: function() {
    this._black= false;
    this._img = null;
  },
  setImg: function(img, width, height) {
    this._img = img;
    this._imgWidth = width;
    this._imgHeight = height;
    this._imgXOffset = (this._width - width)/2;
    this._imgYOffset = (this._height - height)/2;
  },
  clearImg: function() {
    this._img = null;
  },
  blacken: function(val) {
    this._black = val;
  }  
};

function CssFixedImgBox(img, menuSystem) {
  //this._init();
  this.container = menuSystem._htmlElem; //container;
  //this.cursorHtml = "<blink>&#x25B6;</blink>";
  //this.textLines = textLines;
  this.imgUrl = img;
}
CssMixin(CssFixedImgBox.prototype);
CssFixedImgBox.prototype.onKey = function(key) {
  // do nothing
};
CssFixedImgBox.prototype.setImg = function(newImg, width, height) {
  this.imgUrl = newImg; // takes URL of image, not Image object... for now.
  this.imgTag.attr("src", newImg);
  this.imgTag.attr("width", width);
  this.imgTag.attr("height", height);
};
CssFixedImgBox.prototype.display = function() {
  // Mostly copied from CssCmdMenu
  this.parentTag = $("<div></div>");
  this.parentTag.css("left", this.screenX);
  this.parentTag.css("top", this.screenY);
  this.container.append(this.parentTag);
  this.imgTag = $("<img/>");
  this.imgTag.attr("src", this.imgUrl);
  this.parentTag.append(this.imgTag);

  // TODO addClass("menu") and / or addClass("stats") ?
};
CssFixedImgBox.prototype.outsideWidth = function() {
    // TODO implement me
};
CssFixedImgBox.prototype.hide = function() {
  this.parentTag.hide();
};
CssFixedImgBox.prototype.show = function() {
  this.parentTag.show();
};



function Dialoglog(htmlElem, cursorImg, width, height) {
  this._init(htmlElem, cursorImg, width, height);
  this._rootMenu = null;
  this._freelyExit = true;
  this._occupiedNPC = null;  

  var self = this;
  this.onClose(function() {
    self.releaseNPC();
  });
}
Dialoglog.prototype = {
  occupyNPC: function(npc) {
    // don't let this NPC wander away while player is talking to them:
    npc.sleep();
    this._occupiedNPC = npc;
  },

  releaseNPC: function() {
    if (this._occupiedNPC) {
      // release any NPC that this dialog was occupying
      this._occupiedNPC.wake();
      this._occupiedNPC = null;
    }
  },

  multipartTextDisplay: function(textSegments) {
    console.log("The text segments are " + textSegments);
    if (textSegments.length == 0) { return; }
    var self = this;

    var counter = 0;

    var portraitBox = new CssFixedImgBox("", this);
    this.pushMenu(portraitBox);
    portraitBox.setPos(this._positioning.msgLeft - 130,
                       this._positioning.msgTop);
    if (textSegments[0].img == null) {
      portraitBox.hide();
    } else {
      portraitBox.show();
      portraitBox.setImg(textSegments[0].img, 100, 100);
    }

    var textBox = this.makeFixedTextBox([textSegments[0].text]);
    this.pushMenu(textBox);
    textBox.setPos(this._positioning.msgLeft,
                   this._positioning.msgTop);

    textBox.onKey = function(key) {
      console.log("text box got keypress");
      counter ++;
      if (counter < textSegments.length) {
        var nextLine = textSegments[counter];
        textBox.setText([nextLine.text]);
        textBox.parentTag.html(textBox.textLines.join("<br>")); // should be part of setText?
        if (nextLine.img == null) {
          portraitBox.hide();
        } else {
          portraitBox.show();
          portraitBox.setImg(nextLine.img, 100, 100);
        }
      } else {
        self.popMenu(); // to get rid of the portraitBox
        // (TODO general-purpose solution for passive boxes that show up alongside the menu
        // stack but never take input)
        self.handleKey(CANCEL_BUTTON);
      }
    };

  },
};
MenuSystemMixin(Dialoglog.prototype);
