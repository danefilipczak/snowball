# snowball
A simple to use isosurfacing plugin for Three.js. It calculates the annoying stuff for you and takes care of updating geometry. 

Examples [
[interactive](https://danefilipczak.github.io/snowball/examples/interactive)
]
## initializing 

new Snowball(vectors, {parameters})

make a new Snowball object with a single THREE.Vector3, or an array of them... 

```javascript
var vectors = []
for (var i = 0; i < 10; i++){
  vectors[i] = new THREE.Vector3(
    Math.random()*10,
    Math.random()*10,
    Math.random()*10
  ); 
};

var snowball = new Snowball(vectors,{
    radius:2,
    isolevel:0.2,
    resolution:20,
    material: new THREE.MeshBasicMaterial({wireframe: true})
  }
 );
````
... then access its mesh and add it to your scene.
````javascript
scene.add(snowball.mesh);

````
All parameters are optional - relatively sensible default values will be calculated if they're left out. 



## adding vectors  
Snowball calculates and updates the size of its voxel field as necessary based on the vectors it's been passed. Add a vector:
````javascript
snowball.add(new THREE.Vector3(x, y, z));

````

much more to do. keep in touch with any suggestions/comments. <3 dane
