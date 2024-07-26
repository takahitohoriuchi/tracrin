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

/**
 * 
 * @param {Object} commentObj 
 * @returns {HTMLElement}
 */
export function drawComment(commentObj) {
  const category = commentObj.category

  const index = categories.find(_category => _category.categoryName === category)
  if (index) {
    var color = index.color
  }

  const divElement = document.createElement('div')
  divElement.className = 'comment ' + color
  divElement.id = 'commentSticker' + commentObj.commentID

  const header = document.createElement('div')
  header.className = 'header'

  const headerComment = document.createElement('p')
  headerComment.className = 'header'

  const deleteButton = document.createElement('p')
  deleteButton.textContent = '×'
  deleteButton.className = 'deleteButton'
  deleteButton.onclick = () => deleteComment(commentObj)

  header.appendChild(headerComment)
  header.appendChild(deleteButton)

  divElement.appendChild(header)

  const inputElement = document.createElement('textarea')
  inputElement.placeholder = commentObj.linkedGlobalTagIDs[0] + 'のコメントを入力'
  inputElement.className = 'inputfield'
  inputElement.onchange = function() {
    commentObj.comment = this.value
    console.log(commentObj.comment)
  }

  const categorySelectElement = document.createElement('select')
  categories.forEach(function(category) {
    const opt = document.createElement('option')
    opt.value = category.categoryName
    opt.text = category.categoryName
    categorySelectElement.add(opt)
  })
  categorySelectElement.addEventListener('change', function() {
    changeCategory(this.value, commentObj)
  })

  setCategoryList()

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
  divElement.appendChild(categorySelectElement)
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

// document.getElementById('categorycolor-aaa').addEventListener('change', function() {
//   changeCommentColor(this.value)
// })

function changeCommentColor(value) {
  const colorSelect = value
  
  const commentElements = document.querySelectorAll('[id^="commentSticker"')

  commentElements.forEach(function(commentElement) {
    commentElement.className = 'comment'
    commentElement.classList.add(colorSelect)
  })
}

function changeCategory(newCategory, commentObj) {
  commentObj.category = newCategory
  const index = categories.find(category => category.categoryName === newCategory)
  if (index) {
    var newColor = index.color
  }
  changeCommentColor(newColor)
  console.log(commentObj)
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

function setCategoryList() {
  const categoryList = document.getElementById('categoryList')
  categoryList.className = 'categoryList'
  const categoryUl = document.createElement('ul')
  categories.forEach(function(category) {
    const categoryElement = document.createElement('li')
    categoryElement.textContent = category.categoryName
    const colorSelectElement = document.createElement('select')
    colorSelectElement.addEventListener('change', function() {
      changeCommentColor(this.value)
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
