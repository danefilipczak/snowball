//dane filipczak 2017


function Snowball (vectorArray, parameters) {

	/*
	parameters = {

		resolution: spatial sampling bit rate - higher values mesh smoother but run slower
		, 
		radius: the size of each vector's affective sphere
		,
		isolevel: the ~ emanation ~ of each vector in addition to its radius 
			(the intensity of its oozing into others) - a value between 0 and 10
		, 

	}
	*/

	if(vectorArray instanceof Array)this.vecs = vectorArray;
	if(vectorArray instanceof THREE.Vector3)this.vecs = [vectorArray];

	this.init(parameters);

	this.voxels = [];
	this.setup(); 
	var radiusSQ = this.radius*this.radius;
	this.setValues(this.vecs, this.voxels, radiusSQ); 

	
	var geometry = this.march();

	this.mesh = new THREE.Mesh( geometry, this.material );

	//return this.mesh;
}


Snowball.prototype.add = function(vec){
	this.vecs.push(vec);
	var outliers = this.contains(vec);
	if(!outliers){
		this.setValue(vec, this.voxels);
	} else {
		var oldBounds = this.bounds;
		for(var i = 0; i<outliers.length; i++){
			this.resizeBounds([outliers[i]]);
			this.resizeVoxelArray([outliers[i]], oldBounds);
		}
		
		this.setValue(vec, this.voxels);
		

	}
	this.boundingBoxCenter = this.getBoundingBoxCenter();
	var geometry = this.march();
	this.mesh.geometry = geometry;

}


Snowball.prototype.resizeBounds = function(outliers){
	for(var i = 0; i< outliers.length; i ++){
		var difference = this.bounds[outliers[i][0]] - outliers[i][1];
		var newVoxelNum = Math.floor(difference/this.w);
		this.bounds[outliers[i][0]]-=newVoxelNum*this.w;
	}
	this.bounds.xrange = this.bounds.xmax - this.bounds.xmin;
	this.bounds.yrange = this.bounds.ymax - this.bounds.ymin;
	this.bounds.zrange = this.bounds.zmax - this.bounds.zmin;
}

Snowball.prototype.reindexVoxels = function(){
	var bounds = this.bounds;
	for(var x = 0; x<(bounds.xrange)/this.w; x++){
		for(var y = 0; y < (bounds.yrange)/this.w; y++){
			for(var z = 0; z < (bounds.zrange)/this.w; z++){
				this.voxels[x][y][z].index = {x:x, y:y, z:z};
				this.voxels[x][y][z].pos.x = bounds.xmin + (this.w*x);
				this.voxels[x][y][z].pos.y = bounds.ymin + (this.w*y);
				this.voxels[x][y][z].pos.z = bounds.zmin + (this.w*z);
			};
		};
	};
};


