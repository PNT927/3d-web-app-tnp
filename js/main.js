let scene, camera, renderer, controls;
let clock, mixer;
let actions = [];

let loadedModel;
let mode = "auto";
let isWireframe = false;
let isRotating = true;

let params;
let lights;

let listener;
let openSound;
let crushSound;
let bottleSound;

let currentModelName = "coke";

const viewer = document.getElementById("viewer");
const loader = new THREE.GLTFLoader();

const modelInfo = {
  coke: {
    path: "assets/models/coke/coke.glb",
    title: "Coke Model",
    description:
      `Coca-Cola, or Coke, is a cola soft drink manufactured by the Coca-Cola Company. In 2013, Coke products were sold in over 200 countries and territories worldwide, with consumers drinking more than 1.8 billion company beverage servings each day. Coca-Cola ranked No. 94 in the 2024 Fortune 500 list of the largest United States corporations by revenue. Based on Interbrand's "best global brand" study of 2023, Coca-Cola was the world's sixth most valuable brand.`,
    model_description:
      "Custom Coke can model created in Blender with textures, animation and lighting controls."
  },

  fanta: {
    path: "assets/models/fanta/fanta.glb",
    title: "Fanta Model",
    description:
      `Fanta is an American-owned brand of fruit-flavoured carbonated soft drinks created by Coca-Cola Deutschland under the leadership of German businessman Max Keith. There are over 200 flavours worldwide. Fanta originated in Germany in 1940 due to trade restrictions affecting Coca-Cola ingredient imports. The modern orange-flavoured version was later developed in Italy in 1955.`,
    model_description:
      "Custom Fanta can model created in Blender with branded textures and animation support."
  },

  sprite: {
    path: "assets/models/sprite/sprite.glb",
    title: "Sprite Model",
    description:
      `Sprite is a clear lemon-lime flavoured soft drink created by the Coca-Cola Company. Sprite was developed primarily to compete against PepsiCo's 7 Up and has since expanded into multiple flavour variations worldwide.`,
    model_description:
      "Custom Sprite can model created in Blender using modified geometry and branded textures."
  }
};

function updateModelText(selectedModel) {
  document.getElementById("model-title").innerText =
    selectedModel.title;

  document.getElementById("model-description").innerHTML = `
    <p>${selectedModel.description}</p>
    <p>${selectedModel.model_description}</p>
  `;
}

function init() {
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    60,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
  );

  camera.position.set(35, 10, 25);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.setSize(
    viewer.clientWidth,
    viewer.clientHeight
  );

  viewer.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;

  controls.target.set(0, 0, 0);

  controls.update();

  listener = new THREE.AudioListener();

  camera.add(listener);

  openSound = new THREE.Audio(listener);

  crushSound = new THREE.Audio(listener);

  bottleSound = new THREE.Audio(listener);

  const audioLoader = new THREE.AudioLoader();

  audioLoader.load(
    "audio/can_opening_edited.mp3",

    function(buffer) {
      openSound.setBuffer(buffer);
      openSound.setLoop(false);
      openSound.setVolume(1.0);
    }
  );

  audioLoader.load(
    "audio/Can crush.mp3",

    function(buffer) {
      crushSound.setBuffer(buffer);
      crushSound.setLoop(false);
      crushSound.setVolume(1.0);
    }
  );

  audioLoader.load(
    "audio/bottle_sprite.mp3",

    function(buffer) {
      bottleSound.setBuffer(buffer);
      bottleSound.setLoop(false);
      bottleSound.setVolume(1.0);
    }
  );

  setupLights();

  loadModel("coke");

  window.addEventListener(
    "resize",
    onResize,
    false
  );

  animate();
}

function setupLights() {
  lights = {};

  lights.ambient = new THREE.AmbientLight(
    0xffffff,
    1.2
  );

  scene.add(lights.ambient);

  lights.directional = new THREE.DirectionalLight(
    0xffffff,
    2
  );

  lights.directional.position.set(5, 10, 5);

  lights.directional.name = "mainLight";

  scene.add(lights.directional);

  params = {
    lightEnabled: true
  };
}

