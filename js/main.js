//mechanical defaults 
var mass 					= 70;
var regernative_efficientcy = 0.0;
var max_distance = 5000;
//display settings 
var left_margin 	= 50;
var width 			= 890;
var speed_height 	= 250;
var speed_max_y    	= 30;
var speed_max_x    	= 5; 


var speed_curve = new Path();
speed_curve.strokeColor = 'black';
speed_curve.add(new Point(left_margin, 125));
speed_curve.add(new Point(width+left_margin, 125));


var journey_time_indicator = new PointText();
journey_time_indicator.fillColor = 'black';
journey_time_indicator.position = new Point(left_margin, speed_height+26);

var work_indicator = new PointText();
work_indicator.fillColor = 'black';
work_indicator.position = new Point(left_margin +300, speed_height+26);





//draw axes 
for (i=1; i<=speed_max_x; i++) {
	var speed_graph_x 		= new PointText();
	speed_graph_x.fillColor = 'black';
	speed_graph_x.content 	=  i + " M";
	var x_multiplier 		= (width/speed_max_x);
	var x_offset; 
	if (i===0){x_offset=10} else {x_offset=0}	
	speed_graph_x.position = new Point((i*x_multiplier) + x_offset + left_margin -25, speed_height+15);
}
	
for (i=speed_max_y; i>0; i-=5) {
	var speed_graph_y = new PointText();
	speed_graph_y.fillColor = 'black';
	speed_graph_y.content = (speed_max_y-i) + " mph";
	var y_multiplier 		= (speed_height/speed_max_y);
	var y_offset; 
	if (i===0){y_offset=5} else {y_offset=0}
	speed_graph_y.position = new Point(0, (i * y_multiplier) + y_offset );
}

var speed_graph = new Group([speed_curve, speed_graph_x, speed_graph_y]);

//Init
calculateForces();


// Mouse Events
var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 50
};

function onMouseDown(event) {
	
	var hitResult = project.hitTest(event.point, hitOptions);

	if (event.modifiers.shift) {
		if (hitResult.type == 'segment') {
			hitResult.segment.remove();
		};
		return;
	}

	if (hitResult) {
		speed_curve = hitResult.item;
		if (hitResult.type == 'segment') {
			segment = hitResult.segment;
		} else if (hitResult.type == 'stroke') {
			var location = hitResult.location;
			segment = speed_curve.insert(location.index + 1, event.point);
			speed_curve.smooth();
		}
	}
}

function onMouseMove(event) {
	var hitResult = project.hitTest(event.point, hitOptions);
	project.activeLayer.selected = false;
	if (hitResult && hitResult.item)
		hitResult.item.selected = true;
}

function onMouseDrag(event) {
	if (segment) {
		if (event.point.y > 0 && event.point.y < speed_height) { 
			segment.point.y = event.point.y;
			speed_curve.smooth(5);
		}	
	}

}

function onMouseUp(){
	calculateForces(); 
}


function calculateForces() {
	var velocity_array 		= [];
	var acceleration_array 	= [];
	var total_time 		= 0;  
	var total_energy 	= 0;  

	var distance_per_pixel 	= max_distance/1000;
	var distance_per_step  	=  distance_per_pixel*10;
	
	console.log("distance per step " +distance_per_step);
	
	for($i=0; $i<1000; $i+=10) {
		velocity_point = 0;			
		test_point =new Point($i+left_margin, 0);
		velocity_point 	= speed_curve.getNearestPoint(test_point);
		velocity_point	= (velocity_point.y);
		
		//convert to meters per second
		velocity  = (200 - velocity_point)/20*0.447;  
		velocity_array.push(velocity);
		
		//times
		time_taken_for_step = distance_per_step/velocity;
		total_time += time_taken_for_step;
		
		//calculate acceleration 
		test_point =new Point(($i-1)+left_margin, 0);
		velocity_point 	= speed_curve.getNearestPoint(test_point);
		velocity_point	= (velocity_point.y);
		previous_velocity  = (200 - velocity_point)/20*0.447;  
		average_velocity = (previous_velocity+velocity)/2
		time_per_step = distance_per_step/average_velocity;
		acceleration = (velocity-previous_velocity)/time_per_step;
		
		//calculate force due to accleration 
		force = mass * acceleration;
		work  = force * distance_per_step;
		if (work > 0) {  
			total_energy += work;
		}
		
		else { 
			total_energy += (work * regernative_efficientcy);
		} 
		
	}
	
	console.log(acceleration_array);
	journey_time_indicator.content = "Total journey time " + (Math.round(total_time/60)) + "min";  
	work_indicator .content = "Total energy = " +  Math.round(total_energy/60) ;
}








