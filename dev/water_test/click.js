document.addEventListener('click', onMouseClick, false);

function onMouseClick(event) {
    // クリックされた画面上の位置を正規化
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    // レイキャスターを作成し、マウス位置からレイを飛ばす
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, init.camera);

    // クリックされたオブジェクトが水のメッシュであるかを確認
    const intersects = raycaster.intersectObjects(init.scene.children);
    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.geometry.type === 'SphereGeometry') {
            createRipple(intersects[i].point, intersects[i].object);
            break;
        }
    }
}

function createRipple(position, waterMesh) {
    // 細波のエフェクトを作成
    const rippleGeometry = new THREE.CircleGeometry(0.05, 32);
    const rippleMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
    });
    const ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
    ripple.position.copy(position);
    ripple.position.z += 0.1; // 少しメッシュの上に配置
    init.scene.add(ripple);

    // 細波を消すためのアニメーション
    let scale = 0.1;
    const maxScale = 5;
    const scaleStep = 0.5;
    const fadeOutStep = 0.1;
    function animateRipple() {
        scale += scaleStep;
        if (scale >= maxScale) {
            ripple.material.opacity -= fadeOutStep;
            if (ripple.material.opacity <= 0) {
                init.scene.remove(ripple);
                return;
            }
        }
        ripple.scale.set(scale, scale, scale);
        requestAnimationFrame(animateRipple);
    }
    animateRipple();
}
