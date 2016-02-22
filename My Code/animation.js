// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;

var top_view = false;

var block_pivot = false;
var turn_right;
var stop_angle;

var walking = false;
var forward = false;

var direction = 90; 
var orientation = 0; // {0, 1, 2, 3} = {up, right, down, left}

var board = new Board(9); // set up 17x17 board
var obstacle = new Obstacle(board);
var player = new Player(0, board.BOARD_UNIT_SIZE/2, 0);

var bullet = new Bullet(0, board.BOARD_UNIT_SIZE/2 + 0.75, 0); // oh boy! This is just a test. Figure out something better later.

var board_x_bound, board_z_bound = board.BOARD_SIZE * board.BOARD_UNIT_SIZE;


function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), 1, 1, 1, 40, "" ) ); }


// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.
window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 0, 0, 1 );			// Background color

		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		self.m_triangle = new triangle( mat4() );
		self.m_angled_cylinder = new angled_cylinder(10, mat4() );
		self.m_half_sphere = new half_sphere(mat4(), 4);
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translate(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	shortcut.add( "t", 		function() {
		if (!player.bullet_fired) {
			player.bullet_fired = true;
			bullet.pos_x = player.pos_x;
			bullet.pos_z = player.pos_z;
			bullet.orientation = orientation;
		}
	});
	shortcut.add( "up", function() { 
		if (top_view)
			top_view_movement(0, player);
		else {
			if (!block_pivot && inBounds(player.pos_x + 5 * Math.cos(to_radians(direction)), player.pos_y, player.pos_z + 5 * Math.sin(to_radians(direction)))) {
				player.pos_x += 5 * Math.cos(to_radians(direction));
				player.pos_z += 5 * Math.sin(to_radians(direction));
			}
		}
		});
	shortcut.add( "right", function() {
		if (top_view)
			top_view_movement(1, player);
		else {
			if (animate){
				if (!block_pivot) {
					block_pivot = true;
					turn_right = true;
					stop_angle = direction + 90;
					if (orientation == 3)
						orientation = 0;
					else
						orientation++;
				}
			}
			else
				direction += 5;
		}
	});
	shortcut.add( "down", function() { 
		if (top_view)
			top_view_movement(2, player);
		else {
			if (!block_pivot && inBounds(player.pos_x - 5 * Math.cos(to_radians(direction)), player.pos_y, player.pos_z - 5 * Math.sin(to_radians(direction)))) {
			player.pos_x -= 5 * Math.cos(to_radians(direction));
			player.pos_z -= 5 * Math.sin(to_radians(direction));
		}
		}
		});
	shortcut.add( "left", function() { 
		if (top_view) 
			top_view_movement(3, player);
		else {
			if (animate){
				if (!block_pivot) {
					block_pivot = true;
					turn_right = false;
					stop_angle = direction - 90;
					if (orientation == 0)
							orientation = 3;
						else
							orientation--;
					}
			}
			else
				direction -= 5;
		}
	});

	shortcut.add( "ALT+Space", function() { top_view = !top_view; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

function to_radians(angle_in_degrees) {
	return angle_in_degrees * Math.PI / 180;
}

Animation.prototype.display = function(time)
	{
		if(!time) time = 0;
		this.animation_delta_time = time - prev_time;
		if(animate) this.graphicsState.animation_time += this.animation_delta_time;
		prev_time = time;
		
		// update_camera( this, this.animation_delta_time );
			
		this.basis_id = 0;
		
		var model_transform = mat4();

		if (block_pivot)
			pivot();

		var cam_x_dist = 2.5 * Math.cos(to_radians(direction));
		var cam_z_dist = 2.5 * Math.sin(to_radians(direction));

		var eye_x, eye_y, eye_z;
		eye_x = player.pos_x - cam_x_dist;
		eye_y = player.pos_y + 0.5;
		eye_z = player.pos_z - cam_z_dist;

		var at = vec3(player.pos_x, player.pos_y, player.pos_z);
		var eye = vec3(eye_x, eye_y, eye_z);
		var up = vec3(Math.cos(to_radians(direction)), 1, Math.sin(to_radians(direction)));

		if (top_view) {
			at = vec3(0, 0, 0);
			eye = vec3(0, 120, 0);
		}

		this.graphicsState.camera_transform = lookAt(eye, at, up);
		// so this should rotate?

		
		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), 1, 1, 1, 40 ), // Omit the string parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20 ),
			earth = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "stars.png" );

		var stack = new Array();
		stack.push(model_transform);






		/**********************************
		Start coding here!!!!
		**********************************/
		this.draw_large_board(model_transform, board, obstacle);
		var stack = new Array();
		stack.push(model_transform);
		model_transform = mult(model_transform, translate(-board.BOARD_SIZE/2 * board.BOARD_UNIT_SIZE + board.BOARD_UNIT_SIZE/2
												, 0, -board.BOARD_SIZE/2 * board.BOARD_UNIT_SIZE + board.BOARD_UNIT_SIZE/2));
		this.draw_board(model_transform);
		model_transform = stack.pop();
		stack.push(model_transform);
		model_transform = mult(model_transform, translate(player.pos_x, player.pos_y, player.pos_z));
		// this.draw_player(model_transform);
		model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
		this.draw_character(model_transform,greyPlastic);
		model_transform = mult(model_transform, scale(2, 2, 2));

		// model_transform = stack.pop();
		// stack.push(model_transform);
		// // if (player.bullet_fired) {
		// 	model_transform = mult(model_transform, translate(bullet.pos_x, bullet.pos_y, bullet.pos_z));
		// 	// this.draw_bullet(model_transform);
		// 	if (Math.abs(bullet.pos_x) >= 40 || Math.abs(bullet.pos_z) >= 40) {
		// 		player.bullet_fired = false;
		// 		bullet.pos_x = player.pos_x;
		// 		bullet.pos_z = player.pos_z;
		// 	}
		// 	if (player.bullet_fired) {
		// 		top_view_movement(bullet.orientation, bullet);
		// 	}
		// 	model_transform = stack.pop();
		// 	stack.push(model_transform);
		// // }

	}	

Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
	debug_screen_object.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
	debug_screen_object.string_map["direction]"] = "Direction: " + direction;
}

