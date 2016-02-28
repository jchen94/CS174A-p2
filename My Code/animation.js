// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;

		var purplePlastic = new Material( vec4( .9,.5,.9,1 ), 1, 1, 1, 40 ), // Omit the string parameter if you want no texture
			greyPlastic = new Material( vec4( .5,.5,.5,1 ), 1, 1, .5, 20 ),
			blue = new Material(vec4(0, 0, 1, 0.5), 1, 1, 1, 20),
			yellow = new Material(vec4(1, 1, 0, 0.5), 1, 1, 1, 20),
			skin = new Material(vec4(1, 0.921569, 0.803922,1), 1, 1, 1, 20),
			red = new Material( vec4 (1, 0, 0, 1), 1, 1, 1, 20),
			earth = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "earth.gif" ),
			stars = new Material( vec4( .5,.5,.5,1 ), 1, 1, 1, 40, "stars.png" ),
			camo = new Material ( vec4( 0.5, 0.5, 0.5, 1), 1, 0.2, 0.20, 30, "camo.png"),
			dirt = new Material (vec4(0.8, 0.5, 0.5, 1), 1, 0.2, 0.2, 30, "dirt.jpg"),
			sky = new Material (vec4(0.9, 0.9, 0.9, 1), 1, 0, 0, 30, "sky.jpg"),
			dark_grass = new Material (vec4(0.7, 0.9, 0.7, 1), 1, 0.2, 0.2, 30, "grass.jpg"),
			light_grass = new Material (vec4(0.7, 0.7, 0.7, 1), 1, 0.2, 0.2, 30, "grass.jpg"),
			wood = new Material (vec4(0.7, 0.7, 0.7, 1), 1, 0.2, 0.2, 30, "tree.jpg"),
			metal = new Material (vec4(0.7, 0.7, 0.7, 1), 1, 0.2, 0.2, 30, "metal.jpg");

var my_delta_time = 0;
var moved = 0;
var speed = 1.5;

// 0 for starting sequence
// game state 1 for title screen
// game state 2 for in game
// game state 3 for end seq
var game_state = 2;

var top_view = false;

var backward = false;
var block_pivot = false;
var turn_right;
var stop_angle;
var arm_stop_angle = 90;
var block_arm = false;
var upper_leg_stop_angle = 75;
var lower_leg_stop_angle = 90;
var high_point = 60;
var walk_phase = 0;
var stall = 0;
var right_leg_forward = false;
var walk_in_place_block = false;

var block_upper_leg = false;

var walking = false;
var forward = false;
var arms_up = true;

var direction = 0; 
var orientation = 3; // {0, 1, 2, 3} = {up, right, down, left}

var board = new Board(9); 
var obstacle = new Obstacle(board);
var player = new Player(0, board.BOARD_UNIT_SIZE/2 + 0.5, 0);

var bullet = new Bullet(0, board.BOARD_UNIT_SIZE/2 + 0.75, 0); // oh boy! This is just a test. Figure out something better later.
var flower = new Flower();
var board_x_bound, board_z_bound = board.BOARD_SIZE * board.BOARD_UNIT_SIZE;
var death_delta = 0;
var death_cam_dist = 2.5;
var death_angle = 0;
var velocity = 1;
var game_delta = 0;

