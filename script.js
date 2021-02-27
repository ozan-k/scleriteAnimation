import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import {OBJLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/OBJLoader.js';

let camera, controls, scene, renderer;
let input = document.querySelector('input');

let i,j;
let plot_scale = 4;
let current = 0;
let plot_events = getEvents(this_sim);
let event;

main();
setTimeout(()=> { 
  requestAnimationFrame(render);
  // drawStatic();   
},600);

window.addEventListener( 'resize', onWindowResize );

// =====================================================

input.addEventListener('change', () => {
  let files = input.files;
  if (files.length == 0) return;
  
  const file = files[0];
  let i;
  let reader = new FileReader();
  
  reader.onload = (e) => {
    const file = e.target.result;
    let sim = file.split(";\n");
    let sim_lines = [];
    for (i = 0; i < sim.length; i++) {
        sim_lines.push(sim[i].split(" , "));
    }
    let events = getEvents(sim_lines);
    for (i = 0;i < events.length;i++){
        console.log(events[i])
      }
  };
  reader.onerror = (e) => alert(e.target.error.name);
  reader.readAsText(file); 
});

// =====================================================
// =====================================================
// =====================================================

function main() {
    {
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );
    scene.add( new THREE.GridHelper( 400, 10 ) );
    }

    {
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );				
    }

    {
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect,near, far);
    camera.position.set( 0,70, 300);
    }

    {
      const dirLight1 = new THREE.DirectionalLight( 0xffffff );
      dirLight1.position.set( 1, 1, 1 );
      scene.add( dirLight1 );

      const dirLight2 = new THREE.DirectionalLight( 0x002288 );
      dirLight2.position.set( - 1, - 1, - 1 );
      scene.add( dirLight2 );

      const ambientLight = new THREE.AmbientLight( 0x222222 );
      scene.add( ambientLight );  
      
      // const light = new THREE.AmbientLight(  0x404040,2.5 ); // soft white light
      // scene.add( light );
      // console.log("BBB",String(light.type));
    }

    const loader = new OBJLoader();
    loader.load( 'sclerite.obj', function( sclerite ) {
      let sclerite_material = new THREE.MeshBasicMaterial( { color: 0xffffff * Math.random() } );
      sclerite.scale.set(0.015,0.015,0.015);
      sclerite.name = "sclerite_template";
      sclerite.material = sclerite_material;
      scene.add( sclerite );
      sclerite.position.y =  -10000;
      // let o1 = scene.getObjectByName("sclerite_temp")
      // console.log(1,o1);
    })

    const polyp_geometry = new THREE.CylinderGeometry( 3.0, 6, 12, 4, 1 );
    const polyp_material = new THREE.MeshPhongMaterial( { color: 0xFF8133 } );
    const polyp_mesh_master = new THREE.Mesh( polyp_geometry, polyp_material );
    polyp_mesh_master.scale.set(2,2,2); 
    polyp_mesh_master.name = "polyp_template";
    polyp_mesh_master.position.x = 10000; 
    scene.add(polyp_mesh_master);

    // controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.listenToKeyEvents( window ); // optional
}

// =====================================================
// =====================================================
// =====================================================
// =====================================================

// requestAnimationFrame passes the time since the page loaded to our function. 
// That time is passed in milliseconds. I find it's much easier to work with seconds 
// so here we're converting that to seconds.

