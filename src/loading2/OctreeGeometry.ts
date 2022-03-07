import { IPotree } from './../types';
import { NodeLoader, Metadata } from './OctreeLoader';

// import * as THREE from "../../../../libs/three.js/build/three.module.js";
import { Box3,Sphere, Vector3 } from "three";
import { PointAttributes } from "./PointAttributes";

export class OctreeGeometry{
	root!: OctreeGeometryNode;
	url: string | null = null;
	pointAttributes: PointAttributes | null = null;
	spacing: number = 0;
	tightBoundingBox: Box3;
	numNodesLoading: number = 0;
	boundingSphere: Sphere;
	tightBoundingSphere: Sphere;
	offset!: Vector3;
	scale!: [number, number, number];

	projection?: Metadata["projection"];
	constructor(
		public loader: NodeLoader,
		public boundingBox: Box3, // Need to be get from metadata.json
	){
		this.tightBoundingBox = this.boundingBox.clone();
		this.boundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
		this.tightBoundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
	}

};

export class OctreeGeometryNode{

	constructor(public name:string, public octreeGeometry:OctreeGeometry, public boundingBox:Box3){
		this.id = OctreeGeometryNode.IDCount++;
		this.index = parseInt(name.charAt(name.length - 1));
		this.boundingSphere = boundingBox.getBoundingSphere(new Sphere());
		this.children = {};
		this.numPoints = 0;
		this.level = null;
		this.oneTimeDisposeHandlers = [];
	}

	loaded: boolean = false;
	loading: boolean = false;
	parent: OctreeGeometryNode | null = null;
	geometry: THREE.BufferGeometry | null = null;
	nodeType?: number;
	byteOffset?: bigint ;
	byteSize?: bigint;
	hierarchyByteOffset?: bigint;
	hierarchyByteSize?: bigint;
	hasChildren: boolean = false;
	spacing?: number;
	density?: number;

	// create static IDCount variable
	static IDCount = 0;

	id: number;
	index: number;
	boundingSphere: Sphere;
	children: Record<string, OctreeGeometryNode>;
	numPoints: number;
	level: number | null;
	oneTimeDisposeHandlers: Function[];

	isGeometryNode(){
		return true;
	}

	getLevel(){
		return this.level;
	}

	isTreeNode(){
		return false;
	}

	isLoaded(){
		return this.loaded;
	}

	getBoundingSphere(){
		return this.boundingSphere;
	}

	getChildren(){
		let children = [];

		for (let i = 0; i < 8; i++) {
			if (this.children[i]) {
				children.push(this.children[i]);
			}
		}

		return children;
	}

	getBoundingBox(){
		return this.boundingBox;
	}

	load(potreeInstance:IPotree){

		if (this.octreeGeometry.numNodesLoading >= potreeInstance.maxNumNodesLoading) {
			return;
		}

		if (this.octreeGeometry.loader) {
			this.octreeGeometry.loader.load(this);
		}
	}

	getNumPoints(){
		return this.numPoints;
	}

	dispose(){
		if (this.geometry && this.parent != null) {
			this.geometry.dispose();
			this.geometry = null;
			this.loaded = false;

			// this.dispatchEvent( { type: 'dispose' } );
			for (let i = 0; i < this.oneTimeDisposeHandlers.length; i++) {
				let handler = this.oneTimeDisposeHandlers[i];
				handler();
			}
			this.oneTimeDisposeHandlers = [];
		}
	}

};

OctreeGeometryNode.IDCount = 0;