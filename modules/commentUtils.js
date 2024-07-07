export function drawComment() {
  var p = document.createElement("p");  // pタグの要素を作成
  p.textContent = "モジュールで作成したコメント";  // テキスト内容を設定
  return p;  // 作成したpタグを返す
}