function render(time) {
  time *= 1;  // convert unit of time to 1000*0.001 of a second
  scene.rotation.y = time/10000;
  // event = plot_events.shift();
  // doEvent(event);
  while(current < time)
  {
    event = plot_events.shift();
    doEvent(event);
    // console.log(current,time,event);
    current = event[1];
  }
  // 
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

// =====================================================
// =====================================================
// =====================================================
// =====================================================

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

// =====================================================
// =====================================================
// =====================================================

function doEvent(event){
  let type,x1,y1,z1,x2,y2,z2;
  type = event[0];
  // time = event[1];
  x1 = event[2][0];
  y1 = event[2][1];
  z1 = event[2][2];
  x2 = event[3][0];
  y2 = event[3][1];
  z2 = event[3][2];
  switch (type)
  { // ---------------------
    // 1 -> (* diffusion  *) 
    case "1" :
    moveObject(x1,y1,z1,x2,y2,z2); 
    break;
    // ---------------------
    // 2 -> (*  budding   *) 
    case "2" :
    let polyp_template = scene.getObjectByName("polyp_template");
    drawObject(x2,y2,z2,polyp_template,false); 
    break;
    // ---------------------
    // 3 -> (* deposition *)
    case "3" :
    let sclerite_template = scene.getObjectByName("sclerite_template");
    drawObject(x2,y2,z2,sclerite_template,true); 
    break;  
  } // ---------------------
}

// =====================================================

function drawStatic()
  {
    for (i = 0;i < plot_events.length;i++){
      event = plot_events[i];
      doEvent(event);
    }
  }

// =====================================================

function drawObject(x,y,z,object_mesh,wobble){
  let clone_mesh = object_mesh.clone();
  clone_mesh.name = String(x) + "_" + String(y) + "_" + String(z); 
  clone_mesh.position.x = (x-50)*plot_scale;
  clone_mesh.position.z = (y-50)*plot_scale;
  clone_mesh.position.y = z*plot_scale;
  if (wobble){
    clone_mesh.rotation.set(Math.PI*Math.random(),Math.PI*Math.random(),Math.PI*Math.random());
  }
  scene.add( clone_mesh );
}

// =====================================================

function moveObject(x,y,z,new_x,new_y,new_z){
  let obj = scene.getObjectByName(String(x) + "_" + String(y) + "_" + String(z));
  obj.name = String(new_x) + "_" + String(new_y) + "_" + String(new_z);
  obj.position.x = (new_x-50)*plot_scale;
  obj.position.z = (new_y-50)*plot_scale;
  obj.position.y = new_z*plot_scale;
  obj.rotation.set(Math.PI*Math.random(),Math.PI*Math.random(),Math.PI*Math.random());
}
  
// =====================================================

function getEvents(simulation){
  let matrix = createMatrix();
  let time, event, x1,y1,z1,x2,y2,z2;
  let events = [];
  for (i = 0;i < simulation.length;i++){
    event = simulation[i];
    time = parseInt(1000*parseFloat(event[0]));
    x1 = event[2];
    y1 = event[3];
    x2 = event[4];
    y2 = event[5];
    // console.log(event[1],time,x1,y1,x2,y2);
    switch (event[1])
    {
      // 1 -> (* diffusion  *) 
      case "1" :
      // console.log(event[0],"diffusion");
      z1 = matrix[x1][y1][0];
      matrix[x1][y1][0]--;
      matrix[x2][y2][0]++
      z2 = matrix[x2][y2][0];
      events.push(["1",time,[x1,y1,z1],[x2,y2,z2]]);
      break;
      // 2 -> (*  budding   *) 
      case "2" : 
      // console.log(event[0],"budding");
      matrix[x2][y2][1] = 1;
      events.push(["2",time,[0,0,0],[x2,y2,0]]);
      break;
      // 3 -> (* deposition *)
      case "3": 
      // console.log(event[0],"deposition");
      matrix[x2][y2][0]++;
      z2 = matrix[x2][y2][0];
      events.push(["3",time,[0,0,0],[x2,y2,z2]]);
      break;
    }
  }
  return events;
}

// =====================================================
      
function createMatrix (){
  let row; 
  let mat = [];
  for (i = 0;i <= 100;i++){
    row = [];
    for (j = 0;j <= 100;j++){
      row.push([0,0])
    };
    mat.push(row)
  }
  return mat
}


// =====================================================
// =====================================================

function removeAll(){
  let obj,i;
  for (i = scene.children.length - 1; i >= 0; i--) { 
    obj = scene.children[i];
    if (obj.type == "MeshBasicMaterial"){
      scene.remove(obj);
    }
    
  }
}

// =====================================================

