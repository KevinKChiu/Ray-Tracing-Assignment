/* Intersection structure:
 * t:        ray parameter (float), i.e. distance of intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
	}
}

/* Plane shape
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if(denom==0) { return null;	}
		let t = temp.dot(this.n)/denom; // (P0-O).n / d.n
		if(t<tmin || t>tmax) return null; // check range
		let isect = new Intersection();   // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r*r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
// ===YOUR CODE STARTS HERE===
		let a = 1;
		let temp = ray.o.clone();
		temp.sub(this.C);
		let vec_OC = temp.clone();
		let b = temp.multiplyScalar(2).dot(ray.d);
		let c = vec_OC.lengthSq() - this.r2;
		let discriminant = (b * b) - (4 * a * c);

		if (discriminant < 0) {
			return null;
		} else {
			let t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
			let t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
			let t = 0;
			if (t1 >= tmin && t1 <= tmax && t2 >= tmin && t2 <= tmax) {
				t = Math.min(t1, t2);
			} else if (t1 >= tmin && t1 <= tmax) {
				t = t1; 
			} else if (t2 >= tmin && t2 <= tmax) {
				t = t2;
			} else {
				return null;
			}
			let isect = new Intersection();
			isect.t = t;
			isect.position = ray.pointAt(t);
			let p = isect.position.clone();
			isect.normal = p.sub(this.C).normalize();
			isect.material = this.material;
			return isect;
		}

// ---YOUR CODE ENDS HERE---
		return null;
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if(n0) this.n0 = n0.clone();
		if(n1) this.n1 = n1.clone();
		if(n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
// ===YOUR CODE STARTS HERE===
		let p1_p0 = this.P1.clone();
		p1_p0.sub(this.P0);
		let p2_p0 = this.P2.clone();
		p2_p0.sub(this.P0);
		this.normal = p1_p0.cross(p2_p0).normalize();

// ---YOUR CODE ENDS HERE---
	} 

	intersect(ray, tmin, tmax) {
// ===YOUR CODE STARTS HERE===
		let alpha = 0;
		let beta = 0;
		let gamma = 0;
		let t = 0;

		let p2_p0 = this.P2.clone();
		p2_p0.sub(this.P0);

		let p2_p1 = this.P2.clone();
		p2_p1.sub(this.P1);

		let p2_o = this.P2.clone();
		p2_o.sub(ray.o)

		let d = ray.d.clone();

		let determinant = function(matrix) {
			let a = matrix[0][0];
			let b = matrix[0][1];
			let c = matrix[0][2];
			let d = matrix[1][0];
			let e = matrix[1][1];
			let f = matrix[1][2];
			let g = matrix[2][0];
			let h = matrix[2][1];
			let i = matrix[2][2];
			return ((a * e * i) + (b * f * g) + (c * d *h)) - ((g * e * c) + (h * f * a) + (i * d * b));
		}

		let matrix_denom = 
			[[d.x, p2_p0.x, p2_p1.x], 
			[d.y, p2_p0.y, p2_p1.y],
			[d.z, p2_p0.z, p2_p1.z]];

		let matrix_t = 
			[[p2_o.x, p2_p0.x, p2_p1.x], 
			[p2_o.y, p2_p0.y, p2_p1.y],
			[p2_o.z, p2_p0.z, p2_p1.z]];
		
		let matrix_alpha = 
			[[d.x, p2_o.x, p2_p1.x], 
			[d.y, p2_o.y, p2_p1.y],
			[d.z, p2_o.z, p2_p1.z]];

		let matrix_beta = 
			[[d.x, p2_p0.x, p2_o.x], 
			[d.y, p2_p0.y, p2_o.y],
			[d.z, p2_p0.z, p2_o.z]];

		t = determinant(matrix_t) / determinant(matrix_denom);
		alpha = determinant(matrix_alpha) / determinant(matrix_denom);
		beta = determinant(matrix_beta) / determinant(matrix_denom);

		if (alpha >= 0 && beta >= 0 && t >= 0 && (alpha + beta) <= 1) {
			gamma = 1 - alpha - beta;
			if (t < tmin || t > tmax) {
				return null;
			} else {
				let isect = new Intersection();
				isect.t = t;
				isect.position = ray.pointAt(t);
				if (this.n0 && this.n1 && this.n2) { 
					let n0_temp = this.n0.clone();
					let n1_temp = this.n1.clone();
					let n2_temp = this.n2.clone();
					isect.normal = n0_temp.multiplyScalar(alpha).add(n1_temp.multiplyScalar(beta)).add(n2_temp.multiplyScalar(gamma)).normalize();
				} else {
					isect.normal = this.normal;
				}
				isect.material = this.material;
				return isect;
			}
		} 

// ---YOUR CODE ENDS HERE---
		return null;
	}
}

function shapeLoadOBJ(objstring, material, smoothnormal) {
	loadOBJFromString(objstring, function(mesh) { // callback function for non-blocking load
		if(smoothnormal) mesh.computeVertexNormals();
		for(let i=0;i<mesh.faces.length;i++) {
			let p0 = mesh.vertices[mesh.faces[i].a];
			let p1 = mesh.vertices[mesh.faces[i].b];
			let p2 = mesh.vertices[mesh.faces[i].c];
			if(smoothnormal) {
				let n0 = mesh.faces[i].vertexNormals[0];
				let n1 = mesh.faces[i].vertexNormals[1];
				let n2 = mesh.faces[i].vertexNormals[2];
				shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
			} else {
				shapes.push(new Triangle(p0, p1, p2, material));
			}
		}
	}, function() {}, function() {});
}

/* ========================================
 * You can define additional Shape classes,
 * as long as each implements intersect function.
 * ======================================== */
