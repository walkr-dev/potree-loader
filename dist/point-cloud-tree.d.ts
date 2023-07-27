import { Object3D } from '../node_modules/three';
import { IPointCloudTreeNode } from './types';
export declare class PointCloudTree extends Object3D {
    root: IPointCloudTreeNode | null;
    initialized(): boolean;
}
