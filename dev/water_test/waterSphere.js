function initScene() {
    const init = {};
    init.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    init.renderer.setPixelRatio(window.devicePixelRatio);
    init.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(init.renderer.domElement);

    init.scene = new THREE.Scene();
    
    var frustumSize = 10;
    var aspect = window.innerWidth / window.innerHeight;
    init.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 2000);
    init.camera.position.z = 10;    
    

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    init.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 3, 5);
    init.scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize(init.camera, init.renderer), false);

    return init;
}

function watergenerate(init,{r = 1, color = 0x63caca, x = 0, y = 0, z = 0, animation = true, velocity = 1, distortion = 1}) {
    console.log({init, r, color,  x, y, z, animation});
    const waterMaterial = WaterEffects.createWaterMaterial(color);
    const waterGeometry = new THREE.SphereGeometry(r, 64, 64);
    const center = new THREE.Vector3(x, y, z);
    WaterEffects.addDistortion(waterGeometry, 0.03 * distortion, 0.01);
    WaterEffects.renderShape(init.scene, waterGeometry, waterMaterial, center, animation, velocity);
}

function animate(init) {
    init.renderer.setAnimationLoop(() => {
      // scene.traverseはシーン内の全オブジェクトをループする
      init.scene.traverse(function (object) {
        if (object.isMesh && object.userData.animation) {
          // オブジェクトに.userData.animateがtrueと設定されている場合にのみ回転させる
          object.rotation.x += 0.003 * object.userData.velocity;
          object.rotation.y += 0.003 * object.userData.velocity;
        }
      });
      
      // シーンとカメラを使って画面を描画する
      init.renderer.render(init.scene, init.camera);
    });
  }
  


function onWindowResize(camera, renderer) {
    return function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

const WaterEffects = {
    addDistortion: function (geometry, distortion, smoothness) {
        const positions = geometry.attributes.position;
        const vertexDistortions = [];
        const isSphere = geometry.type === 'SphereGeometry'; // ジオメトリが球かどうかのチェック
        const radius = isSphere ? geometry.parameters.radius : 0; // 球の場合は半径を取得
    
        // 各頂点に対する歪みの大きさを事前に計算
        for (let i = 0; i < positions.count; i++) {
            vertexDistortions.push({
                x: (Math.random() - 0.5) * distortion,
                y: (Math.random() - 0.5) * distortion,
                z: (Math.random() - 0.5) * distortion * 3,
            });
        }
    
        // 各頂点の歪みを滑らかに適用
        for (let i = 0; i < positions.count; i++) {
            let distortionScale = 1;
    
            // 球体の場合、極に近づくにつれて歪みを減らす
            if (isSphere) {
                const py = positions.getY(i);
                distortionScale = 1 - Math.abs(py / radius);
            }
    
            let avgX = vertexDistortions[i].x * distortionScale;
            let avgY = vertexDistortions[i].y * distortionScale;
            let avgZ = vertexDistortions[i].z * distortionScale;
            let num = 1;
    
            for (let j = 0; j < positions.count; j++) {
                if (i !== j && distance(positions.getX(i), positions.getY(i), positions.getZ(i),
                                        positions.getX(j), positions.getY(j), positions.getZ(j)) < smoothness) {
                    // 球体の場合、平均化する際にも歪みのスケールを適用
                    const scale = isSphere ? 1 - Math.abs(positions.getY(j) / radius) : 1;
                    avgX += vertexDistortions[j].x * scale;
                    avgY += vertexDistortions[j].y * scale;
                    avgZ += vertexDistortions[j].z * scale;
                    num++;
                }
            }
    
            avgX /= num;
            avgY /= num;
            avgZ /= num;
    
            positions.setXYZ(i, positions.getX(i) + avgX, positions.getY(i) + avgY, positions.getZ(i) + avgZ);
        }
    
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
    },
  
    renderShape: function (scene, geometry, material, center, animation, velocity) {
        const shape = new THREE.Mesh(geometry, material);
        shape.userData.animation = animation;
        shape.userData.velocity = velocity;
        // 形状の中心座標を設定
        shape.position.set(center.x, center.y, center.z);
        scene.add(shape);
        return shape;
    },
  
    createWaterMaterial: function (color, opacity = 0.8, roghness = 0, transmission = 0.7) {
        return new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            roughness: roghness,
            metalness: 0,
            reflectivity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0,
            transmission: transmission,
            depthWrite: false,
            ior: 1.33
        });
    }
  };

// 二点間の距離を計算する関数
function distance(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export { initScene, animate, watergenerate };