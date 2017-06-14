var rotY=0;

function loop(){
	if(snowball){
		snowball.mesh.rotation.y = rotY;
	}

	if(mouseDown && !inControls){
		var vFOV = camera.fov * Math.PI / 180;        // convert vertical fov to radians
		var height = 2 * Math.tan( vFOV / 2 ) * distance; // visible height

		var aspect = window.innerWidth / window.innerHeight;
		var width = height * aspect;    

		var x = (mouseX-window.innerWidth/2)/window.innerWidth*width;
		var y = -(mouseY-window.innerHeight/2)/window.innerHeight*height;

		var mouse = new THREE.Vector3(x, y, 0);
		mouse.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotY);

		if(!snowball){
			snowball = new Snowball(
				mouse, 
				{
					radius:4,
					isolevel:0.2,
					resolution:10,
					material: new THREE.MeshPhongMaterial( { color:'cyan', wireframe: true} ),

				}
			);

			scene.add(snowball.mesh);
		} else {
			
			snowball.add(mouse);
			
		}
	}
	rotY+=0.01;
}