Snowball.prototype.resizeVoxelArray = function(outliers, oldBounds, newBounds){
	//woah resizing a three-dimensional array is hard 
	
	var bounds = this.bounds;
	var oldBounds = oldBounds;
	var newBounds = this.bounds;
	var oldVoxels = this.voxels;

	for(var i = 0; i<outliers.length;i++){
		switch(outliers[i][0]){
			case 'xmax':
				for(var x = this.voxels.length; x<bounds.xrange/this.w; x++){
					this.voxels[x] = [];
					for(var y = 0; y < (oldBounds.yrange)/this.w; y++){
						this.voxels[x][y]=[];
						for(var z = 0; z < (oldBounds.zrange)/this.w; z++){

							this.voxels[x][y][z] = {
								index: {x:x, y:y, z:z},
								value: 0,
								pos: new THREE.Vector3(
									oldBounds.xmin + (this.w*x),
									oldBounds.ymin + (this.w*y),
									oldBounds.zmin + (this.w*z)
								)
							};
						};
					};
				};
				break;
			case 'xmin':
				var px = (newBounds.xrange/this.w - oldVoxels.length);
				for(var x = px; x>=0; x--){
					this.voxels.splice(0, 0, []);
					for(var y = 0; y < (bounds.yrange)/this.w; y++){
						this.voxels[0][y]=[];
						for(var z = 0; z < (bounds.zrange)/this.w; z++){
							this.voxels[0][y][z] = {
								index: {x:x, y:y, z:z},
								value: 0,
								pos: new THREE.Vector3(
									newBounds.xmin + (this.w*x),
									oldBounds.ymin + (this.w*y),
									oldBounds.zmin + (this.w*z)
								)
							};
						};
					};
				};
				break;
			case 'ymax':
				var py = this.voxels[0].length;
				for(var x = 0; x<(bounds.xrange)/this.w; x++){
					for(var y = py; y < (newBounds.yrange)/this.w; y++){
						this.voxels[x][y]=[];
						for(var z = 0; z < (newBounds.zrange)/this.w; z++){
							this.voxels[x][y][z] = {
								index: {x:x, y:y, z:z},
								value: 0,
								pos: new THREE.Vector3(
									oldBounds.xmin + (this.w*x),
									oldBounds.ymin + (this.w*y),
									oldBounds.zmin + (this.w*z)
								)
							};
						};
					};
				};
				break;
			case 'ymin':
				var py = (bounds.yrange/this.w - this.voxels[0].length);
				for(var x = 0; x<bounds.xrange/this.w; x++){
					for(var y = py; y >= 0; y--){
						this.voxels[x].splice(0, 0, []);
						for(var z = 0; z < (bounds.zrange)/this.w; z++){
							this.voxels[x][0][z] = {
								index: {x:x, y:y, z:z},
								value: 0,
								pos: new THREE.Vector3(
									bounds.xmin + (this.w*x),
									bounds.ymin + (this.w*y),
									bounds.zmin + (this.w*z)
								)
							};
						};
					};
				};
				break;
			case 'zmax':
				var pz = this.voxels[0][0].length;
				for(var x = 0; x<(oldBounds.xrange)/this.w; x++){
					for(var y = 0; y < (bounds.yrange)/this.w; y++){
						for(var z = pz; z < (bounds.zrange)/this.w; z++){
							this.voxels[x][y][z] = {
								index: {x:x, y:y, z:z},
								value: 0,
								pos: new THREE.Vector3(
									bounds.xmin + (this.w*x),
									bounds.ymin + (this.w*y),
									bounds.zmin + (this.w*z)
								)
							};
						};
					};
				};
				break;
			case 'zmin':
				var pz = (bounds.zrange/this.w - this.voxels[0][0].length);
				for(var x = 0; x<bounds.xrange/this.w; x++){
					for(var y = 0; y < bounds.yrange/this.w; y++){
						for(var z = pz; z >= 0; z--){
							this.voxels[x][y].splice(0, 0, {
								index: {x:x, y:y, z:z},
								value: 0,
								pos: new THREE.Vector3(
									bounds.xmin + (this.w*x),
									bounds.ymin + (this.w*y),
									bounds.zmin + (this.w*z)
								)
							});
						};
					};
				};
				break;
		}
	}
	this.reindexVoxels();
}

Snowball.prototype.contains = function(vec){ //check if a vector is within current vecLimits. if not, return an array describing which points are outsiders
	var outliers = [];
	var d = this.radius*2;
	if(vec.x>this.vectorLimits.xmax){
		this.vectorLimits.xmax = vec.x;
		outliers.push(['xmax', vec.x+d])
	};
	if(vec.x<this.vectorLimits.xmin){
		this.vectorLimits.xmin = vec.x;
		outliers.push(['xmin', vec.x-d])
	};
	if(vec.y>this.vectorLimits.ymax){
		this.vectorLimits.ymax = vec.y;
		outliers.push(['ymax', vec.y+d])
	};
	if(vec.y<this.vectorLimits.ymin){
		this.vectorLimits.ymin = vec.y;
		outliers.push(['ymin', vec.y-d])
	};
	if(vec.z>this.vectorLimits.zmax){
		this.vectorLimits.zmax = vec.z;
		outliers.push(['zmax', vec.z+d])
	};
	if(vec.z<this.vectorLimits.zmin){
		this.vectorLimits.zmin = vec.z;
		outliers.push(['zmin', vec.z-d])
	};


	if(outliers.length==0){outliers = null};
	return outliers;
}

 

