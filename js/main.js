

calculator = {};

//control canvass -- redrawing doesn't seem to be working right
paper.view.viewSize = [940, 190];
function onResize(event) {
	paper.view.viewSize = [940, 190];
}



//mechanical defaults 
calculator.mass 					= 85;
calculator.regenerative_efficientcy = 0.0;
calculator.area = 0.5; 
calculator.rho 	= 1.226;
calculator.drag_coefficient = 0.5;
calculator.rolling_coefficient = 0.004;

//display settings 
calculator.left_margin 	= 50;
calculator.speed_width 	= 880;
calculator.speed_height 	= 170;
calculator.speed_max_y    	= 30;
calculator.speed_max_x    	= 5; 

//for axis labels
calculator.speed_graph_x 		= new Group();
calculator.speed_graph_y 		= new Group();

$('#recalculate').click(function(){ 
	calculator.speed_max_x = $('distance').val();
});

  
calculator.drawGraph = function() {  
	//draw the speed graph
	speed_curve = new Path();

	speed_curve.strokeColor = 'blue';
	speed_curve.add(new Point(calculator.left_margin, calculator.speed_height));
	speed_curve.add(new Point(calculator.left_margin + 60, 85));
	speed_curve.add(new Point(calculator.speed_width+calculator.left_margin, 70));
	speed_curve.smooth();
	this.speed_curve = speed_curve;
	
	//draw the x axis of the speed graph
	var x_axis = new Path();
	x_axis.strokeColor = 'black';
	x_axis.add(new Point(calculator.left_margin, calculator.speed_height));
	x_axis.add(new Point(calculator.speed_width+calculator.left_margin, calculator.speed_height));

	//draw the y axis of the speed graph
	var y_axis = new Path();
	y_axis.strokeColor = 'black';
	y_axis.add(new Point(calculator.left_margin, 0));
	y_axis.add(new Point(calculator.left_margin, calculator.speed_height));
}

calculator.addLabels = function () { 
	//remove any previous labels
	calculator.speed_graph_x.removeChildren();
	calculator.speed_graph_y.removeChildren();
	
	//label axes 	
	if (calculator.speed_max_x<30) {
		increment = 1; 
	}

	if (calculator.speed_max_x>30) {
		increment = 4; 
	}
	
	for (i=1; i<=calculator.speed_max_x; i+=increment) {
		var speed_graph_x 		= new PointText();
		calculator.speed_graph_x.addChild(speed_graph_x);
		speed_graph_x.fillColor = 'black';
		speed_graph_x.content 	=  i ;
		if (calculator.speed_max_x<10) { 
			speed_graph_x.content += " miles";
		}
		var x_multiplier 		= (calculator.speed_width/calculator.speed_max_x);
		var x_offset; 
		if (i===calculator.speed_max_x){x_offset=-8;} else {x_offset=0;}	
		speed_graph_x.position = new Point((i*x_multiplier) + x_offset + calculator.left_margin -25, calculator.speed_height+15);
	}
	
	for (i=calculator.speed_max_y; i>0; i-=5) {
		var speed_graph_y = new PointText();
		calculator.speed_graph_y.addChild(speed_graph_y);
		speed_graph_y.fillColor = 'black';
		speed_graph_y.content = (calculator.speed_max_y-i) + " mph";
		var y_multiplier 		= (calculator.speed_height/calculator.speed_max_y);
		var y_offset; 
		if (i===0){y_offset=5;} else {y_offset=0;}
		speed_graph_y.position = new Point(0, (i * y_multiplier) + y_offset );
	}
}



function onMouseDown(event) {
	
	var hitResult = project.hitTest(event.point, hitOptions);

	if (event.modifiers.shift) {
		if (hitResult.type == 'segment') {
			hitResult.segment.remove();
		}
		return;
	}

	if (hitResult) {

		if (hitResult.type == 'segment') {
			segment = hitResult.segment;
		} else if (hitResult.type == 'stroke' && hitResult.item._id == 4) {
			var location = hitResult.location;
			segment = calculator.speed_curve.insert(location.index + 1, event.point);
			calculator.speed_curve.smooth();
		}
	}
}




