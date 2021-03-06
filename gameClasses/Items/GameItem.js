var GameItem = IgeEntity.extend({
	classId: 'GameItem',
	lastClick: new Date().getTime(),
	init: function (gameItem, direction, x, y) {
		IgeEntity.prototype.init.call(this);

		var self = this;

		self.data('gameItem', gameItem);
		self.data('currentDirection', direction);

		//Set as isometric and set the texture
		self.isometric(true)
			.texture(ige.gameTexture.furniture);

		//Get the data for the object
		var object = FURNITURE[gameItem];
		self.data('object', object);

		//Check if we need to scale the item
		if(object['info']['scale'] !== undefined) {
			self.scaleTo(object['info']['scale'], object['info']['scale'], object['info']['scale']);
		}

		//Set other misc properties
		self.data('seat', (object['info']['seat'] === undefined) ? false : object['info']['seat']);
		self.data('stackable', (object['info']['stackable'] === undefined) ? false : object['info']['stackable']);
		self.data('table', (object['info']['table'] === undefined) ? false : object['info']['table']);
		self.newSpawn = true;

		//Load in the texture and offsets.
		self.cell(object['offsets'][direction][0])
			.anchor(object['offsets'][direction][1], object['offsets'][direction][2])
			.dimensionsFromCell();

		//Load in the item icon
		self.data('icon', './assets/furniture/icons/' + object['info']['icon']);

		//Set the tileX and tileY cordinates
		self.data('tileX', x)
			.data('tileY', y)
			.data('tileXWidth',  object['offsets'][direction][3])
			.data('tileYHeight', object['offsets'][direction][4])
			.data('objectHeight', object['info']['height']);

		self.data('zPlacement', 0);
		self.place();

		//If the x and y are negative its being placed
		if(x < 0 || y < 0) {
			self.hide();
		}

		self._mouseEventsActive = true;

		// We store a variable to know if we're over an item or not
		ige.overItem = false;
		self._beingUsed = false;

		//Mouse Over
		self._mouseOver = function(x, y) {
			ige.overItem = true;

			if(ige.movingItem === false) {
				//self.highlight(true);
			}
		};

		//Mouse Out
		self._mouseOut = function(x, y) {
			ige.overItem = false;

			if(ige.movingItem === false) {
				//self.highlight(false);
			}
		};

		//Mouse Down
		self._mouseDown = function(mouseEvent) {
			if (ige.movingItem) return;
			
			if (new Date().getTime() - self.lastClick < 500) {
				// double click woah
				return;
			}

			self.lastClick = new Date().getTime();

			var itemAtTile = ige.client.itemAt(this.data('tileX'), this.data('tileY'), true);
			if(itemAtTile._id != self._id) {
				itemAtTile._mouseDown(null);
				return;
			}

			var stand = $('#infostand'),
				standImage = $('#infostand .furniture'),
				standTitle = $('#infostand .title'),
				standDescriptin = $('#infostand .description'),
				furniInfo = FURNITURE[this.data('gameItem')];

			standTitle.text(furniInfo['info']['title']);
			standDescriptin.text(furniInfo['info']['description']);
			standImage.attr('src', './assets/furniture/icons/' + furniInfo['info']['icon']);
			stand.show();

			if($HIGHLIGHT_SELECTED)
				ige.room.tileMap().strokeTile(this.data('tileX'), this.data('tileY'));

			ige.selected = self;
		};
	},

	/**
	 * Places the item down on the map by setting the tiles it
	 * is "over" as occupied by the item on the tile map.
	 * @return {*}
	 */
	place: function (rotating ) {
		// Call the occupyTile method with the tile details.
		// This method doesn't exist in IgeEntity but is instead
		// added to an entity when that entity is mounted to a
		// tile map. The method tells the tile map that the
		// entity is mounted to that the tiles specified are now
		// taken up by this entity.
		this.occupyTile(
			this.data('tileX'),
			this.data('tileY'),
			this.data('tileXWidth'),
			this.data('tileYHeight')
		);

		var cords = this.getItemTransform(),
			tilemap = ige.room.tileMap(),
			translateX = cords['x'],
			translateY = cords['y'];

		this.mount(ige.room.tileMap())
			.tileWidth( this.data('tileXWidth'))
			.tileHeight( this.data('tileYHeight'))
			.bounds3d(this.data('tileXWidth') * tilemap._tileWidth, this.data('tileYHeight') * tilemap._tileHeight, this.data('objectHeight'))
			.translateToTile(translateX, translateY, 0)
			.occupyTile(this.data('tileX'), this.data('tileY'), this.data('tileXWidth'), this.data('tileYHeight'));

		if($HIGHLIGHT_SELECTED)
			ige.room.tileMap().strokeTile(this.data('tileX'), this.data('tileY'));

		this.data('placed', true);

		return this;
	},

	/**
	 * Moves the tile placement of the item from it's current
	 * tile location to the new tile location specified. Also
	 * translates the entity.
	 * @param tileX
	 * @param tileY
	 * @return {*}
	 */
	moveTo: function (tileX, tileY, zPlacement) {
		//If the item is hidden then it's not within the bounds of the map
		if(this.isHidden()) {
			ige.room._tilemap.itemPickup(true);
			return;
		}

		if(tileX == undefined || tileY == undefined) {
			//Check if this item even has an existing position
			if(typeof this.data('tileX') === 'undefined' || this.data('tileX') < 0) {
				ige.room._tilemap.itemPickup(true);
				return;
			}
		} else {
			this.data('tileX', tileX)
				.data('tileY', tileY);
		}

		//Set zPlacement as it's optional param
		if(typeof zPlacement === 'undefined') {
			zPlacement = this.data('zPlacement');
		} else {
			this.data('zPlacement', zPlacement);
		}

		this.occupyTile(
			this.data('tileX'),
			this.data('tileY'),
			this.data('tileXWidth'),
			this.data('tileYHeight')
		);

		var cords = this.getItemTransform();
		this.translateToTile(
			cords['x'],
			cords['y'],
			0
		);

		//Update the zPlacement (stackable items)
		this._translate.z = zPlacement;
		
		if($HIGHLIGHT_SELECTED) {
			ige.room.tileMap().strokeTile(this.data('tileX'), this.data('tileY'));

			if(this.data('tileXWidth') > 1) {
				ige.room.tileMap().strokeTile(this.data('tileX') + 1, this.data('tileY'));
			}

			if(this.data('tileYHeight') > 1) {
				ige.room.tileMap().strokeTile(this.data('tileX'), this.data('tileY') + 1);
			}
		}

		//Check if this is a seat
		if(this.isSeat()) {
			if(ige.player.isAtTile(this.data('tileX'), this.data('tileY'))) {
				ige.player.sit(this);
				this.beingUsed(true, ige.player);
			}
		}

		return this;
	},

	/**
	 * Gets the new x,y location for the object
	 */
	getItemTransform: function(x, y) {
		var translateX = this.data('tileX'),
			translateY = this.data('tileY'),
			returnObj;

		if(x !== undefined)
			translateX = x;
		if(y !== undefined)
			translateY = y;

		//If both sides are greater than 2. i.e the obj is larger than 2x2
		if( (this.data('tileXWidth') >= 2) && (this.data('tileYHeight') >= 2) ) {
			translateX = this.data('tileX') +
							((ige.room.tileMap().tileWidth() /
							this.data('tileXWidth')) /
							ige.room.tileMap().tileWidth());

			translateY = this.data('tileY') +
							((ige.room.tileMap().tileHeight() /
							this.data('tileYHeight')) /
							ige.room.tileMap().tileHeight());

		}
		//If the tile height is greater or equal 1x2
		else if(this.data('tileYHeight') >= 2) {
			translateY = this.data('tileY') +
							((ige.room.tileMap().tileHeight() /
							this.data('tileYHeight')) /
							ige.room.tileMap().tileHeight());

		}
		//If the tile width is greater or equal 2x1
		else if(this.data('tileXWidth') >= 2) {
			translateX = this.data('tileX') +
							((ige.room.tileMap().tileWidth() /
							this.data('tileXWidth')) /
							ige.room.tileMap().tileWidth());
		}

		returnObj = {
			'x' : translateX,
			'y' : translateY,
		}

		return returnObj;
	},

	/**
	 * Handles destroying the entity from memory.
	 */
	destroy: function () {
		// Un-occupy the tiles this entity currently occupies
		if (this.data('placed')) {
			self.unplace();

			this.data('placed', false);
		}

		$('#infostand').hide();

		// Call the parent class destroy method
		IgeEntity.prototype.destroy.call(this);
	},

	unplace: function() {
		this.unOccupyTile(
			this.data('tileX'),
			this.data('tileY'),
			this.data('tileXWidth'),
			this.data('tileYHeight')
		);
	},

	/**
	 * Handles rotating the item.
	 */
	rotate: function() {
		var self = this;

		// First ensure this item can rotate
		if ( ! self.canRotate()) return;

		// Get the new direction
		var newDirection = self.getNextRotation(),
			direction    = self.data('object')['offsets'][newDirection];

		//Un-occupy the current tiles
		self.unplace();

		//Update the current direction
		self.data('currentDirection', newDirection);

		//Set the new sprite cell, anchor, and update texture given
		//the new direction
		self.cell(direction[0])
			.anchor(direction[1], direction[2])
			.dimensionsFromCell();

		//Update the tile x and y values
		self.data('tileXWidth', direction[3])
			.data('tileYHeight', direction[4]);

		if($HIGHLIGHT_SELECTED)
			ige.room.tileMap().strokeTile(this.data('tileX'), this.data('tileY'));

		self.moveTo();

		//TODO: if this item is a chair / interactive item we need to 
		//let fire off some events for the player to update animation
		//i.e. if a player is sitting and u rotate the sofa the character
		//direction needs to change
	},

	/**
	 * Can this item rotate in a direction.
	 * @return boolean
	 */
	canRotate: function() {
		// if it's only a single tile size it doesn't need to be checked

		if (this.data('tileXWidth') == 1) return true;

		var y = this.data('tileY');
		var x = this.data('tileX');

		if (this.getNextRotation() == 'SE' || this.getNextRotation() == 'NW') {
			y++;
		} else {
			x++;
		}

		var entityHere = ige.$('tileMap1').isTileOccupied (x, y);

		return entityHere != true;
	},
	/**
	 * Gets the next rotation for this item
	 * @return
	 */
	getNextRotation: function() {
		var current = this.data('currentDirection'),
			newDir = 'SE';

		switch(current) {
			case 'SE': newDir = 'SW'; break;
			case 'SW': newDir = 'NW'; break;
			case 'NW': newDir = 'NE'; break;
			case 'NE': newDir = 'SE'; break;
		}

		return newDir;
	},

	/**
	 * TODO: gets the closest free tile that is relative to this object
	 * @return [x, y] of the tile
	 */
	getClosestFreeTile: function() {

	},

	isStackable: function() {
		return this.data('stackable');
	},

	isSeat: function() {
		return this.data('seat');
	},

	beingUsed: function(value, caller) {
		if(typeof value === 'undefined') {
			return this._beingUsed;
		}

		this._beingUsed = value;
		this._beingUsedBy = caller;
	},

	beingUsedBy: function() {
		return this._beingUsedBy;
	},
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = ClientItem; }