Snowball.prototype.init = function(parameters){
	this.radius = parameters.radius || function(){
		console.log('try supplying a radius parameter if this doesn\'t look right');
		return 1;
	}();
	this.radiusSQ = this.radius*this.radius;

	this.isolevel = parameters.isolevel || function(){
		console.log('try supplying an isolevel parameter if this doesn\'t look right');
		return 0.1;
	}();

	this.bounds = this.getBounds(this.vecs);
	this.boundingBoxCenter = this.getBoundingBoxCenter();

	this.resolution = parameters.resolution || function(bounds){
		console.log('try supplying a resolution parameter if this doesn\'t look right');
		return null;
	}();
	if(!this.resolution){this.resolution = 30};
	this.w = this.bounds.maxRange/this.resolution;

	this.material = parameters.material;
	this.debugBounds = parameters.debugBounds;
	
}


// Snowball.prototype.getVoxelAtWorldCoord = function(vec){
// 	var voxels = this.voxels;
// 	for(var i=0; i<voxels.length-1; i++){
// 		for(var j=0; j<voxels[i].length-1; j++){
// 			for(var k=0; k<voxels[i][j].length-1; k++){
// 				if(vec.x >= voxels[i][j][k].pos.x && 
// 				   vec.y >= voxels[i][j][k].pos.y && 
// 				   vec.z >= voxels[i][j][k].pos.z &&
// 				   vec.x <= voxels[i+1][j+1][k+1].pos.x &&
// 				   vec.y <= voxels[i+1][j+1][k+1].pos.y &&
// 				   vec.z <= voxels[i+1][j+1][k+1].pos.z){
// 					return voxels[i][j][k];
// 				}
// 			}
// 		}
// 	}
// }

Snowball.prototype.befriend=function(voxel, voxels){

	var friends = new Array(8);

	for(var i = 0; i<8; i++){
		friends[i] = voxels
		[voxel.index.x+top8[i].x]
		[voxel.index.y+top8[i].y]
		[voxel.index.z+top8[i].z];
	};

	return friends;

}

Snowball.prototype.setValues = function(vectors, voxels){
	var radiusSQ = this.radius*this.radius;
	for(var v = 0;v<vectors.length;v++){
		var vec = vectors[v];
		for(var x = 0; x < voxels.length; x++){
			for(var y = 0; y < voxels[0].length; y++){
				for(var z = 0; z < voxels[0][0].length; z++){
					var distSQ = voxels[x][y][z].pos.distanceToSquared(vec);
					if(distSQ < radiusSQ){
						voxels[x][y][z].value+= (1-distSQ / radiusSQ);
					}
				}
			}
		}
	}
}

Snowball.prototype.clearValues = function(voxels){
	for(var x = 0; x < voxels.length; x++){
		for(var y = 0; y < voxels[0].length; y++){
			for(var z = 0; z < voxels[0][0].length; z++){
				voxels[x][y][z].value=0;
			}
		}
	}
}

Snowball.prototype.setValue = function(vec, voxels){
	radiusSQ = this.radius*this.radius;
	for(var x = 0; x < voxels.length; x++){
		for(var y = 0; y < voxels[0].length; y++){
			for(var z = 0; z < voxels[0][0].length; z++){
				var distSQ = voxels[x][y][z].pos.distanceToSquared(vec);
				if(distSQ < radiusSQ){
					voxels[x][y][z].value+= (1-distSQ / radiusSQ);
				}
			}
		}
	}
}

Snowball.prototype.setup = function(){
	
	
	var r = this.radius;
	var d = this.radius*2;
	var d2 = d*d;
	var bounds = this.bounds;

	for(var x = 0; x<(bounds.xrange)/this.w; x++){
		this.voxels[x] = [];
		for(var y = 0; y < (bounds.yrange)/this.w; y++){
			this.voxels[x][y]=[];
			for(var z = 0; z < (bounds.zrange)/this.w; z++){
				this.voxels[x][y][z] = {
					index: {x:x, y:y, z:z},
					value: 0,
					pos: new THREE.Vector3(
						bounds.xmin + (this.w*x),
						bounds.ymin + (this.w*y),
						bounds.zmin + (this.w*z)
					)
				};
			};
		};
	};
};

