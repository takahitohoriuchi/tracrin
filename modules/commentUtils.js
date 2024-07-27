let categories = [
  {
    categoryName: 'aaa',
    categoryID: 'category1',
    color: 'blue'
  },
  {
    categoryName: 'bbb',
    categoryID: 'category2',
    color: 'purple'
  },
  {
    categoryName: 'ccc',
    categoryID: 'category3',
    color: 'yellow'
  }
]

const colorOptions = [
  {
    colorName: 'ブルー',
    colorValue: 'blue'
  },
  {
    colorName: 'イエロー',
    colorValue: 'yellow'
  },
  {
    colorName: 'グリーン',
    colorValue: 'green'
  },
  {
    colorName: 'ピンク',
    colorValue: 'pink'
  },
  {
    colorName: 'パープル',
    colorValue: 'purple'
  },

  {
    colorName: 'グレー',
    colorValue: 'gray'
  }
]

let commentObjs

export function getCommentObjs(_commentObjs){
  commentObjs = _commentObjs
}

/**
 * 
 * @param {Object} commentObj 
 * @returns {HTMLElement}
 */
export function addCommentSticker(commentObj) {
  const category = commentObj.category

  const index = categories.find(_category => _category.categoryName === category)
  if (index) {
    var color = index.color
  }

  const commentStickerElement = document.createElement('div')
  commentStickerElement.className = 'comment ' + color
  commentStickerElement.id = 'commentSticker' + commentObj.commentID

  const headerElement = document.createElement('div')
  headerElement.className = 'header'

  const headerComment = document.createElement('p')
  headerComment.className = 'header'

  const deleteButton = document.createElement('p')
  deleteButton.textContent = '×'
  deleteButton.className = 'deleteButton'
  deleteButton.onclick = () => deleteComment(commentObj)

  headerElement.appendChild(headerComment)
  headerElement.appendChild(deleteButton)

  commentStickerElement.appendChild(headerElement)

  const fieldElement = document.createElement('div')
  fieldElement.className = 'field'

  const commentInput = document.createElement('textarea')
  commentInput.placeholder = commentObj.linkedGlobalTagIDs[0] + 'のコメントを入力'
  commentInput.className = 'field'
  commentInput.onchange = function() {
    commentObj.comment = this.value
    console.log(commentObj.comment)
  }

  const categorySelect = document.createElement('select')
  categories.forEach(function(category) {
    const opt = document.createElement('option')
    opt.value = category.categoryName
    opt.text = category.categoryName
    categorySelect.add(opt)
  })
  categorySelect.className = 'select'
  categorySelect.addEventListener('change', function() {
    changeCategory(this.value, commentObj)
  })

  headerElement.ondblclick = function() {
    if ( commentObj.isShown ) {
      commentObj.isShown = false
      fieldElement.style.display = 'none'
    } else {
      commentObj.isShown = true
      fieldElement.style.display = 'block'
    }

    if ( commentObj.isShown ) {
      headerComment.textContent = ""
    } else {
      headerComment.textContent = commentObj.comment
      console.log(commentObj.comment)
    }
  }

  fieldElement.appendChild(commentInput)
  fieldElement.appendChild(categorySelect)

  commentStickerElement.appendChild(fieldElement)

  // commentStickerElement.appendChild(commentInput)
  // commentStickerElement.appendChild(categorySelect)
  $(commentStickerElement).draggable()

  return commentStickerElement
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
      if (row.isDeleted === false){
        const values = headers.map(header => {
          const escaped = (''+row[header]).replace(/"/g, '\\"'); // クオートのエスケープ
          return `"${escaped}"`; // 各値をダブルクォートで囲む
        })
      csvRows.push(values.join(',')); // 行をCSV形式で追加
      }
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
  console.log("deleted comment!: ", commentObj.linkedGlobalTagIDs[0])
  commentObj.isDeleted = true
  const target = document.getElementById('commentSticker' + commentObj.commentID)
  target.remove()
}

function changeCommentStickerColor(commentObj) {
  const category = commentObj.category
  const commentID = commentObj.commentID
  const commentStickerElementID = 'commentSticker' + commentID
  const commentStickerElement = document.getElementById(commentStickerElementID)

  const index = categories.find(_category => _category.categoryName === category)
  if (index) {
    var color = index.color
    console.log(color)
  }

  commentStickerElement.className = 'comment ' + color
}

function changeCategory(newCategory, commentObj) {
  console.log(newCategory)
  commentObj.category = newCategory
  changeCommentStickerColor(commentObj)
}

document.getElementById('editCategoryButton').addEventListener('click', function(){
  const categoryList = document.getElementById('categoryList')
  const display = categoryList.style.display
  if (display == 'none') {
    categoryList.style.display = 'block'
  } else {
    categoryList.style.display = 'none'
  }
})

export function setCategoryList() {
  const categoryList = document.getElementById('categoryList')
  categoryList.className = 'categoryList'
  const categoryUl = document.createElement('ul')
  categories.forEach(function(category) {
    const categoryElement = document.createElement('li')
    categoryElement.textContent = category.categoryName
    const colorSelectElement = document.createElement('select')
    colorSelectElement.addEventListener('change', function() {
      changeCommentCategoryColor(category, this.value)
    })
    colorOptions.forEach(function(colorOption) {
      const colorOptionElement = document.createElement('option')
      colorOptionElement.value = colorOption.colorValue
      colorOptionElement.textContent = colorOption.colorName
      colorSelectElement.appendChild(colorOptionElement)
    })
    categoryElement.appendChild(colorSelectElement)
    categoryUl.appendChild(categoryElement)
  })
  categoryList.appendChild(categoryUl)
}

function changeCommentCategoryColor(category, color) {
  const index = categories.find(_category => _category.categoryName === category.categoryName)
  if (index) {
    index.color = color
  }

  commentObjs.forEach(function(_commentObj) {
    if (_commentObj.category === category.categoryName) {
      changeCommentStickerColor(_commentObj)
    }
  })
  console.log(commentObjs)
  console.log(category)
  console.log(color)
}