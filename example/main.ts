import { Vector3 } from 'three';
import { PointCloudOctree } from '../src';
import { Viewer } from './viewer';

require('./main.css');

const targetEl = document.createElement('div');
targetEl.className = 'container';
document.body.appendChild(targetEl);

const viewer = new Viewer();
viewer.initialize(targetEl);
const camera = viewer.camera;
camera.far = 1000;
camera.updateProjectionMatrix();
camera.position.set(0, 0, 10);
camera.lookAt(new Vector3());

let pointCloud: PointCloudOctree | undefined;
let loaded: boolean = false;

const unloadBtn = document.createElement('button');
unloadBtn.textContent = 'Unload';
unloadBtn.addEventListener('click', () => {
  if (!loaded) {
    return;
  }

  viewer.unload();
  loaded = false;
  pointCloud = undefined;
});

viewer
.load(
  'cloud.js',
  'http://localhost:8080/BigShotCleanV1/',
)
.then(pco => {
  pointCloud = pco;
  pointCloud.material.size = 1.0;
  pointCloud.position.set(-4, -2, 1)
  pointCloud.scale.set(.1, .1, .1);

  viewer.add(pco);
})
.catch(err => console.error(err));

viewer
.load(
  'metadata.json',
  'http://localhost:8080/BigShotCleanV2/',
)
.then(pco => {
  pointCloud = pco;
  pointCloud.material.size = 1.0;
  pointCloud.material.shape = 2;
  pointCloud.position.set(0, -2, 1)
  pointCloud.scale.set(.1, .1, .1);
  viewer.add(pco);
})
.catch(err => console.error(err));