var music = {};


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
		self.m_bazooka = new shape_from_file( "bazooka.obj" )
		self.m_landmine = new shape_from_file ( "landmine.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		self.m_triangle = new triangle( mat4() );

		self.m_angled_cylinder = new angled_cylinder(50, mat4() );
		self.m_half_sphere = new half_sphere(mat4(), 4);


		var new_music = new Audio("002-kazumi-totaka-mii-plaza.mp3");
		new_music.loop = true;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["wii"] = new_music;

		new_music = new Audio("training-mode.mp3");
		new_music.loop = true;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["training"] = new_music;

		new_music = new Audio("shoot_boom.mp3");
		new_music.loop = false;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["boom"] = new_music;

		new_music = new Audio("punch.mp3");
		new_music.loop = false;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["shoot"] = new_music

		new_music = new Audio("dying.mp3");
		new_music.loop = false;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["dead"] = new_music

		new_music = new Audio("place_mine.mp3");
		new_music.loop = false;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["mine"] = new_music

		new_music = new Audio("abduction.mp3")
		new_music.loop = false;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["abduction"] = new_music

		new_music = new Audio("blast_off.mp3")
		new_music.loop = false;
		new_music.addEventListener("loadeddata", function() {new_music.currentTime=0;}); 
		music["blast_off"] = new_music

		self.GAME_OVER_UI = new GraphicsState(mat4(), mat4(), 0);
		self.m_text = new text_line(50); 
		self.m_text.set_string("GAME OVER. Press Enter to Retry.");
		
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
	// shortcut.add( "Space", function() { thrust[1] = -1; } );			
	// shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add ("Space", function() {
		if (!player.bullet_fired) {
			music["shoot"].currentTime = 0; 
			music["shoot"].play();
			player.bullet_fired = true;
			bullet.pos_x = player.pos_x;
			bullet.pos_z = player.pos_z;
			bullet.direction = direction;
		}
	});
	shortcut.add("Enter", function() {
		animate = true; 
		reset_game();
		game_state = 2; })
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
	shortcut.add( "0", function() { music["wii"].play(); })
	shortcut.add( "9", function() { walk_in_place(); })
	shortcut.add( "m", function() { 
		if (player.mines > 0) {
			player.mines--;
			player.mines_arr[player.mines];
			player.mines_arr[player.mines].pos_x = player.pos_x;
			player.mines_arr[player.mines].pos_y = 1.5;
			player.mines_arr[player.mines].pos_z = player.pos_z;
			player.mines_arr[player.mines].spawned = true;
			// set player's mine on board
			board.board_arr[display_coord_to_grid_coord(player.mines_arr[player.mines].pos_x)][display_coord_to_grid_coord(player.mines_arr[player.mines].pos_z)] = 4;
			music["mine"].currentTime = 0;
			music["mine"].play();

		}
	 })
	shortcut.add( "3", function() { spawn_enemy();
		})
	shortcut.add( "t", 		function() {
		if (!player.bullet_fired) {
			music["shoot"].currentTime = 0; 
			music["shoot"].play();
			player.bullet_fired = true;
			bullet.pos_x = player.pos_x;
			bullet.pos_z = player.pos_z;
			bullet.direction = direction;
		}
	});
	shortcut.add( "up", function() { 
		if (top_view)
			top_view_movement(0, player);
		else {
			if (!block_pivot && inBounds(Math.round(player.pos_x + board.BOARD_UNIT_SIZE * Math.cos(to_radians(direction))), 
										player.pos_y, 
										Math.round(player.pos_z + board.BOARD_UNIT_SIZE * Math.sin(to_radians(direction))))) {
				if (!block_upper_leg) {
					block_upper_leg = !block_upper_leg; 
					walk_phase = 0;
					moved = 0;
					backward = false;
				}
			}
		}
		});
	shortcut.add( "right", function() {
		if (top_view)
			top_view_movement(1, player);
		else {
			if (!block_upper_leg) {
				if (animate) {
					walk_phase = 0;
					walk_in_place_block = true;
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
		}
	});
	shortcut.add( "down", function() { 
		if (top_view)
			top_view_movement(2, player);
		else {
			if (!block_pivot && inBounds(Math.round(player.pos_x - board.BOARD_UNIT_SIZE * Math.cos(to_radians(direction))), 
										player.pos_y, 
										Math.round(player.pos_z - board.BOARD_UNIT_SIZE * Math.sin(to_radians(direction))))) {
				if (!block_upper_leg) {
					block_upper_leg = !block_upper_leg; 
					walk_phase = 0;
					moved = 0;
					backward = true;
				}
			}
		}
		});
	shortcut.add( "left", function() { 
		if (top_view) 
			top_view_movement(3, player);
		else {
			if (!block_upper_leg) {
				if (animate){
					walk_phase = 0;
					walk_in_place_block = true;
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
		}
	});

	shortcut.add( "ALT+Space", function() { top_view = !top_view; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	// shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	
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
		game_delta += this.animation_delta_time;

		if (game_state === 0)
			update_camera( this, this.animation_delta_time );
			
		this.basis_id = 0;
		
		var model_transform = mat4();

		// in game: camera follows human
		if (game_state === 2) {
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
				eye = vec3(0, 70, 0);
			}

			this.graphicsState.camera_transform = lookAt(eye, at, up);
		}

		if (game_state === 3) {
			death_cam_dist += 0.1;
			if (death_cam_dist > 15)
				death_cam_dist = 15;
			var cam_x_dist = death_cam_dist * Math.cos(to_radians(direction));
			var cam_z_dist = death_cam_dist * Math.sin(to_radians(direction));

			var eye_x, eye_y, eye_z;
			eye_x = player.pos_x - cam_x_dist;
			eye_y = player.pos_y + death_cam_dist/10;
			eye_z = player.pos_z - cam_z_dist;

			var at = vec3(player.pos_x, player.pos_y, player.pos_z);
			var eye = vec3(eye_x, eye_y, eye_z);
			var up = vec3(Math.cos(to_radians(direction)), 1, Math.sin(to_radians(direction)));

			if (top_view) {
				at = vec3(0, 0, 0);
				eye = vec3(0, 70, 0);
			}

			this.graphicsState.camera_transform = lookAt(eye, at, up);
		}

		/**********************************
		Start coding here!!!!
		**********************************/

		var mt = mult(new mat4(), rotate(-90, vec3(0,1,0)));
			mt = mult( mt, translate( .1, -.9, .9 ) );
			mt = mult(model_transform, scale(100, 0.75, 0.05));
			this.m_text.draw(this.GAME_OVER_UI, mt, true, vec4(1,1,1,1));



		var stack = new Array();
		stack.push(model_transform);

	if (game_state > 1) {
		this.draw_sky(model_transform);

		if (game_state === 2 && Math.round(game_delta) % 100 == 0) {
			spawn_enemy();
		}


		model_transform = stack.pop();
		stack.push(model_transform);

		model_transform = mult(model_transform, translate(-board.BOARD_SIZE/2 * board.BOARD_UNIT_SIZE + board.BOARD_UNIT_SIZE/2
												, 0, -board.BOARD_SIZE/2 * board.BOARD_UNIT_SIZE + board.BOARD_UNIT_SIZE/2));
		this.draw_board(model_transform);
		model_transform = stack.pop();
		stack.push(model_transform);
		model_transform = mult(model_transform, translate(player.pos_x, player.pos_y, player.pos_z));

		// draw character
		model_transform = mult(model_transform, rotate(-direction + 90, 0, 1, 0));

		if (game_state === 3) {
			death_angle += this.animation_delta_time * 0.06;
			model_transform = mult(model_transform, rotate(death_angle, 1, 1, 1));
		}

		if (game_state === 2 || game_state === 3)
			this.draw_character(model_transform, greyPlastic);

		// draw mines
		model_transform = stack.pop();
		stack.push(model_transform);
		for (var i = 0; i < player.mines_arr.length; i++) {
			if (player.mines_arr[i].spawned) {
				model_transform = mult(model_transform, translate(player.mines_arr[i].pos_x, player.mines_arr[i].pos_y, player.mines_arr[i].pos_z));
				this.draw_landmine(model_transform);
				model_transform = stack.pop();
				stack.push(model_transform);
			}
		}

		// sitting_pose();
		if (block_upper_leg) {
			// lift_left_leg(this.animation_delta_time/3);
			half_walk(this.animation_delta_time);
		}

		if (walk_in_place_block) {
			walk_in_place(this.animation_delta_time);
		}

		// draw enemies
		model_transform = stack.pop();
		stack.push(model_transform);
		for (var i = 0; i < board.enemy_arr.length; i++) {
			var enemy = board.enemy_arr[i];
			var num = Math.round(3 * Math.random());
			var effective_dir = enemy.direction;

			if (effective_dir % 90 === 0 && effective_dir % 180 !== 0)
				effective_dir -= 180;
			if (enemy.spawned) {
				if (enemy.steps <= 0) {
					switch (num) {
							case 1:
								enemy.direction += 90; // eventually change this to random
								break;
							case 2:
								enemy.direction += 180; // eventually change this to random
								break;
							case 3:
								enemy.direction += 270; // eventually change this to random
								break;
						}
					enemy.steps = 2;
				}
				else {
					var x_to_go = board.enemy_arr[i].pos_x + 0.06 * 0.05 * 1.4 * 
											this.animation_delta_time * 
											Math.cos(to_radians(board.enemy_arr[i].direction));
					var z_to_go = board.enemy_arr[i].pos_z + 0.06 * 0.05 * 1.4 * 
											this.animation_delta_time * 
											Math.sin(to_radians(board.enemy_arr[i].direction));
					var grid_x = display_coord_to_grid_coord(x_to_go);
					var grid_z = display_coord_to_grid_coord(z_to_go);
					var can_move = (grid_x % 2 === 0 || grid_z % 2 === 0) && 
									display_coord_to_grid_coord(x_to_go - board.BOARD_UNIT_SIZE/2) < board.BOARD_SIZE && 
									display_coord_to_grid_coord(z_to_go - board.BOARD_UNIT_SIZE/2) < board.BOARD_SIZE;
					// console.log(display_coord_to_grid_coord(enemy.pos_x) + ", " + display_coord_to_grid_coord(enemy.pos_z));
					if (can_move && inBounds(board.BOARD_UNIT_SIZE/2 + board.enemy_arr[i].pos_x + 0.06 * 0.05 * 1.4 * 
											this.animation_delta_time * 
											Math.cos(to_radians(board.enemy_arr[i].direction)),
						enemy.pos_y,
						board.BOARD_UNIT_SIZE/2 + board.enemy_arr[i].pos_z + 0.06 * 0.05 * 1.4 * 
											this.animation_delta_time * 
											Math.sin(to_radians(board.enemy_arr[i].direction)))
						)
					{
						board.enemy_arr[i].pos_x += 0.06 * 0.05 * 1.4 * 
												this.animation_delta_time * 
												Math.cos(to_radians(board.enemy_arr[i].direction));
						board.enemy_arr[i].pos_z += 0.06 * 0.05 * 1.4 * 
												this.animation_delta_time * 
												Math.sin(to_radians(board.enemy_arr[i].direction));
						if (!player.dead &&
							grid_x === display_coord_to_grid_coord(player.pos_x) && grid_z === display_coord_to_grid_coord(player.pos_z)) {
							player.dead = true;
							music["dead"].currentTime = 0;
							music["dead"].play(); 
							console.log("YOU DIED!");
							game_state = 3;
						}
					}
					else
					{
						enemy.steps = 0;
					}
				}
				// console.log(display_coord_to_grid_coord(enemy.pos_x) + ", " + display_coord_to_grid_coord(enemy.pos_z));
				model_transform = mult(model_transform, 
						translate(board.enemy_arr[i].pos_x, board.enemy_arr[i].pos_y, board.enemy_arr[i].pos_z));
				model_transform = mult(model_transform, rotate(effective_dir, 0, 1, 0));
				this.draw_player(model_transform);
				model_transform = stack.pop();
				stack.push(model_transform);
			}
		}

		// check collision with mines
		if (player.mines < 3) {
			for (var i = 0; i < board.enemy_arr.length; i++) {
				for (var j =0; j<player.mines_arr.length; j++) {
					if (board.enemy_arr[i].spawned &&
						player.mines_arr[j].spawned && 
						display_coord_to_grid_coord(board.enemy_arr[i].pos_x) === display_coord_to_grid_coord(player.mines_arr[j].pos_x) &&
						display_coord_to_grid_coord(board.enemy_arr[i].pos_z) === display_coord_to_grid_coord(player.mines_arr[j].pos_z)) {
						player.mines_arr[j].spawned = false;
						board.enemy_arr[i].spawned = false;
						player.score += 10;
						music["boom"].currentTime = 0;
						music["boom"].play(); 
						// explode!
						break;
					}
				}
			}
		}

		// draw bullet
		model_transform = stack.pop();
		stack.push(model_transform);
		if (player.bullet_fired) {
			// console.log("bullet_x" + bullet.pos_x, "bullet_z" + bullet.pos_z);
			// console.log("bulgrid_x" + display_coord_to_grid_coord(bullet.pos_x), "bulgrid_z" + display_coord_to_grid_coord(bullet.pos_z));
			for (var i = 0; i < board.enemy_arr.length; i++) {
				if (board.enemy_arr[i].spawned && 
					display_coord_to_grid_coord(board.enemy_arr[i].pos_x) === display_coord_to_grid_coord(bullet.pos_x) &&
					display_coord_to_grid_coord(board.enemy_arr[i].pos_z) === display_coord_to_grid_coord(bullet.pos_z)) {
					player.bullet_fired = false;
					board.enemy_arr[i].spawned = false;
					player.score += 10;
					music["boom"].currentTime = 0;
					music["boom"].play(); 
					// explode!
					break;
				}
			}
			model_transform = mult(model_transform, translate(bullet.pos_x, bullet.pos_y, bullet.pos_z));
			this.draw_bullet(model_transform);
			bullet.pos_z += 0.06 * 0.5 * this.animation_delta_time * Math.sin(to_radians(direction));
			bullet.pos_x += 0.06 * 0.5 * this.animation_delta_time * Math.cos(to_radians(direction));
			if (!inBounds(bullet.pos_x, bullet.pos_y, bullet.pos_z)) {
				bullet.pos_x = player.pos_x;
				bullet.pos_y = player.pos_y;
				bullet.pos_z = player.pos_z;
				player.bullet_fired = false;
			}
		}
		else {
			bullet.pos_x = player.pos_x;
			bullet.pos_y = player.pos_y;
			bullet.pos_z = player.pos_z;
		}

	} // END GAME PLAY 2

	if (game_state === 3) {
		var space = mult(model_transform, translate(player.pos_x, 14, player.pos_z));
		this.draw_space_ship(space);

		var ray_tm = mult(model_transform, translate(player.pos_x, 7, player.pos_z));
		this.draw_ray(ray_tm);

		death_delta += this.animation_delta_time;
		if (death_delta > 2000 && death_delta < 5700) {
			music["abduction"].play();
			player.pos_y += 0.06 * 0.05 * this.animation_delta_time
		}
		if (death_delta > 6000) {
			game_state = 4
		}
	}

	if (game_state === 4) {
		var space = mult(model_transform, translate(player.pos_x, 14, player.pos_z));
		this.draw_space_ship(space);

		if (death_delta > 6500 && death_delta < 7000)
			music["blast_off"].play();

		death_delta += this.animation_delta_time;
		if (death_delta > 7000) {
			player.pos_x += 0.06 * 0.05 * this.animation_delta_time * velocity;
			player.pos_y += 0.06 * 0.05 * this.animation_delta_time * velocity;
			player.pos_z += 0.06 * 0.05 * this.animation_delta_time * velocity;
			velocity += 0.1 * this.animation_delta_time;

		}
		if (death_delta > 8000) {
			var mt = mult(mat4(), rotate(0, vec3(0,1,0)));
			mt = mult(model_transform, scale(1, 0.75, 0.05));
			this.m_text.draw(this.GAME_OVER_UI, mt, true, vec4(1,1,1,1));
			music["blast_off"].pause();
		}
	}



		

	}	

Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
	var time = 1;
	debug_screen_object.string_map["ani_delta"] = "Time Delta: " + this.animation_delta_time;
	debug_screen_object.string_map["frame"] = "FPS: " + Math.round(1/(this.animation_delta_time/1000), 1) + " fps";
	debug_screen_object.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_object.string_map["score"] = "Score: " + player.score;
	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_object.string_map["mines"] = "Mines available: " + player.mines;
	debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
	debug_screen_object.string_map["direction]"] = "Direction: " + direction;

	if (game_state === 4) {
		debug_screen_object.end_game = "GAME OVER!!";
		debug_screen_object.try_again = "Press Enter to play again!"
	}
	else {
		debug_screen_object.end_game = "";
		debug_screen_object.try_again = ""
	}
}

Animation.prototype.draw_sky = function (model_transform) {
	// model_transform = mult(model_transform, rotate(90, 0, 0, 1));
	model_transform = mult(model_transform, scale(100, 100, 100));
	this.draw_angled_cylinder(model_transform, sky);
	// this.m_sphere.draw(this.graphicsState, model_transform, sky);
}

Animation.prototype.draw_death = function (model_transform) {

}

Animation.prototype.draw_landmine = function(model_transform) {
	model_transform = mult(model_transform, scale(0.25, 0.25, 0.25));
	this.m_landmine.draw(this.graphicsState, model_transform, camo);
}

Animation.prototype.draw_character = function (model_transform, color) {

		var stack = new Array();
		model_transform = mult(model_transform, scale(0.25, 0.25, 0.25));
		stack.push(model_transform);
		// head and cap
		this.draw_cap(model_transform, camo);
		this.m_sphere.draw(this.graphicsState, model_transform, player.skin_color);

		// eyes
		// model_transform = mult(model_transform, translate(-0.4, 0, 1));
		model_transform = mult(model_transform, rotate(10, 1, 0, 0));
		model_transform = mult(model_transform, translate(-0.4, 0, 1));
		this.draw_eye(model_transform, new Material( vec4( 0, 0, 0,1 ), 1, 1, 1, 40 ));
		model_transform = mult(model_transform, translate(0.8, 0, 0));
		this.draw_eye(model_transform, new Material( vec4( 0, 0, 0,1 ), 1, 1, 1, 40 ));
		model_transform = mult(model_transform, translate(-0.4, 0, -1));
		model_transform = mult(model_transform, rotate(-10, 1, 0, 0));

		model_transform = mult(model_transform, translate(0, -1.75, 0));

		// body
		model_transform = mult(model_transform, scale(1, 1, 0.7));
		this.draw_body(model_transform, player.body_color);
		model_transform = mult(model_transform, scale(1, 1, 1/0.7));
		model_transform = mult(model_transform, translate(0, -1, 0));
		model_transform = mult(model_transform, scale(1, 0.7, 0.7));
		this.draw_bottom_half_sphere(model_transform, player.butt_color);
		model_transform = mult(model_transform, scale(1, 1/0.7, 1/0.7));
		model_transform = mult(model_transform, translate(-0.5, -0.2, 0));

		// legs
		model_transform = mult(model_transform, scale(0.9, 1, 1));
		this.draw_leg_right(model_transform);
		model_transform = mult(model_transform, scale(1/0.9, 1, 1));
		model_transform = mult(model_transform, translate(1, 0, 0));
		model_transform = mult(model_transform, scale(0.9, 1, 1));
		this.draw_leg_left(model_transform);
		model_transform = mult(model_transform, scale(1/0.9, 1, 1));

		model_transform = stack.pop();
		// arms?
		model_transform = mult(model_transform, translate(-0.4, -1, 0));
		this.draw_bazooka(model_transform, camo);


		model_transform = mult(model_transform, rotate(player.upper_right_arm_angle_x, 1, 0, 0));
		model_transform = mult(model_transform, rotate(-player.upper_right_arm_angle_z, 0, 0, 1));
		this.draw_arm_right(model_transform);

		model_transform = mult(model_transform, rotate(player.upper_right_arm_angle_z, 0, 0, 1));
		model_transform = mult(model_transform, translate(0.8, 0, 0));
		model_transform = mult(model_transform, rotate(-player.upper_right_arm_angle_x - player.upper_left_arm_angle_x, 1, 0, 0));
		model_transform = mult(model_transform, rotate(player.upper_left_arm_angle_z, 0, 0, 1));
		this.draw_arm_left(model_transform);

}

Animation.prototype.draw_bazooka = function (model_transform, color) {
	model_transform = mult(model_transform, translate(1.55, -1.65, 0));
	model_transform = mult(model_transform, scale( 0.25, 0.25, 0.1));
	this.m_bazooka.draw(this.graphicsState, model_transform, color);
	model_transform = mult(model_transform, scale( 1/0.25, 1/0.25, 1/0.1));

	return model_transform;
}

Animation.prototype.draw_eye = function(model_transform, color) {
	model_transform = mult(model_transform, scale(0.1, player.eye_y, 0.1));
	this.m_sphere.draw(this.graphicsState, model_transform, new Material( vec4( 0, 0, 0 ,1 ), 1, 1, 1, 40 ));
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

Animation.prototype.draw_leg_left = function(model_transform) {
	model_transform = mult(model_transform, rotate(-player.upper_left_leg_angle_x, 1, 0, 0));
	model_transform = mult(model_transform, rotate(player.upper_left_leg_angle_z, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -1, 0));
	this.draw_upper_leg(model_transform, player.lower_leg_color);
	model_transform = mult(model_transform, translate(0, -1, 0));
	this.draw_knee_cap(model_transform, player.knee_color);
	model_transform = mult(model_transform, rotate(-player.lower_left_leg_angle_x, 1, 0, 0));
	model_transform = mult(model_transform, rotate(-player.lower_left_leg_angle_z, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -0.75, 0));
	this.draw_lower_leg(model_transform, player.lower_leg_color);
	model_transform = mult(model_transform, translate(0, -0.75, 0.25));
	this.draw_foot(model_transform, player.foot_color);

	return model_transform;
}

Animation.prototype.draw_leg_right = function(model_transform) {
	model_transform = mult(model_transform, rotate(-player.upper_right_leg_angle_x, 1, 0, 0));
	model_transform = mult(model_transform, rotate(player.upper_right_leg_angle_z, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -1, 0));
	this.draw_upper_leg(model_transform, player.upper_leg_color);
	model_transform = mult(model_transform, translate(0, -1, 0));
	this.draw_knee_cap(model_transform, player.knee_color);
	model_transform = mult(model_transform, rotate(-player.lower_right_leg_angle_x, 1, 0, 0));
	model_transform = mult(model_transform, rotate(player.lower_right_leg_angle_z, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -0.75, 0));
	this.draw_lower_leg(model_transform, player.lower_leg_color);
	model_transform = mult(model_transform, translate(0, -0.75, 0.25));
	this.draw_foot(model_transform, player.foot_color);

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

Animation.prototype.draw_arm_left = function(model_transform) {
	this.draw_shoulder(model_transform, player.shoulder_color);
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_upper_arm(model_transform, player.upper_arm_color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_shoulder(model_transform, player.shoulder_color);
	model_transform = mult(model_transform, rotate(player.lower_left_arm_angle_x, 1, 0, 0));
	model_transform = mult(model_transform, rotate(player.lower_left_arm_angle_z, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_lower_arm(model_transform, player.lower_arm_color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_hand(model_transform, player.hand_color);

	return model_transform;
}

Animation.prototype.draw_cap = function(model_transform, color) {
	model_transform = mult(model_transform, scale(1.1, 1.1, 1.1));
	this.m_half_sphere.draw(this.graphicsState, model_transform, color);
	model_transform = mult(model_transform, translate(0, 0, 0.5));
	model_transform = mult(model_transform, scale(1, 0.1, 1.5));
	this.m_sphere.draw(this.graphicsState, model_transform, color);
}

Animation.prototype.draw_arm_right = function(model_transform) {
	this.draw_shoulder(model_transform, player.shoulder_color);
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_upper_arm(model_transform, player.upper_arm_color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_shoulder(model_transform, player.shoulder_color);
	model_transform = mult(model_transform, rotate(player.lower_right_arm_angle_x, 1, 0, 0));
	model_transform = mult(model_transform, rotate(player.lower_right_arm_angle_z, 0, 0, 1));
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_lower_arm(model_transform, player.lower_arm_color);
	model_transform = mult(model_transform, translate(0, -1.25, 0));
	this.draw_hand(model_transform, player.hand_color);

	return model_transform;
}

Animation.prototype.draw_body = function(model_transform) {
	// model_transform = mult(model_transform, scale(1, 0.75, 1));
	this.draw_angled_cylinder(model_transform, player.body_color);

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

Animation.prototype.draw_foot = function (model_transform) {
	// model_transform = mult(model_transform, rotate())
	model_transform = mult(model_transform, scale(0.2, 0.1, 0.4));
	this.m_sphere.draw(this.graphicsState, model_transform, player.foot_color);

	return model_transform;
}

Animation.prototype.draw_cone = function(model_transform, color) {
	model_transform = mult(model_transform, rotate(270, 1, 0, 0));
	this.m_fan.draw(this.graphicsState, model_transform, color);

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
			var up_mt = mult(model_transform, translate(0, board.BOARD_UNIT_SIZE/3, 0));
			this.draw_obstacles_col(up_mt);
		}
		model_transform = mult(model_transform, translate(board.BOARD_UNIT_SIZE, 0, 0));
	}
	return model_transform;
}

Animation.prototype.draw_obstacle = function (model_transform) {
	model_transform = mult(model_transform, scale(obstacle.OBSTACLE_SIZE, obstacle.OBSTACLE_SIZE, obstacle.OBSTACLE_SIZE));
	// this.m_cube.draw(this.graphicsState, model_transform, obstacle.OBSTACLE_COLOR);
	this.draw_tree(model_transform);

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
	// figure out offset later.
	// var offset_z = Math.sin(to_radians(direction));
	// var offset_x = Math.cos(to_radians(direction));
	//model_transform = mult(model_transform, translate(offset_x, -0.25, offset_z));
	model_transform = mult(model_transform, scale(bullet.BULLET_RADIUS, bullet.BULLET_RADIUS, bullet.BULLET_RADIUS));
	this.m_sphere.draw(this.graphicsState, model_transform, bullet.BULLET_COLOR);
	return model_transform;
}

Animation.prototype.draw_player = function(model_transform) {
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	this.m_sphere.draw(this.graphicsState, model_transform, sky);
	model_transform = mult(model_transform, translate(0, 0, 0.5));
	this.m_sphere.draw(this.graphicsState, model_transform, camo);
	model_transform = mult(model_transform, translate(0.5, 0, -0.5));
	this.m_sphere.draw(this.graphicsState, model_transform, purplePlastic);
	return model_transform;
}

Animation.prototype.draw_tree_segment = function (model_transform, color) {
	model_transform = mult(model_transform, scale(1, 0.5, 1));
	this.draw_cone(model_transform, color);
}

Animation.prototype.draw_tree_trunk = function (model_transform, color) {
	model_transform = mult(model_transform, scale(0.25, 0.5, 0.25));
	this.draw_cylinder(model_transform, color);
}

Animation.prototype.draw_tree = function (model_transform) {
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	this.draw_tree_trunk(model_transform, wood);
	model_transform = mult(model_transform, translate(0, 0.5, 0));
	model_transform = mult(model_transform, scale(0.8, 0.8, 0.8));
	this.draw_tree_segment(model_transform, dark_grass);
	model_transform = mult(model_transform, translate(0, 0.5, 0));
	model_transform = mult(model_transform, scale(0.8, 0.8, 0.8));
	this.draw_tree_segment(model_transform, dark_grass);
	model_transform = mult(model_transform, translate(0, 0.5, 0));
	model_transform = mult(model_transform, scale(0.8, 0.8, 0.8));
	this.draw_tree_segment(model_transform, dark_grass);
}

Animation.prototype.draw_space_ship = function (model_transform) {
	this.draw_outer_space_ship(model_transform);
	model_transform = mult(model_transform, translate(0,1,0));
	this.draw_center_space_ship(model_transform);

}

Animation.prototype.draw_outer_space_ship = function(model_transform) {
	model_transform = mult(model_transform, scale(5, 1, 5));
	this.m_sphere.draw(this.graphicsState, model_transform, metal);
}

Animation.prototype.draw_center_space_ship = function(model_transform) {
	model_transform = mult(model_transform, scale(3, 1, 3));
	this.m_sphere.draw(this.graphicsState, model_transform, blue);
}

Animation.prototype.draw_ray = function (model_transform) {
	model_transform = mult(model_transform, scale(3, 7, 3));
	this.draw_angled_cylinder(model_transform, yellow);
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
	this.BOARD_UNIT_COLOR_1 = dirt; //new Material(vec4(0, 0.392157, 0, 1), 1, 1, 1, 20); 
	// forest green
	this.BOARD_UNIT_COLOR_2 = light_grass; //new Material(vec4(0.133333, 0.545098, 0.133333, 1), 1, 1, 1, 20); 

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

	this.MAX_ENEMIES = 5;

	this.enemy_arr = new Array();
	for (var i = 0; i < this.MAX_ENEMIES; i++) {
		this.enemy_arr.push(new Enemy(0, 0, 0, false));
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

	this.body_color = camo;
	this.butt_color = camo;
	this.upper_leg_color = camo;
	this.lower_leg_color = camo;
	this.upper_arm_color = camo;
	this.lower_arm_color = camo;
	this.knee_color = camo;
	this.shoulder_color = camo;
	this.elbow_color = camo;
	this.foot_color =  skin;
	this.hand_color = skin;
	this.skin_color = skin;

	this.dead = false;

	this.bullet_fired = false;
	this.score = 0;


	this.upper_left_arm_angle_z = 30;
	this.lower_left_arm_angle_z = 10;
	this.upper_left_arm_angle_x = 0;
	this.lower_left_arm_angle_x = -90;

	this.upper_right_arm_angle_z = 30;
	this.lower_right_arm_angle_z = 10;
	this.upper_right_arm_angle_x = -30;
	this.lower_right_arm_angle_x = -110;

	this.upper_left_leg_angle_z = 0;
	this.lower_left_leg_angle_z = 0;
	this.upper_right_leg_angle_z = 0;
	this.lower_right_leg_angle_z = 0;

	this.upper_left_leg_angle_x = 0;
	this.upper_right_leg_angle_x = 0;
	this.lower_left_leg_angle_x = 0;
	this.lower_right_leg_angle_x = 0;

	this.eye_y = 0.1;
	this.mines = 3;
	this.mines_arr = new Array();
	for (var i = 0; i < this.mines; i++) {
		this.mines_arr.push(new Mine());
	}


}

function reset_game() {
	player.pos_x = 0;
	player.pos_y = board.BOARD_UNIT_SIZE/2 + 0.5;
	player.pos_z = 0;
	player.direction = 0;
	player.score = 0;
	player.mines = 3;
	player.dead = false;
	for (var i = 0; i < board.MAX_ENEMIES; i++) {
		board.enemy_arr[i].pos_x = 0;
		board.enemy_arr[i].pos_y = 0;
		board.enemy_arr[i].pos_z = 0;
		board.enemy_arr[i].direction = 0;
		board.enemy_arr[i].steps = 0;
		board.enemy_arr[i].spawned = false;

	}
}

function Mine() {
	this.pos_x = 0;
	this.pos_y = 0;
	this.pos_z = 0;

	this.spawned = false;
}


//
function Enemy() {
	this.pos_x = 0;
	this.pos_y = 0;
	this.pos_z = 0;
	this.direction = 0;
	this.steps = 0;
	this.moved = 0;

	this.spawned = false;
	
}

function Bullet(x, y, z) {
	this.pos_x = x;
	this.pos_y = y;
	this.pos_z = z;

	this.bullet_orientation = 0;

	this.BULLET_COLOR = new Material (vec4 (.5, .5, 0, 1), 1, 1, 1, 40);
	this.BULLET_RADIUS = 0.1;

}

function display_coord_to_grid_coord(i) {
	return Math.round(-(i/board.BOARD_UNIT_SIZE) + Math.floor(board.BOARD_SIZE/2));
}

function grid_coord_to_display_coord(i) {
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

function gen_steps() {
	return 8 * board.BOARD_UNIT_SIZE * Math.floor(board.BOARD_SIZE/2 * Math.random());
}

// spawns an enemy
// adds it to Board.enemy_arr
// for now, just have enemies appear and stand still
function spawn_enemy() {
 	// have enemies spawn in a random corner? let's just have it at top left for now.
 	for (var i = 0; i < board.enemy_arr.length; i++) {
 		if (!board.enemy_arr[i].spawned)
 		{
 			board.enemy_arr[i].spawned = true;
 			board.enemy_arr[i].pos_x = grid_coord_to_display_coord(0);
 			board.enemy_arr[i].pos_y = board.BOARD_UNIT_SIZE/2;
 			board.enemy_arr[i].pos_z = grid_coord_to_display_coord(0);
 			board.enemy_arr[i].steps = 2; // move 2 steps
 			board.enemy_arr[i].moved = 0;
 			board.enemy_arr[i].direction = 0; // down the board
 			break;
 		}
 	}

}


function inBounds(x, y, z) {
	if (Math.abs(x) > Math.floor(board.BOARD_SIZE/2) * board.BOARD_UNIT_SIZE + board.BOARD_UNIT_SIZE/2)
		return false;
	if (Math.abs(z) > Math.floor(board.BOARD_SIZE/2) * board.BOARD_UNIT_SIZE + board.BOARD_UNIT_SIZE/2)
		return false;
	if (isObstacleAt(display_coord_to_grid_coord(x), display_coord_to_grid_coord(z))) {
		return false;
	}
	return true;
}

function isObstacleAt(x, z) {
	// if (x > board.BOARD_SIZE - 1 || z > board.BOARD_SIZE - 1) {
	// 	console.log ("WTF");
	// 	return true;
	// }
	// else
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

function raise_arm(delta) {
	if (player.upper_arm_angle_x !== arm_stop_angle) {
		if (arms_up) {
			player.upper_arm_angle_x += delta/3;

			if (player.upper_arm_angle_x > arm_stop_angle)
				player.upper_arm_angle_x = arm_stop_angle;
		}
		else {
			player.upper_arm_angle_x -= delta/3;
			if (player.upper_arm_angle_x < arm_stop_angle)
				player.upper_arm_angle_x = arm_stop_angle;
		}
	}
	else {
		block_arm = false;
		arm_stop_angle *= -1;
		arms_up = !arms_up;
		block_arm = true;
	}
}

function smooth_walk() {
	if (walking) {
		player.pos_z += 1;
	}
}

function pause_all_music() {
	for (var i = 0; i < music.length; i++) {
		music[i].pause();
	}
}

function half_walk(delta) {
	var back = 1;
	if (backward)
			back = -1;
	if (walk_phase === 0) {
		player.pos_z += 0.06 * 0.1 * 1.4 * delta * Math.sin(to_radians(direction)) * back;
		player.pos_x += 0.06 * 0.1 * 1.4 * delta * Math.cos(to_radians(direction)) * back;
		moved += 0.06 * 0.1 * 1.4 * delta;
		if (!right_leg_forward) {
			player.upper_left_arm_angle_x -= (0.06 * 2 * speed *delta);
			player.upper_left_leg_angle_x += (0.06 * 2 * speed *delta);
			player.lower_left_leg_angle_x -= (0.06 * 1.5 * speed *delta);

			player.upper_right_leg_angle_x -= (0.06 * speed * delta);
			player.lower_right_leg_angle_x -= (0.06 * 2 * speed * delta);

			if (player.upper_left_leg_angle_x > upper_leg_stop_angle) {
				player.upper_left_leg_angle_x = upper_leg_stop_angle;
				player.upper_right_left_angle_x = -upper_leg_stop_angle;
				walk_phase = 1;
			}
		}
		else {
			player.upper_left_arm_angle_x -= (0.06 * 2 * speed *delta);
			player.upper_right_leg_angle_x += (0.06 * 2 * speed * delta);
			player.lower_right_leg_angle_x -= (0.06 * 1.5 * speed * delta);

			player.upper_left_leg_angle_x -= (0.06 * speed * delta);
			player.lower_left_leg_angle_x -= (0.06 * 2 * speed * delta);

			if (player.upper_right_leg_angle_x > upper_leg_stop_angle) {
				player.upper_right_leg_angle_x = upper_leg_stop_angle;
				player.upper_left_left_angle_x = -upper_leg_stop_angle;
				walk_phase = 1;
			}
		}
	}
	if (walk_phase === 1) {
		player.pos_z += 0.06 * 0.05 * 1.4 * delta * Math.sin(to_radians(direction)) * back;
		player.pos_x += 0.06 * 0.05 * 1.4 * delta * Math.cos(to_radians(direction)) * back;
		moved += 0.06 * 0.05 * 1.5 * delta;
		if (!right_leg_forward) {
			player.upper_left_arm_angle_x += (0.06 * 3 * speed *delta);
			player.upper_left_leg_angle_x -= (0.06 * 3 * speed * delta);
			player.lower_left_leg_angle_x += (0.06 * 1.5 * speed * delta);

			player.upper_right_leg_angle_x += (0.06 * 1.5 * speed *delta);
			player.lower_right_leg_angle_x += (0.06 * 3 * speed * delta);

			if (player.upper_left_leg_angle_x <= 0) {
				player.upper_left_leg_angle_x = 0;
				player.upper_right_left_angle_x = 0;
				player.lower_right_leg_angle_x = 0;
				player.lower_left_leg_angle_x = 0;
				player.upper_left_arm_angle_x = 10;
				block_upper_leg = false;
				right_leg_forward = !right_leg_forward;
				if (moved != 5) {
					var to_move = 5 - moved;
					player.pos_z += to_move * Math.sin(to_radians(direction)) * back;
					player.pos_x += to_move * Math.cos(to_radians(direction)) * back;
					player.pos_x = Math.round(player.pos_x);
					player.pos_z = Math.round(player.pos_z);
					console.log("px:" + player.pos_x + "," + "pz: " + player.pos_z);
				}
			}
		}
		else {
			player.upper_left_arm_angle_x += (0.06 * 3 * speed *delta);
			player.upper_right_leg_angle_x -= (0.06 * 3 * speed * delta);
			player.lower_right_leg_angle_x += (0.06 * 1.5 * speed * delta);

			player.upper_left_leg_angle_x += (0.06 * 1.5 * speed * delta);
			player.lower_left_leg_angle_x += (0.06 * 3 * speed * delta);

			if (player.upper_right_leg_angle_x <= 0) {
				player.upper_right_leg_angle_x = 0;
				player.upper_left_left_angle_x = 0;
				player.lower_left_leg_angle_x = 0;
				player.lower_right_leg_angle_x = 0;
				player.upper_left_arm_angle_x = 10;
				block_upper_leg = false;
				right_leg_forward = !right_leg_forward;
				if (moved != 5) {
					var to_move = 5 - moved;
					player.pos_z += to_move * Math.sin(to_radians(direction)) * back;
					player.pos_x += to_move * Math.cos(to_radians(direction)) * back;
					player.pos_x = Math.round(player.pos_x);
					player.pos_z = Math.round(player.pos_z);
					console.log("px:" + player.pos_x + "," + "pz: " + player.pos_z);
				}
			}
		}
	}
}
function walk_in_place(delta) {
	if (walk_phase === 0) {
		if (!right_leg_forward) {
			player.upper_left_arm_angle_x -= (0.06 * 2 * speed *delta);
			player.upper_left_leg_angle_x += (0.06 * 2 * speed *delta);
			player.lower_left_leg_angle_x -= (0.06 * 1.5 * speed *delta);

			player.upper_right_leg_angle_x -= (0.06 * speed * delta);
			player.lower_right_leg_angle_x -= (0.06 * 2 * speed * delta);

			if (player.upper_left_leg_angle_x > upper_leg_stop_angle) {
				player.upper_left_leg_angle_x = upper_leg_stop_angle;
				player.upper_right_left_angle_x = -upper_leg_stop_angle;
				walk_phase = 1;
			}
		}
		else {
			player.upper_left_arm_angle_x -= (0.06 * 2 * speed *delta);
			player.upper_right_leg_angle_x += (0.06 * 2 * speed * delta);
			player.lower_right_leg_angle_x -= (0.06 * 1.5 * speed * delta);

			player.upper_left_leg_angle_x -= (0.06 * speed * delta);
			player.lower_left_leg_angle_x -= (0.06 * 2 * speed * delta);

			if (player.upper_right_leg_angle_x > upper_leg_stop_angle) {
				player.upper_right_leg_angle_x = upper_leg_stop_angle;
				player.upper_left_left_angle_x = -upper_leg_stop_angle;
				walk_phase = 1;
			}
		}
	}
	if (walk_phase === 1) {
		if (!right_leg_forward) {
			player.upper_left_arm_angle_x += (0.06 * 3 * speed *delta);
			player.upper_left_leg_angle_x -= (0.06 * 3 * speed * delta);
			player.lower_left_leg_angle_x += (0.06 * 1.5 * speed * delta);

			player.upper_right_leg_angle_x += (0.06 * 1.5 * speed *delta);
			player.lower_right_leg_angle_x += (0.06 * 3 * speed * delta);

			if (player.upper_left_leg_angle_x <= 0) {
				player.upper_left_leg_angle_x = 0;
				player.upper_right_left_angle_x = 0;
				player.lower_right_leg_angle_x = 0;
				player.lower_left_leg_angle_x = 0;
				player.upper_left_arm_angle_x = 10;
				walk_in_place_block = false;
				right_leg_forward = !right_leg_forward;
			}
		}
		else {
			player.upper_left_arm_angle_x += (0.06 * 3 * speed *delta);
			player.upper_right_leg_angle_x -= (0.06 * 3 * speed * delta);
			player.lower_right_leg_angle_x += (0.06 * 1.5 * speed * delta);

			player.upper_left_leg_angle_x += (0.06 * 1.5 * speed * delta);
			player.lower_left_leg_angle_x += (0.06 * 3 * speed * delta);

			if (player.upper_right_leg_angle_x <= 0) {
				player.upper_right_leg_angle_x = 0;
				player.upper_left_left_angle_x = 0;
				player.lower_left_leg_angle_x = 0;
				player.lower_right_leg_angle_x = 0;
				player.upper_left_arm_angle_x = 10;
				walk_in_place_block = false;
				right_leg_forward = !right_leg_forward;
			}
		}
	}
}



// straighten left leg
// slightly tilt right leg forward more
function straighten_left_leg() {

}

function sitting_pose() {
	player.lower_left_leg_angle_x = -90;
	player.lower_right_leg_angle_x = -90;

	player.upper_left_leg_angle_x = 90;
	player.upper_right_leg_angle_x = 90;

}

function jump() {
	// crouch and move arms back
	// lower body

}

function crouch() {

}


Animation.prototype.draw_petals = function(model_transform) {
	model_transform = mult(model_transform, rotate(20, 1, 0, 0));
	var reset = model_transform;
	var numPetals = flower.NUM_FLOWER_PETALS;
	var angle = 0;

	for (var i = 0; i < numPetals; i++) {
		model_transform = mult(model_transform, rotate(angle, 0, 1, 0));
		model_transform = mult(model_transform, rotate(-7, 1, 0, 0));

		model_transform = mult(model_transform, translate(0, 0, flower.FLOWER_RADIUS + 3 * flower.FLOWER_RADIUS));
		model_transform = mult(model_transform, scale(flower.PETAL_X, flower.PETAL_Y, flower.PETAL_Z));
		this.m_sphere.draw(this.graphicsState, model_transform, flower.PETAL_MATERIAL);
		model_transform = reset;
		angle += 360/numPetals;
	}

	var angle_interleave = 360/numPetals/2;
	for (var i =0; i < numPetals; i++) {
		model_transform = mult(model_transform, rotate(angle + angle_interleave, 0, 1, 0));
		model_transform = mult(model_transform, rotate(-5, 1, 0, 0));

		model_transform = mult(model_transform, translate(0, 0, flower.FLOWER_RADIUS + 3 * flower.FLOWER_RADIUS));
		model_transform = mult(model_transform, scale(flower.PETAL_X, flower.PETAL_Y, flower.PETAL_Z));
		this.m_sphere.draw(this.graphicsState, model_transform, flower.PETAL_MATERIAL);
		model_transform = reset;
		angle += 360/numPetals;
	}
}

function Flower() {

	// controls the swaying angle of flower
	this.MAX_STEM_ANGLE = 1;

	// dimensions for flower
	this.FLOWER_MATERIAL = new Material (vec4 (.5, .5, 0, 1), 1, 1, 1, 40); // default yellow
	this.FLOWER_RADIUS = 1;
	this.PETAL_MATERIAL = new Material (vec4 (.4, 0, 0, 1), 1, 1, 1, 40);
	this.NUM_FLOWER_PETALS = 24;
	this.PETAL_X = 0.5;
	this.PETAL_Y = 0.2;
	this.PETAL_Z = 4;

	// dimensions for one stem segment
	this.STEM_MATERIAL = new Material (vec4 (0.333333, 0.419608, 0.184314, 1), 1, 1, 1, 40); // default olive greenPlastic
	this.NUMBER_OF_STEM_SEGS = 24;
	this.STEM_SEG_X = 0.5;
	this.STEM_SEG_Y = 1;
	this.STEM_SEG_Z = 0.5;
}