calculator.calculateForces = function () {
	var velocity_array 		= [];
	var acceleration_array 	= [];
	var power_array 	= [];

	var total_time 		= 0;  
	var total_energy 	= 0;
	var slices 			= 200;

	var miles_per_pixel 	= calculator.speed_max_x/calculator.speed_width;
	var meters_per_pixel	= miles_per_pixel * 1609.34;
	var slice_pixel_width	= calculator.speed_width/slices;
	var distance_per_slice  = meters_per_pixel * slice_pixel_width;
	
	var mph_per_pixel 		= calculator.speed_max_y/calculator.speed_height;
	var mss_per_pixel		= mph_per_pixel * 0.44704; //meters per second per second
	
	//acceleration stuff
	var acceleratio_force;
	var accleration_power;	
	var acceleration_energy = 0; 
	
	//drag stuff

	var drag_force;
	var drag_power; 
	var drag_energy = 0;
	
	//rolling stuff
	var rolling_force;
	var rolling_power; 
	var rolling_energy = 0;
	
	for(i=0; i<slices; i++) {
		
		point_velocity 	= 0;			
		test_point 		= new Point((i*slice_pixel_width)+calculator.left_margin, 0);
		point_velocity 	= calculator.speed_curve.getNearestPoint(test_point);
		point_velocity	= (point_velocity.y);
		
		//convert to meters per second
		velocity = (calculator.speed_height - point_velocity) * mss_per_pixel;
		velocity_array.push(velocity * 2.23694);
		
		//times
		time_taken_for_step = 	distance_per_slice/velocity;
		total_time 			+= 	time_taken_for_step;
		
		//calculate acceleration 
		test_point 			= new Point(((i-1)*slice_pixel_width)+calculator.left_margin, 0);
		point_velocity 		= calculator.speed_curve.getNearestPoint(test_point);
		point_velocity		= (point_velocity.y);
		var previous_velocity  	= (calculator.speed_height - point_velocity) * mss_per_pixel; 

		var average_velocity 	= (previous_velocity+velocity)/2;
		var time_per_slice		= distance_per_slice/average_velocity;
		var acceleration 		= (velocity-previous_velocity)/time_per_slice;
		
		//calculate force due to accleration 
		acceleration_force = calculator.mass * acceleration;
		acceleration_power  = acceleration_force * average_velocity;
		acceleration_work	= acceleration_power * time_per_slice; 
		acceleration_array.push(acceleration_work);
		
		if (acceleration_work >= 0) {  
			acceleration_energy += acceleration_work;
		}
		else { 
			acceleration_energy += (acceleration_work * calculator.regenerative_efficientcy);
		} 
		
		//calculate force due to wind
		drag_force = 0.5 * calculator.area * calculator.drag_coefficient *  calculator.rho * Math.pow(average_velocity , 2);
		drag_power = drag_force * average_velocity;
		
		drag_work =  drag_power * time_per_slice;
		drag_energy  += drag_work;
		power_array.push(drag_power);
		
		//calculate due to rolling resistance
		rolling_force = calculator.mass *  9.81 *  calculator.rolling_coefficient;
		rolling_power = rolling_force * average_velocity;
		rolling_work =  rolling_power * time_per_slice;
		rolling_energy  += rolling_work;
		
	}
	
	//render results
	var total_energy = Math.round(rolling_energy/1000) + Math.round(drag_energy/1000) + Math.round(acceleration_energy/1000); 
	
	jQuery('#journey_time').html(Math.round(total_time/60) + ' min' );
	$('#energy_acceleration').html(Math.round(acceleration_energy/1000)  + ' kJ');
	$('#energy_wind_resistance').html(Math.round(drag_energy/1000)  + ' kJ' );
	$('#energy_rolling_friction').html(Math.round(rolling_energy/1000)  + ' kJ' );
	$('#energy_total').html( Math.round(rolling_energy/1000) + Math.round(drag_energy/1000) + Math.round(acceleration_energy/1000) + ' kJ' );
	
	$('#mars_bar').html((total_energy/250));	
	var height = (total_energy/250) * 194;
	
	
	if (height > 150) { 
		$('#mars_wrapper').css('background-image', 'url("../img/mars_small.png")');
		height = (total_energy/250) * 47;
	}
	else { 
		$('#mars_wrapper').css('background-image', 'url("../img/mars.png")');
	}
	
	$('#mars_wrapper').css('height', height);
	
	$('#oil').html(Math.round(total_energy/7) +' mL'); 
	
	$('#battery').html(Math.round((total_energy*1000/970)) +' g');
	height = (total_energy/151) * 182;
	
	if (height > 220) { 
		$('#battery_wrapper').css('background-image', 'url("../img/ipad_small.png")');
		height = (total_energy/151) * 30;
	}
	else { 
		$('#battery_wrapper').css('background-image', 'url("../img/ipad.png")');
	}
	
	$('#battery_wrapper').css('height', height);
	
}

