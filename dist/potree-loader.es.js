import { Sphere, Color, Vector4, DataTexture, RGBAFormat, NearestFilter, CanvasTexture, LinearFilter, Vector3, RawShaderMaterial, Texture, NoBlending, LessEqualDepth, AdditiveBlending, WebGLRenderTarget, EventDispatcher, BufferGeometry, Points, Scene, Object3D, Box3, BufferAttribute, Uint8BufferAttribute, LineSegments, LineBasicMaterial, Vector2, Matrix4, Frustum } from "three";
class OctreeGeometry {
  constructor(loader, boundingBox) {
    this.loader = loader;
    this.boundingBox = boundingBox;
    this.url = null;
    this.pointAttributes = null;
    this.spacing = 0;
    this.numNodesLoading = 0;
    this.maxNumNodesLoading = 3;
    this.disposed = false;
    this.tightBoundingBox = this.boundingBox.clone();
    this.boundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
    this.tightBoundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
  }
  dispose() {
    this.root.traverse((node) => node.dispose());
    this.disposed = true;
  }
}
const DEFAULT_RGB_BRIGHTNESS = 0;
const DEFAULT_RGB_CONTRAST = 0;
const DEFAULT_RGB_GAMMA = 1;
const DEFAULT_MAX_POINT_SIZE = 50;
const DEFAULT_MIN_NODE_PIXEL_SIZE = 50;
const DEFAULT_MIN_POINT_SIZE = 2;
const DEFAULT_PICK_WINDOW_SIZE = 15;
const DEFAULT_POINT_BUDGET = 1e6;
const MAX_LOADS_TO_GPU = 2;
const MAX_NUM_NODES_LOADING = 4;
const PERSPECTIVE_CAMERA = "PerspectiveCamera";
const COLOR_BLACK = new Color(0, 0, 0);
const DEFAULT_HIGHLIGHT_COLOR = new Vector4(1, 0, 0, 1);
var ClipMode = /* @__PURE__ */ ((ClipMode2) => {
  ClipMode2[ClipMode2["DISABLED"] = 0] = "DISABLED";
  ClipMode2[ClipMode2["CLIP_OUTSIDE"] = 1] = "CLIP_OUTSIDE";
  ClipMode2[ClipMode2["HIGHLIGHT_INSIDE"] = 2] = "HIGHLIGHT_INSIDE";
  return ClipMode2;
})(ClipMode || {});
var PointSizeType = /* @__PURE__ */ ((PointSizeType2) => {
  PointSizeType2[PointSizeType2["FIXED"] = 0] = "FIXED";
  PointSizeType2[PointSizeType2["ATTENUATED"] = 1] = "ATTENUATED";
  PointSizeType2[PointSizeType2["ADAPTIVE"] = 2] = "ADAPTIVE";
  return PointSizeType2;
})(PointSizeType || {});
var PointShape = /* @__PURE__ */ ((PointShape2) => {
  PointShape2[PointShape2["SQUARE"] = 0] = "SQUARE";
  PointShape2[PointShape2["CIRCLE"] = 1] = "CIRCLE";
  PointShape2[PointShape2["PARABOLOID"] = 2] = "PARABOLOID";
  return PointShape2;
})(PointShape || {});
var TreeType = /* @__PURE__ */ ((TreeType2) => {
  TreeType2[TreeType2["OCTREE"] = 0] = "OCTREE";
  TreeType2[TreeType2["KDTREE"] = 1] = "KDTREE";
  return TreeType2;
})(TreeType || {});
var PointOpacityType = /* @__PURE__ */ ((PointOpacityType2) => {
  PointOpacityType2[PointOpacityType2["FIXED"] = 0] = "FIXED";
  PointOpacityType2[PointOpacityType2["ATTENUATED"] = 1] = "ATTENUATED";
  return PointOpacityType2;
})(PointOpacityType || {});
var PointColorType = /* @__PURE__ */ ((PointColorType2) => {
  PointColorType2[PointColorType2["RGB"] = 0] = "RGB";
  PointColorType2[PointColorType2["COLOR"] = 1] = "COLOR";
  PointColorType2[PointColorType2["DEPTH"] = 2] = "DEPTH";
  PointColorType2[PointColorType2["HEIGHT"] = 3] = "HEIGHT";
  PointColorType2[PointColorType2["ELEVATION"] = 3] = "ELEVATION";
  PointColorType2[PointColorType2["INTENSITY"] = 4] = "INTENSITY";
  PointColorType2[PointColorType2["INTENSITY_GRADIENT"] = 5] = "INTENSITY_GRADIENT";
  PointColorType2[PointColorType2["LOD"] = 6] = "LOD";
  PointColorType2[PointColorType2["LEVEL_OF_DETAIL"] = 6] = "LEVEL_OF_DETAIL";
  PointColorType2[PointColorType2["POINT_INDEX"] = 7] = "POINT_INDEX";
  PointColorType2[PointColorType2["CLASSIFICATION"] = 8] = "CLASSIFICATION";
  PointColorType2[PointColorType2["RETURN_NUMBER"] = 9] = "RETURN_NUMBER";
  PointColorType2[PointColorType2["SOURCE"] = 10] = "SOURCE";
  PointColorType2[PointColorType2["NORMAL"] = 11] = "NORMAL";
  PointColorType2[PointColorType2["PHONG"] = 12] = "PHONG";
  PointColorType2[PointColorType2["RGB_HEIGHT"] = 13] = "RGB_HEIGHT";
  PointColorType2[PointColorType2["COMPOSITE"] = 50] = "COMPOSITE";
  return PointColorType2;
})(PointColorType || {});
var VertShader = "#version 300 es\n\nprecision highp float;\nprecision highp int;\n\n#define max_clip_boxes 30\n\nin vec3 position;\nin vec3 normal;\nin float intensity;\nin float classification;\nin float returnNumber;\nin float numberOfReturns;\nin float pointSourceID;\nin vec4 indices;\n\nuniform mat4 modelMatrix;\nuniform mat4 modelViewMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewMatrix;\nuniform mat3 normalMatrix;\n\nuniform float pcIndex;\n\nuniform float screenWidth;\nuniform float screenHeight;\nuniform float fov;\nuniform float spacing;\n\n#if defined use_clip_box\n	uniform mat4 clipBoxes[max_clip_boxes];\n#endif\n\nuniform float heightMin;\nuniform float heightMax;\nuniform float size; \nuniform float minSize; \nuniform float maxSize; \nuniform float octreeSize;\nuniform vec3 bbSize;\nuniform vec3 uColor;\nuniform float opacity;\nuniform float clipBoxCount;\nuniform float level;\nuniform float vnStart;\nuniform bool isLeafNode;\n\nuniform float filterByNormalThreshold;\nuniform vec2 intensityRange;\nuniform float opacityAttenuation;\nuniform float intensityGamma;\nuniform float intensityContrast;\nuniform float intensityBrightness;\nuniform float rgbGamma;\nuniform float rgbContrast;\nuniform float rgbBrightness;\nuniform float transition;\nuniform float wRGB;\nuniform float wIntensity;\nuniform float wElevation;\nuniform float wClassification;\nuniform float wReturnNumber;\nuniform float wSourceID;\n\nuniform sampler2D visibleNodes;\nuniform sampler2D gradient;\nuniform sampler2D classificationLUT;\nuniform sampler2D depthMap;\n\n#ifdef highlight_point\n	uniform vec3 highlightedPointCoordinate;\n	uniform bool enablePointHighlighting;\n	uniform float highlightedPointScale;\n#endif\n\n#ifdef new_format\n	in vec4 rgba;\n	out vec4 vColor;\n#else\n	in vec3 color;\n	out vec3 vColor;\n#endif\n\n#if !defined(color_type_point_index)\n	out float vOpacity;\n#endif\n\n#if defined(weighted_splats)\n	out float vLinearDepth;\n#endif\n\n#if !defined(paraboloid_point_shape) && defined(use_edl)\n	out float vLogDepth;\n#endif\n\n#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0) || defined(paraboloid_point_shape)\n	out vec3 vViewPosition;\n#endif\n\n#if defined(weighted_splats) || defined(paraboloid_point_shape)\n	out float vRadius;\n#endif\n\n#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0)\n	out vec3 vNormal;\n#endif\n\n#ifdef highlight_point\n	out float vHighlight;\n#endif\n \n\n#if (defined(adaptive_point_size) || defined(color_type_lod)) && defined(tree_type_octree)\n\n/**\n * Rounds the specified number to the closest integer.\n */\nfloat round(float number){\n	return floor(number + 0.5);\n}\n\n/**\n * Gets the number of 1-bits up to inclusive index position.\n * \n * number is treated as if it were an integer in the range 0-255\n */\nint numberOfOnes(int number, int index) {\n	int numOnes = 0;\n	int tmp = 128;\n	for (int i = 7; i >= 0; i--) {\n\n		if (number >= tmp) {\n			number = number - tmp;\n\n			if (i <= index) {\n				numOnes++;\n			}\n		}\n\n		tmp = tmp / 2;\n	}\n\n	return numOnes;\n}\n\n/**\n * Checks whether the bit at index is 1.0\n *\n * number is treated as if it were an integer in the range 0-255\n */\nbool isBitSet(int number, int index){\n\n	\n	int powi = 1;\n	if (index == 0) {\n		powi = 1;\n	} else if (index == 1) {\n		powi = 2;\n	} else if (index == 2) {\n		powi = 4;\n	} else if (index == 3) {\n		powi = 8;\n	} else if (index == 4) {\n		powi = 16;\n	} else if (index == 5) {\n		powi = 32;\n	} else if (index == 6) {\n		powi = 64;\n	} else if (index == 7) {\n		powi = 128;\n	}\n\n	int ndp = number / powi;\n\n	return mod(float(ndp), 2.0) != 0.0;\n}\n\n/**\n * Gets the the LOD at the point position.\n */\nfloat getLOD() {\n	vec3 offset = vec3(0.0, 0.0, 0.0);\n	int iOffset = int(vnStart);\n	float depth = level;\n\n	for (float i = 0.0; i <= 30.0; i++) {\n		float nodeSizeAtLevel = octreeSize  / pow(2.0, i + level + 0.0);\n		\n		vec3 index3d = (position-offset) / nodeSizeAtLevel;\n		index3d = floor(index3d + 0.5);\n		int index = int(round(4.0 * index3d.x + 2.0 * index3d.y + index3d.z));\n		\n		vec4 value = texture(visibleNodes, vec2(float(iOffset) / 2048.0, 0.0));\n		int mask = int(round(value.r * 255.0));\n\n		if (isBitSet(mask, index)) {\n			\n			int advanceG = int(round(value.g * 255.0)) * 256;\n			int advanceB = int(round(value.b * 255.0));\n			int advanceChild = numberOfOnes(mask, index - 1);\n			int advance = advanceG + advanceB + advanceChild;\n\n			iOffset = iOffset + advance;\n\n			depth++;\n		} else {\n			return value.a * 255.0; \n		}\n		\n		offset = offset + (vec3(1.0, 1.0, 1.0) * nodeSizeAtLevel * 0.5) * index3d;  \n	}\n		\n	return depth;\n}\n\nfloat getPointSizeAttenuation() {\n	return 0.5 * pow(2.0, getLOD());\n}\n\n#endif\n\n#if (defined(adaptive_point_size) || defined(color_type_lod)) && defined(tree_type_kdtree)\n\nfloat getLOD() {\n	vec3 offset = vec3(0.0, 0.0, 0.0);\n	float intOffset = 0.0;\n	float depth = 0.0;\n			\n	vec3 size = bbSize;	\n	vec3 pos = position;\n		\n	for (float i = 0.0; i <= 1000.0; i++) {\n		\n		vec4 value = texture(visibleNodes, vec2(intOffset / 2048.0, 0.0));\n		\n		int children = int(value.r * 255.0);\n		float next = value.g * 255.0;\n		int split = int(value.b * 255.0);\n		\n		if (next == 0.0) {\n		 	return depth;\n		}\n		\n		vec3 splitv = vec3(0.0, 0.0, 0.0);\n		if (split == 1) {\n			splitv.x = 1.0;\n		} else if (split == 2) {\n		 	splitv.y = 1.0;\n		} else if (split == 4) {\n		 	splitv.z = 1.0;\n		}\n		\n		intOffset = intOffset + next;\n		\n		float factor = length(pos * splitv / size);\n		if (factor < 0.5) {\n		 	\n			if (children == 0 || children == 2) {\n				return depth;\n			}\n		} else {\n			\n			pos = pos - size * splitv * 0.5;\n			if (children == 0 || children == 1) {\n				return depth;\n			}\n			if (children == 3) {\n				intOffset = intOffset + 1.0;\n			}\n		}\n		size = size * ((1.0 - (splitv + 1.0) / 2.0) + 0.5);\n		\n		depth++;\n	}\n		\n		\n	return depth;	\n}\n\nfloat getPointSizeAttenuation() {\n	return 0.5 * pow(1.3, getLOD());\n}\n\n#endif\n\nfloat getContrastFactor(float contrast) {\n	return (1.0158730158730156 * (contrast + 1.0)) / (1.0158730158730156 - contrast);\n}\n\n#ifndef new_format\n\nvec3 getRGB() {\n	#if defined(use_rgb_gamma_contrast_brightness)\n	  vec3 rgb = color;\n		rgb = pow(rgb, vec3(rgbGamma));\n		rgb = rgb + rgbBrightness;\n		rgb = (rgb - 0.5) * getContrastFactor(rgbContrast) + 0.5;\n		rgb = clamp(rgb, 0.0, 1.0);\n		return rgb;\n	#else\n		return color;\n	#endif\n}\n\n#endif\n\nfloat getIntensity() {\n	float w = (intensity - intensityRange.x) / (intensityRange.y - intensityRange.x);\n	w = pow(w, intensityGamma);\n	w = w + intensityBrightness;\n	w = (w - 0.5) * getContrastFactor(intensityContrast) + 0.5;\n	w = clamp(w, 0.0, 1.0);\n	\n	return w;\n}\n\nvec3 getElevation() {\n	vec4 world = modelMatrix * vec4( position, 1.0 );\n	float w = (world.z - heightMin) / (heightMax-heightMin);\n	vec3 cElevation = texture(gradient, vec2(w,1.0-w)).rgb;\n	\n	return cElevation;\n}\n\nvec4 getClassification() {\n	vec2 uv = vec2(classification / 255.0, 0.5);\n	vec4 classColor = texture(classificationLUT, uv);\n	\n	return classColor;\n}\n\nvec3 getReturnNumber() {\n	if (numberOfReturns == 1.0) {\n		return vec3(1.0, 1.0, 0.0);\n	} else {\n		if (returnNumber == 1.0) {\n			return vec3(1.0, 0.0, 0.0);\n		} else if (returnNumber == numberOfReturns) {\n			return vec3(0.0, 0.0, 1.0);\n		} else {\n			return vec3(0.0, 1.0, 0.0);\n		}\n	}\n}\n\nvec3 getSourceID() {\n	float w = mod(pointSourceID, 10.0) / 10.0;\n	return texture(gradient, vec2(w, 1.0 - w)).rgb;\n}\n\n#ifndef new_format\n\nvec3 getCompositeColor() {\n	vec3 c;\n	float w;\n\n	c += wRGB * getRGB();\n	w += wRGB;\n	\n	c += wIntensity * getIntensity() * vec3(1.0, 1.0, 1.0);\n	w += wIntensity;\n	\n	c += wElevation * getElevation();\n	w += wElevation;\n	\n	c += wReturnNumber * getReturnNumber();\n	w += wReturnNumber;\n	\n	c += wSourceID * getSourceID();\n	w += wSourceID;\n	\n	vec4 cl = wClassification * getClassification();\n	c += cl.a * cl.rgb;\n	w += wClassification * cl.a;\n\n	c = c / w;\n	\n	if (w == 0.0) {\n		gl_Position = vec4(100.0, 100.0, 100.0, 0.0);\n	}\n	\n	return c;\n}\n\n#endif\n\nvoid main() {\n	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);\n\n	gl_Position = projectionMatrix * mvPosition;\n\n	#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0) || defined(paraboloid_point_shape)\n		vViewPosition = mvPosition.xyz;\n	#endif\n\n	#if defined weighted_splats\n		vLinearDepth = gl_Position.w;\n	#endif\n\n	#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0)\n		vNormal = normalize(normalMatrix * normal);\n	#endif\n\n	#if !defined(paraboloid_point_shape) && defined(use_edl)\n		vLogDepth = log2(-mvPosition.z);\n	#endif\n\n	\n	\n	\n\n	float pointSize = 1.0;\n	float slope = tan(fov / 2.0);\n	float projFactor =  -0.5 * screenHeight / (slope * mvPosition.z);\n\n	#if defined fixed_point_size\n		pointSize = size;\n	#elif defined attenuated_point_size\n		pointSize = size * spacing * projFactor;\n	#elif defined adaptive_point_size\n		float worldSpaceSize = 2.0 * size * spacing / getPointSizeAttenuation();\n		pointSize = worldSpaceSize * projFactor;\n	#endif\n\n	pointSize = max(minSize, pointSize);\n	pointSize = min(maxSize, pointSize);\n\n	#if defined(weighted_splats) || defined(paraboloid_point_shape)\n		vRadius = pointSize / projFactor;\n	#endif\n\n	gl_PointSize = pointSize;\n\n	\n	\n	\n\n	#ifdef highlight_point\n		vec4 mPosition = modelMatrix * vec4(position, 1.0);\n		if (enablePointHighlighting && abs(mPosition.x - highlightedPointCoordinate.x) < 0.0001 &&\n			abs(mPosition.y - highlightedPointCoordinate.y) < 0.0001 &&\n			abs(mPosition.z - highlightedPointCoordinate.z) < 0.0001) {\n			vHighlight = 1.0;\n			gl_PointSize = pointSize * highlightedPointScale;\n		} else {\n			vHighlight = 0.0;\n		}\n	#endif\n\n	\n	\n	\n\n	#ifndef color_type_point_index\n		#ifdef attenuated_opacity\n			vOpacity = opacity * exp(-length(-mvPosition.xyz) / opacityAttenuation);\n		#else\n			vOpacity = opacity;\n		#endif\n	#endif\n\n	\n	\n	\n\n	#ifdef use_filter_by_normal\n		if(abs((modelViewMatrix * vec4(normal, 0.0)).z) > filterByNormalThreshold) {\n			\n			gl_Position = vec4(0.0, 0.0, 2.0, 1.0);\n		}\n	#endif\n\n	\n	\n	\n	#ifdef new_format\n		vColor = rgba;\n	#elif defined color_type_rgb\n		vColor = getRGB();\n	#elif defined color_type_height\n		vColor = getElevation();\n	#elif defined color_type_rgb_height\n		vec3 cHeight = getElevation();\n		vColor = (1.0 - transition) * getRGB() + transition * cHeight;\n	#elif defined color_type_depth\n		float linearDepth = -mvPosition.z ;\n		float expDepth = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;\n		vColor = vec3(linearDepth, expDepth, 0.0);\n	#elif defined color_type_intensity\n		float w = getIntensity();\n		vColor = vec3(w, w, w);\n	#elif defined color_type_intensity_gradient\n		float w = getIntensity();\n		vColor = texture(gradient, vec2(w, 1.0 - w)).rgb;\n	#elif defined color_type_color\n		vColor = uColor;\n	#elif defined color_type_lod\n	float w = getLOD() / 10.0;\n	vColor = texture(gradient, vec2(w, 1.0 - w)).rgb;\n	#elif defined color_type_point_index\n		vColor = indices.rgb;\n	#elif defined color_type_classification\n	  vec4 cl = getClassification(); \n		vColor = cl.rgb;\n	#elif defined color_type_return_number\n		vColor = getReturnNumber();\n	#elif defined color_type_source\n		vColor = getSourceID();\n	#elif defined color_type_normal\n		vColor = (modelMatrix * vec4(normal, 0.0)).xyz;\n	#elif defined color_type_phong\n		vColor = color;\n	#elif defined color_type_composite\n		vColor = getCompositeColor();\n	#endif\n	\n	#if !defined color_type_composite && defined color_type_classification\n		if (cl.a == 0.0) {\n			gl_Position = vec4(100.0, 100.0, 100.0, 0.0);\n			return;\n		}\n	#endif\n\n	\n	\n	\n\n	#if defined use_clip_box\n		bool insideAny = false;\n		for (int i = 0; i < max_clip_boxes; i++) {\n			if (i == int(clipBoxCount)) {\n				break;\n			}\n		\n			vec4 clipPosition = clipBoxes[i] * modelMatrix * vec4(position, 1.0);\n			bool inside = -0.5 <= clipPosition.x && clipPosition.x <= 0.5;\n			inside = inside && -0.5 <= clipPosition.y && clipPosition.y <= 0.5;\n			inside = inside && -0.5 <= clipPosition.z && clipPosition.z <= 0.5;\n			insideAny = insideAny || inside;\n		}\n\n		if (!insideAny) {\n			#if defined clip_outside\n				gl_Position = vec4(1000.0, 1000.0, 1000.0, 1.0);\n			#elif defined clip_highlight_inside && !defined(color_type_depth)\n				float c = (vColor.r + vColor.g + vColor.b) / 6.0;\n			#endif\n		} else {\n			#if defined clip_highlight_inside\n				vColor.r += 0.5;\n			#endif\n		}\n	#endif\n}";
var FragShader = "#version 300 es\n\nprecision highp float;\nprecision highp int;\n\nuniform mat4 viewMatrix;\nuniform vec3 cameraPosition;\n\nuniform mat4 projectionMatrix;\nuniform float opacity;\n\nuniform float blendHardness;\nuniform float blendDepthSupplement;\nuniform float fov;\nuniform float spacing;\nuniform float pcIndex;\nuniform float screenWidth;\nuniform float screenHeight;\n\nuniform sampler2D depthMap;\n\nout vec4 fragColor;\n\n#ifdef highlight_point\n	uniform vec4 highlightedPointColor;\n#endif\n\n#ifdef new_format\n	in vec4 vColor;\n#else\n	in vec3 vColor;\n#endif\n\n#if !defined(color_type_point_index)\n	in float vOpacity;\n#endif\n\n#if defined(weighted_splats)\n	in float vLinearDepth;\n#endif\n\n#if !defined(paraboloid_point_shape) && defined(use_edl)\n	in float vLogDepth;\n#endif\n\n#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0) || defined(paraboloid_point_shape)\n	in vec3 vViewPosition;\n#endif\n\n#if defined(weighted_splats) || defined(paraboloid_point_shape)\n	in float vRadius;\n#endif\n\n#if defined(color_type_phong) && (MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0)\n	in vec3 vNormal;\n#endif\n\n#ifdef highlight_point\n	in float vHighlight;\n#endif\n\nfloat specularStrength = 1.0;\n\nvoid main() {\n\n	#ifdef new_format\n		\n		vec3 actualColor = vColor.xyz;\n	#else\n		\n		vec3 actualColor = vColor;\n	#endif\n	\n	vec3 color = actualColor;\n	float depth = gl_FragCoord.z;\n\n	#if defined(circle_point_shape) || defined(paraboloid_point_shape) || defined (weighted_splats)\n		float u = 2.0 * gl_PointCoord.x - 1.0;\n		float v = 2.0 * gl_PointCoord.y - 1.0;\n	#endif\n	\n	#if defined(circle_point_shape) || defined (weighted_splats)\n		float cc = u*u + v*v;\n		if(cc > 1.0){\n			discard;\n		}\n	#endif\n\n	#if defined weighted_splats\n		vec2 uv = gl_FragCoord.xy / vec2(screenWidth, screenHeight);\n		float sDepth = texture2D(depthMap, uv).r;\n		if(vLinearDepth > sDepth + vRadius + blendDepthSupplement){\n			discard;\n		}\n	#endif\n		\n	#if defined color_type_point_index\n		fragColor = vec4(color, pcIndex / 255.0);\n	#else\n		fragColor = vec4(color, vOpacity);\n	#endif\n\n	#if defined(color_type_phong)\n		#if MAX_POINT_LIGHTS > 0 || MAX_DIR_LIGHTS > 0\n			vec3 normal = normalize( vNormal );\n			normal.z = abs(normal.z);\n\n			vec3 viewPosition = normalize( vViewPosition );\n		#endif\n\n		\n	\n		#if MAX_POINT_LIGHTS > 0\n\n			vec3 pointDiffuse = vec3( 0.0 );\n			vec3 pointSpecular = vec3( 0.0 );\n\n			for ( int i = 0; i < MAX_POINT_LIGHTS; i ++ ) {\n\n				vec4 lPosition = viewMatrix * vec4( pointLightPosition[ i ], 1.0 );\n				vec3 lVector = lPosition.xyz + vViewPosition.xyz;\n\n				float lDistance = 1.0;\n				if ( pointLightDistance[ i ] > 0.0 )\n					lDistance = 1.0 - min( ( length( lVector ) / pointLightDistance[ i ] ), 1.0 );\n\n				lVector = normalize( lVector );\n\n						\n\n				float dotProduct = dot( normal, lVector );\n\n				#ifdef WRAP_AROUND\n\n					float pointDiffuseWeightFull = max( dotProduct, 0.0 );\n					float pointDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );\n\n					vec3 pointDiffuseWeight = mix( vec3( pointDiffuseWeightFull ), vec3( pointDiffuseWeightHalf ), wrapRGB );\n\n				#else\n\n					float pointDiffuseWeight = max( dotProduct, 0.0 );\n\n				#endif\n\n				pointDiffuse += diffuse * pointLightColor[ i ] * pointDiffuseWeight * lDistance;\n\n				\n\n				vec3 pointHalfVector = normalize( lVector + viewPosition );\n				float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );\n				float pointSpecularWeight = specularStrength * max( pow( pointDotNormalHalf, shininess ), 0.0 );\n\n				float specularNormalization = ( shininess + 2.0 ) / 8.0;\n\n				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( lVector, pointHalfVector ), 0.0 ), 5.0 );\n				pointSpecular += schlick * pointLightColor[ i ] * pointSpecularWeight * pointDiffuseWeight * lDistance * specularNormalization;\n				pointSpecular = vec3(0.0, 0.0, 0.0);\n			}\n		\n		#endif\n		\n		#if MAX_DIR_LIGHTS > 0\n\n			vec3 dirDiffuse = vec3( 0.0 );\n			vec3 dirSpecular = vec3( 0.0 );\n\n			for( int i = 0; i < MAX_DIR_LIGHTS; i ++ ) {\n\n				vec4 lDirection = viewMatrix * vec4( directionalLightDirection[ i ], 0.0 );\n				vec3 dirVector = normalize( lDirection.xyz );\n\n						\n\n				float dotProduct = dot( normal, dirVector );\n\n				#ifdef WRAP_AROUND\n\n					float dirDiffuseWeightFull = max( dotProduct, 0.0 );\n					float dirDiffuseWeightHalf = max( 0.5 * dotProduct + 0.5, 0.0 );\n\n					vec3 dirDiffuseWeight = mix( vec3( dirDiffuseWeightFull ), vec3( dirDiffuseWeightHalf ), wrapRGB );\n\n				#else\n\n					float dirDiffuseWeight = max( dotProduct, 0.0 );\n\n				#endif\n\n				dirDiffuse += diffuse * directionalLightColor[ i ] * dirDiffuseWeight;\n\n				\n\n				vec3 dirHalfVector = normalize( dirVector + viewPosition );\n				float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );\n				float dirSpecularWeight = specularStrength * max( pow( dirDotNormalHalf, shininess ), 0.0 );\n\n				float specularNormalization = ( shininess + 2.0 ) / 8.0;\n\n				vec3 schlick = specular + vec3( 1.0 - specular ) * pow( max( 1.0 - dot( dirVector, dirHalfVector ), 0.0 ), 5.0 );\n				dirSpecular += schlick * directionalLightColor[ i ] * dirSpecularWeight * dirDiffuseWeight * specularNormalization;\n			}\n\n		#endif\n		\n		vec3 totalDiffuse = vec3( 0.0 );\n		vec3 totalSpecular = vec3( 0.0 );\n		\n		#if MAX_POINT_LIGHTS > 0\n\n			totalDiffuse += pointDiffuse;\n			totalSpecular += pointSpecular;\n\n		#endif\n		\n		#if MAX_DIR_LIGHTS > 0\n\n			totalDiffuse += dirDiffuse;\n			totalSpecular += dirSpecular;\n\n		#endif\n		\n		gl_FragColor.xyz = gl_FragColor.xyz * ( emissive + totalDiffuse + ambientLightColor * ambient ) + totalSpecular;\n\n	#endif\n	\n	#if defined weighted_splats\n	    \n		\n		float wx = 2.0 * length(2.0 * gl_PointCoord - 1.0);\n		float w = exp(-wx * wx * 0.5);\n		\n		\n		\n		\n		gl_FragColor.rgb = gl_FragColor.rgb * w;\n		gl_FragColor.a = w;\n	#endif\n	\n	#if defined paraboloid_point_shape\n		float wi = 0.0 - ( u*u + v*v);\n		vec4 pos = vec4(vViewPosition, 1.0);\n		pos.z += wi * vRadius;\n		float linearDepth = -pos.z;\n		pos = projectionMatrix * pos;\n		pos = pos / pos.w;\n		float expDepth = pos.z;\n		depth = (pos.z + 1.0) / 2.0;\n		gl_FragDepth = depth;\n		\n		#if defined(color_type_depth)\n			gl_FragColor.r = linearDepth;\n			gl_FragColor.g = expDepth;\n		#endif\n		\n		#if defined(use_edl)\n			gl_FragColor.a = log2(linearDepth);\n		#endif\n		\n	#else\n		#if defined(use_edl)\n			gl_FragColor.a = vLogDepth;\n		#endif\n	#endif\n\n	#ifdef highlight_point\n		if (vHighlight > 0.0) {\n			gl_FragColor = highlightedPointColor;\n		}\n	#endif\n}";
function getIndexFromName(name) {
  return parseInt(name.charAt(name.length - 1), 10);
}
function byLevelAndIndex(a, b) {
  const na = a.name;
  const nb = b.name;
  if (na.length !== nb.length) {
    return na.length - nb.length;
  } else if (na < nb) {
    return -1;
  } else if (na > nb) {
    return 1;
  } else {
    return 0;
  }
}
const DEFAULT_CLASSIFICATION = {
  0: new Vector4(0.5, 0.5, 0.5, 1),
  1: new Vector4(0.5, 0.5, 0.5, 1),
  2: new Vector4(0.63, 0.32, 0.18, 1),
  3: new Vector4(0, 1, 0, 1),
  4: new Vector4(0, 0.8, 0, 1),
  5: new Vector4(0, 0.6, 0, 1),
  6: new Vector4(1, 0.66, 0, 1),
  7: new Vector4(1, 0, 1, 1),
  8: new Vector4(1, 0, 0, 1),
  9: new Vector4(0, 0, 1, 1),
  12: new Vector4(1, 1, 0, 1),
  DEFAULT: new Vector4(0.3, 0.6, 0.6, 0.5)
};
[
  [0, new Color(0, 0, 0)],
  [1, new Color(1, 1, 1)]
];
[
  [0, new Color(0.077, 0.042, 0.206)],
  [0.1, new Color(0.225, 0.036, 0.388)],
  [0.2, new Color(0.373, 0.074, 0.432)],
  [0.3, new Color(0.522, 0.128, 0.42)],
  [0.4, new Color(0.665, 0.182, 0.37)],
  [0.5, new Color(0.797, 0.255, 0.287)],
  [0.6, new Color(0.902, 0.364, 0.184)],
  [0.7, new Color(0.969, 0.516, 0.063)],
  [0.8, new Color(0.988, 0.683, 0.072)],
  [0.9, new Color(0.961, 0.859, 0.298)],
  [1, new Color(0.988, 0.998, 0.645)]
];
[
  [0, new Color(0.241, 0.015, 0.61)],
  [0.1, new Color(0.387, 1e-3, 0.654)],
  [0.2, new Color(0.524, 0.025, 0.653)],
  [0.3, new Color(0.651, 0.125, 0.596)],
  [0.4, new Color(0.752, 0.227, 0.513)],
  [0.5, new Color(0.837, 0.329, 0.431)],
  [0.6, new Color(0.907, 0.435, 0.353)],
  [0.7, new Color(0.963, 0.554, 0.272)],
  [0.8, new Color(0.992, 0.681, 0.195)],
  [0.9, new Color(0.987, 0.822, 0.144)],
  [1, new Color(0.94, 0.975, 0.131)]
];
[
  [0, new Color(0.278, 0, 0.714)],
  [1 / 6, new Color(0, 0, 1)],
  [2 / 6, new Color(0, 1, 1)],
  [3 / 6, new Color(0, 1, 0)],
  [4 / 6, new Color(1, 1, 0)],
  [5 / 6, new Color(1, 0.64, 0)],
  [1, new Color(1, 0, 0)]
];
const SPECTRAL = [
  [0, new Color(0.3686, 0.3098, 0.6353)],
  [0.1, new Color(0.1961, 0.5333, 0.7412)],
  [0.2, new Color(0.4, 0.7608, 0.6471)],
  [0.3, new Color(0.6706, 0.8667, 0.6431)],
  [0.4, new Color(0.902, 0.9608, 0.5961)],
  [0.5, new Color(1, 1, 0.749)],
  [0.6, new Color(0.9961, 0.8784, 0.5451)],
  [0.7, new Color(0.9922, 0.6824, 0.3804)],
  [0.8, new Color(0.9569, 0.4275, 0.2627)],
  [0.9, new Color(0.8353, 0.2431, 0.3098)],
  [1, new Color(0.6196, 39e-4, 0.2588)]
];
[
  [0, new Color(0.267, 5e-3, 0.329)],
  [0.1, new Color(0.283, 0.141, 0.458)],
  [0.2, new Color(0.254, 0.265, 0.53)],
  [0.3, new Color(0.207, 0.372, 0.553)],
  [0.4, new Color(0.164, 0.471, 0.558)],
  [0.5, new Color(0.128, 0.567, 0.551)],
  [0.6, new Color(0.135, 0.659, 0.518)],
  [0.7, new Color(0.267, 0.749, 0.441)],
  [0.8, new Color(0.478, 0.821, 0.318)],
  [0.9, new Color(0.741, 0.873, 0.15)],
  [1, new Color(0.993, 0.906, 0.144)]
];
[
  [0, new Color(0.1647, 0.2824, 0.3451)],
  [0.1, new Color(0.1338, 0.3555, 0.4227)],
  [0.2, new Color(0.061, 0.4319, 0.4864)],
  [0.3, new Color(0, 0.5099, 0.5319)],
  [0.4, new Color(0, 0.5881, 0.5569)],
  [0.5, new Color(0.137, 0.665, 0.5614)],
  [0.6, new Color(0.2906, 0.7395, 0.5477)],
  [0.7, new Color(0.4453, 0.8099, 0.5201)],
  [0.8, new Color(0.6102, 0.8748, 0.485)],
  [0.9, new Color(0.7883, 0.9323, 0.4514)],
  [1, new Color(0.9804, 0.9804, 0.4314)]
];
function generateDataTexture(width, height, color) {
  const size = width * height;
  const data = new Uint8Array(4 * size);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);
  for (let i2 = 0; i2 < size; i2++) {
    data[i2 * 3] = r;
    data[i2 * 3 + 1] = g;
    data[i2 * 3 + 2] = b;
  }
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.needsUpdate = true;
  texture.magFilter = NearestFilter;
  return texture;
}
function generateGradientTexture(gradient) {
  const size = 64;
  const canvas2 = document.createElement("canvas");
  canvas2.width = size;
  canvas2.height = size;
  const context = canvas2.getContext("2d");
  context.rect(0, 0, size, size);
  const ctxGradient = context.createLinearGradient(0, 0, size, size);
  for (let i2 = 0; i2 < gradient.length; i2++) {
    const step = gradient[i2];
    ctxGradient.addColorStop(step[0], `#${step[1].getHexString()}`);
  }
  context.fillStyle = ctxGradient;
  context.fill();
  const texture = new CanvasTexture(canvas2);
  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  return texture;
}
function generateClassificationTexture(classification) {
  const width = 256;
  const height = 256;
  const size = width * height;
  const data = new Uint8Array(4 * size);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const i2 = x + width * y;
      let color;
      if (classification[x]) {
        color = classification[x];
      } else if (classification[x % 32]) {
        color = classification[x % 32];
      } else {
        color = classification.DEFAULT;
      }
      data[4 * i2 + 0] = 255 * color.x;
      data[4 * i2 + 1] = 255 * color.y;
      data[4 * i2 + 2] = 255 * color.z;
      data[4 * i2 + 3] = 255 * color.w;
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
const TREE_TYPE_DEFS = {
  [TreeType.OCTREE]: "tree_type_octree",
  [TreeType.KDTREE]: "tree_type_kdtree"
};
const SIZE_TYPE_DEFS = {
  [PointSizeType.FIXED]: "fixed_point_size",
  [PointSizeType.ATTENUATED]: "attenuated_point_size",
  [PointSizeType.ADAPTIVE]: "adaptive_point_size"
};
const OPACITY_DEFS = {
  [PointOpacityType.ATTENUATED]: "attenuated_opacity",
  [PointOpacityType.FIXED]: "fixed_opacity"
};
const SHAPE_DEFS = {
  [PointShape.SQUARE]: "square_point_shape",
  [PointShape.CIRCLE]: "circle_point_shape",
  [PointShape.PARABOLOID]: "paraboloid_point_shape"
};
const COLOR_DEFS = {
  [PointColorType.RGB]: "color_type_rgb",
  [PointColorType.COLOR]: "color_type_color",
  [PointColorType.DEPTH]: "color_type_depth",
  [PointColorType.HEIGHT]: "color_type_height",
  [PointColorType.INTENSITY]: "color_type_intensity",
  [PointColorType.INTENSITY_GRADIENT]: "color_type_intensity_gradient",
  [PointColorType.LOD]: "color_type_lod",
  [PointColorType.POINT_INDEX]: "color_type_point_index",
  [PointColorType.CLASSIFICATION]: "color_type_classification",
  [PointColorType.RETURN_NUMBER]: "color_type_return_number",
  [PointColorType.SOURCE]: "color_type_source",
  [PointColorType.NORMAL]: "color_type_normal",
  [PointColorType.PHONG]: "color_type_phong",
  [PointColorType.RGB_HEIGHT]: "color_type_rgb_height",
  [PointColorType.COMPOSITE]: "color_type_composite"
};
const CLIP_MODE_DEFS = {
  [ClipMode.DISABLED]: "clip_disabled",
  [ClipMode.CLIP_OUTSIDE]: "clip_outside",
  [ClipMode.HIGHLIGHT_INSIDE]: "clip_highlight_inside"
};
const _PointCloudMaterial = class extends RawShaderMaterial {
  constructor(parameters = {}) {
    super();
    this.lights = false;
    this.fog = false;
    this.numClipBoxes = 0;
    this.clipBoxes = [];
    this.visibleNodeTextureOffsets = /* @__PURE__ */ new Map();
    this._gradient = SPECTRAL;
    this.gradientTexture = generateGradientTexture(this._gradient);
    this._classification = DEFAULT_CLASSIFICATION;
    this.classificationTexture = generateClassificationTexture(this._classification);
    this.uniforms = {
      bbSize: makeUniform("fv", [0, 0, 0]),
      blendDepthSupplement: makeUniform("f", 0),
      blendHardness: makeUniform("f", 2),
      classificationLUT: makeUniform("t", this.classificationTexture || new Texture()),
      clipBoxCount: makeUniform("f", 0),
      clipBoxes: makeUniform("Matrix4fv", []),
      depthMap: makeUniform("t", null),
      diffuse: makeUniform("fv", [1, 1, 1]),
      fov: makeUniform("f", 1),
      gradient: makeUniform("t", this.gradientTexture || new Texture()),
      heightMax: makeUniform("f", 1),
      heightMin: makeUniform("f", 0),
      intensityBrightness: makeUniform("f", 0),
      intensityContrast: makeUniform("f", 0),
      intensityGamma: makeUniform("f", 1),
      intensityRange: makeUniform("fv", [0, 65e3]),
      isLeafNode: makeUniform("b", 0),
      level: makeUniform("f", 0),
      maxSize: makeUniform("f", DEFAULT_MAX_POINT_SIZE),
      minSize: makeUniform("f", DEFAULT_MIN_POINT_SIZE),
      octreeSize: makeUniform("f", 0),
      opacity: makeUniform("f", 1),
      pcIndex: makeUniform("f", 0),
      rgbBrightness: makeUniform("f", DEFAULT_RGB_BRIGHTNESS),
      rgbContrast: makeUniform("f", DEFAULT_RGB_CONTRAST),
      rgbGamma: makeUniform("f", DEFAULT_RGB_GAMMA),
      screenHeight: makeUniform("f", 1),
      screenWidth: makeUniform("f", 1),
      size: makeUniform("f", 1),
      spacing: makeUniform("f", 1),
      toModel: makeUniform("Matrix4f", []),
      transition: makeUniform("f", 0.5),
      uColor: makeUniform("c", new Color(16777215)),
      visibleNodes: makeUniform("t", this.visibleNodesTexture || new Texture()),
      vnStart: makeUniform("f", 0),
      wClassification: makeUniform("f", 0),
      wElevation: makeUniform("f", 0),
      wIntensity: makeUniform("f", 0),
      wReturnNumber: makeUniform("f", 0),
      wRGB: makeUniform("f", 1),
      wSourceID: makeUniform("f", 0),
      opacityAttenuation: makeUniform("f", 1),
      filterByNormalThreshold: makeUniform("f", 0),
      highlightedPointCoordinate: makeUniform("fv", new Vector3()),
      highlightedPointColor: makeUniform("fv", DEFAULT_HIGHLIGHT_COLOR.clone()),
      enablePointHighlighting: makeUniform("b", true),
      highlightedPointScale: makeUniform("f", 2)
    };
    this.useClipBox = false;
    this.weighted = false;
    this.pointColorType = PointColorType.RGB;
    this.pointSizeType = PointSizeType.ADAPTIVE;
    this.clipMode = ClipMode.DISABLED;
    this.useEDL = false;
    this.shape = PointShape.SQUARE;
    this.treeType = TreeType.OCTREE;
    this.pointOpacityType = PointOpacityType.FIXED;
    this.useFilterByNormal = false;
    this.highlightPoint = false;
    this.attributes = {
      position: { type: "fv", value: [] },
      color: { type: "fv", value: [] },
      normal: { type: "fv", value: [] },
      intensity: { type: "f", value: [] },
      classification: { type: "f", value: [] },
      returnNumber: { type: "f", value: [] },
      numberOfReturns: { type: "f", value: [] },
      pointSourceID: { type: "f", value: [] },
      indices: { type: "fv", value: [] }
    };
    const tex = this.visibleNodesTexture = generateDataTexture(2048, 1, new Color(16777215));
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    this.setUniform("visibleNodes", tex);
    this.treeType = getValid(parameters.treeType, TreeType.OCTREE);
    this.size = getValid(parameters.size, 1);
    this.minSize = getValid(parameters.minSize, 2);
    this.maxSize = getValid(parameters.maxSize, 50);
    this.newFormat = !!parameters.newFormat;
    this.classification = DEFAULT_CLASSIFICATION;
    this.defaultAttributeValues.normal = [0, 0, 0];
    this.defaultAttributeValues.classification = [0, 0, 0];
    this.defaultAttributeValues.indices = [0, 0, 0, 0];
    this.vertexColors = true;
    this.updateShaderSource();
  }
  dispose() {
    super.dispose();
    if (this.gradientTexture) {
      this.gradientTexture.dispose();
      this.gradientTexture = void 0;
    }
    if (this.visibleNodesTexture) {
      this.visibleNodesTexture.dispose();
      this.visibleNodesTexture = void 0;
    }
    this.clearVisibleNodeTextureOffsets();
    if (this.classificationTexture) {
      this.classificationTexture.dispose();
      this.classificationTexture = void 0;
    }
    if (this.depthMap) {
      this.depthMap.dispose();
      this.depthMap = void 0;
    }
  }
  clearVisibleNodeTextureOffsets() {
    this.visibleNodeTextureOffsets.clear();
  }
  updateShaderSource() {
    this.vertexShader = this.applyDefines(VertShader);
    this.fragmentShader = this.applyDefines(FragShader);
    if (this.opacity === 1) {
      this.blending = NoBlending;
      this.transparent = false;
      this.depthTest = true;
      this.depthWrite = true;
      this.depthFunc = LessEqualDepth;
    } else if (this.opacity < 1 && !this.useEDL) {
      this.blending = AdditiveBlending;
      this.transparent = true;
      this.depthTest = false;
      this.depthWrite = true;
    }
    if (this.weighted) {
      this.blending = AdditiveBlending;
      this.transparent = true;
      this.depthTest = true;
      this.depthWrite = false;
      this.depthFunc = LessEqualDepth;
    }
    this.needsUpdate = true;
  }
  applyDefines(shaderSrc) {
    const parts = [];
    function define(value) {
      if (value) {
        parts.push(`#define ${value}`);
      }
    }
    define(TREE_TYPE_DEFS[this.treeType]);
    define(SIZE_TYPE_DEFS[this.pointSizeType]);
    define(SHAPE_DEFS[this.shape]);
    define(COLOR_DEFS[this.pointColorType]);
    define(CLIP_MODE_DEFS[this.clipMode]);
    define(OPACITY_DEFS[this.pointOpacityType]);
    if (this.rgbGamma !== DEFAULT_RGB_GAMMA || this.rgbBrightness !== DEFAULT_RGB_BRIGHTNESS || this.rgbContrast !== DEFAULT_RGB_CONTRAST) {
      define("use_rgb_gamma_contrast_brightness");
    }
    if (this.useFilterByNormal) {
      define("use_filter_by_normal");
    }
    if (this.useEDL) {
      define("use_edl");
    }
    if (this.weighted) {
      define("weighted_splats");
    }
    if (this.numClipBoxes > 0) {
      define("use_clip_box");
    }
    if (this.highlightPoint) {
      define("highlight_point");
    }
    define("MAX_POINT_LIGHTS 0");
    define("MAX_DIR_LIGHTS 0");
    if (this.newFormat) {
      define("new_format");
    }
    const versionLine = shaderSrc.match(/^\s*#version\s+300\s+es\s*\n/);
    if (versionLine) {
      parts.unshift(versionLine[0]);
      shaderSrc = shaderSrc.replace(versionLine[0], "");
    }
    parts.push(shaderSrc);
    return parts.join("\n");
  }
  setClipBoxes(clipBoxes) {
    if (!clipBoxes) {
      return;
    }
    this.clipBoxes = clipBoxes;
    const doUpdate = this.numClipBoxes !== clipBoxes.length && (clipBoxes.length === 0 || this.numClipBoxes === 0);
    this.numClipBoxes = clipBoxes.length;
    this.setUniform("clipBoxCount", this.numClipBoxes);
    if (doUpdate) {
      this.updateShaderSource();
    }
    const clipBoxesLength = this.numClipBoxes * 16;
    const clipBoxesArray = new Float32Array(clipBoxesLength);
    for (let i2 = 0; i2 < this.numClipBoxes; i2++) {
      clipBoxesArray.set(clipBoxes[i2].inverse.elements, 16 * i2);
    }
    for (let i2 = 0; i2 < clipBoxesLength; i2++) {
      if (isNaN(clipBoxesArray[i2])) {
        clipBoxesArray[i2] = Infinity;
      }
    }
    this.setUniform("clipBoxes", clipBoxesArray);
  }
  get gradient() {
    return this._gradient;
  }
  set gradient(value) {
    if (this._gradient !== value) {
      this._gradient = value;
      this.gradientTexture = generateGradientTexture(this._gradient);
      this.setUniform("gradient", this.gradientTexture);
    }
  }
  get classification() {
    return this._classification;
  }
  set classification(value) {
    const copy = {};
    for (const key of Object.keys(value)) {
      copy[key] = value[key].clone();
    }
    let isEqual = false;
    if (this._classification === void 0) {
      isEqual = false;
    } else {
      isEqual = Object.keys(copy).length === Object.keys(this._classification).length;
      for (const key of Object.keys(copy)) {
        isEqual = isEqual && this._classification[key] !== void 0;
        isEqual = isEqual && copy[key].equals(this._classification[key]);
      }
    }
    if (!isEqual) {
      this._classification = copy;
      this.recomputeClassification();
    }
  }
  recomputeClassification() {
    this.classificationTexture = generateClassificationTexture(this._classification);
    this.setUniform("classificationLUT", this.classificationTexture);
  }
  get elevationRange() {
    return [this.heightMin, this.heightMax];
  }
  set elevationRange(value) {
    this.heightMin = value[0];
    this.heightMax = value[1];
  }
  getUniform(name) {
    return this.uniforms === void 0 ? void 0 : this.uniforms[name].value;
  }
  setUniform(name, value) {
    if (this.uniforms === void 0) {
      return;
    }
    const uObj = this.uniforms[name];
    if (uObj.type === "c") {
      uObj.value.copy(value);
    } else if (value !== uObj.value) {
      uObj.value = value;
    }
  }
  updateMaterial(octree, visibleNodes, camera, renderer) {
    const pixelRatio = renderer.getPixelRatio();
    if (camera.type === PERSPECTIVE_CAMERA) {
      this.fov = camera.fov * (Math.PI / 180);
    } else {
      this.fov = Math.PI / 2;
    }
    const renderTarget = renderer.getRenderTarget();
    if (renderTarget !== null && renderTarget instanceof WebGLRenderTarget) {
      this.screenWidth = renderTarget.width;
      this.screenHeight = renderTarget.height;
    } else {
      this.screenWidth = renderer.domElement.clientWidth * pixelRatio;
      this.screenHeight = renderer.domElement.clientHeight * pixelRatio;
    }
    const maxScale = Math.max(octree.scale.x, octree.scale.y, octree.scale.z);
    this.spacing = octree.pcoGeometry.spacing * maxScale;
    this.octreeSize = octree.pcoGeometry.boundingBox.getSize(_PointCloudMaterial.helperVec3).x;
    if (this.pointSizeType === PointSizeType.ADAPTIVE || this.pointColorType === PointColorType.LOD) {
      this.updateVisibilityTextureData(visibleNodes);
    }
  }
  updateVisibilityTextureData(nodes) {
    nodes.sort(byLevelAndIndex);
    const data = new Uint8Array(nodes.length * 4);
    const offsetsToChild = new Array(nodes.length).fill(Infinity);
    this.visibleNodeTextureOffsets.clear();
    for (let i2 = 0; i2 < nodes.length; i2++) {
      const node = nodes[i2];
      this.visibleNodeTextureOffsets.set(node.name, i2);
      if (i2 > 0) {
        const parentName = node.name.slice(0, -1);
        const parentOffset = this.visibleNodeTextureOffsets.get(parentName);
        const parentOffsetToChild = i2 - parentOffset;
        offsetsToChild[parentOffset] = Math.min(offsetsToChild[parentOffset], parentOffsetToChild);
        const offset = parentOffset * 4;
        data[offset] = data[offset] | 1 << node.index;
        data[offset + 1] = offsetsToChild[parentOffset] >> 8;
        data[offset + 2] = offsetsToChild[parentOffset] % 256;
      }
      data[i2 * 4 + 3] = node.name.length;
    }
    const texture = this.visibleNodesTexture;
    if (texture) {
      texture.image.data.set(data);
      texture.needsUpdate = true;
    }
  }
  static makeOnBeforeRender(octree, node, pcIndex) {
    return (_renderer, _scene, _camera, _geometry, material) => {
      const pointCloudMaterial = material;
      const materialUniforms = pointCloudMaterial.uniforms;
      materialUniforms.level.value = node.level;
      materialUniforms.isLeafNode.value = node.isLeafNode;
      const vnStart = pointCloudMaterial.visibleNodeTextureOffsets.get(node.name);
      if (vnStart !== void 0) {
        materialUniforms.vnStart.value = vnStart;
      }
      materialUniforms.pcIndex.value = pcIndex !== void 0 ? pcIndex : octree.visibleNodes.indexOf(node);
      material.uniformsNeedUpdate = true;
    };
  }
};
let PointCloudMaterial = _PointCloudMaterial;
PointCloudMaterial.helperVec3 = new Vector3();
__decorateClass([
  uniform("bbSize")
], PointCloudMaterial.prototype, "bbSize", 2);
__decorateClass([
  uniform("depthMap")
], PointCloudMaterial.prototype, "depthMap", 2);
__decorateClass([
  uniform("fov")
], PointCloudMaterial.prototype, "fov", 2);
__decorateClass([
  uniform("heightMax")
], PointCloudMaterial.prototype, "heightMax", 2);
__decorateClass([
  uniform("heightMin")
], PointCloudMaterial.prototype, "heightMin", 2);
__decorateClass([
  uniform("intensityBrightness")
], PointCloudMaterial.prototype, "intensityBrightness", 2);
__decorateClass([
  uniform("intensityContrast")
], PointCloudMaterial.prototype, "intensityContrast", 2);
__decorateClass([
  uniform("intensityGamma")
], PointCloudMaterial.prototype, "intensityGamma", 2);
__decorateClass([
  uniform("intensityRange")
], PointCloudMaterial.prototype, "intensityRange", 2);
__decorateClass([
  uniform("maxSize")
], PointCloudMaterial.prototype, "maxSize", 2);
__decorateClass([
  uniform("minSize")
], PointCloudMaterial.prototype, "minSize", 2);
__decorateClass([
  uniform("octreeSize")
], PointCloudMaterial.prototype, "octreeSize", 2);
__decorateClass([
  uniform("opacity", true)
], PointCloudMaterial.prototype, "opacity", 2);
__decorateClass([
  uniform("rgbBrightness", true)
], PointCloudMaterial.prototype, "rgbBrightness", 2);
__decorateClass([
  uniform("rgbContrast", true)
], PointCloudMaterial.prototype, "rgbContrast", 2);
__decorateClass([
  uniform("rgbGamma", true)
], PointCloudMaterial.prototype, "rgbGamma", 2);
__decorateClass([
  uniform("screenHeight")
], PointCloudMaterial.prototype, "screenHeight", 2);
__decorateClass([
  uniform("screenWidth")
], PointCloudMaterial.prototype, "screenWidth", 2);
__decorateClass([
  uniform("size")
], PointCloudMaterial.prototype, "size", 2);
__decorateClass([
  uniform("spacing")
], PointCloudMaterial.prototype, "spacing", 2);
__decorateClass([
  uniform("transition")
], PointCloudMaterial.prototype, "transition", 2);
__decorateClass([
  uniform("uColor")
], PointCloudMaterial.prototype, "color", 2);
__decorateClass([
  uniform("wClassification")
], PointCloudMaterial.prototype, "weightClassification", 2);
__decorateClass([
  uniform("wElevation")
], PointCloudMaterial.prototype, "weightElevation", 2);
__decorateClass([
  uniform("wIntensity")
], PointCloudMaterial.prototype, "weightIntensity", 2);
__decorateClass([
  uniform("wReturnNumber")
], PointCloudMaterial.prototype, "weightReturnNumber", 2);
__decorateClass([
  uniform("wRGB")
], PointCloudMaterial.prototype, "weightRGB", 2);
__decorateClass([
  uniform("wSourceID")
], PointCloudMaterial.prototype, "weightSourceID", 2);
__decorateClass([
  uniform("opacityAttenuation")
], PointCloudMaterial.prototype, "opacityAttenuation", 2);
__decorateClass([
  uniform("filterByNormalThreshold")
], PointCloudMaterial.prototype, "filterByNormalThreshold", 2);
__decorateClass([
  uniform("highlightedPointCoordinate")
], PointCloudMaterial.prototype, "highlightedPointCoordinate", 2);
__decorateClass([
  uniform("highlightedPointColor")
], PointCloudMaterial.prototype, "highlightedPointColor", 2);
__decorateClass([
  uniform("enablePointHighlighting")
], PointCloudMaterial.prototype, "enablePointHighlighting", 2);
__decorateClass([
  uniform("highlightedPointScale")
], PointCloudMaterial.prototype, "highlightedPointScale", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "useClipBox", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "weighted", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "pointColorType", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "pointSizeType", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "clipMode", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "useEDL", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "shape", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "treeType", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "pointOpacityType", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "useFilterByNormal", 2);
__decorateClass([
  requiresShaderUpdate()
], PointCloudMaterial.prototype, "highlightPoint", 2);
function makeUniform(type, value) {
  return { type, value };
}
function getValid(a, b) {
  return a === void 0 ? b : a;
}
function uniform(uniformName, requireSrcUpdate = false) {
  return (target, propertyKey) => {
    Object.defineProperty(target, propertyKey, {
      get() {
        return this.getUniform(uniformName);
      },
      set(value) {
        if (value !== this.getUniform(uniformName)) {
          this.setUniform(uniformName, value);
          if (requireSrcUpdate) {
            this.updateShaderSource();
          }
        }
      }
    });
  };
}
function requiresShaderUpdate() {
  return (target, propertyKey) => {
    const fieldName = `_${propertyKey.toString()}`;
    Object.defineProperty(target, propertyKey, {
      get() {
        return this[fieldName];
      },
      set(value) {
        if (value !== this[fieldName]) {
          this[fieldName] = value;
          this.updateShaderSource();
        }
      }
    });
  };
}
class PointCloudOctreeNode extends EventDispatcher {
  constructor(geometryNode, sceneNode) {
    super();
    this.pcIndex = void 0;
    this.boundingBoxNode = null;
    this.loaded = true;
    this.isTreeNode = true;
    this.isGeometryNode = false;
    this.geometryNode = geometryNode;
    this.sceneNode = sceneNode;
    this.children = geometryNode.children.slice();
  }
  dispose() {
    this.geometryNode.dispose();
  }
  disposeSceneNode() {
    const node = this.sceneNode;
    if (node.geometry instanceof BufferGeometry) {
      const attributes = node.geometry.attributes;
      for (const key in attributes) {
        if (key === "position") {
          delete attributes[key].array;
        }
        delete attributes[key];
      }
      node.geometry.dispose();
      node.geometry = void 0;
    }
  }
  traverse(cb, includeSelf) {
    this.geometryNode.traverse(cb, includeSelf);
  }
  get id() {
    return this.geometryNode.id;
  }
  get name() {
    return this.geometryNode.name;
  }
  get level() {
    return this.geometryNode.level;
  }
  get isLeafNode() {
    return this.geometryNode.isLeafNode;
  }
  get numPoints() {
    return this.geometryNode.numPoints;
  }
  get index() {
    return this.geometryNode.index;
  }
  get boundingSphere() {
    return this.geometryNode.boundingSphere;
  }
  get boundingBox() {
    return this.geometryNode.boundingBox;
  }
  get spacing() {
    return this.geometryNode.spacing;
  }
}
function clamp(value, min, max) {
  return Math.min(Math.max(min, value), max);
}
const _PointCloudOctreePicker = class {
  dispose() {
    if (this.pickState) {
      this.pickState.material.dispose();
      this.pickState.renderTarget.dispose();
    }
  }
  pick(renderer, camera, ray, octrees, params = {}) {
    if (octrees.length === 0) {
      return null;
    }
    const pickState = this.pickState ? this.pickState : this.pickState = _PointCloudOctreePicker.getPickState();
    const pickMaterial = pickState.material;
    const pixelRatio = renderer.getPixelRatio();
    const width = Math.ceil(renderer.domElement.clientWidth * pixelRatio);
    const height = Math.ceil(renderer.domElement.clientHeight * pixelRatio);
    _PointCloudOctreePicker.updatePickRenderTarget(this.pickState, width, height);
    const pixelPosition = _PointCloudOctreePicker.helperVec3;
    if (params.pixelPosition) {
      pixelPosition.copy(params.pixelPosition);
    } else {
      pixelPosition.addVectors(camera.position, ray.direction).project(camera);
      pixelPosition.x = (pixelPosition.x + 1) * width * 0.5;
      pixelPosition.y = (pixelPosition.y + 1) * height * 0.5;
    }
    const pickWndSize = Math.floor((params.pickWindowSize || DEFAULT_PICK_WINDOW_SIZE) * pixelRatio);
    const halfPickWndSize = (pickWndSize - 1) / 2;
    const x = Math.floor(clamp(pixelPosition.x - halfPickWndSize, 0, width));
    const y = Math.floor(clamp(pixelPosition.y - halfPickWndSize, 0, height));
    _PointCloudOctreePicker.prepareRender(renderer, x, y, pickWndSize, pickMaterial, pickState);
    const renderedNodes = _PointCloudOctreePicker.render(renderer, camera, pickMaterial, octrees, ray, pickState, params);
    pickMaterial.clearVisibleNodeTextureOffsets();
    const pixels = _PointCloudOctreePicker.readPixels(renderer, x, y, pickWndSize);
    const hit = _PointCloudOctreePicker.findHit(pixels, pickWndSize);
    return _PointCloudOctreePicker.getPickPoint(hit, renderedNodes);
  }
  static prepareRender(renderer, x, y, pickWndSize, pickMaterial, pickState) {
    renderer.setScissor(x, y, pickWndSize, pickWndSize);
    renderer.setScissorTest(true);
    renderer.state.buffers.depth.setTest(pickMaterial.depthTest);
    renderer.state.buffers.depth.setMask(pickMaterial.depthWrite);
    renderer.state.setBlending(NoBlending);
    renderer.setRenderTarget(pickState.renderTarget);
    renderer.getClearColor(this.clearColor);
    const oldClearAlpha = renderer.getClearAlpha();
    renderer.setClearColor(COLOR_BLACK, 0);
    renderer.clear(true, true, true);
    renderer.setClearColor(this.clearColor, oldClearAlpha);
  }
  static render(renderer, camera, pickMaterial, octrees, ray, pickState, params) {
    const renderedNodes = [];
    for (const octree of octrees) {
      const nodes = _PointCloudOctreePicker.nodesOnRay(octree, ray);
      if (!nodes.length) {
        continue;
      }
      _PointCloudOctreePicker.updatePickMaterial(pickMaterial, octree.material, params);
      pickMaterial.updateMaterial(octree, nodes, camera, renderer);
      if (params.onBeforePickRender) {
        params.onBeforePickRender(pickMaterial, pickState.renderTarget);
      }
      pickState.scene.children = _PointCloudOctreePicker.createTempNodes(octree, nodes, pickMaterial, renderedNodes.length);
      renderer.render(pickState.scene, camera);
      nodes.forEach((node) => renderedNodes.push({ node, octree }));
    }
    return renderedNodes;
  }
  static nodesOnRay(octree, ray) {
    const nodesOnRay = [];
    const rayClone = ray.clone();
    for (const node of octree.visibleNodes) {
      const sphere = _PointCloudOctreePicker.helperSphere.copy(node.boundingSphere).applyMatrix4(octree.matrixWorld);
      if (rayClone.intersectsSphere(sphere)) {
        nodesOnRay.push(node);
      }
    }
    return nodesOnRay;
  }
  static readPixels(renderer, x, y, pickWndSize) {
    const pixels = new Uint8Array(4 * pickWndSize * pickWndSize);
    renderer.readRenderTargetPixels(renderer.getRenderTarget(), x, y, pickWndSize, pickWndSize, pixels);
    renderer.setScissorTest(false);
    renderer.setRenderTarget(null);
    return pixels;
  }
  static createTempNodes(octree, nodes, pickMaterial, nodeIndexOffset) {
    const tempNodes = [];
    for (let i2 = 0; i2 < nodes.length; i2++) {
      const node = nodes[i2];
      const sceneNode = node.sceneNode;
      const tempNode = new Points(sceneNode.geometry, pickMaterial);
      tempNode.matrix = sceneNode.matrix;
      tempNode.matrixWorld = sceneNode.matrixWorld;
      tempNode.matrixAutoUpdate = false;
      tempNode.frustumCulled = false;
      const nodeIndex = nodeIndexOffset + i2 + 1;
      if (nodeIndex > 255) {
        console.error("More than 255 nodes for pick are not supported.");
      }
      tempNode.onBeforeRender = PointCloudMaterial.makeOnBeforeRender(octree, node, nodeIndex);
      tempNodes.push(tempNode);
    }
    return tempNodes;
  }
  static updatePickMaterial(pickMaterial, nodeMaterial, params) {
    pickMaterial.pointSizeType = nodeMaterial.pointSizeType;
    pickMaterial.shape = nodeMaterial.shape;
    pickMaterial.size = nodeMaterial.size;
    pickMaterial.minSize = nodeMaterial.minSize;
    pickMaterial.maxSize = nodeMaterial.maxSize;
    pickMaterial.classification = nodeMaterial.classification;
    pickMaterial.useFilterByNormal = nodeMaterial.useFilterByNormal;
    pickMaterial.filterByNormalThreshold = nodeMaterial.filterByNormalThreshold;
    if (params.pickOutsideClipRegion) {
      pickMaterial.clipMode = ClipMode.DISABLED;
    } else {
      pickMaterial.clipMode = nodeMaterial.clipMode;
      pickMaterial.setClipBoxes(nodeMaterial.clipMode === ClipMode.CLIP_OUTSIDE ? nodeMaterial.clipBoxes : []);
    }
  }
  static updatePickRenderTarget(pickState, width, height) {
    if (pickState.renderTarget.width === width && pickState.renderTarget.height === height) {
      return;
    }
    pickState.renderTarget.dispose();
    pickState.renderTarget = _PointCloudOctreePicker.makePickRenderTarget();
    pickState.renderTarget.setSize(width, height);
  }
  static makePickRenderTarget() {
    return new WebGLRenderTarget(1, 1, {
      minFilter: LinearFilter,
      magFilter: NearestFilter,
      format: RGBAFormat
    });
  }
  static findHit(pixels, pickWndSize) {
    const ibuffer = new Uint32Array(pixels.buffer);
    let min = Number.MAX_VALUE;
    let hit = null;
    for (let u = 0; u < pickWndSize; u++) {
      for (let v = 0; v < pickWndSize; v++) {
        const offset = u + v * pickWndSize;
        const distance = Math.pow(u - (pickWndSize - 1) / 2, 2) + Math.pow(v - (pickWndSize - 1) / 2, 2);
        const pcIndex = pixels[4 * offset + 3];
        pixels[4 * offset + 3] = 0;
        const pIndex = ibuffer[offset];
        if (pcIndex > 0 && distance < min) {
          hit = {
            pIndex,
            pcIndex: pcIndex - 1
          };
          min = distance;
        }
      }
    }
    return hit;
  }
  static getPickPoint(hit, nodes) {
    if (!hit) {
      return null;
    }
    const point = {};
    const points = nodes[hit.pcIndex] && nodes[hit.pcIndex].node.sceneNode;
    if (!points) {
      return null;
    }
    point.pointCloud = nodes[hit.pcIndex].octree;
    const attributes = points.geometry.attributes;
    for (const property in attributes) {
      if (!attributes.hasOwnProperty(property)) {
        continue;
      }
      const values = attributes[property];
      if (property === "position") {
        _PointCloudOctreePicker.addPositionToPickPoint(point, hit, values, points);
      } else if (property === "normal") {
        _PointCloudOctreePicker.addNormalToPickPoint(point, hit, values, points);
      } else if (property === "indices")
        ;
      else {
        if (values.itemSize === 1) {
          point[property] = values.array[hit.pIndex];
        } else {
          const value = [];
          for (let j = 0; j < values.itemSize; j++) {
            value.push(values.array[values.itemSize * hit.pIndex + j]);
          }
          point[property] = value;
        }
      }
    }
    return point;
  }
  static addPositionToPickPoint(point, hit, values, points) {
    point.position = new Vector3().fromBufferAttribute(values, hit.pIndex).applyMatrix4(points.matrixWorld);
  }
  static addNormalToPickPoint(point, hit, values, points) {
    const normal = new Vector3().fromBufferAttribute(values, hit.pIndex);
    const normal4 = new Vector4(normal.x, normal.y, normal.z, 0).applyMatrix4(points.matrixWorld);
    normal.set(normal4.x, normal4.y, normal4.z);
    point.normal = normal;
  }
  static getPickState() {
    const scene = new Scene();
    scene.autoUpdate = false;
    const material = new PointCloudMaterial();
    material.pointColorType = PointColorType.POINT_INDEX;
    return {
      renderTarget: _PointCloudOctreePicker.makePickRenderTarget(),
      material,
      scene
    };
  }
};
let PointCloudOctreePicker = _PointCloudOctreePicker;
PointCloudOctreePicker.helperVec3 = new Vector3();
PointCloudOctreePicker.helperSphere = new Sphere();
PointCloudOctreePicker.clearColor = new Color();
class PointCloudTree extends Object3D {
  constructor() {
    super(...arguments);
    this.root = null;
  }
  initialized() {
    return this.root !== null;
  }
}
function computeTransformedBoundingBox(box, transform) {
  return new Box3().setFromPoints([
    new Vector3(box.min.x, box.min.y, box.min.z).applyMatrix4(transform),
    new Vector3(box.min.x, box.min.y, box.min.z).applyMatrix4(transform),
    new Vector3(box.max.x, box.min.y, box.min.z).applyMatrix4(transform),
    new Vector3(box.min.x, box.max.y, box.min.z).applyMatrix4(transform),
    new Vector3(box.min.x, box.min.y, box.max.z).applyMatrix4(transform),
    new Vector3(box.min.x, box.max.y, box.max.z).applyMatrix4(transform),
    new Vector3(box.max.x, box.max.y, box.min.z).applyMatrix4(transform),
    new Vector3(box.max.x, box.min.y, box.max.z).applyMatrix4(transform),
    new Vector3(box.max.x, box.max.y, box.max.z).applyMatrix4(transform)
  ]);
}
function createChildAABB$1(aabb, index) {
  const min = aabb.min.clone();
  const max = aabb.max.clone();
  const size = new Vector3().subVectors(max, min);
  if ((index & 1) > 0) {
    min.z += size.z / 2;
  } else {
    max.z -= size.z / 2;
  }
  if ((index & 2) > 0) {
    min.y += size.y / 2;
  } else {
    max.y -= size.y / 2;
  }
  if ((index & 4) > 0) {
    min.x += size.x / 2;
  } else {
    max.x -= size.x / 2;
  }
  return new Box3(min, max);
}
class PointCloudOctree extends PointCloudTree {
  constructor(potree, pcoGeometry, material) {
    super();
    this.disposed = false;
    this.level = 0;
    this.maxLevel = Infinity;
    this.minNodePixelSize = DEFAULT_MIN_NODE_PIXEL_SIZE;
    this.root = null;
    this.boundingBoxNodes = [];
    this.visibleNodes = [];
    this.visibleGeometry = [];
    this.numVisiblePoints = 0;
    this.showBoundingBox = false;
    this.visibleBounds = new Box3();
    this.name = "";
    this.potree = potree;
    this.root = pcoGeometry.root;
    this.pcoGeometry = pcoGeometry;
    this.boundingBox = pcoGeometry.boundingBox;
    this.boundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
    this.position.copy(pcoGeometry.offset);
    this.updateMatrix();
    this.material = material || pcoGeometry instanceof OctreeGeometry ? new PointCloudMaterial({ newFormat: true }) : new PointCloudMaterial();
    this.initMaterial(this.material);
  }
  initMaterial(material) {
    this.updateMatrixWorld(true);
    const { min, max } = computeTransformedBoundingBox(this.pcoGeometry.tightBoundingBox || this.getBoundingBoxWorld(), this.matrixWorld);
    const bWidth = max.z - min.z;
    material.heightMin = min.z - 0.2 * bWidth;
    material.heightMax = max.z + 0.2 * bWidth;
  }
  dispose() {
    if (this.root) {
      this.root.dispose();
    }
    this.pcoGeometry.root.traverse((n) => this.potree.lru.remove(n));
    this.pcoGeometry.dispose();
    this.material.dispose();
    this.visibleNodes = [];
    this.visibleGeometry = [];
    if (this.picker) {
      this.picker.dispose();
      this.picker = void 0;
    }
    this.disposed = true;
  }
  get pointSizeType() {
    return this.material.pointSizeType;
  }
  set pointSizeType(value) {
    this.material.pointSizeType = value;
  }
  toTreeNode(geometryNode, parent) {
    const points = new Points(geometryNode.geometry, this.material);
    const node = new PointCloudOctreeNode(geometryNode, points);
    points.name = geometryNode.name;
    points.position.copy(geometryNode.boundingBox.min);
    points.frustumCulled = false;
    points.onBeforeRender = PointCloudMaterial.makeOnBeforeRender(this, node);
    if (parent) {
      parent.sceneNode.add(points);
      parent.children[geometryNode.index] = node;
      geometryNode.oneTimeDisposeHandlers.push(() => {
        node.disposeSceneNode();
        parent.sceneNode.remove(node.sceneNode);
        parent.children[geometryNode.index] = geometryNode;
      });
    } else {
      this.root = node;
      this.add(points);
    }
    return node;
  }
  updateVisibleBounds() {
    const bounds = this.visibleBounds;
    bounds.min.set(Infinity, Infinity, Infinity);
    bounds.max.set(-Infinity, -Infinity, -Infinity);
    for (const node of this.visibleNodes) {
      if (node.isLeafNode) {
        bounds.expandByPoint(node.boundingBox.min);
        bounds.expandByPoint(node.boundingBox.max);
      }
    }
  }
  updateBoundingBoxes() {
    if (!this.showBoundingBox || !this.parent) {
      return;
    }
    let bbRoot = this.parent.getObjectByName("bbroot");
    if (!bbRoot) {
      bbRoot = new Object3D();
      bbRoot.name = "bbroot";
      this.parent.add(bbRoot);
    }
    const visibleBoxes = [];
    for (const node of this.visibleNodes) {
      if (node.boundingBoxNode !== void 0 && node.isLeafNode) {
        visibleBoxes.push(node.boundingBoxNode);
      }
    }
    bbRoot.children = visibleBoxes;
  }
  updateMatrixWorld(force) {
    if (this.matrixAutoUpdate === true) {
      this.updateMatrix();
    }
    if (this.matrixWorldNeedsUpdate === true || force === true) {
      if (!this.parent) {
        this.matrixWorld.copy(this.matrix);
      } else {
        this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      }
      this.matrixWorldNeedsUpdate = false;
      force = true;
    }
  }
  hideDescendants(object) {
    const toHide = [];
    addVisibleChildren(object);
    while (toHide.length > 0) {
      const objToHide = toHide.shift();
      objToHide.visible = false;
      addVisibleChildren(objToHide);
    }
    function addVisibleChildren(obj) {
      for (const child of obj.children) {
        if (child.visible) {
          toHide.push(child);
        }
      }
    }
  }
  moveToOrigin() {
    this.position.set(0, 0, 0);
    this.position.set(0, 0, 0).sub(this.getBoundingBoxWorld().getCenter(new Vector3()));
  }
  moveToGroundPlane() {
    this.position.y += -this.getBoundingBoxWorld().min.y;
  }
  getBoundingBoxWorld() {
    this.updateMatrixWorld(true);
    return computeTransformedBoundingBox(this.boundingBox, this.matrixWorld);
  }
  getVisibleExtent() {
    return this.visibleBounds.applyMatrix4(this.matrixWorld);
  }
  pick(renderer, camera, ray, params = {}) {
    this.picker = this.picker || new PointCloudOctreePicker();
    return this.picker.pick(renderer, camera, ray, [this], params);
  }
  get progress() {
    return this.visibleGeometry.length === 0 ? 0 : this.visibleNodes.length / this.visibleGeometry.length;
  }
}
const PointAttributeTypes = {
  DATA_TYPE_DOUBLE: { ordinal: 0, name: "double", size: 8 },
  DATA_TYPE_FLOAT: { ordinal: 1, name: "float", size: 4 },
  DATA_TYPE_INT8: { ordinal: 2, name: "int8", size: 1 },
  DATA_TYPE_UINT8: { ordinal: 3, name: "uint8", size: 1 },
  DATA_TYPE_INT16: { ordinal: 4, name: "int16", size: 2 },
  DATA_TYPE_UINT16: { ordinal: 5, name: "uint16", size: 2 },
  DATA_TYPE_INT32: { ordinal: 6, name: "int32", size: 4 },
  DATA_TYPE_UINT32: { ordinal: 7, name: "uint32", size: 4 },
  DATA_TYPE_INT64: { ordinal: 8, name: "int64", size: 8 },
  DATA_TYPE_UINT64: { ordinal: 9, name: "uint64", size: 8 }
};
let i = 0;
for (let obj in PointAttributeTypes) {
  PointAttributeTypes[i] = PointAttributeTypes[obj];
  i++;
}
class PointAttribute {
  constructor(name, type, numElements, range = [Infinity, -Infinity]) {
    this.name = name;
    this.type = type;
    this.numElements = numElements;
    this.range = range;
    this.byteSize = this.numElements * this.type.size;
    this.description = "";
  }
}
const POINT_ATTRIBUTES$1 = {
  POSITION_CARTESIAN: new PointAttribute("POSITION_CARTESIAN", PointAttributeTypes.DATA_TYPE_FLOAT, 3),
  RGBA_PACKED: new PointAttribute("COLOR_PACKED", PointAttributeTypes.DATA_TYPE_INT8, 4),
  COLOR_PACKED: new PointAttribute("COLOR_PACKED", PointAttributeTypes.DATA_TYPE_INT8, 4),
  RGB_PACKED: new PointAttribute("COLOR_PACKED", PointAttributeTypes.DATA_TYPE_INT8, 3),
  NORMAL_FLOATS: new PointAttribute("NORMAL_FLOATS", PointAttributeTypes.DATA_TYPE_FLOAT, 3),
  INTENSITY: new PointAttribute("INTENSITY", PointAttributeTypes.DATA_TYPE_UINT16, 1),
  CLASSIFICATION: new PointAttribute("CLASSIFICATION", PointAttributeTypes.DATA_TYPE_UINT8, 1),
  NORMAL_SPHEREMAPPED: new PointAttribute("NORMAL_SPHEREMAPPED", PointAttributeTypes.DATA_TYPE_UINT8, 2),
  NORMAL_OCT16: new PointAttribute("NORMAL_OCT16", PointAttributeTypes.DATA_TYPE_UINT8, 2),
  NORMAL: new PointAttribute("NORMAL", PointAttributeTypes.DATA_TYPE_FLOAT, 3),
  RETURN_NUMBER: new PointAttribute("RETURN_NUMBER", PointAttributeTypes.DATA_TYPE_UINT8, 1),
  NUMBER_OF_RETURNS: new PointAttribute("NUMBER_OF_RETURNS", PointAttributeTypes.DATA_TYPE_UINT8, 1),
  SOURCE_ID: new PointAttribute("SOURCE_ID", PointAttributeTypes.DATA_TYPE_UINT16, 1),
  INDICES: new PointAttribute("INDICES", PointAttributeTypes.DATA_TYPE_UINT32, 1),
  SPACING: new PointAttribute("SPACING", PointAttributeTypes.DATA_TYPE_FLOAT, 1),
  GPS_TIME: new PointAttribute("GPS_TIME", PointAttributeTypes.DATA_TYPE_DOUBLE, 1)
};
class PointAttributes$1 {
  constructor(pointAttributes, attributes = [], byteSize = 0, size = 0, vectors = []) {
    this.attributes = attributes;
    this.byteSize = byteSize;
    this.size = size;
    this.vectors = vectors;
    if (pointAttributes != null) {
      for (let i2 = 0; i2 < pointAttributes.length; i2++) {
        let pointAttributeName = pointAttributes[i2];
        let pointAttribute = POINT_ATTRIBUTES$1[pointAttributeName];
        this.attributes.push(pointAttribute);
        this.byteSize += pointAttribute.byteSize;
        this.size++;
      }
    }
  }
  add(pointAttribute) {
    this.attributes.push(pointAttribute);
    this.byteSize += pointAttribute.byteSize;
    this.size++;
  }
  addVector(vector) {
    this.vectors.push(vector);
  }
  hasNormals() {
    for (let name in this.attributes) {
      let pointAttribute = this.attributes[name];
      if (pointAttribute === POINT_ATTRIBUTES$1.NORMAL_SPHEREMAPPED || pointAttribute === POINT_ATTRIBUTES$1.NORMAL_FLOATS || pointAttribute === POINT_ATTRIBUTES$1.NORMAL || pointAttribute === POINT_ATTRIBUTES$1.NORMAL_OCT16) {
        return true;
      }
    }
    return false;
  }
}
const encodedJs$2 = "KGZ1bmN0aW9uKCl7InVzZSBzdHJpY3QiO2NvbnN0IHY9e0RBVEFfVFlQRV9ET1VCTEU6e29yZGluYWw6MCxuYW1lOiJkb3VibGUiLHNpemU6OH0sREFUQV9UWVBFX0ZMT0FUOntvcmRpbmFsOjEsbmFtZToiZmxvYXQiLHNpemU6NH0sREFUQV9UWVBFX0lOVDg6e29yZGluYWw6MixuYW1lOiJpbnQ4IixzaXplOjF9LERBVEFfVFlQRV9VSU5UODp7b3JkaW5hbDozLG5hbWU6InVpbnQ4IixzaXplOjF9LERBVEFfVFlQRV9JTlQxNjp7b3JkaW5hbDo0LG5hbWU6ImludDE2IixzaXplOjJ9LERBVEFfVFlQRV9VSU5UMTY6e29yZGluYWw6NSxuYW1lOiJ1aW50MTYiLHNpemU6Mn0sREFUQV9UWVBFX0lOVDMyOntvcmRpbmFsOjYsbmFtZToiaW50MzIiLHNpemU6NH0sREFUQV9UWVBFX1VJTlQzMjp7b3JkaW5hbDo3LG5hbWU6InVpbnQzMiIsc2l6ZTo0fSxEQVRBX1RZUEVfSU5UNjQ6e29yZGluYWw6OCxuYW1lOiJpbnQ2NCIsc2l6ZTo4fSxEQVRBX1RZUEVfVUlOVDY0OntvcmRpbmFsOjksbmFtZToidWludDY0IixzaXplOjh9fTtsZXQgazA9MDtmb3IobGV0IFIgaW4gdil2W2swXT12W1JdLGswKys7Y2xhc3MgUXtjb25zdHJ1Y3RvcihiLEosZjAsZTA9WzEvMCwtMS8wXSl7dGhpcy5uYW1lPWIsdGhpcy50eXBlPUosdGhpcy5udW1FbGVtZW50cz1mMCx0aGlzLnJhbmdlPWUwLHRoaXMuYnl0ZVNpemU9dGhpcy5udW1FbGVtZW50cyp0aGlzLnR5cGUuc2l6ZSx0aGlzLmRlc2NyaXB0aW9uPSIifX1uZXcgUSgiUE9TSVRJT05fQ0FSVEVTSUFOIix2LkRBVEFfVFlQRV9GTE9BVCwzKSxuZXcgUSgiQ09MT1JfUEFDS0VEIix2LkRBVEFfVFlQRV9JTlQ4LDQpLG5ldyBRKCJDT0xPUl9QQUNLRUQiLHYuREFUQV9UWVBFX0lOVDgsNCksbmV3IFEoIkNPTE9SX1BBQ0tFRCIsdi5EQVRBX1RZUEVfSU5UOCwzKSxuZXcgUSgiTk9STUFMX0ZMT0FUUyIsdi5EQVRBX1RZUEVfRkxPQVQsMyksbmV3IFEoIklOVEVOU0lUWSIsdi5EQVRBX1RZUEVfVUlOVDE2LDEpLG5ldyBRKCJDTEFTU0lGSUNBVElPTiIsdi5EQVRBX1RZUEVfVUlOVDgsMSksbmV3IFEoIk5PUk1BTF9TUEhFUkVNQVBQRUQiLHYuREFUQV9UWVBFX1VJTlQ4LDIpLG5ldyBRKCJOT1JNQUxfT0NUMTYiLHYuREFUQV9UWVBFX1VJTlQ4LDIpLG5ldyBRKCJOT1JNQUwiLHYuREFUQV9UWVBFX0ZMT0FULDMpLG5ldyBRKCJSRVRVUk5fTlVNQkVSIix2LkRBVEFfVFlQRV9VSU5UOCwxKSxuZXcgUSgiTlVNQkVSX09GX1JFVFVSTlMiLHYuREFUQV9UWVBFX1VJTlQ4LDEpLG5ldyBRKCJTT1VSQ0VfSUQiLHYuREFUQV9UWVBFX1VJTlQxNiwxKSxuZXcgUSgiSU5ESUNFUyIsdi5EQVRBX1RZUEVfVUlOVDMyLDEpLG5ldyBRKCJTUEFDSU5HIix2LkRBVEFfVFlQRV9GTE9BVCwxKSxuZXcgUSgiR1BTX1RJTUUiLHYuREFUQV9UWVBFX0RPVUJMRSwxKTtmdW5jdGlvbiBMMCgpe3ZhciBSPW5ldyBJbnQ4QXJyYXkoMCk7ZnVuY3Rpb24gYihlKXt0aGlzLmRhdGE9ZSx0aGlzLm9mZnNldD0wfXZhciBKPUludDMyQXJyYXkuZnJvbShbMjU2LDQwMiw0MzYsNDY4LDUwMCw1MzQsNTY2LDU5OCw2MzAsNjYyLDY5NCw3MjYsNzU4LDc5MCw4MjIsODU0LDg4Niw5MjAsOTUyLDk4NCwxMDE2LDEwNDgsMTA4MF0pLGYwPUludDMyQXJyYXkuZnJvbShbMSwyLDMsNCwwLDUsMTcsNiwxNiw3LDgsOSwxMCwxMSwxMiwxMywxNCwxNV0pLGUwPUludDMyQXJyYXkuZnJvbShbMCwzLDIsMSwwLDAsMCwwLDAsMCwzLDMsMywzLDMsM10pLEYwPUludDMyQXJyYXkuZnJvbShbMCwwLDAsMCwtMSwxLC0yLDIsLTMsMywtMSwxLC0yLDIsLTMsM10pLHIwPUludDMyQXJyYXkuZnJvbShbMTMxMDcyLDEzMTA3NiwxMzEwNzUsMTk2NjEwLDEzMTA3MiwxMzEwNzYsMTMxMDc1LDI2MjE0NSwxMzEwNzIsMTMxMDc2LDEzMTA3NSwxOTY2MTAsMTMxMDcyLDEzMTA3NiwxMzEwNzUsMjYyMTQ5XSksczA9SW50MzJBcnJheS5mcm9tKFswLDAsMCwwLDAsNDA5Niw5MjE2LDIxNTA0LDM1ODQwLDQ0MDMyLDUzMjQ4LDYzNDg4LDc0NzUyLDg3MDQwLDkzNjk2LDEwMDg2NCwxMDQ3MDQsMTA2NzUyLDEwODkyOCwxMTM1MzYsMTE1OTY4LDExODUyOCwxMTk4NzIsMTIxMjgwLDEyMjAxNl0pLFM9SW50MzJBcnJheS5mcm9tKFswLDAsMCwwLDEwLDEwLDExLDExLDEwLDEwLDEwLDEwLDEwLDksOSw4LDcsNyw4LDcsNyw2LDYsNSw1XSkseTA9SW50MzJBcnJheS5mcm9tKFsxLDUsOSwxMywxNywyNSwzMyw0MSw0OSw2NSw4MSw5NywxMTMsMTQ1LDE3NywyMDksMjQxLDMwNSwzNjksNDk3LDc1MywxMjY1LDIyODksNDMzNyw4NDMzLDE2NjI1XSkscDA9SW50MzJBcnJheS5mcm9tKFsyLDIsMiwyLDMsMywzLDMsNCw0LDQsNCw1LDUsNSw1LDYsNiw3LDgsOSwxMCwxMSwxMiwxMywyNF0pLHg9SW50MTZBcnJheS5mcm9tKFswLDAsMCwwLDAsMCwxLDEsMiwyLDMsMyw0LDQsNSw1LDYsNyw4LDksMTAsMTIsMTQsMjRdKSxNPUludDE2QXJyYXkuZnJvbShbMCwwLDAsMCwwLDAsMCwwLDEsMSwyLDIsMywzLDQsNCw1LDUsNiw3LDgsOSwxMCwyNF0pLHQwPW5ldyBJbnQxNkFycmF5KDI4MTYpO1AwKHQwKTtmdW5jdGlvbiBqKGUpe2Zvcih2YXIgbj0tMSx0PTE2O3Q+MDspZT4+PnQhPTAmJihuKz10LGU9ZT4+PnQpLHQ9dD4+MTtyZXR1cm4gbitlfWZ1bmN0aW9uIG0wKGUsbix0KXtyZXR1cm4gMTYrbisyKih0PDxlKX1mdW5jdGlvbiBnMChlLG4sdCl7aWYoZTx0KygyPDxuKSl0aHJvdyJtYXhEaXN0YW5jZSBpcyB0b28gc21hbGwiO3ZhciBpPShlLXQ+Pm4pKzQsYT1qKGkpLTEsdT1hLTE8PDF8aT4+YSYxO3JldHVybih1LTE8PG4pKygxPDxuKSt0KzE2fWZ1bmN0aW9uIFAwKGUpe3ZhciBuPW5ldyBJbnQxNkFycmF5KDI0KSx0PW5ldyBJbnQxNkFycmF5KDI0KTt0WzBdPTI7Zm9yKHZhciBpPTA7aTwyMzsrK2kpbltpKzFdPW5baV0rKDE8PHhbaV0pLHRbaSsxXT10W2ldKygxPDxNW2ldKTtmb3IodmFyIGE9MDthPDcwNDsrK2Epe3ZhciB1PWE+Pj42LHI9LTQ7dT49MiYmKHUtPTIscj0wKTt2YXIgbz0oMTcwMDY0Pj4+dSoyJjMpPDwzfGE+Pj4zJjcsbD0oMTU2MjI4Pj4+dSoyJjMpPDwzfGEmNyxzPXRbbF0sYz1yKyhzPjQ/MzpzLTIpLGQ9YSo0O2VbZCswXT14W29dfE1bbF08PDgsZVtkKzFdPW5bb10sZVtkKzJdPXRbbF0sZVtkKzNdPWN9fWZ1bmN0aW9uIE4oZSl7dmFyIG49ZS5pc0xhcmdlV2luZG93O2lmKGUuaXNMYXJnZVdpbmRvdz0wLGUuYml0T2Zmc2V0Pj0xNiYmKGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2KSxoKGUsMSk9PTApcmV0dXJuIDE2O3ZhciB0PWgoZSwzKTtyZXR1cm4gdCE9MD8xNyt0Oih0PWgoZSwzKSx0IT0wP3Q9PTE/bj09MHx8KGUuaXNMYXJnZVdpbmRvdz0xLGgoZSwxKT09MSl8fCh0PWgoZSw2KSx0PDEwfHx0PjMwKT8tMTp0OjgrdDoxNyl9ZnVuY3Rpb24gdjAoZSxuKXtpZihlLnJ1bm5pbmdTdGF0ZSE9MCl0aHJvdyJTdGF0ZSBNVVNUIGJlIHVuaW5pdGlhbGl6ZWQiO2UuYmxvY2tUcmVlcz1uZXcgSW50MzJBcnJheSgzMDkxKSxlLmJsb2NrVHJlZXNbMF09NyxlLmRpc3RSYklkeD0zO3ZhciB0PWcwKDIxNDc0ODM2NDQsMywxNTw8Myk7ZS5kaXN0RXh0cmFCaXRzPW5ldyBJbnQ4QXJyYXkodCksZS5kaXN0T2Zmc2V0PW5ldyBJbnQzMkFycmF5KHQpLGUuaW5wdXQ9bixLMChlKSxlLnJ1bm5pbmdTdGF0ZT0xfWZ1bmN0aW9uIGwwKGUpe2lmKGUucnVubmluZ1N0YXRlPT0wKXRocm93IlN0YXRlIE1VU1QgYmUgaW5pdGlhbGl6ZWQiO2UucnVubmluZ1N0YXRlIT0xMSYmKGUucnVubmluZ1N0YXRlPTExLGUuaW5wdXQhPW51bGwmJihuZShlLmlucHV0KSxlLmlucHV0PW51bGwpKX1mdW5jdGlvbiBpMChlKXtpZihlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNiksaChlLDEpIT0wKXt2YXIgbj1oKGUsMyk7cmV0dXJuIG49PTA/MTpoKGUsbikrKDE8PG4pfXJldHVybiAwfWZ1bmN0aW9uIGYoZSl7aWYoZS5iaXRPZmZzZXQ+PTE2JiYoZS5hY2N1bXVsYXRvcjMyPWUuc2hvcnRCdWZmZXJbZS5oYWxmT2Zmc2V0KytdPDwxNnxlLmFjY3VtdWxhdG9yMzI+Pj4xNixlLmJpdE9mZnNldC09MTYpLGUuaW5wdXRFbmQ9aChlLDEpLGUubWV0YUJsb2NrTGVuZ3RoPTAsZS5pc1VuY29tcHJlc3NlZD0wLGUuaXNNZXRhZGF0YT0wLCEoZS5pbnB1dEVuZCE9MCYmaChlLDEpIT0wKSl7dmFyIG49aChlLDIpKzQ7aWYobj09Nyl7aWYoZS5pc01ldGFkYXRhPTEsaChlLDEpIT0wKXRocm93IkNvcnJ1cHRlZCByZXNlcnZlZCBiaXQiO3ZhciB0PWgoZSwyKTtpZih0PT0wKXJldHVybjtmb3IodmFyIGk9MDtpPHQ7aSsrKXtlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNik7dmFyIGE9aChlLDgpO2lmKGE9PTAmJmkrMT09dCYmdD4xKXRocm93IkV4dWJlcmFudCBuaWJibGUiO2UubWV0YUJsb2NrTGVuZ3RofD1hPDxpKjh9fWVsc2UgZm9yKHZhciBpPTA7aTxuO2krKyl7ZS5iaXRPZmZzZXQ+PTE2JiYoZS5hY2N1bXVsYXRvcjMyPWUuc2hvcnRCdWZmZXJbZS5oYWxmT2Zmc2V0KytdPDwxNnxlLmFjY3VtdWxhdG9yMzI+Pj4xNixlLmJpdE9mZnNldC09MTYpO3ZhciBhPWgoZSw0KTtpZihhPT0wJiZpKzE9PW4mJm4+NCl0aHJvdyJFeHViZXJhbnQgbmliYmxlIjtlLm1ldGFCbG9ja0xlbmd0aHw9YTw8aSo0fWUubWV0YUJsb2NrTGVuZ3RoKyssZS5pbnB1dEVuZD09MCYmKGUuaXNVbmNvbXByZXNzZWQ9aChlLDEpKX19ZnVuY3Rpb24gZyhlLG4sdCl7dmFyIGk9ZVtuXSxhPXQuYWNjdW11bGF0b3IzMj4+PnQuYml0T2Zmc2V0O2krPWEmMjU1O3ZhciB1PWVbaV0+PjE2LHI9ZVtpXSY2NTUzNTtpZih1PD04KXJldHVybiB0LmJpdE9mZnNldCs9dSxyO2krPXI7dmFyIG89KDE8PHUpLTE7cmV0dXJuIGkrPShhJm8pPj4+OCx0LmJpdE9mZnNldCs9KGVbaV0+PjE2KSs4LGVbaV0mNjU1MzV9ZnVuY3Rpb24gUChlLG4sdCl7dC5iaXRPZmZzZXQ+PTE2JiYodC5hY2N1bXVsYXRvcjMyPXQuc2hvcnRCdWZmZXJbdC5oYWxmT2Zmc2V0KytdPDwxNnx0LmFjY3VtdWxhdG9yMzI+Pj4xNix0LmJpdE9mZnNldC09MTYpO3ZhciBpPWcoZSxuLHQpLGE9cDBbaV07cmV0dXJuIHQuYml0T2Zmc2V0Pj0xNiYmKHQuYWNjdW11bGF0b3IzMj10LnNob3J0QnVmZmVyW3QuaGFsZk9mZnNldCsrXTw8MTZ8dC5hY2N1bXVsYXRvcjMyPj4+MTYsdC5iaXRPZmZzZXQtPTE2KSx5MFtpXSsoYTw9MTY/aCh0LGEpOmIwKHQsYSkpfWZ1bmN0aW9uIFgoZSxuKXtmb3IodmFyIHQ9ZVtuXTtuPjA7bi0tKWVbbl09ZVtuLTFdO2VbMF09dH1mdW5jdGlvbiBGKGUsbil7Zm9yKHZhciB0PW5ldyBJbnQzMkFycmF5KDI1NiksaT0wO2k8MjU2O2krKyl0W2ldPWk7Zm9yKHZhciBpPTA7aTxuO2krKyl7dmFyIGE9ZVtpXSYyNTU7ZVtpXT10W2FdLGEhPTAmJlgodCxhKX19ZnVuY3Rpb24gcChlLG4sdCxpKXt2YXIgYT0wLHU9OCxyPTAsbz0wLGw9MzI3Njgscz1uZXcgSW50MzJBcnJheSgzMisxKSxjPXMubGVuZ3RoLTE7Zm9yKFEwKHMsYyw1LGUsMTgpO2E8biYmbD4wOyl7aS5oYWxmT2Zmc2V0PjIwMzAmJkwoaSksaS5iaXRPZmZzZXQ+PTE2JiYoaS5hY2N1bXVsYXRvcjMyPWkuc2hvcnRCdWZmZXJbaS5oYWxmT2Zmc2V0KytdPDwxNnxpLmFjY3VtdWxhdG9yMzI+Pj4xNixpLmJpdE9mZnNldC09MTYpO3ZhciBkPWkuYWNjdW11bGF0b3IzMj4+PmkuYml0T2Zmc2V0JjMxO2kuYml0T2Zmc2V0Kz1zW2RdPj4xNjt2YXIgbT1zW2RdJjY1NTM1O2lmKG08MTYpcj0wLHRbYSsrXT1tLG0hPTAmJih1PW0sbC09MzI3Njg+Pm0pO2Vsc2V7dmFyIHc9bS0xNCwkPTA7bT09MTYmJigkPXUpLG8hPSQmJihyPTAsbz0kKTt2YXIgXz1yO3I+MCYmKHItPTIscjw8PXcpLGkuYml0T2Zmc2V0Pj0xNiYmKGkuYWNjdW11bGF0b3IzMj1pLnNob3J0QnVmZmVyW2kuaGFsZk9mZnNldCsrXTw8MTZ8aS5hY2N1bXVsYXRvcjMyPj4+MTYsaS5iaXRPZmZzZXQtPTE2KSxyKz1oKGksdykrMzt2YXIgVT1yLV87aWYoYStVPm4pdGhyb3cic3ltYm9sICsgcmVwZWF0RGVsdGEgPiBudW1TeW1ib2xzIjtmb3IodmFyIE89MDtPPFU7TysrKXRbYSsrXT1vO28hPTAmJihsLT1VPDwxNS1vKX19aWYobCE9MCl0aHJvdyJVbnVzZWQgc3BhY2UiO3QuZmlsbCgwLGEsbil9ZnVuY3Rpb24gQihlLG4pe2Zvcih2YXIgdD0wO3Q8bi0xOysrdClmb3IodmFyIGk9dCsxO2k8bjsrK2kpaWYoZVt0XT09ZVtpXSl0aHJvdyJEdXBsaWNhdGUgc2ltcGxlIEh1ZmZtYW4gY29kZSBzeW1ib2wifWZ1bmN0aW9uIGsoZSxuLHQsaSxhKXtmb3IodmFyIHU9bmV3IEludDMyQXJyYXkobikscj1uZXcgSW50MzJBcnJheSg0KSxvPTEraihlLTEpLGw9aChhLDIpKzEscz0wO3M8bDtzKyspe2EuYml0T2Zmc2V0Pj0xNiYmKGEuYWNjdW11bGF0b3IzMj1hLnNob3J0QnVmZmVyW2EuaGFsZk9mZnNldCsrXTw8MTZ8YS5hY2N1bXVsYXRvcjMyPj4+MTYsYS5iaXRPZmZzZXQtPTE2KTt2YXIgYz1oKGEsbyk7aWYoYz49bil0aHJvdyJDYW4ndCByZWFkSHVmZm1hbkNvZGUiO3Jbc109Y31CKHIsbCk7dmFyIGQ9bDtzd2l0Y2gobD09NCYmKGQrPWgoYSwxKSksZCl7Y2FzZSAxOnVbclswXV09MTticmVhaztjYXNlIDI6dVtyWzBdXT0xLHVbclsxXV09MTticmVhaztjYXNlIDM6dVtyWzBdXT0xLHVbclsxXV09Mix1W3JbMl1dPTI7YnJlYWs7Y2FzZSA0OnVbclswXV09Mix1W3JbMV1dPTIsdVtyWzJdXT0yLHVbclszXV09MjticmVhaztjYXNlIDU6dVtyWzBdXT0xLHVbclsxXV09Mix1W3JbMl1dPTMsdVtyWzNdXT0zO2JyZWFrfXJldHVybiBRMCh0LGksOCx1LG4pfWZ1bmN0aW9uIFQoZSxuLHQsaSxhKXtmb3IodmFyIHU9bmV3IEludDMyQXJyYXkoZSkscj1uZXcgSW50MzJBcnJheSgxOCksbz0zMixsPTAscz1uO3M8MTgmJm8+MDtzKyspe3ZhciBjPWYwW3NdO2EuYml0T2Zmc2V0Pj0xNiYmKGEuYWNjdW11bGF0b3IzMj1hLnNob3J0QnVmZmVyW2EuaGFsZk9mZnNldCsrXTw8MTZ8YS5hY2N1bXVsYXRvcjMyPj4+MTYsYS5iaXRPZmZzZXQtPTE2KTt2YXIgZD1hLmFjY3VtdWxhdG9yMzI+Pj5hLmJpdE9mZnNldCYxNTthLmJpdE9mZnNldCs9cjBbZF0+PjE2O3ZhciBtPXIwW2RdJjY1NTM1O3JbY109bSxtIT0wJiYoby09MzI+Pm0sbCsrKX1pZihvIT0wJiZsIT0xKXRocm93IkNvcnJ1cHRlZCBIdWZmbWFuIGNvZGUgaGlzdG9ncmFtIjtyZXR1cm4gcChyLGUsdSxhKSxRMCh0LGksOCx1LGUpfWZ1bmN0aW9uIFkoZSxuLHQsaSxhKXthLmhhbGZPZmZzZXQ+MjAzMCYmTChhKSxhLmJpdE9mZnNldD49MTYmJihhLmFjY3VtdWxhdG9yMzI9YS5zaG9ydEJ1ZmZlclthLmhhbGZPZmZzZXQrK108PDE2fGEuYWNjdW11bGF0b3IzMj4+PjE2LGEuYml0T2Zmc2V0LT0xNik7dmFyIHU9aChhLDIpO3JldHVybiB1PT0xP2soZSxuLHQsaSxhKTpUKG4sdSx0LGksYSl9ZnVuY3Rpb24gRChlLG4sdCl7dC5oYWxmT2Zmc2V0PjIwMzAmJkwodCk7dmFyIGk9aTAodCkrMTtpZihpPT0xKXJldHVybiBuLmZpbGwoMCwwLGUpLGk7dC5iaXRPZmZzZXQ+PTE2JiYodC5hY2N1bXVsYXRvcjMyPXQuc2hvcnRCdWZmZXJbdC5oYWxmT2Zmc2V0KytdPDwxNnx0LmFjY3VtdWxhdG9yMzI+Pj4xNix0LmJpdE9mZnNldC09MTYpO3ZhciBhPWgodCwxKSx1PTA7YSE9MCYmKHU9aCh0LDQpKzEpO3ZhciByPWkrdSxvPUpbciszMT4+NV0sbD1uZXcgSW50MzJBcnJheShvKzEpLHM9bC5sZW5ndGgtMTtZKHIscixsLHMsdCk7Zm9yKHZhciBjPTA7YzxlOyl7dC5oYWxmT2Zmc2V0PjIwMzAmJkwodCksdC5iaXRPZmZzZXQ+PTE2JiYodC5hY2N1bXVsYXRvcjMyPXQuc2hvcnRCdWZmZXJbdC5oYWxmT2Zmc2V0KytdPDwxNnx0LmFjY3VtdWxhdG9yMzI+Pj4xNix0LmJpdE9mZnNldC09MTYpO3ZhciBkPWcobCxzLHQpO2lmKGQ9PTApbltjXT0wLGMrKztlbHNlIGlmKGQ8PXUpe3QuYml0T2Zmc2V0Pj0xNiYmKHQuYWNjdW11bGF0b3IzMj10LnNob3J0QnVmZmVyW3QuaGFsZk9mZnNldCsrXTw8MTZ8dC5hY2N1bXVsYXRvcjMyPj4+MTYsdC5iaXRPZmZzZXQtPTE2KTtmb3IodmFyIG09KDE8PGQpK2godCxkKTttIT0wOyl7aWYoYz49ZSl0aHJvdyJDb3JydXB0ZWQgY29udGV4dCBtYXAiO25bY109MCxjKyssbS0tfX1lbHNlIG5bY109ZC11LGMrK31yZXR1cm4gdC5iaXRPZmZzZXQ+PTE2JiYodC5hY2N1bXVsYXRvcjMyPXQuc2hvcnRCdWZmZXJbdC5oYWxmT2Zmc2V0KytdPDwxNnx0LmFjY3VtdWxhdG9yMzI+Pj4xNix0LmJpdE9mZnNldC09MTYpLGgodCwxKT09MSYmRihuLGUpLGl9ZnVuY3Rpb24gSyhlLG4sdCl7dmFyIGk9ZS5yaW5ncyxhPTQrbioyO2UuYml0T2Zmc2V0Pj0xNiYmKGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2KTt2YXIgdT1nKGUuYmxvY2tUcmVlcywyKm4sZSkscj1QKGUuYmxvY2tUcmVlcywyKm4rMSxlKTtyZXR1cm4gdT09MT91PWlbYSsxXSsxOnU9PTA/dT1pW2FdOnUtPTIsdT49dCYmKHUtPXQpLGlbYV09aVthKzFdLGlbYSsxXT11LHJ9ZnVuY3Rpb24gbjAoZSl7ZS5saXRlcmFsQmxvY2tMZW5ndGg9SyhlLDAsZS5udW1MaXRlcmFsQmxvY2tUeXBlcyk7dmFyIG49ZS5yaW5nc1s1XTtlLmNvbnRleHRNYXBTbGljZT1uPDw2LGUubGl0ZXJhbFRyZWVJZHg9ZS5jb250ZXh0TWFwW2UuY29udGV4dE1hcFNsaWNlXSYyNTU7dmFyIHQ9ZS5jb250ZXh0TW9kZXNbbl07ZS5jb250ZXh0TG9va3VwT2Zmc2V0MT10PDw5LGUuY29udGV4dExvb2t1cE9mZnNldDI9ZS5jb250ZXh0TG9va3VwT2Zmc2V0MSsyNTZ9ZnVuY3Rpb24gYTAoZSl7ZS5jb21tYW5kQmxvY2tMZW5ndGg9SyhlLDEsZS5udW1Db21tYW5kQmxvY2tUeXBlcyksZS5jb21tYW5kVHJlZUlkeD1lLnJpbmdzWzddfWZ1bmN0aW9uIGMwKGUpe2UuZGlzdGFuY2VCbG9ja0xlbmd0aD1LKGUsMixlLm51bURpc3RhbmNlQmxvY2tUeXBlcyksZS5kaXN0Q29udGV4dE1hcFNsaWNlPWUucmluZ3NbOV08PDJ9ZnVuY3Rpb24gdTAoZSl7dmFyIG49ZS5tYXhSaW5nQnVmZmVyU2l6ZTtpZihuPmUuZXhwZWN0ZWRUb3RhbFNpemUpe2Zvcih2YXIgdD1lLmV4cGVjdGVkVG90YWxTaXplO24+PjE+dDspbj4+PTE7ZS5pbnB1dEVuZD09MCYmbjwxNjM4NCYmZS5tYXhSaW5nQnVmZmVyU2l6ZT49MTYzODQmJihuPTE2Mzg0KX1pZighKG48PWUucmluZ0J1ZmZlclNpemUpKXt2YXIgaT1uKzM3LGE9bmV3IEludDhBcnJheShpKTtlLnJpbmdCdWZmZXIubGVuZ3RoIT0wJiZhLnNldChlLnJpbmdCdWZmZXIuc3ViYXJyYXkoMCwwK2UucmluZ0J1ZmZlclNpemUpLDApLGUucmluZ0J1ZmZlcj1hLGUucmluZ0J1ZmZlclNpemU9bn19ZnVuY3Rpb24gWDAoZSl7aWYoZS5pbnB1dEVuZCE9MCl7ZS5uZXh0UnVubmluZ1N0YXRlPTEwLGUucnVubmluZ1N0YXRlPTEyO3JldHVybn1lLmxpdGVyYWxUcmVlR3JvdXA9bmV3IEludDMyQXJyYXkoMCksZS5jb21tYW5kVHJlZUdyb3VwPW5ldyBJbnQzMkFycmF5KDApLGUuZGlzdGFuY2VUcmVlR3JvdXA9bmV3IEludDMyQXJyYXkoMCksZS5oYWxmT2Zmc2V0PjIwMzAmJkwoZSksZihlKSwhKGUubWV0YUJsb2NrTGVuZ3RoPT0wJiZlLmlzTWV0YWRhdGE9PTApJiYoZS5pc1VuY29tcHJlc3NlZCE9MHx8ZS5pc01ldGFkYXRhIT0wPyhEMChlKSxlLnJ1bm5pbmdTdGF0ZT1lLmlzTWV0YWRhdGEhPTA/NTo2KTplLnJ1bm5pbmdTdGF0ZT0zLGUuaXNNZXRhZGF0YT09MCYmKGUuZXhwZWN0ZWRUb3RhbFNpemUrPWUubWV0YUJsb2NrTGVuZ3RoLGUuZXhwZWN0ZWRUb3RhbFNpemU+MTw8MzAmJihlLmV4cGVjdGVkVG90YWxTaXplPTE8PDMwKSxlLnJpbmdCdWZmZXJTaXplPGUubWF4UmluZ0J1ZmZlclNpemUmJnUwKGUpKSl9ZnVuY3Rpb24gdzAoZSxuLHQpe3ZhciBpPWUuYmxvY2tUcmVlc1syKm5dO2lmKHQ8PTEpcmV0dXJuIGUuYmxvY2tUcmVlc1syKm4rMV09aSxlLmJsb2NrVHJlZXNbMipuKzJdPWksMTw8Mjg7dmFyIGE9dCsyO2krPVkoYSxhLGUuYmxvY2tUcmVlcywyKm4sZSksZS5ibG9ja1RyZWVzWzIqbisxXT1pO3ZhciB1PTI2O3JldHVybiBpKz1ZKHUsdSxlLmJsb2NrVHJlZXMsMipuKzEsZSksZS5ibG9ja1RyZWVzWzIqbisyXT1pLFAoZS5ibG9ja1RyZWVzLDIqbisxLGUpfWZ1bmN0aW9uIF8wKGUsbil7Zm9yKHZhciB0PWUuZGlzdEV4dHJhQml0cyxpPWUuZGlzdE9mZnNldCxhPWUuZGlzdGFuY2VQb3N0Zml4Qml0cyx1PWUubnVtRGlyZWN0RGlzdGFuY2VDb2RlcyxyPTE8PGEsbz0xLGw9MCxzPTE2LGM9MDtjPHU7KytjKXRbc109MCxpW3NdPWMrMSwrK3M7Zm9yKDtzPG47KXtmb3IodmFyIGQ9dSsoKDIrbDw8byktNDw8YSkrMSxjPTA7YzxyOysrYyl0W3NdPW8saVtzXT1kK2MsKytzO289bytsLGw9bF4xfX1mdW5jdGlvbiB6MChlKXtlLm51bUxpdGVyYWxCbG9ja1R5cGVzPWkwKGUpKzEsZS5saXRlcmFsQmxvY2tMZW5ndGg9dzAoZSwwLGUubnVtTGl0ZXJhbEJsb2NrVHlwZXMpLGUubnVtQ29tbWFuZEJsb2NrVHlwZXM9aTAoZSkrMSxlLmNvbW1hbmRCbG9ja0xlbmd0aD13MChlLDEsZS5udW1Db21tYW5kQmxvY2tUeXBlcyksZS5udW1EaXN0YW5jZUJsb2NrVHlwZXM9aTAoZSkrMSxlLmRpc3RhbmNlQmxvY2tMZW5ndGg9dzAoZSwyLGUubnVtRGlzdGFuY2VCbG9ja1R5cGVzKSxlLmhhbGZPZmZzZXQ+MjAzMCYmTChlKSxlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNiksZS5kaXN0YW5jZVBvc3RmaXhCaXRzPWgoZSwyKSxlLm51bURpcmVjdERpc3RhbmNlQ29kZXM9aChlLDQpPDxlLmRpc3RhbmNlUG9zdGZpeEJpdHMsZS5kaXN0YW5jZVBvc3RmaXhNYXNrPSgxPDxlLmRpc3RhbmNlUG9zdGZpeEJpdHMpLTEsZS5jb250ZXh0TW9kZXM9bmV3IEludDhBcnJheShlLm51bUxpdGVyYWxCbG9ja1R5cGVzKTtmb3IodmFyIG49MDtuPGUubnVtTGl0ZXJhbEJsb2NrVHlwZXM7KXtmb3IodmFyIHQ9VihuKzk2LGUubnVtTGl0ZXJhbEJsb2NrVHlwZXMpO248dDsrK24pZS5iaXRPZmZzZXQ+PTE2JiYoZS5hY2N1bXVsYXRvcjMyPWUuc2hvcnRCdWZmZXJbZS5oYWxmT2Zmc2V0KytdPDwxNnxlLmFjY3VtdWxhdG9yMzI+Pj4xNixlLmJpdE9mZnNldC09MTYpLGUuY29udGV4dE1vZGVzW25dPWgoZSwyKTtlLmhhbGZPZmZzZXQ+MjAzMCYmTChlKX1lLmNvbnRleHRNYXA9bmV3IEludDhBcnJheShlLm51bUxpdGVyYWxCbG9ja1R5cGVzPDw2KTt2YXIgaT1EKGUubnVtTGl0ZXJhbEJsb2NrVHlwZXM8PDYsZS5jb250ZXh0TWFwLGUpO2UudHJpdmlhbExpdGVyYWxDb250ZXh0PTE7Zm9yKHZhciBhPTA7YTxlLm51bUxpdGVyYWxCbG9ja1R5cGVzPDw2O2ErKylpZihlLmNvbnRleHRNYXBbYV0hPWE+PjYpe2UudHJpdmlhbExpdGVyYWxDb250ZXh0PTA7YnJlYWt9ZS5kaXN0Q29udGV4dE1hcD1uZXcgSW50OEFycmF5KGUubnVtRGlzdGFuY2VCbG9ja1R5cGVzPDwyKTt2YXIgdT1EKGUubnVtRGlzdGFuY2VCbG9ja1R5cGVzPDwyLGUuZGlzdENvbnRleHRNYXAsZSk7ZS5saXRlcmFsVHJlZUdyb3VwPVkwKDI1NiwyNTYsaSxlKSxlLmNvbW1hbmRUcmVlR3JvdXA9WTAoNzA0LDcwNCxlLm51bUNvbW1hbmRCbG9ja1R5cGVzLGUpO3ZhciByPW0wKGUuZGlzdGFuY2VQb3N0Zml4Qml0cyxlLm51bURpcmVjdERpc3RhbmNlQ29kZXMsMjQpLG89cjtlLmlzTGFyZ2VXaW5kb3c9PTEmJihyPW0wKGUuZGlzdGFuY2VQb3N0Zml4Qml0cyxlLm51bURpcmVjdERpc3RhbmNlQ29kZXMsNjIpLG89ZzAoMjE0NzQ4MzY0NCxlLmRpc3RhbmNlUG9zdGZpeEJpdHMsZS5udW1EaXJlY3REaXN0YW5jZUNvZGVzKSksZS5kaXN0YW5jZVRyZWVHcm91cD1ZMChyLG8sdSxlKSxfMChlLG8pLGUuY29udGV4dE1hcFNsaWNlPTAsZS5kaXN0Q29udGV4dE1hcFNsaWNlPTAsZS5jb250ZXh0TG9va3VwT2Zmc2V0MT1lLmNvbnRleHRNb2Rlc1swXSo1MTIsZS5jb250ZXh0TG9va3VwT2Zmc2V0Mj1lLmNvbnRleHRMb29rdXBPZmZzZXQxKzI1NixlLmxpdGVyYWxUcmVlSWR4PTAsZS5jb21tYW5kVHJlZUlkeD0wLGUucmluZ3NbNF09MSxlLnJpbmdzWzVdPTAsZS5yaW5nc1s2XT0xLGUucmluZ3NbN109MCxlLnJpbmdzWzhdPTEsZS5yaW5nc1s5XT0wfWZ1bmN0aW9uIFIwKGUpe3ZhciBuPWUucmluZ0J1ZmZlcjtpZihlLm1ldGFCbG9ja0xlbmd0aDw9MCl7UzAoZSksZS5ydW5uaW5nU3RhdGU9MjtyZXR1cm59dmFyIHQ9VihlLnJpbmdCdWZmZXJTaXplLWUucG9zLGUubWV0YUJsb2NrTGVuZ3RoKTtpZihWMChlLG4sZS5wb3MsdCksZS5tZXRhQmxvY2tMZW5ndGgtPXQsZS5wb3MrPXQsZS5wb3M9PWUucmluZ0J1ZmZlclNpemUpe2UubmV4dFJ1bm5pbmdTdGF0ZT02LGUucnVubmluZ1N0YXRlPTEyO3JldHVybn1TMChlKSxlLnJ1bm5pbmdTdGF0ZT0yfWZ1bmN0aW9uIE0wKGUpe3ZhciBuPVYoZS5vdXRwdXRMZW5ndGgtZS5vdXRwdXRVc2VkLGUucmluZ0J1ZmZlckJ5dGVzUmVhZHktZS5yaW5nQnVmZmVyQnl0ZXNXcml0dGVuKTtyZXR1cm4gbiE9MCYmKGUub3V0cHV0LnNldChlLnJpbmdCdWZmZXIuc3ViYXJyYXkoZS5yaW5nQnVmZmVyQnl0ZXNXcml0dGVuLGUucmluZ0J1ZmZlckJ5dGVzV3JpdHRlbituKSxlLm91dHB1dE9mZnNldCtlLm91dHB1dFVzZWQpLGUub3V0cHV0VXNlZCs9bixlLnJpbmdCdWZmZXJCeXRlc1dyaXR0ZW4rPW4pLGUub3V0cHV0VXNlZDxlLm91dHB1dExlbmd0aD8xOjB9ZnVuY3Rpb24gWTAoZSxuLHQsaSl7Zm9yKHZhciBhPUpbbiszMT4+NV0sdT1uZXcgSW50MzJBcnJheSh0K3QqYSkscj10LG89MDtvPHQ7KytvKXVbb109cixyKz1ZKGUsbix1LG8saSk7cmV0dXJuIHV9ZnVuY3Rpb24gQTAoZSl7dmFyIG49ZS5yaW5nQnVmZmVyU2l6ZTtyZXR1cm4gZS5pc0VhZ2VyIT0wJiYobj1WKG4sZS5yaW5nQnVmZmVyQnl0ZXNXcml0dGVuK2Uub3V0cHV0TGVuZ3RoLWUub3V0cHV0VXNlZCkpLG59ZnVuY3Rpb24gVTAoZSl7aWYoZS5ydW5uaW5nU3RhdGU9PTApdGhyb3ciQ2FuJ3QgZGVjb21wcmVzcyB1bnRpbCBpbml0aWFsaXplZCI7aWYoZS5ydW5uaW5nU3RhdGU9PTExKXRocm93IkNhbid0IGRlY29tcHJlc3MgYWZ0ZXIgY2xvc2UiO2lmKGUucnVubmluZ1N0YXRlPT0xKXt2YXIgbj1OKGUpO2lmKG49PS0xKXRocm93IkludmFsaWQgJ3dpbmRvd0JpdHMnIGNvZGUiO2UubWF4UmluZ0J1ZmZlclNpemU9MTw8bixlLm1heEJhY2t3YXJkRGlzdGFuY2U9ZS5tYXhSaW5nQnVmZmVyU2l6ZS0xNixlLnJ1bm5pbmdTdGF0ZT0yfWZvcih2YXIgdD1BMChlKSxpPWUucmluZ0J1ZmZlclNpemUtMSxhPWUucmluZ0J1ZmZlcjtlLnJ1bm5pbmdTdGF0ZSE9MTA7KXN3aXRjaChlLnJ1bm5pbmdTdGF0ZSl7Y2FzZSAyOmlmKGUubWV0YUJsb2NrTGVuZ3RoPDApdGhyb3ciSW52YWxpZCBtZXRhYmxvY2sgbGVuZ3RoIjtYMChlKSx0PUEwKGUpLGk9ZS5yaW5nQnVmZmVyU2l6ZS0xLGE9ZS5yaW5nQnVmZmVyO2NvbnRpbnVlO2Nhc2UgMzp6MChlKSxlLnJ1bm5pbmdTdGF0ZT00O2Nhc2UgNDppZihlLm1ldGFCbG9ja0xlbmd0aDw9MCl7ZS5ydW5uaW5nU3RhdGU9Mjtjb250aW51ZX1lLmhhbGZPZmZzZXQ+MjAzMCYmTChlKSxlLmNvbW1hbmRCbG9ja0xlbmd0aD09MCYmYTAoZSksZS5jb21tYW5kQmxvY2tMZW5ndGgtLSxlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNik7dmFyIHU9ZyhlLmNvbW1hbmRUcmVlR3JvdXAsZS5jb21tYW5kVHJlZUlkeCxlKTw8MixyPXQwW3VdLG89dDBbdSsxXSxsPXQwW3UrMl07ZS5kaXN0YW5jZUNvZGU9dDBbdSszXSxlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNik7dmFyIHM9ciYyNTU7ZS5pbnNlcnRMZW5ndGg9bysoczw9MTY/aChlLHMpOmIwKGUscykpLGUuYml0T2Zmc2V0Pj0xNiYmKGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2KTt2YXIgcz1yPj44O2UuY29weUxlbmd0aD1sKyhzPD0xNj9oKGUscyk6YjAoZSxzKSksZS5qPTAsZS5ydW5uaW5nU3RhdGU9NztjYXNlIDc6aWYoZS50cml2aWFsTGl0ZXJhbENvbnRleHQhPTApe2Zvcig7ZS5qPGUuaW5zZXJ0TGVuZ3RoOylpZihlLmhhbGZPZmZzZXQ+MjAzMCYmTChlKSxlLmxpdGVyYWxCbG9ja0xlbmd0aD09MCYmbjAoZSksZS5saXRlcmFsQmxvY2tMZW5ndGgtLSxlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNiksYVtlLnBvc109ZyhlLmxpdGVyYWxUcmVlR3JvdXAsZS5saXRlcmFsVHJlZUlkeCxlKSxlLnBvcysrLGUuaisrLGUucG9zPj10KXtlLm5leHRSdW5uaW5nU3RhdGU9NyxlLnJ1bm5pbmdTdGF0ZT0xMjticmVha319ZWxzZSBmb3IodmFyIGM9YVtlLnBvcy0xJmldJjI1NSxkPWFbZS5wb3MtMiZpXSYyNTU7ZS5qPGUuaW5zZXJ0TGVuZ3RoOyl7ZS5oYWxmT2Zmc2V0PjIwMzAmJkwoZSksZS5saXRlcmFsQmxvY2tMZW5ndGg9PTAmJm4wKGUpO3ZhciBtPUIwW2UuY29udGV4dExvb2t1cE9mZnNldDErY118QjBbZS5jb250ZXh0TG9va3VwT2Zmc2V0MitkXSx3PWUuY29udGV4dE1hcFtlLmNvbnRleHRNYXBTbGljZSttXSYyNTU7aWYoZS5saXRlcmFsQmxvY2tMZW5ndGgtLSxkPWMsZS5iaXRPZmZzZXQ+PTE2JiYoZS5hY2N1bXVsYXRvcjMyPWUuc2hvcnRCdWZmZXJbZS5oYWxmT2Zmc2V0KytdPDwxNnxlLmFjY3VtdWxhdG9yMzI+Pj4xNixlLmJpdE9mZnNldC09MTYpLGM9ZyhlLmxpdGVyYWxUcmVlR3JvdXAsdyxlKSxhW2UucG9zXT1jLGUucG9zKyssZS5qKyssZS5wb3M+PXQpe2UubmV4dFJ1bm5pbmdTdGF0ZT03LGUucnVubmluZ1N0YXRlPTEyO2JyZWFrfX1pZihlLnJ1bm5pbmdTdGF0ZSE9Nyljb250aW51ZTtpZihlLm1ldGFCbG9ja0xlbmd0aC09ZS5pbnNlcnRMZW5ndGgsZS5tZXRhQmxvY2tMZW5ndGg8PTApe2UucnVubmluZ1N0YXRlPTQ7Y29udGludWV9dmFyICQ9ZS5kaXN0YW5jZUNvZGU7aWYoJDwwKWUuZGlzdGFuY2U9ZS5yaW5nc1tlLmRpc3RSYklkeF07ZWxzZXtlLmhhbGZPZmZzZXQ+MjAzMCYmTChlKSxlLmRpc3RhbmNlQmxvY2tMZW5ndGg9PTAmJmMwKGUpLGUuZGlzdGFuY2VCbG9ja0xlbmd0aC0tLGUuYml0T2Zmc2V0Pj0xNiYmKGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2KTt2YXIgXz1lLmRpc3RDb250ZXh0TWFwW2UuZGlzdENvbnRleHRNYXBTbGljZSskXSYyNTU7aWYoJD1nKGUuZGlzdGFuY2VUcmVlR3JvdXAsXyxlKSwkPDE2KXt2YXIgVT1lLmRpc3RSYklkeCtlMFskXSYzO2lmKGUuZGlzdGFuY2U9ZS5yaW5nc1tVXStGMFskXSxlLmRpc3RhbmNlPDApdGhyb3ciTmVnYXRpdmUgZGlzdGFuY2UifWVsc2V7dmFyIHM9ZS5kaXN0RXh0cmFCaXRzWyRdLE87ZS5iaXRPZmZzZXQrczw9MzI/Tz1oKGUscyk6KGUuYml0T2Zmc2V0Pj0xNiYmKGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2KSxPPXM8PTE2P2goZSxzKTpiMChlLHMpKSxlLmRpc3RhbmNlPWUuZGlzdE9mZnNldFskXSsoTzw8ZS5kaXN0YW5jZVBvc3RmaXhCaXRzKX19aWYoZS5tYXhEaXN0YW5jZSE9ZS5tYXhCYWNrd2FyZERpc3RhbmNlJiZlLnBvczxlLm1heEJhY2t3YXJkRGlzdGFuY2U/ZS5tYXhEaXN0YW5jZT1lLnBvczplLm1heERpc3RhbmNlPWUubWF4QmFja3dhcmREaXN0YW5jZSxlLmRpc3RhbmNlPmUubWF4RGlzdGFuY2Upe2UucnVubmluZ1N0YXRlPTk7Y29udGludWV9aWYoJD4wJiYoZS5kaXN0UmJJZHg9ZS5kaXN0UmJJZHgrMSYzLGUucmluZ3NbZS5kaXN0UmJJZHhdPWUuZGlzdGFuY2UpLGUuY29weUxlbmd0aD5lLm1ldGFCbG9ja0xlbmd0aCl0aHJvdyJJbnZhbGlkIGJhY2t3YXJkIHJlZmVyZW5jZSI7ZS5qPTAsZS5ydW5uaW5nU3RhdGU9ODtjYXNlIDg6dmFyIHE9ZS5wb3MtZS5kaXN0YW5jZSZpLEk9ZS5wb3Msej1lLmNvcHlMZW5ndGgtZS5qLG8wPXEreixIPUkrejtpZihvMDxpJiZIPGkpe2lmKHo8MTJ8fG8wPkkmJkg+cSlmb3IodmFyIEE9MDtBPHo7QSs9NClhW0krK109YVtxKytdLGFbSSsrXT1hW3ErK10sYVtJKytdPWFbcSsrXSxhW0krK109YVtxKytdO2Vsc2UgYS5jb3B5V2l0aGluKEkscSxvMCk7ZS5qKz16LGUubWV0YUJsb2NrTGVuZ3RoLT16LGUucG9zKz16fWVsc2UgZm9yKDtlLmo8ZS5jb3B5TGVuZ3RoOylpZihhW2UucG9zXT1hW2UucG9zLWUuZGlzdGFuY2UmaV0sZS5tZXRhQmxvY2tMZW5ndGgtLSxlLnBvcysrLGUuaisrLGUucG9zPj10KXtlLm5leHRSdW5uaW5nU3RhdGU9OCxlLnJ1bm5pbmdTdGF0ZT0xMjticmVha31lLnJ1bm5pbmdTdGF0ZT09OCYmKGUucnVubmluZ1N0YXRlPTQpO2NvbnRpbnVlO2Nhc2UgOTppZihlLmRpc3RhbmNlPjIxNDc0ODM2NDQpdGhyb3ciSW52YWxpZCBiYWNrd2FyZCByZWZlcmVuY2UiO2lmKGUuY29weUxlbmd0aD49NCYmZS5jb3B5TGVuZ3RoPD0yNCl7dmFyIHk9czBbZS5jb3B5TGVuZ3RoXSxkMD1lLmRpc3RhbmNlLWUubWF4RGlzdGFuY2UtMSxFPVNbZS5jb3B5TGVuZ3RoXSxXPSgxPDxFKS0xLEc9ZDAmVyxaPWQwPj4+RTtpZih5Kz1HKmUuY29weUxlbmd0aCxaPDEyMSl7dmFyIGgwPUcwKGEsZS5wb3MsUix5LGUuY29weUxlbmd0aCwkMCxaKTtpZihlLnBvcys9aDAsZS5tZXRhQmxvY2tMZW5ndGgtPWgwLGUucG9zPj10KXtlLm5leHRSdW5uaW5nU3RhdGU9NCxlLnJ1bm5pbmdTdGF0ZT0xMjtjb250aW51ZX19ZWxzZSB0aHJvdyJJbnZhbGlkIGJhY2t3YXJkIHJlZmVyZW5jZSJ9ZWxzZSB0aHJvdyJJbnZhbGlkIGJhY2t3YXJkIHJlZmVyZW5jZSI7ZS5ydW5uaW5nU3RhdGU9NDtjb250aW51ZTtjYXNlIDU6Zm9yKDtlLm1ldGFCbG9ja0xlbmd0aD4wOyllLmhhbGZPZmZzZXQ+MjAzMCYmTChlKSxlLmJpdE9mZnNldD49MTYmJihlLmFjY3VtdWxhdG9yMzI9ZS5zaG9ydEJ1ZmZlcltlLmhhbGZPZmZzZXQrK108PDE2fGUuYWNjdW11bGF0b3IzMj4+PjE2LGUuYml0T2Zmc2V0LT0xNiksaChlLDgpLGUubWV0YUJsb2NrTGVuZ3RoLS07ZS5ydW5uaW5nU3RhdGU9Mjtjb250aW51ZTtjYXNlIDY6UjAoZSk7Y29udGludWU7Y2FzZSAxMjplLnJpbmdCdWZmZXJCeXRlc1JlYWR5PVYoZS5wb3MsZS5yaW5nQnVmZmVyU2l6ZSksZS5ydW5uaW5nU3RhdGU9MTM7Y2FzZSAxMzppZihNMChlKT09MClyZXR1cm47ZS5wb3M+PWUubWF4QmFja3dhcmREaXN0YW5jZSYmKGUubWF4RGlzdGFuY2U9ZS5tYXhCYWNrd2FyZERpc3RhbmNlKSxlLnBvcz49ZS5yaW5nQnVmZmVyU2l6ZSYmKGUucG9zPmUucmluZ0J1ZmZlclNpemUmJmEuY29weVdpdGhpbigwLGUucmluZ0J1ZmZlclNpemUsZS5wb3MpLGUucG9zJj1pLGUucmluZ0J1ZmZlckJ5dGVzV3JpdHRlbj0wKSxlLnJ1bm5pbmdTdGF0ZT1lLm5leHRSdW5uaW5nU3RhdGU7Y29udGludWU7ZGVmYXVsdDp0aHJvdyJVbmV4cGVjdGVkIHN0YXRlICIrZS5ydW5uaW5nU3RhdGV9aWYoZS5ydW5uaW5nU3RhdGU9PTEwKXtpZihlLm1ldGFCbG9ja0xlbmd0aDwwKXRocm93IkludmFsaWQgbWV0YWJsb2NrIGxlbmd0aCI7RDAoZSksQzAoZSwxKX19ZnVuY3Rpb24gSDAoZSxuLHQpe3RoaXMubnVtVHJhbnNmb3Jtcz0wLHRoaXMudHJpcGxldHM9bmV3IEludDMyQXJyYXkoMCksdGhpcy5wcmVmaXhTdWZmaXhTdG9yYWdlPW5ldyBJbnQ4QXJyYXkoMCksdGhpcy5wcmVmaXhTdWZmaXhIZWFkcz1uZXcgSW50MzJBcnJheSgwKSx0aGlzLnBhcmFtcz1uZXcgSW50MTZBcnJheSgwKSx0aGlzLm51bVRyYW5zZm9ybXM9ZSx0aGlzLnRyaXBsZXRzPW5ldyBJbnQzMkFycmF5KGUqMyksdGhpcy5wYXJhbXM9bmV3IEludDE2QXJyYXkoZSksdGhpcy5wcmVmaXhTdWZmaXhTdG9yYWdlPW5ldyBJbnQ4QXJyYXkobiksdGhpcy5wcmVmaXhTdWZmaXhIZWFkcz1uZXcgSW50MzJBcnJheSh0KzEpfXZhciAkMD1uZXcgSDAoMTIxLDE2Nyw1MCk7ZnVuY3Rpb24gVzAoZSxuLHQsaSxhKXtmb3IodmFyIHU9aS5sZW5ndGgscj0xLG89MCxsPTA7bDx1OysrbCl7dmFyIHM9aS5jaGFyQ29kZUF0KGwpO3M9PTM1P25bcisrXT1vOmVbbysrXT1zfWZvcih2YXIgbD0wO2w8MzYzOysrbCl0W2xdPWEuY2hhckNvZGVBdChsKS0zMn1XMCgkMC5wcmVmaXhTdWZmaXhTdG9yYWdlLCQwLnByZWZpeFN1ZmZpeEhlYWRzLCQwLnRyaXBsZXRzLGAjICNzICMsICNlICMuIyB0aGUgIy5jb20vI1x4QzJceEEwIyBvZiAjIGFuZCAjIGluICMgdG8gIyIjIj4jCiNdIyBmb3IgIyBhICMgdGhhdCAjLiAjIHdpdGggIycjIGZyb20gIyBieSAjLiBUaGUgIyBvbiAjIGFzICMgaXMgI2luZyAjCgkjOiNlZCAjKCMgYXQgI2x5ICM9IiMgb2YgdGhlICMuIFRoaXMgIywjIG5vdCAjZXIgI2FsICM9JyNmdWwgI2l2ZSAjbGVzcyAjZXN0ICNpemUgI291cyAjYCxgICAgICAhISAhICwgICohICAmISAgIiAhICApICogICAqIC0gICEgIyAhICAjISohICArICAsJCAhICAtICAlICAuICAvICMgICAwICAxIC4gICIgICAyICAzISogICA0JSAgISAjIC8gICA1ICA2ICA3ICA4IDAgIDEgJiAgICQgICA5ICsgICA6ICA7ICA8ICcgICE9ICA+ICA/ISA0ICBAIDQgIDIgICYgICBBICojICggICBCICBDJiApICUgICkgISojICotJSBBICshICouICBEISAlJyAgJiBFICo2ICBGICBHJSAhICpBIColICBIISBEICBJISshICBKISsgICBLICstICo0ISBBICBMISo0ICBNICBOICs2ICBPISolICsuISBLICpHICBQICslKCAgISBHICpEICtEICBRICsjICpLISpHIStEISsjICtHICtBICs0ISslICtLISs0ISpEIStLISpLYCk7ZnVuY3Rpb24gRzAoZSxuLHQsaSxhLHUscil7dmFyIG89bixsPXUudHJpcGxldHMscz11LnByZWZpeFN1ZmZpeFN0b3JhZ2UsYz11LnByZWZpeFN1ZmZpeEhlYWRzLGQ9MypyLG09bFtkXSx3PWxbZCsxXSwkPWxbZCsyXSxfPWNbbV0sVT1jW20rMV0sTz1jWyRdLHE9Y1skKzFdLEk9dy0xMSx6PXctMDtmb3IoKEk8MXx8ST45KSYmKEk9MCksKHo8MXx8ej45KSYmKHo9MCk7XyE9VTspZVtvKytdPXNbXysrXTtJPmEmJihJPWEpLGkrPUksYS09SSxhLT16O2Zvcih2YXIgbzA9YTtvMD4wOyllW28rK109dFtpKytdLG8wLS07aWYodz09MTB8fHc9PTExKXt2YXIgSD1vLWE7Zm9yKHc9PTEwJiYoYT0xKTthPjA7KXt2YXIgQT1lW0hdJjI1NTtBPDE5Mj8oQT49OTcmJkE8PTEyMiYmKGVbSF1ePTMyKSxIKz0xLGEtPTEpOkE8MjI0PyhlW0grMV1ePTMyLEgrPTIsYS09Mik6KGVbSCsyXV49NSxIKz0zLGEtPTMpfX1lbHNlIGlmKHc9PTIxfHx3PT0yMilmb3IodmFyIHk9by1hLGQwPXUucGFyYW1zW3JdLEU9KGQwJjMyNzY3KSsoMTY3NzcyMTYtKGQwJjMyNzY4KSk7YT4wOyl7dmFyIFc9MSxBPWVbeV0mMjU1O2lmKEE8MTI4KUUrPUEsZVt5XT1FJjEyNztlbHNlIGlmKCEoQTwxOTIpKXtpZihBPDIyNClpZihhPj0yKXt2YXIgRz1lW3krMV07RSs9RyY2M3woQSYzMSk8PDYsZVt5XT0xOTJ8RT4+NiYzMSxlW3krMV09RyYxOTJ8RSY2MyxXPTJ9ZWxzZSBXPWE7ZWxzZSBpZihBPDI0MClpZihhPj0zKXt2YXIgRz1lW3krMV0sWj1lW3krMl07RSs9WiY2M3woRyY2Myk8PDZ8KEEmMTUpPDwxMixlW3ldPTIyNHxFPj4xMiYxNSxlW3krMV09RyYxOTJ8RT4+NiY2MyxlW3krMl09WiYxOTJ8RSY2MyxXPTN9ZWxzZSBXPWE7ZWxzZSBpZihBPDI0OClpZihhPj00KXt2YXIgRz1lW3krMV0sWj1lW3krMl0saDA9ZVt5KzNdO0UrPWgwJjYzfChaJjYzKTw8NnwoRyY2Myk8PDEyfChBJjcpPDwxOCxlW3ldPTI0MHxFPj4xOCY3LGVbeSsxXT1HJjE5MnxFPj4xMiY2MyxlW3krMl09WiYxOTJ8RT4+NiY2MyxlW3krM109aDAmMTkyfEUmNjMsVz00fWVsc2UgVz1hfXkrPVcsYS09Vyx3PT0yMSYmKGE9MCl9Zm9yKDtPIT1xOyllW28rK109c1tPKytdO3JldHVybiBvLW59ZnVuY3Rpb24gRTAoZSxuKXtmb3IodmFyIHQ9MTw8bi0xOyhlJnQpIT0wOyl0Pj49MTtyZXR1cm4oZSZ0LTEpK3R9ZnVuY3Rpb24gVDAoZSxuLHQsaSxhKXtkbyBpLT10LGVbbitpXT1hO3doaWxlKGk+MCl9ZnVuY3Rpb24gSjAoZSxuLHQpe2Zvcih2YXIgaT0xPDxuLXQ7bjwxNSYmKGktPWVbbl0sIShpPD0wKSk7KW4rKyxpPDw9MTtyZXR1cm4gbi10fWZ1bmN0aW9uIFEwKGUsbix0LGksYSl7dmFyIHU9ZVtuXSxyLG89bmV3IEludDMyQXJyYXkoYSksbD1uZXcgSW50MzJBcnJheSgxNikscz1uZXcgSW50MzJBcnJheSgxNiksYztmb3IoYz0wO2M8YTtjKyspbFtpW2NdXSsrO3NbMV09MDtmb3IodmFyIGQ9MTtkPDE1O2QrKylzW2QrMV09c1tkXStsW2RdO2ZvcihjPTA7YzxhO2MrKylpW2NdIT0wJiYob1tzW2lbY11dKytdPWMpO3ZhciBtPXQsdz0xPDxtLCQ9dztpZihzWzE1XT09MSl7Zm9yKHI9MDtyPCQ7cisrKWVbdStyXT1vWzBdO3JldHVybiAkfXI9MCxjPTA7Zm9yKHZhciBkPTEsXz0yO2Q8PXQ7ZCsrLF88PD0xKWZvcig7bFtkXT4wO2xbZF0tLSlUMChlLHUrcixfLHcsZDw8MTZ8b1tjKytdKSxyPUUwKHIsZCk7Zm9yKHZhciBVPSQtMSxPPS0xLHE9dSxkPXQrMSxfPTI7ZDw9MTU7ZCsrLF88PD0xKWZvcig7bFtkXT4wO2xbZF0tLSkociZVKSE9TyYmKHErPXcsbT1KMChsLGQsdCksdz0xPDxtLCQrPXcsTz1yJlUsZVt1K09dPW0rdDw8MTZ8cS11LU8pLFQwKGUscSsocj4+dCksXyx3LGQtdDw8MTZ8b1tjKytdKSxyPUUwKHIsZCk7cmV0dXJuICR9ZnVuY3Rpb24gTChlKXtpZihlLmVuZE9mU3RyZWFtUmVhY2hlZCE9MCl7aWYoeDAoZSk+PS0yKXJldHVybjt0aHJvdyJObyBtb3JlIGlucHV0In12YXIgbj1lLmhhbGZPZmZzZXQ8PDEsdD00MDk2LW47Zm9yKGUuYnl0ZUJ1ZmZlci5jb3B5V2l0aGluKDAsbiw0MDk2KSxlLmhhbGZPZmZzZXQ9MDt0PDQwOTY7KXt2YXIgaT00MDk2LXQsYT1qMChlLmlucHV0LGUuYnl0ZUJ1ZmZlcix0LGkpO2lmKGE8PTApe2UuZW5kT2ZTdHJlYW1SZWFjaGVkPTEsZS50YWlsQnl0ZXM9dCx0Kz0xO2JyZWFrfXQrPWF9WjAoZSx0KX1mdW5jdGlvbiBDMChlLG4pe2lmKGUuZW5kT2ZTdHJlYW1SZWFjaGVkIT0wKXt2YXIgdD0oZS5oYWxmT2Zmc2V0PDwxKSsoZS5iaXRPZmZzZXQrNz4+MyktNDtpZih0PmUudGFpbEJ5dGVzKXRocm93IlJlYWQgYWZ0ZXIgZW5kIjtpZihuIT0wJiZ0IT1lLnRhaWxCeXRlcyl0aHJvdyJVbnVzZWQgYnl0ZXMgYWZ0ZXIgZW5kIn19ZnVuY3Rpb24gaChlLG4pe3ZhciB0PWUuYWNjdW11bGF0b3IzMj4+PmUuYml0T2Zmc2V0JigxPDxuKS0xO3JldHVybiBlLmJpdE9mZnNldCs9bix0fWZ1bmN0aW9uIGIwKGUsbil7dmFyIHQ9aChlLDE2KTtyZXR1cm4gZS5hY2N1bXVsYXRvcjMyPWUuc2hvcnRCdWZmZXJbZS5oYWxmT2Zmc2V0KytdPDwxNnxlLmFjY3VtdWxhdG9yMzI+Pj4xNixlLmJpdE9mZnNldC09MTYsdHxoKGUsbi0xNik8PDE2fWZ1bmN0aW9uIEswKGUpe2UuYnl0ZUJ1ZmZlcj1uZXcgSW50OEFycmF5KDQxNjApLGUuYWNjdW11bGF0b3IzMj0wLGUuc2hvcnRCdWZmZXI9bmV3IEludDE2QXJyYXkoMjA4MCksZS5iaXRPZmZzZXQ9MzIsZS5oYWxmT2Zmc2V0PTIwNDgsZS5lbmRPZlN0cmVhbVJlYWNoZWQ9MCxJMChlKX1mdW5jdGlvbiBJMChlKXtlLmhhbGZPZmZzZXQ+MjAzMCYmTChlKSxDMChlLDApLGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2LGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2fWZ1bmN0aW9uIFMwKGUpe2UuYml0T2Zmc2V0PT0zMiYmSTAoZSl9ZnVuY3Rpb24gRDAoZSl7dmFyIG49MzItZS5iaXRPZmZzZXQmNztpZihuIT0wKXt2YXIgdD1oKGUsbik7aWYodCE9MCl0aHJvdyJDb3JydXB0ZWQgcGFkZGluZyBiaXRzIn19ZnVuY3Rpb24geDAoZSl7dmFyIG49MjA0ODtyZXR1cm4gZS5lbmRPZlN0cmVhbVJlYWNoZWQhPTAmJihuPWUudGFpbEJ5dGVzKzE+PjEpLG4tZS5oYWxmT2Zmc2V0fWZ1bmN0aW9uIFYwKGUsbix0LGkpe2lmKChlLmJpdE9mZnNldCY3KSE9MCl0aHJvdyJVbmFsaWduZWQgY29weUJ5dGVzIjtmb3IoO2UuYml0T2Zmc2V0IT0zMiYmaSE9MDspblt0KytdPWUuYWNjdW11bGF0b3IzMj4+PmUuYml0T2Zmc2V0LGUuYml0T2Zmc2V0Kz04LGktLTtpZihpIT0wKXt2YXIgYT1WKHgwKGUpLGk+PjEpO2lmKGE+MCl7dmFyIHU9ZS5oYWxmT2Zmc2V0PDwxLHI9YTw8MTtuLnNldChlLmJ5dGVCdWZmZXIuc3ViYXJyYXkodSx1K3IpLHQpLHQrPXIsaS09cixlLmhhbGZPZmZzZXQrPWF9aWYoaSE9MCl7aWYoeDAoZSk+MCl7Zm9yKGUuYml0T2Zmc2V0Pj0xNiYmKGUuYWNjdW11bGF0b3IzMj1lLnNob3J0QnVmZmVyW2UuaGFsZk9mZnNldCsrXTw8MTZ8ZS5hY2N1bXVsYXRvcjMyPj4+MTYsZS5iaXRPZmZzZXQtPTE2KTtpIT0wOyluW3QrK109ZS5hY2N1bXVsYXRvcjMyPj4+ZS5iaXRPZmZzZXQsZS5iaXRPZmZzZXQrPTgsaS0tO0MwKGUsMCk7cmV0dXJufWZvcig7aT4wOyl7dmFyIG89ajAoZS5pbnB1dCxuLHQsaSk7aWYobz09LTEpdGhyb3ciVW5leHBlY3RlZCBlbmQgb2YgaW5wdXQiO3QrPW8saS09b319fX1mdW5jdGlvbiBaMChlLG4pe2Zvcih2YXIgdD1lLmJ5dGVCdWZmZXIsaT1uPj4xLGE9ZS5zaG9ydEJ1ZmZlcix1PTA7dTxpOysrdSlhW3VdPXRbdSoyXSYyNTV8KHRbdSoyKzFdJjI1NSk8PDh9dmFyIEIwPW5ldyBJbnQzMkFycmF5KDIwNDgpO2Z1bmN0aW9uIGVlKGUsbix0KXtmb3IodmFyIGk9MDtpPDI1NjsrK2kpZVtpXT1pJjYzLGVbNTEyK2ldPWk+PjIsZVsxNzkyK2ldPTIrKGk+PjYpO2Zvcih2YXIgaT0wO2k8MTI4OysraSllWzEwMjQraV09NCoobi5jaGFyQ29kZUF0KGkpLTMyKTtmb3IodmFyIGk9MDtpPDY0OysraSllWzExNTIraV09aSYxLGVbMTIxNitpXT0yKyhpJjEpO2Zvcih2YXIgYT0xMjgwLHU9MDt1PDE5OysrdSlmb3IodmFyIHI9dSYzLG89dC5jaGFyQ29kZUF0KHUpLTMyLGk9MDtpPG87KytpKWVbYSsrXT1yO2Zvcih2YXIgaT0wO2k8MTY7KytpKWVbMTc5MitpXT0xLGVbMjAzMitpXT02O2VbMTc5Ml09MCxlWzIwNDddPTc7Zm9yKHZhciBpPTA7aTwyNTY7KytpKWVbMTUzNitpXT1lWzE3OTIraV08PDN9ZWUoQjAsYCAgICAgICAgICEhICAhICAgICAgICAgICAgICAgICAgIiMkIyMlIyQmJyMjKCMpIysrKysrKysrKysoKCYqJyMjLC0tLSwtLS0sLS0tLS0sLS0tLS0sLS0tLS0mIycjIyMuLy8vLi8vLy4vLy8vLy4vLy8vLy4vLy8vLyYjJyMgYCwiQS8qICAnOiAgJiA6ICQgIFx4ODEgQCIpO2Z1bmN0aW9uIHRlKCl7dGhpcy5yaW5nQnVmZmVyPW5ldyBJbnQ4QXJyYXkoMCksdGhpcy5jb250ZXh0TW9kZXM9bmV3IEludDhBcnJheSgwKSx0aGlzLmNvbnRleHRNYXA9bmV3IEludDhBcnJheSgwKSx0aGlzLmRpc3RDb250ZXh0TWFwPW5ldyBJbnQ4QXJyYXkoMCksdGhpcy5kaXN0RXh0cmFCaXRzPW5ldyBJbnQ4QXJyYXkoMCksdGhpcy5vdXRwdXQ9bmV3IEludDhBcnJheSgwKSx0aGlzLmJ5dGVCdWZmZXI9bmV3IEludDhBcnJheSgwKSx0aGlzLnNob3J0QnVmZmVyPW5ldyBJbnQxNkFycmF5KDApLHRoaXMuaW50QnVmZmVyPW5ldyBJbnQzMkFycmF5KDApLHRoaXMucmluZ3M9bmV3IEludDMyQXJyYXkoMCksdGhpcy5ibG9ja1RyZWVzPW5ldyBJbnQzMkFycmF5KDApLHRoaXMubGl0ZXJhbFRyZWVHcm91cD1uZXcgSW50MzJBcnJheSgwKSx0aGlzLmNvbW1hbmRUcmVlR3JvdXA9bmV3IEludDMyQXJyYXkoMCksdGhpcy5kaXN0YW5jZVRyZWVHcm91cD1uZXcgSW50MzJBcnJheSgwKSx0aGlzLmRpc3RPZmZzZXQ9bmV3IEludDMyQXJyYXkoMCksdGhpcy5ydW5uaW5nU3RhdGU9MCx0aGlzLm5leHRSdW5uaW5nU3RhdGU9MCx0aGlzLmFjY3VtdWxhdG9yMzI9MCx0aGlzLmJpdE9mZnNldD0wLHRoaXMuaGFsZk9mZnNldD0wLHRoaXMudGFpbEJ5dGVzPTAsdGhpcy5lbmRPZlN0cmVhbVJlYWNoZWQ9MCx0aGlzLm1ldGFCbG9ja0xlbmd0aD0wLHRoaXMuaW5wdXRFbmQ9MCx0aGlzLmlzVW5jb21wcmVzc2VkPTAsdGhpcy5pc01ldGFkYXRhPTAsdGhpcy5saXRlcmFsQmxvY2tMZW5ndGg9MCx0aGlzLm51bUxpdGVyYWxCbG9ja1R5cGVzPTAsdGhpcy5jb21tYW5kQmxvY2tMZW5ndGg9MCx0aGlzLm51bUNvbW1hbmRCbG9ja1R5cGVzPTAsdGhpcy5kaXN0YW5jZUJsb2NrTGVuZ3RoPTAsdGhpcy5udW1EaXN0YW5jZUJsb2NrVHlwZXM9MCx0aGlzLnBvcz0wLHRoaXMubWF4RGlzdGFuY2U9MCx0aGlzLmRpc3RSYklkeD0wLHRoaXMudHJpdmlhbExpdGVyYWxDb250ZXh0PTAsdGhpcy5saXRlcmFsVHJlZUlkeD0wLHRoaXMuY29tbWFuZFRyZWVJZHg9MCx0aGlzLmo9MCx0aGlzLmluc2VydExlbmd0aD0wLHRoaXMuY29udGV4dE1hcFNsaWNlPTAsdGhpcy5kaXN0Q29udGV4dE1hcFNsaWNlPTAsdGhpcy5jb250ZXh0TG9va3VwT2Zmc2V0MT0wLHRoaXMuY29udGV4dExvb2t1cE9mZnNldDI9MCx0aGlzLmRpc3RhbmNlQ29kZT0wLHRoaXMubnVtRGlyZWN0RGlzdGFuY2VDb2Rlcz0wLHRoaXMuZGlzdGFuY2VQb3N0Zml4TWFzaz0wLHRoaXMuZGlzdGFuY2VQb3N0Zml4Qml0cz0wLHRoaXMuZGlzdGFuY2U9MCx0aGlzLmNvcHlMZW5ndGg9MCx0aGlzLm1heEJhY2t3YXJkRGlzdGFuY2U9MCx0aGlzLm1heFJpbmdCdWZmZXJTaXplPTAsdGhpcy5yaW5nQnVmZmVyU2l6ZT0wLHRoaXMuZXhwZWN0ZWRUb3RhbFNpemU9MCx0aGlzLm91dHB1dE9mZnNldD0wLHRoaXMub3V0cHV0TGVuZ3RoPTAsdGhpcy5vdXRwdXRVc2VkPTAsdGhpcy5yaW5nQnVmZmVyQnl0ZXNXcml0dGVuPTAsdGhpcy5yaW5nQnVmZmVyQnl0ZXNSZWFkeT0wLHRoaXMuaXNFYWdlcj0wLHRoaXMuaXNMYXJnZVdpbmRvdz0wLHRoaXMuaW5wdXQ9bnVsbCx0aGlzLnJpbmdCdWZmZXI9bmV3IEludDhBcnJheSgwKSx0aGlzLnJpbmdzPW5ldyBJbnQzMkFycmF5KDEwKSx0aGlzLnJpbmdzWzBdPTE2LHRoaXMucmluZ3NbMV09MTUsdGhpcy5yaW5nc1syXT0xMSx0aGlzLnJpbmdzWzNdPTR9ZnVuY3Rpb24gaWUoZSxuLHQsaSl7dmFyIGE9YWUobit0KTtpZihhLmxlbmd0aCE9ZS5sZW5ndGgpdGhyb3ciQ29ycnVwdGVkIGJyb3RsaSBkaWN0aW9uYXJ5Ijtmb3IodmFyIHU9MCxyPWkubGVuZ3RoLG89MDtvPHI7bys9Mil7dmFyIGw9aS5jaGFyQ29kZUF0KG8pLTM2LHM9aS5jaGFyQ29kZUF0KG8rMSktMzY7dSs9bDtmb3IodmFyIGM9MDtjPHM7KytjKWFbdV18PTEyOCx1Kyt9ZS5zZXQoYSl9e3ZhciBPMD1uZXcgSW50OEFycmF5KDEyMjc4NCk7aWUoTzAsYHRpbWVkb3dubGlmZWxlZnRiYWNrY29kZWRhdGFzaG93b25seXNpdGVjaXR5b3Blbmp1c3RsaWtlZnJlZXdvcmt0ZXh0eWVhcm92ZXJib2R5bG92ZWZvcm1ib29rcGxheWxpdmVsaW5laGVscGhvbWVzaWRlbW9yZXdvcmRsb25ndGhlbXZpZXdmaW5kcGFnZWRheXNmdWxsaGVhZHRlcm1lYWNoYXJlYWZyb210cnVlbWFya2FibGV1cG9uaGlnaGRhdGVsYW5kbmV3c2V2ZW5uZXh0Y2FzZWJvdGhwb3N0dXNlZG1hZGVoYW5kaGVyZXdoYXRuYW1lTGlua2Jsb2dzaXplYmFzZWhlbGRtYWtlbWFpbnVzZXInKSAraG9sZGVuZHN3aXRoTmV3c3JlYWR3ZXJlc2lnbnRha2VoYXZlZ2FtZXNlZW5jYWxscGF0aHdlbGxwbHVzbWVudWZpbG1wYXJ0am9pbnRoaXNsaXN0Z29vZG5lZWR3YXlzd2VzdGpvYnNtaW5kYWxzb2xvZ29yaWNodXNlc2xhc3R0ZWFtYXJteWZvb2RraW5nd2lsbGVhc3R3YXJkYmVzdGZpcmVQYWdla25vd2F3YXkucG5nbW92ZXRoYW5sb2FkZ2l2ZXNlbGZub3RlbXVjaGZlZWRtYW55cm9ja2ljb25vbmNlbG9va2hpZGVkaWVkSG9tZXJ1bGVob3N0YWpheGluZm9jbHVibGF3c2xlc3NoYWxmc29tZXN1Y2h6b25lMTAwJW9uZXNjYXJlVGltZXJhY2VibHVlZm91cndlZWtmYWNlaG9wZWdhdmVoYXJkbG9zdHdoZW5wYXJra2VwdHBhc3NzaGlwcm9vbUhUTUxwbGFuVHlwZWRvbmVzYXZla2VlcGZsYWdsaW5rc29sZGZpdmV0b29rcmF0ZXRvd25qdW1wdGh1c2RhcmtjYXJkZmlsZWZlYXJzdGF5a2lsbHRoYXRmYWxsYXV0b2V2ZXIuY29tdGFsa3Nob3B2b3RlZGVlcG1vZGVyZXN0dHVybmJvcm5iYW5kZmVsbHJvc2V1cmwoc2tpbnJvbGVjb21lYWN0c2FnZXNtZWV0Z29sZC5qcGdpdGVtdmFyeWZlbHR0aGVuc2VuZGRyb3BWaWV3Y29weTEuMCI8L2E+c3RvcGVsc2VsaWVzdG91cnBhY2suZ2lmcGFzdGNzcz9ncmF5bWVhbiZndDtyaWRlc2hvdGxhdGVzYWlkcm9hZHZhciBmZWVsam9obnJpY2twb3J0ZmFzdCdVQS1kZWFkPC9iPnBvb3JiaWxsdHlwZVUuUy53b29kbXVzdDJweDtJbmZvcmFua3dpZGV3YW50d2FsbGxlYWRbMF07cGF1bHdhdmVzdXJlJCgnI3dhaXRtYXNzYXJtc2dvZXNnYWlubGFuZ3BhaWQhLS0gbG9ja3VuaXRyb290d2Fsa2Zpcm13aWZleG1sInNvbmd0ZXN0MjBweGtpbmRyb3dzdG9vbGZvbnRtYWlsc2FmZXN0YXJtYXBzY29yZXJhaW5mbG93YmFieXNwYW5zYXlzNHB4OzZweDthcnRzZm9vdHJlYWx3aWtpaGVhdHN0ZXB0cmlwb3JnL2xha2V3ZWFrdG9sZEZvcm1jYXN0ZmFuc2Jhbmt2ZXJ5cnVuc2p1bHl0YXNrMXB4O2dvYWxncmV3c2xvd2VkZ2VpZD0ic2V0czVweDsuanM/NDBweGlmIChzb29uc2VhdG5vbmV0dWJlemVyb3NlbnRyZWVkZmFjdGludG9naWZ0aGFybTE4cHhjYW1laGlsbGJvbGR6b29tdm9pZGVhc3lyaW5nZmlsbHBlYWtpbml0Y29zdDNweDtqYWNrdGFnc2JpdHNyb2xsZWRpdGtuZXduZWFyPCEtLWdyb3dKU09OZHV0eU5hbWVzYWxleW91IGxvdHNwYWluamF6emNvbGRleWVzZmlzaHd3dy5yaXNrdGFic3ByZXYxMHB4cmlzZTI1cHhCbHVlZGluZzMwMCxiYWxsZm9yZGVhcm53aWxkYm94LmZhaXJsYWNrdmVyc3BhaXJqdW5ldGVjaGlmKCFwaWNrZXZpbCQoIiN3YXJtbG9yZGRvZXNwdWxsLDAwMGlkZWFkcmF3aHVnZXNwb3RmdW5kYnVybmhyZWZjZWxsa2V5c3RpY2tob3VybG9zc2Z1ZWwxMnB4c3VpdGRlYWxSU1MiYWdlZGdyZXlHRVQiZWFzZWFpbXNnaXJsYWlkczhweDtuYXZ5Z3JpZHRpcHMjOTk5d2Fyc2xhZHljYXJzKTsgfXBocD9oZWxsdGFsbHdob216aDplKi9ccgogMTAwaGFsbC4KCkE3cHg7cHVzaGNoYXQwcHg7Y3JldyovPC9oYXNoNzVweGZsYXRyYXJlICYmIHRlbGxjYW1wb250b2xhaWRtaXNzc2tpcHRlbnRmaW5lbWFsZWdldHNwbG90NDAwLFxyClxyCmNvb2xmZWV0LnBocDxicj5lcmljbW9zdGd1aWRiZWxsZGVzY2hhaXJtYXRoYXRvbS9pbWcmIzgybHVja2NlbnQwMDA7dGlueWdvbmVodG1sc2VsbGRydWdGUkVFbm9kZW5pY2s/aWQ9bG9zZW51bGx2YXN0d2luZFJTUyB3ZWFycmVseWJlZW5zYW1lZHVrZW5hc2FjYXBld2lzaGd1bGZUMjM6aGl0c3Nsb3RnYXRla2lja2JsdXJ0aGV5MTVweCcnKTspOyI+bXNpZXdpbnNiaXJkc29ydGJldGFzZWVrVDE4Om9yZHN0cmVlbWFsbDYwcHhmYXJtYlwwGXNib3lzWzBdLicpOyJQT1NUYmVhcmtpZHMpO319bWFyeXRlbmQoVUspcXVhZHpoOmYtc2l6LS0tLXByb3AnKTtccmxpZnRUMTk6dmljZWFuZHlkZWJ0PlJTU3Bvb2xuZWNrYmxvd1QxNjpkb29yZXZhbFQxNzpsZXRzZmFpbG9yYWxwb2xsbm92YWNvbHNnZW5lIGJcMBRzb2Z0cm9tZXRpbGxyb3NzPGgzPnBvdXJmYWRlcGluazx0cj5taW5pKXwhKG1pbmV6aDpoYmFyc2hlYXIwMCk7bWlsayAtLT5pcm9uZnJlZGRpc2t3ZW50c29pbHB1dHMvanMvaG9seVQyMjpJU0JOVDIwOmFkYW1zZWVzPGgyPmpzb24nLCAnY29udFQyMTogUlNTbG9vcGFzaWFtb29uPC9wPnNvdWxMSU5FZm9ydGNhcnRUMTQ6PGgxPjgwcHghLS08OXB4O1QwNDptaWtlOjQ2Wm5pY2VpbmNoWW9ya3JpY2V6aDpkJykpO3B1cmVtYWdlcGFyYXRvbmVib25kOjM3Wl9vZl8nXSk7MDAwLHpoOmd0YW5reWFyZGJvd2xidXNoOjU2WkphdmEzMHB4Cnx9CiVDMyU6MzRaamVmZkVYUEljYXNodmlzYWdvbGZzbm93emg6aXF1ZXIuY3Nzc2lja21lYXRtaW4uYmluZGRlbGxoaXJlcGljc3JlbnQ6MzZaSFRUUC0yMDFmb3Rvd29sZkVORCB4Ym94OjU0WkJPRFlkaWNrOwp9CmV4aXQ6MzVadmFyc2JlYXQnfSk7ZGlldDk5OTthbm5lfX08L1tpXS5MYW5na21CMndpcmV0b3lzYWRkc3NlYWxhbGV4OwoJfWVjaG9uaW5lLm9yZzAwNSl0b255amV3c3NhbmRsZWdzcm9vZjAwMCkgMjAwd2luZWdlYXJkb2dzYm9vdGdhcnljdXRzdHlsZXRlbXB0aW9uLnhtbGNvY2tnYW5nJCgnLjUwcHhQaC5EbWlzY2FsYW5sb2FuZGVza21pbGVyeWFudW5peGRpc2MpO30KZHVzdGNsaXApLgoKNzBweC0yMDBEVkRzN10+PHRhcGVkZW1vaSsrKXdhZ2VldXJvcGhpbG9wdHNob2xlRkFRc2FzaW4tMjZUbGFic3BldHNVUkwgYnVsa2Nvb2s7fVxyCkhFQURbMF0pYWJicmp1YW4oMTk4bGVzaHR3aW48L2k+c29ueWd1eXNmdWNrcGlwZXwtCiEwMDIpbmRvd1sxXTtbXTsKTG9nIHNhbHRccgoJCWJhbmd0cmltYmF0aCl7XHIKMDBweAp9KTtrbzpsZmVlc2FkPlxyczovLyBbXTt0b2xscGx1Zygpewp7XHIKIC5qcycyMDBwZHVhbGJvYXQuSlBHKTsKfXF1b3QpOwoKJyk7ClxyCn1ccjIwMTQyMDE1MjAxNjIwMTcyMDE4MjAxOTIwMjAyMDIxMjAyMjIwMjMyMDI0MjAyNTIwMjYyMDI3MjAyODIwMjkyMDMwMjAzMTIwMzIyMDMzMjAzNDIwMzUyMDM2MjAzNzIwMTMyMDEyMjAxMTIwMTAyMDA5MjAwODIwMDcyMDA2MjAwNTIwMDQyMDAzMjAwMjIwMDEyMDAwMTk5OTE5OTgxOTk3MTk5NjE5OTUxOTk0MTk5MzE5OTIxOTkxMTk5MDE5ODkxOTg4MTk4NzE5ODYxOTg1MTk4NDE5ODMxOTgyMTk4MTE5ODAxOTc5MTk3ODE5NzcxOTc2MTk3NTE5NzQxOTczMTk3MjE5NzExOTcwMTk2OTE5NjgxOTY3MTk2NjE5NjUxOTY0MTk2MzE5NjIxOTYxMTk2MDE5NTkxOTU4MTk1NzE5NTYxOTU1MTk1NDE5NTMxOTUyMTk1MTE5NTAxMDAwMTAyNDEzOTQwMDAwOTk5OWNvbW9tQyFzZXN0ZWVzdGFwZXJvdG9kb2hhY2VjYWRhYUMxb2JpZW5kQy1hYXNDLXZpZGFjYXNvb3Ryb2Zvcm9zb2xvb3RyYWN1YWxkaWpvc2lkb2dyYW50aXBvdGVtYWRlYmVhbGdvcXVDKWVzdG9uYWRhdHJlc3BvY29jYXNhYmFqb3RvZGFzaW5vYWd1YXB1ZXN1bm9zYW50ZWRpY2VsdWlzZWxsYW1heW96b25hYW1vcnBpc29vYnJhY2xpY2VsbG9kaW9zaG9yYWNhc2lQN1AwUD1QMFA+UDxRXDBQMFFcMFEDUQJQMFA9UDVQP1A+UD5RAlA4UDdQPVA+UDRQPlECUD5QNlA1UD5QPVA4UQVQHVAwUDVQNVAxUVx2UDxRXHZQElFcdlEBUD5QMlFcdlAyUD5QHVA+UD5QMVAfUD5QO1A4UD1QOFAgUCRQHVA1UBxRXHZRAlFcdlAeUD1QOFA8UDRQMFAXUDBQFFAwUB1RA1AeUDFRAlA1UBhQN1A1UDlQPVEDUDxQPFAiUVx2UQNQNlkBWQpYI1kGWQVYJ1kFWDlZA1kEWCNZXGJYMVgvWQpYJ1kBWQlZXHgwN1lcYlkEWQVZBFkDWCdZXGJZBFlceDA3WChYM1gnWQRYJVkGWVx4MDdZClgjWQpZAlgvWVx4MDdZBFgrWQVYKFlceDA3WQRZXGJZBFkKWChZBFgnWQpYKFkDWDRZClgnWQVYI1kFWQZYKlgoWQpZBFkGWC1YKFlceDA3WQVZBVg0WVxiWDRmaXJzdHZpZGVvbGlnaHR3b3JsZG1lZGlhd2hpdGVjbG9zZWJsYWNrcmlnaHRzbWFsbGJvb2tzcGxhY2VtdXNpY2ZpZWxkb3JkZXJwb2ludHZhbHVlbGV2ZWx0YWJsZWJvYXJkaG91c2Vncm91cHdvcmtzeWVhcnNzdGF0ZXRvZGF5d2F0ZXJzdGFydHN0eWxlZGVhdGhwb3dlcnBob25lbmlnaHRlcnJvcmlucHV0YWJvdXR0ZXJtc3RpdGxldG9vbHNldmVudGxvY2FsdGltZXNsYXJnZXdvcmRzZ2FtZXNzaG9ydHNwYWNlZm9jdXNjbGVhcm1vZGVsYmxvY2tndWlkZXJhZGlvc2hhcmV3b21lbmFnYWlubW9uZXlpbWFnZW5hbWVzeW91bmdsaW5lc2xhdGVyY29sb3JncmVlbmZyb250JmFtcDt3YXRjaGZvcmNlcHJpY2VydWxlc2JlZ2luYWZ0ZXJ2aXNpdGlzc3VlYXJlYXNiZWxvd2luZGV4dG90YWxob3Vyc2xhYmVscHJpbnRwcmVzc2J1aWx0bGlua3NzcGVlZHN0dWR5dHJhZGVmb3VuZHNlbnNldW5kZXJzaG93bmZvcm1zcmFuZ2VhZGRlZHN0aWxsbW92ZWR0YWtlbmFib3ZlZmxhc2hmaXhlZG9mdGVub3RoZXJ2aWV3c2NoZWNrbGVnYWxyaXZlcml0ZW1zcXVpY2tzaGFwZWh1bWFuZXhpc3Rnb2luZ21vdmlldGhpcmRiYXNpY3BlYWNlc3RhZ2V3aWR0aGxvZ2luaWRlYXN3cm90ZXBhZ2VzdXNlcnNkcml2ZXN0b3JlYnJlYWtzb3V0aHZvaWNlc2l0ZXNtb250aHdoZXJlYnVpbGR3aGljaGVhcnRoZm9ydW10aHJlZXNwb3J0cGFydHlDbGlja2xvd2VybGl2ZXNjbGFzc2xheWVyZW50cnlzdG9yeXVzYWdlc291bmRjb3VydHlvdXIgYmlydGhwb3B1cHR5cGVzYXBwbHlJbWFnZWJlaW5ndXBwZXJub3Rlc2V2ZXJ5c2hvd3NtZWFuc2V4dHJhbWF0Y2h0cmFja2tub3duZWFybHliZWdhbnN1cGVycGFwZXJub3J0aGxlYXJuZ2l2ZW5uYW1lZGVuZGVkVGVybXNwYXJ0c0dyb3VwYnJhbmR1c2luZ3dvbWFuZmFsc2VyZWFkeWF1ZGlvdGFrZXN3aGlsZS5jb20vbGl2ZWRjYXNlc2RhaWx5Y2hpbGRncmVhdGp1ZGdldGhvc2V1bml0c25ldmVyYnJvYWRjb2FzdGNvdmVyYXBwbGVmaWxlc2N5Y2xlc2NlbmVwbGFuc2NsaWNrd3JpdGVxdWVlbnBpZWNlZW1haWxmcmFtZW9sZGVycGhvdG9saW1pdGNhY2hlY2l2aWxzY2FsZWVudGVydGhlbWV0aGVyZXRvdWNoYm91bmRyb3lhbGFza2Vkd2hvbGVzaW5jZXN0b2NrIG5hbWVmYWl0aGhlYXJ0ZW1wdHlvZmZlcnNjb3Blb3duZWRtaWdodGFsYnVtdGhpbmtibG9vZGFycmF5bWFqb3J0cnVzdGNhbm9udW5pb25jb3VudHZhbGlkc3RvbmVTdHlsZUxvZ2luaGFwcHlvY2N1cmxlZnQ6ZnJlc2hxdWl0ZWZpbG1zZ3JhZGVuZWVkc3VyYmFuZmlnaHRiYXNpc2hvdmVyYXV0bztyb3V0ZS5odG1sbWl4ZWRmaW5hbFlvdXIgc2xpZGV0b3BpY2Jyb3duYWxvbmVkcmF3bnNwbGl0cmVhY2hSaWdodGRhdGVzbWFyY2hxdW90ZWdvb2RzTGlua3Nkb3VidGFzeW5jdGh1bWJhbGxvd2NoaWVmeW91dGhub3ZlbDEwcHg7c2VydmV1bnRpbGhhbmRzQ2hlY2tTcGFjZXF1ZXJ5amFtZXNlcXVhbHR3aWNlMCwwMDBTdGFydHBhbmVsc29uZ3Nyb3VuZGVpZ2h0c2hpZnR3b3J0aHBvc3RzbGVhZHN3ZWVrc2F2b2lkdGhlc2VtaWxlc3BsYW5lc21hcnRhbHBoYXBsYW50bWFya3NyYXRlc3BsYXlzY2xhaW1zYWxlc3RleHRzc3RhcnN3cm9uZzwvaDM+dGhpbmcub3JnL211bHRpaGVhcmRQb3dlcnN0YW5kdG9rZW5zb2xpZCh0aGlzYnJpbmdzaGlwc3N0YWZmdHJpZWRjYWxsc2Z1bGx5ZmFjdHNhZ2VudFRoaXMgLy8tLT5hZG1pbmVneXB0RXZlbnQxNXB4O0VtYWlsdHJ1ZSJjcm9zc3NwZW50YmxvZ3Nib3giPm5vdGVkbGVhdmVjaGluYXNpemVzZ3Vlc3Q8L2g0PnJvYm90aGVhdnl0cnVlLHNldmVuZ3JhbmRjcmltZXNpZ25zYXdhcmVkYW5jZXBoYXNlPjwhLS1lbl9VUyYjMzk7MjAwcHhfbmFtZWxhdGluZW5qb3lhamF4LmF0aW9uc21pdGhVLlMuIGhvbGRzcGV0ZXJpbmRpYW5hdiI+Y2hhaW5zY29yZWNvbWVzZG9pbmdwcmlvclNoYXJlMTk5MHNyb21hbmxpc3RzamFwYW5mYWxsc3RyaWFsb3duZXJhZ3JlZTwvaDI+YWJ1c2VhbGVydG9wZXJhIi0vL1djYXJkc2hpbGxzdGVhbXNQaG90b3RydXRoY2xlYW4ucGhwP3NhaW50bWV0YWxsb3Vpc21lYW50cHJvb2ZicmllZnJvdyI+Z2VucmV0cnVja2xvb2tzVmFsdWVGcmFtZS5uZXQvLS0+Cjx0cnkgewp2YXIgbWFrZXNjb3N0c3BsYWluYWR1bHRxdWVzdHRyYWlubGFib3JoZWxwc2NhdXNlbWFnaWNtb3RvcnRoZWlyMjUwcHhsZWFzdHN0ZXBzQ291bnRjb3VsZGdsYXNzc2lkZXNmdW5kc2hvdGVsYXdhcmRtb3V0aG1vdmVzcGFyaXNnaXZlc2R1dGNodGV4YXNmcnVpdG51bGwsfHxbXTt0b3AiPgo8IS0tUE9TVCJvY2Vhbjxici8+Zmxvb3JzcGVha2RlcHRoIHNpemViYW5rc2NhdGNoY2hhcnQyMHB4O2FsaWduZGVhbHN3b3VsZDUwcHg7dXJsPSJwYXJrc21vdXNlTW9zdCAuLi48L2Ftb25nYnJhaW5ib2R5IG5vbmU7YmFzZWRjYXJyeWRyYWZ0cmVmZXJwYWdlX2hvbWUubWV0ZXJkZWxheWRyZWFtcHJvdmVqb2ludDwvdHI+ZHJ1Z3M8IS0tIGFwcmlsaWRlYWxhbGxlbmV4YWN0Zm9ydGhjb2Rlc2xvZ2ljVmlldyBzZWVtc2JsYW5rcG9ydHMgKDIwMHNhdmVkX2xpbmtnb2Fsc2dyYW50Z3JlZWtob21lc3JpbmdzcmF0ZWQzMHB4O3dob3NlcGFyc2UoKTsiIEJsb2NrbGludXhqb25lc3BpeGVsJyk7Ij4pO2lmKC1sZWZ0ZGF2aWRob3JzZUZvY3VzcmFpc2Vib3hlc1RyYWNrZW1lbnQ8L2VtPmJhciI+LnNyYz10b3dlcmFsdD0iY2FibGVoZW5yeTI0cHg7c2V0dXBpdGFseXNoYXJwbWlub3J0YXN0ZXdhbnRzdGhpcy5yZXNldHdoZWVsZ2lybHMvY3NzLzEwMCU7Y2x1YnNzdHVmZmJpYmxldm90ZXMgMTAwMGtvcmVhfSk7XHIKYmFuZHNxdWV1ZT0ge307ODBweDtja2luZ3tccgoJCWFoZWFkY2xvY2tpcmlzaGxpa2UgcmF0aW9zdGF0c0Zvcm0ieWFob28pWzBdO0Fib3V0ZmluZHM8L2gxPmRlYnVndGFza3NVUkwgPWNlbGxzfSkoKTsxMnB4O3ByaW1ldGVsbHN0dXJuczB4NjAwLmpwZyJzcGFpbmJlYWNodGF4ZXNtaWNyb2FuZ2VsLS0+PC9naWZ0c3N0ZXZlLWxpbmtib2R5Ln0pOwoJbW91bnQgKDE5OUZBUTwvcm9nZXJmcmFua0NsYXNzMjhweDtmZWVkczxoMT48c2NvdHR0ZXN0czIycHg7ZHJpbmspIHx8IGxld2lzc2hhbGwjMDM5OyBmb3IgbG92ZWR3YXN0ZTAwcHg7amE6YwJzaW1vbjxmb250cmVwbHltZWV0c3VudGVyY2hlYXB0aWdodEJyYW5kKSAhPSBkcmVzc2NsaXBzcm9vbXNvbmtleW1vYmlsbWFpbi5OYW1lIHBsYXRlZnVubnl0cmVlc2NvbS8iMS5qcGd3bW9kZXBhcmFtU1RBUlRsZWZ0IGlkZGVuLCAyMDEpOwp9CmZvcm0udmlydXNjaGFpcnRyYW5zd29yc3RQYWdlc2l0aW9ucGF0Y2g8IS0tCm8tY2FjZmlybXN0b3VycywwMDAgYXNpYW5pKyspe2Fkb2JlJylbMF1pZD0xMGJvdGg7bWVudSAuMi5taS5wbmcia2V2aW5jb2FjaENoaWxkYnJ1Y2UyLmpwZ1VSTCkrLmpwZ3xzdWl0ZXNsaWNlaGFycnkxMjAiIHN3ZWV0dHI+XHIKbmFtZT1kaWVnb3BhZ2Ugc3dpc3MtLT4KCiNmZmY7Ij5Mb2cuY29tInRyZWF0c2hlZXQpICYmIDE0cHg7c2xlZXBudGVudGZpbGVkamE6YwNpZD0iY05hbWUid29yc2VzaG90cy1ib3gtZGVsdGEKJmx0O2JlYXJzOjQ4WjxkYXRhLXJ1cmFsPC9hPiBzcGVuZGJha2Vyc2hvcHM9ICIiO3BocCI+Y3Rpb24xM3B4O2JyaWFuaGVsbG9zaXplPW89JTJGIGpvaW5tYXliZTxpbWcgaW1nIj4sIGZqc2ltZyIgIilbMF1NVG9wQlR5cGUibmV3bHlEYW5za2N6ZWNodHJhaWxrbm93czwvaDU+ZmFxIj56aC1jbjEwKTsKLTEiKTt0eXBlPWJsdWVzdHJ1bHlkYXZpcy5qcyc7PlxyCjwhc3RlZWwgeW91IGgyPlxyCmZvcm0gamVzdXMxMDAlIG1lbnUuXHIKCVxyCndhbGVzcmlza3N1bWVudGRkaW5nYi1saWt0ZWFjaGdpZiIgdmVnYXNkYW5za2Vlc3Rpc2hxaXBzdW9taXNvYnJlZGVzZGVlbnRyZXRvZG9zcHVlZGVhQzFvc2VzdEMhdGllbmVoYXN0YW90cm9zcGFydGVkb25kZW51ZXZvaGFjZXJmb3JtYW1pc21vbWVqb3JtdW5kb2FxdUMtZEMtYXNzQzNsb2F5dWRhZmVjaGF0b2Rhc3RhbnRvbWVub3NkYXRvc290cmFzc2l0aW9tdWNob2Fob3JhbHVnYXJtYXlvcmVzdG9zaG9yYXN0ZW5lcmFudGVzZm90b3Nlc3Rhc3BhQy1zbnVldmFzYWx1ZGZvcm9zbWVkaW9xdWllbm1lc2VzcG9kZXJjaGlsZXNlckMhdmVjZXNkZWNpcmpvc0MpZXN0YXJ2ZW50YWdydXBvaGVjaG9lbGxvc3RlbmdvYW1pZ29jb3Nhc25pdmVsZ2VudGVtaXNtYWFpcmVzanVsaW90ZW1hc2hhY2lhZmF2b3JqdW5pb2xpYnJlcHVudG9idWVub2F1dG9yYWJyaWxidWVuYXRleHRvbWFyem9zYWJlcmxpc3RhbHVlZ29jQzNtb2VuZXJvanVlZ29wZXJDOmhhYmVyZXN0b3ludW5jYW11amVydmFsb3JmdWVyYWxpYnJvZ3VzdGFpZ3VhbHZvdG9zY2Fzb3NndUMtYXB1ZWRvc29tb3Nhdmlzb3VzdGVkZGViZW5ub2NoZWJ1c2NhZmFsdGFldXJvc3NlcmllZGljaG9jdXJzb2NsYXZlY2FzYXNsZUMzbnBsYXpvbGFyZ29vYnJhc3Zpc3RhYXBveW9qdW50b3RyYXRhdmlzdG9jcmVhcmNhbXBvaGVtb3NjaW5jb2NhcmdvcGlzb3NvcmRlbmhhY2VuQyFyZWFkaXNjb3BlZHJvY2VyY2FwdWVkYXBhcGVsbWVub3JDOnRpbGNsYXJvam9yZ2VjYWxsZXBvbmVydGFyZGVuYWRpZW1hcmNhc2lndWVlbGxhc3NpZ2xvY29jaGVtb3Rvc21hZHJlY2xhc2VyZXN0b25pQzFvcXVlZGFwYXNhcmJhbmNvaGlqb3N2aWFqZXBhYmxvQylzdGV2aWVuZXJlaW5vZGVqYXJmb25kb2NhbmFsbm9ydGVsZXRyYWNhdXNhdG9tYXJtYW5vc2x1bmVzYXV0b3N2aWxsYXZlbmRvcGVzYXJ0aXBvc3RlbmdhbWFyY29sbGV2YXBhZHJldW5pZG92YW1vc3pvbmFzYW1ib3NiYW5kYW1hcmlhYWJ1c29tdWNoYXN1YmlycmlvamF2aXZpcmdyYWRvY2hpY2FhbGxDLWpvdmVuZGljaGFlc3RhbnRhbGVzc2FsaXJzdWVsb3Blc29zZmluZXNsbGFtYWJ1c2NvQylzdGFsbGVnYW5lZ3JvcGxhemFodW1vcnBhZ2FyanVudGFkb2JsZWlzbGFzYm9sc2FiYUMxb2hhYmxhbHVjaGFDAXJlYWRpY2VuanVnYXJub3Rhc3ZhbGxlYWxsQyFjYXJnYWRvbG9yYWJham9lc3RDKWd1c3RvbWVudGVtYXJpb2Zpcm1hY29zdG9maWNoYXBsYXRhaG9nYXJhcnRlc2xleWVzYXF1ZWxtdXNlb2Jhc2VzcG9jb3NtaXRhZGNpZWxvY2hpY29taWVkb2dhbmFyc2FudG9ldGFwYWRlYmVzcGxheWFyZWRlc3NpZXRlY29ydGVjb3JlYWR1ZGFzZGVzZW92aWVqb2Rlc2VhYWd1YXMmcXVvdDtkb21haW5jb21tb25zdGF0dXNldmVudHNtYXN0ZXJzeXN0ZW1hY3Rpb25iYW5uZXJyZW1vdmVzY3JvbGx1cGRhdGVnbG9iYWxtZWRpdW1maWx0ZXJudW1iZXJjaGFuZ2VyZXN1bHRwdWJsaWNzY3JlZW5jaG9vc2Vub3JtYWx0cmF2ZWxpc3N1ZXNzb3VyY2V0YXJnZXRzcHJpbmdtb2R1bGVtb2JpbGVzd2l0Y2hwaG90b3Nib3JkZXJyZWdpb25pdHNlbGZzb2NpYWxhY3RpdmVjb2x1bW5yZWNvcmRmb2xsb3d0aXRsZT5laXRoZXJsZW5ndGhmYW1pbHlmcmllbmRsYXlvdXRhdXRob3JjcmVhdGVyZXZpZXdzdW1tZXJzZXJ2ZXJwbGF5ZWRwbGF5ZXJleHBhbmRwb2xpY3lmb3JtYXRkb3VibGVwb2ludHNzZXJpZXNwZXJzb25saXZpbmdkZXNpZ25tb250aHNmb3JjZXN1bmlxdWV3ZWlnaHRwZW9wbGVlbmVyZ3luYXR1cmVzZWFyY2hmaWd1cmVoYXZpbmdjdXN0b21vZmZzZXRsZXR0ZXJ3aW5kb3dzdWJtaXRyZW5kZXJncm91cHN1cGxvYWRoZWFsdGhtZXRob2R2aWRlb3NzY2hvb2xmdXR1cmVzaGFkb3dkZWJhdGV2YWx1ZXNPYmplY3RvdGhlcnNyaWdodHNsZWFndWVjaHJvbWVzaW1wbGVub3RpY2VzaGFyZWRlbmRpbmdzZWFzb25yZXBvcnRvbmxpbmVzcXVhcmVidXR0b25pbWFnZXNlbmFibGVtb3ZpbmdsYXRlc3R3aW50ZXJGcmFuY2VwZXJpb2RzdHJvbmdyZXBlYXRMb25kb25kZXRhaWxmb3JtZWRkZW1hbmRzZWN1cmVwYXNzZWR0b2dnbGVwbGFjZXNkZXZpY2VzdGF0aWNjaXRpZXNzdHJlYW15ZWxsb3dhdHRhY2tzdHJlZXRmbGlnaHRoaWRkZW5pbmZvIj5vcGVuZWR1c2VmdWx2YWxsZXljYXVzZXNsZWFkZXJzZWNyZXRzZWNvbmRkYW1hZ2VzcG9ydHNleGNlcHRyYXRpbmdzaWduZWR0aGluZ3NlZmZlY3RmaWVsZHNzdGF0ZXNvZmZpY2V2aXN1YWxlZGl0b3J2b2x1bWVSZXBvcnRtdXNldW1tb3ZpZXNwYXJlbnRhY2Nlc3Ntb3N0bHltb3RoZXIiIGlkPSJtYXJrZXRncm91bmRjaGFuY2VzdXJ2ZXliZWZvcmVzeW1ib2xtb21lbnRzcGVlY2htb3Rpb25pbnNpZGVtYXR0ZXJDZW50ZXJvYmplY3RleGlzdHNtaWRkbGVFdXJvcGVncm93dGhsZWdhY3ltYW5uZXJlbm91Z2hjYXJlZXJhbnN3ZXJvcmlnaW5wb3J0YWxjbGllbnRzZWxlY3RyYW5kb21jbG9zZWR0b3BpY3Njb21pbmdmYXRoZXJvcHRpb25zaW1wbHlyYWlzZWRlc2NhcGVjaG9zZW5jaHVyY2hkZWZpbmVyZWFzb25jb3JuZXJvdXRwdXRtZW1vcnlpZnJhbWVwb2xpY2Vtb2RlbHNOdW1iZXJkdXJpbmdvZmZlcnNzdHlsZXNraWxsZWRsaXN0ZWRjYWxsZWRzaWx2ZXJtYXJnaW5kZWxldGViZXR0ZXJicm93c2VsaW1pdHNHbG9iYWxzaW5nbGV3aWRnZXRjZW50ZXJidWRnZXRub3dyYXBjcmVkaXRjbGFpbXNlbmdpbmVzYWZldHljaG9pY2VzcGlyaXQtc3R5bGVzcHJlYWRtYWtpbmduZWVkZWRydXNzaWFwbGVhc2VleHRlbnRTY3JpcHRicm9rZW5hbGxvd3NjaGFyZ2VkaXZpZGVmYWN0b3JtZW1iZXItYmFzZWR0aGVvcnljb25maWdhcm91bmR3b3JrZWRoZWxwZWRDaHVyY2hpbXBhY3RzaG91bGRhbHdheXNsb2dvIiBib3R0b21saXN0Ij4pe3ZhciBwcmVmaXhvcmFuZ2VIZWFkZXIucHVzaChjb3VwbGVnYXJkZW5icmlkZ2VsYXVuY2hSZXZpZXd0YWtpbmd2aXNpb25saXR0bGVkYXRpbmdCdXR0b25iZWF1dHl0aGVtZXNmb3Jnb3RTZWFyY2hhbmNob3JhbG1vc3Rsb2FkZWRDaGFuZ2VyZXR1cm5zdHJpbmdyZWxvYWRNb2JpbGVpbmNvbWVzdXBwbHlTb3VyY2VvcmRlcnN2aWV3ZWQmbmJzcDtjb3Vyc2VBYm91dCBpc2xhbmQ8aHRtbCBjb29raWVuYW1lPSJhbWF6b25tb2Rlcm5hZHZpY2VpbjwvYT46IFRoZSBkaWFsb2dob3VzZXNCRUdJTiBNZXhpY29zdGFydHNjZW50cmVoZWlnaHRhZGRpbmdJc2xhbmRhc3NldHNFbXBpcmVTY2hvb2xlZmZvcnRkaXJlY3RuZWFybHltYW51YWxTZWxlY3QuCgpPbmVqb2luZWRtZW51Ij5QaGlsaXBhd2FyZHNoYW5kbGVpbXBvcnRPZmZpY2VyZWdhcmRza2lsbHNuYXRpb25TcG9ydHNkZWdyZWV3ZWVrbHkgKGUuZy5iZWhpbmRkb2N0b3Jsb2dnZWR1bml0ZWQ8L2I+PC9iZWdpbnNwbGFudHNhc3Npc3RhcnRpc3Rpc3N1ZWQzMDBweHxjYW5hZGFhZ2VuY3lzY2hlbWVyZW1haW5CcmF6aWxzYW1wbGVsb2dvIj5iZXlvbmQtc2NhbGVhY2NlcHRzZXJ2ZWRtYXJpbmVGb290ZXJjYW1lcmE8L2gxPgpfZm9ybSJsZWF2ZXNzdHJlc3MiIC8+XHIKLmdpZiIgb25sb2FkbG9hZGVyT3hmb3Jkc2lzdGVyc3Vydml2bGlzdGVuZmVtYWxlRGVzaWduc2l6ZT0iYXBwZWFsdGV4dCI+bGV2ZWxzdGhhbmtzaGlnaGVyZm9yY2VkYW5pbWFsYW55b25lQWZyaWNhYWdyZWVkcmVjZW50UGVvcGxlPGJyIC8+d29uZGVycHJpY2VzdHVybmVkfHwge307bWFpbiI+aW5saW5lc3VuZGF5d3JhcCI+ZmFpbGVkY2Vuc3VzbWludXRlYmVhY29ucXVvdGVzMTUwcHh8ZXN0YXRlcmVtb3RlZW1haWwibGlua2VkcmlnaHQ7c2lnbmFsZm9ybWFsMS5odG1sc2lnbnVwcHJpbmNlZmxvYXQ6LnBuZyIgZm9ydW0uQWNjZXNzcGFwZXJzc291bmRzZXh0ZW5kSGVpZ2h0c2xpZGVyVVRGLTgiJmFtcDsgQmVmb3JlLiBXaXRoc3R1ZGlvb3duZXJzbWFuYWdlcHJvZml0alF1ZXJ5YW5udWFscGFyYW1zYm91Z2h0ZmFtb3VzZ29vZ2xlbG9uZ2VyaSsrKSB7aXNyYWVsc2F5aW5nZGVjaWRlaG9tZSI+aGVhZGVyZW5zdXJlYnJhbmNocGllY2VzYmxvY2s7c3RhdGVkdG9wIj48cmFjaW5ncmVzaXplLS0mZ3Q7cGFjaXR5c2V4dWFsYnVyZWF1LmpwZyIgMTAsMDAwb2J0YWludGl0bGVzYW1vdW50LCBJbmMuY29tZWR5bWVudSIgbHlyaWNzdG9kYXkuaW5kZWVkY291bnR5X2xvZ28uRmFtaWx5bG9va2VkTWFya2V0bHNlIGlmUGxheWVydHVya2V5KTt2YXIgZm9yZXN0Z2l2aW5nZXJyb3JzRG9tYWlufWVsc2V7aW5zZXJ0QmxvZzwvZm9vdGVybG9naW4uZmFzdGVyYWdlbnRzPGJvZHkgMTBweCAwcHJhZ21hZnJpZGF5anVuaW9yZG9sbGFycGxhY2VkY292ZXJzcGx1Z2luNSwwMDAgcGFnZSI+Ym9zdG9uLnRlc3QoYXZhdGFydGVzdGVkX2NvdW50Zm9ydW1zc2NoZW1haW5kZXgsZmlsbGVkc2hhcmVzcmVhZGVyYWxlcnQoYXBwZWFyU3VibWl0bGluZSI+Ym9keSI+CiogVGhlVGhvdWdoc2VlaW5namVyc2V5TmV3czwvdmVyaWZ5ZXhwZXJ0aW5qdXJ5d2lkdGg9Q29va2llU1RBUlQgYWNyb3NzX2ltYWdldGhyZWFkbmF0aXZlcG9ja2V0Ym94Ij4KU3lzdGVtIERhdmlkY2FuY2VydGFibGVzcHJvdmVkQXByaWwgcmVhbGx5ZHJpdmVyaXRlbSI+bW9yZSI+Ym9hcmRzY29sb3JzY2FtcHVzZmlyc3QgfHwgW107bWVkaWEuZ3VpdGFyZmluaXNod2lkdGg6c2hvd2VkT3RoZXIgLnBocCIgYXNzdW1lbGF5ZXJzd2lsc29uc3RvcmVzcmVsaWVmc3dlZGVuQ3VzdG9tZWFzaWx5IHlvdXIgU3RyaW5nCgpXaGlsdGF5bG9yY2xlYXI6cmVzb3J0ZnJlbmNodGhvdWdoIikgKyAiPGJvZHk+YnV5aW5nYnJhbmRzTWVtYmVybmFtZSI+b3BwaW5nc2VjdG9yNXB4OyI+dnNwYWNlcG9zdGVybWFqb3IgY29mZmVlbWFydGlubWF0dXJlaGFwcGVuPC9uYXY+a2Fuc2FzbGluayI+SW1hZ2VzPWZhbHNld2hpbGUgaHNwYWNlMCZhbXA7IAoKSW4gIHBvd2VyUG9sc2tpLWNvbG9yam9yZGFuQm90dG9tU3RhcnQgLWNvdW50Mi5odG1sbmV3cyI+MDEuanBnT25saW5lLXJpZ2h0bWlsbGVyc2VuaW9ySVNCTiAwMCwwMDAgZ3VpZGVzdmFsdWUpZWN0aW9ucmVwYWlyLnhtbCIgIHJpZ2h0cy5odG1sLWJsb2NrcmVnRXhwOmhvdmVyd2l0aGludmlyZ2lucGhvbmVzPC90cj5ccnVzaW5nIAoJdmFyID4nKTsKCTwvdGQ+CjwvdHI+CmJhaGFzYWJyYXNpbGdhbGVnb21hZ3lhcnBvbHNraXNycHNraVgxWC9ZXGJkOC1mFlx4MDdnLlwwZD0TZzkBaSsUZD8hZgEvZDgtZVx4MUI9ZlxiEWQ7LGQ4XDBkOCplBSxlDzhnLiFnEAZoLjplHVx4MUJlDy9kOyVmHFxyZQohZhc2aRc0ZDgqZDo6ZDonZRMBaFx4MDcqZTcxZDwBZDgaZh8lZxxcdmU3JWQ9HGgBFGczO2YyIWYcCWc9EWcrGWYJXDBmHAloLwRoLjpkOC1lPwNmFlx4MDdnKyBnFChmXGI3aSYWaSE1ZD0caFww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aR0iZDhccmUGXHJoLxpkPyFmBA9kOQlpGDNlBQloXHYxZVx4MUI9ZjwCZDouZQZceDFCZDpcdmcOKWUuNmc+JGQ8F2UGHGYwEWVccjNlDy9lEFxyZygxZS42ZQU3ZQooZxQ7ZgMzZVxiMGYzKGYYDmUwD2UtJmZcMCdoAz1oXDADZyAUZyEsZDs2aCcCZxxcdmY4BWYlGmYQHmcsEWkmFmkgAWk7BGlceDA3EWlcMAJnFChmMR9oXHYPZxwfZS4eZDg7Zy4haRg2Zi41aCg7ZQYKZz87aC8RZh0DZVxiKWUBGmUlPWQ8PGQ5DmlcMBpoLi9mFj1lNyVnXHZcMGYFXHZkOR9oLjhnDi9kPx1lHzllBTtmJgJlPzVlJCdlHlx2Zhw6ZyUoZxAGaCcjZVxmP2UQXHJjdWFuZG9lbnZpYXJtYWRyaWRidXNjYXJpbmljaW90aWVtcG9wb3JxdWVjdWVudGFlc3RhZG9wdWVkZW5qdWVnb3Njb250cmFlc3RDIW5ub21icmV0aWVuZW5wZXJmaWxtYW5lcmFhbWlnb3NjaXVkYWRjZW50cm9hdW5xdWVwdWVkZXNkZW50cm9wcmltZXJwcmVjaW9zZWdDOm5idWVub3N2b2x2ZXJwdW50b3NzZW1hbmFoYWJDLWFhZ29zdG9udWV2b3N1bmlkb3NjYXJsb3NlcXVpcG9uaUMxb3NtdWNob3NhbGd1bmFjb3JyZW9pbWFnZW5wYXJ0aXJhcnJpYmFtYXJDLWFob21icmVlbXBsZW92ZXJkYWRjYW1iaW9tdWNoYXNmdWVyb25wYXNhZG9sQy1uZWFwYXJlY2VudWV2YXNjdXJzb3Nlc3RhYmFxdWllcm9saWJyb3NjdWFudG9hY2Nlc29taWd1ZWx2YXJpb3NjdWF0cm90aWVuZXNncnVwb3NzZXJDIW5ldXJvcGFtZWRpb3NmcmVudGVhY2VyY2FkZW1DIXNvZmVydGFjb2NoZXNtb2RlbG9pdGFsaWFsZXRyYXNhbGdDOm5jb21wcmFjdWFsZXNleGlzdGVjdWVycG9zaWVuZG9wcmVuc2FsbGVnYXJ2aWFqZXNkaW5lcm9tdXJjaWFwb2RyQyFwdWVzdG9kaWFyaW9wdWVibG9xdWllcmVtYW51ZWxwcm9waW9jcmlzaXNjaWVydG9zZWd1cm9tdWVydGVmdWVudGVjZXJyYXJncmFuZGVlZmVjdG9wYXJ0ZXNtZWRpZGFwcm9waWFvZnJlY2V0aWVycmFlLW1haWx2YXJpYXNmb3JtYXNmdXR1cm9vYmpldG9zZWd1aXJyaWVzZ29ub3JtYXNtaXNtb3NDOm5pY29jYW1pbm9zaXRpb3NyYXpDM25kZWJpZG9wcnVlYmF0b2xlZG90ZW5DLWFqZXNDOnNlc3Blcm9jb2NpbmFvcmlnZW50aWVuZGFjaWVudG9jQyFkaXpoYWJsYXJzZXJDLWFsYXRpbmFmdWVyemFlc3RpbG9ndWVycmFlbnRyYXJDKXhpdG9sQzNwZXphZ2VuZGF2Qy1kZW9ldml0YXJwYWdpbmFtZXRyb3NqYXZpZXJwYWRyZXNmQyFjaWxjYWJlemFDIXJlYXNzYWxpZGFlbnZDLW9qYXBDM25hYnVzb3NiaWVuZXN0ZXh0b3NsbGV2YXJwdWVkYW5mdWVydGVjb21DOm5jbGFzZXNodW1hbm90ZW5pZG9iaWxiYW91bmlkYWRlc3RDIXNlZGl0YXJjcmVhZG9QNFA7UQ9RXHgwN1ECUD5QOlAwUDpQOFA7UDhRXHJRAlA+UDJRAVA1UDVQM1A+UD9RXDBQOFECUDBQOlA1UQlQNVEDUDZQNVAaUDBQOlAxUDVQN1AxUVx2UDtQPlA9UDhQElEBUDVQP1A+UDRQLVECUD5RAlA+UDxRXHgwN1A1UDxQPVA1UQJQO1A1UQJRXDBQMFA3UD5QPVAwUDNQNFA1UDxQPVA1UBRQO1EPUB9RXDBQOFA9UDBRAVA9UDhRBVECUDVQPFA6UQJQPlAzUD5QNFAyUD5RAlECUDBQPFAhUChQEFA8UDBRD1AnUQJQPlAyUDBRAVAyUDBQPFA1UDxRA1AiUDBQOlA0UDJQMFA9UDBQPFFcclECUDhRXHJRAlEDUBJQMFA8UQJQNVEFUD9RXDBQPlECUQNRAlA9UDBQNFA0UD1RD1ASUD5RAlECUVwwUDhQPVA1UDlQElAwUQFQPVA4UDxRAVAwUDxRAlA+UQJRXDBRA1AxUB5QPVA4UDxQOFFcMFA9UDVQNVAeUB5QHlA7UDhRBlFcclECUDBQHlA9UDBQPVA1UDxQNFA+UDxQPFA+UDlQNFAyUDVQPlA9UD5RAVEDUDRcYCQVXGAlXHgwN1xgJDlcYCVcYlxgJBVcYCVcMFxgJDhcYCVceDA3XGAkFVxgJD5cYCQVXGAlXHZcYCQUXGAkMFxgJCpcYCQwXGAkKFxgJVx4MDdcYCQPXGAkFVxgJBVcYCQ/XGAkLVxgJVwwXGAkXHgwN1xgJDhcYCQVXGAkMFxgJCRcYCVcdlxgJDlcYCVcdlxgJAZcYCQqXGAkOVxgJVwwXGAkL1xgJDlcYCQvXGAkPlxgJCRcYCQVXGAkJVxgJD5qYWdyYW5cYCQGXGAkHFxgJBxcYCVcdlxgJAVcYCQsXGAkJlxgJVx2XGAkF1xgJFxiXGAkHFxgJD5cYCQXXGAkD1xgJDlcYCQuXGAkXHgwN1xgJChcYCQ1XGAkOVxgJC9cYCVceDA3XGAkJVxgJVx4MDdcYCQlXGAlXDBcYCQYXGAkMFxgJBxcYCQsXGAkJlxgJVwwXGAkFVxgJFxiXGAkHFxgJVwwXGAkNVxgJVx4MDdcYCQoXGAkXGJcYCQoXGAkD1xgJDlcYCQwXGAkCVxgJDhcYCQuXGAlXHgwN1xgJBVcYCQuXGAkNVxgJVx2XGAkMlxgJVx4MDdcYCQ4XGAkLFxgJC5cYCRcYlxgJCZcYCVceDA3XGAkE1xgJDBcYCQGXGAkLlxgJCxcYCQ4XGAkLVxgJDBcYCQsXGAkKFxgJBpcYCQyXGAkLlxgJChcYCQGXGAkF1xgJDhcYCVcMFxgJDJcYCVcMFg5WQRZCVglWQRZCVlceDA3WDBYJ1giWC5YMVg5WC9YL1gnWQRZCVlceDA3WDBZXHgwN1g1WVxiWDFYOlkKWDFZA1gnWQZZXGJZBFgnWChZClkGWDlYMVg2WDBZBFkDWVx4MDdZBlgnWQpZXGJZBVkCWCdZBFg5WQRZClgnWQZYJ1kEWQNZBlgtWCpZCVkCWChZBFlcYlgtWClYJ1guWDFZAVkCWDdYOVgoWC9YMVkDWQZYJVgwWCdZA1kFWCdYJ1gtWC9YJVkEWCdZAVkKWVx4MDdYKFg5WDZZA1kKWQFYKFgtWCtZXGJZBVkGWVxiWVx4MDdZXGJYI1kGWCdYLFgvWCdZBFlceDA3WCdYM1kEWQVYOVkGWC9ZBFkKWDNYOVgoWDFYNVkEWQlZBVkGWDBYKFlceDA3WCdYI1kGWVx4MDdZBVgrWQRZA1kGWCpYJ1kEWCdYLVkKWCtZBVg1WDFYNFgxWC1YLVlcYlkEWVxiWQFZClgnWDBYJ1kEWQNZBFkFWDFYKVgnWQZYKlgnWQRZAVgjWChZXGJYLlgnWDVYI1kGWCpYJ1kGWVx4MDdYJ1kEWQpYOVg2WVxiWVxiWQJYL1gnWChZBlguWQpYMVgoWQZYKlkEWQNZBVg0WCdYIVlcYllceDA3WQpYJ1goWVxiWQJYNVg1WVxiWQVYJ1gxWQJZBVgjWC1YL1kGWC1ZBlg5WC9ZBVgxWCNZClgnWC1YKVkDWCpYKFgvWVxiWQZZClgsWChZBVkGWVx4MDdYKlgtWCpYLFlceDA3WClYM1kGWClZClgqWQVZA1gxWClYOlgyWClZBlkBWDNYKFkKWCpZBFkEWVx4MDdZBFkGWCdYKlkEWQNZAlkEWChZBFkFWCdYOVkGWVx4MDdYI1lcYlkEWDRZClghWQZZXGJYMVgjWQVYJ1kBWQpZA1goWQNZBFgwWCdYKlgxWCpYKFgoWCNZBllceDA3WQVYM1gnWQZZA1goWQpYOVkBWQJYL1gtWDNZBlkEWVx4MDdZBVg0WDlYMVgjWVx4MDdZBFg0WVx4MDdYMVkCWDdYMVg3WQRYKHByb2ZpbGVzZXJ2aWNlZGVmYXVsdGhpbXNlbGZkZXRhaWxzY29udGVudHN1cHBvcnRzdGFydGVkbWVzc2FnZXN1Y2Nlc3NmYXNoaW9uPHRpdGxlPmNvdW50cnlhY2NvdW50Y3JlYXRlZHN0b3JpZXNyZXN1bHRzcnVubmluZ3Byb2Nlc3N3cml0aW5nb2JqZWN0c3Zpc2libGV3ZWxjb21lYXJ0aWNsZXVua25vd25uZXR3b3JrY29tcGFueWR5bmFtaWNicm93c2VycHJpdmFjeXByb2JsZW1TZXJ2aWNlcmVzcGVjdGRpc3BsYXlyZXF1ZXN0cmVzZXJ2ZXdlYnNpdGVoaXN0b3J5ZnJpZW5kc29wdGlvbnN3b3JraW5ndmVyc2lvbm1pbGxpb25jaGFubmVsd2luZG93LmFkZHJlc3N2aXNpdGVkd2VhdGhlcmNvcnJlY3Rwcm9kdWN0ZWRpcmVjdGZvcndhcmR5b3UgY2FucmVtb3ZlZHN1YmplY3Rjb250cm9sYXJjaGl2ZWN1cnJlbnRyZWFkaW5nbGlicmFyeWxpbWl0ZWRtYW5hZ2VyZnVydGhlcnN1bW1hcnltYWNoaW5lbWludXRlc3ByaXZhdGVjb250ZXh0cHJvZ3JhbXNvY2lldHludW1iZXJzd3JpdHRlbmVuYWJsZWR0cmlnZ2Vyc291cmNlc2xvYWRpbmdlbGVtZW50cGFydG5lcmZpbmFsbHlwZXJmZWN0bWVhbmluZ3N5c3RlbXNrZWVwaW5nY3VsdHVyZSZxdW90Oyxqb3VybmFscHJvamVjdHN1cmZhY2VzJnF1b3Q7ZXhwaXJlc3Jldmlld3NiYWxhbmNlRW5nbGlzaENvbnRlbnR0aHJvdWdoUGxlYXNlIG9waW5pb25jb250YWN0YXZlcmFnZXByaW1hcnl2aWxsYWdlU3BhbmlzaGdhbGxlcnlkZWNsaW5lbWVldGluZ21pc3Npb25wb3B1bGFycXVhbGl0eW1lYXN1cmVnZW5lcmFsc3BlY2llc3Nlc3Npb25zZWN0aW9ud3JpdGVyc2NvdW50ZXJpbml0aWFscmVwb3J0c2ZpZ3VyZXNtZW1iZXJzaG9sZGluZ2Rpc3B1dGVlYXJsaWVyZXhwcmVzc2RpZ2l0YWxwaWN0dXJlQW5vdGhlcm1hcnJpZWR0cmFmZmljbGVhZGluZ2NoYW5nZWRjZW50cmFsdmljdG9yeWltYWdlcy9yZWFzb25zc3R1ZGllc2ZlYXR1cmVsaXN0aW5nbXVzdCBiZXNjaG9vbHNWZXJzaW9udXN1YWxseWVwaXNvZGVwbGF5aW5nZ3Jvd2luZ29idmlvdXNvdmVybGF5cHJlc2VudGFjdGlvbnM8L3VsPlxyCndyYXBwZXJhbHJlYWR5Y2VydGFpbnJlYWxpdHlzdG9yYWdlYW5vdGhlcmRlc2t0b3BvZmZlcmVkcGF0dGVybnVudXN1YWxEaWdpdGFsY2FwaXRhbFdlYnNpdGVmYWlsdXJlY29ubmVjdHJlZHVjZWRBbmRyb2lkZGVjYWRlc3JlZ3VsYXIgJmFtcDsgYW5pbWFsc3JlbGVhc2VBdXRvbWF0Z2V0dGluZ21ldGhvZHNub3RoaW5nUG9wdWxhcmNhcHRpb25sZXR0ZXJzY2FwdHVyZXNjaWVuY2VsaWNlbnNlY2hhbmdlc0VuZ2xhbmQ9MSZhbXA7SGlzdG9yeSA9IG5ldyBDZW50cmFsdXBkYXRlZFNwZWNpYWxOZXR3b3JrcmVxdWlyZWNvbW1lbnR3YXJuaW5nQ29sbGVnZXRvb2xiYXJyZW1haW5zYmVjYXVzZWVsZWN0ZWREZXV0c2NoZmluYW5jZXdvcmtlcnNxdWlja2x5YmV0d2VlbmV4YWN0bHlzZXR0aW5nZGlzZWFzZVNvY2lldHl3ZWFwb25zZXhoaWJpdCZsdDshLS1Db250cm9sY2xhc3Nlc2NvdmVyZWRvdXRsaW5lYXR0YWNrc2RldmljZXMod2luZG93cHVycG9zZXRpdGxlPSJNb2JpbGUga2lsbGluZ3Nob3dpbmdJdGFsaWFuZHJvcHBlZGhlYXZpbHllZmZlY3RzLTEnXSk7CmNvbmZpcm1DdXJyZW50YWR2YW5jZXNoYXJpbmdvcGVuaW5nZHJhd2luZ2JpbGxpb25vcmRlcmVkR2VybWFueXJlbGF0ZWQ8L2Zvcm0+aW5jbHVkZXdoZXRoZXJkZWZpbmVkU2NpZW5jZWNhdGFsb2dBcnRpY2xlYnV0dG9uc2xhcmdlc3R1bmlmb3Jtam91cm5leXNpZGViYXJDaGljYWdvaG9saWRheUdlbmVyYWxwYXNzYWdlLCZxdW90O2FuaW1hdGVmZWVsaW5nYXJyaXZlZHBhc3NpbmduYXR1cmFscm91Z2hseS4KClRoZSBidXQgbm90ZGVuc2l0eUJyaXRhaW5DaGluZXNlbGFjayBvZnRyaWJ1dGVJcmVsYW5kIiBkYXRhLWZhY3RvcnNyZWNlaXZldGhhdCBpc0xpYnJhcnlodXNiYW5kaW4gZmFjdGFmZmFpcnNDaGFybGVzcmFkaWNhbGJyb3VnaHRmaW5kaW5nbGFuZGluZzpsYW5nPSJyZXR1cm4gbGVhZGVyc3BsYW5uZWRwcmVtaXVtcGFja2FnZUFtZXJpY2FFZGl0aW9uXSZxdW90O01lc3NhZ2VuZWVkIHRvdmFsdWU9ImNvbXBsZXhsb29raW5nc3RhdGlvbmJlbGlldmVzbWFsbGVyLW1vYmlsZXJlY29yZHN3YW50IHRva2luZCBvZkZpcmVmb3h5b3UgYXJlc2ltaWxhcnN0dWRpZWRtYXhpbXVtaGVhZGluZ3JhcGlkbHljbGltYXRla2luZ2RvbWVtZXJnZWRhbW91bnRzZm91bmRlZHBpb25lZXJmb3JtdWxhZHluYXN0eWhvdyB0byBTdXBwb3J0cmV2ZW51ZWVjb25vbXlSZXN1bHRzYnJvdGhlcnNvbGRpZXJsYXJnZWx5Y2FsbGluZy4mcXVvdDtBY2NvdW50RWR3YXJkIHNlZ21lbnRSb2JlcnQgZWZmb3J0c1BhY2lmaWNsZWFybmVkdXAgd2l0aGhlaWdodDp3ZSBoYXZlQW5nZWxlc25hdGlvbnNfc2VhcmNoYXBwbGllZGFjcXVpcmVtYXNzaXZlZ3JhbnRlZDogZmFsc2V0cmVhdGVkYmlnZ2VzdGJlbmVmaXRkcml2aW5nU3R1ZGllc21pbmltdW1wZXJoYXBzbW9ybmluZ3NlbGxpbmdpcyB1c2VkcmV2ZXJzZXZhcmlhbnQgcm9sZT0ibWlzc2luZ2FjaGlldmVwcm9tb3Rlc3R1ZGVudHNvbWVvbmVleHRyZW1lcmVzdG9yZWJvdHRvbTpldm9sdmVkYWxsIHRoZXNpdGVtYXBlbmdsaXNod2F5IHRvICBBdWd1c3RzeW1ib2xzQ29tcGFueW1hdHRlcnNtdXNpY2FsYWdhaW5zdHNlcnZpbmd9KSgpO1xyCnBheW1lbnR0cm91YmxlY29uY2VwdGNvbXBhcmVwYXJlbnRzcGxheWVyc3JlZ2lvbnNtb25pdG9yICcnVGhlIHdpbm5pbmdleHBsb3JlYWRhcHRlZEdhbGxlcnlwcm9kdWNlYWJpbGl0eWVuaGFuY2VjYXJlZXJzKS4gVGhlIGNvbGxlY3RTZWFyY2ggYW5jaWVudGV4aXN0ZWRmb290ZXIgaGFuZGxlcnByaW50ZWRjb25zb2xlRWFzdGVybmV4cG9ydHN3aW5kb3dzQ2hhbm5lbGlsbGVnYWxuZXV0cmFsc3VnZ2VzdF9oZWFkZXJzaWduaW5nLmh0bWwiPnNldHRsZWR3ZXN0ZXJuY2F1c2luZy13ZWJraXRjbGFpbWVkSnVzdGljZWNoYXB0ZXJ2aWN0aW1zVGhvbWFzIG1vemlsbGFwcm9taXNlcGFydGllc2VkaXRpb25vdXRzaWRlOmZhbHNlLGh1bmRyZWRPbHltcGljX2J1dHRvbmF1dGhvcnNyZWFjaGVkY2hyb25pY2RlbWFuZHNzZWNvbmRzcHJvdGVjdGFkb3B0ZWRwcmVwYXJlbmVpdGhlcmdyZWF0bHlncmVhdGVyb3ZlcmFsbGltcHJvdmVjb21tYW5kc3BlY2lhbHNlYXJjaC53b3JzaGlwZnVuZGluZ3Rob3VnaHRoaWdoZXN0aW5zdGVhZHV0aWxpdHlxdWFydGVyQ3VsdHVyZXRlc3RpbmdjbGVhcmx5ZXhwb3NlZEJyb3dzZXJsaWJlcmFsfSBjYXRjaFByb2plY3RleGFtcGxlaGlkZSgpO0Zsb3JpZGFhbnN3ZXJzYWxsb3dlZEVtcGVyb3JkZWZlbnNlc2VyaW91c2ZyZWVkb21TZXZlcmFsLWJ1dHRvbkZ1cnRoZXJvdXQgb2YgIT0gbnVsbHRyYWluZWREZW5tYXJrdm9pZCgwKS9hbGwuanNwcmV2ZW50UmVxdWVzdFN0ZXBoZW4KCldoZW4gb2JzZXJ2ZTwvaDI+XHIKTW9kZXJuIHByb3ZpZGUiIGFsdD0iYm9yZGVycy4KCkZvciAKCk1hbnkgYXJ0aXN0c3Bvd2VyZWRwZXJmb3JtZmljdGlvbnR5cGUgb2ZtZWRpY2FsdGlja2V0c29wcG9zZWRDb3VuY2lsd2l0bmVzc2p1c3RpY2VHZW9yZ2UgQmVsZ2l1bS4uLjwvYT50d2l0dGVybm90YWJseXdhaXRpbmd3YXJmYXJlIE90aGVyIHJhbmtpbmdwaHJhc2VzbWVudGlvbnN1cnZpdmVzY2hvbGFyPC9wPlxyCiBDb3VudHJ5aWdub3JlZGxvc3Mgb2ZqdXN0IGFzR2VvcmdpYXN0cmFuZ2U8aGVhZD48c3RvcHBlZDEnXSk7XHIKaXNsYW5kc25vdGFibGVib3JkZXI6bGlzdCBvZmNhcnJpZWQxMDAsMDAwPC9oMz4KIHNldmVyYWxiZWNvbWVzc2VsZWN0IHdlZGRpbmcwMC5odG1sbW9uYXJjaG9mZiB0aGV0ZWFjaGVyaGlnaGx5IGJpb2xvZ3lsaWZlIG9mb3IgZXZlbnJpc2Ugb2YmcmFxdW87cGx1c29uZWh1bnRpbmcodGhvdWdoRG91Z2xhc2pvaW5pbmdjaXJjbGVzRm9yIHRoZUFuY2llbnRWaWV0bmFtdmVoaWNsZXN1Y2ggYXNjcnlzdGFsdmFsdWUgPVdpbmRvd3NlbmpveWVkYSBzbWFsbGFzc3VtZWQ8YSBpZD0iZm9yZWlnbiBBbGwgcmlob3cgdGhlRGlzcGxheXJldGlyZWRob3dldmVyaGlkZGVuO2JhdHRsZXNzZWVraW5nY2FiaW5ldHdhcyBub3Rsb29rIGF0Y29uZHVjdGdldCB0aGVKYW51YXJ5aGFwcGVuc3R1cm5pbmdhOmhvdmVyT25saW5lIEZyZW5jaCBsYWNraW5ndHlwaWNhbGV4dHJhY3RlbmVtaWVzZXZlbiBpZmdlbmVyYXRkZWNpZGVkYXJlIG5vdC9zZWFyY2hiZWxpZWZzLWltYWdlOmxvY2F0ZWRzdGF0aWMubG9naW4iPmNvbnZlcnR2aW9sZW50ZW50ZXJlZGZpcnN0Ij5jaXJjdWl0RmlubGFuZGNoZW1pc3RzaGUgd2FzMTBweDsiPmFzIHN1Y2hkaXZpZGVkPC9zcGFuPndpbGwgYmVsaW5lIG9mYSBncmVhdG15c3RlcnkvaW5kZXguZmFsbGluZ2R1ZSB0byByYWlsd2F5Y29sbGVnZW1vbnN0ZXJkZXNjZW50aXQgd2l0aG51Y2xlYXJKZXdpc2ggcHJvdGVzdEJyaXRpc2hmbG93ZXJzcHJlZGljdHJlZm9ybXNidXR0b24gd2hvIHdhc2xlY3R1cmVpbnN0YW50c3VpY2lkZWdlbmVyaWNwZXJpb2RzbWFya2V0c1NvY2lhbCBmaXNoaW5nY29tYmluZWdyYXBoaWN3aW5uZXJzPGJyIC8+PGJ5IHRoZSBOYXR1cmFsUHJpdmFjeWNvb2tpZXNvdXRjb21lcmVzb2x2ZVN3ZWRpc2hicmllZmx5UGVyc2lhbnNvIG11Y2hDZW50dXJ5ZGVwaWN0c2NvbHVtbnNob3VzaW5nc2NyaXB0c25leHQgdG9iZWFyaW5nbWFwcGluZ3JldmlzZWRqUXVlcnkoLXdpZHRoOnRpdGxlIj50b29sdGlwU2VjdGlvbmRlc2lnbnNUdXJraXNoeW91bmdlci5tYXRjaCh9KSgpOwoKYnVybmluZ29wZXJhdGVkZWdyZWVzc291cmNlPVJpY2hhcmRjbG9zZWx5cGxhc3RpY2VudHJpZXM8L3RyPlxyCmNvbG9yOiN1bCBpZD0icG9zc2Vzc3JvbGxpbmdwaHlzaWNzZmFpbGluZ2V4ZWN1dGVjb250ZXN0bGluayB0b0RlZmF1bHQ8YnIgLz4KOiB0cnVlLGNoYXJ0ZXJ0b3VyaXNtY2xhc3NpY3Byb2NlZWRleHBsYWluPC9oMT5ccgpvbmxpbmUuP3htbCB2ZWhlbHBpbmdkaWFtb25kdXNlIHRoZWFpcmxpbmVlbmQgLS0+KS5hdHRyKHJlYWRlcnNob3N0aW5nI2ZmZmZmZnJlYWxpemVWaW5jZW50c2lnbmFscyBzcmM9Ii9Qcm9kdWN0ZGVzcGl0ZWRpdmVyc2V0ZWxsaW5nUHVibGljIGhlbGQgaW5Kb3NlcGggdGhlYXRyZWFmZmVjdHM8c3R5bGU+YSBsYXJnZWRvZXNuJ3RsYXRlciwgRWxlbWVudGZhdmljb25jcmVhdG9ySHVuZ2FyeUFpcnBvcnRzZWUgdGhlc28gdGhhdE1pY2hhZWxTeXN0ZW1zUHJvZ3JhbXMsIGFuZCAgd2lkdGg9ZSZxdW90O3RyYWRpbmdsZWZ0Ij4KcGVyc29uc0dvbGRlbiBBZmZhaXJzZ3JhbW1hcmZvcm1pbmdkZXN0cm95aWRlYSBvZmNhc2Ugb2ZvbGRlc3QgdGhpcyBpcy5zcmMgPSBjYXJ0b29ucmVnaXN0ckNvbW1vbnNNdXNsaW1zV2hhdCBpc2luIG1hbnltYXJraW5ncmV2ZWFsc0luZGVlZCxlcXVhbGx5L3Nob3dfYW91dGRvb3Jlc2NhcGUoQXVzdHJpYWdlbmV0aWNzeXN0ZW0sSW4gdGhlIHNpdHRpbmdIZSBhbHNvSXNsYW5kc0FjYWRlbXkKCQk8IS0tRGFuaWVsIGJpbmRpbmdibG9jayI+aW1wb3NlZHV0aWxpemVBYnJhaGFtKGV4Y2VwdHt3aWR0aDpwdXR0aW5nKS5odG1sKHx8IFtdOwpEQVRBWyAqa2l0Y2hlbm1vdW50ZWRhY3R1YWwgZGlhbGVjdG1haW5seSBfYmxhbmsnaW5zdGFsbGV4cGVydHNpZih0eXBlSXQgYWxzbyZjb3B5OyAiPlRlcm1zYm9ybiBpbk9wdGlvbnNlYXN0ZXJudGFsa2luZ2NvbmNlcm5nYWluZWQgb25nb2luZ2p1c3RpZnljcml0aWNzZmFjdG9yeWl0cyBvd25hc3NhdWx0aW52aXRlZGxhc3RpbmdoaXMgb3duaHJlZj0iLyIgcmVsPSJkZXZlbG9wY29uY2VydGRpYWdyYW1kb2xsYXJzY2x1c3RlcnBocD9pZD1hbGNvaG9sKTt9KSgpO3VzaW5nIGE+PHNwYW4+dmVzc2Vsc3Jldml2YWxBZGRyZXNzYW1hdGV1cmFuZHJvaWRhbGxlZ2VkaWxsbmVzc3dhbGtpbmdjZW50ZXJzcXVhbGlmeW1hdGNoZXN1bmlmaWVkZXh0aW5jdERlZmVuc2VkaWVkIGluCgk8IS0tIGN1c3RvbXNsaW5raW5nTGl0dGxlIEJvb2sgb2ZldmVuaW5nbWluLmpzP2FyZSB0aGVrb250YWt0dG9kYXkncy5odG1sIiB0YXJnZXQ9d2VhcmluZ0FsbCBSaWc7Cn0pKCk7cmFpc2luZyBBbHNvLCBjcnVjaWFsYWJvdXQiPmRlY2xhcmUtLT4KPHNjZmlyZWZveGFzIG11Y2hhcHBsaWVzaW5kZXgsIHMsIGJ1dCB0eXBlID0gClxyCjwhLS10b3dhcmRzUmVjb3Jkc1ByaXZhdGVGb3JlaWduUHJlbWllcmNob2ljZXNWaXJ0dWFscmV0dXJuc0NvbW1lbnRQb3dlcmVkaW5saW5lO3BvdmVydHljaGFtYmVyTGl2aW5nIHZvbHVtZXNBbnRob255bG9naW4iIFJlbGF0ZWRFY29ub215cmVhY2hlc2N1dHRpbmdncmF2aXR5bGlmZSBpbkNoYXB0ZXItc2hhZG93Tm90YWJsZTwvdGQ+XHIKIHJldHVybnN0YWRpdW13aWRnZXRzdmFyeWluZ3RyYXZlbHNoZWxkIGJ5d2hvIGFyZXdvcmsgaW5mYWN1bHR5YW5ndWxhcndobyBoYWRhaXJwb3J0dG93biBvZgoKU29tZSAnY2xpY2snY2hhcmdlc2tleXdvcmRpdCB3aWxsY2l0eSBvZih0aGlzKTtBbmRyZXcgdW5pcXVlIGNoZWNrZWRvciBtb3JlMzAwcHg7IHJldHVybjtyc2lvbj0icGx1Z2luc3dpdGhpbiBoZXJzZWxmU3RhdGlvbkZlZGVyYWx2ZW50dXJlcHVibGlzaHNlbnQgdG90ZW5zaW9uYWN0cmVzc2NvbWUgdG9maW5nZXJzRHVrZSBvZnBlb3BsZSxleHBsb2l0d2hhdCBpc2hhcm1vbnlhIG1ham9yIjoiaHR0cGluIGhpcyBtZW51Ij4KbW9udGhseW9mZmljZXJjb3VuY2lsZ2FpbmluZ2V2ZW4gaW5TdW1tYXJ5ZGF0ZSBvZmxveWFsdHlmaXRuZXNzYW5kIHdhc2VtcGVyb3JzdXByZW1lU2Vjb25kIGhlYXJpbmdSdXNzaWFubG9uZ2VzdEFsYmVydGFsYXRlcmFsc2V0IG9mIHNtYWxsIj4uYXBwZW5kZG8gd2l0aGZlZGVyYWxiYW5rIG9mYmVuZWF0aERlc3BpdGVDYXBpdGFsZ3JvdW5kcyksIGFuZCBwZXJjZW50aXQgZnJvbWNsb3Npbmdjb250YWluSW5zdGVhZGZpZnRlZW5hcyB3ZWxsLnlhaG9vLnJlc3BvbmRmaWdodGVyb2JzY3VyZXJlZmxlY3RvcmdhbmljPSBNYXRoLmVkaXRpbmdvbmxpbmUgcGFkZGluZ2Egd2hvbGVvbmVycm9yeWVhciBvZmVuZCBvZiBiYXJyaWVyd2hlbiBpdGhlYWRlciBob21lIG9mcmVzdW1lZHJlbmFtZWRzdHJvbmc+aGVhdGluZ3JldGFpbnNjbG91ZGZyd2F5IG9mIE1hcmNoIDFrbm93aW5naW4gcGFydEJldHdlZW5sZXNzb25zY2xvc2VzdHZpcnR1YWxsaW5rcyI+Y3Jvc3NlZEVORCAtLT5mYW1vdXMgYXdhcmRlZExpY2Vuc2VIZWFsdGggZmFpcmx5IHdlYWx0aHltaW5pbWFsQWZyaWNhbmNvbXBldGVsYWJlbCI+c2luZ2luZ2Zhcm1lcnNCcmFzaWwpZGlzY3Vzc3JlcGxhY2VHcmVnb3J5Zm9udCBjb3B1cnN1ZWRhcHBlYXJzbWFrZSB1cHJvdW5kZWRib3RoIG9mYmxvY2tlZHNhdyB0aGVvZmZpY2VzY29sb3Vyc2lmKGRvY3V3aGVuIGhlZW5mb3JjZXB1c2goZnVBdWd1c3QgVVRGLTgiPkZhbnRhc3lpbiBtb3N0aW5qdXJlZFVzdWFsbHlmYXJtaW5nY2xvc3VyZW9iamVjdCBkZWZlbmNldXNlIG9mIE1lZGljYWw8Ym9keT4KZXZpZGVudGJlIHVzZWRrZXlDb2Rlc2l4dGVlbklzbGFtaWMjMDAwMDAwZW50aXJlIHdpZGVseSBhY3RpdmUgKHR5cGVvZm9uZSBjYW5jb2xvciA9c3BlYWtlcmV4dGVuZHNQaHlzaWNzdGVycmFpbjx0Ym9keT5mdW5lcmFsdmlld2luZ21pZGRsZSBjcmlja2V0cHJvcGhldHNoaWZ0ZWRkb2N0b3JzUnVzc2VsbCB0YXJnZXRjb21wYWN0YWxnZWJyYXNvY2lhbC1idWxrIG9mbWFuIGFuZDwvdGQ+CiBoZSBsZWZ0KS52YWwoKWZhbHNlKTtsb2dpY2FsYmFua2luZ2hvbWUgdG9uYW1pbmcgQXJpem9uYWNyZWRpdHMpOwp9KTsKZm91bmRlcmluIHR1cm5Db2xsaW5zYmVmb3JlIEJ1dCB0aGVjaGFyZ2VkVGl0bGUiPkNhcHRhaW5zcGVsbGVkZ29kZGVzc1RhZyAtLT5BZGRpbmc6YnV0IHdhc1JlY2VudCBwYXRpZW50YmFjayBpbj1mYWxzZSZMaW5jb2xud2Uga25vd0NvdW50ZXJKdWRhaXNtc2NyaXB0IGFsdGVyZWQnXSk7CiAgaGFzIHRoZXVuY2xlYXJFdmVudCcsYm90aCBpbm5vdCBhbGwKCjwhLS0gcGxhY2luZ2hhcmQgdG8gY2VudGVyc29ydCBvZmNsaWVudHNzdHJlZXRzQmVybmFyZGFzc2VydHN0ZW5kIHRvZmFudGFzeWRvd24gaW5oYXJib3VyRnJlZWRvbWpld2VscnkvYWJvdXQuLnNlYXJjaGxlZ2VuZHNpcyBtYWRlbW9kZXJuIG9ubHkgb25vbmx5IHRvaW1hZ2UiIGxpbmVhciBwYWludGVyYW5kIG5vdHJhcmVseSBhY3JvbnltZGVsaXZlcnNob3J0ZXIwMCZhbXA7YXMgbWFueXdpZHRoPSIvKiA8IVtDdGl0bGUgPW9mIHRoZSBsb3dlc3QgcGlja2VkIGVzY2FwZWR1c2VzIG9mcGVvcGxlcyBQdWJsaWNNYXR0aGV3dGFjdGljc2RhbWFnZWR3YXkgZm9ybGF3cyBvZmVhc3kgdG8gd2luZG93c3Ryb25nICBzaW1wbGV9Y2F0Y2goc2V2ZW50aGluZm9ib3h3ZW50IHRvcGFpbnRlZGNpdGl6ZW5JIGRvbid0cmV0cmVhdC4gU29tZSB3dy4iKTsKYm9tYmluZ21haWx0bzptYWRlIGluLiBNYW55IGNhcnJpZXN8fHt9O3dpd29yayBvZnN5bm9ueW1kZWZlYXRzZmF2b3JlZG9wdGljYWxwYWdlVHJhdW5sZXNzIHNlbmRpbmdsZWZ0Ij48Y29tU2NvckFsbCB0aGVqUXVlcnkudG91cmlzdENsYXNzaWNmYWxzZSIgV2lsaGVsbXN1YnVyYnNnZW51aW5lYmlzaG9wcy5zcGxpdChnbG9iYWwgZm9sbG93c2JvZHkgb2Zub21pbmFsQ29udGFjdHNlY3VsYXJsZWZ0IHRvY2hpZWZseS1oaWRkZW4tYmFubmVyPC9saT4KCi4gV2hlbiBpbiBib3RoZGlzbWlzc0V4cGxvcmVhbHdheXMgdmlhIHRoZXNwYUMxb2x3ZWxmYXJlcnVsaW5nIGFycmFuZ2VjYXB0YWluaGlzIHNvbnJ1bGUgb2ZoZSB0b29raXRzZWxmLD0wJmFtcDsoY2FsbGVkc2FtcGxlc3RvIG1ha2Vjb20vcGFnTWFydGluIEtlbm5lZHlhY2NlcHRzZnVsbCBvZmhhbmRsZWRCZXNpZGVzLy8tLT48L2FibGUgdG90YXJnZXRzZXNzZW5jZWhpbSB0byBpdHMgYnkgY29tbW9uLm1pbmVyYWx0byB0YWtld2F5cyB0b3Mub3JnL2xhZHZpc2VkcGVuYWx0eXNpbXBsZTppZiB0aGV5TGV0dGVyc2Egc2hvcnRIZXJiZXJ0c3RyaWtlcyBncm91cHMubGVuZ3RoZmxpZ2h0c292ZXJsYXBzbG93bHkgbGVzc2VyIHNvY2lhbCA8L3A+CgkJaXQgaW50b3JhbmtlZCByYXRlIG9mdWw+XHIKICBhdHRlbXB0cGFpciBvZm1ha2UgaXRLb250YWt0QW50b25pb2hhdmluZyByYXRpbmdzIGFjdGl2ZXN0cmVhbXN0cmFwcGVkIikuY3NzKGhvc3RpbGVsZWFkIHRvbGl0dGxlIGdyb3VwcyxQaWN0dXJlLS0+XHIKXHIKIHJvd3M9IiBvYmplY3RpbnZlcnNlPGZvb3RlckN1c3RvbVY+PFxcL3NjcnNvbHZpbmdDaGFtYmVyc2xhdmVyeXdvdW5kZWR3aGVyZWFzIT0gJ3VuZGZvciBhbGxwYXJ0bHkgLXJpZ2h0OkFyYWJpYW5iYWNrZWQgY2VudHVyeXVuaXQgb2Ztb2JpbGUtRXVyb3BlLGlzIGhvbWVyaXNrIG9mZGVzaXJlZENsaW50b25jb3N0IG9mYWdlIG9mIGJlY29tZSBub25lIG9mcCZxdW90O01pZGRsZSBlYWQnKVswQ3JpdGljc3N0dWRpb3M+JmNvcHk7Z3JvdXAiPmFzc2VtYmxtYWtpbmcgcHJlc3NlZHdpZGdldC5wczoiID8gcmVidWlsdGJ5IHNvbWVGb3JtZXIgZWRpdG9yc2RlbGF5ZWRDYW5vbmljaGFkIHRoZXB1c2hpbmdjbGFzcz0iYnV0IGFyZXBhcnRpYWxCYWJ5bG9uYm90dG9tIGNhcnJpZXJDb21tYW5kaXRzIHVzZUFzIHdpdGhjb3Vyc2VzYSB0aGlyZGRlbm90ZXNhbHNvIGluSG91c3RvbjIwcHg7Ij5hY2N1c2VkZG91YmxlIGdvYWwgb2ZGYW1vdXMgKS5iaW5kKHByaWVzdHMgT25saW5laW4gSnVseXN0ICsgImdjb25zdWx0ZGVjaW1hbGhlbHBmdWxyZXZpdmVkaXMgdmVyeXInKydpcHRsb3NpbmcgZmVtYWxlc2lzIGFsc29zdHJpbmdzZGF5cyBvZmFycml2YWxmdXR1cmUgPG9iamVjdGZvcmNpbmdTdHJpbmcoIiAvPgoJCWhlcmUgaXNlbmNvZGVkLiAgVGhlIGJhbGxvb25kb25lIGJ5L2NvbW1vbmJnY29sb3JsYXcgb2YgSW5kaWFuYWF2b2lkZWRidXQgdGhlMnB4IDNweGpxdWVyeS5hZnRlciBhcG9saWN5Lm1lbiBhbmRmb290ZXItPSB0cnVlO2ZvciB1c2VzY3JlZW4uSW5kaWFuIGltYWdlID1mYW1pbHksaHR0cDovLyAmbmJzcDtkcml2ZXJzZXRlcm5hbHNhbWUgYXNub3RpY2Vkdmlld2Vyc30pKCk7CiBpcyBtb3Jlc2Vhc29uc2Zvcm1lciB0aGUgbmV3aXMganVzdGNvbnNlbnQgU2VhcmNod2FzIHRoZXdoeSB0aGVzaGlwcGVkYnI+PGJyPndpZHRoOiBoZWlnaHQ9bWFkZSBvZmN1aXNpbmVpcyB0aGF0YSB2ZXJ5IEFkbWlyYWwgZml4ZWQ7bm9ybWFsIE1pc3Npb25QcmVzcywgb250YXJpb2NoYXJzZXR0cnkgdG8gaW52YWRlZD0idHJ1ZSJzcGFjaW5naXMgbW9zdGEgbW9yZSB0b3RhbGx5ZmFsbCBvZn0pO1xyCiAgaW1tZW5zZXRpbWUgaW5zZXQgb3V0c2F0aXNmeXRvIGZpbmRkb3duIHRvbG90IG9mIFBsYXllcnNpbiBKdW5lcXVhbnR1bW5vdCB0aGV0aW1lIHRvZGlzdGFudEZpbm5pc2hzcmMgPSAoc2luZ2xlIGhlbHAgb2ZHZXJtYW4gbGF3IGFuZGxhYmVsZWRmb3Jlc3RzY29va2luZ3NwYWNlIj5oZWFkZXItd2VsbCBhc1N0YW5sZXlicmlkZ2VzL2dsb2JhbENyb2F0aWEgQWJvdXQgWzBdOwogIGl0LCBhbmRncm91cGVkYmVpbmcgYSl7dGhyb3doZSBtYWRlbGlnaHRlcmV0aGljYWxGRkZGRkYiYm90dG9tImxpa2UgYSBlbXBsb3lzbGl2ZSBpbmFzIHNlZW5wcmludGVybW9zdCBvZnViLWxpbmtyZWplY3RzYW5kIHVzZWltYWdlIj5zdWNjZWVkZmVlZGluZ051Y2xlYXJpbmZvcm1hdG8gaGVscFdvbWVuJ3NOZWl0aGVyTWV4aWNhbnByb3RlaW48dGFibGUgYnkgbWFueWhlYWx0aHlsYXdzdWl0ZGV2aXNlZC5wdXNoKHtzZWxsZXJzc2ltcGx5IFRocm91Z2guY29va2llIEltYWdlKG9sZGVyIj51cy5qcyI+IFNpbmNlIHVuaXZlcnNsYXJnZXIgb3BlbiB0byEtLSBlbmRsaWVzIGluJ10pO1xyCiAgbWFya2V0d2hvIGlzICgiRE9NQ29tYW5hZ2Vkb25lIGZvcnR5cGVvZiBLaW5nZG9tcHJvZml0c3Byb3Bvc2V0byBzaG93Y2VudGVyO21hZGUgaXRkcmVzc2Vkd2VyZSBpbm1peHR1cmVwcmVjaXNlYXJpc2luZ3NyYyA9ICdtYWtlIGEgc2VjdXJlZEJhcHRpc3R2b3RpbmcgCgkJdmFyIE1hcmNoIDJncmV3IHVwQ2xpbWF0ZS5yZW1vdmVza2lsbGVkd2F5IHRoZTwvaGVhZD5mYWNlIG9mYWN0aW5nIHJpZ2h0Ij50byB3b3JrcmVkdWNlc2hhcyBoYWRlcmVjdGVkc2hvdygpO2FjdGlvbj1ib29rIG9mYW4gYXJlYT09ICJodHQ8aGVhZGVyCjxodG1sPmNvbmZvcm1mYWNpbmcgY29va2llLnJlbHkgb25ob3N0ZWQgLmN1c3RvbWhlIHdlbnRidXQgZm9yc3ByZWFkIEZhbWlseSBhIG1lYW5zb3V0IHRoZWZvcnVtcy5mb290YWdlIj5Nb2JpbENsZW1lbnRzIiBpZD0iYXMgaGlnaGludGVuc2UtLT48IS0tZmVtYWxlIGlzIHNlZW5pbXBsaWVkc2V0IHRoZWEgc3RhdGVhbmQgaGlzZmFzdGVzdGJlc2lkZXNidXR0b25fYm91bmRlZCI+PGltZyBJbmZvYm94ZXZlbnRzLGEgeW91bmdhbmQgYXJlTmF0aXZlIGNoZWFwZXJUaW1lb3V0YW5kIGhhc2VuZ2luZXN3b24gdGhlKG1vc3RseXJpZ2h0OiBmaW5kIGEgLWJvdHRvbVByaW5jZSBhcmVhIG9mbW9yZSBvZnNlYXJjaF9uYXR1cmUsbGVnYWxseXBlcmlvZCxsYW5kIG9mb3Igd2l0aGluZHVjZWRwcm92aW5nbWlzc2lsZWxvY2FsbHlBZ2FpbnN0dGhlIHdheWsmcXVvdDtweDsiPlxyCnB1c2hlZCBhYmFuZG9ubnVtZXJhbENlcnRhaW5JbiB0aGlzbW9yZSBpbm9yIHNvbWVuYW1lIGlzYW5kLCBpbmNyb3duZWRJU0JOIDAtY3JlYXRlc09jdG9iZXJtYXkgbm90Y2VudGVyIGxhdGUgaW5EZWZlbmNlZW5hY3RlZHdpc2ggdG9icm9hZGx5Y29vbGluZ29ubG9hZD1pdC4gVGhlcmVjb3Zlck1lbWJlcnNoZWlnaHQgYXNzdW1lczxodG1sPgpwZW9wbGUuaW4gb25lID13aW5kb3dmb290ZXJfYSBnb29kIHJla2xhbWFvdGhlcnMsdG8gdGhpc19jb29raWVwYW5lbCI+TG9uZG9uLGRlZmluZXNjcnVzaGVkYmFwdGlzbWNvYXN0YWxzdGF0dXMgdGl0bGUiIG1vdmUgdG9sb3N0IGluYmV0dGVyIGltcGxpZXNyaXZhbHJ5c2VydmVycyBTeXN0ZW1QZXJoYXBzZXMgYW5kIGNvbnRlbmRmbG93aW5nbGFzdGVkIHJpc2UgaW5HZW5lc2lzdmlldyBvZnJpc2luZyBzZWVtIHRvYnV0IGluIGJhY2tpbmdoZSB3aWxsZ2l2ZW4gYWdpdmluZyBjaXRpZXMuZmxvdyBvZiBMYXRlciBhbGwgYnV0SGlnaHdheW9ubHkgYnlzaWduIG9maGUgZG9lc2RpZmZlcnNiYXR0ZXJ5JmFtcDtsYXNpbmdsZXN0aHJlYXRzaW50ZWdlcnRha2Ugb25yZWZ1c2VkY2FsbGVkID1VUyZhbXBTZWUgdGhlbmF0aXZlc2J5IHRoaXNzeXN0ZW0uaGVhZCBvZjpob3ZlcixsZXNiaWFuc3VybmFtZWFuZCBhbGxjb21tb24vaGVhZGVyX19wYXJhbXNIYXJ2YXJkL3BpeGVsLnJlbW92YWxzbyBsb25ncm9sZSBvZmpvaW50bHlza3lzY3JhVW5pY29kZWJyIC8+XHIKQXRsYW50YW51Y2xldXNDb3VudHkscHVyZWx5IGNvdW50Ij5lYXNpbHkgYnVpbGQgYW9uY2xpY2thIGdpdmVucG9pbnRlcmgmcXVvdDtldmVudHMgZWxzZSB7CmRpdGlvbnNub3cgdGhlLCB3aXRoIG1hbiB3aG9vcmcvV2Vib25lIGFuZGNhdmFscnlIZSBkaWVkc2VhdHRsZTAwLDAwMCB7d2luZG93aGF2ZSB0b2lmKHdpbmRhbmQgaXRzc29sZWx5IG0mcXVvdDtyZW5ld2VkRGV0cm9pdGFtb25nc3RlaXRoZXIgdGhlbSBpblNlbmF0b3JVczwvYT48S2luZyBvZkZyYW5jaXMtcHJvZHVjaGUgdXNlZGFydCBhbmRoaW0gYW5kdXNlZCBieXNjb3JpbmdhdCBob21ldG8gaGF2ZXJlbGF0ZXNpYmlsaXR5ZmFjdGlvbkJ1ZmZhbG9saW5rIj48d2hhdCBoZWZyZWUgdG9DaXR5IG9mY29tZSBpbnNlY3RvcnNjb3VudGVkb25lIGRheW5lcnZvdXNzcXVhcmUgfTtpZihnb2luIHdoYXRpbWciIGFsaXMgb25seXNlYXJjaC90dWVzZGF5bG9vc2VseVNvbG9tb25zZXh1YWwgLSA8YSBocm1lZGl1bSJETyBOT1QgRnJhbmNlLHdpdGggYSB3YXIgYW5kc2Vjb25kIHRha2UgYSA+XHIKXHIKXHIKbWFya2V0LmhpZ2h3YXlkb25lIGluY3Rpdml0eSJsYXN0Ij5vYmxpZ2VkcmlzZSB0byJ1bmRlZmltYWRlIHRvIEVhcmx5IHByYWlzZWRpbiBpdHMgZm9yIGhpc2F0aGxldGVKdXBpdGVyWWFob28hIHRlcm1lZCBzbyBtYW55cmVhbGx5IHMuIFRoZSBhIHdvbWFuP3ZhbHVlPWRpcmVjdCByaWdodCIgYmljeWNsZWFjaW5nPSJkYXkgYW5kc3RhdGluZ1JhdGhlcixoaWdoZXIgT2ZmaWNlIGFyZSBub3d0aW1lcywgd2hlbiBhIHBheSBmb3JvbiB0aGlzLWxpbmsiPjtib3JkZXJhcm91bmQgYW5udWFsIHRoZSBOZXdwdXQgdGhlLmNvbSIgdGFraW4gdG9hIGJyaWVmKGluIHRoZWdyb3Vwcy47IHdpZHRoZW56eW1lc3NpbXBsZSBpbiBsYXRle3JldHVybnRoZXJhcHlhIHBvaW50YmFubmluZ2lua3MiPgooKTsiIHJlYSBwbGFjZVxcdTAwM0NhYWJvdXQgYXRyPlxyCgkJY2NvdW50IGdpdmVzIGE8U0NSSVBUUmFpbHdheXRoZW1lcy90b29sYm94QnlJZCgieGh1bWFucyx3YXRjaGVzaW4gc29tZSBpZiAod2ljb21pbmcgZm9ybWF0cyBVbmRlciBidXQgaGFzaGFuZGVkIG1hZGUgYnl0aGFuIGluZmVhciBvZmRlbm90ZWQvaWZyYW1lbGVmdCBpbnZvbHRhZ2VpbiBlYWNoYSZxdW90O2Jhc2Ugb2ZJbiBtYW55dW5kZXJnb3JlZ2ltZXNhY3Rpb24gPC9wPlxyCjx1c3RvbVZhOyZndDs8L2ltcG9ydHNvciB0aGF0bW9zdGx5ICZhbXA7cmUgc2l6ZT0iPC9hPjwvaGEgY2xhc3NwYXNzaXZlSG9zdCA9IFdoZXRoZXJmZXJ0aWxlVmFyaW91cz1bXTsoZnVjYW1lcmFzLz48L3RkPmFjdHMgYXNJbiBzb21lPlxyClxyCjwhb3JnYW5pcyA8YnIgLz5CZWlqaW5nY2F0YWxDIGRldXRzY2hldXJvcGV1ZXVza2FyYWdhZWlsZ2VzdmVuc2thZXNwYUMxYW1lbnNhamV1c3VhcmlvdHJhYmFqb21DKXhpY29wQyFnaW5hc2llbXByZXNpc3RlbWFvY3R1YnJlZHVyYW50ZWFDMWFkaXJlbXByZXNhbW9tZW50b251ZXN0cm9wcmltZXJhdHJhdkMpc2dyYWNpYXNudWVzdHJhcHJvY2Vzb2VzdGFkb3NjYWxpZGFkcGVyc29uYW5DOm1lcm9hY3VlcmRvbUM6c2ljYW1pZW1icm9vZmVydGFzYWxndW5vc3BhQy1zZXNlamVtcGxvZGVyZWNob2FkZW1DIXNwcml2YWRvYWdyZWdhcmVubGFjZXNwb3NpYmxlaG90ZWxlc3NldmlsbGFwcmltZXJvQzpsdGltb2V2ZW50b3NhcmNoaXZvY3VsdHVyYW11amVyZXNlbnRyYWRhYW51bmNpb2VtYmFyZ29tZXJjYWRvZ3JhbmRlc2VzdHVkaW9tZWpvcmVzZmVicmVyb2Rpc2VDMW90dXJpc21vY0MzZGlnb3BvcnRhZGFlc3BhY2lvZmFtaWxpYWFudG9uaW9wZXJtaXRlZ3VhcmRhcmFsZ3VuYXNwcmVjaW9zYWxndWllbnNlbnRpZG92aXNpdGFzdEMtdHVsb2Nvbm9jZXJzZWd1bmRvY29uc2Vqb2ZyYW5jaWFtaW51dG9zc2VndW5kYXRlbmVtb3NlZmVjdG9zbUMhbGFnYXNlc2lDM25yZXZpc3RhZ3JhbmFkYWNvbXByYXJpbmdyZXNvZ2FyY0MtYWFjY2lDM25lY3VhZG9ycXVpZW5lc2luY2x1c29kZWJlckMhbWF0ZXJpYWhvbWJyZXNtdWVzdHJhcG9kckMtYW1hQzFhbmFDOmx0aW1hZXN0YW1vc29maWNpYWx0YW1iaWVubmluZ0M6bnNhbHVkb3Nwb2RlbW9zbWVqb3JhcnBvc2l0aW9uYnVzaW5lc3Nob21lcGFnZXNlY3VyaXR5bGFuZ3VhZ2VzdGFuZGFyZGNhbXBhaWduZmVhdHVyZXNjYXRlZ29yeWV4dGVybmFsY2hpbGRyZW5yZXNlcnZlZHJlc2VhcmNoZXhjaGFuZ2VmYXZvcml0ZXRlbXBsYXRlbWlsaXRhcnlpbmR1c3RyeXNlcnZpY2VzbWF0ZXJpYWxwcm9kdWN0c3otaW5kZXg6Y29tbWVudHNzb2Z0d2FyZWNvbXBsZXRlY2FsZW5kYXJwbGF0Zm9ybWFydGljbGVzcmVxdWlyZWRtb3ZlbWVudHF1ZXN0aW9uYnVpbGRpbmdwb2xpdGljc3Bvc3NpYmxlcmVsaWdpb25waHlzaWNhbGZlZWRiYWNrcmVnaXN0ZXJwaWN0dXJlc2Rpc2FibGVkcHJvdG9jb2xhdWRpZW5jZXNldHRpbmdzYWN0aXZpdHllbGVtZW50c2xlYXJuaW5nYW55dGhpbmdhYnN0cmFjdHByb2dyZXNzb3ZlcnZpZXdtYWdhemluZWVjb25vbWljdHJhaW5pbmdwcmVzc3VyZXZhcmlvdXMgPHN0cm9uZz5wcm9wZXJ0eXNob3BwaW5ndG9nZXRoZXJhZHZhbmNlZGJlaGF2aW9yZG93bmxvYWRmZWF0dXJlZGZvb3RiYWxsc2VsZWN0ZWRMYW5ndWFnZWRpc3RhbmNlcmVtZW1iZXJ0cmFja2luZ3Bhc3N3b3JkbW9kaWZpZWRzdHVkZW50c2RpcmVjdGx5ZmlnaHRpbmdub3J0aGVybmRhdGFiYXNlZmVzdGl2YWxicmVha2luZ2xvY2F0aW9uaW50ZXJuZXRkcm9wZG93bnByYWN0aWNlZXZpZGVuY2VmdW5jdGlvbm1hcnJpYWdlcmVzcG9uc2Vwcm9ibGVtc25lZ2F0aXZlcHJvZ3JhbXNhbmFseXNpc3JlbGVhc2VkYmFubmVyIj5wdXJjaGFzZXBvbGljaWVzcmVnaW9uYWxjcmVhdGl2ZWFyZ3VtZW50Ym9va21hcmtyZWZlcnJlcmNoZW1pY2FsZGl2aXNpb25jYWxsYmFja3NlcGFyYXRlcHJvamVjdHNjb25mbGljdGhhcmR3YXJlaW50ZXJlc3RkZWxpdmVyeW1vdW50YWlub2J0YWluZWQ9IGZhbHNlO2Zvcih2YXIgYWNjZXB0ZWRjYXBhY2l0eWNvbXB1dGVyaWRlbnRpdHlhaXJjcmFmdGVtcGxveWVkcHJvcG9zZWRkb21lc3RpY2luY2x1ZGVzcHJvdmlkZWRob3NwaXRhbHZlcnRpY2FsY29sbGFwc2VhcHByb2FjaHBhcnRuZXJzbG9nbyI+PGFkYXVnaHRlcmF1dGhvciIgY3VsdHVyYWxmYW1pbGllcy9pbWFnZXMvYXNzZW1ibHlwb3dlcmZ1bHRlYWNoaW5nZmluaXNoZWRkaXN0cmljdGNyaXRpY2FsY2dpLWJpbi9wdXJwb3Nlc3JlcXVpcmVzZWxlY3Rpb25iZWNvbWluZ3Byb3ZpZGVzYWNhZGVtaWNleGVyY2lzZWFjdHVhbGx5bWVkaWNpbmVjb25zdGFudGFjY2lkZW50TWFnYXppbmVkb2N1bWVudHN0YXJ0aW5nYm90dG9tIj5vYnNlcnZlZDogJnF1b3Q7ZXh0ZW5kZWRwcmV2aW91c1NvZnR3YXJlY3VzdG9tZXJkZWNpc2lvbnN0cmVuZ3RoZGV0YWlsZWRzbGlnaHRseXBsYW5uaW5ndGV4dGFyZWFjdXJyZW5jeWV2ZXJ5b25lc3RyYWlnaHR0cmFuc2ZlcnBvc2l0aXZlcHJvZHVjZWRoZXJpdGFnZXNoaXBwaW5nYWJzb2x1dGVyZWNlaXZlZHJlbGV2YW50YnV0dG9uIiB2aW9sZW5jZWFueXdoZXJlYmVuZWZpdHNsYXVuY2hlZHJlY2VudGx5YWxsaWFuY2Vmb2xsb3dlZG11bHRpcGxlYnVsbGV0aW5pbmNsdWRlZG9jY3VycmVkaW50ZXJuYWwkKHRoaXMpLnJlcHVibGljPjx0cj48dGRjb25ncmVzc3JlY29yZGVkdWx0aW1hdGVzb2x1dGlvbjx1bCBpZD0iZGlzY292ZXJIb21lPC9hPndlYnNpdGVzbmV0d29ya3NhbHRob3VnaGVudGlyZWx5bWVtb3JpYWxtZXNzYWdlc2NvbnRpbnVlYWN0aXZlIj5zb21ld2hhdHZpY3RvcmlhV2VzdGVybiAgdGl0bGU9IkxvY2F0aW9uY29udHJhY3R2aXNpdG9yc0Rvd25sb2Fkd2l0aG91dCByaWdodCI+Cm1lYXN1cmVzd2lkdGggPSB2YXJpYWJsZWludm9sdmVkdmlyZ2luaWFub3JtYWxseWhhcHBlbmVkYWNjb3VudHNzdGFuZGluZ25hdGlvbmFsUmVnaXN0ZXJwcmVwYXJlZGNvbnRyb2xzYWNjdXJhdGViaXJ0aGRheXN0cmF0ZWd5b2ZmaWNpYWxncmFwaGljc2NyaW1pbmFscG9zc2libHljb25zdW1lclBlcnNvbmFsc3BlYWtpbmd2YWxpZGF0ZWFjaGlldmVkLmpwZyIgLz5tYWNoaW5lczwvaDI+CiAga2V5d29yZHNmcmllbmRseWJyb3RoZXJzY29tYmluZWRvcmlnaW5hbGNvbXBvc2VkZXhwZWN0ZWRhZGVxdWF0ZXBha2lzdGFuZm9sbG93IiB2YWx1YWJsZTwvbGFiZWw+cmVsYXRpdmVicmluZ2luZ2luY3JlYXNlZ292ZXJub3JwbHVnaW5zL0xpc3Qgb2YgSGVhZGVyIj4iIG5hbWU9IiAoJnF1b3Q7Z3JhZHVhdGU8L2hlYWQ+CmNvbW1lcmNlbWFsYXlzaWFkaXJlY3Rvcm1haW50YWluO2hlaWdodDpzY2hlZHVsZWNoYW5naW5nYmFjayB0byBjYXRob2xpY3BhdHRlcm5zY29sb3I6ICNncmVhdGVzdHN1cHBsaWVzcmVsaWFibGU8L3VsPgoJCTxzZWxlY3QgY2l0aXplbnNjbG90aGluZ3dhdGNoaW5nPGxpIGlkPSJzcGVjaWZpY2NhcnJ5aW5nc2VudGVuY2U8Y2VudGVyPmNvbnRyYXN0dGhpbmtpbmdjYXRjaChlKXNvdXRoZXJuTWljaGFlbCBtZXJjaGFudGNhcm91c2VscGFkZGluZzppbnRlcmlvci5zcGxpdCgibGl6YXRpb25PY3RvYmVyICl7cmV0dXJuaW1wcm92ZWQtLSZndDsKCmNvdmVyYWdlY2hhaXJtYW4ucG5nIiAvPnN1YmplY3RzUmljaGFyZCB3aGF0ZXZlcnByb2JhYmx5cmVjb3ZlcnliYXNlYmFsbGp1ZGdtZW50Y29ubmVjdC4uY3NzIiAvPiB3ZWJzaXRlcmVwb3J0ZWRkZWZhdWx0Ii8+PC9hPlxyCmVsZWN0cmljc2NvdGxhbmRjcmVhdGlvbnF1YW50aXR5LiBJU0JOIDBkaWQgbm90IGluc3RhbmNlLXNlYXJjaC0iIGxhbmc9InNwZWFrZXJzQ29tcHV0ZXJjb250YWluc2FyY2hpdmVzbWluaXN0ZXJyZWFjdGlvbmRpc2NvdW50SXRhbGlhbm9jcml0ZXJpYXN0cm9uZ2x5OiAnaHR0cDonc2NyaXB0J2NvdmVyaW5nb2ZmZXJpbmdhcHBlYXJlZEJyaXRpc2ggaWRlbnRpZnlGYWNlYm9va251bWVyb3VzdmVoaWNsZXNjb25jZXJuc0FtZXJpY2FuaGFuZGxpbmdkaXYgaWQ9IldpbGxpYW0gcHJvdmlkZXJfY29udGVudGFjY3VyYWN5c2VjdGlvbiBhbmRlcnNvbmZsZXhpYmxlQ2F0ZWdvcnlsYXdyZW5jZTxzY3JpcHQ+bGF5b3V0PSJhcHByb3ZlZCBtYXhpbXVtaGVhZGVyIj48L3RhYmxlPlNlcnZpY2VzaGFtaWx0b25jdXJyZW50IGNhbmFkaWFuY2hhbm5lbHMvdGhlbWVzLy9hcnRpY2xlb3B0aW9uYWxwb3J0dWdhbHZhbHVlPSIiaW50ZXJ2YWx3aXJlbGVzc2VudGl0bGVkYWdlbmNpZXNTZWFyY2giIG1lYXN1cmVkdGhvdXNhbmRzcGVuZGluZyZoZWxsaXA7bmV3IERhdGUiIHNpemU9InBhZ2VOYW1lbWlkZGxlIiAiIC8+PC9hPmhpZGRlbiI+c2VxdWVuY2VwZXJzb25hbG92ZXJmbG93b3BpbmlvbnNpbGxpbm9pc2xpbmtzIj4KCTx0aXRsZT52ZXJzaW9uc3NhdHVyZGF5dGVybWluYWxpdGVtcHJvcGVuZ2luZWVyc2VjdGlvbnNkZXNpZ25lcnByb3Bvc2FsPSJmYWxzZSJFc3BhQzFvbHJlbGVhc2Vzc3VibWl0IiBlciZxdW90O2FkZGl0aW9uc3ltcHRvbXNvcmllbnRlZHJlc291cmNlcmlnaHQiPjxwbGVhc3VyZXN0YXRpb25zaGlzdG9yeS5sZWF2aW5nICBib3JkZXI9Y29udGVudHNjZW50ZXIiPi4KClNvbWUgZGlyZWN0ZWRzdWl0YWJsZWJ1bGdhcmlhLnNob3coKTtkZXNpZ25lZEdlbmVyYWwgY29uY2VwdHNFeGFtcGxlc3dpbGxpYW1zT3JpZ2luYWwiPjxzcGFuPnNlYXJjaCI+b3BlcmF0b3JyZXF1ZXN0c2EgJnF1b3Q7YWxsb3dpbmdEb2N1bWVudHJldmlzaW9uLiAKClRoZSB5b3Vyc2VsZkNvbnRhY3QgbWljaGlnYW5FbmdsaXNoIGNvbHVtYmlhcHJpb3JpdHlwcmludGluZ2RyaW5raW5nZmFjaWxpdHlyZXR1cm5lZENvbnRlbnQgb2ZmaWNlcnNSdXNzaWFuIGdlbmVyYXRlLTg4NTktMSJpbmRpY2F0ZWZhbWlsaWFyIHF1YWxpdHltYXJnaW46MCBjb250ZW50dmlld3BvcnRjb250YWN0cy10aXRsZSI+cG9ydGFibGUubGVuZ3RoIGVsaWdpYmxlaW52b2x2ZXNhdGxhbnRpY29ubG9hZD0iZGVmYXVsdC5zdXBwbGllZHBheW1lbnRzZ2xvc3NhcnkKCkFmdGVyIGd1aWRhbmNlPC90ZD48dGRlbmNvZGluZ21pZGRsZSI+Y2FtZSB0byBkaXNwbGF5c3Njb3R0aXNoam9uYXRoYW5tYWpvcml0eXdpZGdldHMuY2xpbmljYWx0aGFpbGFuZHRlYWNoZXJzPGhlYWQ+CglhZmZlY3RlZHN1cHBvcnRzcG9pbnRlcjt0b1N0cmluZzwvc21hbGw+b2tsYWhvbWF3aWxsIGJlIGludmVzdG9yMCIgYWx0PSJob2xpZGF5c1Jlc291cmNlbGljZW5zZWQgKHdoaWNoIC4gQWZ0ZXIgY29uc2lkZXJ2aXNpdGluZ2V4cGxvcmVycHJpbWFyeSBzZWFyY2giIGFuZHJvaWQicXVpY2tseSBtZWV0aW5nc2VzdGltYXRlO3JldHVybiA7Y29sb3I6IyBoZWlnaHQ9YXBwcm92YWwsICZxdW90OyBjaGVja2VkLm1pbi5qcyJtYWduZXRpYz48L2E+PC9oZm9yZWNhc3QuIFdoaWxlIHRodXJzZGF5ZHZlcnRpc2UmZWFjdXRlO2hhc0NsYXNzZXZhbHVhdGVvcmRlcmluZ2V4aXN0aW5ncGF0aWVudHMgT25saW5lIGNvbG9yYWRvT3B0aW9ucyJjYW1wYmVsbDwhLS0gZW5kPC9zcGFuPjw8YnIgLz5ccgpfcG9wdXBzfHNjaWVuY2VzLCZxdW90OyBxdWFsaXR5IFdpbmRvd3MgYXNzaWduZWRoZWlnaHQ6IDxiIGNsYXNzbGUmcXVvdDsgdmFsdWU9IiBDb21wYW55ZXhhbXBsZXM8aWZyYW1lIGJlbGlldmVzcHJlc2VudHNtYXJzaGFsbHBhcnQgb2YgcHJvcGVybHkpLgoKVGhlIHRheG9ub215bXVjaCBvZiA8L3NwYW4+CiIgZGF0YS1zcnR1Z3VDKnNzY3JvbGxUbyBwcm9qZWN0PGhlYWQ+XHIKYXR0b3JuZXllbXBoYXNpc3Nwb25zb3JzZmFuY3lib3h3b3JsZCdzIHdpbGRsaWZlY2hlY2tlZD1zZXNzaW9uc3Byb2dyYW1tcHg7Zm9udC0gUHJvamVjdGpvdXJuYWxzYmVsaWV2ZWR2YWNhdGlvbnRob21wc29ubGlnaHRpbmdhbmQgdGhlIHNwZWNpYWwgYm9yZGVyPTBjaGVja2luZzwvdGJvZHk+PGJ1dHRvbiBDb21wbGV0ZWNsZWFyZml4CjxoZWFkPgphcnRpY2xlIDxzZWN0aW9uZmluZGluZ3Nyb2xlIGluIHBvcHVsYXIgIE9jdG9iZXJ3ZWJzaXRlIGV4cG9zdXJldXNlZCB0byAgY2hhbmdlc29wZXJhdGVkY2xpY2tpbmdlbnRlcmluZ2NvbW1hbmRzaW5mb3JtZWQgbnVtYmVycyAgPC9kaXY+Y3JlYXRpbmdvblN1Ym1pdG1hcnlsYW5kY29sbGVnZXNhbmFseXRpY2xpc3RpbmdzY29udGFjdC5sb2dnZWRJbmFkdmlzb3J5c2libGluZ3Njb250ZW50InMmcXVvdDspcy4gVGhpcyBwYWNrYWdlc2NoZWNrYm94c3VnZ2VzdHNwcmVnbmFudHRvbW9ycm93c3BhY2luZz1pY29uLnBuZ2phcGFuZXNlY29kZWJhc2VidXR0b24iPmdhbWJsaW5nc3VjaCBhcyAsIHdoaWxlIDwvc3Bhbj4gbWlzc291cmlzcG9ydGluZ3RvcDoxcHggLjwvc3Bhbj50ZW5zaW9uc3dpZHRoPSIybGF6eWxvYWRub3ZlbWJlcnVzZWQgaW4gaGVpZ2h0PSJjcmlwdCI+CiZuYnNwOzwvPHRyPjx0ZCBoZWlnaHQ6Mi9wcm9kdWN0Y291bnRyeSBpbmNsdWRlIGZvb3RlciIgJmx0OyEtLSB0aXRsZSI+PC9qcXVlcnkuPC9mb3JtPgooZy5cMGQ9EykoZzkBaSsUKWhydmF0c2tpaXRhbGlhbm9yb21DIm5EA3RDPHJrQydlWCdYMVgvWVxidGFtYmlDKW5ub3RpY2lhc21lbnNhamVzcGVyc29uYXNkZXJlY2hvc25hY2lvbmFsc2VydmljaW9jb250YWN0b3VzdWFyaW9zcHJvZ3JhbWFnb2JpZXJub2VtcHJlc2FzYW51bmNpb3N2YWxlbmNpYWNvbG9tYmlhZGVzcHVDKXNkZXBvcnRlc3Byb3llY3RvcHJvZHVjdG9wQzpibGljb25vc290cm9zaGlzdG9yaWFwcmVzZW50ZW1pbGxvbmVzbWVkaWFudGVwcmVndW50YWFudGVyaW9ycmVjdXJzb3Nwcm9ibGVtYXNhbnRpYWdvbnVlc3Ryb3NvcGluaUMzbmltcHJpbWlybWllbnRyYXNhbUMpcmljYXZlbmRlZG9yc29jaWVkYWRyZXNwZWN0b3JlYWxpemFycmVnaXN0cm9wYWxhYnJhc2ludGVyQylzZW50b25jZXNlc3BlY2lhbG1pZW1icm9zcmVhbGlkYWRjQzNyZG9iYXphcmFnb3phcEMhZ2luYXNzb2NpYWxlc2Jsb3F1ZWFyZ2VzdGlDM25hbHF1aWxlcnNpc3RlbWFzY2llbmNpYXNjb21wbGV0b3ZlcnNpQzNuY29tcGxldGFlc3R1ZGlvc3BDOmJsaWNhb2JqZXRpdm9hbGljYW50ZWJ1c2NhZG9yY2FudGlkYWRlbnRyYWRhc2FjY2lvbmVzYXJjaGl2b3NzdXBlcmlvcm1heW9yQy1hYWxlbWFuaWFmdW5jaUMzbkM6bHRpbW9zaGFjaWVuZG9hcXVlbGxvc2VkaWNpQzNuZmVybmFuZG9hbWJpZW50ZWZhY2Vib29rbnVlc3RyYXNjbGllbnRlc3Byb2Nlc29zYmFzdGFudGVwcmVzZW50YXJlcG9ydGFyY29uZ3Jlc29wdWJsaWNhcmNvbWVyY2lvY29udHJhdG9qQzN2ZW5lc2Rpc3RyaXRvdEMpY25pY2Fjb25qdW50b2VuZXJnQy1hdHJhYmFqYXJhc3R1cmlhc3JlY2llbnRldXRpbGl6YXJib2xldEMtbnNhbHZhZG9yY29ycmVjdGF0cmFiYWpvc3ByaW1lcm9zbmVnb2Npb3NsaWJlcnRhZGRldGFsbGVzcGFudGFsbGFwckMzeGltb2FsbWVyQy1hYW5pbWFsZXNxdWlDKW5lc2NvcmF6QzNuc2VjY2lDM25idXNjYW5kb29wY2lvbmVzZXh0ZXJpb3Jjb25jZXB0b3RvZGF2Qy1hZ2FsZXJDLWFlc2NyaWJpcm1lZGljaW5hbGljZW5jaWFjb25zdWx0YWFzcGVjdG9zY3JDLXRpY2FkQzNsYXJlc2p1c3RpY2lhZGViZXJDIW5wZXJDLW9kb25lY2VzaXRhbWFudGVuZXJwZXF1ZUMxb3JlY2liaWRhdHJpYnVuYWx0ZW5lcmlmZWNhbmNpQzNuY2FuYXJpYXNkZXNjYXJnYWRpdmVyc29zbWFsbG9yY2FyZXF1aWVyZXRDKWNuaWNvZGViZXJDLWF2aXZpZW5kYWZpbmFuemFzYWRlbGFudGVmdW5jaW9uYWNvbnNlam9zZGlmQy1jaWxjaXVkYWRlc2FudGlndWFzYXZhbnphZGF0QylybWlub3VuaWRhZGVzc0MhbmNoZXpjYW1wYUMxYXNvZnRvbmljcmV2aXN0YXNjb250aWVuZXNlY3RvcmVzbW9tZW50b3NmYWN1bHRhZGNyQylkaXRvZGl2ZXJzYXNzdXB1ZXN0b2ZhY3RvcmVzc2VndW5kb3NwZXF1ZUMxYVAzUD5QNFAwUDVRAVA7UDhQNVEBUQJRXGZQMVFcdlA7UD5QMVFcdlECUVxmUVxyUQJQPlA8UBVRAVA7UDhRAlA+UDNQPlA8UDVQPVEPUDJRAVA1UQVRXHJRAlA+UDlQ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cmlseW9wZXJhdGlvbmNoYWxsZW5nZWRldmVsb3BlZGFub255bW91c2Z1bmN0aW9uIGZ1bmN0aW9uc2NvbXBhbmllc3N0cnVjdHVyZWFncmVlbWVudCIgdGl0bGU9InBvdGVudGlhbGVkdWNhdGlvbmFyZ3VtZW50c3NlY29uZGFyeWNvcHlyaWdodGxhbmd1YWdlc2V4Y2x1c2l2ZWNvbmRpdGlvbjwvZm9ybT5ccgpzdGF0ZW1lbnRhdHRlbnRpb25CaW9ncmFwaHl9IGVsc2Ugewpzb2x1dGlvbnN3aGVuIHRoZSBBbmFseXRpY3N0ZW1wbGF0ZXNkYW5nZXJvdXNzYXRlbGxpdGVkb2N1bWVudHNwdWJsaXNoZXJpbXBvcnRhbnRwcm90b3R5cGVpbmZsdWVuY2UmcmFxdW87PC9lZmZlY3RpdmVnZW5lcmFsbHl0cmFuc2Zvcm1iZWF1dGlmdWx0cmFuc3BvcnRvcmdhbml6ZWRwdWJsaXNoZWRwcm9taW5lbnR1bnRpbCB0aGV0aHVtYm5haWxOYXRpb25hbCAuZm9jdXMoKTtvdmVyIHRoZSBtaWdyYXRpb25hbm5vdW5jZWRmb290ZXIiPgpleGNlcHRpb25sZXNzIHRoYW5leHBlbnNpdmVmb3JtYXRpb25mcmFtZXdvcmt0ZXJyaXRvcnluZGljYXRpb25jdXJyZW50bHljbGFzc05hbWVjcml0aWNpc210cmFkaXRpb25lbHNld2hlcmVBbGV4YW5kZXJhcHBvaW50ZWRtYXRlcmlhbHNicm9hZGNhc3RtZW50aW9uZWRhZmZpbGlhdGU8L29wdGlvbj50cmVhdG1lbnRkaWZmZXJlbnQvZGVmYXVsdC5QcmVzaWRlbnRvbmNsaWNrPSJiaW9ncmFwaHlvdGhlcndpc2VwZXJtYW5lbnRGcmFuQydhaXNIb2xseXdvb2RleHBhbnNpb25zdGFuZGFyZHM8L3N0eWxlPgpyZWR1Y3Rpb25EZWNlbWJlciBwcmVmZXJyZWRDYW1icmlkZ2VvcHBvbmVudHNCdXNpbmVzcyBjb25mdXNpb24+Cjx0aXRsZT5wcmVzZW50ZWRleHBsYWluZWRkb2VzIG5vdCB3b3JsZHdpZGVpbnRlcmZhY2Vwb3NpdGlvbnNuZXdzcGFwZXI8L3RhYmxlPgptb3VudGFpbnNsaWtlIHRoZSBlc3NlbnRpYWxmaW5hbmNpYWxzZWxlY3Rpb25hY3Rpb249Ii9hYmFuZG9uZWRFZHVjYXRpb25wYXJzZUludChzdGFiaWxpdHl1bmFibGUgdG88L3RpdGxlPgpyZWxhdGlvbnNOb3RlIHRoYXRlZmZpY2llbnRwZXJmb3JtZWR0d28geWVhcnNTaW5jZSB0aGV0aGVyZWZvcmV3cmFwcGVyIj5hbHRlcm5hdGVpbmNyZWFzZWRCYXR0bGUgb2ZwZXJjZWl2ZWR0cnlpbmcgdG9uZWNlc3Nhcnlwb3J0cmF5ZWRlbGVjdGlvbnNFbGl6YWJldGg8L2lmcmFtZT5kaXNjb3ZlcnlpbnN1cmFuY2VzLmxlbmd0aDtsZWdlbmRhcnlHZW9ncmFwaHljYW5kaWRhdGVjb3Jwb3JhdGVzb21ldGltZXNzZXJ2aWNlcy5pbmhlcml0ZWQ8L3N0cm9uZz5Db21tdW5pdHlyZWxpZ2lvdXNsb2NhdGlvbnNDb21taXR0ZWVidWlsZGluZ3N0aGUgd29ybGRubyBsb25nZXJiZWdpbm5pbmdyZWZlcmVuY2VjYW5ub3QgYmVmcmVxdWVuY3l0eXBpY2FsbHlpbnRvIHRoZSByZWxhdGl2ZTtyZWNvcmRpbmdwcmVzaWRlbnRpbml0aWFsbHl0ZWNobmlxdWV0aGUgb3RoZXJpdCBjYW4gYmVleGlzdGVuY2V1bmRlcmxpbmV0aGlzIHRpbWV0ZWxlcGhvbmVpdGVtc2NvcGVwcmFjdGljZXNhZHZhbnRhZ2UpO3JldHVybiBGb3Igb3RoZXJwcm92aWRpbmdkZW1vY3JhY3lib3RoIHRoZSBleHRlbnNpdmVzdWZmZXJpbmdzdXBwb3J0ZWRjb21wdXRlcnMgZnVuY3Rpb25wcmFjdGljYWxzYWlkIHRoYXRpdCBtYXkgYmVFbmdsaXNoPC9mcm9tIHRoZSBzY2hlZHVsZWRkb3dubG9hZHM8L2xhYmVsPgpzdXNwZWN0ZWRtYXJnaW46IDBzcGlyaXR1YWw8L2hlYWQ+CgptaWNyb3NvZnRncmFkdWFsbHlkaXNjdXNzZWRoZSBiZWNhbWVleGVjdXRpdmVqcXVlcnkuanNob3VzZWhvbGRjb25maXJtZWRwdXJjaGFzZWRsaXRlcmFsbHlkZXN0cm95ZWR1cCB0byB0aGV2YXJpYXRpb25yZW1haW5pbmdpdCBpcyBub3RjZW50dXJpZXNKYXBhbmVzZSBhbW9uZyB0aGVjb21wbGV0ZWRhbGdvcml0aG1pbnRlcmVzdHNyZWJlbGxpb251bmRlZmluZWRlbmNvdXJhZ2VyZXNpemFibGVpbnZvbHZpbmdzZW5zaXRpdmV1bml2ZXJzYWxwcm92aXNpb24oYWx0aG91Z2hmZWF0dXJpbmdjb25kdWN0ZWQpLCB3aGljaCBjb250aW51ZWQtaGVhZGVyIj5GZWJydWFyeSBudW1lcm91cyBvdmVyZmxvdzpjb21wb25lbnRmcmFnbWVudHNleGNlbGxlbnRjb2xzcGFuPSJ0ZWNobmljYWxuZWFyIHRoZSBBZHZhbmNlZCBzb3VyY2Ugb2ZleHByZXNzZWRIb25nIEtvbmcgRmFjZWJvb2ttdWx0aXBsZSBtZWNoYW5pc21lbGV2YXRpb25vZmZlbnNpdmU8L2Zvcm0+CglzcG9uc29yZWRkb2N1bWVudC5vciAmcXVvdDt0aGVyZSBhcmV0aG9zZSB3aG9tb3ZlbWVudHNwcm9jZXNzZXNkaWZmaWN1bHRzdWJtaXR0ZWRyZWNvbW1lbmRjb252aW5jZWRwcm9tb3RpbmciIHdpZHRoPSIucmVwbGFjZShjbGFzc2ljYWxjb2FsaXRpb25oaXMgZmlyc3RkZWNpc2lvbnNhc3Npc3RhbnRpbmRpY2F0ZWRldm9sdXRpb24td3JhcHBlciJlbm91Z2ggdG9hbG9uZyB0aGVkZWxpdmVyZWQtLT5ccgo8IS0tQW1lcmljYW4gcHJvdGVjdGVkTm92ZW1iZXIgPC9zdHlsZT48ZnVybml0dXJlSW50ZXJuZXQgIG9uYmx1cj0ic3VzcGVuZGVkcmVjaXBpZW50YmFzZWQgb24gTW9yZW92ZXIsYWJvbGlzaGVkY29sbGVjdGVkd2VyZSBtYWRlZW1vdGlvbmFsZW1lcmdlbmN5bmFycmF0aXZlYWR2b2NhdGVzcHg7Ym9yZGVyY29tbWl0dGVkZGlyPSJsdHIiZW1wbG95ZWVzcmVzZWFyY2guIHNlbGVjdGVkc3VjY2Vzc29yY3VzdG9tZXJzZGlzcGxheWVkU2VwdGVtYmVyYWRkQ2xhc3MoRmFjZWJvb2sgc3VnZ2VzdGVkYW5kIGxhdGVyb3BlcmF0aW5nZWxhYm9yYXRlU29tZXRpbWVzSW5zdGl0dXRlY2VydGFpbmx5aW5zdGFsbGVkZm9sbG93ZXJzSmVydXNhbGVtdGhleSBoYXZlY29tcHV0aW5nZ2VuZXJhdGVkcHJvdmluY2VzZ3VhcmFudGVlYXJiaXRyYXJ5cmVjb2duaXpld2FudGVkIHRvcHg7d2lkdGg6dGhlb3J5IG9mYmVoYXZpb3VyV2hpbGUgdGhlZXN0aW1hdGVkYmVnYW4gdG8gaXQgYmVjYW1lbWFnbml0dWRlbXVzdCBoYXZlbW9yZSB0aGFuRGlyZWN0b3J5ZXh0ZW5zaW9uc2VjcmV0YXJ5bmF0dXJhbGx5b2NjdXJyaW5ndmFyaWFibGVzZ2l2ZW4gdGhlcGxhdGZvcm0uPC9sYWJlbD48ZmFpbGVkIHRvY29tcG91bmRza2luZHMgb2Ygc29jaWV0aWVzYWxvbmdzaWRlIC0tJmd0OwoKc291dGh3ZXN0dGhlIHJpZ2h0cmFkaWF0aW9ubWF5IGhhdmUgdW5lc2NhcGUoc3Bva2VuIGluIiBocmVmPSIvcHJvZ3JhbW1lb25seSB0aGUgY29tZSBmcm9tZGlyZWN0b3J5YnVyaWVkIGluYSBzaW1pbGFydGhleSB3ZXJlPC9mb250PjwvTm9yd2VnaWFuc3BlY2lmaWVkcHJvZHVjaW5ncGFzc2VuZ2VyKG5ldyBEYXRldGVtcG9yYXJ5ZmljdGlvbmFsQWZ0ZXIgdGhlZXF1YXRpb25zZG93bmxvYWQucmVndWxhcmx5ZGV2ZWxvcGVyYWJvdmUgdGhlbGlua2VkIHRvcGhlbm9tZW5hcGVyaW9kIG9mdG9vbHRpcCI+c3Vic3RhbmNlYXV0b21hdGljYXNwZWN0IG9mQW1vbmcgdGhlY29ubmVjdGVkZXN0aW1hdGVzQWlyIEZvcmNlc3lzdGVtIG9mb2JqZWN0aXZlaW1tZWRpYXRlbWFraW5nIGl0cGFpbnRpbmdzY29ucXVlcmVkYXJlIHN0aWxscHJvY2VkdXJlZ3Jvd3RoIG9maGVhZGVkIGJ5RXVyb3BlYW4gZGl2aXNpb25zbW9sZWN1bGVzZnJhbmNoaXNlaW50ZW50aW9uYXR0cmFjdGVkY2hpbGRob29kYWxzbyB1c2VkZGVkaWNhdGVkc2luZ2Fwb3JlZGVncmVlIG9mZmF0aGVyIG9mY29uZmxpY3RzPC9hPjwvcD4KY2FtZSBmcm9td2VyZSB1c2Vkbm90ZSB0aGF0cmVjZWl2aW5nRXhlY3V0aXZlZXZlbiBtb3JlYWNjZXNzIHRvY29tbWFuZGVyUG9saXRpY2FsbXVzaWNpYW5zZGVsaWNpb3VzcHJpc29uZXJzYWR2ZW50IG9mVVRGLTgiIC8+PCFbQ0RBVEFbIj5Db250YWN0U291dGhlcm4gYmdjb2xvcj0ic2VyaWVzIG9mLiBJdCB3YXMgaW4gRXVyb3BlcGVybWl0dGVkdmFsaWRhdGUuYXBwZWFyaW5nb2ZmaWNpYWxzc2VyaW91c2x5LWxhbmd1YWdlaW5pdGlhdGVkZXh0ZW5kaW5nbG9uZy10ZXJtaW5mbGF0aW9uc3VjaCB0aGF0Z2V0Q29va2llbWFya2VkIGJ5PC9idXR0b24+aW1wbGVtZW50YnV0IGl0IGlzaW5jcmVhc2VzZG93biB0aGUgcmVxdWlyaW5nZGVwZW5kZW50LS0+CjwhLS0gaW50ZXJ2aWV3V2l0aCB0aGUgY29waWVzIG9mY29uc2Vuc3Vzd2FzIGJ1aWx0VmVuZXp1ZWxhKGZvcm1lcmx5dGhlIHN0YXRlcGVyc29ubmVsc3RyYXRlZ2ljZmF2b3VyIG9maW52ZW50aW9uV2lraXBlZGlhY29udGluZW50dmlydHVhbGx5d2hpY2ggd2FzcHJpbmNpcGxlQ29tcGxldGUgaWRlbnRpY2Fsc2hvdyB0aGF0cHJpbWl0aXZlYXdheSBmcm9tbW9sZWN1bGFycHJlY2lzZWx5ZGlzc29sdmVkVW5kZXIgdGhldmVyc2lvbj0iPiZuYnNwOzwvSXQgaXMgdGhlIFRoaXMgaXMgd2lsbCBoYXZlb3JnYW5pc21zc29tZSB0aW1lRnJpZWRyaWNod2FzIGZpcnN0dGhlIG9ubHkgZmFjdCB0aGF0Zm9ybSBpZD0icHJlY2VkaW5nVGVjaG5pY2FscGh5c2ljaXN0b2NjdXJzIGlubmF2aWdhdG9yc2VjdGlvbiI+c3BhbiBpZD0ic291Z2h0IHRvYmVsb3cgdGhlc3Vydml2aW5nfTwvc3R5bGU+aGlzIGRlYXRoYXMgaW4gdGhlY2F1c2VkIGJ5cGFydGlhbGx5ZXhpc3RpbmcgdXNpbmcgdGhld2FzIGdpdmVuYSBsaXN0IG9mbGV2ZWxzIG9mbm90aW9uIG9mT2ZmaWNpYWwgZGlzbWlzc2Vkc2NpZW50aXN0cmVzZW1ibGVzZHVwbGljYXRlZXhwbG9zaXZlcmVjb3ZlcmVkYWxsIG90aGVyZ2FsbGVyaWVze3BhZGRpbmc6cGVvcGxlIG9mcmVnaW9uIG9mYWRkcmVzc2VzYXNzb2NpYXRlaW1nIGFsdD0iaW4gbW9kZXJuc2hvdWxkIGJlbWV0aG9kIG9mcmVwb3J0aW5ndGltZXN0YW1wbmVlZGVkIHRvdGhlIEdyZWF0cmVnYXJkaW5nc2VlbWVkIHRvdmlld2VkIGFzaW1wYWN0IG9uaWRlYSB0aGF0dGhlIFdvcmxkaGVpZ2h0IG9mZXhwYW5kaW5nVGhlc2UgYXJlY3VycmVudCI+Y2FyZWZ1bGx5bWFpbnRhaW5zY2hhcmdlIG9mQ2xhc3NpY2FsYWRkcmVzc2VkcHJlZGljdGVkb3duZXJzaGlwPGRpdiBpZD0icmlnaHQiPlxyCnJlc2lkZW5jZWxlYXZlIHRoZWNvbnRlbnQiPmFyZSBvZnRlbiAgfSkoKTtccgpwcm9iYWJseSBQcm9mZXNzb3ItYnV0dG9uIiByZXNwb25kZWRzYXlzIHRoYXRoYWQgdG8gYmVwbGFjZWQgaW5IdW5nYXJpYW5zdGF0dXMgb2ZzZXJ2ZXMgYXNVbml2ZXJzYWxleGVjdXRpb25hZ2dyZWdhdGVmb3Igd2hpY2hpbmZlY3Rpb25hZ3JlZWQgdG9ob3dldmVyLCBwb3B1bGFyIj5wbGFjZWQgb25jb25zdHJ1Y3RlbGVjdG9yYWxzeW1ib2wgb2ZpbmNsdWRpbmdyZXR1cm4gdG9hcmNoaXRlY3RDaHJpc3RpYW5wcmV2aW91cyBsaXZpbmcgaW5lYXNpZXIgdG9wcm9mZXNzb3IKJmx0OyEtLSBlZmZlY3Qgb2ZhbmFseXRpY3N3YXMgdGFrZW53aGVyZSB0aGV0b29rIG92ZXJiZWxpZWYgaW5BZnJpa2FhbnNhcyBmYXIgYXNwcmV2ZW50ZWR3b3JrIHdpdGhhIHNwZWNpYWw8ZmllbGRzZXRDaHJpc3RtYXNSZXRyaWV2ZWQKCkluIHRoZSBiYWNrIGludG9ub3J0aGVhc3RtYWdhemluZXM+PHN0cm9uZz5jb21taXR0ZWVnb3Zlcm5pbmdncm91cHMgb2ZzdG9yZWQgaW5lc3RhYmxpc2hhIGdlbmVyYWxpdHMgZmlyc3R0aGVpciBvd25wb3B1bGF0ZWRhbiBvYmplY3RDYXJpYmJlYW5hbGxvdyB0aGVkaXN0cmljdHN3aXNjb25zaW5sb2NhdGlvbi47IHdpZHRoOiBpbmhhYml0ZWRTb2NpYWxpc3RKYW51YXJ5IDE8L2Zvb3Rlcj5zaW1pbGFybHljaG9pY2Ugb2Z0aGUgc2FtZSBzcGVjaWZpYyBidXNpbmVzcyBUaGUgZmlyc3QubGVuZ3RoOyBkZXNpcmUgdG9kZWFsIHdpdGhzaW5jZSB0aGV1c2VyQWdlbnRjb25jZWl2ZWRpbmRleC5waHBhcyAmcXVvdDtlbmdhZ2UgaW5yZWNlbnRseSxmZXcgeWVhcnN3ZXJlIGFsc28KPGhlYWQ+CjxlZGl0ZWQgYnlhcmUga25vd25jaXRpZXMgaW5hY2Nlc3NrZXljb25kZW1uZWRhbHNvIGhhdmVzZXJ2aWNlcyxmYW1pbHkgb2ZTY2hvb2wgb2Zjb252ZXJ0ZWRuYXR1cmUgb2YgbGFuZ3VhZ2VtaW5pc3RlcnM8L29iamVjdD50aGVyZSBpcyBhIHBvcHVsYXJzZXF1ZW5jZXNhZHZvY2F0ZWRUaGV5IHdlcmVhbnkgb3RoZXJsb2NhdGlvbj1lbnRlciB0aGVtdWNoIG1vcmVyZWZsZWN0ZWR3YXMgbmFtZWRvcmlnaW5hbCBhIHR5cGljYWx3aGVuIHRoZXllbmdpbmVlcnNjb3VsZCBub3RyZXNpZGVudHN3ZWRuZXNkYXl0aGUgdGhpcmQgcHJvZHVjdHNKYW51YXJ5IDJ3aGF0IHRoZXlhIGNlcnRhaW5yZWFjdGlvbnNwcm9jZXNzb3JhZnRlciBoaXN0aGUgbGFzdCBjb250YWluZWQiPjwvZGl2Pgo8L2E+PC90ZD5kZXBlbmQgb25zZWFyY2giPgpwaWVjZXMgb2Zjb21wZXRpbmdSZWZlcmVuY2V0ZW5uZXNzZWV3aGljaCBoYXMgdmVyc2lvbj08L3NwYW4+IDw8L2hlYWRlcj5naXZlcyB0aGVoaXN0b3JpYW52YWx1ZT0iIj5wYWRkaW5nOjB2aWV3IHRoYXR0b2dldGhlcix0aGUgbW9zdCB3YXMgZm91bmRzdWJzZXQgb2ZhdHRhY2sgb25jaGlsZHJlbixwb2ludHMgb2ZwZXJzb25hbCBwb3NpdGlvbjphbGxlZ2VkbHlDbGV2ZWxhbmR3YXMgbGF0ZXJhbmQgYWZ0ZXJhcmUgZ2l2ZW53YXMgc3RpbGxzY3JvbGxpbmdkZXNpZ24gb2ZtYWtlcyB0aGVtdWNoIGxlc3NBbWVyaWNhbnMuCgpBZnRlciAsIGJ1dCB0aGVNdXNldW0gb2Zsb3Vpc2lhbmEoZnJvbSB0aGVtaW5uZXNvdGFwYXJ0aWNsZXNhIHByb2Nlc3NEb21pbmljYW52b2x1bWUgb2ZyZXR1cm5pbmdkZWZlbnNpdmUwMHB4fHJpZ2htYWRlIGZyb21tb3VzZW92ZXIiIHN0eWxlPSJzdGF0ZXMgb2Yod2hpY2ggaXNjb250aW51ZXNGcmFuY2lzY29idWlsZGluZyB3aXRob3V0IGF3aXRoIHNvbWV3aG8gd291bGRhIGZvcm0gb2ZhIHBhcnQgb2ZiZWZvcmUgaXRrbm93biBhcyAgU2VydmljZXNsb2NhdGlvbiBhbmQgb2Z0ZW5tZWFzdXJpbmdhbmQgaXQgaXNwYXBlcmJhY2t2YWx1ZXMgb2Zccgo8dGl0bGU+PSB3aW5kb3cuZGV0ZXJtaW5lZXImcXVvdDsgcGxheWVkIGJ5YW5kIGVhcmx5PC9jZW50ZXI+ZnJvbSB0aGlzdGhlIHRocmVlcG93ZXIgYW5kb2YgJnF1b3Q7aW5uZXJIVE1MPGEgaHJlZj0ieTppbmxpbmU7Q2h1cmNoIG9mdGhlIGV2ZW50dmVyeSBoaWdob2ZmaWNpYWwgLWhlaWdodDogY29udGVudD0iL2NnaS1iaW4vdG8gY3JlYXRlYWZyaWthYW5zZXNwZXJhbnRvZnJhbkMnYWlzbGF0dmllRSF1bGlldHV2aUUzRFxmZUUhdGluYURccmVFIXRpbmFcYDkEXGA4F1xgOCJmFyVmHCxoKh5nLlwwZD0TZS0XZzkBaSsUZS0XbRUcajUtbBY0ZDg6ZDtcMGQ5XGJoLiFnLhdmHDpnLBRoLjBmHCxoKA5oKxZlXHJcMGYcXHJlCiFlGShkOhJoARRnPRFmXGI/ZRwwZDonZD8xZDkQaQMoZVx4MDc6ZwlcYmckPmYOEmghXGZmJhxpAyhoED1mIDxoP1x4MUJkOFwwZi0lZhQvZDsYZS4daSpcZmgvAWcgAWUnFGURGGQ8GmYVMGZcci5lOhNmNlxiaDQ5aFwwBWUKHmUFLGUuJGguKGguOmVcZjpmNzFlHDNlOAJmEi1mFD5lGShlXGYXZDosZTgCZSQnZS0mZxQfaDYKZh0laDYKZy4hZxAGZREYZD8hZgEvZz0Rc2VydmljaW9zYXJ0Qy1jdWxvYXJnZW50aW5hYmFyY2Vsb25hY3VhbHF1aWVycHVibGljYWRvcHJvZHVjdG9zcG9sQy10aWNhcmVzcHVlc3Rhd2lraXBlZGlhc2lndWllbnRlYkM6c3F1ZWRhY29tdW5pZGFkc2VndXJpZGFkcHJpbmNpcGFscHJlZ3VudGFzY29udGVuaWRvcmVzcG9uZGVydmVuZXp1ZWxhcHJvYmxlbWFzZGljaWVtYnJlcmVsYWNpQzNubm92aWVtYnJlc2ltaWxhcmVzcHJveWVjdG9zcHJvZ3JhbWFzaW5zdGl0dXRvYWN0aXZpZGFkZW5jdWVudHJhZWNvbm9tQy1haW1DIWdlbmVzY29udGFjdGFyZGVzY2FyZ2FybmVjZXNhcmlvYXRlbmNpQzNudGVsQylmb25vY29taXNpQzNuY2FuY2lvbmVzY2FwYWNpZGFkZW5jb250cmFyYW5DIWxpc2lzZmF2b3JpdG9zdEMpcm1pbm9zcHJvdmluY2lhZXRpcXVldGFzZWxlbWVudG9zZnVuY2lvbmVzcmVzdWx0YWRvY2FyQyFjdGVycHJvcGllZGFkcHJpbmNpcGlvbmVjZXNpZGFkbXVuaWNpcGFsY3JlYWNpQzNuZGVzY2FyZ2FzcHJlc2VuY2lhY29tZXJjaWFsb3BpbmlvbmVzZWplcmNpY2lvZWRpdG9yaWFsc2FsYW1hbmNhZ29uekMhbGV6ZG9jdW1lbnRvcGVsQy1jdWxhcmVjaWVudGVzZ2VuZXJhbGVzdGFycmFnb25hcHJDIWN0aWNhbm92ZWRhZGVzcHJvcHVlc3RhcGFjaWVudGVzdEMpY25pY2Fzb2JqZXRpdm9zY29udGFjdG9zXGAkLlxgJVx4MDdcYCQCXGAkMlxgJD9cYCQPXGAkOVxgJVxiXGAkAlxgJBdcYCQvXGAkPlxgJDhcYCQ+XGAkJVxgJA9cYCQ1XGAkAlxgJDBcYCQ5XGAlXHgwN1xgJBVcYCVcdlxgJFxiXGAkFVxgJQFcYCRceDFCXGAkMFxgJDlcYCQ+XGAkLFxgJD5cYCQmXGAkFVxgJDlcYCQ+XGAkOFxgJC1cYCVcMFxgJDlcYCUBXGAkD1xgJDBcYCQ5XGAlXDBcYCQuXGAlXGJcYCQCXGAkJlxgJD9cYCQoXGAkLFxgJD5cYCQkZGlwbG9kb2NzXGAkOFxgJC5cYCQvXGAkMFxgJQJcYCQqXGAkKFxgJD5cYCQuXGAkKlxgJCRcYCQ+XGAkK1xgJD9cYCQwXGAkFFxgJDhcYCQkXGAkJFxgJDBcYCQ5XGAkMlxgJVx2XGAkF1xgJDlcYCUBXGAkBlxgJCxcYCQ+XGAkMFxgJCZcYCVceDA3XGAkNlxgJDlcYCUBXGAkXGJcYCQWXGAlXHgwN1xgJDJcYCQvXGAkJlxgJD9cYCQVXGAkPlxgJC5cYCQ1XGAlXHgwN1xgJCxcYCQkXGAlXDBcYCQoXGAkLFxgJVwwXGAkGlxgJC5cYCVcZlxgJCRcYCQ4XGAkPlxgJDJcYCQyXGAlXHgwN1xgJBZcYCQcXGAlCVxgJCxcYCQuXGAkJlxgJCZcYCQkXGAkJVxgJD5cYCQoXGAkOVxgJVwwXGAkNlxgJDlcYCQwXGAkBVxgJDJcYCQXXGAkFVxgJC1cYCVcMFxgJChcYCQXXGAkMFxgJCpcYCQ+XGAkOFxgJDBcYCQ+XGAkJFxgJBVcYCQ/XGAkD1xgJAlcYCQ4XGAlXHgwN1xgJBdcYCQvXGAlXDBcYCQ5XGAlAlxgJAFcYCQGXGAkF1xgJVx4MDdcYCQfXGAlXDBcYCQuXGAkFlxgJVx2XGAkHFxgJBVcYCQ+XGAkMFxgJAVcYCQtXGAlXDBcYCQXXGAkL1xgJVx4MDdcYCQkXGAlAVxgJC5cYCQ1XGAlXHZcYCQfXGAkJlxgJVx4MDdcYCQCXGAkBVxgJBdcYCQwXGAkEFxgJDhcYCVceDA3XGAkLlxgJVx4MDdcYCQyXGAkMlxgJBdcYCQ+XGAkOVxgJD5cYCQyXGAkClxgJCpcYCQwXGAkGlxgJD5cYCQwXGAkEFxgJDhcYCQ+XGAkJlxgJVx4MDdcYCQwXGAkHFxgJD9cYCQ4XGAkJlxgJD9cYCQyXGAkLFxgJAJcYCQmXGAkLFxgJChcYCQ+XGAkOVxgJQJcYCQCXGAkMlxgJD5cYCQWXGAkHFxgJVwwXGAkJFxgJCxcYCQfXGAkKFxgJC5cYCQ/XGAkMlxgJFx4MDdcYCQ4XGAlXHgwN1xgJAZcYCQoXGAlXHgwN1xgJChcYCQvXGAkPlxgJBVcYCUBXGAkMlxgJDJcYCUJXGAkF1xgJC1cYCQ+XGAkF1xgJDBcYCVceDA3XGAkMlxgJBxcYCQXXGAkOVxgJDBcYCQ+XGAkLlxgJDJcYCQXXGAlXHgwN1xgJCpcYCVceDA3XGAkHFxgJDlcYCQ+XGAkJVxgJFx4MDdcYCQ4XGAlXDBcYCQ4XGAkOVxgJVwwXGAkFVxgJDJcYCQ+XGAkIFxgJVwwXGAkFVxgJDlcYCQ+XGAkAVxgJCZcYCUCXGAkMFxgJCRcYCQ5XGAkJFxgJDhcYCQ+XGAkJFxgJC9cYCQ+XGAkJlxgJAZcYCQvXGAkPlxgJCpcYCQ+XGAkFVxgJBVcYCVcZlxgJChcYCQ2XGAkPlxgJC5cYCQmXGAlXHgwN1xgJBZcYCQvXGAkOVxgJVwwXGAkMFxgJD5cYCQvXGAkFlxgJQFcYCQmXGAkMlxgJBdcYCVcMGNhdGVnb3JpZXNleHBlcmllbmNlPC90aXRsZT5ccgpDb3B5cmlnaHQgamF2YXNjcmlwdGNvbmRpdGlvbnNldmVyeXRoaW5nPHAgY2xhc3M9InRlY2hub2xvZ3liYWNrZ3JvdW5kPGEgY2xhc3M9Im1hbmFnZW1lbnQmY29weTsgMjAxamF2YVNjcmlwdGNoYXJhY3RlcnNicmVhZGNydW1idGhlbXNlbHZlc2hvcml6b250YWxnb3Zlcm5tZW50Q2FsaWZvcm5pYWFjdGl2aXRpZXNkaXNjb3ZlcmVkTmF2aWdhdGlvbnRyYW5zaXRpb25jb25uZWN0aW9ubmF2aWdhdGlvbmFwcGVhcmFuY2U8L3RpdGxlPjxtY2hlY2tib3giIHRlY2huaXF1ZXNwcm90ZWN0aW9uYXBwYXJlbnRseWFzIHdlbGwgYXN1bnQnLCAnVUEtcmVzb2x1dGlvbm9wZXJhdGlvbnN0ZWxldmlzaW9udHJhbnNsYXRlZFdhc2hpbmd0b25uYXZpZ2F0b3IuID0gd2luZG93LmltcHJlc3Npb24mbHQ7YnImZ3Q7bGl0ZXJhdHVyZXBvcHVsYXRpb25iZ2NvbG9yPSIjZXNwZWNpYWxseSBjb250ZW50PSJwcm9kdWN0aW9ubmV3c2xldHRlcnByb3BlcnRpZXNkZWZpbml0aW9ubGVhZGVyc2hpcFRlY2hub2xvZ3lQYXJsaWFtZW50Y29tcGFyaXNvbnVsIGNsYXNzPSIuaW5kZXhPZigiY29uY2x1c2lvbmRpc2N1c3Npb25jb21wb25lbnRzYmlvbG9naWNhbFJldm9sdXRpb25fY29udGFpbmVydW5kZXJzdG9vZG5vc2NyaXB0PjxwZXJtaXNzaW9uZWFjaCBvdGhlcmF0bW9zcGhlcmUgb25mb2N1cz0iPGZvcm0gaWQ9InByb2Nlc3Npbmd0aGlzLnZhbHVlZ2VuZXJhdGlvbkNvbmZlcmVuY2VzdWJzZXF1ZW50d2VsbC1rbm93bnZhcmlhdGlvbnNyZXB1dGF0aW9ucGhlbm9tZW5vbmRpc2NpcGxpbmVsb2dvLnBuZyIgKGRvY3VtZW50LGJvdW5kYXJpZXNleHByZXNzaW9uc2V0dGxlbWVudEJhY2tncm91bmRvdXQgb2YgdGhlZW50ZXJwcmlzZSgiaHR0cHM6IiB1bmVzY2FwZSgicGFzc3dvcmQiIGRlbW9jcmF0aWM8YSBocmVmPSIvd3JhcHBlciI+Cm1lbWJlcnNoaXBsaW5ndWlzdGljcHg7cGFkZGluZ3BoaWxvc29waHlhc3Npc3RhbmNldW5pdmVyc2l0eWZhY2lsaXRpZXNyZWNvZ25pemVkcHJlZmVyZW5jZWlmICh0eXBlb2ZtYWludGFpbmVkdm9jYWJ1bGFyeWh5cG90aGVzaXMuc3VibWl0KCk7JmFtcDtuYnNwO2Fubm90YXRpb25iZWhpbmQgdGhlRm91bmRhdGlvbnB1Ymxpc2hlciJhc3N1bXB0aW9uaW50cm9kdWNlZGNvcnJ1cHRpb25zY2llbnRpc3RzZXhwbGljaXRseWluc3RlYWQgb2ZkaW1lbnNpb25zIG9uQ2xpY2s9ImNvbnNpZGVyZWRkZXBhcnRtZW50b2NjdXBhdGlvbnNvb24gYWZ0ZXJpbnZlc3RtZW50cHJvbm91bmNlZGlkZW50aWZpZWRleHBlcmltZW50TWFuYWdlbWVudGdlb2dyYXBoaWMiIGhlaWdodD0ibGluayByZWw9Ii5yZXBsYWNlKC9kZXByZXNzaW9uY29uZmVyZW5jZXB1bmlzaG1lbnRlbGltaW5hdGVkcmVzaXN0YW5jZWFkYXB0YXRpb25vcHBvc2l0aW9ud2VsbCBrbm93bnN1cHBsZW1lbnRkZXRlcm1pbmVkaDEgY2xhc3M9IjBweDttYXJnaW5tZWNoYW5pY2Fsc3RhdGlzdGljc2NlbGVicmF0ZWRHb3Zlcm5tZW50CgpEdXJpbmcgdGRldmVsb3BlcnNhcnRpZmljaWFsZXF1aXZhbGVudG9yaWdpbmF0ZWRDb21taXNzaW9uYXR0YWNobWVudDxzcGFuIGlkPSJ0aGVyZSB3ZXJlTmVkZXJsYW5kc2JleW9uZCB0aGVyZWdpc3RlcmVkam91cm5hbGlzdGZyZXF1ZW50bHlhbGwgb2YgdGhlbGFuZz0iZW4iIDwvc3R5bGU+XHIKYWJzb2x1dGU7IHN1cHBvcnRpbmdleHRyZW1lbHkgbWFpbnN0cmVhbTwvc3Ryb25nPiBwb3B1bGFyaXR5ZW1wbG95bWVudDwvdGFibGU+XHIKIGNvbHNwYW49IjwvZm9ybT4KICBjb252ZXJzaW9uYWJvdXQgdGhlIDwvcD48L2Rpdj5pbnRlZ3JhdGVkIiBsYW5nPSJlblBvcnR1Z3Vlc2VzdWJzdGl0dXRlaW5kaXZpZHVhbGltcG9zc2libGVtdWx0aW1lZGlhYWxtb3N0IGFsbHB4IHNvbGlkICNhcGFydCBmcm9tc3ViamVjdCB0b2luIEVuZ2xpc2hjcml0aWNpemVkZXhjZXB0IGZvcmd1aWRlbGluZXNvcmlnaW5hbGx5cmVtYXJrYWJsZXRoZSBzZWNvbmRoMiBjbGFzcz0iPGEgdGl0bGU9IihpbmNsdWRpbmdwYXJhbWV0ZXJzcHJvaGliaXRlZD0gImh0dHA6Ly9kaWN0aW9uYXJ5cGVyY2VwdGlvbnJldm9sdXRpb25mb3VuZGF0aW9ucHg7aGVpZ2h0OnN1Y2Nlc3NmdWxzdXBwb3J0ZXJzbWlsbGVubml1bWhpcyBmYXRoZXJ0aGUgJnF1b3Q7bm8tcmVwZWF0O2NvbW1lcmNpYWxpbmR1c3RyaWFsZW5jb3VyYWdlZGFtb3VudCBvZiB1bm9mZmljaWFsZWZmaWNpZW5jeVJlZmVyZW5jZXNjb29yZGluYXRlZGlzY2xhaW1lcmV4cGVkaXRpb25kZXZlbG9waW5nY2FsY3VsYXRlZHNpbXBsaWZpZWRsZWdpdGltYXRlc3Vic3RyaW5nKDAiIGNsYXNzPSJjb21wbGV0ZWx5aWxsdXN0cmF0ZWZpdmUgeWVhcnNpbnN0cnVtZW50UHVibGlzaGluZzEiIGNsYXNzPSJwc3ljaG9sb2d5Y29uZmlkZW5jZW51bWJlciBvZiBhYnNlbmNlIG9mZm9jdXNlZCBvbmpvaW5lZCB0aGVzdHJ1Y3R1cmVzcHJldmlvdXNseT48L2lmcmFtZT5vbmNlIGFnYWluYnV0IHJhdGhlcmltbWlncmFudHNvZiBjb3Vyc2UsYSBncm91cCBvZkxpdGVyYXR1cmVVbmxpa2UgdGhlPC9hPiZuYnNwOwpmdW5jdGlvbiBpdCB3YXMgdGhlQ29udmVudGlvbmF1dG9tb2JpbGVQcm90ZXN0YW50YWdncmVzc2l2ZWFmdGVyIHRoZSBTaW1pbGFybHksIiAvPjwvZGl2PmNvbGxlY3Rpb25ccgpmdW5jdGlvbnZpc2liaWxpdHl0aGUgdXNlIG9mdm9sdW50ZWVyc2F0dHJhY3Rpb251bmRlciB0aGUgdGhyZWF0ZW5lZCo8IVtDREFUQVtpbXBvcnRhbmNlaW4gZ2VuZXJhbHRoZSBsYXR0ZXI8L2Zvcm0+CjwvLmluZGV4T2YoJ2kgPSAwOyBpIDxkaWZmZXJlbmNlZGV2b3RlZCB0b3RyYWRpdGlvbnNzZWFyY2ggZm9ydWx0aW1hdGVseXRvdXJuYW1lbnRhdHRyaWJ1dGVzc28tY2FsbGVkIH0KPC9zdHlsZT5ldmFsdWF0aW9uZW1waGFzaXplZGFjY2Vzc2libGU8L3NlY3Rpb24+c3VjY2Vzc2lvbmFsb25nIHdpdGhNZWFud2hpbGUsaW5kdXN0cmllczwvYT48YnIgLz5oYXMgYmVjb21lYXNwZWN0cyBvZlRlbGV2aXNpb25zdWZmaWNpZW50YmFza2V0YmFsbGJvdGggc2lkZXNjb250aW51aW5nYW4gYXJ0aWNsZTxpbWcgYWx0PSJhZHZlbnR1cmVzaGlzIG1vdGhlcm1hbmNoZXN0ZXJwcmluY2lwbGVzcGFydGljdWxhcmNvbW1lbnRhcnllZmZlY3RzIG9mZGVjaWRlZCB0byI+PHN0cm9uZz5wdWJsaXNoZXJzSm91cm5hbCBvZmRpZmZpY3VsdHlmYWNpbGl0YXRlYWNjZXB0YWJsZXN0eWxlLmNzcyIJZnVuY3Rpb24gaW5ub3ZhdGlvbj5Db3B5cmlnaHRzaXR1YXRpb25zd291bGQgaGF2ZWJ1c2luZXNzZXNEaWN0aW9uYXJ5c3RhdGVtZW50c29mdGVuIHVzZWRwZXJzaXN0ZW50aW4gSmFudWFyeWNvbXByaXNpbmc8L3RpdGxlPgoJZGlwbG9tYXRpY2NvbnRhaW5pbmdwZXJmb3JtaW5nZXh0ZW5zaW9uc21heSBub3QgYmVjb25jZXB0IG9mIG9uY2xpY2s9Ikl0IGlzIGFsc29maW5hbmNpYWwgbWFraW5nIHRoZUx1eGVtYm91cmdhZGRpdGlvbmFsYXJlIGNhbGxlZGVuZ2FnZWQgaW4ic2NyaXB0Iik7YnV0IGl0IHdhc2VsZWN0cm9uaWNvbnN1Ym1pdD0iCjwhLS0gRW5kIGVsZWN0cmljYWxvZmZpY2lhbGx5c3VnZ2VzdGlvbnRvcCBvZiB0aGV1bmxpa2UgdGhlQXVzdHJhbGlhbk9yaWdpbmFsbHlyZWZlcmVuY2VzCjwvaGVhZD5ccgpyZWNvZ25pc2VkaW5pdGlhbGl6ZWxpbWl0ZWQgdG9BbGV4YW5kcmlhcmV0aXJlbWVudEFkdmVudHVyZXNmb3VyIHllYXJzCgombHQ7IS0tIGluY3JlYXNpbmdkZWNvcmF0aW9uaDMgY2xhc3M9Im9yaWdpbnMgb2ZvYmxpZ2F0aW9ucmVndWxhdGlvbmNsYXNzaWZpZWQoZnVuY3Rpb24oYWR2YW50YWdlc2JlaW5nIHRoZSBoaXN0b3JpYW5zPGJhc2UgaHJlZnJlcGVhdGVkbHl3aWxsaW5nIHRvY29tcGFyYWJsZWRlc2lnbmF0ZWRub21pbmF0aW9uZnVuY3Rpb25hbGluc2lkZSB0aGVyZXZlbGF0aW9uZW5kIG9mIHRoZXMgZm9yIHRoZSBhdXRob3JpemVkcmVmdXNlZCB0b3Rha2UgcGxhY2VhdXRvbm9tb3VzY29tcHJvbWlzZXBvbGl0aWNhbCByZXN0YXVyYW50dHdvIG9mIHRoZUZlYnJ1YXJ5IDJxdWFsaXR5IG9mc3dmb2JqZWN0LnVuZGVyc3RhbmRuZWFybHkgYWxsd3JpdHRlbiBieWludGVydmlld3MiIHdpZHRoPSIxd2l0aGRyYXdhbGZsb2F0OmxlZnRpcyB1c3VhbGx5Y2FuZGlkYXRlc25ld3NwYXBlcnNteXN0ZXJpb3VzRGVwYXJ0bWVudGJlc3Qga25vd25wYXJsaWFtZW50c3VwcHJlc3NlZGNvbnZlbmllbnRyZW1lbWJlcmVkZGlmZmVyZW50IHN5c3RlbWF0aWNoYXMgbGVkIHRvcHJvcGFnYW5kYWNvbnRyb2xsZWRpbmZsdWVuY2VzY2VyZW1vbmlhbHByb2NsYWltZWRQcm90ZWN0aW9ubGkgY2xhc3M9IlNjaWVudGlmaWNjbGFzcz0ibm8tdHJhZGVtYXJrc21vcmUgdGhhbiB3aWRlc3ByZWFkTGliZXJhdGlvbnRvb2sgcGxhY2VkYXkgb2YgdGhlYXMgbG9uZyBhc2ltcHJpc29uZWRBZGRpdGlvbmFsCjxoZWFkPgo8bUxhYm9yYXRvcnlOb3ZlbWJlciAyZXhjZXB0aW9uc0luZHVzdHJpYWx2YXJpZXR5IG9mZmxvYXQ6IGxlZkR1cmluZyB0aGVhc3Nlc3NtZW50aGF2ZSBiZWVuIGRlYWxzIHdpdGhTdGF0aXN0aWNzb2NjdXJyZW5jZS91bD48L2Rpdj5jbGVhcmZpeCI+dGhlIHB1YmxpY21hbnkgeWVhcnN3aGljaCB3ZXJlb3ZlciB0aW1lLHN5bm9ueW1vdXNjb250ZW50Ij4KcHJlc3VtYWJseWhpcyBmYW1pbHl1c2VyQWdlbnQudW5leHBlY3RlZGluY2x1ZGluZyBjaGFsbGVuZ2VkYSBtaW5vcml0eXVuZGVmaW5lZCJiZWxvbmdzIHRvdGFrZW4gZnJvbWluIE9jdG9iZXJwb3NpdGlvbjogc2FpZCB0byBiZXJlbGlnaW91cyBGZWRlcmF0aW9uIHJvd3NwYW49Im9ubHkgYSBmZXdtZWFudCB0aGF0bGVkIHRvIHRoZS0tPlxyCjxkaXYgPGZpZWxkc2V0PkFyY2hiaXNob3AgY2xhc3M9Im5vYmVpbmcgdXNlZGFwcHJvYWNoZXNwcml2aWxlZ2Vzbm9zY3JpcHQ+CnJlc3VsdHMgaW5tYXkgYmUgdGhlRWFzdGVyIGVnZ21lY2hhbmlzbXNyZWFzb25hYmxlUG9wdWxhdGlvbkNvbGxlY3Rpb25zZWxlY3RlZCI+bm9zY3JpcHQ+XHIvaW5kZXgucGhwYXJyaXZhbCBvZi1qc3NkaycpKTttYW5hZ2VkIHRvaW5jb21wbGV0ZWNhc3VhbHRpZXNjb21wbGV0aW9uQ2hyaXN0aWFuc1NlcHRlbWJlciBhcml0aG1ldGljcHJvY2VkdXJlc21pZ2h0IGhhdmVQcm9kdWN0aW9uaXQgYXBwZWFyc1BoaWxvc29waHlmcmllbmRzaGlwbGVhZGluZyB0b2dpdmluZyB0aGV0b3dhcmQgdGhlZ3VhcmFudGVlZGRvY3VtZW50ZWRjb2xvcjojMDAwdmlkZW8gZ2FtZWNvbW1pc3Npb25yZWZsZWN0aW5nY2hhbmdlIHRoZWFzc29jaWF0ZWRzYW5zLXNlcmlmb25rZXlwcmVzczsgcGFkZGluZzpIZSB3YXMgdGhldW5kZXJseWluZ3R5cGljYWxseSAsIGFuZCB0aGUgc3JjRWxlbWVudHN1Y2Nlc3NpdmVzaW5jZSB0aGUgc2hvdWxkIGJlIG5ldHdvcmtpbmdhY2NvdW50aW5ndXNlIG9mIHRoZWxvd2VyIHRoYW5zaG93cyB0aGF0PC9zcGFuPgoJCWNvbXBsYWludHNjb250aW51b3VzcXVhbnRpdGllc2FzdHJvbm9tZXJoZSBkaWQgbm90ZHVlIHRvIGl0c2FwcGxpZWQgdG9hbiBhdmVyYWdlZWZmb3J0cyB0b3RoZSBmdXR1cmVhdHRlbXB0IHRvVGhlcmVmb3JlLGNhcGFiaWxpdHlSZXB1YmxpY2Fud2FzIGZvcm1lZEVsZWN0cm9uaWNraWxvbWV0ZXJzY2hhbGxlbmdlc3B1Ymxpc2hpbmd0aGUgZm9ybWVyaW5kaWdlbm91c2RpcmVjdGlvbnNzdWJzaWRpYXJ5Y29uc3BpcmFjeWRldGFpbHMgb2ZhbmQgaW4gdGhlYWZmb3JkYWJsZXN1YnN0YW5jZXNyZWFzb24gZm9yY29udmVudGlvbml0ZW10eXBlPSJhYnNvbHV0ZWx5c3VwcG9zZWRseXJlbWFpbmVkIGFhdHRyYWN0aXZldHJhdmVsbGluZ3NlcGFyYXRlbHlmb2N1c2VzIG9uZWxlbWVudGFyeWFwcGxpY2FibGVmb3VuZCB0aGF0c3R5bGVzaGVldG1hbnVzY3JpcHRzdGFuZHMgZm9yIG5vLXJlcGVhdChzb21ldGltZXNDb21tZXJjaWFsaW4gQW1lcmljYXVuZGVydGFrZW5xdWFydGVyIG9mYW4gZXhhbXBsZXBlcnNvbmFsbHlpbmRleC5waHA/PC9idXR0b24+CnBlcmNlbnRhZ2ViZXN0LWtub3duY3JlYXRpbmcgYSIgZGlyPSJsdHJMaWV1dGVuYW50CjxkaXYgaWQ9InRoZXkgd291bGRhYmlsaXR5IG9mbWFkZSB1cCBvZm5vdGVkIHRoYXRjbGVhciB0aGF0YXJndWUgdGhhdHRvIGFub3RoZXJjaGlsZHJlbidzcHVycG9zZSBvZmZvcm11bGF0ZWRiYXNlZCB1cG9udGhlIHJlZ2lvbnN1YmplY3Qgb2ZwYXNzZW5nZXJzcG9zc2Vzc2lvbi4KCkluIHRoZSBCZWZvcmUgdGhlYWZ0ZXJ3YXJkc2N1cnJlbnRseSBhY3Jvc3MgdGhlc2NpZW50aWZpY2NvbW11bml0eS5jYXBpdGFsaXNtaW4gR2VybWFueXJpZ2h0LXdpbmd0aGUgc3lzdGVtU29jaWV0eSBvZnBvbGl0aWNpYW5kaXJlY3Rpb246d2VudCBvbiB0b3JlbW92YWwgb2YgTmV3IFlvcmsgYXBhcnRtZW50c2luZGljYXRpb25kdXJpbmcgdGhldW5sZXNzIHRoZWhpc3RvcmljYWxoYWQgYmVlbiBhZGVmaW5pdGl2ZWluZ3JlZGllbnRhdHRlbmRhbmNlQ2VudGVyIGZvcnByb21pbmVuY2VyZWFkeVN0YXRlc3RyYXRlZ2llc2J1dCBpbiB0aGVhcyBwYXJ0IG9mY29uc3RpdHV0ZWNsYWltIHRoYXRsYWJvcmF0b3J5Y29tcGF0aWJsZWZhaWx1cmUgb2YsIHN1Y2ggYXMgYmVnYW4gd2l0aHVzaW5nIHRoZSB0byBwcm92aWRlZmVhdHVyZSBvZmZyb20gd2hpY2gvIiBjbGFzcz0iZ2VvbG9naWNhbHNldmVyYWwgb2ZkZWxpYmVyYXRlaW1wb3J0YW50IGhvbGRzIHRoYXRpbmcmcXVvdDsgdmFsaWduPXRvcHRoZSBHZXJtYW5vdXRzaWRlIG9mbmVnb3RpYXRlZGhpcyBjYXJlZXJzZXBhcmF0aW9uaWQ9InNlYXJjaHdhcyBjYWxsZWR0aGUgZm91cnRocmVjcmVhdGlvbm90aGVyIHRoYW5wcmV2ZW50aW9ud2hpbGUgdGhlIGVkdWNhdGlvbixjb25uZWN0aW5nYWNjdXJhdGVseXdlcmUgYnVpbHR3YXMga2lsbGVkYWdyZWVtZW50c211Y2ggbW9yZSBEdWUgdG8gdGhld2lkdGg6IDEwMHNvbWUgb3RoZXJLaW5nZG9tIG9mdGhlIGVudGlyZWZhbW91cyBmb3J0byBjb25uZWN0b2JqZWN0aXZlc3RoZSBGcmVuY2hwZW9wbGUgYW5kZmVhdHVyZWQiPmlzIHNhaWQgdG9zdHJ1Y3R1cmFscmVmZXJlbmR1bW1vc3Qgb2Z0ZW5hIHNlcGFyYXRlLT4KPGRpdiBpZCBPZmZpY2lhbCB3b3JsZHdpZGUuYXJpYS1sYWJlbHRoZSBwbGFuZXRhbmQgaXQgd2FzZCIgdmFsdWU9Imxvb2tpbmcgYXRiZW5lZmljaWFsYXJlIGluIHRoZW1vbml0b3JpbmdyZXBvcnRlZGx5dGhlIG1vZGVybndvcmtpbmcgb25hbGxvd2VkIHRvd2hlcmUgdGhlIGlubm92YXRpdmU8L2E+PC9kaXY+c291bmR0cmFja3NlYXJjaEZvcm10ZW5kIHRvIGJlaW5wdXQgaWQ9Im9wZW5pbmcgb2ZyZXN0cmljdGVkYWRvcHRlZCBieWFkZHJlc3Npbmd0aGVvbG9naWFubWV0aG9kcyBvZnZhcmlhbnQgb2ZDaHJpc3RpYW4gdmVyeSBsYXJnZWF1dG9tb3RpdmVieSBmYXIgdGhlcmFuZ2UgZnJvbXB1cnN1aXQgb2Zmb2xsb3cgdGhlYnJvdWdodCB0b2luIEVuZ2xhbmRhZ3JlZSB0aGF0YWNjdXNlZCBvZmNvbWVzIGZyb21wcmV2ZW50aW5nZGl2IHN0eWxlPWhpcyBvciBoZXJ0cmVtZW5kb3VzZnJlZWRvbSBvZmNvbmNlcm5pbmcwIDFlbSAxZW07QmFza2V0YmFsbC9zdHlsZS5jc3NhbiBlYXJsaWVyZXZlbiBhZnRlci8iIHRpdGxlPSIuY29tL2luZGV4dGFraW5nIHRoZXBpdHRzYnVyZ2hjb250ZW50Ij5ccjxzY3JpcHQ+KGZ0dXJuZWQgb3V0aGF2aW5nIHRoZTwvc3Bhbj5ccgogb2NjYXNpb25hbGJlY2F1c2UgaXRzdGFydGVkIHRvcGh5c2ljYWxseT48L2Rpdj4KICBjcmVhdGVkIGJ5Q3VycmVudGx5LCBiZ2NvbG9yPSJ0YWJpbmRleD0iZGlzYXN0cm91c0FuYWx5dGljcyBhbHNvIGhhcyBhPjxkaXYgaWQ9Ijwvc3R5bGU+CjxjYWxsZWQgZm9yc2luZ2VyIGFuZC5zcmMgPSAiLy92aW9sYXRpb25zdGhpcyBwb2ludGNvbnN0YW50bHlpcyBsb2NhdGVkcmVjb3JkaW5nc2QgZnJvbSB0aGVuZWRlcmxhbmRzcG9ydHVndUMqc1ciVxFXKFcZVypZAVgnWDFYM1tcZmRlc2Fycm9sbG9jb21lbnRhcmlvZWR1Y2FjaUMzbnNlcHRpZW1icmVyZWdpc3RyYWRvZGlyZWNjaUMzbnViaWNhY2lDM25wdWJsaWNpZGFkcmVzcHVlc3Rhc3Jlc3VsdGFkb3NpbXBvcnRhbnRlcmVzZXJ2YWRvc2FydEMtY3Vsb3NkaWZlcmVudGVzc2lndWllbnRlc3JlcEM6YmxpY2FzaXR1YWNpQzNubWluaXN0ZXJpb3ByaXZhY2lkYWRkaXJlY3RvcmlvZm9ybWFjaUMzbnBvYmxhY2lDM25wcmVzaWRlbnRlY29udGAsJ2VuaWRvc2FjY2Vzb3Jpb3N0ZWNobm9yYXRpcGVyc29uYWxlc2NhdGVnb3JDLWFlc3BlY2lhbGVzZGlzcG9uaWJsZWFjdHVhbGlkYWRyZWZlcmVuY2lhdmFsbGFkb2xpZGJpYmxpb3RlY2FyZWxhY2lvbmVzY2FsZW5kYXJpb3BvbEMtdGljYXNhbnRlcmlvcmVzZG9jdW1lbnRvc25hdHVyYWxlemFtYXRlcmlhbGVzZGlmZXJlbmNpYWVjb25DM21pY2F0cmFuc3BvcnRlcm9kckMtZ3VlenBhcnRpY2lwYXJlbmN1ZW50cmFuZGlzY3VzaUMzbmVzdHJ1Y3R1cmFmdW5kYWNpQzNuZnJlY3VlbnRlc3Blcm1hbmVudGV0b3RhbG1lbnRlUDxQPlA2UD1QPlAxUQNQNFA1UQJQPFA+UDZQNVECUDJRXDBQNVA8UQ9RAlAwUDpQNlA1UVx4MDdRAlA+UDFRXHZQMVA+UDtQNVA1UD5RXHgwN1A1UD1RXGZR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WQVZAlhcJ1g3WDlZBVgxWFwnWDNZBFkFWQZYN1kCWClYXCdZBFkDWCpYKFhcJ1kEWDFYLFkEWFwnWDRYKlgxWQNYXCdZBFkCWC9ZBVlcblg5WDdZXG5ZA3NCeVRhZ05hbWUoLmpwZyIgYWx0PSIxcHggc29saWQgIy5naWYiIGFsdD0idHJhbnNwYXJlbnRpbmZvcm1hdGlvbmFwcGxpY2F0aW9uIiBvbmNsaWNrPSJlc3RhYmxpc2hlZGFkdmVydGlzaW5nLnBuZyIgYWx0PSJlbnZpcm9ubWVudHBlcmZvcm1hbmNlYXBwcm9wcmlhdGUmYW1wO21kYXNoO2ltbWVkaWF0ZWx5PC9zdHJvbmc+PC9yYXRoZXIgdGhhbnRlbXBlcmF0dXJlZGV2ZWxvcG1lbnRjb21wZXRpdGlvbnBsYWNlaG9sZGVydmlzaWJpbGl0eTpjb3B5cmlnaHQiPjAiIGhlaWdodD0iZXZlbiB0aG91Z2hyZXBsYWNlbWVudGRlc3RpbmF0aW9uQ29ycG9yYXRpb248dWwgY2xhc3M9IkFzc29jaWF0aW9uaW5kaXZpZHVhbHNwZXJzcGVjdGl2ZXNldFRpbWVvdXQodXJsKGh0dHA6Ly9tYXRoZW1hdGljc21hcmdpbi10b3A6ZXZlbnR1YWxseSBkZXNjcmlwdGlvbikgbm8tcmVwZWF0Y29sbGVjdGlvbnMuSlBHfHRodW1ifHBhcnRpY2lwYXRlL2hlYWQ+PGJvZHlmbG9hdDpsZWZ0OzxsaSBjbGFzcz0iaHVuZHJlZHMgb2ZcblxuSG93ZXZlciwgY29tcG9zaXRpb25jbGVhcjpib3RoO2Nvb3BlcmF0aW9ud2l0aGluIHRoZSBsYWJlbCBmb3I9ImJvcmRlci10b3A6TmV3IFplYWxhbmRyZWNvbW1lbmRlZHBob3RvZ3JhcGh5aW50ZXJlc3RpbmcmbHQ7c3VwJmd0O2NvbnRyb3ZlcnN5TmV0aGVybGFuZHNhbHRlcm5hdGl2ZW1heGxlbmd0aD0ic3dpdHplcmxhbmREZXZlbG9wbWVudGVzc2VudGlhbGx5XG5cbkFsdGhvdWdoIDwvdGV4dGFyZWE+dGh1bmRlcmJpcmRyZXByZXNlbnRlZCZhbXA7bmRhc2g7c3BlY3VsYXRpb25jb21tdW5pdGllc2xlZ2lzbGF0aW9uZWxlY3Ryb25pY3Ncbgk8ZGl2IGlkPSJpbGx1c3RyYXRlZGVuZ2luZWVyaW5ndGVycml0b3JpZXNhdXRob3JpdGllc2Rpc3RyaWJ1dGVkNiIgaGVpZ2h0PSJzYW5zLXNlcmlmO2NhcGFibGUgb2YgZGlzYXBwZWFyZWRpbnRlcmFjdGl2ZWxvb2tpbmcgZm9yaXQgd291bGQgYmVBZmdoYW5pc3RhbndhcyBjcmVhdGVkTWF0aC5mbG9vcihzdXJyb3VuZGluZ2NhbiBhbHNvIGJlb2JzZXJ2YXRpb25tYWludGVuYW5jZWVuY291bnRlcmVkPGgyIGNsYXNzPSJtb3JlIHJlY2VudGl0IGhhcyBiZWVuaW52YXNpb24gb2YpLmdldFRpbWUoKWZ1bmRhbWVudGFsRGVzcGl0ZSB0aGUiPjxkaXYgaWQ9Imluc3BpcmF0aW9uZXhhbWluYXRpb25wcmVwYXJhdGlvbmV4cGxhbmF0aW9uPGlucHV0IGlkPSI8L2E+PC9zcGFuPnZlcnNpb25zIG9maW5zdHJ1bWVudHNiZWZvcmUgdGhlICA9IFwnaHR0cDovL0Rlc2NyaXB0aW9ucmVsYXRpdmVseSAuc3Vic3RyaW5nKGVhY2ggb2YgdGhlZXhwZXJpbWVudHNpbmZsdWVudGlhbGludGVncmF0aW9ubWFueSBwZW9wbGVkdWUgdG8gdGhlIGNvbWJpbmF0aW9uZG8gbm90IGhhdmVNaWRkbGUgRWFzdDxub3NjcmlwdD48Y29weXJpZ2h0IiBwZXJoYXBzIHRoZWluc3RpdHV0aW9uaW4gRGVjZW1iZXJhcnJhbmdlbWVudG1vc3QgZmFtb3VzcGVyc29uYWxpdHljcmVhdGlvbiBvZmxpbWl0YXRpb25zZXhjbHVzaXZlbHlzb3ZlcmVpZ250eS1jb250ZW50Ij5cbjx0ZCBjbGFzcz0idW5kZXJncm91bmRwYXJhbGxlbCB0b2RvY3RyaW5lIG9mb2NjdXBpZWQgYnl0ZXJtaW5vbG9neVJlbmFpc3NhbmNlYSBudW1iZXIgb2ZzdXBwb3J0IGZvcmV4cGxvcmF0aW9ucmVjb2duaXRpb25wcmVkZWNlc3NvcjxpbWcgc3JjPSIvPGgxIGNsYXNzPSJwdWJsaWNhdGlvbm1heSBhbHNvIGJlc3BlY2lhbGl6ZWQ8L2ZpZWxkc2V0PnByb2dyZXNzaXZlbWlsbGlvbnMgb2ZzdGF0ZXMgdGhhdGVuZm9yY2VtZW50YXJvdW5kIHRoZSBvbmUgYW5vdGhlci5wYXJlbnROb2RlYWdyaWN1bHR1cmVBbHRlcm5hdGl2ZXJlc2VhcmNoZXJzdG93YXJkcyB0aGVNb3N0IG9mIHRoZW1hbnkgb3RoZXIgKGVzcGVjaWFsbHk8dGQgd2lkdGg9Ijt3aWR0aDoxMDAlaW5kZXBlbmRlbnQ8aDMgY2xhc3M9IiBvbmNoYW5nZT0iKS5hZGRDbGFzcyhpbnRlcmFjdGlvbk9uZSBvZiB0aGUgZGF1Z2h0ZXIgb2ZhY2Nlc3Nvcmllc2JyYW5jaGVzIG9mXHJcbjxkaXYgaWQ9InRoZSBsYXJnZXN0ZGVjbGFyYXRpb25yZWd1bGF0aW9uc0luZm9ybWF0aW9udHJhbnNsYXRpb25kb2N1bWVudGFyeWluIG9yZGVyIHRvIj5cbjxoZWFkPlxuPCIgaGVpZ2h0PSIxYWNyb3NzIHRoZSBvcmllbnRhdGlvbik7PFwvc2NyaXB0PmltcGxlbWVudGVkY2FuIGJlIHNlZW50aGVyZSB3YXMgYWRlbW9uc3RyYXRlY29udGFpbmVyIj5jb25uZWN0aW9uc3RoZSBCcml0aXNod2FzIHdyaXR0ZW4haW1wb3J0YW50O3B4OyBtYXJnaW4tZm9sbG93ZWQgYnlhYmlsaXR5IHRvIGNvbXBsaWNhdGVkZHVyaW5nIHRoZSBpbW1pZ3JhdGlvbmFsc28gY2FsbGVkPGg0IGNsYXNzPSJkaXN0aW5jdGlvbnJlcGxhY2VkIGJ5Z292ZXJubWVudHNsb2NhdGlvbiBvZmluIE5vdmVtYmVyd2hldGhlciB0aGU8L3A+XG48L2Rpdj5hY3F1aXNpdGlvbmNhbGxlZCB0aGUgcGVyc2VjdXRpb25kZXNpZ25hdGlvbntmb250LXNpemU6YXBwZWFyZWQgaW5pbnZlc3RpZ2F0ZWV4cGVyaWVuY2VkbW9zdCBsaWtlbHl3aWRlbHkgdXNlZGRpc2N1c3Npb25zcHJlc2VuY2Ugb2YgKGRvY3VtZW50LmV4dGVuc2l2ZWx5SXQgaGFzIGJlZW5pdCBkb2VzIG5vdGNvbnRyYXJ5IHRvaW5oYWJpdGFudHNpbXByb3ZlbWVudHNjaG9sYXJzaGlwY29uc3VtcHRpb25pbnN0cnVjdGlvbmZvciBleGFtcGxlb25lIG9yIG1vcmVweDsgcGFkZGluZ3RoZSBjdXJyZW50YSBzZXJpZXMgb2ZhcmUgdXN1YWxseXJvbGUgaW4gdGhlcHJldmlvdXNseSBkZXJpdmF0aXZlc2V2aWRlbmNlIG9mZXhwZXJpZW5jZXNjb2xvcnNjaGVtZXN0YXRlZCB0aGF0Y2VydGlmaWNhdGU8L2E+PC9kaXY+XG4gc2VsZWN0ZWQ9ImhpZ2ggc2Nob29scmVzcG9uc2UgdG9jb21mb3J0YWJsZWFkb3B0aW9uIG9mdGhyZWUgeWVhcnN0aGUgY291bnRyeWluIEZlYnJ1YXJ5c28gdGhhdCB0aGVwZW9wbGUgd2hvIHByb3ZpZGVkIGJ5PHBhcmFtIG5hbWVhZmZlY3RlZCBieWluIHRlcm1zIG9mYXBwb2ludG1lbnRJU08tODg1OS0xIndhcyBib3JuIGluaGlzdG9yaWNhbCByZWdhcmRlZCBhc21lYXN1cmVtZW50aXMgYmFzZWQgb24gYW5kIG90aGVyIDogZnVuY3Rpb24oc2lnbmlmaWNhbnRjZWxlYnJhdGlvbnRyYW5zbWl0dGVkL2pzL2pxdWVyeS5pcyBrbm93biBhc3RoZW9yZXRpY2FsIHRhYmluZGV4PSJpdCBjb3VsZCBiZTxub3NjcmlwdD5cbmhhdmluZyBiZWVuXHJcbjxoZWFkPlxyXG48ICZxdW90O1RoZSBjb21waWxhdGlvbmhlIGhhZCBiZWVucHJvZHVjZWQgYnlwaGlsb3NvcGhlcmNvbnN0cnVjdGVkaW50ZW5kZWQgdG9hbW9uZyBvdGhlcmNvbXBhcmVkIHRvdG8gc2F5IHRoYXRFbmdpbmVlcmluZ2EgZGlmZmVyZW50cmVmZXJyZWQgdG9kaWZmZXJlbmNlc2JlbGllZiB0aGF0cGhvdG9ncmFwaHNpZGVudGlmeWluZ0hpc3Rvcnkgb2YgUmVwdWJsaWMgb2ZuZWNlc3NhcmlseXByb2JhYmlsaXR5dGVjaG5pY2FsbHlsZWF2aW5nIHRoZXNwZWN0YWN1bGFyZnJhY3Rpb24gb2ZlbGVjdHJpY2l0eWhlYWQgb2YgdGhlcmVzdGF1cmFudHNwYXJ0bmVyc2hpcGVtcGhhc2lzIG9ubW9zdCByZWNlbnRzaGFyZSB3aXRoIHNheWluZyB0aGF0ZmlsbGVkIHdpdGhkZXNpZ25lZCB0b2l0IGlzIG9mdGVuIj48L2lmcmFtZT5hcyBmb2xsb3dzOm1lcmdlZCB3aXRodGhyb3VnaCB0aGVjb21tZXJjaWFsIHBvaW50ZWQgb3V0b3Bwb3J0dW5pdHl2aWV3IG9mIHRoZXJlcXVpcmVtZW50ZGl2aXNpb24gb2Zwcm9ncmFtbWluZ2hlIHJlY2VpdmVkc2V0SW50ZXJ2YWwiPjwvc3Bhbj48L2luIE5ldyBZb3JrYWRkaXRpb25hbCBjb21wcmVzc2lvblxuXG48ZGl2IGlkPSJpbmNvcnBvcmF0ZTs8XC9zY3JpcHQ+PGF0dGFjaEV2ZW50YmVjYW1lIHRoZSAiIHRhcmdldD0iX2NhcnJpZWQgb3V0U29tZSBvZiB0aGVzY2llbmNlIGFuZHRoZSB0aW1lIG9mQ29udGFpbmVyIj5tYWludGFpbmluZ0NocmlzdG9waGVyTXVjaCBvZiB0aGV3cml0aW5ncyBvZiIgaGVpZ2h0PSIyc2l6ZSBvZiB0aGV2ZXJzaW9uIG9mIG1peHR1cmUgb2YgYmV0d2VlbiB0aGVFeGFtcGxlcyBvZmVkdWNhdGlvbmFsY29tcGV0aXRpdmUgb25zdWJtaXQ9ImRpcmVjdG9yIG9mZGlzdGluY3RpdmUvRFREIFhIVE1MIHJlbGF0aW5nIHRvdGVuZGVuY3kgdG9wcm92aW5jZSBvZndoaWNoIHdvdWxkZGVzcGl0ZSB0aGVzY2llbnRpZmljIGxlZ2lzbGF0dXJlLmlubmVySFRNTCBhbGxlZ2F0aW9uc0FncmljdWx0dXJld2FzIHVzZWQgaW5hcHByb2FjaCB0b2ludGVsbGlnZW50eWVhcnMgbGF0ZXIsc2Fucy1zZXJpZmRldGVybWluaW5nUGVyZm9ybWFuY2VhcHBlYXJhbmNlcywgd2hpY2ggaXMgZm91bmRhdGlvbnNhYmJyZXZpYXRlZGhpZ2hlciB0aGFucyBmcm9tIHRoZSBpbmRpdmlkdWFsIGNvbXBvc2VkIG9mc3VwcG9zZWQgdG9jbGFpbXMgdGhhdGF0dHJpYnV0aW9uZm9udC1zaXplOjFlbGVtZW50cyBvZkhpc3RvcmljYWwgaGlzIGJyb3RoZXJhdCB0aGUgdGltZWFubml2ZXJzYXJ5Z292ZXJuZWQgYnlyZWxhdGVkIHRvIHVsdGltYXRlbHkgaW5ub3ZhdGlvbnNpdCBpcyBzdGlsbGNhbiBvbmx5IGJlZGVmaW5pdGlvbnN0b0dNVFN0cmluZ0EgbnVtYmVyIG9maW1nIGNsYXNzPSJFdmVudHVhbGx5LHdhcyBjaGFuZ2Vkb2NjdXJyZWQgaW5uZWlnaGJvcmluZ2Rpc3Rpbmd1aXNod2hlbiBoZSB3YXNpbnRyb2R1Y2luZ3RlcnJlc3RyaWFsTWFueSBvZiB0aGVhcmd1ZXMgdGhhdGFuIEFtZXJpY2FuY29ucXVlc3Qgb2Z3aWRlc3ByZWFkIHdlcmUga2lsbGVkc2NyZWVuIGFuZCBJbiBvcmRlciB0b2V4cGVjdGVkIHRvZGVzY2VuZGFudHNhcmUgbG9jYXRlZGxlZ2lzbGF0aXZlZ2VuZXJhdGlvbnMgYmFja2dyb3VuZG1vc3QgcGVvcGxleWVhcnMgYWZ0ZXJ0aGVyZSBpcyBub3RoZSBoaWdoZXN0ZnJlcXVlbnRseSB0aGV5IGRvIG5vdGFyZ3VlZCB0aGF0c2hvd2VkIHRoYXRwcmVkb21pbmFudHRoZW9sb2dpY2FsYnkgdGhlIHRpbWVjb25zaWRlcmluZ3Nob3J0LWxpdmVkPC9zcGFuPjwvYT5jYW4gYmUgdXNlZHZlcnkgbGl0dGxlb25lIG9mIHRoZSBoYWQgYWxyZWFkeWludGVycHJldGVkY29tbXVuaWNhdGVmZWF0dXJlcyBvZmdvdmVybm1lbnQsPC9ub3NjcmlwdD5lbnRlcmVkIHRoZSIgaGVpZ2h0PSIzSW5kZXBlbmRlbnRwb3B1bGF0aW9uc2xhcmdlLXNjYWxlLiBBbHRob3VnaCB1c2VkIGluIHRoZWRlc3RydWN0aW9ucG9zc2liaWxpdHlzdGFydGluZyBpbnR3byBvciBtb3JlZXhwcmVzc2lvbnNzdWJvcmRpbmF0ZWxhcmdlciB0aGFuaGlzdG9yeSBhbmQ8L29wdGlvbj5cclxuQ29udGluZW50YWxlbGltaW5hdGluZ3dpbGwgbm90IGJlcHJhY3RpY2Ugb2ZpbiBmcm9udCBvZnNpdGUgb2YgdGhlZW5zdXJlIHRoYXR0byBjcmVhdGUgYW1pc3Npc3NpcHBpcG90ZW50aWFsbHlvdXRzdGFuZGluZ2JldHRlciB0aGFud2hhdCBpcyBub3dzaXR1YXRlZCBpbm1ldGEgbmFtZT0iVHJhZGl0aW9uYWxzdWdnZXN0aW9uc1RyYW5zbGF0aW9udGhlIGZvcm0gb2ZhdG1vc3BoZXJpY2lkZW9sb2dpY2FsZW50ZXJwcmlzZXNjYWxjdWxhdGluZ2Vhc3Qgb2YgdGhlcmVtbmFudHMgb2ZwbHVnaW5zcGFnZS9pbmRleC5waHA/cmVtYWluZWQgaW50cmFuc2Zvcm1lZEhlIHdhcyBhbHNvd2FzIGFscmVhZHlzdGF0aXN0aWNhbGluIGZhdm9yIG9mTWluaXN0cnkgb2Ztb3ZlbWVudCBvZmZvcm11bGF0aW9uaXMgcmVxdWlyZWQ8bGluayByZWw9IlRoaXMgaXMgdGhlIDxhIGhyZWY9Ii9wb3B1bGFyaXplZGludm9sdmVkIGluYXJlIHVzZWQgdG9hbmQgc2V2ZXJhbG1hZGUgYnkgdGhlc2VlbXMgdG8gYmVsaWtlbHkgdGhhdFBhbGVzdGluaWFubmFtZWQgYWZ0ZXJpdCBoYWQgYmVlbm1vc3QgY29tbW9udG8gcmVmZXIgdG9idXQgdGhpcyBpc2NvbnNlY3V0aXZldGVtcG9yYXJpbHlJbiBnZW5lcmFsLGNvbnZlbnRpb25zdGFrZXMgcGxhY2VzdWJkaXZpc2lvbnRlcnJpdG9yaWFsb3BlcmF0aW9uYWxwZXJtYW5lbnRseXdhcyBsYXJnZWx5b3V0YnJlYWsgb2ZpbiB0aGUgcGFzdGZvbGxvd2luZyBhIHhtbG5zOm9nPSI+PGEgY2xhc3M9ImNsYXNzPSJ0ZXh0Q29udmVyc2lvbiBtYXkgYmUgdXNlZG1hbnVmYWN0dXJlYWZ0ZXIgYmVpbmdjbGVhcmZpeCI+XG5xdWVzdGlvbiBvZndhcyBlbGVjdGVkdG8gYmVjb21lIGFiZWNhdXNlIG9mIHNvbWUgcGVvcGxlaW5zcGlyZWQgYnlzdWNjZXNzZnVsIGEgdGltZSB3aGVubW9yZSBjb21tb25hbW9uZ3N0IHRoZWFuIG9mZmljaWFsd2lkdGg6MTAwJTt0ZWNobm9sb2d5LHdhcyBhZG9wdGVkdG8ga2VlcCB0aGVzZXR0bGVtZW50c2xpdmUgYmlydGhzaW5kZXguaHRtbCJDb25uZWN0aWN1dGFzc2lnbmVkIHRvJmFtcDt0aW1lczthY2NvdW50IGZvcmFsaWduPXJpZ2h0dGhlIGNvbXBhbnlhbHdheXMgYmVlbnJldHVybmVkIHRvaW52b2x2ZW1lbnRCZWNhdXNlIHRoZXRoaXMgcGVyaW9kIiBuYW1lPSJxIiBjb25maW5lZCB0b2EgcmVzdWx0IG9mdmFsdWU9IiIgLz5pcyBhY3R1YWxseUVudmlyb25tZW50XHJcbjwvaGVhZD5cclxuQ29udmVyc2VseSw+XG48ZGl2IGlkPSIwIiB3aWR0aD0iMWlzIHByb2JhYmx5aGF2ZSBiZWNvbWVjb250cm9sbGluZ3RoZSBwcm9ibGVtY2l0aXplbnMgb2Zwb2xpdGljaWFuc3JlYWNoZWQgdGhlYXMgZWFybHkgYXM6bm9uZTsgb3Zlcjx0YWJsZSBjZWxsdmFsaWRpdHkgb2ZkaXJlY3RseSB0b29ubW91c2Vkb3dud2hlcmUgaXQgaXN3aGVuIGl0IHdhc21lbWJlcnMgb2YgcmVsYXRpb24gdG9hY2NvbW1vZGF0ZWFsb25nIHdpdGggSW4gdGhlIGxhdGV0aGUgRW5nbGlzaGRlbGljaW91cyI+dGhpcyBpcyBub3R0aGUgcHJlc2VudGlmIHRoZXkgYXJlYW5kIGZpbmFsbHlhIG1hdHRlciBvZlxyXG4JPC9kaXY+XHJcblxyXG48XC9zY3JpcHQ+ZmFzdGVyIHRoYW5tYWpvcml0eSBvZmFmdGVyIHdoaWNoY29tcGFyYXRpdmV0byBtYWludGFpbmltcHJvdmUgdGhlYXdhcmRlZCB0aGVlciIgY2xhc3M9ImZyYW1lYm9yZGVycmVzdG9yYXRpb25pbiB0aGUgc2FtZWFuYWx5c2lzIG9mdGhlaXIgZmlyc3REdXJpbmcgdGhlIGNvbnRpbmVudGFsc2VxdWVuY2Ugb2ZmdW5jdGlvbigpe2ZvbnQtc2l6ZTogd29yayBvbiB0aGU8XC9zY3JpcHQ+XG48YmVnaW5zIHdpdGhqYXZhc2NyaXB0OmNvbnN0aXR1ZW50d2FzIGZvdW5kZWRlcXVpbGlicml1bWFzc3VtZSB0aGF0aXMgZ2l2ZW4gYnluZWVkcyB0byBiZWNvb3JkaW5hdGVzdGhlIHZhcmlvdXNhcmUgcGFydCBvZm9ubHkgaW4gdGhlc2VjdGlvbnMgb2ZpcyBhIGNvbW1vbnRoZW9yaWVzIG9mZGlzY292ZXJpZXNhc3NvY2lhdGlvbmVkZ2Ugb2YgdGhlc3RyZW5ndGggb2Zwb3NpdGlvbiBpbnByZXNlbnQtZGF5dW5pdmVyc2FsbHl0byBmb3JtIHRoZWJ1dCBpbnN0ZWFkY29ycG9yYXRpb25hdHRhY2hlZCB0b2lzIGNvbW1vbmx5cmVhc29ucyBmb3IgJnF1b3Q7dGhlIGNhbiBiZSBtYWRld2FzIGFibGUgdG93aGljaCBtZWFuc2J1dCBkaWQgbm90b25Nb3VzZU92ZXJhcyBwb3NzaWJsZW9wZXJhdGVkIGJ5Y29taW5nIGZyb210aGUgcHJpbWFyeWFkZGl0aW9uIG9mZm9yIHNldmVyYWx0cmFuc2ZlcnJlZGEgcGVyaW9kIG9mYXJlIGFibGUgdG9ob3dldmVyLCBpdHNob3VsZCBoYXZlbXVjaCBsYXJnZXJcbgk8XC9zY3JpcHQ+YWRvcHRlZCB0aGVwcm9wZXJ0eSBvZmRpcmVjdGVkIGJ5ZWZmZWN0aXZlbHl3YXMgYnJvdWdodGNoaWxkcmVuIG9mUHJvZ3JhbW1pbmdsb25nZXIgdGhhbm1hbnVzY3JpcHRzd2FyIGFnYWluc3RieSBtZWFucyBvZmFuZCBtb3N0IG9mc2ltaWxhciB0byBwcm9wcmlldGFyeW9yaWdpbmF0aW5ncHJlc3RpZ2lvdXNncmFtbWF0aWNhbGV4cGVyaWVuY2UudG8gbWFrZSB0aGVJdCB3YXMgYWxzb2lzIGZvdW5kIGluY29tcGV0aXRvcnNpbiB0aGUgVS5TLnJlcGxhY2UgdGhlYnJvdWdodCB0aGVjYWxjdWxhdGlvbmZhbGwgb2YgdGhldGhlIGdlbmVyYWxwcmFjdGljYWxseWluIGhvbm9yIG9mcmVsZWFzZWQgaW5yZXNpZGVudGlhbGFuZCBzb21lIG9ma2luZyBvZiB0aGVyZWFjdGlvbiB0bzFzdCBFYXJsIG9mY3VsdHVyZSBhbmRwcmluY2lwYWxseTwvdGl0bGU+XG4gIHRoZXkgY2FuIGJlYmFjayB0byB0aGVzb21lIG9mIGhpc2V4cG9zdXJlIHRvYXJlIHNpbWlsYXJmb3JtIG9mIHRoZWFkZEZhdm9yaXRlY2l0aXplbnNoaXBwYXJ0IGluIHRoZXBlb3BsZSB3aXRoaW4gcHJhY3RpY2V0byBjb250aW51ZSZhbXA7bWludXM7YXBwcm92ZWQgYnkgdGhlIGZpcnN0IGFsbG93ZWQgdGhlYW5kIGZvciB0aGVmdW5jdGlvbmluZ3BsYXlpbmcgdGhlc29sdXRpb24gdG9oZWlnaHQ9IjAiIGluIGhpcyBib29rbW9yZSB0aGFuIGFmb2xsb3dzIHRoZWNyZWF0ZWQgdGhlcHJlc2VuY2UgaW4mbmJzcDs8L3RkPm5hdGlvbmFsaXN0dGhlIGlkZWEgb2ZhIGNoYXJhY3RlcndlcmUgZm9yY2VkIGNsYXNzPSJidG5kYXlzIG9mIHRoZWZlYXR1cmVkIGluc2hvd2luZyB0aGVpbnRlcmVzdCBpbmluIHBsYWNlIG9mdHVybiBvZiB0aGV0aGUgaGVhZCBvZkxvcmQgb2YgdGhlcG9saXRpY2FsbHloYXMgaXRzIG93bkVkdWNhdGlvbmFsYXBwcm92YWwgb2Zzb21lIG9mIHRoZWVhY2ggb3RoZXIsYmVoYXZpb3Igb2ZhbmQgYmVjYXVzZWFuZCBhbm90aGVyYXBwZWFyZWQgb25yZWNvcmRlZCBpbmJsYWNrJnF1b3Q7bWF5IGluY2x1ZGV0aGUgd29ybGRcJ3NjYW4gbGVhZCB0b3JlZmVycyB0byBhYm9yZGVyPSIwIiBnb3Zlcm5tZW50IHdpbm5pbmcgdGhlcmVzdWx0ZWQgaW4gd2hpbGUgdGhlIFdhc2hpbmd0b24sdGhlIHN1YmplY3RjaXR5IGluIHRoZT48L2Rpdj5cclxuCQlyZWZsZWN0IHRoZXRvIGNvbXBsZXRlYmVjYW1lIG1vcmVyYWRpb2FjdGl2ZXJlamVjdGVkIGJ5d2l0aG91dCBhbnloaXMgZmF0aGVyLHdoaWNoIGNvdWxkY29weSBvZiB0aGV0byBpbmRpY2F0ZWEgcG9saXRpY2FsYWNjb3VudHMgb2Zjb25zdGl0dXRlc3dvcmtlZCB3aXRoZXI8L2E+PC9saT5vZiBoaXMgbGlmZWFjY29tcGFuaWVkY2xpZW50V2lkdGhwcmV2ZW50IHRoZUxlZ2lzbGF0aXZlZGlmZmVyZW50bHl0b2dldGhlciBpbmhhcyBzZXZlcmFsZm9yIGFub3RoZXJ0ZXh0IG9mIHRoZWZvdW5kZWQgdGhlZSB3aXRoIHRoZSBpcyB1c2VkIGZvcmNoYW5nZWQgdGhldXN1YWxseSB0aGVwbGFjZSB3aGVyZXdoZXJlYXMgdGhlPiA8YSBocmVmPSIiPjxhIGhyZWY9InRoZW1zZWx2ZXMsYWx0aG91Z2ggaGV0aGF0IGNhbiBiZXRyYWRpdGlvbmFscm9sZSBvZiB0aGVhcyBhIHJlc3VsdHJlbW92ZUNoaWxkZGVzaWduZWQgYnl3ZXN0IG9mIHRoZVNvbWUgcGVvcGxlcHJvZHVjdGlvbixzaWRlIG9mIHRoZW5ld3NsZXR0ZXJzdXNlZCBieSB0aGVkb3duIHRvIHRoZWFjY2VwdGVkIGJ5bGl2ZSBpbiB0aGVhdHRlbXB0cyB0b291dHNpZGUgdGhlZnJlcXVlbmNpZXNIb3dldmVyLCBpbnByb2dyYW1tZXJzYXQgbGVhc3QgaW5hcHByb3hpbWF0ZWFsdGhvdWdoIGl0d2FzIHBhcnQgb2ZhbmQgdmFyaW91c0dvdmVybm9yIG9mdGhlIGFydGljbGV0dXJuZWQgaW50bz48YSBocmVmPSIvdGhlIGVjb25vbXlpcyB0aGUgbW9zdG1vc3Qgd2lkZWx5d291bGQgbGF0ZXJhbmQgcGVyaGFwc3Jpc2UgdG8gdGhlb2NjdXJzIHdoZW51bmRlciB3aGljaGNvbmRpdGlvbnMudGhlIHdlc3Rlcm50aGVvcnkgdGhhdGlzIHByb2R1Y2VkdGhlIGNpdHkgb2ZpbiB3aGljaCBoZXNlZW4gaW4gdGhldGhlIGNlbnRyYWxidWlsZGluZyBvZm1hbnkgb2YgaGlzYXJlYSBvZiB0aGVpcyB0aGUgb25seW1vc3Qgb2YgdGhlbWFueSBvZiB0aGV0aGUgV2VzdGVyblRoZXJlIGlzIG5vZXh0ZW5kZWQgdG9TdGF0aXN0aWNhbGNvbHNwYW49MiB8c2hvcnQgc3Rvcnlwb3NzaWJsZSB0b3RvcG9sb2dpY2FsY3JpdGljYWwgb2ZyZXBvcnRlZCB0b2EgQ2hyaXN0aWFuZGVjaXNpb24gdG9pcyBlcXVhbCB0b3Byb2JsZW1zIG9mVGhpcyBjYW4gYmVtZXJjaGFuZGlzZWZvciBtb3N0IG9mbm8gZXZpZGVuY2VlZGl0aW9ucyBvZmVsZW1lbnRzIGluJnF1b3Q7LiBUaGVjb20vaW1hZ2VzL3doaWNoIG1ha2VzdGhlIHByb2Nlc3NyZW1haW5zIHRoZWxpdGVyYXR1cmUsaXMgYSBtZW1iZXJ0aGUgcG9wdWxhcnRoZSBhbmNpZW50cHJvYmxlbXMgaW50aW1lIG9mIHRoZWRlZmVhdGVkIGJ5Ym9keSBvZiB0aGVhIGZldyB5ZWFyc211Y2ggb2YgdGhldGhlIHdvcmsgb2ZDYWxpZm9ybmlhLHNlcnZlZCBhcyBhZ292ZXJubWVudC5jb25jZXB0cyBvZm1vdmVtZW50IGluCQk8ZGl2IGlkPSJpdCIgdmFsdWU9Imxhbmd1YWdlIG9mYXMgdGhleSBhcmVwcm9kdWNlZCBpbmlzIHRoYXQgdGhlZXhwbGFpbiB0aGVkaXY+PC9kaXY+XG5Ib3dldmVyIHRoZWxlYWQgdG8gdGhlCTxhIGhyZWY9Ii93YXMgZ3JhbnRlZHBlb3BsZSBoYXZlY29udGludWFsbHl3YXMgc2VlbiBhc2FuZCByZWxhdGVkdGhlIHJvbGUgb2Zwcm9wb3NlZCBieW9mIHRoZSBiZXN0ZWFjaCBvdGhlci5Db25zdGFudGluZXBlb3BsZSBmcm9tZGlhbGVjdHMgb2Z0byByZXZpc2lvbndhcyByZW5hbWVkYSBzb3VyY2Ugb2Z0aGUgaW5pdGlhbGxhdW5jaGVkIGlucHJvdmlkZSB0aGV0byB0aGUgd2VzdHdoZXJlIHRoZXJlYW5kIHNpbWlsYXJiZXR3ZWVuIHR3b2lzIGFsc28gdGhlRW5nbGlzaCBhbmRjb25kaXRpb25zLHRoYXQgaXQgd2FzZW50aXRsZWQgdG90aGVtc2VsdmVzLnF1YW50aXR5IG9mcmFuc3BhcmVuY3l0aGUgc2FtZSBhc3RvIGpvaW4gdGhlY291bnRyeSBhbmR0aGlzIGlzIHRoZVRoaXMgbGVkIHRvYSBzdGF0ZW1lbnRjb250cmFzdCB0b2xhc3RJbmRleE9mdGhyb3VnaCBoaXNpcyBkZXNpZ25lZHRoZSB0ZXJtIGlzaXMgcHJvdmlkZWRwcm90ZWN0IHRoZW5nPC9hPjwvbGk+VGhlIGN1cnJlbnR0aGUgc2l0ZSBvZnN1YnN0YW50aWFsZXhwZXJpZW5jZSxpbiB0aGUgV2VzdHRoZXkgc2hvdWxkc2xvdmVuRFxyaW5hY29tZW50YXJpb3N1bml2ZXJzaWRhZGNvbmRpY2lvbmVzYWN0aXZpZGFkZXNleHBlcmllbmNpYXRlY25vbG9nQy1hcHJvZHVjY2lDM25wdW50dWFjaUMzbmFwbGljYWNpQzNuY29udHJhc2VDMWFjYXRlZ29yQy1hc3JlZ2lzdHJhcnNlcHJvZmVzaW9uYWx0cmF0YW1pZW50b3JlZ0Mtc3RyYXRlc2VjcmV0YXJDLWFwcmluY2lwYWxlc3Byb3RlY2NpQzNuaW1wb3J0YW50ZXNpbXBvcnRhbmNpYXBvc2liaWxpZGFkaW50ZXJlc2FudGVjcmVjaW1pZW50b25lY2VzaWRhZGVzc3VzY3JpYmlyc2Vhc29jaWFjaUMzbmRpc3BvbmlibGVzZXZhbHVhY2lDM25lc3R1ZGlhbnRlc3Jlc3BvbnNhYmxlcmVzb2x1Y2lDM25ndWFkYWxhamFyYXJlZ2lzdHJhZG9zb3BvcnR1bmlkYWRjb21lcmNpYWxlc2ZvdG9ncmFmQy1hYXV0b3JpZGFkZXNpbmdlbmllckMtYXRlbGV2aXNpQzNuY29tcGV0ZW5jaWFvcGVyYWNpb25lc2VzdGFibGVjaWRvc2ltcGxlbWVudGVhY3R1YWxtZW50ZW5hdmVnYWNpQzNuY29uZm9ybWlkYWRsaW5lLWhlaWdodDpmb250LWZhbWlseToiIDogImh0dHA6Ly9hcHBsaWNhdGlvbnNsaW5rIiBocmVmPSJzcGVjaWZpY2FsbHkvLzwhW0NEQVRBW1xuT3JnYW5pemF0aW9uZGlzdHJpYnV0aW9uMHB4OyBoZWlnaHQ6cmVsYXRpb25zaGlwZGV2aWNlLXdpZHRoPGRpdiBjbGFzcz0iPGxhYmVsIGZvcj0icmVnaXN0cmF0aW9uPC9ub3NjcmlwdD5cbi9pbmRleC5odG1sIndpbmRvdy5vcGVuKCAhaW1wb3J0YW50O2FwcGxpY2F0aW9uL2luZGVwZW5kZW5jZS8vd3d3Lmdvb2dsZW9yZ2FuaXphdGlvbmF1dG9jb21wbGV0ZXJlcXVpcmVtZW50c2NvbnNlcnZhdGl2ZTxmb3JtIG5hbWU9ImludGVsbGVjdHVhbG1hcmdpbi1sZWZ0OjE4dGggY2VudHVyeWFuIGltcG9ydGFudGluc3RpdHV0aW9uc2FiYnJldmlhdGlvbjxpbWcgY2xhc3M9Im9yZ2FuaXNhdGlvbmNpdmlsaXphdGlvbjE5dGggY2VudHVyeWFyY2hpdGVjdHVyZWluY29ycG9yYXRlZDIwdGggY2VudHVyeS1jb250YWluZXIiPm1vc3Qgbm90YWJseS8+PC9hPjwvZGl2Pm5vdGlmaWNhdGlvblwndW5kZWZpbmVkXCcpRnVydGhlcm1vcmUsYmVsaWV2ZSB0aGF0aW5uZXJIVE1MID0gcHJpb3IgdG8gdGhlZHJhbWF0aWNhbGx5cmVmZXJyaW5nIHRvbmVnb3RpYXRpb25zaGVhZHF1YXJ0ZXJzU291dGggQWZyaWNhdW5zdWNjZXNzZnVsUGVubnN5bHZhbmlhQXMgYSByZXN1bHQsPGh0bWwgbGFuZz0iJmx0Oy9zdXAmZ3Q7ZGVhbGluZyB3aXRocGhpbGFkZWxwaGlhaGlzdG9yaWNhbGx5KTs8XC9zY3JpcHQ+XG5wYWRkaW5nLXRvcDpleHBlcmltZW50YWxnZXRBdHRyaWJ1dGVpbnN0cnVjdGlvbnN0ZWNobm9sb2dpZXNwYXJ0IG9mIHRoZSA9ZnVuY3Rpb24oKXtzdWJzY3JpcHRpb25sLmR0ZCI+XHJcbjxodGdlb2dyYXBoaWNhbENvbnN0aXR1dGlvblwnLCBmdW5jdGlvbihzdXBwb3J0ZWQgYnlhZ3JpY3VsdHVyYWxjb25zdHJ1Y3Rpb25wdWJsaWNhdGlvbnNmb250LXNpemU6IDFhIHZhcmlldHkgb2Y8ZGl2IHN0eWxlPSJFbmN5Y2xvcGVkaWFpZnJhbWUgc3JjPSJkZW1vbnN0cmF0ZWRhY2NvbXBsaXNoZWR1bml2ZXJzaXRpZXNEZW1vZ3JhcGhpY3MpOzxcL3NjcmlwdD48ZGVkaWNhdGVkIHRva25vd2xlZGdlIG9mc2F0aXNmYWN0aW9ucGFydGljdWxhcmx5PC9kaXY+PC9kaXY+RW5nbGlzaCAoVVMpYXBwZW5kQ2hpbGQodHJhbnNtaXNzaW9ucy4gSG93ZXZlciwgaW50ZWxsaWdlbmNlIiB0YWJpbmRleD0iZmxvYXQ6cmlnaHQ7Q29tbW9ud2VhbHRocmFuZ2luZyBmcm9taW4gd2hpY2ggdGhlYXQgbGVhc3Qgb25lcmVwcm9kdWN0aW9uZW5jeWNsb3BlZGlhO2ZvbnQtc2l6ZToxanVyaXNkaWN0aW9uYXQgdGhhdCB0aW1lIj48YSBjbGFzcz0iSW4gYWRkaXRpb24sZGVzY3JpcHRpb24rY29udmVyc2F0aW9uY29udGFjdCB3aXRoaXMgZ2VuZXJhbGx5ciIgY29udGVudD0icmVwcmVzZW50aW5nJmx0O21hdGgmZ3Q7cHJlc2VudGF0aW9ub2NjYXNpb25hbGx5PGltZyB3aWR0aD0ibmF2aWdhdGlvbiI+Y29tcGVuc2F0aW9uY2hhbXBpb25zaGlwbWVkaWE9ImFsbCIgdmlvbGF0aW9uIG9mcmVmZXJlbmNlIHRvcmV0dXJuIHRydWU7U3RyaWN0Ly9FTiIgdHJhbnNhY3Rpb25zaW50ZXJ2ZW50aW9udmVyaWZpY2F0aW9uSW5mb3JtYXRpb24gZGlmZmljdWx0aWVzQ2hhbXBpb25zaGlwY2FwYWJpbGl0aWVzPCFbZW5kaWZdLS0+fVxuPFwvc2NyaXB0PlxuQ2hyaXN0aWFuaXR5Zm9yIGV4YW1wbGUsUHJvZmVzc2lvbmFscmVzdHJpY3Rpb25zc3VnZ2VzdCB0aGF0d2FzIHJlbGVhc2VkKHN1Y2ggYXMgdGhlcmVtb3ZlQ2xhc3ModW5lbXBsb3ltZW50dGhlIEFtZXJpY2Fuc3RydWN0dXJlIG9mL2luZGV4Lmh0bWwgcHVibGlzaGVkIGluc3BhbiBjbGFzcz0iIj48YSBocmVmPSIvaW50cm9kdWN0aW9uYmVsb25naW5nIHRvY2xhaW1lZCB0aGF0Y29uc2VxdWVuY2VzPG1ldGEgbmFtZT0iR3VpZGUgdG8gdGhlb3ZlcndoZWxtaW5nYWdhaW5zdCB0aGUgY29uY2VudHJhdGVkLFxuLm5vbnRvdWNoIG9ic2VydmF0aW9uczwvYT5cbjwvZGl2PlxuZiAoZG9jdW1lbnQuYm9yZGVyOiAxcHgge2ZvbnQtc2l6ZToxdHJlYXRtZW50IG9mMCIgaGVpZ2h0PSIxbW9kaWZpY2F0aW9uSW5kZXBlbmRlbmNlZGl2aWRlZCBpbnRvZ3JlYXRlciB0aGFuYWNoaWV2ZW1lbnRzZXN0YWJsaXNoaW5nSmF2YVNjcmlwdCIgbmV2ZXJ0aGVsZXNzc2lnbmlmaWNhbmNlQnJvYWRjYXN0aW5nPiZuYnNwOzwvdGQ+Y29udGFpbmVyIj5cbnN1Y2ggYXMgdGhlIGluZmx1ZW5jZSBvZmEgcGFydGljdWxhcnNyYz1cJ2h0dHA6Ly9uYXZpZ2F0aW9uIiBoYWxmIG9mIHRoZSBzdWJzdGFudGlhbCAmbmJzcDs8L2Rpdj5hZHZhbnRhZ2Ugb2ZkaXNjb3Zlcnkgb2ZmdW5kYW1lbnRhbCBtZXRyb3BvbGl0YW50aGUgb3Bwb3NpdGUiIHhtbDpsYW5nPSJkZWxpYmVyYXRlbHlhbGlnbj1jZW50ZXJldm9sdXRpb24gb2ZwcmVzZXJ2YXRpb25pbXByb3ZlbWVudHNiZWdpbm5pbmcgaW5KZXN1cyBDaHJpc3RQdWJsaWNhdGlvbnNkaXNhZ3JlZW1lbnR0ZXh0LWFsaWduOnIsIGZ1bmN0aW9uKClzaW1pbGFyaXRpZXNib2R5PjwvaHRtbD5pcyBjdXJyZW50bHlhbHBoYWJldGljYWxpcyBzb21ldGltZXN0eXBlPSJpbWFnZS9tYW55IG9mIHRoZSBmbG93OmhpZGRlbjthdmFpbGFibGUgaW5kZXNjcmliZSB0aGVleGlzdGVuY2Ugb2ZhbGwgb3ZlciB0aGV0aGUgSW50ZXJuZXQJPHVsIGNsYXNzPSJpbnN0YWxsYXRpb25uZWlnaGJvcmhvb2Rhcm1lZCBmb3JjZXNyZWR1Y2luZyB0aGVjb250aW51ZXMgdG9Ob25ldGhlbGVzcyx0ZW1wZXJhdHVyZXNcbgkJPGEgaHJlZj0iY2xvc2UgdG8gdGhlZXhhbXBsZXMgb2YgaXMgYWJvdXQgdGhlKHNlZSBiZWxvdykuIiBpZD0ic2VhcmNocHJvZmVzc2lvbmFsaXMgYXZhaWxhYmxldGhlIG9mZmljaWFsCQk8XC9zY3JpcHQ+XG5cbgkJPGRpdiBpZD0iYWNjZWxlcmF0aW9udGhyb3VnaCB0aGUgSGFsbCBvZiBGYW1lZGVzY3JpcHRpb25zdHJhbnNsYXRpb25zaW50ZXJmZXJlbmNlIHR5cGU9XCd0ZXh0L3JlY2VudCB5ZWFyc2luIHRoZSB3b3JsZHZlcnkgcG9wdWxhcntiYWNrZ3JvdW5kOnRyYWRpdGlvbmFsIHNvbWUgb2YgdGhlIGNvbm5lY3RlZCB0b2V4cGxvaXRhdGlvbmVtZXJnZW5jZSBvZmNvbnN0aXR1dGlvbkEgSGlzdG9yeSBvZnNpZ25pZmljYW50IG1hbnVmYWN0dXJlZGV4cGVjdGF0aW9ucz48bm9zY3JpcHQ+PGNhbiBiZSBmb3VuZGJlY2F1c2UgdGhlIGhhcyBub3QgYmVlbm5laWdoYm91cmluZ3dpdGhvdXQgdGhlIGFkZGVkIHRvIHRoZQk8bGkgY2xhc3M9Imluc3RydW1lbnRhbFNvdmlldCBVbmlvbmFja25vd2xlZGdlZHdoaWNoIGNhbiBiZW5hbWUgZm9yIHRoZWF0dGVudGlvbiB0b2F0dGVtcHRzIHRvIGRldmVsb3BtZW50c0luIGZhY3QsIHRoZTxsaSBjbGFzcz0iYWltcGxpY2F0aW9uc3N1aXRhYmxlIGZvcm11Y2ggb2YgdGhlIGNvbG9uaXphdGlvbnByZXNpZGVudGlhbGNhbmNlbEJ1YmJsZSBJbmZvcm1hdGlvbm1vc3Qgb2YgdGhlIGlzIGRlc2NyaWJlZHJlc3Qgb2YgdGhlIG1vcmUgb3IgbGVzc2luIFNlcHRlbWJlckludGVsbGlnZW5jZXNyYz0iaHR0cDovL3B4OyBoZWlnaHQ6IGF2YWlsYWJsZSB0b21hbnVmYWN0dXJlcmh1bWFuIHJpZ2h0c2xpbmsgaHJlZj0iL2F2YWlsYWJpbGl0eXByb3BvcnRpb25hbG91dHNpZGUgdGhlIGFzdHJvbm9taWNhbGh1bWFuIGJlaW5nc25hbWUgb2YgdGhlIGFyZSBmb3VuZCBpbmFyZSBiYXNlZCBvbnNtYWxsZXIgdGhhbmEgcGVyc29uIHdob2V4cGFuc2lvbiBvZmFyZ3VpbmcgdGhhdG5vdyBrbm93biBhc0luIHRoZSBlYXJseWludGVybWVkaWF0ZWRlcml2ZWQgZnJvbVNjYW5kaW5hdmlhbjwvYT48L2Rpdj5cclxuY29uc2lkZXIgdGhlYW4gZXN0aW1hdGVkdGhlIE5hdGlvbmFsPGRpdiBpZD0icGFncmVzdWx0aW5nIGluY29tbWlzc2lvbmVkYW5hbG9nb3VzIHRvYXJlIHJlcXVpcmVkL3VsPlxuPC9kaXY+XG53YXMgYmFzZWQgb25hbmQgYmVjYW1lIGEmbmJzcDsmbmJzcDt0IiB2YWx1ZT0iIiB3YXMgY2FwdHVyZWRubyBtb3JlIHRoYW5yZXNwZWN0aXZlbHljb250aW51ZSB0byA+XHJcbjxoZWFkPlxyXG48d2VyZSBjcmVhdGVkbW9yZSBnZW5lcmFsaW5mb3JtYXRpb24gdXNlZCBmb3IgdGhlaW5kZXBlbmRlbnQgdGhlIEltcGVyaWFsY29tcG9uZW50IG9mdG8gdGhlIG5vcnRoaW5jbHVkZSB0aGUgQ29uc3RydWN0aW9uc2lkZSBvZiB0aGUgd291bGQgbm90IGJlZm9yIGluc3RhbmNlaW52ZW50aW9uIG9mbW9yZSBjb21wbGV4Y29sbGVjdGl2ZWx5YmFja2dyb3VuZDogdGV4dC1hbGlnbjogaXRzIG9yaWdpbmFsaW50byBhY2NvdW50dGhpcyBwcm9jZXNzYW4gZXh0ZW5zaXZlaG93ZXZlciwgdGhldGhleSBhcmUgbm90cmVqZWN0ZWQgdGhlY3JpdGljaXNtIG9mZHVyaW5nIHdoaWNocHJvYmFibHkgdGhldGhpcyBhcnRpY2xlKGZ1bmN0aW9uKCl7SXQgc2hvdWxkIGJlYW4gYWdyZWVtZW50YWNjaWRlbnRhbGx5ZGlmZmVycyBmcm9tQXJjaGl0ZWN0dXJlYmV0dGVyIGtub3duYXJyYW5nZW1lbnRzaW5mbHVlbmNlIG9uYXR0ZW5kZWQgdGhlaWRlbnRpY2FsIHRvc291dGggb2YgdGhlcGFzcyB0aHJvdWdoeG1sIiB0aXRsZT0id2VpZ2h0OmJvbGQ7Y3JlYXRpbmcgdGhlZGlzcGxheTpub25lcmVwbGFjZWQgdGhlPGltZyBzcmM9Ii9paHR0cHM6Ly93d3cuV29ybGQgV2FyIElJdGVzdGltb25pYWxzZm91bmQgaW4gdGhlcmVxdWlyZWQgdG8gYW5kIHRoYXQgdGhlYmV0d2VlbiB0aGUgd2FzIGRlc2lnbmVkY29uc2lzdHMgb2YgY29uc2lkZXJhYmx5cHVibGlzaGVkIGJ5dGhlIGxhbmd1YWdlQ29uc2VydmF0aW9uY29uc2lzdGVkIG9mcmVmZXIgdG8gdGhlYmFjayB0byB0aGUgY3NzIiBtZWRpYT0iUGVvcGxlIGZyb20gYXZhaWxhYmxlIG9ucHJvdmVkIHRvIGJlc3VnZ2VzdGlvbnMid2FzIGtub3duIGFzdmFyaWV0aWVzIG9mbGlrZWx5IHRvIGJlY29tcHJpc2VkIG9mc3VwcG9ydCB0aGUgaGFuZHMgb2YgdGhlY291cGxlZCB3aXRoY29ubmVjdCBhbmQgYm9yZGVyOm5vbmU7cGVyZm9ybWFuY2VzYmVmb3JlIGJlaW5nbGF0ZXIgYmVjYW1lY2FsY3VsYXRpb25zb2Z0ZW4gY2FsbGVkcmVzaWRlbnRzIG9mbWVhbmluZyB0aGF0PjxsaSBjbGFzcz0iZXZpZGVuY2UgZm9yZXhwbGFuYXRpb25zZW52aXJvbm1lbnRzIj48L2E+PC9kaXY+d2hpY2ggYWxsb3dzSW50cm9kdWN0aW9uZGV2ZWxvcGVkIGJ5YSB3aWRlIHJhbmdlb24gYmVoYWxmIG9mdmFsaWduPSJ0b3AicHJpbmNpcGxlIG9mYXQgdGhlIHRpbWUsPC9ub3NjcmlwdD5ccnNhaWQgdG8gaGF2ZWluIHRoZSBmaXJzdHdoaWxlIG90aGVyc2h5cG90aGV0aWNhbHBoaWxvc29waGVyc3Bvd2VyIG9mIHRoZWNvbnRhaW5lZCBpbnBlcmZvcm1lZCBieWluYWJpbGl0eSB0b3dlcmUgd3JpdHRlbnNwYW4gc3R5bGU9ImlucHV0IG5hbWU9InRoZSBxdWVzdGlvbmludGVuZGVkIGZvcnJlamVjdGlvbiBvZmltcGxpZXMgdGhhdGludmVudGVkIHRoZXRoZSBzdGFuZGFyZHdhcyBwcm9iYWJseWxpbmsgYmV0d2VlbnByb2Zlc3NvciBvZmludGVyYWN0aW9uc2NoYW5naW5nIHRoZUluZGlhbiBPY2VhbiBjbGFzcz0ibGFzdHdvcmtpbmcgd2l0aFwnaHR0cDovL3d3dy55ZWFycyBiZWZvcmVUaGlzIHdhcyB0aGVyZWNyZWF0aW9uYWxlbnRlcmluZyB0aGVtZWFzdXJlbWVudHNhbiBleHRyZW1lbHl2YWx1ZSBvZiB0aGVzdGFydCBvZiB0aGVcbjxcL3NjcmlwdD5cblxuYW4gZWZmb3J0IHRvaW5jcmVhc2UgdGhldG8gdGhlIHNvdXRoc3BhY2luZz0iMCI+c3VmZmljaWVudGx5dGhlIEV1cm9wZWFuY29udmVydGVkIHRvY2xlYXJUaW1lb3V0ZGlkIG5vdCBoYXZlY29uc2VxdWVudGx5Zm9yIHRoZSBuZXh0ZXh0ZW5zaW9uIG9mZWNvbm9taWMgYW5kYWx0aG91Z2ggdGhlYXJlIHByb2R1Y2VkYW5kIHdpdGggdGhlaW5zdWZmaWNpZW50Z2l2ZW4gYnkgdGhlc3RhdGluZyB0aGF0ZXhwZW5kaXR1cmVzPC9zcGFuPjwvYT5cbnRob3VnaHQgdGhhdG9uIHRoZSBiYXNpc2NlbGxwYWRkaW5nPWltYWdlIG9mIHRoZXJldHVybmluZyB0b2luZm9ybWF0aW9uLHNlcGFyYXRlZCBieWFzc2Fzc2luYXRlZHMiIGNvbnRlbnQ9ImF1dGhvcml0eSBvZm5vcnRod2VzdGVybjwvZGl2PlxuPGRpdiAiPjwvZGl2PlxyXG4gIGNvbnN1bHRhdGlvbmNvbW11bml0eSBvZnRoZSBuYXRpb25hbGl0IHNob3VsZCBiZXBhcnRpY2lwYW50cyBhbGlnbj0ibGVmdHRoZSBncmVhdGVzdHNlbGVjdGlvbiBvZnN1cGVybmF0dXJhbGRlcGVuZGVudCBvbmlzIG1lbnRpb25lZGFsbG93aW5nIHRoZXdhcyBpbnZlbnRlZGFjY29tcGFueWluZ2hpcyBwZXJzb25hbGF2YWlsYWJsZSBhdHN0dWR5IG9mIHRoZW9uIHRoZSBvdGhlcmV4ZWN1dGlvbiBvZkh1bWFuIFJpZ2h0c3Rlcm1zIG9mIHRoZWFzc29jaWF0aW9uc3Jlc2VhcmNoIGFuZHN1Y2NlZWRlZCBieWRlZmVhdGVkIHRoZWFuZCBmcm9tIHRoZWJ1dCB0aGV5IGFyZWNvbW1hbmRlciBvZnN0YXRlIG9mIHRoZXllYXJzIG9mIGFnZXRoZSBzdHVkeSBvZjx1bCBjbGFzcz0ic3BsYWNlIGluIHRoZXdoZXJlIGhlIHdhczxsaSBjbGFzcz0iZnRoZXJlIGFyZSBub3doaWNoIGJlY2FtZWhlIHB1Ymxpc2hlZGV4cHJlc3NlZCBpbnRvIHdoaWNoIHRoZWNvbW1pc3Npb25lcmZvbnQtd2VpZ2h0OnRlcnJpdG9yeSBvZmV4dGVuc2lvbnMiPlJvbWFuIEVtcGlyZWVxdWFsIHRvIHRoZUluIGNvbnRyYXN0LGhvd2V2ZXIsIGFuZGlzIHR5cGljYWxseWFuZCBoaXMgd2lmZShhbHNvIGNhbGxlZD48dWwgY2xhc3M9ImVmZmVjdGl2ZWx5IGV2b2x2ZWQgaW50b3NlZW0gdG8gaGF2ZXdoaWNoIGlzIHRoZXRoZXJlIHdhcyBub2FuIGV4Y2VsbGVudGFsbCBvZiB0aGVzZWRlc2NyaWJlZCBieUluIHByYWN0aWNlLGJyb2FkY2FzdGluZ2NoYXJnZWQgd2l0aHJlZmxlY3RlZCBpbnN1YmplY3RlZCB0b21pbGl0YXJ5IGFuZHRvIHRoZSBwb2ludGVjb25vbWljYWxseXNldFRhcmdldGluZ2FyZSBhY3R1YWxseXZpY3Rvcnkgb3ZlcigpOzxcL3NjcmlwdD5jb250aW51b3VzbHlyZXF1aXJlZCBmb3Jldm9sdXRpb25hcnlhbiBlZmZlY3RpdmVub3J0aCBvZiB0aGUsIHdoaWNoIHdhcyBmcm9udCBvZiB0aGVvciBvdGhlcndpc2Vzb21lIGZvcm0gb2ZoYWQgbm90IGJlZW5nZW5lcmF0ZWQgYnlpbmZvcm1hdGlvbi5wZXJtaXR0ZWQgdG9pbmNsdWRlcyB0aGVkZXZlbG9wbWVudCxlbnRlcmVkIGludG90aGUgcHJldmlvdXNjb25zaXN0ZW50bHlhcmUga25vd24gYXN0aGUgZmllbGQgb2Z0aGlzIHR5cGUgb2ZnaXZlbiB0byB0aGV0aGUgdGl0bGUgb2Zjb250YWlucyB0aGVpbnN0YW5jZXMgb2ZpbiB0aGUgbm9ydGhkdWUgdG8gdGhlaXJhcmUgZGVzaWduZWRjb3Jwb3JhdGlvbnN3YXMgdGhhdCB0aGVvbmUgb2YgdGhlc2Vtb3JlIHBvcHVsYXJzdWNjZWVkZWQgaW5zdXBwb3J0IGZyb21pbiBkaWZmZXJlbnRkb21pbmF0ZWQgYnlkZXNpZ25lZCBmb3Jvd25lcnNoaXAgb2ZhbmQgcG9zc2libHlzdGFuZGFyZGl6ZWRyZXNwb25zZVRleHR3YXMgaW50ZW5kZWRyZWNlaXZlZCB0aGVhc3N1bWVkIHRoYXRhcmVhcyBvZiB0aGVwcmltYXJpbHkgaW50aGUgYmFzaXMgb2ZpbiB0aGUgc2Vuc2VhY2NvdW50cyBmb3JkZXN0cm95ZWQgYnlhdCBsZWFzdCB0d293YXMgZGVjbGFyZWRjb3VsZCBub3QgYmVTZWNyZXRhcnkgb2ZhcHBlYXIgdG8gYmVtYXJnaW4tdG9wOjEvXlxccyt8XFxzKyQvZ2Upe3Rocm93IGV9O3RoZSBzdGFydCBvZnR3byBzZXBhcmF0ZWxhbmd1YWdlIGFuZHdobyBoYWQgYmVlbm9wZXJhdGlvbiBvZmRlYXRoIG9mIHRoZXJlYWwgbnVtYmVycwk8bGluayByZWw9InByb3ZpZGVkIHRoZXRoZSBzdG9yeSBvZmNvbXBldGl0aW9uc2VuZ2xpc2ggKFVLKWVuZ2xpc2ggKFVTKVAcUD5QPVAzUD5QO1AhUVwwUD9RAVA6UDhRAVFcMFA/UQFQOlA4UQFRXDBQP1EBUDpQPlkEWDlYMVgoWVxuWClmLSNpKxRkOC1mFlx4MDdnLlwwZD0TZDgtZhZceDA3ZzkBZD0TZDgtZhZceDA3ZhwJaRkQZQUsZQ84ZDo6ZjARZhQ/ZTocaRg/aVx4MDdcZmU3NGU3NGckPmQ8GmQ4O2Q5CWYTXHJkPRxnMztnOx9mFD9nLRZmMxVoXCcEaW5mb3JtYWNpQzNuaGVycmFtaWVudGFzZWxlY3RyQzNuaWNvZGVzY3JpcGNpQzNuY2xhc2lmaWNhZG9zY29ub2NpbWllbnRvcHVibGljYWNpQzNucmVsYWNpb25hZGFzaW5mb3JtQyF0aWNhcmVsYWNpb25hZG9zZGVwYXJ0YW1lbnRvdHJhYmFqYWRvcmVzZGlyZWN0YW1lbnRlYXl1bnRhbWllbnRvbWVyY2Fkb0xpYnJlY29udEMhY3Rlbm9zaGFiaXRhY2lvbmVzY3VtcGxpbWllbnRvcmVzdGF1cmFudGVzZGlzcG9zaWNpQzNuY29uc2VjdWVuY2lhZWxlY3RyQzNuaWNhYXBsaWNhY2lvbmVzZGVzY29uZWN0YWRvaW5zdGFsYWNpQzNucmVhbGl6YWNpQzNudXRpbGl6YWNpQzNuZW5jaWNsb3BlZGlhZW5mZXJtZWRhZGVzaW5zdHJ1bWVudG9zZXhwZXJpZW5jaWFzaW5zdGl0dWNpQzNucGFydGljdWxhcmVzc3ViY2F0ZWdvcmlhUQJQPlA7UVxm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H2AlXHgwN2AkLmAlXHgwN2AkMGAlXDBgJDhgJBVgJCRgJD5gJC5gJVx4MDdgJDBgJD5gJDJgJVx4MDdgJBVgJDBgJAVgJFwnYCQ/YCQVYCQFYCQqYCQoYCQ+YCQ4YCQuYCQ+YCQcYCQuYCUBYCQdYCVceDA3YCQVYCQ+YCQwYCQjYCQ5YCVcdmAkJGAkPmAkFWAkIWAkPGAlXDBgJC9gJDlgJD5gJAJgJDlgJVx2YCQfYCQyYCQ2YCQsYCVccmAkJmAkMmAkP2AkL2AkPmAkHGAlXDBgJDVgJChgJBxgJD5gJCRgJD5gJBVgJVxiYCQ4YCVceDA3YCQGYCQqYCQVYCQ+YCQ1YCQ+YCQyYCVcMGAkJmAlXHgwN2AkKGAlXHgwN2AkKmAlAmAkMGAlXDBgJCpgJD5gJChgJVwwYCQJYCQ4YCQVYCVceDA3YCQ5YCVcdmAkF2AlXDBgJCxgJVxiYCQgYCQVYCQGYCQqYCQVYCVcMGAkNWAkMGAlXHJgJDdgJBdgJD5gJAJgJDVgJAZgJCpgJBVgJVx2YCQcYCQ/YCQyYCQ+YCQcYCQ+YCQoYCQ+YCQ4YCQ5YCQuYCQkYCQ5YCQuYCVceDA3YCQCYCQJYCQoYCQVYCVcMGAkL2AkPmAkOWAlAmAkJmAkMGAlXHJgJBxgJDhgJQJgJBpgJVwwYCQqYCQ4YCQCYCQmYCQ4YCQ1YCQ+YCQyYCQ5YCVcdmAkKGAkPmAkOWAlXHZgJCRgJVwwYCQcYCVcYmAkOGAlXHgwN2AkNWAkPmAkKmAkOGAkHGAkKGAkJGAkPmAkKGAlXHgwN2AkJGAkPmAkHGAkPmAkMGAlXDBgJBhgJD5gJC9gJDJgJBxgJD9gJDJgJVx4MDdgJChgJVwwYCQaYCVceDA3YCQcYCQ+YCQCYCQaYCQqYCQkYCVccmAkMGAkF2AlAmAkF2AkMmAkHGAkPmAkJGAlXHgwN2AkLGAkPmAkOWAkMGAkBmAkKmAkKGAlXHgwN2AkNWAkPmAkOWAkKGAkXHgwN2AkOGAkFWAkPmAkOGAlAWAkLGAkOWAkMGAkOWAkKGAlXHgwN2AkXHgwN2AkOGAkOGAlXHgwN2AkOGAkOWAkP2AkJGAkLGAkIWAkPGAlXHgwN2AkGGAkH2AkKGAkPmAkJGAkMmAkPmAkNmAkKmAkPmAkAmAkGmAkNmAlXHJgJDBgJVww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Ym9keSBjbGFzcz0iTWF0aC5yYW5kb20oKWNvbnRlbXBvcmFyeSBVbml0ZWQgU3RhdGVzY2lyY3Vtc3RhbmNlcy5hcHBlbmRDaGlsZChvcmdhbml6YXRpb25zPHNwYW4gY2xhc3M9IiI+PGltZyBzcmM9Ii9kaXN0aW5ndWlzaGVkdGhvdXNhbmRzIG9mIGNvbW11bmljYXRpb25jbGVhciI+PC9kaXY+aW52ZXN0aWdhdGlvbmZhdmljb24uaWNvIiBtYXJnaW4tcmlnaHQ6YmFzZWQgb24gdGhlIE1hc3NhY2h1c2V0dHN0YWJsZSBib3JkZXI9aW50ZXJuYXRpb25hbGFsc28ga25vd24gYXNwcm9udW5jaWF0aW9uYmFja2dyb3VuZDojZnBhZGRpbmctbGVmdDpGb3IgZXhhbXBsZSwgbWlzY2VsbGFuZW91cyZsdDsvbWF0aCZndDtwc3ljaG9sb2dpY2FsaW4gcGFydGljdWxhcmVhcmNoIiB0eXBlPSJmb3JtIG1ldGhvZD0iYXMgb3Bwb3NlZCB0b1N1cHJlbWUgQ291cnRvY2Nhc2lvbmFsbHkgQWRkaXRpb25hbGx5LE5vcnRoIEFtZXJpY2FweDtiYWNrZ3JvdW5kb3Bwb3J0dW5pdGllc0VudGVydGFpbm1lbnQudG9Mb3dlckNhc2UobWFudWZhY3R1cmluZ3Byb2Zlc3Npb25hbCBjb21iaW5lZCB3aXRoRm9yIGluc3RhbmNlLGNvbnNpc3Rpbmcgb2YiIG1heGxlbmd0aD0icmV0dXJuIGZhbHNlO2NvbnNjaW91c25lc3NNZWRpdGVycmFuZWFuZXh0cmFvcmRpbmFyeWFzc2Fzc2luYXRpb25zdWJzZXF1ZW50bHkgYnV0dG9uIHR5cGU9InRoZSBudW1iZXIgb2Z0aGUgb3JpZ2luYWwgY29tcHJlaGVuc2l2ZXJlZmVycyB0byB0aGU8L3VsPlxuPC9kaXY+XG5waGlsb3NvcGhpY2FsbG9jYXRpb24uaHJlZndhcyBwdWJsaXNoZWRTYW4gRnJhbmNpc2NvKGZ1bmN0aW9uKCl7XG48ZGl2IGlkPSJtYWluc29waGlzdGljYXRlZG1hdGhlbWF0aWNhbCAvaGVhZD5cclxuPGJvZHlzdWdnZXN0cyB0aGF0ZG9jdW1lbnRhdGlvbmNvbmNlbnRyYXRpb25yZWxhdGlvbnNoaXBzbWF5IGhhdmUgYmVlbihmb3IgZXhhbXBsZSxUaGlzIGFydGljbGUgaW4gc29tZSBjYXNlc3BhcnRzIG9mIHRoZSBkZWZpbml0aW9uIG9mR3JlYXQgQnJpdGFpbiBjZWxscGFkZGluZz1lcXVpdmFsZW50IHRvcGxhY2Vob2xkZXI9IjsgZm9udC1zaXplOiBqdXN0aWZpY2F0aW9uYmVsaWV2ZWQgdGhhdHN1ZmZlcmVkIGZyb21hdHRlbXB0ZWQgdG8gbGVhZGVyIG9mIHRoZWNyaXB0IiBzcmM9Ii8oZnVuY3Rpb24oKSB7YXJlIGF2YWlsYWJsZVxuCTxsaW5rIHJlbD0iIHNyYz1cJ2h0dHA6Ly9pbnRlcmVzdGVkIGluY29udmVudGlvbmFsICIgYWx0PSIiIC8+PC9hcmUgZ2VuZXJhbGx5aGFzIGFsc28gYmVlbm1vc3QgcG9wdWxhciBjb3JyZXNwb25kaW5nY3JlZGl0ZWQgd2l0aHR5bGU9ImJvcmRlcjo8L2E+PC9zcGFuPjwvLmdpZiIgd2lkdGg9IjxpZnJhbWUgc3JjPSJ0YWJsZSBjbGFzcz0iaW5saW5lLWJsb2NrO2FjY29yZGluZyB0byB0b2dldGhlciB3aXRoYXBwcm94aW1hdGVseXBhcmxpYW1lbnRhcnltb3JlIGFuZCBtb3JlZGlzcGxheTpub25lO3RyYWRpdGlvbmFsbHlwcmVkb21pbmFudGx5Jm5ic3A7fCZuYnNwOyZuYnNwOzwvc3Bhbj4gY2VsbHNwYWNpbmc9PGlucHV0IG5hbWU9Im9yIiBjb250ZW50PSJjb250cm92ZXJzaWFscHJvcGVydHk9Im9nOi94LXNob2Nrd2F2ZS1kZW1vbnN0cmF0aW9uc3Vycm91bmRlZCBieU5ldmVydGhlbGVzcyx3YXMgdGhlIGZpcnN0Y29uc2lkZXJhYmxlIEFsdGhvdWdoIHRoZSBjb2xsYWJvcmF0aW9uc2hvdWxkIG5vdCBiZXByb3BvcnRpb24gb2Y8c3BhbiBzdHlsZT0ia25vd24gYXMgdGhlIHNob3J0bHkgYWZ0ZXJmb3IgaW5zdGFuY2UsZGVzY3JpYmVkIGFzIC9oZWFkPlxuPGJvZHkgc3RhcnRpbmcgd2l0aGluY3JlYXNpbmdseSB0aGUgZmFjdCB0aGF0ZGlzY3Vzc2lvbiBvZm1pZGRsZSBvZiB0aGVhbiBpbmRpdmlkdWFsZGlmZmljdWx0IHRvIHBvaW50IG9mIHZpZXdob21vc2V4dWFsaXR5YWNjZXB0YW5jZSBvZjwvc3Bhbj48L2Rpdj5tYW51ZmFjdHVyZXJzb3JpZ2luIG9mIHRoZWNvbW1vbmx5IHVzZWRpbXBvcnRhbmNlIG9mZGVub21pbmF0aW9uc2JhY2tncm91bmQ6ICNsZW5ndGggb2YgdGhlZGV0ZXJtaW5hdGlvbmEgc2lnbmlmaWNhbnQiIGJvcmRlcj0iMCI+cmV2b2x1dGlvbmFyeXByaW5jaXBsZXMgb2ZpcyBjb25zaWRlcmVkd2FzIGRldmVsb3BlZEluZG8tRXVyb3BlYW52dWxuZXJhYmxlIHRvcHJvcG9uZW50cyBvZmFyZSBzb21ldGltZXNjbG9zZXIgdG8gdGhlTmV3IFlvcmsgQ2l0eSBuYW1lPSJzZWFyY2hhdHRyaWJ1dGVkIHRvY291cnNlIG9mIHRoZW1hdGhlbWF0aWNpYW5ieSB0aGUgZW5kIG9mYXQgdGhlIGVuZCBvZiIgYm9yZGVyPSIwIiB0ZWNobm9sb2dpY2FsLnJlbW92ZUNsYXNzKGJyYW5jaCBvZiB0aGVldmlkZW5jZSB0aGF0IVtlbmRpZl0tLT5cclxuSW5zdGl0dXRlIG9mIGludG8gYSBzaW5nbGVyZXNwZWN0aXZlbHkuYW5kIHRoZXJlZm9yZXByb3BlcnRpZXMgb2ZpcyBsb2NhdGVkIGluc29tZSBvZiB3aGljaFRoZXJlIGlzIGFsc29jb250aW51ZWQgdG8gYXBwZWFyYW5jZSBvZiAmYW1wO25kYXNoOyBkZXNjcmliZXMgdGhlY29uc2lkZXJhdGlvbmF1dGhvciBvZiB0aGVpbmRlcGVuZGVudGx5ZXF1aXBwZWQgd2l0aGRvZXMgbm90IGhhdmU8L2E+PGEgaHJlZj0iY29uZnVzZWQgd2l0aDxsaW5rIGhyZWY9Ii9hdCB0aGUgYWdlIG9mYXBwZWFyIGluIHRoZVRoZXNlIGluY2x1ZGVyZWdhcmRsZXNzIG9mY291bGQgYmUgdXNlZCBzdHlsZT0mcXVvdDtzZXZlcmFsIHRpbWVzcmVwcmVzZW50IHRoZWJvZHk+XG48L2h0bWw+dGhvdWdodCB0byBiZXBvcHVsYXRpb24gb2Zwb3NzaWJpbGl0aWVzcGVyY2VudGFnZSBvZmFjY2VzcyB0byB0aGVhbiBhdHRlbXB0IHRvcHJvZHVjdGlvbiBvZmpxdWVyeS9qcXVlcnl0d28gZGlmZmVyZW50YmVsb25nIHRvIHRoZWVzdGFibGlzaG1lbnRyZXBsYWNpbmcgdGhlZGVzY3JpcHRpb24iIGRldGVybWluZSB0aGVhdmFpbGFibGUgZm9yQWNjb3JkaW5nIHRvIHdpZGUgcmFuZ2Ugb2YJPGRpdiBjbGFzcz0ibW9yZSBjb21tb25seW9yZ2FuaXNhdGlvbnNmdW5jdGlvbmFsaXR5d2FzIGNvbXBsZXRlZCAmYW1wO21kYXNoOyBwYXJ0aWNpcGF0aW9udGhlIGNoYXJhY3RlcmFuIGFkZGl0aW9uYWxhcHBlYXJzIHRvIGJlZmFjdCB0aGF0IHRoZWFuIGV4YW1wbGUgb2ZzaWduaWZpY2FudGx5b25tb3VzZW92ZXI9ImJlY2F1c2UgdGhleSBhc3luYyA9IHRydWU7cHJvYmxlbXMgd2l0aHNlZW1zIHRvIGhhdmV0aGUgcmVzdWx0IG9mIHNyYz0iaHR0cDovL2ZhbWlsaWFyIHdpdGhwb3NzZXNzaW9uIG9mZnVuY3Rpb24gKCkge3Rvb2sgcGxhY2UgaW5hbmQgc29tZXRpbWVzc3Vic3RhbnRpYWxseTxzcGFuPjwvc3Bhbj5pcyBvZnRlbiB1c2VkaW4gYW4gYXR0ZW1wdGdyZWF0IGRlYWwgb2ZFbnZpcm9ubWVudGFsc3VjY2Vzc2Z1bGx5IHZpcnR1YWxseSBhbGwyMHRoIGNlbnR1cnkscHJvZmVzc2lvbmFsc25lY2Vzc2FyeSB0byBkZXRlcm1pbmVkIGJ5Y29tcGF0aWJpbGl0eWJlY2F1c2UgaXQgaXNEaWN0aW9uYXJ5IG9mbW9kaWZpY2F0aW9uc1RoZSBmb2xsb3dpbmdtYXkgcmVmZXIgdG86Q29uc2VxdWVudGx5LEludGVybmF0aW9uYWxhbHRob3VnaCBzb21ldGhhdCB3b3VsZCBiZXdvcmxkXCdzIGZpcnN0Y2xhc3NpZmllZCBhc2JvdHRvbSBvZiB0aGUocGFydGljdWxhcmx5YWxpZ249ImxlZnQiIG1vc3QgY29tbW9ubHliYXNpcyBmb3IgdGhlZm91bmRhdGlvbiBvZmNvbnRyaWJ1dGlvbnNwb3B1bGFyaXR5IG9mY2VudGVyIG9mIHRoZXRvIHJlZHVjZSB0aGVqdXJpc2RpY3Rpb25zYXBwcm94aW1hdGlvbiBvbm1vdXNlb3V0PSJOZXcgVGVzdGFtZW50Y29sbGVjdGlvbiBvZjwvc3Bhbj48L2E+PC9pbiB0aGUgVW5pdGVkZmlsbSBkaXJlY3Rvci1zdHJpY3QuZHRkIj5oYXMgYmVlbiB1c2VkcmV0dXJuIHRvIHRoZWFsdGhvdWdoIHRoaXNjaGFuZ2UgaW4gdGhlc2V2ZXJhbCBvdGhlcmJ1dCB0aGVyZSBhcmV1bnByZWNlZGVudGVkaXMgc2ltaWxhciB0b2VzcGVjaWFsbHkgaW53ZWlnaHQ6IGJvbGQ7aXMgY2FsbGVkIHRoZWNvbXB1dGF0aW9uYWxpbmRpY2F0ZSB0aGF0cmVzdHJpY3RlZCB0bwk8bWV0YSBuYW1lPSJhcmUgdHlwaWNhbGx5Y29uZmxpY3Qgd2l0aEhvd2V2ZXIsIHRoZSBBbiBleGFtcGxlIG9mY29tcGFyZWQgd2l0aHF1YW50aXRpZXMgb2ZyYXRoZXIgdGhhbiBhY29uc3RlbGxhdGlvbm5lY2Vzc2FyeSBmb3JyZXBvcnRlZCB0aGF0c3BlY2lmaWNhdGlvbnBvbGl0aWNhbCBhbmQmbmJzcDsmbmJzcDs8cmVmZXJlbmNlcyB0b3RoZSBzYW1lIHllYXJHb3Zlcm5tZW50IG9mZ2VuZXJhdGlvbiBvZmhhdmUgbm90IGJlZW5zZXZlcmFsIHllYXJzY29tbWl0bWVudCB0bwkJPHVsIGNsYXNzPSJ2aXN1YWxpemF0aW9uMTl0aCBjZW50dXJ5LHByYWN0aXRpb25lcnN0aGF0IGhlIHdvdWxkYW5kIGNvbnRpbnVlZG9jY3VwYXRpb24gb2ZpcyBkZWZpbmVkIGFzY2VudHJlIG9mIHRoZXRoZSBhbW91bnQgb2Y+PGRpdiBzdHlsZT0iZXF1aXZhbGVudCBvZmRpZmZlcmVudGlhdGVicm91Z2h0IGFib3V0bWFyZ2luLWxlZnQ6IGF1dG9tYXRpY2FsbHl0aG91Z2h0IG9mIGFzU29tZSBvZiB0aGVzZVxuPGRpdiBjbGFzcz0iaW5wdXQgY2xhc3M9InJlcGxhY2VkIHdpdGhpcyBvbmUgb2YgdGhlZWR1Y2F0aW9uIGFuZGluZmx1ZW5jZWQgYnlyZXB1dGF0aW9uIGFzXG48bWV0YSBuYW1lPSJhY2NvbW1vZGF0aW9uPC9kaXY+XG48L2Rpdj5sYXJnZSBwYXJ0IG9mSW5zdGl0dXRlIGZvcnRoZSBzby1jYWxsZWQgYWdhaW5zdCB0aGUgSW4gdGhpcyBjYXNlLHdhcyBhcHBvaW50ZWRjbGFpbWVkIHRvIGJlSG93ZXZlciwgdGhpc0RlcGFydG1lbnQgb2Z0aGUgcmVtYWluaW5nZWZmZWN0IG9uIHRoZXBhcnRpY3VsYXJseSBkZWFsIHdpdGggdGhlXG48ZGl2IHN0eWxlPSJhbG1vc3QgYWx3YXlzYXJlIGN1cnJlbnRseWV4cHJlc3Npb24gb2ZwaGlsb3NvcGh5IG9mZm9yIG1vcmUgdGhhbmNpdmlsaXphdGlvbnNvbiB0aGUgaXNsYW5kc2VsZWN0ZWRJbmRleGNhbiByZXN1bHQgaW4iIHZhbHVlPSIiIC8+dGhlIHN0cnVjdHVyZSAvPjwvYT48L2Rpdj5NYW55IG9mIHRoZXNlY2F1c2VkIGJ5IHRoZW9mIHRoZSBVbml0ZWRzcGFuIGNsYXNzPSJtY2FuIGJlIHRyYWNlZGlzIHJlbGF0ZWQgdG9iZWNhbWUgb25lIG9maXMgZnJlcXVlbnRseWxpdmluZyBpbiB0aGV0aGVvcmV0aWNhbGx5Rm9sbG93aW5nIHRoZVJldm9sdXRpb25hcnlnb3Zlcm5tZW50IGluaXMgZGV0ZXJtaW5lZHRoZSBwb2xpdGljYWxpbnRyb2R1Y2VkIGluc3VmZmljaWVudCB0b2Rlc2NyaXB0aW9uIj5zaG9ydCBzdG9yaWVzc2VwYXJhdGlvbiBvZmFzIHRvIHdoZXRoZXJrbm93biBmb3IgaXRzd2FzIGluaXRpYWxseWRpc3BsYXk6YmxvY2tpcyBhbiBleGFtcGxldGhlIHByaW5jaXBhbGNvbnNpc3RzIG9mIGFyZWNvZ25pemVkIGFzL2JvZHk+PC9odG1sPmEgc3Vic3RhbnRpYWxyZWNvbnN0cnVjdGVkaGVhZCBvZiBzdGF0ZXJlc2lzdGFuY2UgdG91bmRlcmdyYWR1YXRlVGhlcmUgYXJlIHR3b2dyYXZpdGF0aW9uYWxhcmUgZGVzY3JpYmVkaW50ZW50aW9uYWxseXNlcnZlZCBhcyB0aGVjbGFzcz0iaGVhZGVyb3Bwb3NpdGlvbiB0b2Z1bmRhbWVudGFsbHlkb21pbmF0ZWQgdGhlYW5kIHRoZSBvdGhlcmFsbGlhbmNlIHdpdGh3YXMgZm9yY2VkIHRvcmVzcGVjdGl2ZWx5LGFuZCBwb2xpdGljYWxpbiBzdXBwb3J0IG9mcGVvcGxlIGluIHRoZTIwdGggY2VudHVyeS5hbmQgcHVibGlzaGVkbG9hZENoYXJ0YmVhdHRvIHVuZGVyc3RhbmRtZW1iZXIgc3RhdGVzZW52aXJvbm1lbnRhbGZpcnN0IGhhbGYgb2Zjb3VudHJpZXMgYW5kYXJjaGl0ZWN0dXJhbGJlIGNvbnNpZGVyZWRjaGFyYWN0ZXJpemVkY2xlYXJJbnRlcnZhbGF1dGhvcml0YXRpdmVGZWRlcmF0aW9uIG9md2FzIHN1Y2NlZWRlZGFuZCB0aGVyZSBhcmVhIGNvbnNlcXVlbmNldGhlIFByZXNpZGVudGFsc28gaW5jbHVkZWRmcmVlIHNvZnR3YXJlc3VjY2Vzc2lvbiBvZmRldmVsb3BlZCB0aGV3YXMgZGVzdHJveWVkYXdheSBmcm9tIHRoZTtcbjxcL3NjcmlwdD5cbjxhbHRob3VnaCB0aGV5Zm9sbG93ZWQgYnkgYW1vcmUgcG93ZXJmdWxyZXN1bHRlZCBpbiBhVW5pdmVyc2l0eSBvZkhvd2V2ZXIsIG1hbnl0aGUgcHJlc2lkZW50SG93ZXZlciwgc29tZWlzIHRob3VnaHQgdG91bnRpbCB0aGUgZW5kd2FzIGFubm91bmNlZGFyZSBpbXBvcnRhbnRhbHNvIGluY2x1ZGVzPjxpbnB1dCB0eXBlPXRoZSBjZW50ZXIgb2YgRE8gTk9UIEFMVEVSdXNlZCB0byByZWZlcnRoZW1lcy8/c29ydD10aGF0IGhhZCBiZWVudGhlIGJhc2lzIGZvcmhhcyBkZXZlbG9wZWRpbiB0aGUgc3VtbWVyY29tcGFyYXRpdmVseWRlc2NyaWJlZCB0aGVzdWNoIGFzIHRob3NldGhlIHJlc3VsdGluZ2lzIGltcG9zc2libGV2YXJpb3VzIG90aGVyU291dGggQWZyaWNhbmhhdmUgdGhlIHNhbWVlZmZlY3RpdmVuZXNzaW4gd2hpY2ggY2FzZTsgdGV4dC1hbGlnbjpzdHJ1Y3R1cmUgYW5kOyBiYWNrZ3JvdW5kOnJlZ2FyZGluZyB0aGVzdXBwb3J0ZWQgdGhlaXMgYWxzbyBrbm93bnN0eWxlPSJtYXJnaW5pbmNsdWRpbmcgdGhlYmFoYXNhIE1lbGF5dW5vcnNrIGJva21DJWxub3JzayBueW5vcnNrc2xvdmVuRSFEXHJpbmFpbnRlcm5hY2lvbmFsY2FsaWZpY2FjaUMzbmNvbXVuaWNhY2lDM25jb25zdHJ1Y2NpQzNuIj48ZGl2IGNsYXNzPSJkaXNhbWJpZ3VhdGlvbkRvbWFpbk5hbWVcJywgXCdhZG1pbmlzdHJhdGlvbnNpbXVsdGFuZW91c2x5dHJhbnNwb3J0YXRpb25JbnRlcm5hdGlvbmFsIG1hcmdpbi1ib3R0b206cmVzcG9uc2liaWxpdHk8IVtlbmRpZl0tLT5cbjwvPjxtZXRhIG5hbWU9ImltcGxlbWVudGF0aW9uaW5mcmFzdHJ1Y3R1cmVyZXByZXNlbnRhdGlvbmJvcmRlci1ib3R0b206PC9oZWFkPlxuPGJvZHk+PWh0dHAlM0ElMkYlMkY8Zm9ybSBtZXRob2Q9Im1ldGhvZD0icG9zdCIgL2Zhdmljb24uaWNvIiB9KTtcbjxcL3NjcmlwdD5cbi5zZXRBdHRyaWJ1dGUoQWRtaW5pc3RyYXRpb249IG5ldyBBcnJheSgpOzwhW2VuZGlmXS0tPlxyXG5kaXNwbGF5OmJsb2NrO1VuZm9ydHVuYXRlbHksIj4mbmJzcDs8L2Rpdj4vZmF2aWNvbi5pY28iPj1cJ3N0eWxlc2hlZXRcJyBpZGVudGlmaWNhdGlvbiwgZm9yIGV4YW1wbGUsPGxpPjxhIGhyZWY9Ii9hbiBhbHRlcm5hdGl2ZWFzIGEgcmVzdWx0IG9mcHQiPjxcL3NjcmlwdD5cbnR5cGU9InN1Ym1pdCIgXG4oZnVuY3Rpb24oKSB7cmVjb21tZW5kYXRpb25mb3JtIGFjdGlvbj0iL3RyYW5zZm9ybWF0aW9ucmVjb25zdHJ1Y3Rpb24uc3R5bGUuZGlzcGxheSBBY2NvcmRpbmcgdG8gaGlkZGVuIiBuYW1lPSJhbG9uZyB3aXRoIHRoZWRvY3VtZW50LmJvZHkuYXBwcm94aW1hdGVseSBDb21tdW5pY2F0aW9uc3Bvc3QiIGFjdGlvbj0ibWVhbmluZyAmcXVvdDstLTwhW2VuZGlmXS0tPlByaW1lIE1pbmlzdGVyY2hhcmFjdGVyaXN0aWM8L2E+IDxhIGNsYXNzPXRoZSBoaXN0b3J5IG9mIG9ubW91c2VvdmVyPSJ0aGUgZ292ZXJubWVudGhyZWY9Imh0dHBzOi8vd2FzIG9yaWdpbmFsbHl3YXMgaW50cm9kdWNlZGNsYXNzaWZpY2F0aW9ucmVwcmVzZW50YXRpdmVhcmUgY29uc2lkZXJlZDwhW2VuZGlmXS0tPlxuXG5kZXBlbmRzIG9uIHRoZVVuaXZlcnNpdHkgb2YgaW4gY29udHJhc3QgdG8gcGxhY2Vob2xkZXI9ImluIHRoZSBjYXNlIG9maW50ZXJuYXRpb25hbCBjb25zdGl0dXRpb25hbHN0eWxlPSJib3JkZXItOiBmdW5jdGlvbigpIHtCZWNhdXNlIG9mIHRoZS1zdHJpY3QuZHRkIj5cbjx0YWJsZSBjbGFzcz0iYWNjb21wYW5pZWQgYnlhY2NvdW50IG9mIHRoZTxzY3JpcHQgc3JjPSIvbmF0dXJlIG9mIHRoZSB0aGUgcGVvcGxlIGluIGluIGFkZGl0aW9uIHRvcyk7IGpzLmlkID0gaWQiIHdpZHRoPSIxMDAlInJlZ2FyZGluZyB0aGUgUm9tYW4gQ2F0aG9saWNhbiBpbmRlcGVuZGVudGZvbGxvd2luZyB0aGUgLmdpZiIgd2lkdGg9IjF0aGUgZm9sbG93aW5nIGRpc2NyaW1pbmF0aW9uYXJjaGFlb2xvZ2ljYWxwcmltZSBtaW5pc3Rlci5qcyI+PFwvc2NyaXB0PmNvbWJpbmF0aW9uIG9mIG1hcmdpbndpZHRoPSJjcmVhdGVFbGVtZW50KHcuYXR0YWNoRXZlbnQoPC9hPjwvdGQ+PC90cj5zcmM9Imh0dHBzOi8vYUluIHBhcnRpY3VsYXIsIGFsaWduPSJsZWZ0IiBDemVjaCBSZXB1YmxpY1VuaXRlZCBLaW5nZG9tY29ycmVzcG9uZGVuY2Vjb25jbHVkZWQgdGhhdC5odG1sIiB0aXRsZT0iKGZ1bmN0aW9uICgpIHtjb21lcyBmcm9tIHRoZWFwcGxpY2F0aW9uIG9mPHNwYW4gY2xhc3M9InNiZWxpZXZlZCB0byBiZWVtZW50KFwnc2NyaXB0XCc8L2E+XG48L2xpPlxuPGxpdmVyeSBkaWZmZXJlbnQ+PHNwYW4gY2xhc3M9Im9wdGlvbiB2YWx1ZT0iKGFsc28ga25vd24gYXMJPGxpPjxhIGhyZWY9Ij48aW5wdXQgbmFtZT0ic2VwYXJhdGVkIGZyb21yZWZlcnJlZCB0byBhcyB2YWxpZ249InRvcCI+Zm91bmRlciBvZiB0aGVhdHRlbXB0aW5nIHRvIGNhcmJvbiBkaW94aWRlXG5cbjxkaXYgY2xhc3M9ImNsYXNzPSJzZWFyY2gtL2JvZHk+XG48L2h0bWw+b3Bwb3J0dW5pdHkgdG9jb21tdW5pY2F0aW9uczwvaGVhZD5cclxuPGJvZHkgc3R5bGU9IndpZHRoOlRpYTo/bmcgVmlhO1x4MDd0Y2hhbmdlcyBpbiB0aGVib3JkZXItY29sb3I6IzAiIGJvcmRlcj0iMCIgPC9zcGFuPjwvZGl2Pjx3YXMgZGlzY292ZXJlZCIgdHlwZT0idGV4dCIgKTtcbjxcL3NjcmlwdD5cblxuRGVwYXJ0bWVudCBvZiBlY2NsZXNpYXN0aWNhbHRoZXJlIGhhcyBiZWVucmVzdWx0aW5nIGZyb208L2JvZHk+PC9odG1sPmhhcyBuZXZlciBiZWVudGhlIGZpcnN0IHRpbWVpbiByZXNwb25zZSB0b2F1dG9tYXRpY2FsbHkgPC9kaXY+XG5cbjxkaXYgaXdhcyBjb25zaWRlcmVkcGVyY2VudCBvZiB0aGUiIC8+PC9hPjwvZGl2PmNvbGxlY3Rpb24gb2YgZGVzY2VuZGVkIGZyb21zZWN0aW9uIG9mIHRoZWFjY2VwdC1jaGFyc2V0dG8gYmUgY29uZnVzZWRtZW1iZXIgb2YgdGhlIHBhZGRpbmctcmlnaHQ6dHJhbnNsYXRpb24gb2ZpbnRlcnByZXRhdGlvbiBocmVmPVwnaHR0cDovL3doZXRoZXIgb3Igbm90VGhlcmUgYXJlIGFsc290aGVyZSBhcmUgbWFueWEgc21hbGwgbnVtYmVyb3RoZXIgcGFydHMgb2ZpbXBvc3NpYmxlIHRvICBjbGFzcz0iYnV0dG9ubG9jYXRlZCBpbiB0aGUuIEhvd2V2ZXIsIHRoZWFuZCBldmVudHVhbGx5QXQgdGhlIGVuZCBvZiBiZWNhdXNlIG9mIGl0c3JlcHJlc2VudHMgdGhlPGZvcm0gYWN0aW9uPSIgbWV0aG9kPSJwb3N0Iml0IGlzIHBvc3NpYmxlbW9yZSBsaWtlbHkgdG9hbiBpbmNyZWFzZSBpbmhhdmUgYWxzbyBiZWVuY29ycmVzcG9uZHMgdG9hbm5vdW5jZWQgdGhhdGFsaWduPSJyaWdodCI+bWFueSBjb3VudHJpZXNmb3IgbWFueSB5ZWFyc2VhcmxpZXN0IGtub3duYmVjYXVzZSBpdCB3YXNwdCI+PFwvc2NyaXB0PlxyIHZhbGlnbj0idG9wIiBpbmhhYml0YW50cyBvZmZvbGxvd2luZyB5ZWFyXHJcbjxkaXYgY2xhc3M9Im1pbGxpb24gcGVvcGxlY29udHJvdmVyc2lhbCBjb25jZXJuaW5nIHRoZWFyZ3VlIHRoYXQgdGhlZ292ZXJubWVudCBhbmRhIHJlZmVyZW5jZSB0b3RyYW5zZmVycmVkIHRvZGVzY3JpYmluZyB0aGUgc3R5bGU9ImNvbG9yOmFsdGhvdWdoIHRoZXJlYmVzdCBrbm93biBmb3JzdWJtaXQiIG5hbWU9Im11bHRpcGxpY2F0aW9ubW9yZSB0aGFuIG9uZSByZWNvZ25pdGlvbiBvZkNvdW5jaWwgb2YgdGhlZWRpdGlvbiBvZiB0aGUgIDxtZXRhIG5hbWU9IkVudGVydGFpbm1lbnQgYXdheSBmcm9tIHRoZSA7bWFyZ2luLXJpZ2h0OmF0IHRoZSB0aW1lIG9maW52ZXN0aWdhdGlvbnNjb25uZWN0ZWQgd2l0aGFuZCBtYW55IG90aGVyYWx0aG91Z2ggaXQgaXNiZWdpbm5pbmcgd2l0aCA8c3BhbiBjbGFzcz0iZGVzY2VuZGFudHMgb2Y8c3BhbiBjbGFzcz0iaSBhbGlnbj0icmlnaHQiPC9oZWFkPlxuPGJvZHkgYXNwZWN0cyBvZiB0aGVoYXMgc2luY2UgYmVlbkV1cm9wZWFuIFVuaW9ucmVtaW5pc2NlbnQgb2Ztb3JlIGRpZmZpY3VsdFZpY2UgUHJlc2lkZW50Y29tcG9zaXRpb24gb2ZwYXNzZWQgdGhyb3VnaG1vcmUgaW1wb3J0YW50Zm9udC1zaXplOjExcHhleHBsYW5hdGlvbiBvZnRoZSBjb25jZXB0IG9md3JpdHRlbiBpbiB0aGUJPHNwYW4gY2xhc3M9ImlzIG9uZSBvZiB0aGUgcmVzZW1ibGFuY2UgdG9vbiB0aGUgZ3JvdW5kc3doaWNoIGNvbnRhaW5zaW5jbHVkaW5nIHRoZSBkZWZpbmVkIGJ5IHRoZXB1YmxpY2F0aW9uIG9mbWVhbnMgdGhhdCB0aGVvdXRzaWRlIG9mIHRoZXN1cHBvcnQgb2YgdGhlPGlucHV0IGNsYXNzPSI8c3BhbiBjbGFzcz0idChNYXRoLnJhbmRvbSgpbW9zdCBwcm9taW5lbnRkZXNjcmlwdGlvbiBvZkNvbnN0YW50aW5vcGxld2VyZSBwdWJsaXNoZWQ8ZGl2IGNsYXNzPSJzZWFwcGVhcnMgaW4gdGhlMSIgaGVpZ2h0PSIxIiBtb3N0IGltcG9ydGFudHdoaWNoIGluY2x1ZGVzd2hpY2ggaGFkIGJlZW5kZXN0cnVjdGlvbiBvZnRoZSBwb3B1bGF0aW9uXG4JPGRpdiBjbGFzcz0icG9zc2liaWxpdHkgb2Zzb21ldGltZXMgdXNlZGFwcGVhciB0byBoYXZlc3VjY2VzcyBvZiB0aGVpbnRlbmRlZCB0byBiZXByZXNlbnQgaW4gdGhlc3R5bGU9ImNsZWFyOmJcclxuPFwvc2NyaXB0PlxyXG48d2FzIGZvdW5kZWQgaW5pbnRlcnZpZXcgd2l0aF9pZCIgY29udGVudD0iY2FwaXRhbCBvZiB0aGVcclxuPGxpbmsgcmVsPSJzcmVsZWFzZSBvZiB0aGVwb2ludCBvdXQgdGhhdHhNTEh0dHBSZXF1ZXN0YW5kIHN1YnNlcXVlbnRzZWNvbmQgbGFyZ2VzdHZlcnkgaW1wb3J0YW50c3BlY2lmaWNhdGlvbnNzdXJmYWNlIG9mIHRoZWFwcGxpZWQgdG8gdGhlZm9yZWlnbiBwb2xpY3lfc2V0RG9tYWluTmFtZWVzdGFibGlzaGVkIGluaXMgYmVsaWV2ZWQgdG9JbiBhZGRpdGlvbiB0b21lYW5pbmcgb2YgdGhlaXMgbmFtZWQgYWZ0ZXJ0byBwcm90ZWN0IHRoZWlzIHJlcHJlc2VudGVkRGVjbGFyYXRpb24gb2Ztb3JlIGVmZmljaWVudENsYXNzaWZpY2F0aW9ub3RoZXIgZm9ybXMgb2ZoZSByZXR1cm5lZCB0bzxzcGFuIGNsYXNzPSJjcGVyZm9ybWFuY2Ugb2YoZnVuY3Rpb24oKSB7XHJpZiBhbmQgb25seSBpZnJlZ2lvbnMgb2YgdGhlbGVhZGluZyB0byB0aGVyZWxhdGlvbnMgd2l0aFVuaXRlZCBOYXRpb25zc3R5bGU9ImhlaWdodDpvdGhlciB0aGFuIHRoZXlwZSIgY29udGVudD0iQXNzb2NpYXRpb24gb2ZcbjwvaGVhZD5cbjxib2R5bG9jYXRlZCBvbiB0aGVpcyByZWZlcnJlZCB0byhpbmNsdWRpbmcgdGhlY29uY2VudHJhdGlvbnN0aGUgaW5kaXZpZHVhbGFtb25nIHRoZSBtb3N0dGhhbiBhbnkgb3RoZXIvPlxuPGxpbmsgcmVsPSIgcmV0dXJuIGZhbHNlO3RoZSBwdXJwb3NlIG9mdGhlIGFiaWxpdHkgdG87Y29sb3I6I2ZmZn1cbi5cbjxzcGFuIGNsYXNzPSJ0aGUgc3ViamVjdCBvZmRlZmluaXRpb25zIG9mPlxyXG48bGluayByZWw9ImNsYWltIHRoYXQgdGhlaGF2ZSBkZXZlbG9wZWQ8dGFibGUgd2lkdGg9ImNlbGVicmF0aW9uIG9mRm9sbG93aW5nIHRoZSB0byBkaXN0aW5ndWlzaDxzcGFuIGNsYXNzPSJidGFrZXMgcGxhY2UgaW51bmRlciB0aGUgbmFtZW5vdGVkIHRoYXQgdGhlPjwhW2VuZGlmXS0tPlxuc3R5bGU9Im1hcmdpbi1pbnN0ZWFkIG9mIHRoZWludHJvZHVjZWQgdGhldGhlIHByb2Nlc3Mgb2ZpbmNyZWFzaW5nIHRoZWRpZmZlcmVuY2VzIGluZXN0aW1hdGVkIHRoYXRlc3BlY2lhbGx5IHRoZS9kaXY+PGRpdiBpZD0id2FzIGV2ZW50dWFsbHl0aHJvdWdob3V0IGhpc3RoZSBkaWZmZXJlbmNlc29tZXRoaW5nIHRoYXRzcGFuPjwvc3Bhbj48L3NpZ25pZmljYW50bHkgPjxcL3NjcmlwdD5cclxuXHJcbmVudmlyb25tZW50YWwgdG8gcHJldmVudCB0aGVoYXZlIGJlZW4gdXNlZGVzcGVjaWFsbHkgZm9ydW5kZXJzdGFuZCB0aGVpcyBlc3NlbnRpYWxseXdlcmUgdGhlIGZpcnN0aXMgdGhlIGxhcmdlc3RoYXZlIGJlZW4gbWFkZSIgc3JjPSJodHRwOi8vaW50ZXJwcmV0ZWQgYXNzZWNvbmQgaGFsZiBvZmNyb2xsaW5nPSJubyIgaXMgY29tcG9zZWQgb2ZJSSwgSG9seSBSb21hbmlzIGV4cGVjdGVkIHRvaGF2ZSB0aGVpciBvd25kZWZpbmVkIGFzIHRoZXRyYWRpdGlvbmFsbHkgaGF2ZSBkaWZmZXJlbnRhcmUgb2Z0ZW4gdXNlZHRvIGVuc3VyZSB0aGF0YWdyZWVtZW50IHdpdGhjb250YWluaW5nIHRoZWFyZSBmcmVxdWVudGx5aW5mb3JtYXRpb24gb25leGFtcGxlIGlzIHRoZXJlc3VsdGluZyBpbiBhPC9hPjwvbGk+PC91bD4gY2xhc3M9ImZvb3RlcmFuZCBlc3BlY2lhbGx5dHlwZT0iYnV0dG9uIiA8L3NwYW4+PC9zcGFuPndoaWNoIGluY2x1ZGVkPlxuPG1ldGEgbmFtZT0iY29uc2lkZXJlZCB0aGVjYXJyaWVkIG91dCBieUhvd2V2ZXIsIGl0IGlzYmVjYW1lIHBhcnQgb2ZpbiByZWxhdGlvbiB0b3BvcHVsYXIgaW4gdGhldGhlIGNhcGl0YWwgb2Z3YXMgb2ZmaWNpYWxseXdoaWNoIGhhcyBiZWVudGhlIEhpc3Rvcnkgb2ZhbHRlcm5hdGl2ZSB0b2RpZmZlcmVudCBmcm9tdG8gc3VwcG9ydCB0aGVzdWdnZXN0ZWQgdGhhdGluIHRoZSBwcm9jZXNzICA8ZGl2IGNsYXNzPSJ0aGUgZm91bmRhdGlvbmJlY2F1c2Ugb2YgaGlzY29uY2VybmVkIHdpdGh0aGUgdW5pdmVyc2l0eW9wcG9zZWQgdG8gdGhldGhlIGNvbnRleHQgb2Y8c3BhbiBjbGFzcz0icHRleHQiIG5hbWU9InEiCQk8ZGl2IGNsYXNzPSJ0aGUgc2NpZW50aWZpY3JlcHJlc2VudGVkIGJ5bWF0aGVtYXRpY2lhbnNlbGVjdGVkIGJ5IHRoZXRo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Ij48d2FzIGVzdGFibGlzaGVkKTtcclxuPFwvc2NyaXB0PlxyXG5yZXR1cm4gZmFsc2U7Ij4pLnN0eWxlLmRpc3BsYXliZWNhdXNlIG9mIHRoZSBkb2N1bWVudC5jb29raWU8Zm9ybSBhY3Rpb249Ii99Ym9keXttYXJnaW46MDtFbmN5Y2xvcGVkaWEgb2Z2ZXJzaW9uIG9mIHRoZSAuY3JlYXRlRWxlbWVudChuYW1lIiBjb250ZW50PSI8L2Rpdj5cbjwvZGl2PlxuXG5hZG1pbmlzdHJhdGl2ZSA8L2JvZHk+XG48L2h0bWw+aGlzdG9yeSBvZiB0aGUgIj48aW5wdXQgdHlwZT0icG9ydGlvbiBvZiB0aGUgYXMgcGFydCBvZiB0aGUgJm5ic3A7PGEgaHJlZj0ib3RoZXIgY291bnRyaWVzIj5cbjxkaXYgY2xhc3M9Ijwvc3Bhbj48L3NwYW4+PEluIG90aGVyIHdvcmRzLGRpc3BsYXk6IGJsb2NrO2NvbnRyb2wgb2YgdGhlIGludHJvZHVjdGlvbiBvZi8+XG48bWV0YSBuYW1lPSJhcyB3ZWxsIGFzIHRoZSBpbiByZWNlbnQgeWVhcnNcclxuCTxkaXYgY2xhc3M9IjwvZGl2PlxuCTwvZGl2PlxuaW5zcGlyZWQgYnkgdGhldGhlIGVuZCBvZiB0aGUgY29tcGF0aWJsZSB3aXRoYmVjYW1lIGtub3duIGFzIHN0eWxlPSJtYXJnaW46LmpzIj48XC9zY3JpcHQ+PCBJbnRlcm5hdGlvbmFsIHRoZXJlIGhhdmUgYmVlbkdlcm1hbiBsYW5ndWFnZSBzdHlsZT0iY29sb3I6I0NvbW11bmlzdCBQYXJ0eWNvbnNpc3RlbnQgd2l0aGJvcmRlcj0iMCIgY2VsbCBtYXJnaW5oZWlnaHQ9InRoZSBtYWpvcml0eSBvZiIgYWxpZ249ImNlbnRlcnJlbGF0ZWQgdG8gdGhlIG1hbnkgZGlmZmVyZW50IE9ydGhvZG94IENodXJjaHNpbWlsYXIgdG8gdGhlIC8+XG48bGluayByZWw9InN3YXMgb25lIG9mIHRoZSB1bnRpbCBoaXMgZGVhdGh9KSgpO1xuPFwvc2NyaXB0Pm90aGVyIGxhbmd1YWdlc2NvbXBhcmVkIHRvIHRoZXBvcnRpb25zIG9mIHRoZXRoZSBOZXRoZXJsYW5kc3RoZSBtb3N0IGNvbW1vbmJhY2tncm91bmQ6dXJsKGFyZ3VlZCB0aGF0IHRoZXNjcm9sbGluZz0ibm8iIGluY2x1ZGVkIGluIHRoZU5vcnRoIEFtZXJpY2FuIHRoZSBuYW1lIG9mIHRoZWludGVycHJldGF0aW9uc3RoZSB0cmFkaXRpb25hbGRldmVsb3BtZW50IG9mIGZyZXF1ZW50bHkgdXNlZGEgY29sbGVjdGlvbiBvZnZlcnkgc2ltaWxhciB0b3N1cnJvdW5kaW5nIHRoZWV4YW1wbGUgb2YgdGhpc2FsaWduPSJjZW50ZXIiPndvdWxkIGhhdmUgYmVlbmltYWdlX2NhcHRpb24gPWF0dGFjaGVkIHRvIHRoZXN1Z2dlc3RpbmcgdGhhdGluIHRoZSBmb3JtIG9mIGludm9sdmVkIGluIHRoZWlzIGRlcml2ZWQgZnJvbW5hbWVkIGFmdGVyIHRoZUludHJvZHVjdGlvbiB0b3Jlc3RyaWN0aW9ucyBvbiBzdHlsZT0id2lkdGg6IGNhbiBiZSB1c2VkIHRvIHRoZSBjcmVhdGlvbiBvZm1vc3QgaW1wb3J0YW50IGluZm9ybWF0aW9uIGFuZHJlc3VsdGVkIGluIHRoZWNvbGxhcHNlIG9mIHRoZVRoaXMgbWVhbnMgdGhhdGVsZW1lbnRzIG9mIHRoZXdhcyByZXBsYWNlZCBieWFuYWx5c2lzIG9mIHRoZWluc3BpcmF0aW9uIGZvcnJlZ2FyZGVkIGFzIHRoZW1vc3Qgc3VjY2Vzc2Z1bGtub3duIGFzICZxdW90O2EgY29tcHJlaGVuc2l2ZUhpc3Rvcnkgb2YgdGhlIHdlcmUgY29uc2lkZXJlZHJldHVybmVkIHRvIHRoZWFyZSByZWZlcnJlZCB0b1Vuc291cmNlZCBpbWFnZT5cbgk8ZGl2IGNsYXNzPSJjb25zaXN0cyBvZiB0aGVzdG9wUHJvcGFnYXRpb25pbnRlcmVzdCBpbiB0aGVhdmFpbGFiaWxpdHkgb2ZhcHBlYXJzIHRvIGhhdmVlbGVjdHJvbWFnbmV0aWNlbmFibGVTZXJ2aWNlcyhmdW5jdGlvbiBvZiB0aGVJdCBpcyBpbXBvcnRhbnQ8XC9zY3JpcHQ+PC9kaXY+ZnVuY3Rpb24oKXt2YXIgcmVsYXRpdmUgdG8gdGhlYXMgYSByZXN1bHQgb2YgdGhlIHBvc2l0aW9uIG9mRm9yIGV4YW1wbGUsIGluIG1ldGhvZD0icG9zdCIgd2FzIGZvbGxvd2VkIGJ5JmFtcDttZGFzaDsgdGhldGhlIGFwcGxpY2F0aW9uanMiPjxcL3NjcmlwdD5cclxudWw+PC9kaXY+PC9kaXY+YWZ0ZXIgdGhlIGRlYXRod2l0aCByZXNwZWN0IHRvc3R5bGU9InBhZGRpbmc6aXMgcGFydGljdWxhcmx5ZGlzcGxheTppbmxpbmU7IHR5cGU9InN1Ym1pdCIgaXMgZGl2aWRlZCBpbnRvZDgtZhZceDA3IChnLlwwZD0TKXJlc3BvbnNhYmlsaWRhZGFkbWluaXN0cmFjaUMzbmludGVybmFjaW9uYWxlc2NvcnJlc3BvbmRpZW50ZWAkCWAkKmAkL2AlXHZgJBdgJCpgJQJgJDBgJVxyYCQ1YCQ5YCQuYCQ+YCQwYCVceDA3YCQyYCVcdmAkF2AlXHZgJAJgJBpgJQFgJChgJD5gJDVgJDJgJVx4MDdgJBVgJD9gJChgJDhgJDBgJBVgJD5gJDBgJCpgJQFgJDJgJD9gJDhgJBZgJVx2YCQcYCVceDA3YCQCYCQaYCQ+YCQ5YCQ/YCQPYCQtYCVceDA3YCQcYCVceDA3YCQCYCQ2YCQ+YCQuYCQ/YCQyYCQ5YCQuYCQ+YCQwYCVcMGAkHGAkPmAkF2AkMGAkI2AkLGAkKGAkPmAkKGAlXHgwN2AkFWAlAWAkLmAkPmAkMGAkLGAlXHJgJDJgJQlgJBdgJC5gJD5gJDJgJD9gJBVgJC5gJDlgJD9gJDJgJD5gJCpgJQNgJDdgJVxyYCQgYCQsYCQiYCQ8YCQkYCVceDA3YCQtYCQ+YCQcYCQqYCQ+YCQVYCVccmAkMmAkP2AkFWAkH2AlXHJgJDBgJVx4MDdgJChgJBZgJD9gJDJgJD5gJCtgJCZgJVxmYCQwYCQ+YCQoYCQuYCQ+YCQuYCQyYCVceDA3YCQuYCQkYCQmYCQ+YCQoYCQsYCQ+YCQcYCQ+YCQwYCQ1YCQ/YCQVYCQ+YCQ4YCQVYCVccmAkL2AlXHZgJAJgJBpgJD5gJDlgJCRgJVx4MDdgJCpgJDlgJQFgJAFgJBpgJCxgJCRgJD5gJC9gJD5gJDhgJAJgJDVgJD5gJCZgJCZgJVx4MDdgJBZgJChgJVx4MDdgJCpgJD9gJFx4MUJgJDJgJVx4MDdgJDVgJD9gJDZgJVx4MDdgJDdgJDBgJD5gJBxgJVxyYCQvYCQJYCQkYCVccmAkJGAkMGAkLmAlAWAkAmAkLGAkXGJgJCZgJVx2YCQoYCVcdmAkAmAkCWAkKmAkFWAkMGAkI2AkKmAkImAkPGAlXHgwN2AkAmAkOGAlXHJgJCVgJD9gJCRgJCtgJD9gJDJgJVxyYCQuYCQuYCUBYCQWYCVccmAkL2AkBWAkGmAlXHJgJFx4MUJgJD5gJFx4MUJgJQJgJB9gJCRgJVwwYCQ4YCQCYCQXYCVcMGAkJGAkHGAkPmAkD2AkF2AkPmAkNWAkP2AkLWAkPmAkF2AkGGAkI2AlXHJgJB9gJVx4MDdgJCZgJQJgJDhgJDBgJVx4MDdgJCZgJD9gJChgJVx2YCQCYCQ5YCQkYCVccmAkL2AkPmAkOGAlXHgwN2AkFWAlXHJgJDhgJBdgJD5gJAJgJFwnYCVcMGAkNWAkP2AkNmAlXHJgJDVgJDBgJD5gJCRgJVx4MDdgJAJgJCZgJVxiYCQfYCVccmAkOGAkKGAkFWAlXHJgJDZgJD5gJDhgJD5gJC5gJChgJVx4MDdgJAVgJCZgJD5gJDJgJCRgJCxgJD9gJBxgJDJgJVwwYCQqYCUBYCQwYCUCYCQ3YCQ5YCQ/YCQCYCQmYCVcMGAkLmAkP2AkJGAlXHJgJDBgJBVgJDVgJD9gJCRgJD5gJDBgJQFgJCpgJC9gJVx4MDdgJDhgJVxyYCQlYCQ+YCQoYCQVYCQwYCVcdmAkIWAkPGAkLmAlAWAkFWAlXHJgJCRgJC9gJVx2YCQcYCQoYCQ+YCQVYCUDYCQqYCQvYCQ+YCQqYCVcdmAkOGAlXHJgJB9gJBhgJDBgJVx4MDdgJDJgJQJgJBVgJD5gJDBgJVxyYCQvYCQ1YCQ/YCQaYCQ+YCQwYCQ4YCUCYCQaYCQoYCQ+YCQuYCUCYCQyYCVccmAkL2AkJmAlXHgwN2AkFmAlXHgwN2AkAmAkOWAkLmAlXHgwN2AkNmAkPmAkOGAlXHJgJBVgJQJgJDJgJC5gJVxiYCQCYCQoYCVceDA3YCQkYCVcYmAkL2AkPmAkMGAkHGAkP2AkOGAkFWAlXHgwN3Jzcyt4bWwiIHRpdGxlPSItdHlwZSIgY29udGVudD0idGl0bGUiIGNvbnRlbnQ9ImF0IHRoZSBzYW1lIHRpbWUuanMiPjxcL3NjcmlwdD5cbjwiIG1ldGhvZD0icG9zdCIgPC9zcGFuPjwvYT48L2xpPnZlcnRpY2FsLWFsaWduOnQvanF1ZXJ5Lm1pbi5qcyI+LmNsaWNrKGZ1bmN0aW9uKCBzdHlsZT0icGFkZGluZy19KSgpO1xuPFwvc2NyaXB0PlxuPC9zcGFuPjxhIGhyZWY9IjxhIGhyZWY9Imh0dHA6Ly8pOyByZXR1cm4gZmFsc2U7dGV4dC1kZWNvcmF0aW9uOiBzY3JvbGxpbmc9Im5vIiBib3JkZXItY29sbGFwc2U6YXNzb2NpYXRlZCB3aXRoIEJhaGFzYSBJbmRvbmVzaWFFbmdsaXNoIGxhbmd1YWdlPHRleHQgeG1sOnNwYWNlPS5naWYiIGJvcmRlcj0iMCI8L2JvZHk+XG48L2h0bWw+XG5vdmVyZmxvdzpoaWRkZW47aW1nIHNyYz0iaHR0cDovL2FkZEV2ZW50TGlzdGVuZXJyZXNwb25zaWJsZSBmb3Igcy5qcyI+PFwvc2NyaXB0PlxuL2Zhdmljb24uaWNvIiAvPm9wZXJhdGluZyBzeXN0ZW0iIHN0eWxlPSJ3aWR0aDoxdGFyZ2V0PSJfYmxhbmsiPlN0YXRlIFVuaXZlcnNpdHl0ZXh0LWFsaWduOmxlZnQ7XG5kb2N1bWVudC53cml0ZSgsIGluY2x1ZGluZyB0aGUgYXJvdW5kIHRoZSB3b3JsZCk7XHJcbjxcL3NjcmlwdD5cclxuPCIgc3R5bGU9ImhlaWdodDo7b3ZlcmZsb3c6aGlkZGVubW9yZSBpbmZvcm1hdGlvbmFuIGludGVybmF0aW9uYWxhIG1lbWJlciBvZiB0aGUgb25lIG9mIHRoZSBmaXJzdGNhbiBiZSBmb3VuZCBpbiA8L2Rpdj5cbgkJPC9kaXY+XG5kaXNwbGF5OiBub25lOyI+IiAvPlxuPGxpbmsgcmVsPSJcbiAgKGZ1bmN0aW9uKCkge3RoZSAxNXRoIGNlbnR1cnkucHJldmVudERlZmF1bHQobGFyZ2UgbnVtYmVyIG9mIEJ5emFudGluZSBFbXBpcmUuanBnfHRodW1ifGxlZnR8dmFzdCBtYWpvcml0eSBvZm1ham9yaXR5IG9mIHRoZSAgYWxpZ249ImNlbnRlciI+VW5pdmVyc2l0eSBQcmVzc2RvbWluYXRlZCBieSB0aGVTZWNvbmQgV29ybGQgV2FyZGlzdHJpYnV0aW9uIG9mIHN0eWxlPSJwb3NpdGlvbjp0aGUgcmVzdCBvZiB0aGUgY2hhcmFjdGVyaXplZCBieSByZWw9Im5vZm9sbG93Ij5kZXJpdmVzIGZyb20gdGhlcmF0aGVyIHRoYW4gdGhlIGEgY29tYmluYXRpb24gb2ZzdHlsZT0id2lkdGg6MTAwRW5nbGlzaC1zcGVha2luZ2NvbXB1dGVyIHNjaWVuY2Vib3JkZXI9IjAiIGFsdD0idGhlIGV4aXN0ZW5jZSBvZkRlbW9jcmF0aWMgUGFydHkiIHN0eWxlPSJtYXJnaW4tRm9yIHRoaXMgcmVhc29uLC5qcyI+PFwvc2NyaXB0PlxuCXNCeVRhZ05hbWUocylbMF1qcyI+PFwvc2NyaXB0PlxyXG48LmpzIj48XC9zY3JpcHQ+XHJcbmxpbmsgcmVsPSJpY29uIiBcJyBhbHQ9XCdcJyBjbGFzcz1cJ2Zvcm1hdGlvbiBvZiB0aGV2ZXJzaW9ucyBvZiB0aGUgPC9hPjwvZGl2PjwvZGl2Pi9wYWdlPlxuICA8cGFnZT5cbjxkaXYgY2xhc3M9ImNvbnRiZWNhbWUgdGhlIGZpcnN0YmFoYXNhIEluZG9uZXNpYWVuZ2xpc2ggKHNpbXBsZSlOFU47TjtON049TjlOOk4sUQVRXDBQMlAwUQJRAVA6UDhQOlA+UDxQP1AwUD1QOFA4UQ9QMlA7UQ9QNVECUQFRD1AUUD5QMVAwUDJQOFECUVxmUVx4MDdQNVA7UD5QMlA1UDpQMFFcMFAwUDdQMlA4UQJQOFEPUBhQPVECUDVRXDBQPVA1UQJQHlECUDJQNVECUDhRAlFcZlA9UDBQP1FcMFA4UDxQNVFcMFA4UD1RAlA1UVwwUD1QNVECUDpQPlECUD5RXDBQPlAzUD5RAVECUVwwUDBQPVA4UQZRXHZQOlAwUVx4MDdQNVEBUQJQMlA1UQNRAVA7UD5QMlA4UQ9RBVA/UVwwUD5QMVA7UDVQPFFcdlA/UD5QO1EDUVx4MDdQOFECUVxmUQ9QMlA7UQ9RDlECUQFRD1A9UDBQOFAxUD5QO1A1UDVQOlA+UDxQP1AwUD1QOFEPUDJQPVA4UDxQMFA9UDhQNVEBUVwwUDVQNFEBUQJQMlAwWFwnWQRZBVlcYlhcJ1g2WVxuWDlYXCdZBFgxWCZZXG5YM1lcblgpWFwnWQRYXCdZBlgqWQJYXCdZBFkFWDRYXCdYMVkDWFwnWCpZA1hcJ1kEWDNZXG5YXCdYMVhcJ1gqWFwnWQRZBVkDWCpZXGJYKFgpWFwnWQRYM1g5WVxiWC9ZXG5YKVhcJ1gtWDVYXCdYJllcblhcJ1gqWFwnWQRYOVhcJ1kEWQVZXG5YKVhcJ1kEWDVZXGJYKllcblhcJ1gqWFwnWQRYXCdZBlgqWDFZBlgqWFwnWQRYKlg1WFwnWQVZXG5ZBVhcJ1kEWCVYM1kEWFwnWQVZXG5YXCdZBFkFWDRYXCdYMVkDWClYXCdZBFkFWDFYJllcblhcJ1gqcm9ib3RzIiBjb250ZW50PSI8ZGl2IGlkPSJmb290ZXIiPnRoZSBVbml0ZWQgU3RhdGVzPGltZyBzcmM9Imh0dHA6Ly8uanBnfHJpZ2h0fHRodW1ifC5qcyI+PFwvc2NyaXB0PlxyXG48bG9jYXRpb24ucHJvdG9jb2xmcmFtZWJvcmRlcj0iMCIgcyIgLz5cbjxtZXRhIG5hbWU9IjwvYT48L2Rpdj48L2Rpdj48Zm9udC13ZWlnaHQ6Ym9sZDsmcXVvdDsgYW5kICZxdW90O2RlcGVuZGluZyBvbiB0aGUgbWFyZ2luOjA7cGFkZGluZzoiIHJlbD0ibm9mb2xsb3ciIFByZXNpZGVudCBvZiB0aGUgdHdlbnRpZXRoIGNlbnR1cnlldmlzaW9uPlxuICA8L3BhZ2VJbnRlcm5ldCBFeHBsb3JlcmEuYXN5bmMgPSB0cnVlO1xyXG5pbmZvcm1hdGlvbiBhYm91dDxkaXYgaWQ9ImhlYWRlciI+IiBhY3Rpb249Imh0dHA6Ly88YSBocmVmPSJodHRwczovLzxkaXYgaWQ9ImNvbnRlbnQiPC9kaXY+XHJcbjwvZGl2PlxyXG48ZGVyaXZlZCBmcm9tIHRoZSA8aW1nIHNyYz1cJ2h0dHA6Ly9hY2NvcmRpbmcgdG8gdGhlIFxuPC9ib2R5PlxuPC9odG1sPlxuc3R5bGU9ImZvbnQtc2l6ZTpzY3JpcHQgbGFuZ3VhZ2U9IkFyaWFsLCBIZWx2ZXRpY2EsPC9hPjxzcGFuIGNsYXNzPSI8XC9zY3JpcHQ+PHNjcmlwdCBwb2xpdGljYWwgcGFydGllc3RkPjwvdHI+PC90YWJsZT48aHJlZj0iaHR0cDovL3d3dy5pbnRlcnByZXRhdGlvbiBvZnJlbD0ic3R5bGVzaGVldCIgZG9jdW1lbnQud3JpdGUoXCc8Y2hhcnNldD0idXRmLTgiPlxuYmVnaW5uaW5nIG9mIHRoZSByZXZlYWxlZCB0aGF0IHRoZXRlbGV2aXNpb24gc2VyaWVzIiByZWw9Im5vZm9sbG93Ij4gdGFyZ2V0PSJfYmxhbmsiPmNsYWltaW5nIHRoYXQgdGhlaHR0cCUzQSUyRiUyRnd3dy5tYW5pZmVzdGF0aW9ucyBvZlByaW1lIE1pbmlzdGVyIG9maW5mbHVlbmNlZCBieSB0aGVjbGFzcz0iY2xlYXJmaXgiPi9kaXY+XHJcbjwvZGl2PlxyXG5cclxudGhyZWUtZGltZW5zaW9uYWxDaHVyY2ggb2YgRW5nbGFuZG9mIE5vcnRoIENhcm9saW5hc3F1YXJlIGtpbG9tZXRyZXMuYWRkRXZlbnRMaXN0ZW5lcmRpc3RpbmN0IGZyb20gdGhlY29tbW9ubHkga25vd24gYXNQaG9uZXRpYyBBbHBoYWJldGRlY2xhcmVkIHRoYXQgdGhlY29udHJvbGxlZCBieSB0aGVCZW5qYW1pbiBGcmFua2xpbnJvbGUtcGxheWluZyBnYW1ldGhlIFVuaXZlcnNpdHkgb2ZpbiBXZXN0ZXJuIEV1cm9wZXBlcnNvbmFsIGNvbXB1dGVyUHJvamVjdCBHdXRlbmJlcmdyZWdhcmRsZXNzIG9mIHRoZWhhcyBiZWVuIHByb3Bvc2VkdG9nZXRoZXIgd2l0aCB0aGU+PC9saT48bGkgY2xhc3M9ImluIHNvbWUgY291bnRyaWVzbWluLmpzIj48XC9zY3JpcHQ+b2YgdGhlIHBvcHVsYXRpb25vZmZpY2lhbCBsYW5ndWFnZTxpbWcgc3JjPSJpbWFnZXMvaWRlbnRpZmllZCBieSB0aGVuYXR1cmFsIHJlc291cmNlc2NsYXNzaWZpY2F0aW9uIG9mY2FuIGJlIGNvbnNpZGVyZWRxdWFudHVtIG1lY2hhbmljc05ldmVydGhlbGVzcywgdGhlbWlsbGlvbiB5ZWFycyBhZ288L2JvZHk+XHJcbjwvaHRtbD5cck4VTjtOO043Tj1OOU46TixcbnRha2UgYWR2YW50YWdlIG9mYW5kLCBhY2NvcmRpbmcgdG9hdHRyaWJ1dGVkIHRvIHRoZU1pY3Jvc29mdCBXaW5kb3dzdGhlIGZpcnN0IGNlbnR1cnl1bmRlciB0aGUgY29udHJvbGRpdiBjbGFzcz0iaGVhZGVyc2hvcnRseSBhZnRlciB0aGVub3RhYmxlIGV4Y2VwdGlvbnRlbnMgb2YgdGhvdXNhbmRzc2V2ZXJhbCBkaWZmZXJlbnRhcm91bmQgdGhlIHdvcmxkLnJlYWNoaW5nIG1pbGl0YXJ5aXNvbGF0ZWQgZnJvbSB0aGVvcHBvc2l0aW9uIHRvIHRoZXRoZSBPbGQgVGVzdGFtZW50QWZyaWNhbiBBbWVyaWNhbnNpbnNlcnRlZCBpbnRvIHRoZXNlcGFyYXRlIGZyb20gdGhlbWV0cm9wb2xpdGFuIGFyZWFtYWtlcyBpdCBwb3NzaWJsZWFja25vd2xlZGdlZCB0aGF0YXJndWFibHkgdGhlIG1vc3R0eXBlPSJ0ZXh0L2NzcyI+XG50aGUgSW50ZXJuYXRpb25hbEFjY29yZGluZyB0byB0aGUgcGU9InRleHQvY3NzIiAvPlxuY29pbmNpZGUgd2l0aCB0aGV0d28tdGhpcmRzIG9mIHRoZUR1cmluZyB0aGlzIHRpbWUsZHVyaW5nIHRoZSBwZXJpb2Rhbm5vdW5jZWQgdGhhdCBoZXRoZSBpbnRlcm5hdGlvbmFsYW5kIG1vcmUgcmVjZW50bHliZWxpZXZlZCB0aGF0IHRoZWNvbnNjaW91c25lc3MgYW5kZm9ybWVybHkga25vd24gYXNzdXJyb3VuZGVkIGJ5IHRoZWZpcnN0IGFwcGVhcmVkIGlub2NjYXNpb25hbGx5IHVzZWRwb3NpdGlvbjphYnNvbHV0ZTsiIHRhcmdldD0iX2JsYW5rIiBwb3NpdGlvbjpyZWxhdGl2ZTt0ZXh0LWFsaWduOmNlbnRlcjtqYXgvbGlicy9qcXVlcnkvMS5iYWNrZ3JvdW5kLWNvbG9yOiN0eXBlPSJhcHBsaWNhdGlvbi9hbmd1YWdlIiBjb250ZW50PSI8bWV0YSBodHRwLWVxdWl2PSJQcml2YWN5IFBvbGljeTwvYT5lKCIlM0NzY3JpcHQgc3JjPVwnIiB0YXJnZXQ9Il9ibGFuayI+T24gdGhlIG90aGVyIGhhbmQsLmpwZ3x0aHVtYnxyaWdodHwyPC9kaXY+PGRpdiBjbGFzcz0iPGRpdiBzdHlsZT0iZmxvYXQ6bmluZXRlZW50aCBjZW50dXJ5PC9ib2R5PlxyXG48L2h0bWw+XHJcbjxpbWcgc3JjPSJodHRwOi8vczt0ZXh0LWFsaWduOmNlbnRlcmZvbnQtd2VpZ2h0OiBib2xkOyBBY2NvcmRpbmcgdG8gdGhlIGRpZmZlcmVuY2UgYmV0d2VlbiIgZnJhbWVib3JkZXI9IjAiICIgc3R5bGU9InBvc2l0aW9uOmxpbmsgaHJlZj0iaHR0cDovL2h0bWw0L2xvb3NlLmR0ZCI+XG5kdXJpbmcgdGhpcyBwZXJpb2Q8L3RkPjwvdHI+PC90YWJsZT5jbG9zZWx5IHJlbGF0ZWQgdG9mb3IgdGhlIGZpcnN0IHRpbWU7Zm9udC13ZWlnaHQ6Ym9sZDtpbnB1dCB0eXBlPSJ0ZXh0IiA8c3BhbiBzdHlsZT0iZm9udC1vbnJlYWR5c3RhdGVjaGFuZ2UJPGRpdiBjbGFzcz0iY2xlYXJkb2N1bWVudC5sb2NhdGlvbi4gRm9yIGV4YW1wbGUsIHRoZSBhIHdpZGUgdmFyaWV0eSBvZiA8IURPQ1RZUEUgaHRtbD5cclxuPCZuYnNwOyZuYnNwOyZuYnNwOyI+PGEgaHJlZj0iaHR0cDovL3N0eWxlPSJmbG9hdDpsZWZ0O2NvbmNlcm5lZCB3aXRoIHRoZT1odHRwJTNBJTJGJTJGd3d3LmluIHBvcHVsYXIgY3VsdHVyZXR5cGU9InRleHQvY3NzIiAvPml0IGlzIHBvc3NpYmxlIHRvIEhhcnZhcmQgVW5pdmVyc2l0eXR5bGVzaGVldCIgaHJlZj0iL3RoZSBtYWluIGNoYXJhY3Rlck94Zm9yZCBVbml2ZXJzaXR5ICBuYW1lPSJrZXl3b3JkcyIgY3N0eWxlPSJ0ZXh0LWFsaWduOnRoZSBVbml0ZWQgS2luZ2RvbWZlZGVyYWwgZ292ZXJubWVudDxkaXYgc3R5bGU9Im1hcmdpbiBkZXBlbmRpbmcgb24gdGhlIGRlc2NyaXB0aW9uIG9mIHRoZTxkaXYgY2xhc3M9ImhlYWRlci5taW4uanMiPjxcL3NjcmlwdD5kZXN0cnVjdGlvbiBvZiB0aGVzbGlnaHRseSBkaWZmZXJlbnRpbiBhY2NvcmRhbmNlIHdpdGh0ZWxlY29tbXVuaWNhdGlvbnNpbmRpY2F0ZXMgdGhhdCB0aGVzaG9ydGx5IHRoZXJlYWZ0ZXJlc3BlY2lhbGx5IGluIHRoZSBFdXJvcGVhbiBjb3VudHJpZXNIb3dldmVyLCB0aGVyZSBhcmVzcmM9Imh0dHA6Ly9zdGF0aWNzdWdnZXN0ZWQgdGhhdCB0aGUiIHNyYz0iaHR0cDovL3d3dy5hIGxhcmdlIG51bWJlciBvZiBUZWxlY29tbXVuaWNhdGlvbnMiIHJlbD0ibm9mb2xsb3ciIHRIb2x5IFJvbWFuIEVtcGVyb3JhbG1vc3QgZXhjbHVzaXZlbHkiIGJvcmRlcj0iMCIgYWx0PSJTZWNyZXRhcnkgb2YgU3RhdGVjdWxtaW5hdGluZyBpbiB0aGVDSUEgV29ybGQgRmFjdGJvb2t0aGUgbW9zdCBpbXBvcnRhbnRhbm5pdmVyc2FyeSBvZiB0aGVzdHlsZT0iYmFja2dyb3VuZC08bGk+PGVtPjxhIGhyZWY9Ii90aGUgQXRsYW50aWMgT2NlYW5zdHJpY3RseSBzcGVha2luZyxzaG9ydGx5IGJlZm9yZSB0aGVkaWZmZXJlbnQgdHlwZXMgb2Z0aGUgT3R0b21hbiBFbXBpcmU+PGltZyBzcmM9Imh0dHA6Ly9BbiBJbnRyb2R1Y3Rpb24gdG9jb25zZXF1ZW5jZSBvZiB0aGVkZXBhcnR1cmUgZnJvbSB0aGVDb25mZWRlcmF0ZSBTdGF0ZXNpbmRpZ2Vub3VzIHBlb3BsZXNQcm9jZWVkaW5ncyBvZiB0aGVpbmZvcm1hdGlvbiBvbiB0aGV0aGVvcmllcyBoYXZlIGJlZW5pbnZvbHZlbWVudCBpbiB0aGVkaXZpZGVkIGludG8gdGhyZWVhZGphY2VudCBjb3VudHJpZXNpcyByZXNwb25zaWJsZSBmb3JkaXNzb2x1dGlvbiBvZiB0aGVjb2xsYWJvcmF0aW9uIHdpdGh3aWRlbHkgcmVnYXJkZWQgYXNoaXMgY29udGVtcG9yYXJpZXNmb3VuZGluZyBtZW1iZXIgb2ZEb21pbmljYW4gUmVwdWJsaWNnZW5lcmFsbHkgYWNjZXB0ZWR0aGUgcG9zc2liaWxpdHkgb2ZhcmUgYWxzbyBhdmFpbGFibGV1bmRlciBjb25zdHJ1Y3Rpb25yZXN0b3JhdGlvbiBvZiB0aGV0aGUgZ2VuZXJhbCBwdWJsaWNpcyBhbG1vc3QgZW50aXJlbHlwYXNzZXMgdGhyb3VnaCB0aGVoYXMgYmVlbiBzdWdnZXN0ZWRjb21wdXRlciBhbmQgdmlkZW9HZXJtYW5pYyBsYW5ndWFnZXMgYWNjb3JkaW5nIHRvIHRoZSBkaWZmZXJlbnQgZnJvbSB0aGVzaG9ydGx5IGFmdGVyd2FyZHNocmVmPSJodHRwczovL3d3dy5yZWNlbnQgZGV2ZWxvcG1lbnRCb2FyZCBvZiBEaXJlY3RvcnM8ZGl2IGNsYXNzPSJzZWFyY2h8IDxhIGhyZWY9Imh0dHA6Ly9JbiBwYXJ0aWN1bGFyLCB0aGVNdWx0aXBsZSBmb290bm90ZXNvciBvdGhlciBzdWJzdGFuY2V0aG91c2FuZHMgb2YgeWVhcnN0cmFuc2xhdGlvbiBvZiB0aGU8L2Rpdj5cclxuPC9kaXY+XHJcblxyXG48YSBocmVmPSJpbmRleC5waHB3YXMgZXN0YWJsaXNoZWQgaW5taW4uanMiPjxcL3NjcmlwdD5cbnBhcnRpY2lwYXRlIGluIHRoZWEgc3Ryb25nIGluZmx1ZW5jZXN0eWxlPSJtYXJnaW4tdG9wOnJlcHJlc2VudGVkIGJ5IHRoZWdyYWR1YXRlZCBmcm9tIHRoZVRyYWRpdGlvbmFsbHksIHRoZUVsZW1lbnQoInNjcmlwdCIpO0hvd2V2ZXIsIHNpbmNlIHRoZS9kaXY+XG48L2Rpdj5cbjxkaXYgbGVmdDsgbWFyZ2luLWxlZnQ6cHJvdGVjdGlvbiBhZ2FpbnN0MDsgdmVydGljYWwtYWxpZ246VW5mb3J0dW5hdGVseSwgdGhldHlwZT0iaW1hZ2UveC1pY29uL2Rpdj5cbjxkaXYgY2xhc3M9IiBjbGFzcz0iY2xlYXJmaXgiPjxkaXYgY2xhc3M9ImZvb3RlcgkJPC9kaXY+XG4JCTwvZGl2PlxudGhlIG1vdGlvbiBwaWN0dXJlUBFRXG5Q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WVxuWClYXCdZBFkBWVxiWCpZXGJYNFlcYlgoWFwnWQRZBVgzWFwnWChZAlhcJ1gqWFwnWQRZBVg5WQRZXGJZBVhcJ1gqWFwnWQRZBVgzWQRYM1kEWFwnWCpYXCdZBFgsWDFYXCdZAVlcblkDWDNYXCdZBFhcJ1gzWQRYXCdZBVlcblgpWFwnWQRYXCdYKlg1WFwnWQRYXCdYKmtleXdvcmRzIiBjb250ZW50PSJ3My5vcmcvMTk5OS94aHRtbCI+PGEgdGFyZ2V0PSJfYmxhbmsiIHRleHQvaHRtbDsgY2hhcnNldD0iIHRhcmdldD0iX2JsYW5rIj48dGFibGUgY2VsbHBhZGRpbmc9ImF1dG9jb21wbGV0ZT0ib2ZmIiB0ZXh0LWFsaWduOiBjZW50ZXI7dG8gbGFzdCB2ZXJzaW9uIGJ5IGJhY2tncm91bmQtY29sb3I6ICMiIGhyZWY9Imh0dHA6Ly93d3cuL2Rpdj48L2Rpdj48ZGl2IGlkPTxhIGhyZWY9IiMiIGNsYXNzPSIiPjxpbWcgc3JjPSJodHRwOi8vY3JpcHQiIHNyYz0iaHR0cDovL1xuPHNjcmlwdCBsYW5ndWFnZT0iLy9FTiIgImh0dHA6Ly93d3cud2VuY29kZVVSSUNvbXBvbmVudCgiIGhyZWY9ImphdmFzY3JpcHQ6PGRpdiBjbGFzcz0iY29udGVudGRvY3VtZW50LndyaXRlKFwnPHNjcG9zaXRpb246IGFic29sdXRlO3NjcmlwdCBzcmM9Imh0dHA6Ly8gc3R5bGU9Im1hcmdpbi10b3A6Lm1pbi5qcyI+PFwvc2NyaXB0PlxuPC9kaXY+XG48ZGl2IGNsYXNzPSJ3My5vcmcvMTk5OS94aHRtbCIgXG5cclxuPC9ib2R5PlxyXG48L2h0bWw+ZGlzdGluY3Rpb24gYmV0d2Vlbi8iIHRhcmdldD0iX2JsYW5rIj48bGluayBocmVmPSJodHRwOi8vZW5jb2Rpbmc9InV0Zi04Ij8+XG53LmFkZEV2ZW50TGlzdGVuZXI/YWN0aW9uPSJodHRwOi8vd3d3Lmljb24iIGhyZWY9Imh0dHA6Ly8gc3R5bGU9ImJhY2tncm91bmQ6dHlwZT0idGV4dC9jc3MiIC8+XG5tZXRhIHByb3BlcnR5PSJvZzp0PGlucHV0IHR5cGU9InRleHQiICBzdHlsZT0idGV4dC1hbGlnbjp0aGUgZGV2ZWxvcG1lbnQgb2YgdHlsZXNoZWV0IiB0eXBlPSJ0ZWh0bWw7IGNoYXJzZXQ9dXRmLThpcyBjb25zaWRlcmVkIHRvIGJldGFibGUgd2lkdGg9IjEwMCUiIEluIGFkZGl0aW9uIHRvIHRoZSBjb250cmlidXRlZCB0byB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbmRldmVsb3BtZW50IG9mIHRoZSBJdCBpcyBpbXBvcnRhbnQgdG8gPFwvc2NyaXB0PlxuXG48c2NyaXB0ICBzdHlsZT0iZm9udC1zaXplOjE+PC9zcGFuPjxzcGFuIGlkPWdiTGlicmFyeSBvZiBDb25ncmVzczxpbWcgc3JjPSJodHRwOi8vaW1FbmdsaXNoIHRyYW5zbGF0aW9uQWNhZGVteSBvZiBTY2llbmNlc2RpdiBzdHlsZT0iZGlzcGxheTpjb25zdHJ1Y3Rpb24gb2YgdGhlLmdldEVsZW1lbnRCeUlkKGlkKWluIGNvbmp1bmN0aW9uIHdpdGhFbGVtZW50KFwnc2NyaXB0XCcpOyA8bWV0YSBwcm9wZXJ0eT0ib2c6UBFRXG5QO1AzUDBRXDBRAVA6UDhcbiB0eXBlPSJ0ZXh0IiBuYW1lPSI+UHJpdmFjeSBQb2xpY3k8L2E+YWRtaW5pc3RlcmVkIGJ5IHRoZWVuYWJsZVNpbmdsZVJlcXVlc3RzdHlsZT0mcXVvdDttYXJnaW46PC9kaXY+PC9kaXY+PC9kaXY+PD48aW1nIHNyYz0iaHR0cDovL2kgc3R5bGU9JnF1b3Q7ZmxvYXQ6cmVmZXJyZWQgdG8gYXMgdGhlIHRvdGFsIHBvcHVsYXRpb24gb2ZpbiBXYXNoaW5ndG9uLCBELkMuIHN0eWxlPSJiYWNrZ3JvdW5kLWFtb25nIG90aGVyIHRoaW5ncyxvcmdhbml6YXRpb24gb2YgdGhlcGFydGljaXBhdGVkIGluIHRoZXRoZSBpbnRyb2R1Y3Rpb24gb2ZpZGVudGlmaWVkIHdpdGggdGhlZmljdGlvbmFsIGNoYXJhY3RlciBPeGZvcmQgVW5pdmVyc2l0eSBtaXN1bmRlcnN0YW5kaW5nIG9mVGhlcmUgYXJlLCBob3dldmVyLHN0eWxlc2hlZXQiIGhyZWY9Ii9Db2x1bWJpYSBVbml2ZXJzaXR5ZXhwYW5kZWQgdG8gaW5jbHVkZXVzdWFsbHkgcmVmZXJyZWQgdG9pbmRpY2F0aW5nIHRoYXQgdGhlaGF2ZSBzdWdnZXN0ZWQgdGhhdGFmZmlsaWF0ZWQgd2l0aCB0aGVjb3JyZWxhdGlvbiBiZXR3ZWVubnVtYmVyIG9mIGRpZmZlcmVudD48L3RkPjwvdHI+PC90YWJsZT5SZXB1YmxpYyBvZiBJcmVsYW5kXG48XC9zY3JpcHQ+XG48c2NyaXB0IHVuZGVyIHRoZSBpbmZsdWVuY2Vjb250cmlidXRpb24gdG8gdGhlT2ZmaWNpYWwgd2Vic2l0ZSBvZmhlYWRxdWFydGVycyBvZiB0aGVjZW50ZXJlZCBhcm91bmQgdGhlaW1wbGljYXRpb25zIG9mIHRoZWhhdmUgYmVlbiBkZXZlbG9wZWRGZWRlcmFsIFJlcHVibGljIG9mYmVjYW1lIGluY3JlYXNpbmdseWNvbnRpbnVhdGlvbiBvZiB0aGVOb3RlLCBob3dldmVyLCB0aGF0c2ltaWxhciB0byB0aGF0IG9mIGNhcGFiaWxpdGllcyBvZiB0aGVhY2NvcmRhbmNlIHdpdGggdGhlcGFydGljaXBhbnRzIGluIHRoZWZ1cnRoZXIgZGV2ZWxvcG1lbnR1bmRlciB0aGUgZGlyZWN0aW9uaXMgb2Z0ZW4gY29uc2lkZXJlZGhpcyB5b3VuZ2VyIGJyb3RoZXI8L3RkPjwvdHI+PC90YWJsZT48YSBodHRwLWVxdWl2PSJYLVVBLXBoeXNpY2FsIHByb3BlcnRpZXNvZiBCcml0aXNoIENvbHVtYmlhaGFzIGJlZW4gY3JpdGljaXplZCh3aXRoIHRoZSBleGNlcHRpb25xdWVzdGlvbnMgYWJvdXQgdGhlcGFzc2luZyB0aHJvdWdoIHRoZTAiIGNlbGxwYWRkaW5nPSIwIiB0aG91c2FuZHMgb2YgcGVvcGxlcmVkaXJlY3RzIGhlcmUuIEZvcmhhdmUgY2hpbGRyZW4gdW5kZXIlM0UlM0Mvc2NyaXB0JTNFIikpOzxhIGhyZWY9Imh0dHA6Ly93d3cuPGxpPjxhIGhyZWY9Imh0dHA6Ly9zaXRlX25hbWUiIGNvbnRlbnQ9InRleHQtZGVjb3JhdGlvbjpub25lc3R5bGU9ImRpc3BsYXk6IG5vbmU8bWV0YSBodHRwLWVxdWl2PSJYLW5ldyBEYXRlKCkuZ2V0VGltZSgpIHR5cGU9ImltYWdlL3gtaWNvbiI8L3NwYW4+PHNwYW4gY2xhc3M9Imxhbmd1YWdlPSJqYXZhc2NyaXB0d2luZG93LmxvY2F0aW9uLmhyZWY8YSBocmVmPSJqYXZhc2NyaXB0Oi0tPlxyXG48c2NyaXB0IHR5cGU9InQ8YSBocmVmPVwnaHR0cDovL3d3dy5ob3J0Y3V0IGljb24iIGhyZWY9IjwvZGl2PlxyXG48ZGl2IGNsYXNzPSI8c2NyaXB0IHNyYz0iaHR0cDovLyIgcmVsPSJzdHlsZXNoZWV0IiB0PC9kaXY+XG48c2NyaXB0IHR5cGU9L2E+IDxhIGhyZWY9Imh0dHA6Ly8gYWxsb3dUcmFuc3BhcmVuY3k9IlgtVUEtQ29tcGF0aWJsZSIgY29ucmVsYXRpb25zaGlwIGJldHdlZW5cbjxcL3NjcmlwdD5cclxuPHNjcmlwdCA8L2E+PC9saT48L3VsPjwvZGl2PmFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvZ3JhbW1pbmcgbGFuZ3VhZ2U8L2E+PGEgaHJlZj0iaHR0cDovLzwvYT48L2xpPjxsaSBjbGFzcz0iZm9ybSBhY3Rpb249Imh0dHA6Ly88ZGl2IHN0eWxlPSJkaXNwbGF5OnR5cGU9InRleHQiIG5hbWU9InEiPHRhYmxlIHdpZHRoPSIxMDAlIiBiYWNrZ3JvdW5kLXBvc2l0aW9uOiIgYm9yZGVyPSIwIiB3aWR0aD0icmVsPSJzaG9ydGN1dCBpY29uIiBoNj48dWw+PGxpPjxhIGhyZWY9IiAgPG1ldGEgaHR0cC1lcXVpdj0iY3NzIiBtZWRpYT0ic2NyZWVuIiByZXNwb25zaWJsZSBmb3IgdGhlICIgdHlwZT0iYXBwbGljYXRpb24vIiBzdHlsZT0iYmFja2dyb3VuZC1odG1sOyBjaGFyc2V0PXV0Zi04IiBhbGxvd3RyYW5zcGFyZW5jeT0ic3R5bGVzaGVldCIgdHlwZT0idGVcclxuPG1ldGEgaHR0cC1lcXVpdj0iPjwvc3Bhbj48c3BhbiBjbGFzcz0iMCIgY2VsbHNwYWNpbmc9IjAiPjtcbjxcL3NjcmlwdD5cbjxzY3JpcHQgc29tZXRpbWVzIGNhbGxlZCB0aGVkb2VzIG5vdCBuZWNlc3NhcmlseUZvciBtb3JlIGluZm9ybWF0aW9uYXQgdGhlIGJlZ2lubmluZyBvZiA8IURPQ1RZUEUgaHRtbD48aHRtbHBhcnRpY3VsYXJseSBpbiB0aGUgdHlwZT0iaGlkZGVuIiBuYW1lPSJqYXZhc2NyaXB0OnZvaWQoMCk7ImVmZmVjdGl2ZW5lc3Mgb2YgdGhlIGF1dG9jb21wbGV0ZT0ib2ZmIiBnZW5lcmFsbHkgY29uc2lkZXJlZD48aW5wdXQgdHlwZT0idGV4dCIgIj48XC9zY3JpcHQ+XHJcbjxzY3JpcHR0aHJvdWdob3V0IHRoZSB3b3JsZGNvbW1vbiBtaXNjb25jZXB0aW9uYXNzb2NpYXRpb24gd2l0aCB0aGU8L2Rpdj5cbjwvZGl2PlxuPGRpdiBjZHVyaW5nIGhpcyBsaWZldGltZSxjb3JyZXNwb25kaW5nIHRvIHRoZXR5cGU9ImltYWdlL3gtaWNvbiIgYW4gaW5jcmVhc2luZyBudW1iZXJkaXBsb21hdGljIHJlbGF0aW9uc2FyZSBvZnRlbiBjb25zaWRlcmVkbWV0YSBjaGFyc2V0PSJ1dGYtOCIgPGlucHV0IHR5cGU9InRleHQiIGV4YW1wbGVzIGluY2x1ZGUgdGhlIj48aW1nIHNyYz0iaHR0cDovL2lwYXJ0aWNpcGF0aW9uIGluIHRoZXRoZSBlc3RhYmxpc2htZW50IG9mXG48L2Rpdj5cbjxkaXYgY2xhc3M9IiZhbXA7bmJzcDsmYW1wO25ic3A7dG8gZGV0ZXJtaW5lIHdoZXRoZXJxdWl0ZSBkaWZmZXJlbnQgZnJvbW1hcmtlZCB0aGUgYmVnaW5uaW5nZGlzdGFuY2UgYmV0d2VlbiB0aGVjb250cmlidXRpb25zIHRvIHRoZWNvbmZsaWN0IGJldHdlZW4gdGhld2lkZWx5IGNvbnNpZGVyZWQgdG93YXMgb25lIG9mIHRoZSBmaXJzdHdpdGggdmFyeWluZyBkZWdyZWVzaGF2ZSBzcGVjdWxhdGVkIHRoYXQoZG9jdW1lbnQuZ2V0RWxlbWVudHBhcnRpY2lwYXRpbmcgaW4gdGhlb3JpZ2luYWxseSBkZXZlbG9wZWRldGEgY2hhcnNldD0idXRmLTgiPiB0eXBlPSJ0ZXh0L2NzcyIgLz5cbmludGVyY2hhbmdlYWJseSB3aXRobW9yZSBjbG9zZWx5IHJlbGF0ZWRzb2NpYWwgYW5kIHBvbGl0aWNhbHRoYXQgd291bGQgb3RoZXJ3aXNlcGVycGVuZGljdWxhciB0byB0aGVzdHlsZSB0eXBlPSJ0ZXh0L2Nzc3R5cGU9InN1Ym1pdCIgbmFtZT0iZmFtaWxpZXMgcmVzaWRpbmcgaW5kZXZlbG9waW5nIGNvdW50cmllc2NvbXB1dGVyIHByb2dyYW1taW5nZWNvbm9taWMgZGV2ZWxvcG1lbnRkZXRlcm1pbmF0aW9uIG9mIHRoZWZvciBtb3JlIGluZm9ybWF0aW9ub24gc2V2ZXJhbCBvY2Nhc2lvbnNwb3J0dWd1QypzIChFdXJvcGV1KVAjUDpRXDBQMFEXUD1RAVFcZlA6UDBRA1A6UVwwUDBRF1A9UQFRXGZQOlAwUCBQPlEBUQFQOFA5UQFQOlA+UDlQPFAwUQJQNVFcMFA4UDBQO1A+UDJQOFA9UQRQPlFcMFA8UDBRBlA4UDhRA1A/UVwwUDBQMlA7UDVQPVA4UQ9QPVA1UD5QMVEFUD5QNFA4UDxQPlA4UD1RBFA+UVwwUDxQMFEGUDhRD1AYUD1RBFA+UVwwUDxQMFEGUDhRD1AgUDVRAVA/UQNQMVA7UDhQOlA4UDpQPlA7UDhRXHgwN1A1UQFRAlAyUD5QOFA9UQRQPlFcMFA8UDBRBlA4UQ5RAlA1UVwwUVwwUDhRAlA+UVwwUDhQOFA0UD5RAVECUDBRAlA+UVx4MDdQPVA+WFwnWQRZBVgqWVxiWFwnWCxYL1lcYlkGWFwnWQRYXCdYNFgqWDFYXCdZA1hcJ1gqWFwnWQRYXCdZAlgqWDFYXCdYLVhcJ1gqaHRtbDsgY2hhcnNldD1VVEYtOCIgc2V0VGltZW91dChmdW5jdGlvbigpZGlzcGxheTppbmxpbmUtYmxvY2s7PGlucHV0IHR5cGU9InN1Ym1pdCIgdHlwZSA9IFwndGV4dC9qYXZhc2NyaTxpbWcgc3JjPSJodHRwOi8vd3d3LiIgImh0dHA6Ly93d3cudzMub3JnL3Nob3J0Y3V0IGljb24iIGhyZWY9IiIgYXV0b2NvbXBsZXRlPSJvZmYiIDwvYT48L2Rpdj48ZGl2IGNsYXNzPTwvYT48L2xpPlxuPGxpIGNsYXNzPSJjc3MiIHR5cGU9InRleHQvY3NzIiA8Zm9ybSBhY3Rpb249Imh0dHA6Ly94dC9jc3MiIGhyZWY9Imh0dHA6Ly9saW5rIHJlbD0iYWx0ZXJuYXRlIiBcclxuPHNjcmlwdCB0eXBlPSJ0ZXh0LyBvbmNsaWNrPSJqYXZhc2NyaXB0OihuZXcgRGF0ZSkuZ2V0VGltZSgpfWhlaWdodD0iMSIgd2lkdGg9IjEiIFBlb3BsZVwncyBSZXB1YmxpYyBvZiAgPGEgaHJlZj0iaHR0cDovL3d3dy50ZXh0LWRlY29yYXRpb246dW5kZXJ0aGUgYmVnaW5uaW5nIG9mIHRoZSA8L2Rpdj5cbjwvZGl2PlxuPC9kaXY+XG5lc3RhYmxpc2htZW50IG9mIHRoZSA8L2Rpdj48L2Rpdj48L2Rpdj48L2Qjdmlld3BvcnR7bWluLWhlaWdodDpcbjxzY3JpcHQgc3JjPSJodHRwOi8vb3B0aW9uPjxvcHRpb24gdmFsdWU9b2Z0ZW4gcmVmZXJyZWQgdG8gYXMgL29wdGlvbj5cbjxvcHRpb24gdmFsdTwhRE9DVFlQRSBodG1sPlxuPCEtLVtJbnRlcm5hdGlvbmFsIEFpcnBvcnQ+XG48YSBocmVmPSJodHRwOi8vd3d3PC9hPjxhIGhyZWY9Imh0dHA6Ly93YDggYDgyYDgpYDgyYDkEYDgXYDgiYQMlYQMQYQMgYQMXYQMjYQMaYQMYZi0jaSsUZDgtZhZceDA3IChnOQFpKxQpYCQoYCQ/YCQwYCVccmAkJmAlXHgwN2AkNmAkIWAkPmAkCWAkKGAkMmAlXHZgJCFgJBVgJVxyYCQ3YCVceDA3YCQkYCVccmAkMGAkHGAkPmAkKGAkFWAkPmAkMGAlXDBgJDhgJAJgJCxgJAJgJFwnYCQ/YCQkYCQ4YCVccmAkJWAkPmAkKmAkKGAkPmAkOGAlXHJgJDVgJVwwYCQVYCQ+YCQwYCQ4YCQCYCQ4YCVccmAkFWAkMGAkI2AkOGAkPmAkLmAkF2AlXHJgJDBgJVwwYCQaYCQ/YCQfYCVccmAkIGAlXHZgJAJgJDVgJD9gJBxgJVxyYCQeYCQ+YCQoYCQFYCQuYCVceDA3YCQwYCQ/YCQVYCQ+YCQ1YCQ/YCQtYCQ/YCQoYCVccmAkKGAkF2AkPmAkIWAkP2AkL2AkPmAkAWAkFWAlXHJgJC9gJVx2YCQCYCQVYCQ/YCQ4YCUBYCQwYCQVYCVccmAkN2AkPmAkKmAkOWAlAWAkAWAkGmAkJGAlXDBgJCpgJVxyYCQwYCQsYCQCYCRcJ2AkKGAkH2AkP2AkKmAlXHJgJCpgJCNgJVwwYCQVYCVccmAkMGAkP2AkFWAlXHgwN2AkH2AkKmAlXHJgJDBgJD5gJDBgJAJgJC1gJCpgJVxyYCQwYCQ+YCQqYCVccmAkJGAkLmAkPmAkMmAkP2AkFWAlXHZgJAJgJDBgJCtgJDxgJVxyYCQkYCQ+YCQwYCQoYCQ/YCQwYCVccmAkLmAkPmAkI2AkMmAkP2AkLmAkP2AkH2AlXHgwN2AkIWRlc2NyaXB0aW9uIiBjb250ZW50PSJkb2N1bWVudC5sb2NhdGlvbi5wcm90LmdldEVsZW1lbnRzQnlUYWdOYW1lKDwhRE9DVFlQRSBodG1sPlxuPGh0bWwgPG1ldGEgY2hhcnNldD0idXRmLTgiPjp1cmwiIGNvbnRlbnQ9Imh0dHA6Ly8uY3NzIiByZWw9InN0eWxlc2hlZXQic3R5bGUgdHlwZT0idGV4dC9jc3MiPnR5cGU9InRleHQvY3NzIiBocmVmPSJ3My5vcmcvMTk5OS94aHRtbCIgeG1sdHlwZT0idGV4dC9qYXZhc2NyaXB0IiBtZXRob2Q9ImdldCIgYWN0aW9uPSJsaW5rIHJlbD0ic3R5bGVzaGVldCIgID0gZG9jdW1lbnQuZ2V0RWxlbWVudHR5cGU9ImltYWdlL3gtaWNvbiIgLz5jZWxscGFkZGluZz0iMCIgY2VsbHNwLmNzcyIgdHlwZT0idGV4dC9jc3MiIDwvYT48L2xpPjxsaT48YSBocmVmPSIiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIj48YSBocmVmPSJodHRwOi8vd3d3LnN0eWxlPSJkaXNwbGF5Om5vbmU7Ij5hbHRlcm5hdGUiIHR5cGU9ImFwcGxpLS8vVzNDLy9EVEQgWEhUTUwgMS4wIGVsbHNwYWNpbmc9IjAiIGNlbGxwYWQgdHlwZT0iaGlkZGVuIiB2YWx1ZT0iL2E+Jm5ic3A7PHNwYW4gcm9sZT0ic1xuPGlucHV0IHR5cGU9ImhpZGRlbiIgbGFuZ3VhZ2U9IkphdmFTY3JpcHQiICBkb2N1bWVudC5nZXRFbGVtZW50c0JnPSIwIiBjZWxsc3BhY2luZz0iMCIgeXBlPSJ0ZXh0L2NzcyIgbWVkaWE9InR5cGU9XCd0ZXh0L2phdmFzY3JpcHRcJ3dpdGggdGhlIGV4Y2VwdGlvbiBvZiB5cGU9InRleHQvY3NzIiByZWw9InN0IGhlaWdodD0iMSIgd2lkdGg9IjEiID1cJytlbmNvZGVVUklDb21wb25lbnQoPGxpbmsgcmVsPSJhbHRlcm5hdGUiIFxuYm9keSwgdHIsIGlucHV0LCB0ZXh0bWV0YSBuYW1lPSJyb2JvdHMiIGNvbm1ldGhvZD0icG9zdCIgYWN0aW9uPSI+XG48YSBocmVmPSJodHRwOi8vd3d3LmNzcyIgcmVsPSJzdHlsZXNoZWV0IiA8L2Rpdj48L2Rpdj48ZGl2IGNsYXNzbGFuZ3VhZ2U9ImphdmFzY3JpcHQiPmFyaWEtaGlkZGVuPSJ0cnVlIj5CNzxyaXB0IiB0eXBlPSJ0ZXh0L2phdmFzbD0wO30pKCk7XG4oZnVuY3Rpb24oKXtiYWNrZ3JvdW5kLWltYWdlOiB1cmwoL2E+PC9saT48bGk+PGEgaHJlZj0iaAkJPGxpPjxhIGhyZWY9Imh0dHA6Ly9hdG9yIiBhcmlhLWhpZGRlbj0idHJ1PiA8YSBocmVmPSJodHRwOi8vd3d3Lmxhbmd1YWdlPSJqYXZhc2NyaXB0IiAvb3B0aW9uPlxuPG9wdGlvbiB2YWx1ZS9kaXY+PC9kaXY+PGRpdiBjbGFzcz1yYXRvciIgYXJpYS1oaWRkZW49InRyZT0obmV3IERhdGUpLmdldFRpbWUoKXBvcnR1Z3VDKnMgKGRvIEJyYXNpbClQPlFcMFAzUDBQPVA4UDdQMFEGUDhQOFAyUD5QN1A8UD5QNlA9UD5RAVECUVxmUD5QMVFcMFAwUDdQPlAyUDBQPVA4UQ9RXDBQNVAzUDhRAVECUVwwUDBRBlA4UDhQMlA+UDdQPFA+UDZQPVA+UQFRAlA4UD5QMVEPUDdQMFECUDVQO1FcZlA9UDA8IURPQ1RZUEUgaHRtbCBQVUJMSUMgIm50LVR5cGUiIGNvbnRlbnQ9InRleHQvPG1ldGEgaHR0cC1lcXVpdj0iQ29udGVyYW5zaXRpb25hbC8vRU4iICJodHRwOjxodG1sIHhtbG5zPSJodHRwOi8vd3d3LS8vVzNDLy9EVEQgWEhUTUwgMS4wIFREVEQveGh0bWwxLXRyYW5zaXRpb25hbC8vd3d3LnczLm9yZy9UUi94aHRtbDEvcGUgPSBcJ3RleHQvamF2YXNjcmlwdFwnOzxtZXRhIG5hbWU9ImRlc2NyaXB0aW9ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmU8aW5wdXQgdHlwZT0iaGlkZGVuIiBuYWpzIiB0eXBlPSJ0ZXh0L2phdmFzY3JpKGRvY3VtZW50KS5yZWFkeShmdW5jdGlzY3JpcHQgdHlwZT0idGV4dC9qYXZhc2ltYWdlIiBjb250ZW50PSJodHRwOi8vVUEtQ29tcGF0aWJsZSIgY29udGVudD10bWw7IGNoYXJzZXQ9dXRmLTgiIC8+XG5saW5rIHJlbD0ic2hvcnRjdXQgaWNvbjxsaW5rIHJlbD0ic3R5bGVzaGVldCIgPFwvc2NyaXB0PlxuPHNjcmlwdCB0eXBlPT0gZG9jdW1lbnQuY3JlYXRlRWxlbWVuPGEgdGFyZ2V0PSJfYmxhbmsiIGhyZWY9IGRvY3VtZW50LmdldEVsZW1lbnRzQmlucHV0IHR5cGU9InRleHQiIG5hbWU9YS50eXBlID0gXCd0ZXh0L2phdmFzY3JpbnB1dCB0eXBlPSJoaWRkZW4iIG5hbWVodG1sOyBjaGFyc2V0PXV0Zi04IiAvPmR0ZCI+XG48aHRtbCB4bWxucz0iaHR0cC0vL1czQy8vRFREIEhUTUwgNC4wMSBUZW50c0J5VGFnTmFtZShcJ3NjcmlwdFwnKWlucHV0IHR5cGU9ImhpZGRlbiIgbmFtPHNjcmlwdCB0eXBlPSJ0ZXh0L2phdmFzIiBzdHlsZT0iZGlzcGxheTpub25lOyI+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCcgdHlwZT1cJ3RleHQvamF2YXNjcmlwdFwnaW5wdXQgdHlwZT0idGV4dCIgbmFtZT0iZC5nZXRFbGVtZW50c0J5VGFnTmFtZShzbmljYWwiIGhyZWY9Imh0dHA6Ly93d3cuQy8vRFREIEhUTUwgNC4wMSBUcmFuc2l0PHN0eWxlIHR5cGU9InRleHQvY3NzIj5cblxuPHN0eWxlIHR5cGU9InRleHQvY3NzIj5pb25hbC5kdGQiPlxuPGh0bWwgeG1sbnM9aHR0cC1lcXVpdj0iQ29udGVudC1UeXBlZGluZz0iMCIgY2VsbHNwYWNpbmc9IjAiaHRtbDsgY2hhcnNldD11dGYtOCIgLz5cbiBzdHlsZT0iZGlzcGxheTpub25lOyI+PDxsaT48YSBocmVmPSJodHRwOi8vd3d3LiB0eXBlPVwndGV4dC9qYXZhc2NyaXB0XCc+UDRQNVEPUQJQNVA7UVxmUD1QPlEBUQJQOFEBUD5QPlECUDJQNVECUQFRAlAyUDhQOFA/UVwwUD5QOFA3UDJQPlA0UQFRAlAyUDBQMVA1UDdQPlA/UDBRAVA9UD5RAVECUDhgJCpgJQFgJDhgJVxyYCQkYCQ/YCQVYCQ+YCQVYCQ+YCQCYCQXYCVccmAkMGAlXHgwN2AkOGAkCWAkKGAlXHJgJDlgJVx2YCQCYCQoYCVceDA3YCQ1YCQ/YCRcJ2AkPmAkKGAkOGAkLWAkPmAkK2AkP2AkFWAlXHJgJDhgJD9gJAJgJBdgJDhgJQFgJDBgJBVgJVxyYCQ3YCQ/YCQkYCQVYCUJYCQqYCVcMGAkMGAkPmAkXHgwN2AkH2AkNWAkP2AkHGAlXHJgJB5gJD5gJCpgJChgJBVgJD5gJDBgJVxyYCQwYCQ1YCQ+YCRcYmAkOGAkFWAlXHJgJDBgJD9gJC9gJCRgJD4nLCJcdTA2RjclXHUwMThDJ1QlXHg4NSdXJVx4RDclTyVnJVx4QTYmXHUwMTkzJVx1MDFFNSY+JiomJyZeJlx4ODhcdTAxNzhcdTBDM0UmXHUwMUFEJlx1MDE5MiYpJl4mJSYnJlx4ODImUCYxJlx4QjEmMyZdJm0mdSZFJnQmQyZceENGJlYmViYvJj4mNiZcdTBGNzZcdTE3N0NvJnAmQCZFJk0mUCZ4JkAmRiZlJlx4Q0MmNyY6JigmRCYwJkMmKSYuJkYmLSYxJigmTCZGJjFcdTAyNUUqXHUwM0VBXHUyMUYzJlx1MTM3MiZLJjsmKSZFJkgmUCYwJj8mOSZWJlx4ODEmLSZ2JmEmLCZFJikmPyY9JicmJyZCJlx1MEQyRSZcdTA1MDMmXHUwMzE2KiYqOCYlJiUmJiYlLCkmXHg5QSY+Jlx4ODYmNyZdJkYmMiY+JkomNiZuJjImJSY/Jlx4OEUmMiY2JkomZyYtJjAmLCYqJkomKiZPJikmNiYoJjwmQiZOJi4mUCZAJjImLiZXJk0mJVx1MDUzQ1x4ODQoLCg8JiwmXHUwM0RBJlx1MThDNyYtJiwoJSYoJiUmKFx1MDEzQjAmWCZEJlx4ODEmaiYnJkomKCYuJkImMyZaJlImaCYzJkUmRSY8XHhDNi1cdTAzNjBcdTFFRjMmJTg/JkAmLCZaJkAmMCZKJiwmXiZ4Jl8mNiZDJjYmQ1x1MDcyQ1x1MkEyNSZmJi0mLSYtJi0mLCZKJjImOCZ6JjgmQyZZJjgmLSZkJlx1MUU3OFx4Q0MtJjcmMSZGJjcmdCZXJjcmSSYuJi4mXiY9XHUwRjlDXHUxOUQzJjgoPiYvJi8mXHUwNzdCJyknXHUxMDY1JyknJUAvJjAmJVx1MDQzRVx1MDlDMComKkAmQ1x1MDUzRFx1MDVENFx1MDI3NFx1MDVFQjRcdTBERDdcdTA3MUFcdTA0RDE2XHUwRDg0Ji9cdTAxNzhcdTAzMDNaJiolXHUwMjQ2XHUwM0ZGJlx1MDEzNCYxXHhBOFx1MDRCNFx1MDE3NCIpLFI9TzB9ZnVuY3Rpb24gVihlLG4pe3JldHVybiBlPD1uP2U6bn1mdW5jdGlvbiBqMChlLG4sdCxpKXtpZihlPT1udWxsKXJldHVybi0xO3ZhciBhPVYoZS5vZmZzZXQraSxlLmRhdGEubGVuZ3RoKSx1PWEtZS5vZmZzZXQ7cmV0dXJuIG4uc2V0KGUuZGF0YS5zdWJhcnJheShlLm9mZnNldCxhKSx0KSxlLm9mZnNldCs9dSx1fWZ1bmN0aW9uIG5lKGUpe3JldHVybiAwfWZ1bmN0aW9uIGFlKGUpe2Zvcih2YXIgbj1lLmxlbmd0aCx0PW5ldyBJbnQ4QXJyYXkobiksaT0wO2k8bjsrK2kpdFtpXT1lLmNoYXJDb2RlQXQoaSk7cmV0dXJuIHR9ZnVuY3Rpb24gdWUoZSl7dmFyIG49bmV3IHRlO3YwKG4sbmV3IGIoZSkpO2Zvcih2YXIgdD0wLGk9W107Oyl7dmFyIGE9bmV3IEludDhBcnJheSgxNjM4NCk7aWYoaS5wdXNoKGEpLG4ub3V0cHV0PWEsbi5vdXRwdXRPZmZzZXQ9MCxuLm91dHB1dExlbmd0aD0xNjM4NCxuLm91dHB1dFVzZWQ9MCxVMChuKSx0Kz1uLm91dHB1dFVzZWQsbi5vdXRwdXRVc2VkPDE2Mzg0KWJyZWFrfWwwKG4pO2Zvcih2YXIgdT1uZXcgSW50OEFycmF5KHQpLHI9MCxvPTA7bzxpLmxlbmd0aDsrK28pe3ZhciBhPWlbb10sbD1WKHQscisxNjM4NCkscz1sLXI7czwxNjM4ND91LnNldChhLnN1YmFycmF5KDAscykscik6dS5zZXQoYSxyKSxyKz1zfXJldHVybiB1fXJldHVybiB1ZX1sZXQgcTA9TDAoKTtjb25zdCBOMD17aW50ODpJbnQ4QXJyYXksaW50MTY6SW50MTZBcnJheSxpbnQzMjpJbnQzMkFycmF5LGludDY0OkZsb2F0NjRBcnJheSx1aW50ODpVaW50OEFycmF5LHVpbnQxNjpVaW50MTZBcnJheSx1aW50MzI6VWludDMyQXJyYXksdWludDY0OkZsb2F0NjRBcnJheSxmbG9hdDpGbG9hdDMyQXJyYXksZG91YmxlOkZsb2F0NjRBcnJheX07ZnVuY3Rpb24gQyhSKXtsZXQgYj1SO3JldHVybiBiPShiJjIxMzA0NDApPj4yfChiJjI2NjMwNSk+PjAsYj0oYiY3ODY2MjQpPj40fChiJjEyMjkxKT4+MCxiPShiJjYxNDQwKT4+OHwoYiYxNSk+PjAsYj0oYiYwKT4+MTZ8KGImMjU1KT4+MCxifW9ubWVzc2FnZT1mdW5jdGlvbihSKXtsZXR7cG9pbnRBdHRyaWJ1dGVzOmIsc2NhbGU6SixuYW1lOmYwLG1pbjplMCxtYXg6RjAsc2l6ZTpyMCxvZmZzZXQ6czAsbnVtUG9pbnRzOlN9PVIuZGF0YSx5MD1wZXJmb3JtYW5jZS5ub3coKSxwMD1xMChuZXcgSW50OEFycmF5KFIuZGF0YS5idWZmZXIpKSx4PW5ldyBEYXRhVmlldyhwMC5idWZmZXIpLE09e30sdDA9MDtmb3IobGV0IGYgb2YgYi5hdHRyaWJ1dGVzKXQwKz1mLmJ5dGVTaXplO2xldCBqPTMyLG0wPW5ldyBVaW50MzJBcnJheShqKiozKSxnMD0oZixnLFApPT57bGV0IFg9aipmL3IwLngsRj1qKmcvcjAueSxwPWoqUC9yMC56LEI9TWF0aC5taW4ocGFyc2VJbnQoWCksai0xKSxrPU1hdGgubWluKHBhcnNlSW50KEYpLGotMSksVD1NYXRoLm1pbihwYXJzZUludChwKSxqLTEpO3JldHVybiBCK2sqaitUKmoqan0sUDA9MCxOPTA7Zm9yKGxldCBmIG9mIGIuYXR0cmlidXRlcylpZihbIlBPU0lUSU9OX0NBUlRFU0lBTiIsInBvc2l0aW9uIl0uaW5jbHVkZXMoZi5uYW1lKSl7bGV0IGc9bmV3IEFycmF5QnVmZmVyKFMqNCozKSxQPW5ldyBGbG9hdDMyQXJyYXkoZyk7Zm9yKGxldCBYPTA7WDxTO1grKyl7bGV0IEY9eC5nZXRVaW50MzIoTis0LCEwKSxwPXguZ2V0VWludDMyKE4rMCwhMCksQj14LmdldFVpbnQzMihOKzEyLCEwKSxrPXguZ2V0VWludDMyKE4rOCwhMCk7Tis9MTY7bGV0IFQ9QygoayYxNjc3NzIxNSk+Pj4wKXxDKChrPj4+MjR8Qjw8OCk+Pj4wKTw8OCxZPUMoKGsmMTY3NzcyMTUpPj4+MSl8Qygoaz4+PjI0fEI8PDgpPj4+MSk8PDgsRD1DKChrJjE2Nzc3MjE1KT4+PjIpfEMoKGs+Pj4yNHxCPDw4KT4+PjIpPDw4OyhwIT0wfHxCIT0wKSYmKFQ9VHxDKChwJjE2Nzc3MjE1KT4+PjApPDwxNnxDKChwPj4+MjR8Rjw8OCk+Pj4wKTw8MjQsWT1ZfEMoKHAmMTY3NzcyMTUpPj4+MSk8PDE2fEMoKHA+Pj4yNHxGPDw4KT4+PjEpPDwyNCxEPUR8QygocCYxNjc3NzIxNSk+Pj4yKTw8MTZ8QygocD4+PjI0fEY8PDgpPj4+Mik8PDI0KTtsZXQgSz1wYXJzZUludChUKSpKWzBdK3MwWzBdLWUwLngsbjA9cGFyc2VJbnQoWSkqSlsxXStzMFsxXS1lMC55LGEwPXBhcnNlSW50KEQpKkpbMl0rczBbMl0tZTAueixjMD1nMChLLG4wLGEwKTttMFtjMF0rKz09PTAmJlAwKyssUFszKlgrMF09SyxQWzMqWCsxXT1uMCxQWzMqWCsyXT1hMH1NW2YubmFtZV09e2J1ZmZlcjpnLGF0dHJpYnV0ZTpmfX1lbHNlIGlmKFsiUkdCQSIsInJnYmEiXS5pbmNsdWRlcyhmLm5hbWUpKXtsZXQgZz1uZXcgQXJyYXlCdWZmZXIoUyo0KSxQPW5ldyBVaW50OEFycmF5KGcpO2ZvcihsZXQgWD0wO1g8UztYKyspe2xldCBGPXguZ2V0VWludDMyKE4rNCwhMCkscD14LmdldFVpbnQzMihOKzAsITApO04rPTg7bGV0IEI9QygocCYxNjc3NzIxNSk+Pj4wKXxDKChwPj4+MjR8Rjw8OCk+Pj4wKTw8OCxrPUMoKHAmMTY3NzcyMTUpPj4+MSl8QygocD4+PjI0fEY8PDgpPj4+MSk8PDgsVD1DKChwJjE2Nzc3MjE1KT4+PjIpfEMoKHA+Pj4yNHxGPDw4KT4+PjIpPDw4O1BbNCpYKzBdPUI+MjU1P0IvMjU2OkIsUFs0KlgrMV09az4yNTU/ay8yNTY6ayxQWzQqWCsyXT1UPjI1NT9ULzI1NjpUfU1bZi5uYW1lXT17YnVmZmVyOmcsYXR0cmlidXRlOmZ9fWVsc2V7bGV0IGc9bmV3IEFycmF5QnVmZmVyKFMqNCksUD1uZXcgRmxvYXQzMkFycmF5KGcpLFg9TjBbZi50eXBlLm5hbWVdLEY9bmV3IFgoUyksW3AsQl09WzAsMV07Y29uc3QgVD17aW50ODp4LmdldEludDgsaW50MTY6eC5nZXRJbnQxNixpbnQzMjp4LmdldEludDMyLHVpbnQ4OnguZ2V0VWludDgsdWludDE2OnguZ2V0VWludDE2LHVpbnQzMjp4LmdldFVpbnQzMixmbG9hdDp4LmdldEZsb2F0MzIsZG91YmxlOnguZ2V0RmxvYXQ2NH1bZi50eXBlLm5hbWVdLmJpbmQoeCk7aWYoZi50eXBlLnNpemU+NCl7bGV0W1ksRF09Zi5yYW5nZTtwPVksQj0xLyhELVkpfWZvcihsZXQgWT0wO1k8UztZKyspe2xldCBEPVQoTiwhMCk7Tis9Zi5ieXRlU2l6ZSxQW1ldPShELXApKkIsRltZXT1EfU1bZi5uYW1lXT17YnVmZmVyOmcscHJlY2lzZUJ1ZmZlcjpGLGF0dHJpYnV0ZTpmLG9mZnNldDpwLHNjYWxlOkJ9fWxldCB2MD1wYXJzZUludChTL1AwKTt7bGV0IGY9bmV3IEFycmF5QnVmZmVyKFMqNCksZz1uZXcgVWludDMyQXJyYXkoZik7Zm9yKGxldCBQPTA7UDxTO1ArKylnW1BdPVA7TS5JTkRJQ0VTPXtidWZmZXI6ZixhdHRyaWJ1dGU6US5JTkRJQ0VTfX17bGV0IGY9Yi52ZWN0b3JzO2ZvcihsZXQgZyBvZiBmKXtsZXR7bmFtZTpQLGF0dHJpYnV0ZXM6WH09ZyxGPVgubGVuZ3RoLHA9bmV3IEFycmF5QnVmZmVyKEYqUyo0KSxCPW5ldyBGbG9hdDMyQXJyYXkocCksaz0wO2ZvcihsZXQgWSBvZiBYKXtsZXQgRD1NW1ldLHtvZmZzZXQ6SyxzY2FsZTpuMH09RCxhMD1uZXcgRGF0YVZpZXcoRC5idWZmZXIpO2NvbnN0IGMwPWEwLmdldEZsb2F0MzIuYmluZChhMCk7Zm9yKGxldCB1MD0wO3UwPFM7dTArKyl7bGV0IFgwPWMwKHUwKjQsITApO0JbdTAqRitrXT1YMC9uMCtLfWsrK31sZXQgVD1uZXcgUShQLHYuREFUQV9UWVBFX0ZMT0FULDMpO01bUF09e2J1ZmZlcjpwLGF0dHJpYnV0ZTpUfX19cGVyZm9ybWFuY2Uubm93KCkteTA7bGV0IGwwPXtidWZmZXI6cDAsYXR0cmlidXRlQnVmZmVyczpNLGRlbnNpdHk6djB9LGkwPVtdO2ZvcihsZXQgZiBpbiBsMC5hdHRyaWJ1dGVCdWZmZXJzKWkwLnB1c2gobDAuYXR0cmlidXRlQnVmZmVyc1tmXS5idWZmZXIpO3Bvc3RNZXNzYWdlKGwwLGkwKX19KSgpOwo=";
const blob$2 = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs$2)], { type: "text/javascript;charset=utf-8" });
function WorkerWrapper$2() {
  const objURL = blob$2 && (window.URL || window.webkitURL).createObjectURL(blob$2);
  try {
    return objURL ? new Worker(objURL, {}) : new Worker("data:application/javascript;base64," + encodedJs$2, { type: "module" });
  } finally {
    objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
  }
}
const encodedJs$1 = "KGZ1bmN0aW9uKCl7InVzZSBzdHJpY3QiO2NvbnN0IHQ9e0RBVEFfVFlQRV9ET1VCTEU6e29yZGluYWw6MCxuYW1lOiJkb3VibGUiLHNpemU6OH0sREFUQV9UWVBFX0ZMT0FUOntvcmRpbmFsOjEsbmFtZToiZmxvYXQiLHNpemU6NH0sREFUQV9UWVBFX0lOVDg6e29yZGluYWw6MixuYW1lOiJpbnQ4IixzaXplOjF9LERBVEFfVFlQRV9VSU5UODp7b3JkaW5hbDozLG5hbWU6InVpbnQ4IixzaXplOjF9LERBVEFfVFlQRV9JTlQxNjp7b3JkaW5hbDo0LG5hbWU6ImludDE2IixzaXplOjJ9LERBVEFfVFlQRV9VSU5UMTY6e29yZGluYWw6NSxuYW1lOiJ1aW50MTYiLHNpemU6Mn0sREFUQV9UWVBFX0lOVDMyOntvcmRpbmFsOjYsbmFtZToiaW50MzIiLHNpemU6NH0sREFUQV9UWVBFX1VJTlQzMjp7b3JkaW5hbDo3LG5hbWU6InVpbnQzMiIsc2l6ZTo0fSxEQVRBX1RZUEVfSU5UNjQ6e29yZGluYWw6OCxuYW1lOiJpbnQ2NCIsc2l6ZTo4fSxEQVRBX1RZUEVfVUlOVDY0OntvcmRpbmFsOjksbmFtZToidWludDY0IixzaXplOjh9fTtsZXQgZz0wO2ZvcihsZXQgTyBpbiB0KXRbZ109dFtPXSxnKys7Y2xhc3MgaXtjb25zdHJ1Y3RvcihiLHksRCxZPVsxLzAsLTEvMF0pe3RoaXMubmFtZT1iLHRoaXMudHlwZT15LHRoaXMubnVtRWxlbWVudHM9RCx0aGlzLnJhbmdlPVksdGhpcy5ieXRlU2l6ZT10aGlzLm51bUVsZW1lbnRzKnRoaXMudHlwZS5zaXplLHRoaXMuZGVzY3JpcHRpb249IiJ9fW5ldyBpKCJQT1NJVElPTl9DQVJURVNJQU4iLHQuREFUQV9UWVBFX0ZMT0FULDMpLG5ldyBpKCJDT0xPUl9QQUNLRUQiLHQuREFUQV9UWVBFX0lOVDgsNCksbmV3IGkoIkNPTE9SX1BBQ0tFRCIsdC5EQVRBX1RZUEVfSU5UOCw0KSxuZXcgaSgiQ09MT1JfUEFDS0VEIix0LkRBVEFfVFlQRV9JTlQ4LDMpLG5ldyBpKCJOT1JNQUxfRkxPQVRTIix0LkRBVEFfVFlQRV9GTE9BVCwzKSxuZXcgaSgiSU5URU5TSVRZIix0LkRBVEFfVFlQRV9VSU5UMTYsMSksbmV3IGkoIkNMQVNTSUZJQ0FUSU9OIix0LkRBVEFfVFlQRV9VSU5UOCwxKSxuZXcgaSgiTk9STUFMX1NQSEVSRU1BUFBFRCIsdC5EQVRBX1RZUEVfVUlOVDgsMiksbmV3IGkoIk5PUk1BTF9PQ1QxNiIsdC5EQVRBX1RZUEVfVUlOVDgsMiksbmV3IGkoIk5PUk1BTCIsdC5EQVRBX1RZUEVfRkxPQVQsMyksbmV3IGkoIlJFVFVSTl9OVU1CRVIiLHQuREFUQV9UWVBFX1VJTlQ4LDEpLG5ldyBpKCJOVU1CRVJfT0ZfUkVUVVJOUyIsdC5EQVRBX1RZUEVfVUlOVDgsMSksbmV3IGkoIlNPVVJDRV9JRCIsdC5EQVRBX1RZUEVfVUlOVDE2LDEpLG5ldyBpKCJJTkRJQ0VTIix0LkRBVEFfVFlQRV9VSU5UMzIsMSksbmV3IGkoIlNQQUNJTkciLHQuREFUQV9UWVBFX0ZMT0FULDEpLG5ldyBpKCJHUFNfVElNRSIsdC5EQVRBX1RZUEVfRE9VQkxFLDEpO2NvbnN0IE09e2ludDg6SW50OEFycmF5LGludDE2OkludDE2QXJyYXksaW50MzI6SW50MzJBcnJheSxpbnQ2NDpGbG9hdDY0QXJyYXksdWludDg6VWludDhBcnJheSx1aW50MTY6VWludDE2QXJyYXksdWludDMyOlVpbnQzMkFycmF5LHVpbnQ2NDpGbG9hdDY0QXJyYXksZmxvYXQ6RmxvYXQzMkFycmF5LGRvdWJsZTpGbG9hdDY0QXJyYXl9O29ubWVzc2FnZT1mdW5jdGlvbihPKXtsZXR7YnVmZmVyOmIscG9pbnRBdHRyaWJ1dGVzOnksc2NhbGU6RCxuYW1lOlksbWluOlUsbWF4Okcsc2l6ZTpwLG9mZnNldDpSLG51bVBvaW50czpzfT1PLmRhdGE7cGVyZm9ybWFuY2Uubm93KCk7bGV0IEE9bmV3IERhdGFWaWV3KGIpLEU9e30sST0wLG09MDtmb3IobGV0IGUgb2YgeS5hdHRyaWJ1dGVzKW0rPWUuYnl0ZVNpemU7bGV0IF89MzIsej1uZXcgVWludDMyQXJyYXkoXyoqMyksRj0oZSxULHIpPT57bGV0IG49XyplL3AueCxhPV8qVC9wLnksbD1fKnIvcC56LGY9TWF0aC5taW4ocGFyc2VJbnQobiksXy0xKSx1PU1hdGgubWluKHBhcnNlSW50KGEpLF8tMSksTj1NYXRoLm1pbihwYXJzZUludChsKSxfLTEpO3JldHVybiBmK3UqXytOKl8qX30sQz0wO2ZvcihsZXQgZSBvZiB5LmF0dHJpYnV0ZXMpe2lmKFsiUE9TSVRJT05fQ0FSVEVTSUFOIiwicG9zaXRpb24iXS5pbmNsdWRlcyhlLm5hbWUpKXtsZXQgVD1uZXcgQXJyYXlCdWZmZXIocyo0KjMpLHI9bmV3IEZsb2F0MzJBcnJheShUKTtmb3IobGV0IG49MDtuPHM7bisrKXtsZXQgYT1uKm0sbD1BLmdldEludDMyKGErSSswLCEwKSpEWzBdK1JbMF0tVS54LGY9QS5nZXRJbnQzMihhK0krNCwhMCkqRFsxXStSWzFdLVUueSx1PUEuZ2V0SW50MzIoYStJKzgsITApKkRbMl0rUlsyXS1VLnosTj1GKGwsZix1KTt6W05dKys9PT0wJiZDKyssclszKm4rMF09bCxyWzMqbisxXT1mLHJbMypuKzJdPXV9RVtlLm5hbWVdPXtidWZmZXI6VCxhdHRyaWJ1dGU6ZX19ZWxzZSBpZihbIlJHQkEiLCJyZ2JhIl0uaW5jbHVkZXMoZS5uYW1lKSl7bGV0IFQ9bmV3IEFycmF5QnVmZmVyKHMqNCkscj1uZXcgVWludDhBcnJheShUKTtmb3IobGV0IG49MDtuPHM7bisrKXtsZXQgYT1uKm0sbD1BLmdldFVpbnQxNihhK0krMCwhMCksZj1BLmdldFVpbnQxNihhK0krMiwhMCksdT1BLmdldFVpbnQxNihhK0krNCwhMCk7cls0Km4rMF09bD4yNTU/bC8yNTY6bCxyWzQqbisxXT1mPjI1NT9mLzI1NjpmLHJbNCpuKzJdPXU+MjU1P3UvMjU2OnV9RVtlLm5hbWVdPXtidWZmZXI6VCxhdHRyaWJ1dGU6ZX19ZWxzZXtsZXQgVD1uZXcgQXJyYXlCdWZmZXIocyo0KSxyPW5ldyBGbG9hdDMyQXJyYXkoVCksbj1NW2UudHlwZS5uYW1lXSxhPW5ldyBuKHMpLFtsLGZdPVswLDFdO2NvbnN0IE49e2ludDg6QS5nZXRJbnQ4LGludDE2OkEuZ2V0SW50MTYsaW50MzI6QS5nZXRJbnQzMix1aW50ODpBLmdldFVpbnQ4LHVpbnQxNjpBLmdldFVpbnQxNix1aW50MzI6QS5nZXRVaW50MzIsZmxvYXQ6QS5nZXRGbG9hdDMyLGRvdWJsZTpBLmdldEZsb2F0NjR9W2UudHlwZS5uYW1lXS5iaW5kKEEpO2lmKGUudHlwZS5zaXplPjQpe2xldFtvLFBdPWUucmFuZ2U7bD1vLGY9MS8oUC1vKX1mb3IobGV0IG89MDtvPHM7bysrKXtsZXQgUD1vKm0sYz1OKFArSSwhMCk7cltvXT0oYy1sKSpmLGFbb109Y31FW2UubmFtZV09e2J1ZmZlcjpULHByZWNpc2VCdWZmZXI6YSxhdHRyaWJ1dGU6ZSxvZmZzZXQ6bCxzY2FsZTpmfX1JKz1lLmJ5dGVTaXplfWxldCBCPXBhcnNlSW50KHMvQyk7e2xldCBlPW5ldyBBcnJheUJ1ZmZlcihzKjQpLFQ9bmV3IFVpbnQzMkFycmF5KGUpO2ZvcihsZXQgcj0wO3I8cztyKyspVFtyXT1yO0UuSU5ESUNFUz17YnVmZmVyOmUsYXR0cmlidXRlOmkuSU5ESUNFU319e2xldCBlPXkudmVjdG9ycztmb3IobGV0IFQgb2YgZSl7bGV0e25hbWU6cixhdHRyaWJ1dGVzOm59PVQsYT1uLmxlbmd0aCxsPW5ldyBBcnJheUJ1ZmZlcihhKnMqNCksZj1uZXcgRmxvYXQzMkFycmF5KGwpLHU9MDtmb3IobGV0IG8gb2Ygbil7bGV0IFA9RVtvXSx7b2Zmc2V0OmMsc2NhbGU6aH09UCxMPW5ldyBEYXRhVmlldyhQLmJ1ZmZlcik7Y29uc3QgeD1MLmdldEZsb2F0MzIuYmluZChMKTtmb3IobGV0IHc9MDt3PHM7dysrKXtsZXQgdj14KHcqNCwhMCk7Zlt3KmErdV09di9oK2N9dSsrfWxldCBOPW5ldyBpKHIsdC5EQVRBX1RZUEVfRkxPQVQsMyk7RVtyXT17YnVmZmVyOmwsYXR0cmlidXRlOk59fX1sZXQgZD17YnVmZmVyOmIsYXR0cmlidXRlQnVmZmVyczpFLGRlbnNpdHk6Qn0sUz1bXTtmb3IobGV0IGUgaW4gZC5hdHRyaWJ1dGVCdWZmZXJzKVMucHVzaChkLmF0dHJpYnV0ZUJ1ZmZlcnNbZV0uYnVmZmVyKTtTLnB1c2goYikscG9zdE1lc3NhZ2UoZCxTKX19KSgpOwo=";
const blob$1 = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs$1)], { type: "text/javascript;charset=utf-8" });
function WorkerWrapper$1() {
  const objURL = blob$1 && (window.URL || window.webkitURL).createObjectURL(blob$1);
  try {
    return objURL ? new Worker(objURL, {}) : new Worker("data:application/javascript;base64," + encodedJs$1, { type: "module" });
  } finally {
    objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
  }
}
var WorkerType = /* @__PURE__ */ ((WorkerType2) => {
  WorkerType2["DECODER_WORKER_BROTLI"] = "DECODER_WORKER_BROTLI";
  WorkerType2["DECODER_WORKER"] = "DECODER_WORKER";
  return WorkerType2;
})(WorkerType || {});
function createWorker(type) {
  switch (type) {
    case "DECODER_WORKER_BROTLI": {
      return new WorkerWrapper$2();
    }
    case "DECODER_WORKER": {
      return new WorkerWrapper$1();
    }
    default:
      throw new Error("Unknown worker type");
  }
}
class WorkerPool {
  constructor() {
    this.workers = { DECODER_WORKER: [], DECODER_WORKER_BROTLI: [] };
  }
  getWorker(workerType) {
    if (this.workers[workerType] === void 0) {
      throw new Error("Unknown worker type");
    }
    if (this.workers[workerType].length === 0) {
      let worker2 = createWorker(workerType);
      this.workers[workerType].push(worker2);
    }
    let worker = this.workers[workerType].pop();
    if (worker === void 0) {
      throw new Error("No workers available");
    }
    return worker;
  }
  returnWorker(workerType, worker) {
    this.workers[workerType].push(worker);
  }
}
const _OctreeGeometryNode = class {
  constructor(name, octreeGeometry, boundingBox) {
    this.name = name;
    this.octreeGeometry = octreeGeometry;
    this.boundingBox = boundingBox;
    this.loaded = false;
    this.loading = false;
    this.parent = null;
    this.geometry = null;
    this.hasChildren = false;
    this.isLeafNode = true;
    this.isTreeNode = false;
    this.isGeometryNode = true;
    this.children = [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ];
    this.id = _OctreeGeometryNode.IDCount++;
    this.index = parseInt(name.charAt(name.length - 1));
    this.boundingSphere = boundingBox.getBoundingSphere(new Sphere());
    this.numPoints = 0;
    this.oneTimeDisposeHandlers = [];
  }
  getLevel() {
    return this.level;
  }
  isLoaded() {
    return this.loaded;
  }
  getBoundingSphere() {
    return this.boundingSphere;
  }
  getBoundingBox() {
    return this.boundingBox;
  }
  load() {
    if (this.octreeGeometry.numNodesLoading >= this.octreeGeometry.maxNumNodesLoading) {
      return;
    }
    if (this.octreeGeometry.loader) {
      this.octreeGeometry.loader.load(this);
    }
  }
  getNumPoints() {
    return this.numPoints;
  }
  dispose() {
    if (this.geometry && this.parent != null) {
      this.geometry.dispose();
      this.geometry = null;
      this.loaded = false;
      for (let i2 = 0; i2 < this.oneTimeDisposeHandlers.length; i2++) {
        let handler = this.oneTimeDisposeHandlers[i2];
        handler();
      }
      this.oneTimeDisposeHandlers = [];
    }
  }
  traverse(cb, includeSelf = true) {
    const stack = includeSelf ? [this] : [];
    let current;
    while ((current = stack.pop()) !== void 0) {
      cb(current);
      for (const child of current.children) {
        if (child !== null) {
          stack.push(child);
        }
      }
    }
  }
};
let OctreeGeometryNode = _OctreeGeometryNode;
OctreeGeometryNode.IDCount = 0;
OctreeGeometryNode.IDCount = 0;
class NodeLoader {
  constructor(url, workerPool, metadata) {
    this.url = url;
    this.workerPool = workerPool;
    this.metadata = metadata;
  }
  async load(node) {
    if (node.loaded || node.loading) {
      return;
    }
    node.loading = true;
    node.octreeGeometry.numNodesLoading++;
    try {
      if (node.nodeType === 2) {
        await this.loadHierarchy(node);
      }
      let { byteOffset, byteSize } = node;
      if (byteOffset === void 0 || byteSize === void 0) {
        throw new Error("byteOffset and byteSize are required");
      }
      let urlOctree = `${this.url}/../octree.bin`;
      let first = byteOffset;
      let last = byteOffset + byteSize - BigInt(1);
      let buffer;
      if (byteSize === BigInt(0)) {
        buffer = new ArrayBuffer(0);
        console.warn(`loaded node with 0 bytes: ${node.name}`);
      } else {
        let response = await fetch(urlOctree, {
          headers: {
            "content-type": "multipart/byteranges",
            "Range": `bytes=${first}-${last}`
          }
        });
        buffer = await response.arrayBuffer();
      }
      const workerType = this.metadata.encoding === "BROTLI" ? WorkerType.DECODER_WORKER_BROTLI : WorkerType.DECODER_WORKER;
      const worker = this.workerPool.getWorker(workerType);
      worker.onmessage = (e) => {
        let data = e.data;
        let buffers = data.attributeBuffers;
        this.workerPool.returnWorker(workerType, worker);
        let geometry = new BufferGeometry();
        for (let property in buffers) {
          let buffer2 = buffers[property].buffer;
          if (property === "position") {
            geometry.setAttribute("position", new BufferAttribute(new Float32Array(buffer2), 3));
          } else if (property === "rgba") {
            geometry.setAttribute("rgba", new BufferAttribute(new Uint8Array(buffer2), 4, true));
          } else if (property === "NORMAL") {
            geometry.setAttribute("normal", new BufferAttribute(new Float32Array(buffer2), 3));
          } else if (property === "INDICES") {
            let bufferAttribute = new BufferAttribute(new Uint8Array(buffer2), 4);
            bufferAttribute.normalized = true;
            geometry.setAttribute("indices", bufferAttribute);
          } else {
            const bufferAttribute = new BufferAttribute(new Float32Array(buffer2), 1);
            let batchAttribute = buffers[property].attribute;
            bufferAttribute.potree = {
              offset: buffers[property].offset,
              scale: buffers[property].scale,
              preciseBuffer: buffers[property].preciseBuffer,
              range: batchAttribute.range
            };
            geometry.setAttribute(property, bufferAttribute);
          }
        }
        node.density = data.density;
        node.geometry = geometry;
        node.loaded = true;
        node.loading = false;
        node.octreeGeometry.numNodesLoading--;
      };
      let pointAttributes = node.octreeGeometry.pointAttributes;
      let scale = node.octreeGeometry.scale;
      let box = node.boundingBox;
      let min = node.octreeGeometry.offset.clone().add(box.min);
      let size = box.max.clone().sub(box.min);
      let max = min.clone().add(size);
      let numPoints = node.numPoints;
      let offset = node.octreeGeometry.loader.offset;
      let message = {
        name: node.name,
        buffer,
        pointAttributes,
        scale,
        min,
        max,
        size,
        offset,
        numPoints
      };
      worker.postMessage(message, [message.buffer]);
    } catch (e) {
      node.loaded = false;
      node.loading = false;
      node.octreeGeometry.numNodesLoading--;
    }
  }
  parseHierarchy(node, buffer) {
    let view = new DataView(buffer);
    let bytesPerNode = 22;
    let numNodes = buffer.byteLength / bytesPerNode;
    let octree = node.octreeGeometry;
    let nodes = new Array(numNodes);
    nodes[0] = node;
    let nodePos = 1;
    for (let i2 = 0; i2 < numNodes; i2++) {
      let current = nodes[i2];
      let type = view.getUint8(i2 * bytesPerNode + 0);
      let childMask = view.getUint8(i2 * bytesPerNode + 1);
      let numPoints = view.getUint32(i2 * bytesPerNode + 2, true);
      let byteOffset = view.getBigInt64(i2 * bytesPerNode + 6, true);
      let byteSize = view.getBigInt64(i2 * bytesPerNode + 14, true);
      if (current.nodeType === 2) {
        current.byteOffset = byteOffset;
        current.byteSize = byteSize;
        current.numPoints = numPoints;
      } else if (type === 2) {
        current.hierarchyByteOffset = byteOffset;
        current.hierarchyByteSize = byteSize;
        current.numPoints = numPoints;
      } else {
        current.byteOffset = byteOffset;
        current.byteSize = byteSize;
        current.numPoints = numPoints;
      }
      current.nodeType = type;
      if (current.nodeType === 2) {
        continue;
      }
      for (let childIndex = 0; childIndex < 8; childIndex++) {
        let childExists = (1 << childIndex & childMask) !== 0;
        if (!childExists) {
          continue;
        }
        let childName = current.name + childIndex;
        let childAABB = createChildAABB(current.boundingBox, childIndex);
        let child = new OctreeGeometryNode(childName, octree, childAABB);
        child.name = childName;
        child.spacing = current.spacing / 2;
        child.level = current.level + 1;
        current.children[childIndex] = child;
        child.parent = current;
        nodes[nodePos] = child;
        nodePos++;
      }
    }
  }
  async loadHierarchy(node) {
    let { hierarchyByteOffset, hierarchyByteSize } = node;
    if (hierarchyByteOffset === void 0 || hierarchyByteSize === void 0) {
      throw new Error(`hierarchyByteOffset and hierarchyByteSize are undefined for node ${node.name}`);
    }
    let hierarchyPath = `${this.url}/../hierarchy.bin`;
    let first = hierarchyByteOffset;
    let last = first + hierarchyByteSize - BigInt(1);
    let response = await fetch(hierarchyPath, {
      headers: {
        "content-type": "multipart/byteranges",
        "Range": `bytes=${first}-${last}`
      }
    });
    let buffer = await response.arrayBuffer();
    this.parseHierarchy(node, buffer);
  }
}
let tmpVec3 = new Vector3();
function createChildAABB(aabb, index) {
  let min = aabb.min.clone();
  let max = aabb.max.clone();
  let size = tmpVec3.subVectors(max, min);
  if ((index & 1) > 0) {
    min.z += size.z / 2;
  } else {
    max.z -= size.z / 2;
  }
  if ((index & 2) > 0) {
    min.y += size.y / 2;
  } else {
    max.y -= size.y / 2;
  }
  if ((index & 4) > 0) {
    min.x += size.x / 2;
  } else {
    max.x -= size.x / 2;
  }
  return new Box3(min, max);
}
let typenameTypeattributeMap = {
  "double": PointAttributeTypes.DATA_TYPE_DOUBLE,
  "float": PointAttributeTypes.DATA_TYPE_FLOAT,
  "int8": PointAttributeTypes.DATA_TYPE_INT8,
  "uint8": PointAttributeTypes.DATA_TYPE_UINT8,
  "int16": PointAttributeTypes.DATA_TYPE_INT16,
  "uint16": PointAttributeTypes.DATA_TYPE_UINT16,
  "int32": PointAttributeTypes.DATA_TYPE_INT32,
  "uint32": PointAttributeTypes.DATA_TYPE_UINT32,
  "int64": PointAttributeTypes.DATA_TYPE_INT64,
  "uint64": PointAttributeTypes.DATA_TYPE_UINT64
};
class OctreeLoader {
  constructor() {
    this.workerPool = new WorkerPool();
  }
  static parseAttributes(jsonAttributes) {
    let attributes = new PointAttributes$1();
    let replacements = {
      "rgb": "rgba"
    };
    for (const jsonAttribute of jsonAttributes) {
      let { name, numElements, min, max } = jsonAttribute;
      let type = typenameTypeattributeMap[jsonAttribute.type];
      let potreeAttributeName = replacements[name] ? replacements[name] : name;
      let attribute = new PointAttribute(potreeAttributeName, type, numElements);
      if (numElements === 1) {
        attribute.range = [min[0], max[0]];
      } else {
        attribute.range = [min, max];
      }
      if (name === "gps-time") {
        if (typeof attribute.range[0] === "number" && attribute.range[0] === attribute.range[1]) {
          attribute.range[1] += 1;
        }
      }
      attribute.initialRange = attribute.range;
      attributes.add(attribute);
    }
    {
      let hasNormals = attributes.attributes.find((a) => a.name === "NormalX") !== void 0 && attributes.attributes.find((a) => a.name === "NormalY") !== void 0 && attributes.attributes.find((a) => a.name === "NormalZ") !== void 0;
      if (hasNormals) {
        let vector = {
          name: "NORMAL",
          attributes: ["NormalX", "NormalY", "NormalZ"]
        };
        attributes.addVector(vector);
      }
    }
    return attributes;
  }
  async load(url, xhrRequest) {
    let response = await xhrRequest(url);
    let metadata = await response.json();
    let attributes = OctreeLoader.parseAttributes(metadata.attributes);
    let loader = new NodeLoader(url, this.workerPool, metadata);
    loader.attributes = attributes;
    loader.scale = metadata.scale;
    loader.offset = metadata.offset;
    let octree = new OctreeGeometry(loader, new Box3(new Vector3(...metadata.boundingBox.min), new Vector3(...metadata.boundingBox.max)));
    octree.url = url;
    octree.spacing = metadata.spacing;
    octree.scale = metadata.scale;
    let min = new Vector3(...metadata.boundingBox.min);
    let max = new Vector3(...metadata.boundingBox.max);
    let boundingBox = new Box3(min, max);
    let offset = min.clone();
    boundingBox.min.sub(offset);
    boundingBox.max.sub(offset);
    octree.projection = metadata.projection;
    octree.boundingBox = boundingBox;
    octree.tightBoundingBox = boundingBox.clone();
    octree.boundingSphere = boundingBox.getBoundingSphere(new Sphere());
    octree.tightBoundingSphere = boundingBox.getBoundingSphere(new Sphere());
    octree.offset = offset;
    octree.pointAttributes = OctreeLoader.parseAttributes(metadata.attributes);
    let root = new OctreeGeometryNode("r", octree, boundingBox);
    root.level = 0;
    root.nodeType = 2;
    root.hierarchyByteOffset = BigInt(0);
    root.hierarchyByteSize = BigInt(metadata.hierarchy.firstChunkSize);
    root.spacing = octree.spacing;
    root.byteOffset = BigInt(0);
    octree.root = root;
    loader.load(root);
    let result = {
      geometry: octree
    };
    return result;
  }
}
async function loadOctree(url, getUrl, xhrRequest) {
  const trueUrl = await getUrl(url);
  const loader = new OctreeLoader();
  const { geometry } = await loader.load(trueUrl, xhrRequest);
  return geometry;
}
const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl");
const FEATURES = {
  SHADER_INTERPOLATION: hasExtension("EXT_frag_depth") && hasMinVaryingVectors(8),
  SHADER_SPLATS: hasExtension("EXT_frag_depth") && hasExtension("OES_texture_float") && hasMinVaryingVectors(8),
  SHADER_EDL: hasExtension("OES_texture_float") && hasMinVaryingVectors(8),
  precision: getPrecision()
};
function hasExtension(ext) {
  return gl !== null && Boolean(gl.getExtension(ext));
}
function hasMinVaryingVectors(value) {
  return gl !== null && gl.getParameter(gl.MAX_VARYING_VECTORS) >= value;
}
function getPrecision() {
  if (gl === null) {
    return "";
  }
  const vsHighpFloat = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
  const vsMediumpFloat = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT);
  const fsHighpFloat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
  const fsMediumpFloat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
  const highpAvailable = vsHighpFloat && fsHighpFloat && vsHighpFloat.precision > 0 && fsHighpFloat.precision > 0;
  const mediumpAvailable = vsMediumpFloat && fsMediumpFloat && vsMediumpFloat.precision > 0 && fsMediumpFloat.precision > 0;
  return highpAvailable ? "highp" : mediumpAvailable ? "mediump" : "lowp";
}
var PointAttributeName = /* @__PURE__ */ ((PointAttributeName2) => {
  PointAttributeName2[PointAttributeName2["POSITION_CARTESIAN"] = 0] = "POSITION_CARTESIAN";
  PointAttributeName2[PointAttributeName2["COLOR_PACKED"] = 1] = "COLOR_PACKED";
  PointAttributeName2[PointAttributeName2["COLOR_FLOATS_1"] = 2] = "COLOR_FLOATS_1";
  PointAttributeName2[PointAttributeName2["COLOR_FLOATS_255"] = 3] = "COLOR_FLOATS_255";
  PointAttributeName2[PointAttributeName2["NORMAL_FLOATS"] = 4] = "NORMAL_FLOATS";
  PointAttributeName2[PointAttributeName2["FILLER"] = 5] = "FILLER";
  PointAttributeName2[PointAttributeName2["INTENSITY"] = 6] = "INTENSITY";
  PointAttributeName2[PointAttributeName2["CLASSIFICATION"] = 7] = "CLASSIFICATION";
  PointAttributeName2[PointAttributeName2["NORMAL_SPHEREMAPPED"] = 8] = "NORMAL_SPHEREMAPPED";
  PointAttributeName2[PointAttributeName2["NORMAL_OCT16"] = 9] = "NORMAL_OCT16";
  PointAttributeName2[PointAttributeName2["NORMAL"] = 10] = "NORMAL";
  return PointAttributeName2;
})(PointAttributeName || {});
const POINT_ATTRIBUTE_TYPES = {
  DATA_TYPE_DOUBLE: { ordinal: 0, size: 8 },
  DATA_TYPE_FLOAT: { ordinal: 1, size: 4 },
  DATA_TYPE_INT8: { ordinal: 2, size: 1 },
  DATA_TYPE_UINT8: { ordinal: 3, size: 1 },
  DATA_TYPE_INT16: { ordinal: 4, size: 2 },
  DATA_TYPE_UINT16: { ordinal: 5, size: 2 },
  DATA_TYPE_INT32: { ordinal: 6, size: 4 },
  DATA_TYPE_UINT32: { ordinal: 7, size: 4 },
  DATA_TYPE_INT64: { ordinal: 8, size: 8 },
  DATA_TYPE_UINT64: { ordinal: 9, size: 8 }
};
function makePointAttribute(name, type, numElements) {
  return {
    name,
    type,
    numElements,
    byteSize: numElements * type.size
  };
}
const RGBA_PACKED = makePointAttribute(1, POINT_ATTRIBUTE_TYPES.DATA_TYPE_INT8, 4);
const POINT_ATTRIBUTES = {
  POSITION_CARTESIAN: makePointAttribute(0, POINT_ATTRIBUTE_TYPES.DATA_TYPE_FLOAT, 3),
  RGBA_PACKED,
  COLOR_PACKED: RGBA_PACKED,
  RGB_PACKED: makePointAttribute(1, POINT_ATTRIBUTE_TYPES.DATA_TYPE_INT8, 3),
  NORMAL_FLOATS: makePointAttribute(4, POINT_ATTRIBUTE_TYPES.DATA_TYPE_FLOAT, 3),
  FILLER_1B: makePointAttribute(5, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 1),
  INTENSITY: makePointAttribute(6, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT16, 1),
  CLASSIFICATION: makePointAttribute(7, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 1),
  NORMAL_SPHEREMAPPED: makePointAttribute(8, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 2),
  NORMAL_OCT16: makePointAttribute(9, POINT_ATTRIBUTE_TYPES.DATA_TYPE_UINT8, 2),
  NORMAL: makePointAttribute(10, POINT_ATTRIBUTE_TYPES.DATA_TYPE_FLOAT, 3)
};
class PointAttributes {
  constructor(pointAttributeNames = []) {
    this.attributes = [];
    this.byteSize = 0;
    this.size = 0;
    for (let i2 = 0; i2 < pointAttributeNames.length; i2++) {
      const pointAttributeName = pointAttributeNames[i2];
      const pointAttribute = POINT_ATTRIBUTES[pointAttributeName];
      this.attributes.push(pointAttribute);
      this.byteSize += pointAttribute.byteSize;
      this.size++;
    }
  }
  add(pointAttribute) {
    this.attributes.push(pointAttribute);
    this.byteSize += pointAttribute.byteSize;
    this.size++;
  }
  hasColors() {
    return this.attributes.find(isColorAttribute) !== void 0;
  }
  hasNormals() {
    return this.attributes.find(isNormalAttribute) !== void 0;
  }
}
function isColorAttribute({ name }) {
  return name === 1;
}
function isNormalAttribute({ name }) {
  return name === 8 || name === 4 || name === 10 || name === 9;
}
class Version {
  constructor(version) {
    this.versionMinor = 0;
    this.version = version;
    const vmLength = version.indexOf(".") === -1 ? version.length : version.indexOf(".");
    this.versionMajor = parseInt(version.substr(0, vmLength), 10);
    this.versionMinor = parseInt(version.substr(vmLength + 1), 10);
    if (isNaN(this.versionMinor)) {
      this.versionMinor = 0;
    }
  }
  newerThan(version) {
    const v = new Version(version);
    if (this.versionMajor > v.versionMajor) {
      return true;
    } else if (this.versionMajor === v.versionMajor && this.versionMinor > v.versionMinor) {
      return true;
    } else {
      return false;
    }
  }
  equalOrHigher(version) {
    const v = new Version(version);
    if (this.versionMajor > v.versionMajor) {
      return true;
    } else if (this.versionMajor === v.versionMajor && this.versionMinor >= v.versionMinor) {
      return true;
    } else {
      return false;
    }
  }
  upTo(version) {
    return !this.newerThan(version);
  }
}
const encodedJs = "KGZ1bmN0aW9uKCl7InVzZSBzdHJpY3QiO3ZhciBUPShlPT4oZVtlLlBPU0lUSU9OX0NBUlRFU0lBTj0wXT0iUE9TSVRJT05fQ0FSVEVTSUFOIixlW2UuQ09MT1JfUEFDS0VEPTFdPSJDT0xPUl9QQUNLRUQiLGVbZS5DT0xPUl9GTE9BVFNfMT0yXT0iQ09MT1JfRkxPQVRTXzEiLGVbZS5DT0xPUl9GTE9BVFNfMjU1PTNdPSJDT0xPUl9GTE9BVFNfMjU1IixlW2UuTk9STUFMX0ZMT0FUUz00XT0iTk9STUFMX0ZMT0FUUyIsZVtlLkZJTExFUj01XT0iRklMTEVSIixlW2UuSU5URU5TSVRZPTZdPSJJTlRFTlNJVFkiLGVbZS5DTEFTU0lGSUNBVElPTj03XT0iQ0xBU1NJRklDQVRJT04iLGVbZS5OT1JNQUxfU1BIRVJFTUFQUEVEPThdPSJOT1JNQUxfU1BIRVJFTUFQUEVEIixlW2UuTk9STUFMX09DVDE2PTldPSJOT1JNQUxfT0NUMTYiLGVbZS5OT1JNQUw9MTBdPSJOT1JNQUwiLGUpKShUfHx7fSk7Y29uc3QgST17REFUQV9UWVBFX0RPVUJMRTp7b3JkaW5hbDowLHNpemU6OH0sREFUQV9UWVBFX0ZMT0FUOntvcmRpbmFsOjEsc2l6ZTo0fSxEQVRBX1RZUEVfSU5UODp7b3JkaW5hbDoyLHNpemU6MX0sREFUQV9UWVBFX1VJTlQ4OntvcmRpbmFsOjMsc2l6ZToxfSxEQVRBX1RZUEVfSU5UMTY6e29yZGluYWw6NCxzaXplOjJ9LERBVEFfVFlQRV9VSU5UMTY6e29yZGluYWw6NSxzaXplOjJ9LERBVEFfVFlQRV9JTlQzMjp7b3JkaW5hbDo2LHNpemU6NH0sREFUQV9UWVBFX1VJTlQzMjp7b3JkaW5hbDo3LHNpemU6NH0sREFUQV9UWVBFX0lOVDY0OntvcmRpbmFsOjgsc2l6ZTo4fSxEQVRBX1RZUEVfVUlOVDY0OntvcmRpbmFsOjksc2l6ZTo4fX07ZnVuY3Rpb24gTyhlLHQscil7cmV0dXJue25hbWU6ZSx0eXBlOnQsbnVtRWxlbWVudHM6cixieXRlU2l6ZTpyKnQuc2l6ZX19Y29uc3QgUz1PKDEsSS5EQVRBX1RZUEVfSU5UOCw0KSxFPXtQT1NJVElPTl9DQVJURVNJQU46TygwLEkuREFUQV9UWVBFX0ZMT0FULDMpLFJHQkFfUEFDS0VEOlMsQ09MT1JfUEFDS0VEOlMsUkdCX1BBQ0tFRDpPKDEsSS5EQVRBX1RZUEVfSU5UOCwzKSxOT1JNQUxfRkxPQVRTOk8oNCxJLkRBVEFfVFlQRV9GTE9BVCwzKSxGSUxMRVJfMUI6Tyg1LEkuREFUQV9UWVBFX1VJTlQ4LDEpLElOVEVOU0lUWTpPKDYsSS5EQVRBX1RZUEVfVUlOVDE2LDEpLENMQVNTSUZJQ0FUSU9OOk8oNyxJLkRBVEFfVFlQRV9VSU5UOCwxKSxOT1JNQUxfU1BIRVJFTUFQUEVEOk8oOCxJLkRBVEFfVFlQRV9VSU5UOCwyKSxOT1JNQUxfT0NUMTY6Tyg5LEkuREFUQV9UWVBFX1VJTlQ4LDIpLE5PUk1BTDpPKDEwLEkuREFUQV9UWVBFX0ZMT0FULDMpfTtjbGFzcyBke2NvbnN0cnVjdG9yKHQpe3RoaXMudmVyc2lvbk1pbm9yPTAsdGhpcy52ZXJzaW9uPXQ7Y29uc3Qgcj10LmluZGV4T2YoIi4iKT09PS0xP3QubGVuZ3RoOnQuaW5kZXhPZigiLiIpO3RoaXMudmVyc2lvbk1ham9yPXBhcnNlSW50KHQuc3Vic3RyKDAsciksMTApLHRoaXMudmVyc2lvbk1pbm9yPXBhcnNlSW50KHQuc3Vic3RyKHIrMSksMTApLGlzTmFOKHRoaXMudmVyc2lvbk1pbm9yKSYmKHRoaXMudmVyc2lvbk1pbm9yPTApfW5ld2VyVGhhbih0KXtjb25zdCByPW5ldyBkKHQpO3JldHVybiB0aGlzLnZlcnNpb25NYWpvcj5yLnZlcnNpb25NYWpvcj8hMDp0aGlzLnZlcnNpb25NYWpvcj09PXIudmVyc2lvbk1ham9yJiZ0aGlzLnZlcnNpb25NaW5vcj5yLnZlcnNpb25NaW5vcn1lcXVhbE9ySGlnaGVyKHQpe2NvbnN0IHI9bmV3IGQodCk7cmV0dXJuIHRoaXMudmVyc2lvbk1ham9yPnIudmVyc2lvbk1ham9yPyEwOnRoaXMudmVyc2lvbk1ham9yPT09ci52ZXJzaW9uTWFqb3ImJnRoaXMudmVyc2lvbk1pbm9yPj1yLnZlcnNpb25NaW5vcn11cFRvKHQpe3JldHVybiF0aGlzLm5ld2VyVGhhbih0KX19Y2xhc3MgTntjb25zdHJ1Y3Rvcih0KXt0aGlzLnRtcD1uZXcgQXJyYXlCdWZmZXIoNCksdGhpcy50bXBmPW5ldyBGbG9hdDMyQXJyYXkodGhpcy50bXApLHRoaXMudG1wdTg9bmV3IFVpbnQ4QXJyYXkodGhpcy50bXApLHRoaXMudTg9bmV3IFVpbnQ4QXJyYXkodCl9Z2V0VWludDMyKHQpe3JldHVybiB0aGlzLnU4W3QrM108PDI0fHRoaXMudThbdCsyXTw8MTZ8dGhpcy51OFt0KzFdPDw4fHRoaXMudThbdF19Z2V0VWludDE2KHQpe3JldHVybiB0aGlzLnU4W3QrMV08PDh8dGhpcy51OFt0XX1nZXRGbG9hdDMyKHQpe2NvbnN0IHI9dGhpcy50bXB1OCxzPXRoaXMudTgsbj10aGlzLnRtcGY7cmV0dXJuIHJbMF09c1t0KzBdLHJbMV09c1t0KzFdLHJbMl09c1t0KzJdLHJbM109c1t0KzNdLG5bMF19Z2V0VWludDgodCl7cmV0dXJuIHRoaXMudThbdF19fWNvbnN0IGg9TWF0aC5zaWdufHxmdW5jdGlvbihlKXtyZXR1cm4oZT0rZSk9PTB8fGUhPWU/ZTplPDA/LTE6MX07ZnVuY3Rpb24gYihlKXtjb25zdCB0PWUuZGF0YS5idWZmZXIscj1lLmRhdGEucG9pbnRBdHRyaWJ1dGVzLHM9e2F0dHJpYnV0ZUJ1ZmZlcnM6e30sY3VycmVudE9mZnNldDowLGRhdGE6bmV3IE4odCksbWVhbjpbMCwwLDBdLG5vZGVPZmZzZXQ6ZS5kYXRhLm9mZnNldCxudW1Qb2ludHM6ZS5kYXRhLmJ1ZmZlci5ieXRlTGVuZ3RoL3IuYnl0ZVNpemUscG9pbnRBdHRyaWJ1dGVzOnIsc2NhbGU6ZS5kYXRhLnNjYWxlLHRpZ2h0Qm94TWF4OltOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLE51bWJlci5ORUdBVElWRV9JTkZJTklUWV0sdGlnaHRCb3hNaW46W051bWJlci5QT1NJVElWRV9JTkZJTklUWSxOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZXSx0cmFuc2ZlcmFibGVzOltdLHZlcnNpb246bmV3IGQoZS5kYXRhLnZlcnNpb24pfTtmb3IoY29uc3QgaSBvZiBzLnBvaW50QXR0cmlidXRlcy5hdHRyaWJ1dGVzKVAoaSxzKSxzLmN1cnJlbnRPZmZzZXQrPWkuYnl0ZVNpemU7Y29uc3Qgbj1uZXcgQXJyYXlCdWZmZXIocy5udW1Qb2ludHMqNCksYT1uZXcgVWludDMyQXJyYXkobik7Zm9yKGxldCBpPTA7aTxzLm51bVBvaW50cztpKyspYVtpXT1pO3MuYXR0cmlidXRlQnVmZmVyc1tULkNMQVNTSUZJQ0FUSU9OXXx8eShzKTtjb25zdCB1PXtidWZmZXI6dCxtZWFuOnMubWVhbixhdHRyaWJ1dGVCdWZmZXJzOnMuYXR0cmlidXRlQnVmZmVycyx0aWdodEJvdW5kaW5nQm94OnttaW46cy50aWdodEJveE1pbixtYXg6cy50aWdodEJveE1heH0saW5kaWNlczpufTtwb3N0TWVzc2FnZSh1LHMudHJhbnNmZXJhYmxlcyl9ZnVuY3Rpb24geShlKXtjb25zdCB0PW5ldyBBcnJheUJ1ZmZlcihlLm51bVBvaW50cyo0KSxyPW5ldyBGbG9hdDMyQXJyYXkodCk7Zm9yKGxldCBzPTA7czxlLm51bVBvaW50cztzKyspcltzXT0wO2UuYXR0cmlidXRlQnVmZmVyc1tULkNMQVNTSUZJQ0FUSU9OXT17YnVmZmVyOnQsYXR0cmlidXRlOkUuQ0xBU1NJRklDQVRJT059fWZ1bmN0aW9uIFAoZSx0KXtjb25zdCByPWcoZSx0KTtyIT09dm9pZCAwJiYodC5hdHRyaWJ1dGVCdWZmZXJzW3IuYXR0cmlidXRlLm5hbWVdPXIsdC50cmFuc2ZlcmFibGVzLnB1c2goci5idWZmZXIpKX1mdW5jdGlvbiBnKGUsdCl7c3dpdGNoKGUubmFtZSl7Y2FzZSBULlBPU0lUSU9OX0NBUlRFU0lBTjpyZXR1cm4gTChlLHQpO2Nhc2UgVC5DT0xPUl9QQUNLRUQ6cmV0dXJuIG0oZSx0KTtjYXNlIFQuSU5URU5TSVRZOnJldHVybiBCKGUsdCk7Y2FzZSBULkNMQVNTSUZJQ0FUSU9OOnJldHVybiBDKGUsdCk7Y2FzZSBULk5PUk1BTF9TUEhFUkVNQVBQRUQ6cmV0dXJuIEYoZSx0KTtjYXNlIFQuTk9STUFMX09DVDE2OnJldHVybiBwKGUsdCk7Y2FzZSBULk5PUk1BTDpyZXR1cm4gUihlLHQpO2RlZmF1bHQ6cmV0dXJufX1mdW5jdGlvbiBMKGUsdCl7Y29uc3Qgcj1uZXcgQXJyYXlCdWZmZXIodC5udW1Qb2ludHMqNCozKSxzPW5ldyBGbG9hdDMyQXJyYXkocik7Zm9yKGxldCBuPTA7bjx0Lm51bVBvaW50cztuKyspe2xldCBhLHUsaTt0LnZlcnNpb24ubmV3ZXJUaGFuKCIxLjMiKT8oYT10LmRhdGEuZ2V0VWludDMyKHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzApKnQuc2NhbGUsdT10LmRhdGEuZ2V0VWludDMyKHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzQpKnQuc2NhbGUsaT10LmRhdGEuZ2V0VWludDMyKHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzgpKnQuc2NhbGUpOihhPXQuZGF0YS5nZXRGbG9hdDMyKG4qdC5wb2ludEF0dHJpYnV0ZXMuYnl0ZVNpemUrMCkrdC5ub2RlT2Zmc2V0WzBdLHU9dC5kYXRhLmdldEZsb2F0MzIobip0LnBvaW50QXR0cmlidXRlcy5ieXRlU2l6ZSs0KSt0Lm5vZGVPZmZzZXRbMV0saT10LmRhdGEuZ2V0RmxvYXQzMihuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzgpK3Qubm9kZU9mZnNldFsyXSksc1szKm4rMF09YSxzWzMqbisxXT11LHNbMypuKzJdPWksdC5tZWFuWzBdKz1hL3QubnVtUG9pbnRzLHQubWVhblsxXSs9dS90Lm51bVBvaW50cyx0Lm1lYW5bMl0rPWkvdC5udW1Qb2ludHMsdC50aWdodEJveE1pblswXT1NYXRoLm1pbih0LnRpZ2h0Qm94TWluWzBdLGEpLHQudGlnaHRCb3hNaW5bMV09TWF0aC5taW4odC50aWdodEJveE1pblsxXSx1KSx0LnRpZ2h0Qm94TWluWzJdPU1hdGgubWluKHQudGlnaHRCb3hNaW5bMl0saSksdC50aWdodEJveE1heFswXT1NYXRoLm1heCh0LnRpZ2h0Qm94TWF4WzBdLGEpLHQudGlnaHRCb3hNYXhbMV09TWF0aC5tYXgodC50aWdodEJveE1heFsxXSx1KSx0LnRpZ2h0Qm94TWF4WzJdPU1hdGgubWF4KHQudGlnaHRCb3hNYXhbMl0saSl9cmV0dXJue2J1ZmZlcjpyLGF0dHJpYnV0ZTplfX1mdW5jdGlvbiBtKGUsdCl7Y29uc3Qgcj1uZXcgQXJyYXlCdWZmZXIodC5udW1Qb2ludHMqMykscz1uZXcgVWludDhBcnJheShyKTtmb3IobGV0IG49MDtuPHQubnVtUG9pbnRzO24rKylzWzMqbiswXT10LmRhdGEuZ2V0VWludDgodC5jdXJyZW50T2Zmc2V0K24qdC5wb2ludEF0dHJpYnV0ZXMuYnl0ZVNpemUrMCksc1szKm4rMV09dC5kYXRhLmdldFVpbnQ4KHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzEpLHNbMypuKzJdPXQuZGF0YS5nZXRVaW50OCh0LmN1cnJlbnRPZmZzZXQrbip0LnBvaW50QXR0cmlidXRlcy5ieXRlU2l6ZSsyKTtyZXR1cm57YnVmZmVyOnIsYXR0cmlidXRlOmV9fWZ1bmN0aW9uIEIoZSx0KXtjb25zdCByPW5ldyBBcnJheUJ1ZmZlcih0Lm51bVBvaW50cyo0KSxzPW5ldyBGbG9hdDMyQXJyYXkocik7Zm9yKGxldCBuPTA7bjx0Lm51bVBvaW50cztuKyspc1tuXT10LmRhdGEuZ2V0VWludDE2KHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKTtyZXR1cm57YnVmZmVyOnIsYXR0cmlidXRlOmV9fWZ1bmN0aW9uIEMoZSx0KXtjb25zdCByPW5ldyBBcnJheUJ1ZmZlcih0Lm51bVBvaW50cykscz1uZXcgVWludDhBcnJheShyKTtmb3IobGV0IG49MDtuPHQubnVtUG9pbnRzO24rKylzW25dPXQuZGF0YS5nZXRVaW50OCh0LmN1cnJlbnRPZmZzZXQrbip0LnBvaW50QXR0cmlidXRlcy5ieXRlU2l6ZSk7cmV0dXJue2J1ZmZlcjpyLGF0dHJpYnV0ZTplfX1mdW5jdGlvbiBGKGUsdCl7Y29uc3Qgcj1uZXcgQXJyYXlCdWZmZXIodC5udW1Qb2ludHMqNCozKSxzPW5ldyBGbG9hdDMyQXJyYXkocik7Zm9yKGxldCBuPTA7bjx0Lm51bVBvaW50cztuKyspe2NvbnN0IGE9dC5kYXRhLmdldFVpbnQ4KHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzApLHU9dC5kYXRhLmdldFVpbnQ4KHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzEpLGk9YS8yNTUsbD11LzI1NTtsZXQgZj1pKjItMSxvPWwqMi0xLEE9MTtjb25zdCBfPS0xLE09ZiotZitvKi1vK0EqLV87QT1NLGY9ZipNYXRoLnNxcnQoTSksbz1vKk1hdGguc3FydChNKSxmPWYqMixvPW8qMixBPUEqMi0xLHNbMypuKzBdPWYsc1szKm4rMV09byxzWzMqbisyXT1BfXJldHVybntidWZmZXI6cixhdHRyaWJ1dGU6ZX19ZnVuY3Rpb24gcChlLHQpe2NvbnN0IHI9bmV3IEFycmF5QnVmZmVyKHQubnVtUG9pbnRzKjQqMykscz1uZXcgRmxvYXQzMkFycmF5KHIpO2ZvcihsZXQgbj0wO248dC5udW1Qb2ludHM7bisrKXtjb25zdCBhPXQuZGF0YS5nZXRVaW50OCh0LmN1cnJlbnRPZmZzZXQrbip0LnBvaW50QXR0cmlidXRlcy5ieXRlU2l6ZSswKSx1PXQuZGF0YS5nZXRVaW50OCh0LmN1cnJlbnRPZmZzZXQrbip0LnBvaW50QXR0cmlidXRlcy5ieXRlU2l6ZSsxKSxpPWEvMjU1KjItMSxsPXUvMjU1KjItMTtsZXQgZj0xLU1hdGguYWJzKGkpLU1hdGguYWJzKGwpLG89MCxBPTA7Zj49MD8obz1pLEE9bCk6KG89LShsL2gobCktMSkvaChpKSxBPS0oaS9oKGkpLTEpL2gobCkpO2NvbnN0IF89TWF0aC5zcXJ0KG8qbytBKkErZipmKTtvPW8vXyxBPUEvXyxmPWYvXyxzWzMqbiswXT1vLHNbMypuKzFdPUEsc1szKm4rMl09Zn1yZXR1cm57YnVmZmVyOnIsYXR0cmlidXRlOmV9fWZ1bmN0aW9uIFIoZSx0KXtjb25zdCByPW5ldyBBcnJheUJ1ZmZlcih0Lm51bVBvaW50cyo0KjMpLHM9bmV3IEZsb2F0MzJBcnJheShyKTtmb3IobGV0IG49MDtuPHQubnVtUG9pbnRzO24rKyl7Y29uc3QgYT10LmRhdGEuZ2V0RmxvYXQzMih0LmN1cnJlbnRPZmZzZXQrbip0LnBvaW50QXR0cmlidXRlcy5ieXRlU2l6ZSswKSx1PXQuZGF0YS5nZXRGbG9hdDMyKHQuY3VycmVudE9mZnNldCtuKnQucG9pbnRBdHRyaWJ1dGVzLmJ5dGVTaXplKzQpLGk9dC5kYXRhLmdldEZsb2F0MzIodC5jdXJyZW50T2Zmc2V0K24qdC5wb2ludEF0dHJpYnV0ZXMuYnl0ZVNpemUrOCk7c1szKm4rMF09YSxzWzMqbisxXT11LHNbMypuKzJdPWl9cmV0dXJue2J1ZmZlcjpyLGF0dHJpYnV0ZTplfX1vbm1lc3NhZ2U9Yn0pKCk7Cg==";
const blob = typeof window !== "undefined" && window.Blob && new Blob([atob(encodedJs)], { type: "text/javascript;charset=utf-8" });
function WorkerWrapper() {
  const objURL = blob && (window.URL || window.webkitURL).createObjectURL(blob);
  try {
    return objURL ? new Worker(objURL, {}) : new Worker("data:application/javascript;base64," + encodedJs, { type: "module" });
  } finally {
    objURL && (window.URL || window.webkitURL).revokeObjectURL(objURL);
  }
}
class BinaryLoader {
  constructor({
    getUrl = (s) => Promise.resolve(s),
    version,
    boundingBox,
    scale,
    xhrRequest
  }) {
    this.disposed = false;
    this.workers = [];
    console.log([getUrl, version, boundingBox, scale, xhrRequest]);
    if (typeof version === "string") {
      this.version = new Version(version);
    } else {
      this.version = version;
    }
    this.xhrRequest = xhrRequest;
    this.getUrl = getUrl;
    this.boundingBox = boundingBox;
    this.scale = scale;
    this.callbacks = [];
  }
  dispose() {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.disposed = true;
  }
  load(node) {
    if (node.loaded || this.disposed) {
      return Promise.resolve();
    }
    return Promise.resolve(this.getUrl(this.getNodeUrl(node))).then((url) => this.xhrRequest(url, { mode: "cors" })).then((res) => res.arrayBuffer()).then((buffer) => {
      return new Promise((resolve) => this.parse(node, buffer, resolve));
    });
  }
  getNodeUrl(node) {
    let url = node.getUrl();
    if (this.version.equalOrHigher("1.4")) {
      url += ".bin";
    }
    return url;
  }
  parse(node, buffer, resolve) {
    if (this.disposed) {
      resolve();
      return;
    }
    const worker = this.getWorker();
    const pointAttributes = node.pcoGeometry.pointAttributes;
    const numPoints = buffer.byteLength / pointAttributes.byteSize;
    if (this.version.upTo("1.5")) {
      node.numPoints = numPoints;
    }
    worker.onmessage = (e) => {
      if (this.disposed) {
        resolve();
        return;
      }
      const data = e.data;
      const geometry = node.geometry = node.geometry || new BufferGeometry();
      geometry.boundingBox = node.boundingBox;
      this.addBufferAttributes(geometry, data.attributeBuffers);
      this.addIndices(geometry, data.indices);
      this.addNormalAttribute(geometry, numPoints);
      node.mean = new Vector3().fromArray(data.mean);
      node.tightBoundingBox = this.getTightBoundingBox(data.tightBoundingBox);
      node.loaded = true;
      node.loading = false;
      node.failed = false;
      node.pcoGeometry.numNodesLoading--;
      node.pcoGeometry.needsUpdate = true;
      this.releaseWorker(worker);
      this.callbacks.forEach((callback) => callback(node));
      resolve();
    };
    const message = {
      buffer,
      pointAttributes,
      version: this.version.version,
      min: node.boundingBox.min.toArray(),
      offset: node.pcoGeometry.offset.toArray(),
      scale: this.scale,
      spacing: node.spacing,
      hasChildren: node.hasChildren
    };
    worker.postMessage(message, [message.buffer]);
  }
  getWorker() {
    const worker = this.workers.pop();
    if (worker) {
      return worker;
    }
    return new WorkerWrapper();
  }
  releaseWorker(worker) {
    this.workers.push(worker);
  }
  getTightBoundingBox({ min, max }) {
    const box = new Box3(new Vector3().fromArray(min), new Vector3().fromArray(max));
    box.max.sub(box.min);
    box.min.set(0, 0, 0);
    return box;
  }
  addBufferAttributes(geometry, buffers) {
    Object.keys(buffers).forEach((property) => {
      const buffer = buffers[property].buffer;
      if (this.isAttribute(property, PointAttributeName.POSITION_CARTESIAN)) {
        geometry.setAttribute("position", new BufferAttribute(new Float32Array(buffer), 3));
      } else if (this.isAttribute(property, PointAttributeName.COLOR_PACKED)) {
        geometry.setAttribute("color", new BufferAttribute(new Uint8Array(buffer), 3, true));
      } else if (this.isAttribute(property, PointAttributeName.INTENSITY)) {
        geometry.setAttribute("intensity", new BufferAttribute(new Float32Array(buffer), 1));
      } else if (this.isAttribute(property, PointAttributeName.CLASSIFICATION)) {
        geometry.setAttribute("classification", new BufferAttribute(new Uint8Array(buffer), 1));
      } else if (this.isAttribute(property, PointAttributeName.NORMAL_SPHEREMAPPED)) {
        geometry.setAttribute("normal", new BufferAttribute(new Float32Array(buffer), 3));
      } else if (this.isAttribute(property, PointAttributeName.NORMAL_OCT16)) {
        geometry.setAttribute("normal", new BufferAttribute(new Float32Array(buffer), 3));
      } else if (this.isAttribute(property, PointAttributeName.NORMAL)) {
        geometry.setAttribute("normal", new BufferAttribute(new Float32Array(buffer), 3));
      }
    });
  }
  addIndices(geometry, indices) {
    const indicesAttribute = new Uint8BufferAttribute(indices, 4);
    indicesAttribute.normalized = true;
    geometry.setAttribute("indices", indicesAttribute);
  }
  addNormalAttribute(geometry, numPoints) {
    if (!geometry.getAttribute("normal")) {
      const buffer = new Float32Array(numPoints * 3);
      geometry.setAttribute("normal", new BufferAttribute(new Float32Array(buffer), 3));
    }
  }
  isAttribute(property, name) {
    return parseInt(property, 10) === name;
  }
}
class PointCloudOctreeGeometry {
  constructor(loader, boundingBox, tightBoundingBox, offset, xhrRequest) {
    this.loader = loader;
    this.boundingBox = boundingBox;
    this.tightBoundingBox = tightBoundingBox;
    this.offset = offset;
    this.xhrRequest = xhrRequest;
    this.disposed = false;
    this.needsUpdate = true;
    this.octreeDir = "";
    this.hierarchyStepSize = -1;
    this.nodes = {};
    this.numNodesLoading = 0;
    this.maxNumNodesLoading = 3;
    this.spacing = 0;
    this.pointAttributes = new PointAttributes([]);
    this.projection = null;
    this.url = null;
  }
  dispose() {
    this.loader.dispose();
    this.root.traverse((node) => node.dispose());
    this.disposed = true;
  }
  addNodeLoadedCallback(callback) {
    this.loader.callbacks.push(callback);
  }
  clearNodeLoadedCallbacks() {
    this.loader.callbacks = [];
  }
}
const NODE_STRIDE = 5;
const _PointCloudOctreeGeometryNode = class extends EventDispatcher {
  constructor(name, pcoGeometry, boundingBox) {
    super();
    this.id = _PointCloudOctreeGeometryNode.idCount++;
    this.level = 0;
    this.spacing = 0;
    this.hasChildren = false;
    this.children = [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    ];
    this.mean = new Vector3();
    this.numPoints = 0;
    this.loaded = false;
    this.loading = false;
    this.failed = false;
    this.parent = null;
    this.oneTimeDisposeHandlers = [];
    this.isLeafNode = true;
    this.isTreeNode = false;
    this.isGeometryNode = true;
    this.name = name;
    this.index = getIndexFromName(name);
    this.pcoGeometry = pcoGeometry;
    this.boundingBox = boundingBox;
    this.tightBoundingBox = boundingBox.clone();
    this.boundingSphere = boundingBox.getBoundingSphere(new Sphere());
  }
  dispose() {
    if (!this.geometry || !this.parent) {
      return;
    }
    this.geometry.dispose();
    this.geometry = void 0;
    this.loaded = false;
    this.oneTimeDisposeHandlers.forEach((handler) => handler());
    this.oneTimeDisposeHandlers = [];
  }
  getUrl() {
    const geometry = this.pcoGeometry;
    const version = geometry.loader.version;
    const pathParts = [geometry.octreeDir];
    if (geometry.loader && version.equalOrHigher("1.5")) {
      pathParts.push(this.getHierarchyBaseUrl());
      pathParts.push(this.name);
    } else if (version.equalOrHigher("1.4")) {
      pathParts.push(this.name);
    } else if (version.upTo("1.3")) {
      pathParts.push(this.name);
    }
    return pathParts.join("/");
  }
  getHierarchyUrl() {
    return `${this.pcoGeometry.octreeDir}/${this.getHierarchyBaseUrl()}/${this.name}.hrc`;
  }
  addChild(child) {
    this.children[child.index] = child;
    this.isLeafNode = false;
    child.parent = this;
  }
  traverse(cb, includeSelf = true) {
    const stack = includeSelf ? [this] : [];
    let current;
    while ((current = stack.pop()) !== void 0) {
      cb(current);
      for (const child of current.children) {
        if (child !== null) {
          stack.push(child);
        }
      }
    }
  }
  load() {
    if (!this.canLoad()) {
      return Promise.resolve();
    }
    this.loading = true;
    this.pcoGeometry.numNodesLoading++;
    this.pcoGeometry.needsUpdate = true;
    let promise;
    if (this.pcoGeometry.loader.version.equalOrHigher("1.5") && this.level % this.pcoGeometry.hierarchyStepSize === 0 && this.hasChildren) {
      promise = this.loadHierachyThenPoints();
    } else {
      promise = this.loadPoints();
    }
    return promise.catch((reason) => {
      this.loading = false;
      this.failed = true;
      this.pcoGeometry.numNodesLoading--;
      throw reason;
    });
  }
  canLoad() {
    return !this.loading && !this.loaded && !this.pcoGeometry.disposed && !this.pcoGeometry.loader.disposed && this.pcoGeometry.numNodesLoading < this.pcoGeometry.maxNumNodesLoading;
  }
  loadPoints() {
    this.pcoGeometry.needsUpdate = true;
    return this.pcoGeometry.loader.load(this);
  }
  loadHierachyThenPoints() {
    if (this.level % this.pcoGeometry.hierarchyStepSize !== 0) {
      return Promise.resolve();
    }
    return Promise.resolve(this.pcoGeometry.loader.getUrl(this.getHierarchyUrl())).then((url) => this.pcoGeometry.xhrRequest(url, { mode: "cors" })).then((res) => res.arrayBuffer()).then((data) => this.loadHierarchy(this, data));
  }
  getHierarchyBaseUrl() {
    const hierarchyStepSize = this.pcoGeometry.hierarchyStepSize;
    const indices = this.name.substr(1);
    const numParts = Math.floor(indices.length / hierarchyStepSize);
    let path = "r/";
    for (let i2 = 0; i2 < numParts; i2++) {
      path += `${indices.substr(i2 * hierarchyStepSize, hierarchyStepSize)}/`;
    }
    return path.slice(0, -1);
  }
  loadHierarchy(node, buffer) {
    const view = new DataView(buffer);
    const firstNodeData = this.getNodeData(node.name, 0, view);
    node.numPoints = firstNodeData.numPoints;
    const stack = [firstNodeData];
    const decoded = [];
    let offset = NODE_STRIDE;
    while (stack.length > 0) {
      const stackNodeData = stack.shift();
      let mask = 1;
      for (let i2 = 0; i2 < 8 && offset + 1 < buffer.byteLength; i2++) {
        if ((stackNodeData.children & mask) !== 0) {
          const nodeData = this.getNodeData(stackNodeData.name + i2, offset, view);
          decoded.push(nodeData);
          stack.push(nodeData);
          offset += NODE_STRIDE;
        }
        mask = mask * 2;
      }
    }
    node.pcoGeometry.needsUpdate = true;
    const nodes = /* @__PURE__ */ new Map();
    nodes.set(node.name, node);
    decoded.forEach((nodeData) => this.addNode(nodeData, node.pcoGeometry, nodes));
    node.loadPoints();
  }
  getNodeData(name, offset, view) {
    const children = view.getUint8(offset);
    const numPoints = view.getUint32(offset + 1, true);
    return { children, numPoints, name };
  }
  addNode({ name, numPoints, children }, pco, nodes) {
    const index = getIndexFromName(name);
    const parentName = name.substring(0, name.length - 1);
    const parentNode = nodes.get(parentName);
    const level = name.length - 1;
    const boundingBox = createChildAABB$1(parentNode.boundingBox, index);
    const node = new _PointCloudOctreeGeometryNode(name, pco, boundingBox);
    node.level = level;
    node.numPoints = numPoints;
    node.hasChildren = children > 0;
    node.spacing = pco.spacing / Math.pow(2, level);
    parentNode.addChild(node);
    nodes.set(name, node);
  }
};
let PointCloudOctreeGeometryNode = _PointCloudOctreeGeometryNode;
PointCloudOctreeGeometryNode.idCount = 0;
function loadPOC(url, getUrl, xhrRequest) {
  return Promise.resolve(getUrl(url)).then((transformedUrl) => {
    return xhrRequest(transformedUrl, { mode: "cors" }).then((res) => res.json()).then(parse(transformedUrl, getUrl, xhrRequest));
  });
}
function parse(url, getUrl, xhrRequest) {
  return (data) => {
    const { offset, boundingBox, tightBoundingBox } = getBoundingBoxes(data);
    const loader = new BinaryLoader({
      getUrl,
      version: data.version,
      boundingBox,
      scale: data.scale,
      xhrRequest
    });
    const pco = new PointCloudOctreeGeometry(loader, boundingBox, tightBoundingBox, offset, xhrRequest);
    pco.url = url;
    pco.octreeDir = data.octreeDir;
    pco.needsUpdate = true;
    pco.spacing = data.spacing;
    pco.hierarchyStepSize = data.hierarchyStepSize;
    pco.projection = data.projection;
    pco.offset = offset;
    pco.pointAttributes = new PointAttributes(data.pointAttributes);
    console.log(pco.pointAttributes);
    const nodes = {};
    const version = new Version(data.version);
    return loadRoot(pco, data, nodes, version).then(() => {
      if (version.upTo("1.4")) {
        loadRemainingHierarchy(pco, data, nodes);
      }
      pco.nodes = nodes;
      return pco;
    });
  };
}
function getBoundingBoxes(data) {
  const min = new Vector3(data.boundingBox.lx, data.boundingBox.ly, data.boundingBox.lz);
  const max = new Vector3(data.boundingBox.ux, data.boundingBox.uy, data.boundingBox.uz);
  const boundingBox = new Box3(min, max);
  const tightBoundingBox = boundingBox.clone();
  const offset = min.clone();
  if (data.tightBoundingBox) {
    const { lx, ly, lz, ux, uy, uz } = data.tightBoundingBox;
    tightBoundingBox.min.set(lx, ly, lz);
    tightBoundingBox.max.set(ux, uy, uz);
  }
  boundingBox.min.sub(offset);
  boundingBox.max.sub(offset);
  tightBoundingBox.min.sub(offset);
  tightBoundingBox.max.sub(offset);
  return { offset, boundingBox, tightBoundingBox };
}
function loadRoot(pco, data, nodes, version) {
  const name = "r";
  const root = new PointCloudOctreeGeometryNode(name, pco, pco.boundingBox);
  root.hasChildren = true;
  root.spacing = pco.spacing;
  if (version.upTo("1.5")) {
    root.numPoints = data.hierarchy[0][1];
  } else {
    root.numPoints = 0;
  }
  pco.root = root;
  nodes[name] = root;
  return pco.root.load();
}
function loadRemainingHierarchy(pco, data, nodes) {
  for (let i2 = 1; i2 < data.hierarchy.length; i2++) {
    const [name, numPoints] = data.hierarchy[i2];
    const { index, parentName, level } = parseName(name);
    const parentNode = nodes[parentName];
    const boundingBox = createChildAABB$1(parentNode.boundingBox, index);
    const node = new PointCloudOctreeGeometryNode(name, pco, boundingBox);
    node.level = level;
    node.numPoints = numPoints;
    node.spacing = pco.spacing / Math.pow(2, node.level);
    nodes[name] = node;
    parentNode.addChild(node);
  }
}
function parseName(name) {
  return {
    index: getIndexFromName(name),
    parentName: name.substring(0, name.length - 1),
    level: name.length - 1
  };
}
function isGeometryNode(node) {
  return node !== void 0 && node !== null && node.isGeometryNode;
}
function isTreeNode(node) {
  return node !== void 0 && node !== null && node.isTreeNode;
}
function BinaryHeap(scoreFunction) {
  this.content = [];
  this.scoreFunction = scoreFunction;
}
BinaryHeap.prototype = {
  push: function(element) {
    this.content.push(element);
    this.bubbleUp(this.content.length - 1);
  },
  pop: function() {
    var result = this.content[0];
    var end = this.content.pop();
    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }
    return result;
  },
  remove: function(node) {
    var length = this.content.length;
    for (var i2 = 0; i2 < length; i2++) {
      if (this.content[i2] != node)
        continue;
      var end = this.content.pop();
      if (i2 == length - 1)
        break;
      this.content[i2] = end;
      this.bubbleUp(i2);
      this.sinkDown(i2);
      break;
    }
  },
  size: function() {
    return this.content.length;
  },
  bubbleUp: function(n) {
    var element = this.content[n], score = this.scoreFunction(element);
    while (n > 0) {
      var parentN = Math.floor((n + 1) / 2) - 1, parent = this.content[parentN];
      if (score >= this.scoreFunction(parent))
        break;
      this.content[parentN] = element;
      this.content[n] = parent;
      n = parentN;
    }
  },
  sinkDown: function(n) {
    var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
    while (true) {
      var child2N = (n + 1) * 2, child1N = child2N - 1;
      var swap = null;
      if (child1N < length) {
        var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
        if (child1Score < elemScore)
          swap = child1N;
      }
      if (child2N < length) {
        var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
        if (child2Score < (swap == null ? elemScore : child1Score))
          swap = child2N;
      }
      if (swap == null)
        break;
      this.content[n] = this.content[swap];
      this.content[swap] = element;
      n = swap;
    }
  }
};
class Box3Helper extends LineSegments {
  constructor(box, color = new Color(16776960)) {
    const indices = new Uint16Array([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]);
    const positions = new Float32Array([
      box.min.x,
      box.min.y,
      box.min.z,
      box.max.x,
      box.min.y,
      box.min.z,
      box.max.x,
      box.min.y,
      box.max.z,
      box.min.x,
      box.min.y,
      box.max.z,
      box.min.x,
      box.max.y,
      box.min.z,
      box.max.x,
      box.max.y,
      box.min.z,
      box.max.x,
      box.max.y,
      box.max.z,
      box.min.x,
      box.max.y,
      box.max.z
    ]);
    const geometry = new BufferGeometry();
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({ color });
    super(geometry, material);
  }
}
class LRUItem {
  constructor(node) {
    this.node = node;
    this.next = null;
    this.previous = null;
  }
}
class LRU {
  constructor(pointBudget = 1e6) {
    this.pointBudget = pointBudget;
    this.first = null;
    this.last = null;
    this.numPoints = 0;
    this.items = /* @__PURE__ */ new Map();
  }
  get size() {
    return this.items.size;
  }
  has(node) {
    return this.items.has(node.id);
  }
  touch(node) {
    if (!node.loaded) {
      return;
    }
    const item = this.items.get(node.id);
    if (item) {
      this.touchExisting(item);
    } else {
      this.addNew(node);
    }
  }
  addNew(node) {
    const item = new LRUItem(node);
    item.previous = this.last;
    this.last = item;
    if (item.previous) {
      item.previous.next = item;
    }
    if (!this.first) {
      this.first = item;
    }
    this.items.set(node.id, item);
    this.numPoints += node.numPoints;
  }
  touchExisting(item) {
    if (!item.previous) {
      if (item.next) {
        this.first = item.next;
        this.first.previous = null;
        item.previous = this.last;
        item.next = null;
        this.last = item;
        if (item.previous) {
          item.previous.next = item;
        }
      }
    } else if (!item.next)
      ;
    else {
      item.previous.next = item.next;
      item.next.previous = item.previous;
      item.previous = this.last;
      item.next = null;
      this.last = item;
      if (item.previous) {
        item.previous.next = item;
      }
    }
  }
  remove(node) {
    const item = this.items.get(node.id);
    if (!item) {
      return;
    }
    if (this.items.size === 1) {
      this.first = null;
      this.last = null;
    } else {
      if (!item.previous) {
        this.first = item.next;
        this.first.previous = null;
      }
      if (!item.next) {
        this.last = item.previous;
        this.last.next = null;
      }
      if (item.previous && item.next) {
        item.previous.next = item.next;
        item.next.previous = item.previous;
      }
    }
    this.items.delete(node.id);
    this.numPoints -= node.numPoints;
  }
  getLRUItem() {
    return this.first ? this.first.node : void 0;
  }
  freeMemory() {
    if (this.items.size <= 1) {
      return;
    }
    while (this.numPoints > this.pointBudget * 2) {
      const node = this.getLRUItem();
      if (node) {
        this.disposeSubtree(node);
      }
    }
  }
  disposeSubtree(node) {
    const nodesToDispose = [node];
    node.traverse((n) => {
      if (n.loaded) {
        nodesToDispose.push(n);
      }
    });
    for (const n of nodesToDispose) {
      n.dispose();
      this.remove(n);
    }
  }
}
class QueueItem {
  constructor(pointCloudIndex, weight, node, parent) {
    this.pointCloudIndex = pointCloudIndex;
    this.weight = weight;
    this.node = node;
    this.parent = parent;
  }
}
class Potree {
  constructor() {
    this._pointBudget = DEFAULT_POINT_BUDGET;
    this._rendererSize = new Vector2();
    this.maxNumNodesLoading = MAX_NUM_NODES_LOADING;
    this.features = FEATURES;
    this.lru = new LRU(this._pointBudget);
    this.updateVisibilityStructures = (() => {
      const frustumMatrix = new Matrix4();
      const inverseWorldMatrix = new Matrix4();
      const cameraMatrix = new Matrix4();
      return (pointClouds, camera) => {
        var _a;
        const frustums = [];
        const cameraPositions = [];
        const priorityQueue = new BinaryHeap((x) => 1 / x.weight);
        for (let i2 = 0; i2 < pointClouds.length; i2++) {
          const pointCloud = pointClouds[i2];
          if (!pointCloud.initialized()) {
            continue;
          }
          pointCloud.numVisiblePoints = 0;
          pointCloud.visibleNodes = [];
          pointCloud.visibleGeometry = [];
          camera.updateMatrixWorld(false);
          const inverseViewMatrix = camera.matrixWorldInverse;
          const worldMatrix = pointCloud.matrixWorld;
          frustumMatrix.identity().multiply(camera.projectionMatrix).multiply(inverseViewMatrix).multiply(worldMatrix);
          frustums.push(new Frustum().setFromProjectionMatrix(frustumMatrix));
          inverseWorldMatrix.copy(worldMatrix).invert();
          cameraMatrix.identity().multiply(inverseWorldMatrix).multiply(camera.matrixWorld);
          cameraPositions.push(new Vector3().setFromMatrixPosition(cameraMatrix));
          if (pointCloud.visible && pointCloud.root !== null) {
            const weight = Number.MAX_VALUE;
            priorityQueue.push(new QueueItem(i2, weight, pointCloud.root));
          }
          if (isTreeNode(pointCloud.root)) {
            pointCloud.hideDescendants((_a = pointCloud == null ? void 0 : pointCloud.root) == null ? void 0 : _a.sceneNode);
          }
          for (const boundingBoxNode of pointCloud.boundingBoxNodes) {
            boundingBoxNode.visible = false;
          }
        }
        return { frustums, cameraPositions, priorityQueue };
      };
    })();
  }
  async loadPointCloud(url, getUrl, xhrRequest = (input, init) => fetch(input, init)) {
    if (url === "cloud.js") {
      return await loadPOC(url, getUrl, xhrRequest).then((geometry) => new PointCloudOctree(this, geometry));
    } else if (url === "metadata.json") {
      return await loadOctree(url, getUrl, xhrRequest).then((geometry) => new PointCloudOctree(this, geometry));
    }
    throw new Error("Unsupported file type");
  }
  updatePointClouds(pointClouds, camera, renderer) {
    const result = this.updateVisibility(pointClouds, camera, renderer);
    for (let i2 = 0; i2 < pointClouds.length; i2++) {
      const pointCloud = pointClouds[i2];
      if (pointCloud.disposed) {
        continue;
      }
      pointCloud.material.updateMaterial(pointCloud, pointCloud.visibleNodes, camera, renderer);
      pointCloud.updateVisibleBounds();
      pointCloud.updateBoundingBoxes();
    }
    this.lru.freeMemory();
    return result;
  }
  static pick(pointClouds, renderer, camera, ray, params = {}) {
    Potree.picker = Potree.picker || new PointCloudOctreePicker();
    return Potree.picker.pick(renderer, camera, ray, pointClouds, params);
  }
  get pointBudget() {
    return this._pointBudget;
  }
  set pointBudget(value) {
    if (value !== this._pointBudget) {
      this._pointBudget = value;
      this.lru.pointBudget = value;
      this.lru.freeMemory();
    }
  }
  updateVisibility(pointClouds, camera, renderer) {
    let numVisiblePoints = 0;
    const visibleNodes = [];
    const unloadedGeometry = [];
    const { frustums, cameraPositions, priorityQueue } = this.updateVisibilityStructures(pointClouds, camera);
    let loadedToGPUThisFrame = 0;
    let exceededMaxLoadsToGPU = false;
    let nodeLoadFailed = false;
    let queueItem;
    while ((queueItem = priorityQueue.pop()) !== void 0) {
      let node = queueItem.node;
      if (numVisiblePoints + node.numPoints > this.pointBudget) {
        break;
      }
      const pointCloudIndex = queueItem.pointCloudIndex;
      const pointCloud = pointClouds[pointCloudIndex];
      const maxLevel = pointCloud.maxLevel !== void 0 ? pointCloud.maxLevel : Infinity;
      if (node.level > maxLevel || !frustums[pointCloudIndex].intersectsBox(node.boundingBox) || this.shouldClip(pointCloud, node.boundingBox)) {
        continue;
      }
      numVisiblePoints += node.numPoints;
      pointCloud.numVisiblePoints += node.numPoints;
      const parentNode = queueItem.parent;
      if (isGeometryNode(node) && (!parentNode || isTreeNode(parentNode))) {
        if (node.loaded && loadedToGPUThisFrame < MAX_LOADS_TO_GPU) {
          node = pointCloud.toTreeNode(node, parentNode);
          loadedToGPUThisFrame++;
        } else if (!node.failed) {
          if (node.loaded && loadedToGPUThisFrame >= MAX_LOADS_TO_GPU) {
            exceededMaxLoadsToGPU = true;
          }
          unloadedGeometry.push(node);
          pointCloud.visibleGeometry.push(node);
        } else {
          nodeLoadFailed = true;
          continue;
        }
      }
      if (isTreeNode(node)) {
        this.updateTreeNodeVisibility(pointCloud, node, visibleNodes);
        pointCloud.visibleGeometry.push(node.geometryNode);
      }
      const halfHeight = 0.5 * renderer.getSize(this._rendererSize).height * renderer.getPixelRatio();
      this.updateChildVisibility(queueItem, priorityQueue, pointCloud, node, cameraPositions[pointCloudIndex], camera, halfHeight);
    }
    const numNodesToLoad = Math.min(this.maxNumNodesLoading, unloadedGeometry.length);
    const nodeLoadPromises = [];
    for (let i2 = 0; i2 < numNodesToLoad; i2++) {
      nodeLoadPromises.push(unloadedGeometry[i2].load());
    }
    return {
      visibleNodes,
      numVisiblePoints,
      exceededMaxLoadsToGPU,
      nodeLoadFailed,
      nodeLoadPromises
    };
  }
  updateTreeNodeVisibility(pointCloud, node, visibleNodes) {
    this.lru.touch(node.geometryNode);
    const sceneNode = node.sceneNode;
    sceneNode.visible = true;
    sceneNode.material = pointCloud.material;
    sceneNode.updateMatrix();
    sceneNode.matrixWorld.multiplyMatrices(pointCloud.matrixWorld, sceneNode.matrix);
    visibleNodes.push(node);
    pointCloud.visibleNodes.push(node);
    this.updateBoundingBoxVisibility(pointCloud, node);
  }
  updateChildVisibility(queueItem, priorityQueue, pointCloud, node, cameraPosition, camera, halfHeight) {
    const children = node.children;
    for (let i2 = 0; i2 < children.length; i2++) {
      const child = children[i2];
      if (child === null) {
        continue;
      }
      const sphere = child.boundingSphere;
      const distance = sphere.center.distanceTo(cameraPosition);
      const radius = sphere.radius;
      let projectionFactor = 0;
      if (camera.type === PERSPECTIVE_CAMERA) {
        const perspective = camera;
        const fov = perspective.fov * Math.PI / 180;
        const slope = Math.tan(fov / 2);
        projectionFactor = halfHeight / (slope * distance);
      } else {
        const orthographic = camera;
        projectionFactor = 2 * halfHeight / (orthographic.top - orthographic.bottom);
      }
      const screenPixelRadius = radius * projectionFactor;
      if (screenPixelRadius < pointCloud.minNodePixelSize) {
        continue;
      }
      const weight = distance < radius ? Number.MAX_VALUE : screenPixelRadius + 1 / distance;
      priorityQueue.push(new QueueItem(queueItem.pointCloudIndex, weight, child, node));
    }
  }
  updateBoundingBoxVisibility(pointCloud, node) {
    if (pointCloud.showBoundingBox && !node.boundingBoxNode) {
      const boxHelper = new Box3Helper(node.boundingBox);
      boxHelper.matrixAutoUpdate = false;
      pointCloud.boundingBoxNodes.push(boxHelper);
      node.boundingBoxNode = boxHelper;
      node.boundingBoxNode.matrix.copy(pointCloud.matrixWorld);
    } else if (pointCloud.showBoundingBox && node.boundingBoxNode) {
      node.boundingBoxNode.visible = true;
      node.boundingBoxNode.matrix.copy(pointCloud.matrixWorld);
    } else if (!pointCloud.showBoundingBox && node.boundingBoxNode) {
      node.boundingBoxNode.visible = false;
    }
  }
  shouldClip(pointCloud, boundingBox) {
    const material = pointCloud.material;
    if (material.numClipBoxes === 0 || material.clipMode !== ClipMode.CLIP_OUTSIDE) {
      return false;
    }
    const box2 = boundingBox.clone();
    pointCloud.updateMatrixWorld(true);
    box2.applyMatrix4(pointCloud.matrixWorld);
    const clipBoxes = material.clipBoxes;
    for (let i2 = 0; i2 < clipBoxes.length; i2++) {
      const clipMatrixWorld = clipBoxes[i2].matrix;
      const clipBoxWorld = new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5)).applyMatrix4(clipMatrixWorld);
      if (box2.intersectsBox(clipBoxWorld)) {
        return false;
      }
    }
    return true;
  }
}
export { PointCloudOctree, Potree, QueueItem, Version };
