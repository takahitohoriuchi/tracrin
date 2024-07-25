/**
 * 
 * @param {Object} commentObj 
 * @returns {HTMLElement}
 */
export function drawComment(commentObj) {
  const divElement = document.createElement('div')
  divElement.className = 'draggable'

  const header = document.createElement('div')
  header.className = 'header'

  const headerComment = document.createElement('p')
  headerComment.className = 'header'

  const deleteButton = document.createElement('p')
  deleteButton.textContent = '×'
  deleteButton.className = 'commentDeleteButton'
  deleteButton.onclick = deleteComment(commentObj)

  header.appendChild(headerComment)
  header.appendChild(deleteButton)

  divElement.appendChild(header)

  const inputElement = document.createElement('textarea')
  inputElement.placeholder = commentObj.linkedGlobalTagIDs[0] + 'のコメントを入力'
  inputElement.className = 'commentInput'
  inputElement.onchange = function() {
    commentObj.comment = this.value
    console.log(commentObj.comment)
  }

  header.ondblclick = function() {
    if ( commentObj.isShown ) {
      commentObj.isShown = false
      inputElement.style.display = 'none'
    } else {
      commentObj.isShown = true
      inputElement.style.display = 'block'
    }

    if ( commentObj.isShown ) {
      headerComment.textContent = ""
    } else {
      headerComment.textContent = commentObj.comment
      console.log(commentObj.comment)
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

function deleteComment(commentObj) {
  console.log("deleted comment!")
}