# snowball
A simple to use isosurfacing plugin for Three.js.

Examples [
[interactive](https://www.google.com)
]
## the skinny

Initialize a new Snowball object with a single THREE.Vector3, or an array of them... 

```javascript
var vectors = []
for (var i = 0; i < 10; i++){
  vectors[i] = new THREE.Vector3(
    Math.random()*10,
    Math.random()*10,
    Math.random()*10
  )
}

var snowball = new Snowball(vectors);
````
... then access its mesh and add it to your scene.
````javascript
scene.add(snowball.mesh);

````
## the rounder 
Snowball calculates and updates the size of its voxel field as necessary based on the vectors it's been passed. 

  
  