Animation.prototype.draw_character = function (model_transform, color) {
		var stack = new Array();
		stack.push(model_transform);
		// head
		this.m_sphere.draw(this.graphicsState, model_transform, color);
		model_transform = mult(model_transform, translate(0, -1.75, 0));

		// body
		this.draw_body(model_transform, color);
		model_transform = mult(model_transform, translate(0, -1, 0));
		this.draw_bottom_half_sphere(model_transform, color);
		model_transform = mult(model_transform, translate(-0.5, 0, 0));

		// legs
		this.draw_leg(model_transform, color);
		model_transform = mult(model_transform, translate(1, 0, 0));
		this.draw_leg(model_transform, color);

		model_transform = stack.pop();
		// arms?
		model_transform = mult(model_transform, translate(-0.4, -1, 0));
		model_transform = mult(model_transform, rotate(-30, 0, 0, 1));
		this.draw_arm_right(model_transform, color);

		model_transform = mult(model_transform, rotate(30, 0, 0, 1));
		model_transform = mult(model_transform, translate(0.8, 0, 0));
		model_transform = mult(model_transform, rotate(30, 0, 0, 1));
		this.draw_arm_left(model_transform, color);

}

Animation.prototype.draw_knee_cap = function (model_transform, color) {
	model_transform = mult(model_transform, scale(0.25, 0.25, 0.25)); // half of the tilted cylinder radius
	this.m_sphere.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_upper_leg = function (model_transform, color) {
	model_transform = mult(model_transform, scale(0.5, 1, 0.5));
	this.draw_inverted_angled_cylinder(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_lower_leg = function(model_transform, color) {
	model_transform = mult(model_transform, scale(0.25, 0.75, 0.25));
	this.draw_inverted_angled_cylinder(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_leg = function(model_transform, color) {
	model_transform = mult(model_transform, translate(0, -1, 0));
	this.draw_upper_leg(model_transform, color);
	model_transform = mult(model_transform, translate(0, -1, 0));
	this.draw_knee_cap(model_transform, color);
	model_transform = mult(model_transform, translate(0, -0.75, 0));
	this.draw_lower_leg(model_transform, color);
	model_transform = mult(model_transform, translate(0, -0.75, 0.25));
	this.draw_foot(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_shoulder = function (model_transform, color) {
	model_transform = mult(model_transform, scale(0.25, 0.25, 0.25)); // half of the tilted cylinder radius
	this.m_sphere.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_upper_arm = function (model_transform, color) {
	model_transform = mult(model_transform, scale(0.5, 1.25, 0.5));
	this.draw_inverted_angled_cylinder(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_lower_arm = function(model_transform, color) {
	model_transform = mult(model_transform, scale(0.25, 1.25, 0.25));
	this.draw_inverted_angled_cylinder(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_hand = function(model_transform, color) {
	model_transform = mult(model_transform, scale(0.25, 0.25, 0.25));
	this.m_sphere.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_arm_left = function(model_transform, color) {
	this.draw_shoulder(model_transform, color);
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_upper_arm(model_transform, color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_shoulder(model_transform, color);
	model_transform = mult(model_transform, rotate(-10, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_lower_arm(model_transform, color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_hand(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_arm_right = function(model_transform, color) {
	this.draw_shoulder(model_transform, color);
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_upper_arm(model_transform, color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_shoulder(model_transform, color);
	model_transform = mult(model_transform, rotate(10, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_lower_arm(model_transform, color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_hand(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_body = function(model_transform, color) {
	// model_transform = mult(model_transform, scale(1, 0.75, 1));
	this.draw_angled_cylinder(model_transform, color);

	return model_transform;
}

Animation.prototype.draw_angled_cylinder = function(model_transform, color) {
	model_transform = mult(model_transform, rotate(270, 1, 0, 0));
	this.m_angled_cylinder.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_inverted_angled_cylinder = function(model_transform, color) {
	model_transform = mult(model_transform, rotate(90, 1, 0, 0));
	this.m_angled_cylinder.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_cylinder = function(model_transform, color) {
	model_transform = mult(model_transform, rotate(270, 1, 0, 0));
	this.m_cylinder.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_bottom_half_sphere = function (model_transform, color) {
	model_transform = mult(model_transform, rotate(180, 0, 0, 1));
	this.m_half_sphere.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

Animation.prototype.draw_foot = function (model_transform, color) {
	// model_transform = mult(model_transform, rotate())
	model_transform = mult(model_transform, scale(0.2, 0.1, 0.4));
	this.m_sphere.draw(this.graphicsState, model_transform, color);

	return model_transform;
}

// draws a single board square
// color to indicates what color the square will be 
// default board will alternate between darkgreen and green
Animation.prototype.draw_board_unit = function (model_transform, color) {
	model_transform = mult(model_transform, scale(board.BOARD_UNIT_SIZE, board.BOARD_UNIT_SIZE/2, board.BOARD_UNIT_SIZE));
	this.m_cube.draw(this.graphicsState, model_transform, color);
}

Animation.prototype.draw_board_col = function (model_transform, toggle_color) {
	// move into z direction
	for (var i = 0; i < board.BOARD_SIZE; i++) {
		if (i % 2 == toggle_color)
			this.draw_board_unit(model_transform, board.BOARD_UNIT_COLOR_1);
		else
			this.draw_board_unit(model_transform, board.BOARD_UNIT_COLOR_2);
		model_transform = mult(model_transform, translate(0, 0, board.BOARD_UNIT_SIZE));
	}
	return model_transform;
}

Animation.prototype.draw_large_board = function (model_transform, board, obstacle) {
	this.draw_board(model_transform);
	model_transform = mult(model_transform, rotate(90, 0, 1, 0));
	this.draw_board(model_transform);
	model_transform = mult(model_transform, rotate(90, 0, 1, 0));
	this.draw_board(model_transform);
	model_transform = mult(model_transform, rotate(90, 0, 1, 0));
	this.draw_board(model_transform);
}

Animation.prototype.draw_board = function (model_transform) {
	for (var i = 0; i < board.BOARD_SIZE; i++) {
		if (i % 2 == 0)
			this.draw_board_col(model_transform, 0);
		else {
			this.draw_board_col(model_transform, 1);
			var up_mt = mult(model_transform, translate(0, board.BOARD_UNIT_SIZE/2, 0));
			this.draw_obstacles_col(up_mt);
		}
		model_transform = mult(model_transform, translate(board.BOARD_UNIT_SIZE, 0, 0));
	}
	return model_transform;
}

Animation.prototype.draw_obstacle = function (model_transform) {
	model_transform = mult(model_transform, scale(obstacle.OBSTACLE_SIZE, obstacle.OBSTACLE_SIZE*2, obstacle.OBSTACLE_SIZE));
	this.m_cube.draw(this.graphicsState, model_transform, obstacle.OBSTACLE_COLOR);

}

Animation.prototype.draw_obstacles_col = function (model_transform) {
	for (var i = 0; i < board.BOARD_SIZE; i++) {
		if (i % 2 == 1)
			this.draw_obstacle(model_transform);
		model_transform = mult(model_transform, translate(0, 0, board.BOARD_UNIT_SIZE));
	}
	return model_transform;
}


Animation.prototype.draw_obstacle_on_board = function (model_transform) {

}

Animation.prototype.draw_bullet = function (model_transform) {
	model_transform = mult(model_transform, scale(bullet.BULLET_RADIUS, bullet.BULLET_RADIUS, bullet.BULLET_RADIUS));
	this.m_sphere.draw(this.graphicsState, model_transform, bullet.BULLET_COLOR);
	return model_transform;
}

Animation.prototype.draw_player = function(model_transform) {
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	this.m_sphere.draw(this.graphicsState, model_transform, new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "earth.gif" ));
	return model_transform;
}

function Control() {
	// controls the game

	// create a board
	// create a player


}

function Board(board_size) {
	// dimensions of board: default is 9x9
	this.BOARD_SIZE = board_size;

	// size of each square on the board: default is 2x2
	this.BOARD_UNIT_SIZE = 5;
	// dark green
	this.BOARD_UNIT_COLOR_1 = new Material(vec4(0, 0.392157, 0, 1), 1, 1, 1, 20); 
	// forest green
	this.BOARD_UNIT_COLOR_2 = new Material(vec4(0.133333, 0.545098, 0.133333, 1), 1, 1, 1, 20); 

	this.board_arr = new Array(this.BOARD_SIZE);
	for (var i = 0 ; i < this.BOARD_SIZE; i++) {
		this.board_arr[i] = new Array(this.BOARD_SIZE);
	}
	for (var i = 0; i < this.BOARD_SIZE; i++) {
		for (var j = 0; j < this.BOARD_SIZE; j++) {
			if (i % 2 == 1 && j % 2 == 1)
				this.board_arr[i][j] = 1; // set as obstacle
			else
				this.board_arr[i][j] = 0; // set as free space
		}
	}

	// set the player?
	this.board_arr[Math.floor(this.BOARD_SIZE/2)][Math.floor(this.BOARD_SIZE/2)] = 2; // set as player in center of board
}

// grid num: 1
function Obstacle(board) {
	this.OBSTACLE_SIZE = board.BOARD_UNIT_SIZE;

	this.OBSTACLE_COLOR = new Material(vec4(0.466667, 0.533333, 0.6, 1), 1, 1, 1, 20);
}

// general bomber character
function Character() {

}

// player inherits character
// grid num: 2
function Player(x, y, z) {
	this.pos_x = x;
	this.pos_y = y;
	this.pos_z = z;

	this.bullet_fired = false;
}



//
function Bomber() {
	
}

function Bullet(x, y, z) {
	this.pos_x = x;
	this.pos_y = y;
	this.pos_z = z;

	this.bullet_orientation = 0;

	this.BULLET_COLOR = new Material (vec4 (.5, .5, 0, 1), 1, 1, 1, 40);
	this.BULLET_RADIUS = 0.3;

}

function display_coord_to_grid_coord(i) {
	return -(i/board.BOARD_UNIT_SIZE) + Math.floor(board.BOARD_SIZE/2);
}

function grid_coord_to_display_coor(i) {
	return board.BOARD_UNIT_SIZE * (Math.floor(board.BOARD_SIZE/2) - i);
}

function top_view_movement(o, obj_to_move) {
	if (o === 0) {
		if (orientation == 0 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z + board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z += board.BOARD_UNIT_SIZE;
		else if (orientation == 1 && inBounds(obj_to_move.pos_x - board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x -= board.BOARD_UNIT_SIZE;
		else if (orientation == 2 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z - board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z -= board.BOARD_UNIT_SIZE;
		else if (orientation == 3 && inBounds(obj_to_move.pos_x + board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x += board.BOARD_UNIT_SIZE;
	}
	else if (o === 1) {
		if (orientation == 0 && inBounds(obj_to_move.pos_x - board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x -= board.BOARD_UNIT_SIZE;
		else if (orientation == 1 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z - board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z -= board.BOARD_UNIT_SIZE;
		else if (orientation == 2 && inBounds(obj_to_move.pos_x + board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x += board.BOARD_UNIT_SIZE;
		else if (orientation == 3 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z + board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z += board.BOARD_UNIT_SIZE;
	}
	else if (o === 2) {
		if (orientation == 0 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z - board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z -= board.BOARD_UNIT_SIZE;
		else if (orientation == 1 && inBounds(obj_to_move.pos_x + board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x += board.BOARD_UNIT_SIZE;
		else if (orientation == 2 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z + board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z += board.BOARD_UNIT_SIZE;
		else if (orientation == 3 && inBounds(obj_to_move.pos_x - board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x -= board.BOARD_UNIT_SIZE;
	}
	else if (o === 3) {
		if (orientation == 0 && inBounds(obj_to_move.pos_x + board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x += board.BOARD_UNIT_SIZE;
		else if (orientation == 1 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z + board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z += board.BOARD_UNIT_SIZE;
		else if (orientation == 2 && inBounds(obj_to_move.pos_x - board.BOARD_UNIT_SIZE, obj_to_move.pos_y, obj_to_move.pos_z))
			obj_to_move.pos_x -= board.BOARD_UNIT_SIZE;
		else if (orientation == 3 && inBounds(obj_to_move.pos_x, obj_to_move.pos_y, obj_to_move.pos_z - board.BOARD_UNIT_SIZE))
			obj_to_move.pos_z -= board.BOARD_UNIT_SIZE;
	}
}


function inBounds(x, y, z) {
	console.log(display_coord_to_grid_coord(x) + ", " + display_coord_to_grid_coord(z));
	if (Math.abs(x) > 40)
		return false;
	if (Math.abs(z) > 40)
		return false;
	if (isObstacleAt(display_coord_to_grid_coord(x), display_coord_to_grid_coord(z)))
		return false;
	return true;
}

function isObstacleAt(x, z) {
	return x % 2 === 1 && z % 2 === 1;
}

function pivot() {
	if (direction !== stop_angle) {
		if (turn_right)
			direction += 5;
		else
			direction -= 5;
	}
	else {
		block_pivot = false;
	}
}

function smooth_walk() {

}
