# snowball
A simple to use isosurfacing plugin for Three.js. It calculates the annoying stuff for you and takes care of updating geometry. 

Examples [
[interactive](https://www.google.com)
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
  ), {
    radius:2,
    isolevel:0.2,
    material: new THREE.MeshBasicMaterial({wireframe: true})
  }
}

var snowball = new Snowball(vectors);
````
... then access its mesh and add it to your scene.
````javascript
scene.add(snowball.mesh);

````


## adding vectors  
Snowball calculates and updates the size of its voxel field as necessary based on the vectors it's been passed. Add a single vector or an array of vectors like this:
````javascript
snowball.add(new THREE.Vector3(0, 0, 0));
snowball.add([
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(1, 0, 0),
  
]);
  
  