function loadModel(modelName) {
  const selectedModel = modelInfo[modelName];

  currentModelName = modelName;

  if (!selectedModel) {
    console.error(
      "Model not found:",
      modelName
    );

    return;
  }

  if (loadedModel) {
    scene.remove(loadedModel);
  }

  mixer = null;

  actions = [];

  loader.load(
    selectedModel.path,

    function(gltf) {
      loadedModel = gltf.scene;

      applyModelSettings(modelName);

      controls.target.set(0, 0, 0);

      controls.update();

      scene.add(loadedModel);

      setupAnimations(gltf);

      updateModelText(selectedModel);
    },

    undefined,

    function(error) {
      console.error(
        "Error loading model:",
        error
      );
    }
  );
}

function applyModelSettings(modelName) {
  if (modelName === "coke") {
    loadedModel.position.set(0, -1.2, 0);

    loadedModel.scale.set(2, 2, 2);

    camera.position.set(35, 10, 25);
  }

  if (modelName === "fanta") {
    loadedModel.position.set(0, -1.2, 0);

    loadedModel.scale.set(1.5, 1.5, 1.5);

    camera.position.set(35, 10, 25);
  }

  if (modelName === "sprite") {
    loadedModel.position.set(0, -0.8, 0);

    loadedModel.scale.set(2.2, 2.2, 2.2);

    camera.position.set(10, 2, 8);
  }
}

function setupAnimations(gltf) {
  if (
    gltf.animations &&
    gltf.animations.length > 0
  ) {

    mixer = new THREE.AnimationMixer(
      loadedModel
    );

    gltf.animations.forEach((clip) => {

      const action =
        mixer.clipAction(clip);

      action.setLoop(
        THREE.LoopRepeat
      );

      actions.push(action);

      action.play();
    });

    console.log(
      "Animations loaded:",
      gltf.animations.length
    );

  } else {

    console.log(
      "No animations found in this model."
    );
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }

  if (
    loadedModel &&
    isRotating
  ) {

    loadedModel.rotation.y += 0.01;
  }

  controls.update();

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect =
    viewer.clientWidth /
    viewer.clientHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    viewer.clientWidth,
    viewer.clientHeight
  );
}

function startRotation() {
  isRotating = true;

  mode = "auto";

  actions.forEach((action) => {

    action.reset();

    action.play();
  });

  if (currentModelName === "fanta") {

    if (crushSound && crushSound.buffer) {

      if (crushSound.isPlaying)
        crushSound.stop();

      crushSound.play();
    }

  } else if (currentModelName === "sprite") {

    if (bottleSound && bottleSound.buffer) {

      if (bottleSound.isPlaying)
        bottleSound.stop();

      bottleSound.play();
    }

  } else {

    if (openSound && openSound.buffer) {

      if (openSound.isPlaying)
        openSound.stop();

      openSound.play();
    }
  }
}

function stopRotation() {
  isRotating = false;

  mode = "stopped";

  actions.forEach((action) => {
    action.stop();
  });
}

function toggleWireframe() {
  isWireframe = !isWireframe;

  scene.traverse(function(object) {

    if (object.isMesh) {

      object.material.wireframe =
        isWireframe;
    }
  });
}

function toggleLight() {
  const lightSwitch =
    document.getElementById("lightSwitch");

  const lightText =
    document.getElementById("lightText");

  params.lightEnabled =
    !params.lightEnabled;

  lights.directional.visible =
    params.lightEnabled;

  if (lightSwitch && lightText) {

    if (params.lightEnabled) {

      lightSwitch.classList.remove("off");

      lightSwitch.classList.add("on");

      lightText.innerText =
        "Light On";

    } else {

      lightSwitch.classList.remove("on");

      lightSwitch.classList.add("off");

      lightText.innerText =
        "Light Off";
    }
  }
}

function resetCamera() {
  camera.position.set(35, 10, 25);

  controls.target.set(0, 0, 0);

  controls.update();
}

init();