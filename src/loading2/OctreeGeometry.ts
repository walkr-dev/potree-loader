import { IPointCloudTreeNode, IPotree } from './../types';
import { NodeLoader, Metadata } from './OctreeLoader';

// import * as THREE from "../../../../libs/three.js/build/three.module.js";
import { Box3,Sphere, Vector3 } from "three";
import { PointAttributes } from "./PointAttributes";
import { OctreeGeometryNode } from './OctreeGeometryNode';

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
	disposed: boolean = false;

	projection?: Metadata["projection"];
	constructor(
		public loader: NodeLoader,
		public boundingBox: Box3, // Need to be get from metadata.json
	){
		this.tightBoundingBox = this.boundingBox.clone();
		this.boundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
		this.tightBoundingSphere = this.boundingBox.getBoundingSphere(new Sphere());
	}

	dispose(): void {
		// this.loader.dispose();
		this.root.traverse(node => node.dispose());
		this.disposed = true;
	}

};