Snowball.prototype.march = function(){
	geometry = new THREE.Geometry();
	
	var vertexIndex = 0;
	
	for(var x = 0; x<this.voxels.length-1; x++){
		for(var y = 0; y < this.voxels[0].length-1; y++){
			for(var z = 0; z < this.voxels[0][0].length-1; z++){
				var v = this.voxels[x][y][z];
				var friends = this.befriend(v, this.voxels);
				
				var cubeindex = 0;
				var cubeIndexes = [1, 2, 8, 4, 16, 32, 128, 64];
				for(var i = 0; i < friends.length; i++){
					if(friends[i].value<this.isolevel){
						cubeindex |= cubeIndexes[i];
					};
				};
		
				var bits = edgeTable[ cubeindex ]; 
				if ( bits === 0 ) {
					continue;
				}
				
				var vlist = [];

				var mu = 0.5; 
				for(var i = 0; i<12; i++){
					if(bits & Math.pow(2, i)){
						mu = (this.isolevel - friends[data[i].a].value) /
						( friends[data[i].b].value - friends[data[i].c].value);
						vlist[i]=(friends[data[i].d].pos.clone()
						.lerp(friends[data[i].e].pos, mu));
					};
				};
				
				var i = 0;
				cubeindex*=16;

				while ( triTable[ cubeindex + i ] != -1 ) 
				{	
					var index1 = triTable[cubeindex + i];
					var index2 = triTable[cubeindex + i + 1];
					var index3 = triTable[cubeindex + i + 2];

					geometry.vertices.push( vlist[index1].clone() );
					geometry.vertices.push( vlist[index2].clone() );
					geometry.vertices.push( vlist[index3].clone() );
					var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);
					geometry.faces.push( face );
					geometry.faceVertexUvs[ 0 ].push([ 
						new THREE.Vector2(0,0), 
						new THREE.Vector2(0,1), 
						new THREE.Vector2(1,1) 
					]);
					vertexIndex += 3;
					i += 3;
				};
			};
		};
	};
	
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	return geometry;

};


Snowball.prototype.getBounds = function(vectorArray){
	var arr = vectorArray;
	var lead = arr[0];
	var d = this.radius*2;
	var r = this.radius;

	var borders = {
		xmin: lead.x,
		xmax: lead.x,
		ymin: lead.y,
		ymax: lead.y,
		zmin: lead.z,
		zmax: lead.z,
	}

	for(var i = 1;i<arr.length;i++){
		var vec = arr[i];
		borders.xmin = Math.min(borders.xmin, vec.x);
		borders.xmax = Math.max(borders.xmax, vec.x);
		borders.ymin = Math.min(borders.ymin, vec.y);
		borders.ymax = Math.max(borders.ymax, vec.y);
		borders.zmin = Math.min(borders.zmin, vec.z);
		borders.zmax = Math.max(borders.zmax, vec.z);
	}

	var xrange = borders.xmax - borders.xmin;
	var yrange = borders.ymax - borders.ymin;
	var zrange = borders.zmax - borders.zmin;

	var minLimit = Math.min(borders.xmin, borders.ymin, borders.zmin);
	var maxLimit = Math.max(borders.xmax, borders.ymax, borders.zmax);
	var maxRange = maxLimit-minLimit;

	this.vectorLimits = {

		xmin: borders.xmin,
		xmax: borders.xmax,
		ymin: borders.ymin,
		ymax: borders.ymax,
		zmin: borders.zmin,
		zmax: borders.zmax,
		xrange: xrange,
		yrange: yrange,
		zrange: zrange,
		minLimit: minLimit,
		maxLimit: maxLimit,
		maxRange: maxRange

	};

	return {
		xmin: borders.xmin-d,
		xmax: borders.xmax+d,
		ymin: borders.ymin-d,
		ymax: borders.ymax+d,
		zmin: borders.zmin-d,
		zmax: borders.zmax+d,
		xrange: xrange+(d*2),
		yrange: yrange+(d*2),
		zrange: zrange+(d*2),
		minLimit: minLimit-d,
		maxLimit: maxLimit+d,
		maxRange: maxRange+(d*2)

	};
}

Snowball.prototype.getBoundingBoxCenter = function(){

	return new THREE.Vector3(
		this.bounds.xmax-(this.bounds.xrange/2),
		this.bounds.ymax-(this.bounds.yrange/2),
		this.bounds.zmax-(this.bounds.zrange/2)
		);

}

/////////////nothing but ugly data from here on out!

//ok, it's kind of pretty 


var cubeIndexes = new Int32Array([1, 2, 8, 4, 16, 32, 128, 64]);


