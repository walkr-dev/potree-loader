(function(O,s){typeof exports=="object"&&typeof module!="undefined"?s(exports,require("three")):typeof define=="function"&&define.amd?define(["exports","three"],s):(O=typeof globalThis!="undefined"?globalThis:O||self,s(O["potree-loader"]={},O.THREE))})(this,function(O,s){"use strict";class at{constructor(t,i){this.loader=t,this.boundingBox=i,this.url=null,this.pointAttributes=null,this.spacing=0,this.numNodesLoading=0,this.maxNumNodesLoading=3,this.disposed=!1,this.tightBoundingBox=this.boundingBox.clone(),this.boundingSphere=this.boundingBox.getBoundingSphere(new s.Sphere),this.tightBoundingSphere=this.boundingBox.getBoundingSphere(new s.Sphere)}dispose(){this.root.traverse(t=>t.dispose()),this.disposed=!0}}const dt=0,ct=0,ut=1,It=50,St=50,Dt=2,Bt=15,Ot=1e6,ft=2,Ct=4,ht="PerspectiveCamera",Pt=new s.Color(0,0,0),Rt=new s.Vector4(1,0,0,1);var L=(e=>(e[e.DISABLED=0]="DISABLED",e[e.CLIP_OUTSIDE=1]="CLIP_OUTSIDE",e[e.HIGHLIGHT_INSIDE=2]="HIGHLIGHT_INSIDE",e))(L||{}),U=(e=>(e[e.FIXED=0]="FIXED",e[e.ATTENUATED=1]="ATTENUATED",e[e.ADAPTIVE=2]="ADAPTIVE",e))(U||{}),V=(e=>(e[e.SQUARE=0]="SQUARE",e[e.CIRCLE=1]="CIRCLE",e[e.PARABOLOID=2]="PARABOLOID",e))(V||{}),k=(e=>(e[e.OCTREE=0]="OCTREE",e[e.KDTREE=1]="KDTREE",e))(k||{}),$=(e=>(e[e.FIXED=0]="FIXED",e[e.ATTENUATED=1]="ATTENUATED",e))($||{}),T=(e=>(e[e.RGB=0]="RGB",e[e.COLOR=1]="COLOR",e[e.DEPTH=2]="DEPTH",e[e.HEIGHT=3]="HEIGHT",e[e.ELEVATION=3]="ELEVATION",e[e.INTENSITY=4]="INTENSITY",e[e.INTENSITY_GRADIENT=5]="INTENSITY_GRADIENT",e[e.LOD=6]="LOD",e[e.LEVEL_OF_DETAIL=6]="LEVEL_OF_DETAIL",e[e.POINT_INDEX=7]="POINT_INDEX",e[e.CLASSIFICATION=8]="CLASSIFICATION",e[e.RETURN_NUMBER=9]="RETURN_NUMBER",e[e.SOURCE=10]="SOURCE",e[e.NORMAL=11]="NORMAL",e[e.PHONG=12]="PHONG",e[e.RGB_HEIGHT=13]="RGB_HEIGHT",e[e.COMPOSITE=50]="COMPOSITE",e))(T||{}),Lt=`#version 300 es

precision highp float;
precision highp int;

#define max_clip_boxes 30

in vec3 position;
in vec3 normal;
in float intensity;
in float classification;
in float returnNumber;
in float numberOfReturns;
in float pointSourceID;
in vec4 indices;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;

uniform float pcIndex;

uniform float screenWidth;
uniform float screenHeight;
uniform float fov;
uniform float spacing;

#if defined use_clip_box
	uniform mat4 clipBoxes[max_clip_boxes];
#endif

uniform float heightMin;
uniform float heightMax;
uniform float size; 
uniform float minSize; 
uniform float maxSize; 
uniform float octreeSize;
uniform vec3 bbSize;
uniform vec3 uColor;
uniform float opacity;
uniform float clipBoxCount;
uniform float level;
uniform float vnStart;
uniform bool isLeafNode;

uniform float filterByNormalThreshold;
uniform vec2 intensityRange;
uniform float opacityAttenuation;
uniform float intensityGamma;
uniform float intensityContrast;
uniform float intensityBrightness;
uniform float rgbGamma;
uniform float rgbContrast;
uniform float rgbBrightness;
uniform float transition;
uniform float wRGB;
uniform float wIntensity;
uniform float wElevation;
uniform float wClassification;
uniform float wReturnNumber;
uniform float wSourceID;

uniform sampler2D visibleNodes;
uniform sampler2D gradient;
uniform sampler2D classificationLUT;
uniform sampler2D depthMap;

#ifdef highlight_point
	uniform vec3 highlightedPointCoordinate;
	uniform bool enablePointHighlighting;
	uniform float highlightedPointScale;
#endif

#ifdef new_format
	in vec4 rgba;
	out vec4 vColor;
#else
	in vec3 color;
	out vec3 vColor;
#endif

#if !defined(color_type_point_index)
	out float vOpacity;
#endif

#if defined(weighted_splats)
	out float vLinearDepth;
#endif

#if !defined(paraboloid_point_shape) && defined(use_edl)
	out float vLogDepth;
#endif

#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0) || defined(paraboloid_point_shape)
	out vec3 vViewPosition;
#endif

#if defined(weighted_splats) || defined(paraboloid_point_shape)
	out float vRadius;
#endif

#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0)
	out vec3 vNormal;
#endif

#ifdef highlight_point
	out float vHighlight;
#endif
 

#if (defined(adaptive_point_size) || defined(color_type_lod)) && defined(tree_type_octree)

/**
 * Rounds the specified number to the closest integer.
 */
float round(float number){
	return floor(number + 0.5);
}

/**
 * Gets the number of 1-bits up to inclusive index position.
 * 
 * number is treated as if it were an integer in the range 0-255
 */
int numberOfOnes(int number, int index) {
	int numOnes = 0;
	int tmp = 128;
	for (int i = 7; i >= 0; i--) {

		if (number >= tmp) {
			number = number - tmp;

			if (i <= index) {
				numOnes++;
			}
		}

		tmp = tmp / 2;
	}

	return numOnes;
}

/**
 * Checks whether the bit at index is 1.0
 *
 * number is treated as if it were an integer in the range 0-255
 */
bool isBitSet(int number, int index){

	
	int powi = 1;
	if (index == 0) {
		powi = 1;
	} else if (index == 1) {
		powi = 2;
	} else if (index == 2) {
		powi = 4;
	} else if (index == 3) {
		powi = 8;
	} else if (index == 4) {
		powi = 16;
	} else if (index == 5) {
		powi = 32;
	} else if (index == 6) {
		powi = 64;
	} else if (index == 7) {
		powi = 128;
	}

	int ndp = number / powi;

	return mod(float(ndp), 2.0) != 0.0;
}

/**
 * Gets the the LOD at the point position.
 */
float getLOD() {
	vec3 offset = vec3(0.0, 0.0, 0.0);
	int iOffset = int(vnStart);
	float depth = level;

	for (float i = 0.0; i <= 30.0; i++) {
		float nodeSizeAtLevel = octreeSize  / pow(2.0, i + level + 0.0);
		
		vec3 index3d = (position-offset) / nodeSizeAtLevel;
		index3d = floor(index3d + 0.5);
		int index = int(round(4.0 * index3d.x + 2.0 * index3d.y + index3d.z));
		
		vec4 value = texture(visibleNodes, vec2(float(iOffset) / 2048.0, 0.0));
		int mask = int(round(value.r * 255.0));

		if (isBitSet(mask, index)) {
			
			int advanceG = int(round(value.g * 255.0)) * 256;
			int advanceB = int(round(value.b * 255.0));
			int advanceChild = numberOfOnes(mask, index - 1);
			int advance = advanceG + advanceB + advanceChild;

			iOffset = iOffset + advance;

			depth++;
		} else {
			return value.a * 255.0; 
		}
		
		offset = offset + (vec3(1.0, 1.0, 1.0) * nodeSizeAtLevel * 0.5) * index3d;  
	}
		
	return depth;
}

float getPointSizeAttenuation() {
	return 0.5 * pow(2.0, getLOD());
}

#endif

#if (defined(adaptive_point_size) || defined(color_type_lod)) && defined(tree_type_kdtree)

float getLOD() {
	vec3 offset = vec3(0.0, 0.0, 0.0);
	float intOffset = 0.0;
	float depth = 0.0;
			
	vec3 size = bbSize;	
	vec3 pos = position;
		
	for (float i = 0.0; i <= 1000.0; i++) {
		
		vec4 value = texture(visibleNodes, vec2(intOffset / 2048.0, 0.0));
		
		int children = int(value.r * 255.0);
		float next = value.g * 255.0;
		int split = int(value.b * 255.0);
		
		if (next == 0.0) {
		 	return depth;
		}
		
		vec3 splitv = vec3(0.0, 0.0, 0.0);
		if (split == 1) {
			splitv.x = 1.0;
		} else if (split == 2) {
		 	splitv.y = 1.0;
		} else if (split == 4) {
		 	splitv.z = 1.0;
		}
		
		intOffset = intOffset + next;
		
		float factor = length(pos * splitv / size);
		if (factor < 0.5) {
		 	
			if (children == 0 || children == 2) {
				return depth;
			}
		} else {
			
			pos = pos - size * splitv * 0.5;
			if (children == 0 || children == 1) {
				return depth;
			}
			if (children == 3) {
				intOffset = intOffset + 1.0;
			}
		}
		size = size * ((1.0 - (splitv + 1.0) / 2.0) + 0.5);
		
		depth++;
	}
		
		
	return depth;	
}

float getPointSizeAttenuation() {
	return 0.5 * pow(1.3, getLOD());
}

#endif

float getContrastFactor(float contrast) {
	return (1.0158730158730156 * (contrast + 1.0)) / (1.0158730158730156 - contrast);
}

#ifndef new_format

vec3 getRGB() {
	#if defined(use_rgb_gamma_contrast_brightness)
	  vec3 rgb = color;
		rgb = pow(rgb, vec3(rgbGamma));
		rgb = rgb + rgbBrightness;
		rgb = (rgb - 0.5) * getContrastFactor(rgbContrast) + 0.5;
		rgb = clamp(rgb, 0.0, 1.0);
		return rgb;
	#else
		return color;
	#endif
}

#endif

float getIntensity() {
	float w = (intensity - intensityRange.x) / (intensityRange.y - intensityRange.x);
	w = pow(w, intensityGamma);
	w = w + intensityBrightness;
	w = (w - 0.5) * getContrastFactor(intensityContrast) + 0.5;
	w = clamp(w, 0.0, 1.0);
	
	return w;
}

vec3 getElevation() {
	vec4 world = modelMatrix * vec4( position, 1.0 );
	float w = (world.z - heightMin) / (heightMax-heightMin);
	vec3 cElevation = texture(gradient, vec2(w,1.0-w)).rgb;
	
	return cElevation;
}

vec4 getClassification() {
	vec2 uv = vec2(classification / 255.0, 0.5);
	vec4 classColor = texture(classificationLUT, uv);
	
	return classColor;
}

vec3 getReturnNumber() {
	if (numberOfReturns == 1.0) {
		return vec3(1.0, 1.0, 0.0);
	} else {
		if (returnNumber == 1.0) {
			return vec3(1.0, 0.0, 0.0);
		} else if (returnNumber == numberOfReturns) {
			return vec3(0.0, 0.0, 1.0);
		} else {
			return vec3(0.0, 1.0, 0.0);
		}
	}
}

vec3 getSourceID() {
	float w = mod(pointSourceID, 10.0) / 10.0;
	return texture(gradient, vec2(w, 1.0 - w)).rgb;
}

#ifndef new_format

vec3 getCompositeColor() {
	vec3 c;
	float w;

	c += wRGB * getRGB();
	w += wRGB;
	
	c += wIntensity * getIntensity() * vec3(1.0, 1.0, 1.0);
	w += wIntensity;
	
	c += wElevation * getElevation();
	w += wElevation;
	
	c += wReturnNumber * getReturnNumber();
	w += wReturnNumber;
	
	c += wSourceID * getSourceID();
	w += wSourceID;
	
	vec4 cl = wClassification * getClassification();
	c += cl.a * cl.rgb;
	w += wClassification * cl.a;

	c = c / w;
	
	if (w == 0.0) {
		gl_Position = vec4(100.0, 100.0, 100.0, 0.0);
	}
	
	return c;
}

#endif

void main() {
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

	gl_Position = projectionMatrix * mvPosition;

	#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0) || defined(paraboloid_point_shape)
		vViewPosition = mvPosition.xyz;
	#endif

	#if defined weighted_splats
		vLinearDepth = gl_Position.w;
	#endif

	#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0)
		vNormal = normalize(normalMatrix * normal);
	#endif

	#if !defined(paraboloid_point_shape) && defined(use_edl)
		vLogDepth = log2(-mvPosition.z);
	#endif

	
	
	

	float pointSize = 1.0;
	float slope = tan(fov / 2.0);
	float projFactor =  -0.5 * screenHeight / (slope * mvPosition.z);

	#if defined fixed_point_size
		pointSize = size;
	#elif defined attenuated_point_size
		pointSize = size * spacing * projFactor;
	#elif defined adaptive_point_size
		float worldSpaceSize = 2.0 * size * spacing / getPointSizeAttenuation();
		pointSize = worldSpaceSize * projFactor;
	#endif

	pointSize = max(minSize, pointSize);
	pointSize = min(maxSize, pointSize);

	#if defined(weighted_splats) || defined(paraboloid_point_shape)
		vRadius = pointSize / projFactor;
	#endif

	gl_PointSize = pointSize;

	
	
	

	#ifdef highlight_point
		vec4 mPosition = modelMatrix * vec4(position, 1.0);
		if (enablePointHighlighting && abs(mPosition.x - highlightedPointCoordinate.x) < 0.0001 &&
			abs(mPosition.y - highlightedPointCoordinate.y) < 0.0001 &&
			abs(mPosition.z - highlightedPointCoordinate.z) < 0.0001) {
			vHighlight = 1.0;
			gl_PointSize = pointSize * highlightedPointScale;
		} else {
			vHighlight = 0.0;
		}
	#endif

	
	
	

	#ifndef color_type_point_index
		#ifdef attenuated_opacity
			vOpacity = opacity * exp(-length(-mvPosition.xyz) / opacityAttenuation);
		#else
			vOpacity = opacity;
		#endif
	#endif

	
	
	

	#ifdef use_filter_by_normal
		if(abs((modelViewMatrix * vec4(normal, 0.0)).z) > filterByNormalThreshold) {
			
			gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
		}
	#endif

	
	
	
	#ifdef new_format
		vColor = rgba;
	#elif defined color_type_rgb
		vColor = getRGB();
	#elif defined color_type_height
		vColor = getElevation();
	#elif defined color_type_rgb_height
		vec3 cHeight = getElevation();
		vColor = (1.0 - transition) * getRGB() + transition * cHeight;
	#elif defined color_type_depth
		float linearDepth = -mvPosition.z ;
		float expDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
		vColor = vec3(linearDepth, expDepth, 0.0);
	#elif defined color_type_intensity
		float w = getIntensity();
		vColor = vec3(w, w, w);
	#elif defined color_type_intensity_gradient
		float w = getIntensity();
		vColor = texture(gradient, vec2(w, 1.0 - w)).rgb;
	#elif defined color_type_color
		vColor = uColor;
	#elif defined color_type_lod
	float w = getLOD() / 10.0;
	vColor = texture(gradient, vec2(w, 1.0 - w)).rgb;
	#elif defined color_type_point_index
		vColor = indices.rgb;
	#elif defined color_type_classification
	  vec4 cl = getClassification(); 
		vColor = cl.rgb;
	#elif defined color_type_return_number
		vColor = getReturnNumber();
	#elif defined color_type_source
		vColor = getSourceID();
	#elif defined color_type_normal
		vColor = (modelMatrix * vec4(normal, 0.0)).xyz;
	#elif defined color_type_phong
		vColor = color;
	#elif defined color_type_composite
		vColor = getCompositeColor();
	#endif
	
	#if !defined color_type_composite && defined color_type_classification
		if (cl.a == 0.0) {
			gl_Position = vec4(100.0, 100.0, 100.0, 0.0);
			return;
		}
	#endif

	
	
	

	#if defined use_clip_box
		bool insideAny = false;
		for (int i = 0; i < max_clip_boxes; i++) {
			if (i == int(clipBoxCount)) {
				break;
			}
		
			vec4 clipPosition = clipBoxes[i] * modelMatrix * vec4(position, 1.0);
			bool inside = -0.5 <= clipPosition.x && clipPosition.x <= 0.5;
			inside = inside && -0.5 <= clipPosition.y && clipPosition.y <= 0.5;
			inside = inside && -0.5 <= clipPosition.z && clipPosition.z <= 0.5;
			insideAny = insideAny || inside;
		}

		if (!insideAny) {
			#if defined clip_outside
				gl_Position = vec4(1000.0, 1000.0, 1000.0, 1.0);
			#elif defined clip_highlight_inside && !defined(color_type_depth)
				float c = (vColor.r + vColor.g + vColor.b) / 6.0;
			#endif
		} else {
			#if defined clip_highlight_inside
				vColor.r += 0.5;
			#endif
		}
	#endif
}`,zt=`#version 300 es

precision highp float;
precision highp int;

uniform mat4 viewMatrix;
uniform vec3 cameraPosition;

uniform mat4 projectionMatrix;
uniform float opacity;

uniform float blendHardness;
uniform float blendDepthSupplement;
uniform float fov;
uniform float spacing;
uniform float pcIndex;
uniform float screenWidth;
uniform float screenHeight;

uniform sampler2D depthMap;

out vec4 fragColor;

#ifdef highlight_point
	uniform vec4 highlightedPointColor;
#endif

#ifdef new_format
	in vec4 vColor;
#else
	in vec3 vColor;
#endif

#if !defined(color_type_point_index)
	in float vOpacity;
#endif

#if defined(weighted_splats)
	in float vLinearDepth;
#endif

#if !defined(paraboloid_point_shape) && defined(use_edl)
	in float vLogDepth;
#endif

#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0) || defined(paraboloid_point_shape)
	in vec3 vViewPosition;
#endif

#if defined(weighted_splats) || defined(paraboloid_point_shape)
	in float vRadius;
#endif

#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0)
	in vec3 vNormal;
#endif

#ifdef highlight_point
	in float vHighlight;
#endif

float specularStrength = 1.0;

void main() {

	#ifdef new_format
		
		vec3 actualColor = vColor.xyz;
	#else
		
		vec3 actualColor = vColor;
	#endif
	
	vec3 color = actualColor;
	float depth = gl_FragCoord.z;

	#if defined(circle_point_shape) || defined(paraboloid_point_shape) || defined (weighted_splats)
		float u = 2.0 * gl_PointCoord.x - 1.0;
		float v = 2.0 * gl_PointCoord.y - 1.0;
	#endif
	
	#if defined(circle_point_shape) || defined (weighted_splats)
		float cc = u*u + v*v;
		if(cc > 1.0){
			discard;
		}
	#endif

	#if defined weighted_splats
		vec2 uv = gl_FragCoord.xy / vec2(screenWidth, screenHeight);
		float sDepth = texture2D(depthMap, uv).r;
		if(vLinearDepth > sDepth + vRadius + blendDepthSupplement){
			discard;
		}
	#endif
		
	#if defined color_type_point_index
		fragColor = vec4(color, pcIndex / 255.0);
	#else
		fragColor = vec4(color, vOpacity);
	#endif

	#if defined(color_type_phong)
		#if MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0
			vec3 normal = normalize( vNormal );
			normal.z = abs(normal.z);

			vec3 viewPosition = normalize( vViewPosition );
		#endif

		
	
		#if MAX_POINT_LIGHTS > 0

			vec3 pointDiffuse = vec3( 0.0 );
			vec3 pointSpecular = vec3( 0.0 );

			for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {

				vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );
				vec3 lVector = lPosition.xyz + vViewPosition.xyz;

				float lDistance = 1.0;
				if ( pointLightDistance[ i ] > 0.0 )
					lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );

				lVector = normalize( lVector );

						

				float dotProduct = dot( normal, lVector );

				#ifdef WRAP_AROUND

					float pointDiffuseWeightFull = max( dotProduct, 0.0 );
					float pointDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );

					vec3 pointDiffuseWeight = mix( vec3( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );

				#else

					float pointDiffuseWeight = max( dotProduct, 0.0 );

				#endif

				pointDiffuse += diffuse * pointLightColor[ i ] * pointDiffuseWeight * lDistance;

				

				vec3 pointHalfVector = normalize( lVector + viewPosition );
				float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );
				float pointSpecularWeight = specularStrength * max( pow( pointDotNormalHalf, shininess ), 0.0 );

				float specularNormalization = ( shininess + 2.0 ) / 8.0;

				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, pointHalfVector ), 0.0 ), 5.0 );
				pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * lDistance * specularNormalization;
				pointSpecular = vec3(0.0, 0.0, 0.0);
			}
		
		#endif
		
		#if MAX_DIR_LIGHTS > 0

			vec3 dirDiffuse = vec3( 0.0 );
			vec3 dirSpecular = vec3( 0.0 );

			for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {

				vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );
				vec3 dirVector = normalize( lDirection.xyz );

						

				float dotProduct = dot( normal, dirVector );

				#ifdef WRAP_AROUND

					float dirDiffuseWeightFull = max( dotProduct, 0.0 );
					float dirDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );

					vec3 dirDiffuseWeight = mix( vec3( dirDiffuseWeightFull ), vec3( dirDiffuseWeightHalf ), wrapRGB );

				#else

					float dirDiffuseWeight = max( dotProduct, 0.0 );

				#endif

				dirDiffuse += diffuse * directionalLightColor[ i ] * dirDiffuseWeight;

				

				vec3 dirHalfVector = normalize( dirVector + viewPosition );
				float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );
				float dirSpecularWeight = specularStrength * max( pow( dirDotNormalHalf, shininess ), 0.0 );

				float specularNormalization = ( shininess + 2.0 ) / 8.0;

				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );
				dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;
			}

		#endif
		
		vec3 totalDiffuse = vec3( 0.0 );
		vec3 totalSpecular = vec3( 0.0 );
		
		#if MAX_POINT_LIGHTS > 0

			totalDiffuse += pointDiffuse;
			totalSpecular += pointSpecular;

		#endif
		
		#if MAX_DIR_LIGHTS > 0

			totalDiffuse += dirDiffuse;
			totalSpecular += dirSpecular;

		#endif
		
		gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient ) + totalSpecular;

	#endif
	
	#if defined weighted_splats
	    
		
		float wx = 2.0 * length(2.0 * gl_PointCoord - 1.0);
		float w = exp(-wx * wx * 0.5);
		
		
		
		
		gl_FragColor.rgb = gl_FragColor.rgb * w;
		gl_FragColor.a = w;
	#endif
	
	#if defined paraboloid_point_shape
		float wi = 0.0 - ( u*u + v*v);
		vec4 pos = vec4(vViewPosition, 1.0);
		pos.z += wi * vRadius;
		float linearDepth = -pos.z;
		pos = projectionMatrix * pos;
		pos = pos / pos.w;
		float expDepth = pos.z;
		depth = (pos.z + 1.0) / 2.0;
		gl_FragDepth = depth;
		
		#if defined(color_type_depth)
			gl_FragColor.r = linearDepth;
			gl_FragColor.g = expDepth;
		#endif
		
		#if defined(use_edl)
			gl_FragColor.a = log2(linearDepth);
		#endif
		
	#else
		#if defined(use_edl)
			gl_FragColor.a = vLogDepth;
		#endif
	#endif

	#ifdef highlight_point
		if (vHighlight > 0.0) {
			gl_FragColor = highlightedPointColor;
		}
	#endif
}`;function tt(e){return parseInt(e.charAt(e.length-1),10)}function Mt(e,t){const i=e.name,n=t.name;return i.length!==n.length?i.length-n.length:i<n?-1:i>n?1:0}const pt={0:new s.Vector4(.5,.5,.5,1),1:new s.Vector4(.5,.5,.5,1),2:new s.Vector4(.63,.32,.18,1),3:new s.Vector4(0,1,0,1),4:new s.Vector4(0,.8,0,1),5:new s.Vector4(0,.6,0,1),6:new s.Vector4(1,.66,0,1),7:new s.Vector4(1,0,1,1),8:new s.Vector4(1,0,0,1),9:new s.Vector4(0,0,1,1),12:new s.Vector4(1,1,0,1),DEFAULT:new s.Vector4(.3,.6,.6,.5)};new s.Color(0,0,0),new s.Color(1,1,1),new s.Color(.077,.042,.206),new s.Color(.225,.036,.388),new s.Color(.373,.074,.432),new s.Color(.522,.128,.42),new s.Color(.665,.182,.37),new s.Color(.797,.255,.287),new s.Color(.902,.364,.184),new s.Color(.969,.516,.063),new s.Color(.988,.683,.072),new s.Color(.961,.859,.298),new s.Color(.988,.998,.645),new s.Color(.241,.015,.61),new s.Color(.387,.001,.654),new s.Color(.524,.025,.653),new s.Color(.651,.125,.596),new s.Color(.752,.227,.513),new s.Color(.837,.329,.431),new s.Color(.907,.435,.353),new s.Color(.963,.554,.272),new s.Color(.992,.681,.195),new s.Color(.987,.822,.144),new s.Color(.94,.975,.131),new s.Color(.278,0,.714),1/6,new s.Color(0,0,1),2/6,new s.Color(0,1,1),3/6,new s.Color(0,1,0),4/6,new s.Color(1,1,0),5/6,new s.Color(1,.64,0),new s.Color(1,0,0);const Gt=[[0,new s.Color(.3686,.3098,.6353)],[.1,new s.Color(.1961,.5333,.7412)],[.2,new s.Color(.4,.7608,.6471)],[.3,new s.Color(.6706,.8667,.6431)],[.4,new s.Color(.902,.9608,.5961)],[.5,new s.Color(1,1,.749)],[.6,new s.Color(.9961,.8784,.5451)],[.7,new s.Color(.9922,.6824,.3804)],[.8,new s.Color(.9569,.4275,.2627)],[.9,new s.Color(.8353,.2431,.3098)],[1,new s.Color(.6196,.0039,.2588)]];new s.Color(.267,.005,.329),new s.Color(.283,.141,.458),new s.Color(.254,.265,.53),new s.Color(.207,.372,.553),new s.Color(.164,.471,.558),new s.Color(.128,.567,.551),new s.Color(.135,.659,.518),new s.Color(.267,.749,.441),new s.Color(.478,.821,.318),new s.Color(.741,.873,.15),new s.Color(.993,.906,.144),new s.Color(.1647,.2824,.3451),new s.Color(.1338,.3555,.4227),new s.Color(.061,.4319,.4864),new s.Color(0,.5099,.5319),new s.Color(0,.5881,.5569),new s.Color(.137,.665,.5614),new s.Color(.2906,.7395,.5477),new s.Color(.4453,.8099,.5201),new s.Color(.6102,.8748,.485),new s.Color(.7883,.9323,.4514),new s.Color(.9804,.9804,.4314);function Ut(e,t,i){const n=e*t,o=new Uint8Array(4*n),r=Math.floor(i.r*255),l=Math.floor(i.g*255),d=Math.floor(i.b*255);for(let c=0;c<n;c++)o[c*3]=r,o[c*3+1]=l,o[c*3+2]=d;const a=new s.DataTexture(o,e,t,s.RGBAFormat);return a.needsUpdate=!0,a.magFilter=s.NearestFilter,a}function gt(e){const i=document.createElement("canvas");i.width=64,i.height=64;const n=i.getContext("2d");n.rect(0,0,64,64);const o=n.createLinearGradient(0,0,64,64);for(let l=0;l<e.length;l++){const d=e[l];o.addColorStop(d[0],`#${d[1].getHexString()}`)}n.fillStyle=o,n.fill();const r=new s.CanvasTexture(i);return r.needsUpdate=!0,r.minFilter=s.LinearFilter,r}function mt(e){const o=new Uint8Array(262144);for(let l=0;l<256;l++)for(let d=0;d<256;d++){const a=l+256*d;let c;e[l]?c=e[l]:e[l%32]?c=e[l%32]:c=e.DEFAULT,o[4*a+0]=255*c.x,o[4*a+1]=255*c.y,o[4*a+2]=255*c.z,o[4*a+3]=255*c.w}const r=new s.DataTexture(o,256,256,s.RGBAFormat);return r.magFilter=s.NearestFilter,r.needsUpdate=!0,r}var Ft=Object.defineProperty,Ht=Object.getOwnPropertyDescriptor,g=(e,t,i,n)=>{for(var o=n>1?void 0:n?Ht(t,i):t,r=e.length-1,l;r>=0;r--)(l=e[r])&&(o=(n?l(t,i,o):l(o))||o);return n&&o&&Ft(t,i,o),o};const Vt={[k.OCTREE]:"tree_type_octree",[k.KDTREE]:"tree_type_kdtree"},kt={[U.FIXED]:"fixed_point_size",[U.ATTENUATED]:"attenuated_point_size",[U.ADAPTIVE]:"adaptive_point_size"},Wt={[$.ATTENUATED]:"attenuated_opacity",[$.FIXED]:"fixed_opacity"},Yt={[V.SQUARE]:"square_point_shape",[V.CIRCLE]:"circle_point_shape",[V.PARABOLOID]:"paraboloid_point_shape"},jt={[T.RGB]:"color_type_rgb",[T.COLOR]:"color_type_color",[T.DEPTH]:"color_type_depth",[T.HEIGHT]:"color_type_height",[T.INTENSITY]:"color_type_intensity",[T.INTENSITY_GRADIENT]:"color_type_intensity_gradient",[T.LOD]:"color_type_lod",[T.POINT_INDEX]:"color_type_point_index",[T.CLASSIFICATION]:"color_type_classification",[T.RETURN_NUMBER]:"color_type_return_number",[T.SOURCE]:"color_type_source",[T.NORMAL]:"color_type_normal",[T.PHONG]:"color_type_phong",[T.RGB_HEIGHT]:"color_type_rgb_height",[T.COMPOSITE]:"color_type_composite"},Xt={[L.DISABLED]:"clip_disabled",[L.CLIP_OUTSIDE]:"clip_outside",[L.HIGHLIGHT_INSIDE]:"clip_highlight_inside"},_t=class extends s.RawShaderMaterial{constructor(e={}){super();this.lights=!1,this.fog=!1,this.numClipBoxes=0,this.clipBoxes=[],this.visibleNodeTextureOffsets=new Map,this._gradient=Gt,this.gradientTexture=gt(this._gradient),this._classification=pt,this.classificationTexture=mt(this._classification),this.uniforms={bbSize:p("fv",[0,0,0]),blendDepthSupplement:p("f",0),blendHardness:p("f",2),classificationLUT:p("t",this.classificationTexture||new s.Texture),clipBoxCount:p("f",0),clipBoxes:p("Matrix4fv",[]),depthMap:p("t",null),diffuse:p("fv",[1,1,1]),fov:p("f",1),gradient:p("t",this.gradientTexture||new s.Texture),heightMax:p("f",1),heightMin:p("f",0),intensityBrightness:p("f",0),intensityContrast:p("f",0),intensityGamma:p("f",1),intensityRange:p("fv",[0,65e3]),isLeafNode:p("b",0),level:p("f",0),maxSize:p("f",It),minSize:p("f",Dt),octreeSize:p("f",0),opacity:p("f",1),pcIndex:p("f",0),rgbBrightness:p("f",dt),rgbContrast:p("f",ct),rgbGamma:p("f",ut),screenHeight:p("f",1),screenWidth:p("f",1),size:p("f",1),spacing:p("f",1),toModel:p("Matrix4f",[]),transition:p("f",.5),uColor:p("c",new s.Color(16777215)),visibleNodes:p("t",this.visibleNodesTexture||new s.Texture),vnStart:p("f",0),wClassification:p("f",0),wElevation:p("f",0),wIntensity:p("f",0),wReturnNumber:p("f",0),wRGB:p("f",1),wSourceID:p("f",0),opacityAttenuation:p("f",1),filterByNormalThreshold:p("f",0),highlightedPointCoordinate:p("fv",new s.Vector3),highlightedPointColor:p("fv",Rt.clone()),enablePointHighlighting:p("b",!0),highlightedPointScale:p("f",2)},this.useClipBox=!1,this.weighted=!1,this.pointColorType=T.RGB,this.pointSizeType=U.ADAPTIVE,this.clipMode=L.DISABLED,this.useEDL=!1,this.shape=V.SQUARE,this.treeType=k.OCTREE,this.pointOpacityType=$.FIXED,this.useFilterByNormal=!1,this.highlightPoint=!1,this.attributes={position:{type:"fv",value:[]},color:{type:"fv",value:[]},normal:{type:"fv",value:[]},intensity:{type:"f",value:[]},classification:{type:"f",value:[]},returnNumber:{type:"f",value:[]},numberOfReturns:{type:"f",value:[]},pointSourceID:{type:"f",value:[]},indices:{type:"fv",value:[]}};const t=this.visibleNodesTexture=Ut(2048,1,new s.Color(16777215));t.minFilter=s.NearestFilter,t.magFilter=s.NearestFilter,this.setUniform("visibleNodes",t),this.treeType=q(e.treeType,k.OCTREE),this.size=q(e.size,1),this.minSize=q(e.minSize,2),this.maxSize=q(e.maxSize,50),this.newFormat=!!e.newFormat,this.classification=pt,this.defaultAttributeValues.normal=[0,0,0],this.defaultAttributeValues.classification=[0,0,0],this.defaultAttributeValues.indices=[0,0,0,0],this.vertexColors=!0,this.updateShaderSource()}dispose(){super.dispose(),this.gradientTexture&&(this.gradientTexture.dispose(),this.gradientTexture=void 0),this.visibleNodesTexture&&(this.visibleNodesTexture.dispose(),this.visibleNodesTexture=void 0),this.clearVisibleNodeTextureOffsets(),this.classificationTexture&&(this.classificationTexture.dispose(),this.classificationTexture=void 0),this.depthMap&&(this.depthMap.dispose(),this.depthMap=void 0)}clearVisibleNodeTextureOffsets(){this.visibleNodeTextureOffsets.clear()}updateShaderSource(){this.vertexShader=this.applyDefines(Lt),this.fragmentShader=this.applyDefines(zt),this.opacity===1?(this.blending=s.NoBlending,this.transparent=!1,this.depthTest=!0,this.depthWrite=!0,this.depthFunc=s.LessEqualDepth):this.opacity<1&&!this.useEDL&&(this.blending=s.AdditiveBlending,this.transparent=!0,this.depthTest=!1,this.depthWrite=!0),this.weighted&&(this.blending=s.AdditiveBlending,this.transparent=!0,this.depthTest=!0,this.depthWrite=!1,this.depthFunc=s.LessEqualDepth),this.needsUpdate=!0}applyDefines(e){const t=[];function i(o){o&&t.push(`#define ${o}`)}i(Vt[this.treeType]),i(kt[this.pointSizeType]),i(Yt[this.shape]),i(jt[this.pointColorType]),i(Xt[this.clipMode]),i(Wt[this.pointOpacityType]),(this.rgbGamma!==ut||this.rgbBrightness!==dt||this.rgbContrast!==ct)&&i("use_rgb_gamma_contrast_brightness"),this.useFilterByNormal&&i("use_filter_by_normal"),this.useEDL&&i("use_edl"),this.weighted&&i("weighted_splats"),this.numClipBoxes>0&&i("use_clip_box"),this.highlightPoint&&i("highlight_point"),i("MAX_POINT_LIGHTS 0"),i("MAX_DIR_LIGHTS 0"),this.newFormat&&i("new_format");const n=e.match(/^\s*#version\s+300\s+es\s*\n/);return n&&(t.unshift(n[0]),e=e.replace(n[0],"")),t.push(e),t.join(`
`)}setClipBoxes(e){if(!e)return;this.clipBoxes=e;const t=this.numClipBoxes!==e.length&&(e.length===0||this.numClipBoxes===0);this.numClipBoxes=e.length,this.setUniform("clipBoxCount",this.numClipBoxes),t&&this.updateShaderSource();const i=this.numClipBoxes*16,n=new Float32Array(i);for(let o=0;o<this.numClipBoxes;o++)n.set(e[o].inverse.elements,16*o);for(let o=0;o<i;o++)isNaN(n[o])&&(n[o]=1/0);this.setUniform("clipBoxes",n)}get gradient(){return this._gradient}set gradient(e){this._gradient!==e&&(this._gradient=e,this.gradientTexture=gt(this._gradient),this.setUniform("gradient",this.gradientTexture))}get classification(){return this._classification}set classification(e){const t={};for(const n of Object.keys(e))t[n]=e[n].clone();let i=!1;if(this._classification===void 0)i=!1;else{i=Object.keys(t).length===Object.keys(this._classification).length;for(const n of Object.keys(t))i=i&&this._classification[n]!==void 0,i=i&&t[n].equals(this._classification[n])}i||(this._classification=t,this.recomputeClassification())}recomputeClassification(){this.classificationTexture=mt(this._classification),this.setUniform("classificationLUT",this.classificationTexture)}get elevationRange(){return[this.heightMin,this.heightMax]}set elevationRange(e){this.heightMin=e[0],this.heightMax=e[1]}getUniform(e){return this.uniforms===void 0?void 0:this.uniforms[e].value}setUniform(e,t){if(this.uniforms===void 0)return;const i=this.uniforms[e];i.type==="c"?i.value.copy(t):t!==i.value&&(i.value=t)}updateMaterial(e,t,i,n){const o=n.getPixelRatio();i.type===ht?this.fov=i.fov*(Math.PI/180):this.fov=Math.PI/2;const r=n.getRenderTarget();r!==null&&r instanceof s.WebGLRenderTarget?(this.screenWidth=r.width,this.screenHeight=r.height):(this.screenWidth=n.domElement.clientWidth*o,this.screenHeight=n.domElement.clientHeight*o);const l=Math.max(e.scale.x,e.scale.y,e.scale.z);this.spacing=e.pcoGeometry.spacing*l,this.octreeSize=e.pcoGeometry.boundingBox.getSize(_t.helperVec3).x,(this.pointSizeType===U.ADAPTIVE||this.pointColorType===T.LOD)&&this.updateVisibilityTextureData(t)}updateVisibilityTextureData(e){e.sort(Mt);const t=new Uint8Array(e.length*4),i=new Array(e.length).fill(1/0);this.visibleNodeTextureOffsets.clear();for(let o=0;o<e.length;o++){const r=e[o];if(this.visibleNodeTextureOffsets.set(r.name,o),o>0){const l=r.name.slice(0,-1),d=this.visibleNodeTextureOffsets.get(l),a=o-d;i[d]=Math.min(i[d],a);const c=d*4;t[c]=t[c]|1<<r.index,t[c+1]=i[d]>>8,t[c+2]=i[d]%256}t[o*4+3]=r.name.length}const n=this.visibleNodesTexture;n&&(n.image.data.set(t),n.needsUpdate=!0)}static makeOnBeforeRender(e,t,i){return(n,o,r,l,d)=>{const a=d,c=a.uniforms;c.level.value=t.level,c.isLeafNode.value=t.isLeafNode;const u=a.visibleNodeTextureOffsets.get(t.name);u!==void 0&&(c.vnStart.value=u),c.pcIndex.value=i!==void 0?i:e.visibleNodes.indexOf(t),d.uniformsNeedUpdate=!0}}};let h=_t;h.helperVec3=new s.Vector3,g([_("bbSize")],h.prototype,"bbSize",2),g([_("depthMap")],h.prototype,"depthMap",2),g([_("fov")],h.prototype,"fov",2),g([_("heightMax")],h.prototype,"heightMax",2),g([_("heightMin")],h.prototype,"heightMin",2),g([_("intensityBrightness")],h.prototype,"intensityBrightness",2),g([_("intensityContrast")],h.prototype,"intensityContrast",2),g([_("intensityGamma")],h.prototype,"intensityGamma",2),g([_("intensityRange")],h.prototype,"intensityRange",2),g([_("maxSize")],h.prototype,"maxSize",2),g([_("minSize")],h.prototype,"minSize",2),g([_("octreeSize")],h.prototype,"octreeSize",2),g([_("opacity",!0)],h.prototype,"opacity",2),g([_("rgbBrightness",!0)],h.prototype,"rgbBrightness",2),g([_("rgbContrast",!0)],h.prototype,"rgbContrast",2),g([_("rgbGamma",!0)],h.prototype,"rgbGamma",2),g([_("screenHeight")],h.prototype,"screenHeight",2),g([_("screenWidth")],h.prototype,"screenWidth",2),g([_("size")],h.prototype,"size",2),g([_("spacing")],h.prototype,"spacing",2),g([_("transition")],h.prototype,"transition",2),g([_("uColor")],h.prototype,"color",2),g([_("wClassification")],h.prototype,"weightClassification",2),g([_("wElevation")],h.prototype,"weightElevation",2),g([_("wIntensity")],h.prototype,"weightIntensity",2),g([_("wReturnNumber")],h.prototype,"weightReturnNumber",2),g([_("wRGB")],h.prototype,"weightRGB",2),g([_("wSourceID")],h.prototype,"weightSourceID",2),g([_("opacityAttenuation")],h.prototype,"opacityAttenuation",2),g([_("filterByNormalThreshold")],h.prototype,"filterByNormalThreshold",2),g([_("highlightedPointCoordinate")],h.prototype,"highlightedPointCoordinate",2),g([_("highlightedPointColor")],h.prototype,"highlightedPointColor",2),g([_("enablePointHighlighting")],h.prototype,"enablePointHighlighting",2),g([_("highlightedPointScale")],h.prototype,"highlightedPointScale",2),g([B()],h.prototype,"useClipBox",2),g([B()],h.prototype,"weighted",2),g([B()],h.prototype,"pointColorType",2),g([B()],h.prototype,"pointSizeType",2),g([B()],h.prototype,"clipMode",2),g([B()],h.prototype,"useEDL",2),g([B()],h.prototype,"shape",2),g([B()],h.prototype,"treeType",2),g([B()],h.prototype,"pointOpacityType",2),g([B()],h.prototype,"useFilterByNormal",2),g([B()],h.prototype,"highlightPoint",2);function p(e,t){return{type:e,value:t}}function q(e,t){return e===void 0?t:e}function _(e,t=!1){return(i,n)=>{Object.defineProperty(i,n,{get(){return this.getUniform(e)},set(o){o!==this.getUniform(e)&&(this.setUniform(e,o),t&&this.updateShaderSource())}})}}function B(){return(e,t)=>{const i=`_${t.toString()}`;Object.defineProperty(e,t,{get(){return this[i]},set(n){n!==this[i]&&(this[i]=n,this.updateShaderSource())}})}}class Kt extends s.EventDispatcher{constructor(t,i){super();this.pcIndex=void 0,this.boundingBoxNode=null,this.loaded=!0,this.isTreeNode=!0,this.isGeometryNode=!1,this.geometryNode=t,this.sceneNode=i,this.children=t.children.slice()}dispose(){this.geometryNode.dispose()}disposeSceneNode(){const t=this.sceneNode;if(t.geometry instanceof s.BufferGeometry){const i=t.geometry.attributes;for(const n in i)n==="position"&&delete i[n].array,delete i[n];t.geometry.dispose(),t.geometry=void 0}}traverse(t,i){this.geometryNode.traverse(t,i)}get id(){return this.geometryNode.id}get name(){return this.geometryNode.name}get level(){return this.geometryNode.level}get isLeafNode(){return this.geometryNode.isLeafNode}get numPoints(){return this.geometryNode.numPoints}get index(){return this.geometryNode.index}get boundingSphere(){return this.geometryNode.boundingSphere}get boundingBox(){return this.geometryNode.boundingBox}get spacing(){return this.geometryNode.spacing}}function yt(e,t,i){return Math.min(Math.max(t,e),i)}const b=class{dispose(){this.pickState&&(this.pickState.material.dispose(),this.pickState.renderTarget.dispose())}pick(e,t,i,n,o={}){if(n.length===0)return null;const r=this.pickState?this.pickState:this.pickState=b.getPickState(),l=r.material,d=e.getPixelRatio(),a=Math.ceil(e.domElement.clientWidth*d),c=Math.ceil(e.domElement.clientHeight*d);b.updatePickRenderTarget(this.pickState,a,c);const u=b.helperVec3;o.pixelPosition?u.copy(o.pixelPosition):(u.addVectors(t.position,i.direction).project(t),u.x=(u.x+1)*a*.5,u.y=(u.y+1)*c*.5);const f=Math.floor((o.pickWindowSize||Bt)*d),v=(f-1)/2,x=Math.floor(yt(u.x-v,0,a)),w=Math.floor(yt(u.y-v,0,c));b.prepareRender(e,x,w,f,l,r);const I=b.render(e,t,l,n,i,r,o);l.clearVisibleNodeTextureOffsets();const m=b.readPixels(e,x,w,f),D=b.findHit(m,f);return b.getPickPoint(D,I)}static prepareRender(e,t,i,n,o,r){e.setScissor(t,i,n,n),e.setScissorTest(!0),e.state.buffers.depth.setTest(o.depthTest),e.state.buffers.depth.setMask(o.depthWrite),e.state.setBlending(s.NoBlending),e.setRenderTarget(r.renderTarget),e.getClearColor(this.clearColor);const l=e.getClearAlpha();e.setClearColor(Pt,0),e.clear(!0,!0,!0),e.setClearColor(this.clearColor,l)}static render(e,t,i,n,o,r,l){const d=[];for(const a of n){const c=b.nodesOnRay(a,o);!c.length||(b.updatePickMaterial(i,a.material,l),i.updateMaterial(a,c,t,e),l.onBeforePickRender&&l.onBeforePickRender(i,r.renderTarget),r.scene.children=b.createTempNodes(a,c,i,d.length),e.render(r.scene,t),c.forEach(u=>d.push({node:u,octree:a})))}return d}static nodesOnRay(e,t){const i=[],n=t.clone();for(const o of e.visibleNodes){const r=b.helperSphere.copy(o.boundingSphere).applyMatrix4(e.matrixWorld);n.intersectsSphere(r)&&i.push(o)}return i}static readPixels(e,t,i,n){const o=new Uint8Array(4*n*n);return e.readRenderTargetPixels(e.getRenderTarget(),t,i,n,n,o),e.setScissorTest(!1),e.setRenderTarget(null),o}static createTempNodes(e,t,i,n){const o=[];for(let r=0;r<t.length;r++){const l=t[r],d=l.sceneNode,a=new s.Points(d.geometry,i);a.matrix=d.matrix,a.matrixWorld=d.matrixWorld,a.matrixAutoUpdate=!1,a.frustumCulled=!1;const c=n+r+1;c>255&&console.error("More than 255 nodes for pick are not supported."),a.onBeforeRender=h.makeOnBeforeRender(e,l,c),o.push(a)}return o}static updatePickMaterial(e,t,i){e.pointSizeType=t.pointSizeType,e.shape=t.shape,e.size=t.size,e.minSize=t.minSize,e.maxSize=t.maxSize,e.classification=t.classification,e.useFilterByNormal=t.useFilterByNormal,e.filterByNormalThreshold=t.filterByNormalThreshold,i.pickOutsideClipRegion?e.clipMode=L.DISABLED:(e.clipMode=t.clipMode,e.setClipBoxes(t.clipMode===L.CLIP_OUTSIDE?t.clipBoxes:[]))}static updatePickRenderTarget(e,t,i){e.renderTarget.width===t&&e.renderTarget.height===i||(e.renderTarget.dispose(),e.renderTarget=b.makePickRenderTarget(),e.renderTarget.setSize(t,i))}static makePickRenderTarget(){return new s.WebGLRenderTarget(1,1,{minFilter:s.LinearFilter,magFilter:s.NearestFilter,format:s.RGBAFormat})}static findHit(e,t){const i=new Uint32Array(e.buffer);let n=Number.MAX_VALUE,o=null;for(let r=0;r<t;r++)for(let l=0;l<t;l++){const d=r+l*t,a=Math.pow(r-(t-1)/2,2)+Math.pow(l-(t-1)/2,2),c=e[4*d+3];e[4*d+3]=0;const u=i[d];c>0&&a<n&&(o={pIndex:u,pcIndex:c-1},n=a)}return o}static getPickPoint(e,t){if(!e)return null;const i={},n=t[e.pcIndex]&&t[e.pcIndex].node.sceneNode;if(!n)return null;i.pointCloud=t[e.pcIndex].octree;const o=n.geometry.attributes;for(const r in o){if(!o.hasOwnProperty(r))continue;const l=o[r];if(r==="position")b.addPositionToPickPoint(i,e,l,n);else if(r==="normal")b.addNormalToPickPoint(i,e,l,n);else if(r!=="indices")if(l.itemSize===1)i[r]=l.array[e.pIndex];else{const d=[];for(let a=0;a<l.itemSize;a++)d.push(l.array[l.itemSize*e.pIndex+a]);i[r]=d}}return i}static addPositionToPickPoint(e,t,i,n){e.position=new s.Vector3().fromBufferAttribute(i,t.pIndex).applyMatrix4(n.matrixWorld)}static addNormalToPickPoint(e,t,i,n){const o=new s.Vector3().fromBufferAttribute(i,t.pIndex),r=new s.Vector4(o.x,o.y,o.z,0).applyMatrix4(n.matrixWorld);o.set(r.x,r.y,r.z),e.normal=o}static getPickState(){const e=new s.Scene;e.autoUpdate=!1;const t=new h;return t.pointColorType=T.POINT_INDEX,{renderTarget:b.makePickRenderTarget(),material:t,scene:e}}};let W=b;W.helperVec3=new s.Vector3,W.helperSphere=new s.Sphere,W.clearColor=new s.Color;class $t extends s.Object3D{constructor(){super(...arguments);this.root=null}initialized(){return this.root!==null}}function vt(e,t){return new s.Box3().setFromPoints([new s.Vector3(e.min.x,e.min.y,e.min.z).applyMatrix4(t),new s.Vector3(e.min.x,e.min.y,e.min.z).applyMatrix4(t),new s.Vector3(e.max.x,e.min.y,e.min.z).applyMatrix4(t),new s.Vector3(e.min.x,e.max.y,e.min.z).applyMatrix4(t),new s.Vector3(e.min.x,e.min.y,e.max.z).applyMatrix4(t),new s.Vector3(e.min.x,e.max.y,e.max.z).applyMatrix4(t),new s.Vector3(e.max.x,e.max.y,e.min.z).applyMatrix4(t),new s.Vector3(e.max.x,e.min.y,e.max.z).applyMatrix4(t),new s.Vector3(e.max.x,e.max.y,e.max.z).applyMatrix4(t)])}function xt(e,t){const i=e.min.clone(),n=e.max.clone(),o=new s.Vector3().subVectors(n,i);return(t&1)>0?i.z+=o.z/2:n.z-=o.z/2,(t&2)>0?i.y+=o.y/2:n.y-=o.y/2,(t&4)>0?i.x+=o.x/2:n.x-=o.x/2,new s.Box3(i,n)}class et extends $t{constructor(t,i,n){super();this.disposed=!1,this.level=0,this.maxLevel=1/0,this.minNodePixelSize=St,this.root=null,this.boundingBoxNodes=[],this.visibleNodes=[],this.visibleGeometry=[],this.numVisiblePoints=0,this.showBoundingBox=!1,this.visibleBounds=new s.Box3,this.name="",this.potree=t,this.root=i.root,this.pcoGeometry=i,this.boundingBox=i.boundingBox,this.boundingSphere=this.boundingBox.getBoundingSphere(new s.Sphere),this.position.copy(i.offset),this.updateMatrix(),this.material=n||i instanceof at?new h({newFormat:!0}):new h,this.initMaterial(this.material)}initMaterial(t){this.updateMatrixWorld(!0);const{min:i,max:n}=vt(this.pcoGeometry.tightBoundingBox||this.getBoundingBoxWorld(),this.matrixWorld),o=n.z-i.z;t.heightMin=i.z-.2*o,t.heightMax=n.z+.2*o}dispose(){this.root&&this.root.dispose(),this.pcoGeometry.root.traverse(t=>this.potree.lru.remove(t)),this.pcoGeometry.dispose(),this.material.dispose(),this.visibleNodes=[],this.visibleGeometry=[],this.picker&&(this.picker.dispose(),this.picker=void 0),this.disposed=!0}get pointSizeType(){return this.material.pointSizeType}set pointSizeType(t){this.material.pointSizeType=t}toTreeNode(t,i){const n=new s.Points(t.geometry,this.material),o=new Kt(t,n);return n.name=t.name,n.position.copy(t.boundingBox.min),n.frustumCulled=!1,n.onBeforeRender=h.makeOnBeforeRender(this,o),i?(i.sceneNode.add(n),i.children[t.index]=o,t.oneTimeDisposeHandlers.push(()=>{o.disposeSceneNode(),i.sceneNode.remove(o.sceneNode),i.children[t.index]=t})):(this.root=o,this.add(n)),o}updateVisibleBounds(){const t=this.visibleBounds;t.min.set(1/0,1/0,1/0),t.max.set(-1/0,-1/0,-1/0);for(const i of this.visibleNodes)i.isLeafNode&&(t.expandByPoint(i.boundingBox.min),t.expandByPoint(i.boundingBox.max))}updateBoundingBoxes(){if(!this.showBoundingBox||!this.parent)return;let t=this.parent.getObjectByName("bbroot");t||(t=new s.Object3D,t.name="bbroot",this.parent.add(t));const i=[];for(const n of this.visibleNodes)n.boundingBoxNode!==void 0&&n.isLeafNode&&i.push(n.boundingBoxNode);t.children=i}updateMatrixWorld(t){this.matrixAutoUpdate===!0&&this.updateMatrix(),(this.matrixWorldNeedsUpdate===!0||t===!0)&&(this.parent?this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix):this.matrixWorld.copy(this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0)}hideDescendants(t){const i=[];for(n(t);i.length>0;){const o=i.shift();o.visible=!1,n(o)}function n(o){for(const r of o.children)r.visible&&i.push(r)}}moveToOrigin(){this.position.set(0,0,0),this.position.set(0,0,0).sub(this.getBoundingBoxWorld().getCenter(new s.Vector3))}moveToGroundPlane(){this.position.y+=-this.getBoundingBoxWorld().min.y}getBoundingBoxWorld(){return this.updateMatrixWorld(!0),vt(this.boundingBox,this.matrixWorld)}getVisibleExtent(){return this.visibleBounds.applyMatrix4(this.matrixWorld)}pick(t,i,n,o={}){return this.picker=this.picker||new W,this.picker.pick(t,i,n,[this],o)}get progress(){return this.visibleGeometry.length===0?0:this.visibleNodes.length/this.visibleGeometry.length}}const y={DATA_TYPE_DOUBLE:{ordinal:0,name:"double",size:8},DATA_TYPE_FLOAT:{ordinal:1,name:"float",size:4},DATA_TYPE_INT8:{ordinal:2,name:"int8",size:1},DATA_TYPE_UINT8:{ordinal:3,name:"uint8",size:1},DATA_TYPE_INT16:{ordinal:4,name:"int16",size:2},DATA_TYPE_UINT16:{ordinal:5,name:"uint16",size:2},DATA_TYPE_INT32:{ordinal:6,name:"int32",size:4},DATA_TYPE_UINT32:{ordinal:7,name:"uint32",size:4},DATA_TYPE_INT64:{ordinal:8,name:"int64",size:8},DATA_TYPE_UINT64:{ordinal:9,name:"uint64",size:8}};let Tt=0;for(let e in y)y[Tt]=y[e],Tt++;class N{constructor(t,i,n,o=[1/0,-1/0]){this.name=t,this.type=i,this.numElements=n,this.range=o,this.byteSize=this.numElements*this.type.size,this.description=""}}const Y={POSITION_CARTESIAN:new N("POSITION_CARTESIAN",y.DATA_TYPE_FLOAT,3),RGBA_PACKED:new N("COLOR_PACKED",y.DATA_TYPE_INT8,4),COLOR_PACKED:new N("COLOR_PACKED",y.DATA_TYPE_INT8,4),RGB_PACKED:new N("COLOR_PACKED",y.DATA_TYPE_INT8,3),NORMAL_FLOATS:new N("NORMAL_FLOATS",y.DATA_TYPE_FLOAT,3),INTENSITY:new N("INTENSITY",y.DATA_TYPE_UINT16,1),CLASSIFICATION:new N("CLASSIFICATION",y.DATA_TYPE_UINT8,1),NORMAL_SPHEREMAPPED:new N("NORMAL_SPHEREMAPPED",y.DATA_TYPE_UINT8,2),NORMAL_OCT16:new N("NORMAL_OCT16",y.DATA_TYPE_UINT8,2),NORMAL:new N("NORMAL",y.DATA_TYPE_FLOAT,3),RETURN_NUMBER:new N("RETURN_NUMBER",y.DATA_TYPE_UINT8,1),NUMBER_OF_RETURNS:new N("NUMBER_OF_RETURNS",y.DATA_TYPE_UINT8,1),SOURCE_ID:new N("SOURCE_ID",y.DATA_TYPE_UINT16,1),INDICES:new N("INDICES",y.DATA_TYPE_UINT32,1),SPACING:new N("SPACING",y.DATA_TYPE_FLOAT,1),GPS_TIME:new N("GPS_TIME",y.DATA_TYPE_DOUBLE,1)};class qt{constructor(t,i=[],n=0,o=0,r=[]){if(this.attributes=i,this.byteSize=n,this.size=o,this.vectors=r,t!=null)for(let l=0;l<t.length;l++){let d=t[l],a=Y[d];this.attributes.push(a),this.byteSize+=a.byteSize,this.size++}}add(t){this.attributes.push(t),this.byteSize+=t.byteSize,this.size++}addVector(t){this.vectors.push(t)}hasNormals(){for(let t in this.attributes){let i=this.attributes[t];if(i===Y.NORMAL_SPHEREMAPPED||i===Y.NORMAL_FLOATS||i===Y.NORMAL||i===Y.NORMAL_OCT16)return!0}return!1}}var it=(e=>(e.DECODER_WORKER_BROTLI="DECODER_WORKER_BROTLI",e.DECODER_WORKER="DECODER_WORKER",e))(it||{});function Qt(e){switch(e){case"DECODER_WORKER_BROTLI":return new Worker("/assets/brotli-decoder.worker.6a6397b9.js",{type:"module"});case"DECODER_WORKER":return new Worker("/assets/decoder.worker.5b359db1.js",{type:"module"});default:throw new Error("Unknown worker type")}}class Zt{constructor(){this.workers={DECODER_WORKER:[],DECODER_WORKER_BROTLI:[]}}getWorker(t){if(this.workers[t]===void 0)throw new Error("Unknown worker type");if(this.workers[t].length===0){let n=Qt(t);this.workers[t].push(n)}let i=this.workers[t].pop();if(i===void 0)throw new Error("No workers available");return i}returnWorker(t,i){this.workers[t].push(i)}}const wt=class{constructor(e,t,i){this.name=e,this.octreeGeometry=t,this.boundingBox=i,this.loaded=!1,this.loading=!1,this.parent=null,this.geometry=null,this.hasChildren=!1,this.isLeafNode=!0,this.isTreeNode=!1,this.isGeometryNode=!0,this.children=[null,null,null,null,null,null,null,null],this.id=wt.IDCount++,this.index=parseInt(e.charAt(e.length-1)),this.boundingSphere=i.getBoundingSphere(new s.Sphere),this.numPoints=0,this.oneTimeDisposeHandlers=[]}getLevel(){return this.level}isLoaded(){return this.loaded}getBoundingSphere(){return this.boundingSphere}getBoundingBox(){return this.boundingBox}load(){this.octreeGeometry.numNodesLoading>=this.octreeGeometry.maxNumNodesLoading||this.octreeGeometry.loader&&this.octreeGeometry.loader.load(this)}getNumPoints(){return this.numPoints}dispose(){if(this.geometry&&this.parent!=null){this.geometry.dispose(),this.geometry=null,this.loaded=!1;for(let e=0;e<this.oneTimeDisposeHandlers.length;e++)this.oneTimeDisposeHandlers[e]();this.oneTimeDisposeHandlers=[]}}traverse(e,t=!0){const i=t?[this]:[];let n;for(;(n=i.pop())!==void 0;){e(n);for(const o of n.children)o!==null&&i.push(o)}}};let Q=wt;Q.IDCount=0,Q.IDCount=0;class Jt{constructor(t,i,n){this.url=t,this.workerPool=i,this.metadata=n}async load(t){if(!(t.loaded||t.loading)){t.loading=!0,t.octreeGeometry.numNodesLoading++;try{t.nodeType===2&&await this.loadHierarchy(t);let{byteOffset:i,byteSize:n}=t;if(i===void 0||n===void 0)throw new Error("byteOffset and byteSize are required");let o=`${this.url}/../octree.bin`,r=i,l=i+n-BigInt(1),d;n===BigInt(0)?(d=new ArrayBuffer(0),console.warn(`loaded node with 0 bytes: ${t.name}`)):d=await(await fetch(o,{headers:{"content-type":"multipart/byteranges",Range:`bytes=${r}-${l}`}})).arrayBuffer();const a=this.metadata.encoding==="BROTLI"?it.DECODER_WORKER_BROTLI:it.DECODER_WORKER,c=this.workerPool.getWorker(a);c.onmessage=M=>{let S=M.data,G=S.attributeBuffers;this.workerPool.returnWorker(a,c);let H=new s.BufferGeometry;for(let R in G){let X=G[R].buffer;if(R==="position")H.setAttribute("position",new s.BufferAttribute(new Float32Array(X),3));else if(R==="rgba")H.setAttribute("rgba",new s.BufferAttribute(new Uint8Array(X),4,!0));else if(R==="NORMAL")H.setAttribute("normal",new s.BufferAttribute(new Float32Array(X),3));else if(R==="INDICES"){let K=new s.BufferAttribute(new Uint8Array(X),4);K.normalized=!0,H.setAttribute("indices",K)}else{const K=new s.BufferAttribute(new Float32Array(X),1);let Te=G[R].attribute;K.potree={offset:G[R].offset,scale:G[R].scale,preciseBuffer:G[R].preciseBuffer,range:Te.range},H.setAttribute(R,K)}}t.density=S.density,t.geometry=H,t.loaded=!0,t.loading=!1,t.octreeGeometry.numNodesLoading--};let u=t.octreeGeometry.pointAttributes,f=t.octreeGeometry.scale,v=t.boundingBox,x=t.octreeGeometry.offset.clone().add(v.min),w=v.max.clone().sub(v.min),I=x.clone().add(w),m=t.numPoints,D=t.octreeGeometry.loader.offset,E={name:t.name,buffer:d,pointAttributes:u,scale:f,min:x,max:I,size:w,offset:D,numPoints:m};c.postMessage(E,[E.buffer])}catch{t.loaded=!1,t.loading=!1,t.octreeGeometry.numNodesLoading--}}}parseHierarchy(t,i){let n=new DataView(i),o=22,r=i.byteLength/o,l=t.octreeGeometry,d=new Array(r);d[0]=t;let a=1;for(let c=0;c<r;c++){let u=d[c],f=n.getUint8(c*o+0),v=n.getUint8(c*o+1),x=n.getUint32(c*o+2,!0),w=n.getBigInt64(c*o+6,!0),I=n.getBigInt64(c*o+14,!0);if(u.nodeType===2?(u.byteOffset=w,u.byteSize=I,u.numPoints=x):f===2?(u.hierarchyByteOffset=w,u.hierarchyByteSize=I,u.numPoints=x):(u.byteOffset=w,u.byteSize=I,u.numPoints=x),u.nodeType=f,u.nodeType!==2)for(let m=0;m<8;m++){if(!((1<<m&v)!==0))continue;let E=u.name+m,M=ee(u.boundingBox,m),S=new Q(E,l,M);S.name=E,S.spacing=u.spacing/2,S.level=u.level+1,u.children[m]=S,S.parent=u,d[a]=S,a++}}}async loadHierarchy(t){let{hierarchyByteOffset:i,hierarchyByteSize:n}=t;if(i===void 0||n===void 0)throw new Error(`hierarchyByteOffset and hierarchyByteSize are undefined for node ${t.name}`);let o=`${this.url}/../hierarchy.bin`,r=i,l=r+n-BigInt(1),a=await(await fetch(o,{headers:{"content-type":"multipart/byteranges",Range:`bytes=${r}-${l}`}})).arrayBuffer();this.parseHierarchy(t,a)}}let te=new s.Vector3;function ee(e,t){let i=e.min.clone(),n=e.max.clone(),o=te.subVectors(n,i);return(t&1)>0?i.z+=o.z/2:n.z-=o.z/2,(t&2)>0?i.y+=o.y/2:n.y-=o.y/2,(t&4)>0?i.x+=o.x/2:n.x-=o.x/2,new s.Box3(i,n)}let ie={double:y.DATA_TYPE_DOUBLE,float:y.DATA_TYPE_FLOAT,int8:y.DATA_TYPE_INT8,uint8:y.DATA_TYPE_UINT8,int16:y.DATA_TYPE_INT16,uint16:y.DATA_TYPE_UINT16,int32:y.DATA_TYPE_INT32,uint32:y.DATA_TYPE_UINT32,int64:y.DATA_TYPE_INT64,uint64:y.DATA_TYPE_UINT64};class Z{constructor(){this.workerPool=new Zt}static parseAttributes(t){let i=new qt,n={rgb:"rgba"};for(const o of t){let{name:r,numElements:l,min:d,max:a}=o,c=ie[o.type],u=n[r]?n[r]:r,f=new N(u,c,l);l===1?f.range=[d[0],a[0]]:f.range=[d,a],r==="gps-time"&&typeof f.range[0]=="number"&&f.range[0]===f.range[1]&&(f.range[1]+=1),f.initialRange=f.range,i.add(f)}if(i.attributes.find(r=>r.name==="NormalX")!==void 0&&i.attributes.find(r=>r.name==="NormalY")!==void 0&&i.attributes.find(r=>r.name==="NormalZ")!==void 0){let r={name:"NORMAL",attributes:["NormalX","NormalY","NormalZ"]};i.addVector(r)}return i}async load(t,i){let o=await(await i(t)).json(),r=Z.parseAttributes(o.attributes),l=new Jt(t,this.workerPool,o);l.attributes=r,l.scale=o.scale,l.offset=o.offset;let d=new at(l,new s.Box3(new s.Vector3(...o.boundingBox.min),new s.Vector3(...o.boundingBox.max)));d.url=t,d.spacing=o.spacing,d.scale=o.scale;let a=new s.Vector3(...o.boundingBox.min),c=new s.Vector3(...o.boundingBox.max),u=new s.Box3(a,c),f=a.clone();u.min.sub(f),u.max.sub(f),d.projection=o.projection,d.boundingBox=u,d.tightBoundingBox=u.clone(),d.boundingSphere=u.getBoundingSphere(new s.Sphere),d.tightBoundingSphere=u.getBoundingSphere(new s.Sphere),d.offset=f,d.pointAttributes=Z.parseAttributes(o.attributes);let v=new Q("r",d,u);return v.level=0,v.nodeType=2,v.hierarchyByteOffset=BigInt(0),v.hierarchyByteSize=BigInt(o.hierarchy.firstChunkSize),v.spacing=d.spacing,v.byteOffset=BigInt(0),d.root=v,l.load(v),{geometry:d}}}async function ne(e,t,i){const n=await t(e),o=new Z,{geometry:r}=await o.load(n,i);return r}const A=document.createElement("canvas").getContext("webgl"),oe={SHADER_INTERPOLATION:J("EXT_frag_depth")&&nt(8),SHADER_SPLATS:J("EXT_frag_depth")&&J("OES_texture_float")&&nt(8),SHADER_EDL:J("OES_texture_float")&&nt(8),precision:se()};function J(e){return A!==null&&Boolean(A.getExtension(e))}function nt(e){return A!==null&&A.getParameter(A.MAX_VARYING_VECTORS)>=e}function se(){if(A===null)return"";const e=A.getShaderPrecisionFormat(A.VERTEX_SHADER,A.HIGH_FLOAT),t=A.getShaderPrecisionFormat(A.VERTEX_SHADER,A.MEDIUM_FLOAT),i=A.getShaderPrecisionFormat(A.FRAGMENT_SHADER,A.HIGH_FLOAT),n=A.getShaderPrecisionFormat(A.FRAGMENT_SHADER,A.MEDIUM_FLOAT),o=e&&i&&e.precision>0&&i.precision>0,r=t&&n&&t.precision>0&&n.precision>0;return o?"highp":r?"mediump":"lowp"}var z=(e=>(e[e.POSITION_CARTESIAN=0]="POSITION_CARTESIAN",e[e.COLOR_PACKED=1]="COLOR_PACKED",e[e.COLOR_FLOATS_1=2]="COLOR_FLOATS_1",e[e.COLOR_FLOATS_255=3]="COLOR_FLOATS_255",e[e.NORMAL_FLOATS=4]="NORMAL_FLOATS",e[e.FILLER=5]="FILLER",e[e.INTENSITY=6]="INTENSITY",e[e.CLASSIFICATION=7]="CLASSIFICATION",e[e.NORMAL_SPHEREMAPPED=8]="NORMAL_SPHEREMAPPED",e[e.NORMAL_OCT16=9]="NORMAL_OCT16",e[e.NORMAL=10]="NORMAL",e))(z||{});const C={DATA_TYPE_DOUBLE:{ordinal:0,size:8},DATA_TYPE_FLOAT:{ordinal:1,size:4},DATA_TYPE_INT8:{ordinal:2,size:1},DATA_TYPE_UINT8:{ordinal:3,size:1},DATA_TYPE_INT16:{ordinal:4,size:2},DATA_TYPE_UINT16:{ordinal:5,size:2},DATA_TYPE_INT32:{ordinal:6,size:4},DATA_TYPE_UINT32:{ordinal:7,size:4},DATA_TYPE_INT64:{ordinal:8,size:8},DATA_TYPE_UINT64:{ordinal:9,size:8}};function P(e,t,i){return{name:e,type:t,numElements:i,byteSize:i*t.size}}const At=P(1,C.DATA_TYPE_INT8,4),re={POSITION_CARTESIAN:P(0,C.DATA_TYPE_FLOAT,3),RGBA_PACKED:At,COLOR_PACKED:At,RGB_PACKED:P(1,C.DATA_TYPE_INT8,3),NORMAL_FLOATS:P(4,C.DATA_TYPE_FLOAT,3),FILLER_1B:P(5,C.DATA_TYPE_UINT8,1),INTENSITY:P(6,C.DATA_TYPE_UINT16,1),CLASSIFICATION:P(7,C.DATA_TYPE_UINT8,1),NORMAL_SPHEREMAPPED:P(8,C.DATA_TYPE_UINT8,2),NORMAL_OCT16:P(9,C.DATA_TYPE_UINT8,2),NORMAL:P(10,C.DATA_TYPE_FLOAT,3)};class bt{constructor(t=[]){this.attributes=[],this.byteSize=0,this.size=0;for(let i=0;i<t.length;i++){const n=t[i],o=re[n];this.attributes.push(o),this.byteSize+=o.byteSize,this.size++}}add(t){this.attributes.push(t),this.byteSize+=t.byteSize,this.size++}hasColors(){return this.attributes.find(le)!==void 0}hasNormals(){return this.attributes.find(ae)!==void 0}}function le({name:e}){return e===1}function ae({name:e}){return e===8||e===4||e===10||e===9}class F{constructor(t){this.versionMinor=0,this.version=t;const i=t.indexOf(".")===-1?t.length:t.indexOf(".");this.versionMajor=parseInt(t.substr(0,i),10),this.versionMinor=parseInt(t.substr(i+1),10),isNaN(this.versionMinor)&&(this.versionMinor=0)}newerThan(t){const i=new F(t);return this.versionMajor>i.versionMajor?!0:this.versionMajor===i.versionMajor&&this.versionMinor>i.versionMinor}equalOrHigher(t){const i=new F(t);return this.versionMajor>i.versionMajor?!0:this.versionMajor===i.versionMajor&&this.versionMinor>=i.versionMinor}upTo(t){return!this.newerThan(t)}}class de{constructor({getUrl:t=l=>Promise.resolve(l),version:i,boundingBox:n,scale:o,xhrRequest:r}){this.disposed=!1,this.workers=[],console.log([t,i,n,o,r]),typeof i=="string"?this.version=new F(i):this.version=i,this.xhrRequest=r,this.getUrl=t,this.boundingBox=n,this.scale=o,this.callbacks=[]}dispose(){this.workers.forEach(t=>t.terminate()),this.workers=[],this.disposed=!0}load(t){return t.loaded||this.disposed?Promise.resolve():Promise.resolve(this.getUrl(this.getNodeUrl(t))).then(i=>this.xhrRequest(i,{mode:"cors"})).then(i=>i.arrayBuffer()).then(i=>new Promise(n=>this.parse(t,i,n)))}getNodeUrl(t){let i=t.getUrl();return this.version.equalOrHigher("1.4")&&(i+=".bin"),i}parse(t,i,n){if(this.disposed){n();return}const o=this.getWorker(),r=t.pcoGeometry.pointAttributes,l=i.byteLength/r.byteSize;this.version.upTo("1.5")&&(t.numPoints=l),o.onmessage=a=>{if(this.disposed){n();return}const c=a.data,u=t.geometry=t.geometry||new s.BufferGeometry;u.boundingBox=t.boundingBox,this.addBufferAttributes(u,c.attributeBuffers),this.addIndices(u,c.indices),this.addNormalAttribute(u,l),t.mean=new s.Vector3().fromArray(c.mean),t.tightBoundingBox=this.getTightBoundingBox(c.tightBoundingBox),t.loaded=!0,t.loading=!1,t.failed=!1,t.pcoGeometry.numNodesLoading--,t.pcoGeometry.needsUpdate=!0,this.releaseWorker(o),this.callbacks.forEach(f=>f(t)),n()};const d={buffer:i,pointAttributes:r,version:this.version.version,min:t.boundingBox.min.toArray(),offset:t.pcoGeometry.offset.toArray(),scale:this.scale,spacing:t.spacing,hasChildren:t.hasChildren};o.postMessage(d,[d.buffer])}getWorker(){const t=this.workers.pop();return t||new Worker("/assets/binary-decoder.worker.dad39f76.js",{type:"module"})}releaseWorker(t){this.workers.push(t)}getTightBoundingBox({min:t,max:i}){const n=new s.Box3(new s.Vector3().fromArray(t),new s.Vector3().fromArray(i));return n.max.sub(n.min),n.min.set(0,0,0),n}addBufferAttributes(t,i){Object.keys(i).forEach(n=>{const o=i[n].buffer;this.isAttribute(n,z.POSITION_CARTESIAN)?t.setAttribute("position",new s.BufferAttribute(new Float32Array(o),3)):this.isAttribute(n,z.COLOR_PACKED)?t.setAttribute("color",new s.BufferAttribute(new Uint8Array(o),3,!0)):this.isAttribute(n,z.INTENSITY)?t.setAttribute("intensity",new s.BufferAttribute(new Float32Array(o),1)):this.isAttribute(n,z.CLASSIFICATION)?t.setAttribute("classification",new s.BufferAttribute(new Uint8Array(o),1)):this.isAttribute(n,z.NORMAL_SPHEREMAPPED)?t.setAttribute("normal",new s.BufferAttribute(new Float32Array(o),3)):this.isAttribute(n,z.NORMAL_OCT16)?t.setAttribute("normal",new s.BufferAttribute(new Float32Array(o),3)):this.isAttribute(n,z.NORMAL)&&t.setAttribute("normal",new s.BufferAttribute(new Float32Array(o),3))})}addIndices(t,i){const n=new s.Uint8BufferAttribute(i,4);n.normalized=!0,t.setAttribute("indices",n)}addNormalAttribute(t,i){if(!t.getAttribute("normal")){const n=new Float32Array(i*3);t.setAttribute("normal",new s.BufferAttribute(new Float32Array(n),3))}}isAttribute(t,i){return parseInt(t,10)===i}}class ce{constructor(t,i,n,o,r){this.loader=t,this.boundingBox=i,this.tightBoundingBox=n,this.offset=o,this.xhrRequest=r,this.disposed=!1,this.needsUpdate=!0,this.octreeDir="",this.hierarchyStepSize=-1,this.nodes={},this.numNodesLoading=0,this.maxNumNodesLoading=3,this.spacing=0,this.pointAttributes=new bt([]),this.projection=null,this.url=null}dispose(){this.loader.dispose(),this.root.traverse(t=>t.dispose()),this.disposed=!0}addNodeLoadedCallback(t){this.loader.callbacks.push(t)}clearNodeLoadedCallbacks(){this.loader.callbacks=[]}}const Nt=5,ot=class extends s.EventDispatcher{constructor(e,t,i){super();this.id=ot.idCount++,this.level=0,this.spacing=0,this.hasChildren=!1,this.children=[null,null,null,null,null,null,null,null],this.mean=new s.Vector3,this.numPoints=0,this.loaded=!1,this.loading=!1,this.failed=!1,this.parent=null,this.oneTimeDisposeHandlers=[],this.isLeafNode=!0,this.isTreeNode=!1,this.isGeometryNode=!0,this.name=e,this.index=tt(e),this.pcoGeometry=t,this.boundingBox=i,this.tightBoundingBox=i.clone(),this.boundingSphere=i.getBoundingSphere(new s.Sphere)}dispose(){!this.geometry||!this.parent||(this.geometry.dispose(),this.geometry=void 0,this.loaded=!1,this.oneTimeDisposeHandlers.forEach(e=>e()),this.oneTimeDisposeHandlers=[])}getUrl(){const e=this.pcoGeometry,t=e.loader.version,i=[e.octreeDir];return e.loader&&t.equalOrHigher("1.5")?(i.push(this.getHierarchyBaseUrl()),i.push(this.name)):t.equalOrHigher("1.4")?i.push(this.name):t.upTo("1.3")&&i.push(this.name),i.join("/")}getHierarchyUrl(){return`${this.pcoGeometry.octreeDir}/${this.getHierarchyBaseUrl()}/${this.name}.hrc`}addChild(e){this.children[e.index]=e,this.isLeafNode=!1,e.parent=this}traverse(e,t=!0){const i=t?[this]:[];let n;for(;(n=i.pop())!==void 0;){e(n);for(const o of n.children)o!==null&&i.push(o)}}load(){if(!this.canLoad())return Promise.resolve();this.loading=!0,this.pcoGeometry.numNodesLoading++,this.pcoGeometry.needsUpdate=!0;let e;return this.pcoGeometry.loader.version.equalOrHigher("1.5")&&this.level%this.pcoGeometry.hierarchyStepSize===0&&this.hasChildren?e=this.loadHierachyThenPoints():e=this.loadPoints(),e.catch(t=>{throw this.loading=!1,this.failed=!0,this.pcoGeometry.numNodesLoading--,t})}canLoad(){return!this.loading&&!this.loaded&&!this.pcoGeometry.disposed&&!this.pcoGeometry.loader.disposed&&this.pcoGeometry.numNodesLoading<this.pcoGeometry.maxNumNodesLoading}loadPoints(){return this.pcoGeometry.needsUpdate=!0,this.pcoGeometry.loader.load(this)}loadHierachyThenPoints(){return this.level%this.pcoGeometry.hierarchyStepSize!==0?Promise.resolve():Promise.resolve(this.pcoGeometry.loader.getUrl(this.getHierarchyUrl())).then(e=>this.pcoGeometry.xhrRequest(e,{mode:"cors"})).then(e=>e.arrayBuffer()).then(e=>this.loadHierarchy(this,e))}getHierarchyBaseUrl(){const e=this.pcoGeometry.hierarchyStepSize,t=this.name.substr(1),i=Math.floor(t.length/e);let n="r/";for(let o=0;o<i;o++)n+=`${t.substr(o*e,e)}/`;return n.slice(0,-1)}loadHierarchy(e,t){const i=new DataView(t),n=this.getNodeData(e.name,0,i);e.numPoints=n.numPoints;const o=[n],r=[];let l=Nt;for(;o.length>0;){const a=o.shift();let c=1;for(let u=0;u<8&&l+1<t.byteLength;u++){if((a.children&c)!==0){const f=this.getNodeData(a.name+u,l,i);r.push(f),o.push(f),l+=Nt}c=c*2}}e.pcoGeometry.needsUpdate=!0;const d=new Map;d.set(e.name,e),r.forEach(a=>this.addNode(a,e.pcoGeometry,d)),e.loadPoints()}getNodeData(e,t,i){const n=i.getUint8(t),o=i.getUint32(t+1,!0);return{children:n,numPoints:o,name:e}}addNode({name:e,numPoints:t,children:i},n,o){const r=tt(e),l=e.substring(0,e.length-1),d=o.get(l),a=e.length-1,c=xt(d.boundingBox,r),u=new ot(e,n,c);u.level=a,u.numPoints=t,u.hasChildren=i>0,u.spacing=n.spacing/Math.pow(2,a),d.addChild(u),o.set(e,u)}};let st=ot;st.idCount=0;function ue(e,t,i){return Promise.resolve(t(e)).then(n=>i(n,{mode:"cors"}).then(o=>o.json()).then(fe(n,t,i)))}function fe(e,t,i){return n=>{const{offset:o,boundingBox:r,tightBoundingBox:l}=he(n),d=new de({getUrl:t,version:n.version,boundingBox:r,scale:n.scale,xhrRequest:i}),a=new ce(d,r,l,o,i);a.url=e,a.octreeDir=n.octreeDir,a.needsUpdate=!0,a.spacing=n.spacing,a.hierarchyStepSize=n.hierarchyStepSize,a.projection=n.projection,a.offset=o,a.pointAttributes=new bt(n.pointAttributes),console.log(a.pointAttributes);const c={},u=new F(n.version);return pe(a,n,c,u).then(()=>(u.upTo("1.4")&&ge(a,n,c),a.nodes=c,a))}}function he(e){const t=new s.Vector3(e.boundingBox.lx,e.boundingBox.ly,e.boundingBox.lz),i=new s.Vector3(e.boundingBox.ux,e.boundingBox.uy,e.boundingBox.uz),n=new s.Box3(t,i),o=n.clone(),r=t.clone();if(e.tightBoundingBox){const{lx:l,ly:d,lz:a,ux:c,uy:u,uz:f}=e.tightBoundingBox;o.min.set(l,d,a),o.max.set(c,u,f)}return n.min.sub(r),n.max.sub(r),o.min.sub(r),o.max.sub(r),{offset:r,boundingBox:n,tightBoundingBox:o}}function pe(e,t,i,n){const o="r",r=new st(o,e,e.boundingBox);return r.hasChildren=!0,r.spacing=e.spacing,n.upTo("1.5")?r.numPoints=t.hierarchy[0][1]:r.numPoints=0,e.root=r,i[o]=r,e.root.load()}function ge(e,t,i){for(let n=1;n<t.hierarchy.length;n++){const[o,r]=t.hierarchy[n],{index:l,parentName:d,level:a}=me(o),c=i[d],u=xt(c.boundingBox,l),f=new st(o,e,u);f.level=a,f.numPoints=r,f.spacing=e.spacing/Math.pow(2,f.level),i[o]=f,c.addChild(f)}}function me(e){return{index:tt(e),parentName:e.substring(0,e.length-1),level:e.length-1}}function _e(e){return e!=null&&e.isGeometryNode}function rt(e){return e!=null&&e.isTreeNode}function Et(e){this.content=[],this.scoreFunction=e}Et.prototype={push:function(e){this.content.push(e),this.bubbleUp(this.content.length-1)},pop:function(){var e=this.content[0],t=this.content.pop();return this.content.length>0&&(this.content[0]=t,this.sinkDown(0)),e},remove:function(e){for(var t=this.content.length,i=0;i<t;i++)if(this.content[i]==e){var n=this.content.pop();if(i==t-1)break;this.content[i]=n,this.bubbleUp(i),this.sinkDown(i);break}},size:function(){return this.content.length},bubbleUp:function(e){for(var t=this.content[e],i=this.scoreFunction(t);e>0;){var n=Math.floor((e+1)/2)-1,o=this.content[n];if(i>=this.scoreFunction(o))break;this.content[n]=t,this.content[e]=o,e=n}},sinkDown:function(e){for(var t=this.content.length,i=this.content[e],n=this.scoreFunction(i);;){var o=(e+1)*2,r=o-1,l=null;if(r<t){var d=this.content[r],a=this.scoreFunction(d);a<n&&(l=r)}if(o<t){var c=this.content[o],u=this.scoreFunction(c);u<(l==null?n:a)&&(l=o)}if(l==null)break;this.content[e]=this.content[l],this.content[l]=i,e=l}}};class ye extends s.LineSegments{constructor(t,i=new s.Color(16776960)){const n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),o=new Float32Array([t.min.x,t.min.y,t.min.z,t.max.x,t.min.y,t.min.z,t.max.x,t.min.y,t.max.z,t.min.x,t.min.y,t.max.z,t.min.x,t.max.y,t.min.z,t.max.x,t.max.y,t.min.z,t.max.x,t.max.y,t.max.z,t.min.x,t.max.y,t.max.z]),r=new s.BufferGeometry;r.setIndex(new s.BufferAttribute(n,1)),r.setAttribute("position",new s.BufferAttribute(o,3));const l=new s.LineBasicMaterial({color:i});super(r,l)}}class ve{constructor(t){this.node=t,this.next=null,this.previous=null}}class xe{constructor(t=1e6){this.pointBudget=t,this.first=null,this.last=null,this.numPoints=0,this.items=new Map}get size(){return this.items.size}has(t){return this.items.has(t.id)}touch(t){if(!t.loaded)return;const i=this.items.get(t.id);i?this.touchExisting(i):this.addNew(t)}addNew(t){const i=new ve(t);i.previous=this.last,this.last=i,i.previous&&(i.previous.next=i),this.first||(this.first=i),this.items.set(t.id,i),this.numPoints+=t.numPoints}touchExisting(t){t.previous?t.next&&(t.previous.next=t.next,t.next.previous=t.previous,t.previous=this.last,t.next=null,this.last=t,t.previous&&(t.previous.next=t)):t.next&&(this.first=t.next,this.first.previous=null,t.previous=this.last,t.next=null,this.last=t,t.previous&&(t.previous.next=t))}remove(t){const i=this.items.get(t.id);!i||(this.items.size===1?(this.first=null,this.last=null):(i.previous||(this.first=i.next,this.first.previous=null),i.next||(this.last=i.previous,this.last.next=null),i.previous&&i.next&&(i.previous.next=i.next,i.next.previous=i.previous)),this.items.delete(t.id),this.numPoints-=t.numPoints)}getLRUItem(){return this.first?this.first.node:void 0}freeMemory(){if(!(this.items.size<=1))for(;this.numPoints>this.pointBudget*2;){const t=this.getLRUItem();t&&this.disposeSubtree(t)}}disposeSubtree(t){const i=[t];t.traverse(n=>{n.loaded&&i.push(n)});for(const n of i)n.dispose(),this.remove(n)}}class lt{constructor(t,i,n,o){this.pointCloudIndex=t,this.weight=i,this.node=n,this.parent=o}}class j{constructor(){this._pointBudget=Ot,this._rendererSize=new s.Vector2,this.maxNumNodesLoading=Ct,this.features=oe,this.lru=new xe(this._pointBudget),this.updateVisibilityStructures=(()=>{const t=new s.Matrix4,i=new s.Matrix4,n=new s.Matrix4;return(o,r)=>{var c;const l=[],d=[],a=new Et(u=>1/u.weight);for(let u=0;u<o.length;u++){const f=o[u];if(!f.initialized())continue;f.numVisiblePoints=0,f.visibleNodes=[],f.visibleGeometry=[],r.updateMatrixWorld(!1);const v=r.matrixWorldInverse,x=f.matrixWorld;if(t.identity().multiply(r.projectionMatrix).multiply(v).multiply(x),l.push(new s.Frustum().setFromProjectionMatrix(t)),i.copy(x).invert(),n.identity().multiply(i).multiply(r.matrixWorld),d.push(new s.Vector3().setFromMatrixPosition(n)),f.visible&&f.root!==null){const w=Number.MAX_VALUE;a.push(new lt(u,w,f.root))}rt(f.root)&&f.hideDescendants((c=f==null?void 0:f.root)==null?void 0:c.sceneNode);for(const w of f.boundingBoxNodes)w.visible=!1}return{frustums:l,cameraPositions:d,priorityQueue:a}}})()}async loadPointCloud(t,i,n=(o,r)=>fetch(o,r)){if(t==="cloud.js")return await ue(t,i,n).then(o=>new et(this,o));if(t==="metadata.json")return await ne(t,i,n).then(o=>new et(this,o));throw new Error("Unsupported file type")}updatePointClouds(t,i,n){const o=this.updateVisibility(t,i,n);for(let r=0;r<t.length;r++){const l=t[r];l.disposed||(l.material.updateMaterial(l,l.visibleNodes,i,n),l.updateVisibleBounds(),l.updateBoundingBoxes())}return this.lru.freeMemory(),o}static pick(t,i,n,o,r={}){return j.picker=j.picker||new W,j.picker.pick(i,n,o,t,r)}get pointBudget(){return this._pointBudget}set pointBudget(t){t!==this._pointBudget&&(this._pointBudget=t,this.lru.pointBudget=t,this.lru.freeMemory())}updateVisibility(t,i,n){let o=0;const r=[],l=[],{frustums:d,cameraPositions:a,priorityQueue:c}=this.updateVisibilityStructures(t,i);let u=0,f=!1,v=!1,x;for(;(x=c.pop())!==void 0;){let m=x.node;if(o+m.numPoints>this.pointBudget)break;const D=x.pointCloudIndex,E=t[D],M=E.maxLevel!==void 0?E.maxLevel:1/0;if(m.level>M||!d[D].intersectsBox(m.boundingBox)||this.shouldClip(E,m.boundingBox))continue;o+=m.numPoints,E.numVisiblePoints+=m.numPoints;const S=x.parent;if(_e(m)&&(!S||rt(S)))if(m.loaded&&u<ft)m=E.toTreeNode(m,S),u++;else if(!m.failed)m.loaded&&u>=ft&&(f=!0),l.push(m),E.visibleGeometry.push(m);else{v=!0;continue}rt(m)&&(this.updateTreeNodeVisibility(E,m,r),E.visibleGeometry.push(m.geometryNode));const G=.5*n.getSize(this._rendererSize).height*n.getPixelRatio();this.updateChildVisibility(x,c,E,m,a[D],i,G)}const w=Math.min(this.maxNumNodesLoading,l.length),I=[];for(let m=0;m<w;m++)I.push(l[m].load());return{visibleNodes:r,numVisiblePoints:o,exceededMaxLoadsToGPU:f,nodeLoadFailed:v,nodeLoadPromises:I}}updateTreeNodeVisibility(t,i,n){this.lru.touch(i.geometryNode);const o=i.sceneNode;o.visible=!0,o.material=t.material,o.updateMatrix(),o.matrixWorld.multiplyMatrices(t.matrixWorld,o.matrix),n.push(i),t.visibleNodes.push(i),this.updateBoundingBoxVisibility(t,i)}updateChildVisibility(t,i,n,o,r,l,d){const a=o.children;for(let c=0;c<a.length;c++){const u=a[c];if(u===null)continue;const f=u.boundingSphere,v=f.center.distanceTo(r),x=f.radius;let w=0;if(l.type===ht){const E=l.fov*Math.PI/180,M=Math.tan(E/2);w=d/(M*v)}else{const D=l;w=2*d/(D.top-D.bottom)}const I=x*w;if(I<n.minNodePixelSize)continue;const m=v<x?Number.MAX_VALUE:I+1/v;i.push(new lt(t.pointCloudIndex,m,u,o))}}updateBoundingBoxVisibility(t,i){if(t.showBoundingBox&&!i.boundingBoxNode){const n=new ye(i.boundingBox);n.matrixAutoUpdate=!1,t.boundingBoxNodes.push(n),i.boundingBoxNode=n,i.boundingBoxNode.matrix.copy(t.matrixWorld)}else t.showBoundingBox&&i.boundingBoxNode?(i.boundingBoxNode.visible=!0,i.boundingBoxNode.matrix.copy(t.matrixWorld)):!t.showBoundingBox&&i.boundingBoxNode&&(i.boundingBoxNode.visible=!1)}shouldClip(t,i){const n=t.material;if(n.numClipBoxes===0||n.clipMode!==L.CLIP_OUTSIDE)return!1;const o=i.clone();t.updateMatrixWorld(!0),o.applyMatrix4(t.matrixWorld);const r=n.clipBoxes;for(let l=0;l<r.length;l++){const d=r[l].matrix,a=new s.Box3(new s.Vector3(-.5,-.5,-.5),new s.Vector3(.5,.5,.5)).applyMatrix4(d);if(o.intersectsBox(a))return!1}return!0}}O.PointCloudOctree=et,O.Potree=j,O.QueueItem=lt,O.Version=F,Object.defineProperties(O,{__esModule:{value:!0},[Symbol.toStringTag]:{value:"Module"}})});
