const init = initScene(); // シーンを初期化
document.addEventListener('DOMContentLoaded', () => {

    /* watergenerateは、水の球体を生成する関数。
     引数は次のとおり
     init（第1引数）：必須。initSceneで初期化したシーン。

     第2引数：球のオプション。オブジェクト形式で指定する。
     r：半径、デフォルト値（未設定の場合の値）は1, float
     color：色、デフォルト値は0x63caca
     x, y, z：中心位置、デフォルト値は（0,0,0）, float
     animation：アニメーションの有無、デフォルト値はtrue, boolean
     velocity：回転速度、デフォルト値は1, float
     distortion：球の波打ち具合の大きさ、デフォルト値は1, float
    */
    watergenerate(init, {})//全てデフォルト値
    watergenerate(init, {r : 2, color : 0x000000, x : 3, y : 2.5, z : 0, animation : true, velocity : 9.5, distortion : 5.5});
    watergenerate(init ,{color : 0xffb6c1, x : - 4.5, y : -0.5, animation : false});
    animate(init); // アニメーションを開始
});