var top8 = [ //relative locations of adjacent voxels
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 0, y: 0, z: 1},
	{x: 1, y: 0, z: 1},
	{x: 0, y: 1, z: 1},
	{x: 1, y: 1, z: 1}
];


var data = [ 
	{a: 0, b: 1, c: 0, d: 0, e: 1},
	{a: 1, b: 3, c: 1, d: 1, e: 3},
	{a: 2, b: 3, c: 2, d: 2, e: 3},
	{a: 0, b: 2, c: 0, d: 0, e: 2},
	{a: 4, b: 5, c: 4, d: 4, e: 5},
	{a: 5, b: 7, c: 5, d: 5, e: 7},
	{a: 6, b: 7, c: 6, d: 6, e: 7},
	{a: 4, b: 6, c: 4, d: 4, e: 6},
	{a: 0, b: 4, c: 0, d: 0, e: 4},
	{a: 1, b: 5, c: 1, d: 1, e: 5},
	{a: 3, b: 7, c: 3, d: 3, e: 7},
	{a: 2, b: 6, c: 2, d: 2, e: 6}
];

var edgeTable = new Int32Array([
0x0  , 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
0x190, 0x99 , 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
0x230, 0x339, 0x33 , 0x13a, 0x636, 0x73f, 0x435, 0x53c,
0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
0x3a0, 0x2a9, 0x1a3, 0xaa , 0x7a6, 0x6af, 0x5a5, 0x4ac,
0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
0x460, 0x569, 0x663, 0x76a, 0x66 , 0x16f, 0x265, 0x36c,
0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff , 0x3f5, 0x2fc,
0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55 , 0x15c,
0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc ,
0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
0xcc , 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
0x15c, 0x55 , 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
0x2fc, 0x3f5, 0xff , 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
0x36c, 0x265, 0x16f, 0x66 , 0x76a, 0x663, 0x569, 0x460,
0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa , 0x1a3, 0x2a9, 0x3a0,
0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33 , 0x339, 0x230,
0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99 , 0x190,
0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0]);

var triTable = new Int32Array([
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1,
3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1,
3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1,
3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1,
9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1,
9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1,
8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1,
9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1,
3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1,
1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1,
4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1,
4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1,
9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1,
2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1,
9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1,
0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1,
2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1,
10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1,
4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1,
5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1,
5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1,
9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1,
0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1,
1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1,
10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1,
8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1,
2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1,
7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1,
9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1,
2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1,
11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1,
9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1,
5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1,
11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1,
11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1,
9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1,
5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1,
2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1,
5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1,
6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1,
0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1,
3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1,
6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1,
5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1,
1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1,
10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1,
6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1,
1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1,
8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1,
7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1,
3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1,
5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1,
0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1,
9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1,
8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1,
5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1,
0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1,
6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1,
10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1,
10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1,
8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1,
1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1,
3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1,
0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1,
10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1,
0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1,
3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1,
6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1,
9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1,
8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1,
3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1,
6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1,
0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1,
10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1,
10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1,
1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1,
2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1,
7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1,
7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1,
2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1,
1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1,
11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1,
8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1,
0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1,
7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1,
6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1,
7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1,
2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1,
1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1,
10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1,
10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1,
0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1,
7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1,
6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1,
8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1,
9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1,
6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1,
4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1,
10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1,
8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1,
0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1,
1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1,
8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1,
10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1,
4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1,
10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1,
5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1,
9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1,
6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1,
7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1,
3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1,
7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1,
9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1,
3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1,
6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1,
9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1,
1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1,
4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1,
7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1,
6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1,
3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1,
0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1,
6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1,
0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1,
11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1,
6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1,
5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1,
9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1,
1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1,
1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1,
10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1,
0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1,
5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1,
10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1,
11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1,
9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1,
7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1,
2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1,
8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1,
9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1,
9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1,
1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1,
9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1,
9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1,
5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1,
0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1,
10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1,
2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1,
0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1,
0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1,
9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1,
5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1,
3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1,
5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1,
8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1,
0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1,
9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1,
0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1,
1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1,
3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1,
4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1,
9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1,
11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1,
11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1,
2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1,
9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1,
3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1,
1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1,
4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1,
4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1,
0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1,
3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1,
3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1,
0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1,
9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1,
1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);