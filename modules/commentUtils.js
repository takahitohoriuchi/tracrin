/**
 * 
 * @param {Object} commentObj 
 * @returns {HTMLElement}
 */
export function drawComment(commentObj) {
  const divElement = document.createElement('div')
  divElement.className = 'draggable'

  const header = document.createElement('p')
  header.className = 'header'
  
  divElement.appendChild(header)

  const inputElement = document.createElement('textarea')
  inputElement.placeholder = commentObj.linkedGlobalTagIDs[0] + 'のコメントを入力'
  inputElement.className = 'commentInput'
  inputElement.onchange = function() {
    commentObj.comment = this.value
    console.log(commentObj.comment)
  }

  header.onclick = function() {
    inputElement.style.display = (inputElement.style.display === 'none') ? 'block' : 'none'
    if (inputElement.style.display === 'none') {
      header.textContent = commentObj.comment
      console.log(commentObj.comment)
    } else {
      header.textContent = ""
    }
  }

  divElement.appendChild(inputElement)
  $(divElement).draggable()

  return divElement
}

/**
 * 
 * @param {Object} commentObjs 
 */
export function outputCommentFile(commentObjs) {
  let button = document.getElementById("buttonOutputComment")

  button.onclick = function() {
    // CSVのヘッダを生成
    const headers = Object.keys(commentObjs[0]);
    const csvRows = [headers.join(',')]; // ヘッダ行を追加

    // 各行データの処理
    for (const row of commentObjs) {
      const values = headers.map(header => {
        const escaped = (''+row[header]).replace(/"/g, '\\"'); // クオートのエスケープ
        return `"${escaped}"`; // 各値をダブルクォートで囲む
      });
      csvRows.push(values.join(',')); // 行をCSV形式で追加
    }

    // Blobを作成し、リンクを介してダウンロード
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.csv'; // ダウンロードファイル名
    link.click();

    // 後処理
    URL.revokeObjectURL(url);
  }
}