//interface stuff

// Mouse Events
var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 50
};

function onMouseMove(event) {
	var hitResult = project.hitTest(event.point, hitOptions);
	project.activeLayer.selected = false;
	if (hitResult && hitResult.item) {
		hitResult.item.selected = true;
	}	
}

function onMouseDrag(event) {
	if (segment) {
		if (event.point.y > 20 && event.point.y < (calculator.speed_height-20)) { 
			segment.point.y = event.point.y;
			calculator.speed_curve.smooth();
		}	
	}
}

function onMouseUp(){
	calculator.calculateForces(); 
}

calculator.recalculate = function() { 
	
	calculator.speed_max_x = parseInt($('#distance').val());
	calculator.mass = parseInt($('#person_mass').val()) + parseInt($('#vehicle_mass').val());
	calculator.regenerative_efficientcy = parseInt($('#regen').val())/100;
	calculator.rho = parseFloat($('#rho').val());
	calculator.area = parseFloat($('#x-section').val());
	console.log(calculator.area);
	calculator.drag_coefficient = parseFloat($('#drag_friction').val());
	calculator.rolling_coefficient = parseFloat($('#rolling_friction').val());
	calculator.addLabels();
	calculator.calculateForces();
}

$(document).ready(function(){   
    console.log('loaded');
	$("#settings_toggle ").click(function(){
		$('#settings_tab').slideToggle();	
	});

	$("#settings_toggle").toggle(function(){
	     $("img", this).attr('src', "img/up_arrow.png");
	}, function(){
	     $("img", this).attr('src', "img/down_arrow.png");
	});
	
	$('#recalculate').click(function(){ 
		calculator.recalculate();
	})
	
	$("input:radio[name=defaults]").click(function() {
		console.log('hi');
	    var value = $(this).val();
		if (value == 'car') { 
			$('#vehicle_mass').val('1500');
			$('#rolling_friction').val('0.01');
			$('#x-section').val('2.5');
			$('#drag_friction').val('0.35');
			$('#regen').val(0)
		}
		if (value == 'bike') { 
			$('#vehicle_mass').val('10');
			$('#rolling_friction').val('0.004');
			$('#x-section').val('0.5');
			$('#drag_friction').val('0.5');
			$('#regen').val(0)			
		}
		if (value == 'boosted') { 
			$('#vehicle_mass').val('3');
			$('#rolling_friction').val('0.004');
			$('#x-section').val('0.4');
			$('#drag_friction').val('0.5');
			$('#regen').val(90);			
		}		
		calculator.recalculate();	
		
	});

	//... and init 
	calculator.drawGraph();
	calculator.addLabels();
	calculator.calculateForces();
	//window.setTimeout("calculator.drawGraph()",1000);
})










