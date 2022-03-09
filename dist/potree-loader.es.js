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
var WorkerType = /* @__PURE__ */ ((WorkerType2) => {
  WorkerType2["DECODER_WORKER_BROTLI"] = "DECODER_WORKER_BROTLI";
  WorkerType2["DECODER_WORKER"] = "DECODER_WORKER";
  return WorkerType2;
})(WorkerType || {});
function createWorker(type) {
  switch (type) {
    case "DECODER_WORKER_BROTLI": {
      return new Worker("/assets/brotli-decoder.worker.dad1d98a.js", { type: "module" });
    }
    case "DECODER_WORKER": {
      return new Worker("/assets/decoder.worker.942d0cda.js", { type: "module" });
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
    return new Worker("/assets/binary-decoder.worker.dad39f76.js", { type: "module" });
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
