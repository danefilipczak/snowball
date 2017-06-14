var renderer, scene, camera, ambient, torus, plane, group;
var mesh;
var controls;
var ypos =0;
var mouseDown = false;
var inControls = false;

var snowball;
var distance = 40;


window.onload = function(){

	
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 'white' );
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
	camera.position.z=distance;
	
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.domElement.style = "position:fixed; top:0px; left:0px"
	renderer.domElement.addEventListener("mousemove", function(){
		mouseX = event.clientX;
		mouseY = event.clientY
	});


	ambient = new THREE.HemisphereLight( 0x404040 ); // soft white light
	ambient.position.y = -10
	scene.add( ambient );


	render();

	

	document.addEventListener("mousedown", function(){
		mouseDown= true;
		
	});

	document.addEventListener("mouseup", function(){
		mouseDown= false;
		
	});

	document.getElementById("controls").addEventListener("mouseover", function(){
		inControls= true;
		
	});

	document.getElementById("controls").addEventListener("mouseout", function(){
		inControls= false;
		
	});
	



}


