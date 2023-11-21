// 必要なモジュールを読み込み
// import { gsap } from "gsap";
import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";

// DOM がパースされたことを検出するイベントで App3 クラスを初期化
window.addEventListener(
  "DOMContentLoaded",
  () => {
    const app = new App3();
    app.load().then(() => {
      app.init();
      app.render();
    });
  },
  false
);

class App3 {
  /**
   * カメラで撮影する範囲を表す定数
   */
  static get CAMERA_SCALE() {
    return 1.0;
  }
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    // 平行投影（正射影）変換用のパラメータを計算する
    const aspect = window.innerWidth / window.innerHeight; // アスペクト比
    const scale = App3.CAMERA_SCALE; // 切り取る空間の広さ（スケール）
    const horizontal = scale * aspect; // 横方向のスケール
    const vertiacal = scale; // 縦方向のスケール
    return {
      left: -horizontal, // 切り取る空間の左端
      right: horizontal, // 切り取る空間の右端
      top: vertiacal, // 切り取る空間の上端
      bottom: -vertiacal, // 切り取る空間の下端
      near: 0.1,
      far: 50.0,
      x: 0.0,
      y: 5.0,
      z: 20.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xe3d7bf,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer; // レンダラ
    this.scene; // シーン
    this.camera; // カメラ
    this.texture = []; // テクスチャ
    this.geometry;
    this.planeArray = [];
    this.materialArray = [];
    this.material;
    this.mesh;
    this.update = function (time) {
      this.material.uniforms.time.value = time;
    };

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // OrthographicCamera 用のパラメータを求める
        const aspect = window.innerWidth / window.innerHeight;
        const scale = App3.CAMERA_SCALE;
        const horizontal = scale * aspect;
        const vertiacal = scale;
        this.camera.left = -horizontal;
        this.camera.right = horizontal;
        this.camera.top = vertiacal;
        this.camera.bottom = -vertiacal;
        this.camera.updateProjectionMatrix();
      },
      false
    );

    const eyeRef1 = document.querySelector(".eye1");
    const eyeRef2 = document.querySelector(".eye2");
    window.addEventListener("mousemove", eyeball);

    function eyeball() {
      let x = eyeRef1.getBoundingClientRect().left + eyeRef1.clientWidth / 2;
      let y = eyeRef1.getBoundingClientRect().top + eyeRef1.clientHeight / 2;
      let radian = Math.atan2(event.pageX - x, event.pageY - y);
      let rot = radian * (180 / Math.PI) * -1 + 270;
      eyeRef1.style.rotate = rot + "deg";

      let x2 = eyeRef2.getBoundingClientRect().left + eyeRef2.clientWidth / 2;
      let y2 = eyeRef2.getBoundingClientRect().top + eyeRef2.clientHeight / 2;
      let radian2 = Math.atan2(event.pageX - x2, event.pageY - y2);
      let rot2 = radian2 * (180 / Math.PI) * -1 + 270;
      eyeRef2.style.rotate = rot2 + "deg";
    }
  }

  /**
   * アセット（素材）のロードを行う Promise
   */
  load() {
    const loader = new THREE.TextureLoader();
    const imagePath = ["./gradation.png", "./dust.png"];
    return new Promise((resolve) => {
      imagePath.forEach((img, index) => {
        loader.load(img, (texture) => {
          // this.texture.push(texture);
          this.texture[index] = texture;
          //テクスチャが画像の枚数と一致していれば解決
          this.texture.length === imagePath.length ? resolve() : "";
        });
      });
    });
  }

  /**
   * 初期化処理
   */
  init() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    const wrapper = document.querySelector("#webgl");
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.OrthographicCamera(
      App3.CAMERA_PARAM.left,
      App3.CAMERA_PARAM.right,
      App3.CAMERA_PARAM.top,
      App3.CAMERA_PARAM.bottom,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    function loadFile(url, data) {
      var request = new XMLHttpRequest();
      request.open("GET", url, false);

      request.send(null);

      // リクエストが完了したとき
      if (request.readyState == 4) {
        // Http status 200 (成功)
        if (request.status == 200) {
          return request.responseText;
        } else {
          // 失敗
          console.log("error");
          return null;
        }
      }
    }

    this.geometry = new THREE.PlaneGeometry(1.5, 1.5);
    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        texture: { value: this.texture[0] },
        dustTex: { value: this.texture[1] },
        time: { value: 0.0 },
      },
      vertexShader: loadFile("./shader2.vert"),
      fragmentShader: loadFile("./shader2.frag"),
      transparent: true,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);
    // timeを更新
    const time = performance.now() * 0.001;
    this.update(time);
    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
