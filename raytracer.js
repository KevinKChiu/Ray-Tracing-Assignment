/* Ray class:
 * o: origin (THREE.Vector3)
 * d: normalized direction (THREE.Vector3)
 */
class Ray {
	constructor(origin, direction) {
		this.o = origin.clone();
		this.d = direction.clone();
		this.d.normalize();
	}
	pointAt(t) {
		// P(t) = o + t*d
		let point = this.o.clone();
		point.addScaledVector(this.d, t);
		return point;
	}
	direction() { return this.d; }
	origin() { return this.o; }
}

function render() {
	// create canvas of size imageWidth x imageHeight and add to DOM
	let canvas = document.createElement('canvas');
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	canvas.style = 'background-color:red';
	document.body.appendChild(canvas);
	let ctx2d = canvas.getContext('2d'); // get 2d context
	let image = ctx2d.getImageData(0, 0, imageWidth, imageHeight); // get image data
	let pixels = image.data; // get pixel array

	let row=0;
	let idx=0;
	let chunksize=10; // render 10 rows at a time
	console.log('Raytracing started...');
	(function chunk() {
		// render a chunk of rows
		for(let j=row;j<row+chunksize && j<imageHeight;j++) {
			for(let i=0;i<imageWidth;i++,idx+=4) { // i loop
				// compute normalized pixel coordinate (x,y)
				let x = i/imageWidth;
				let y = (imageHeight-1-j)/imageHeight;
				let ray = camera.getCameraRay(x,y);
				let color = raytracing(ray, 0);
				setPixelColor(pixels, idx, color);
			}
		}
		row+=chunksize;  // non-blocking j loop
		if(row<imageHeight) {
			setTimeout(chunk, 0);
			ctx2d.putImageData(image, 0, 0); // display intermediate image
		} else {
			ctx2d.putImageData(image, 0, 0); // display final image
			console.log('Done.')
		}
	})();
}

/* Trace ray in the scene and return color of ray. 'depth' is the current recursion depth.
 * If intersection material has non-null kr or kt, perform recursive ray tracing. */
function raytracing(ray, depth) {
	let color = new THREE.Color(0,0,0);
// ===YOUR CODE STARTS HERE===
	let isect = rayIntersectScene(ray);

	if (isect !== null) {
		if ((isect.material.kr !== null || isect.material.kt !== null) && depth < maxDepth) {
			if (isect.material.kr) {
				let kr = isect.material.kr.clone();
				let temp1 = ray.d.clone();
				temp1.negate();
				let refl_ray = new Ray(isect.position, reflect(temp1, isect.normal));
				kr.multiply(raytracing(refl_ray, depth + 1));
				color.add(kr);
			} 
			if (isect.material.kt) {
				let kt = isect.material.kt.clone();
				let temp2 = ray.d.clone();
				let refr_ray = new Ray(isect.position, refract(temp2, isect.normal, isect.material.ior));
				kt.multiply(raytracing(refr_ray, depth + 1));
				color.add(kt);
			}
		} else {
			let ambient = ambientLight.clone();
			if (isect.material.ka) {
				ambient.multiply(isect.material.ka);
				color.add(ambient);
			}
			color.add(shading(ray, isect));
		}
	} else {
		return backgroundColor;
	}

// ---YOUR CODE ENDS HERE---
	return color;
}

/* Compute and return shading color given a ray and the intersection point structure. */
function shading(ray, isect) {
	let color = new THREE.Color(0,0,0);
// ===YOUR CODE STARTS HERE===

	for (let i = 0; i < lights.length; i++) {
		let ls = lights[i].getLight(isect.position);
		if (ls === null) {
			continue;
		}
		let shadowRay = new Ray(isect.position, ls.direction);
		let temp = ls.position.clone();
		let distToLight = (temp.sub(isect.position)).length();
		let shadow_isect = rayIntersectScene(shadowRay);

		if (shadow_isect && shadow_isect.t < distToLight) {
			continue;
		} 

		let l = ls.direction;
		let n = isect.normal;
		let v = ray.d.clone();
		v.negate();
		let r = reflect(l, n);
		let material = isect.material;

		let diffuse = ls.intensity.clone();
		if (material.kd) {
			diffuse.multiply(material.kd).multiplyScalar(Math.max(n.dot(l), 0));
			color.add(diffuse);
		}

		let specular = ls.intensity.clone();
		if (material.ks) {
			specular.multiply(material.ks).multiplyScalar(Math.pow(Math.max(r.dot(v), 0), material.p));
			color.add(specular);
		}

	}

// ---YOUR CODE ENDS HERE---
	return color;
}

/* Compute intersection of ray with scene shapes.
 * Return intersection structure (null if no intersection). */
function rayIntersectScene(ray) {
	let tmax = Number.MAX_VALUE;
	let isect = null;
	for(let i=0;i<shapes.length;i++) {
		let hit = shapes[i].intersect(ray, 0.0001, tmax);
		if(hit != null) {
			tmax = hit.t;
			if(isect == null) isect = hit; // if this is the first time intersection is found
			else isect.set(hit); // update intersection point
		}
	}
	return isect;
}

/* Compute reflected vector, by mirroring l around n. */
function reflect(l, n) {
	// r = 2(n.l)*n-l
	let r = n.clone();
	r.multiplyScalar(2*n.dot(l));
	r.sub(l);
	return r;
}

/* Compute refracted vector, given l, n and index_of_refraction. */
function refract(l, n, ior) {
	let mu = (n.dot(l) < 0) ? 1/ior:ior;
	let cosI = l.dot(n);
	let sinI2 = 1 - cosI*cosI;
	if(mu*mu*sinI2>1) return null;
	let sinR = mu*Math.sqrt(sinI2);
	let cosR = Math.sqrt(1-sinR*sinR);
	let r = n.clone();
	if(cosI > 0) {
		r.multiplyScalar(-mu*cosI+cosR);
		r.addScaledVector(l, mu);
	} else {
		r.multiplyScalar(-mu*cosI-cosR);
		r.addScaledVector(l, mu);
	}
	r.normalize();
	return r;
}

/* Convert floating-point color to integer color and assign it to the pixel array. */
function setPixelColor(pixels, index, color) {
	pixels[index+0]=pixelProcess(color.r);
	pixels[index+1]=pixelProcess(color.g);
	pixels[index+2]=pixelProcess(color.b);
	pixels[index+3]=255; // alpha channel is always 255*/
}

/* Multiply exposure, clamp pixel value, then apply gamma correction. */
function pixelProcess(value) {
	value*=exposure; // apply exposure
	value=(value>1)?1:value;
	value = Math.pow(value, 1/2.2);	// 2.2 gamma correction
	return value*255;
}
