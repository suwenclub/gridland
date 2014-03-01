define(['app/eventmanager', 'app/entity/worldentity', 'app/graphics/graphics', 
        'app/gamestate', 'app/action/actionfactory', 'app/gamecontent'], 
		function(EventManager, WorldEntity, Graphics, State, ActionFactory, Content) {
	var dude = function() {
		this._el = null;
		this.carrying = null;
		this.action = null;
		State.health = State.maxHealth();
		Graphics.updateHealth(State.health, State.maxHealth());
		Graphics.updateExperience(State.xp, this.toLevel());
		this.shield = 0;
		this.sword = 0;
	};
	dude.prototype = new WorldEntity({
		className: 'dude'
	});
	dude.constructor = dude;
	
	dude.prototype.el = function() {
		if(this._el == null) {
			this._el = WorldEntity.prototype.el.call(this)
				.append(Graphics.make("animationLayer nightSprite"));
			this.held = Graphics.make("heldBlock").appendTo(this._el);;
		}
		return this._el;
	};
	
	dude.prototype.isAlive = function() {
		return State.health > 0;
	};
	
	dude.prototype.getAnimation = function(label) {
		if(label == "right" && this.carrying != null) {
			return 9;
		}
		return WorldEntity.prototype.getAnimation.call(this, label);
	};
	
	dude.prototype.think = function() {
		if(this.isIdle() && this.action == null) {
			var activity = require('app/world').getActivity();
			if(activity != null) {
				this.action = activity;
				this.action.doAction(this);
				return true;
			}
		}
		return false;
	};
	
	dude.prototype.gainXp = function(xp) {
		xp = xp || 0;
		State.xp += xp;
		if(isNaN(State.xp)){
			State.xp = 0;
		}
		if(State.xp >= this.toLevel()) {
			State.xp -= this.toLevel();
			State.level++;
			Graphics.levelUp(this);
			State.health = State.maxHealth();
			Graphics.updateHealth(State.health, State.maxHealth());
			EventManager.trigger('levelUp');
			if(this.action != null) {
				this.action.terminateAction(this);
			}
		}
		Graphics.updateExperience(State.xp, this.toLevel());
	};
	
	dude.prototype.toLevel = function() {
		// 40, 80, 120, 160, 200, 240, 280, 320, 340, 360, 400, 440
//		return 40 * State.level;
		
		// 40, 160, 360, 640, 1000, 1440, 1960, 2560, 3240, 4000...
		return 40 * Math.pow(State.level, 2);
	};
	
	dude.prototype.heal = function(amount) {
		State.health += amount;
		State.health = State.health > State.maxHealth() ? State.maxHealth() : State.health;
		Graphics.updateHealth(State.health, State.maxHealth());
	};
	
	dude.prototype.getDamage = function() {
		if(this.sword > 0) {
			this.sword--;
			Graphics.updateSword(this.sword, State.maxSword());
			return State.swordDamage();
		}
		
		// 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3...
		if(State.level < 7) {
			return 1;
		}
		return Math.floor((State.level - 1) / 3);
	};
	
	dude.prototype.takeDamage = function(damage) {
		if(State.health > 0) {
			if(this.shield > 0) {
				var blocked = damage > this.shield ? this.shield : damage;
				this.shield -= blocked;
				damage -= blocked;
				Graphics.updateShield(this.shield, State.maxShield());
			}
			State.health -= damage;
			State.health = State.health < 0 ? 0 : State.health;
			if(State.health == 0 && this.action) {
				this.action.terminateAction(this);
			}
			Graphics.updateHealth(State.health, State.maxHealth());
		}
	};
	
	dude.prototype.animate = function() {
		WorldEntity.prototype.animate.call(this);
		if(this.carrying != null) {
			if(this.frame == 1) {
				this.held.css({transform: 'translate3d(0px, 1px, 0px)'});
			} else if(this.frame == 3) {
				this.held.css({transform: 'translate3d(0px, -1px, 0px)'});
			} else {
				this.held[0].style = '';
			}
		}
	};
	
	dude.prototype.animationOnce = function(row) {
		// Unarmed animation
		if((row == 3 || row == 4) && this.sword == 0) {
			row += 8;
		}
		WorldEntity.prototype.animationOnce.call(this, row);
	};
	
	dude.prototype.speed = function() {
		var W = require('app/world');
		return !W.hasEffect('haste') ? this.options.speed : this.options.speed / 4;
	};
	
	return dude;
});