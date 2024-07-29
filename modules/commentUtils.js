let categories = [
  {
    categoryName: '名称未設定',
    categoryID: 'category0',
    color: 'blue'
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

export function addCommentObj(globalTagID){
  let commentID = commentObjs.length
  let commentObj = {
    linkedGlobalTagIDs: [ globalTagID ],
    comment: "",
    category: categories[0].categoryName,
    isSelected: false,
    isShown: true,
    isDeleted: false,
    commentID: commentID
  }
  let container = document.getElementById("commentArea")
  let commentElement = addCommentSticker(commentObj)
  container.appendChild(commentElement)

  commentObjs.push(commentObj)
}

/**
 * 
 * @param {Object} commentObj 
 * @returns {HTMLElement}
 */
function addCommentSticker(commentObj) {
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
  categorySelect.id = 'commentCategorySelect' + commentObj.commentID
  categories.forEach(function(category) {
    addCategorySelectOption(categorySelect, category)
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
  const categoryEditElement = document.getElementById('categoryList')
  categoryEditElement.innerHTML = ''
  categoryEditElement.className = 'categoryList'

  const categoryTable = document.createElement('table')
  const tableHeaderRow = document.createElement('tr')
  const tableHeaderTexts = ['カテゴリ名', 'カラー', '表示', '選択', '削除']
  tableHeaderTexts.forEach(function(tableHeaderText) {
    const tableHeaderColumn = document.createElement('th')
    tableHeaderColumn.textContent = tableHeaderText
    tableHeaderRow.appendChild(tableHeaderColumn) 
  })
  categoryTable.appendChild(tableHeaderRow)
  categories.forEach(function(category) {
    const tableRow = document.createElement('tr')

    const categoryName = category.categoryName
    const categoryNameCell = document.createElement('td')
    categoryNameCell.textContent = categoryName
    categoryNameCell.addEventListener('dblclick', function() {
      const currentCategoryName = this.textContent

      const input = document.createElement('input')
      input.type = 'text'
      input.value = currentCategoryName
      input.style.width = '100%'

      this.textContent = ''
      this.appendChild(input)

      input.focus()
      input.select()

      input.addEventListener('blur', function() {
        const newCategoryName = this.value
        categoryNameCell.textContent = newCategoryName
        category.categoryName = newCategoryName
        editCategorySelectOptions(currentCategoryName, newCategoryName)
      })

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          this.blur()
        }
      })
    })

    const colorSelectCell = document.createElement('td')
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
    colorSelectElement.value = category.color
    colorSelectCell.appendChild(colorSelectElement)

    const showCell = document.createElement('td')
    showCell.textContent = '表示'

    const selectCell = document.createElement('td')
    selectCell.textContent = '選択'

    const deleteCell = document.createElement('td')
    deleteCell.textContent = '削除'

    tableRow.appendChild(categoryNameCell)
    tableRow.appendChild(colorSelectCell)
    tableRow.appendChild(showCell)
    tableRow.appendChild(selectCell)
    tableRow.appendChild(deleteCell)
    categoryTable.appendChild(tableRow)
  })

  const newCategoryRow = document.createElement('tr')

  const newCategoryInput = document.createElement('input')
  newCategoryInput.placeholder = '新しいカテゴリを追加'
  const newCategoryAddButoon = document.createElement('button')
  newCategoryAddButoon.textContent = '追加'
  newCategoryAddButoon.onclick = () => {
    const newCategoryName = newCategoryInput.value
    addCategory(newCategoryName)
    newCategoryInput.value = ''
  }

  newCategoryRow.appendChild(newCategoryInput)
  newCategoryRow.appendChild(newCategoryAddButoon)
  categoryTable.appendChild(newCategoryRow)

  categoryEditElement.appendChild(categoryTable)
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

function addCategory(newCategoryName) {
  const newCategory = {
    categoryName: newCategoryName,
    categoryID: 'category' + categories.length,
    color: 'blue'
  }
  categories.push(newCategory)
  setCategoryList()

  const categorySelectElements = document.querySelectorAll('[id^="commentCategorySelect"]')
  categorySelectElements.forEach(element => {
    addCategorySelectOption(element, newCategory)
  })
  console.log(categories)
}

function addCategorySelectOption(categorySelect, category) {
  const opt = document.createElement('option')
  opt.value = category.categoryName
  opt.text = category.categoryName
  categorySelect.add(opt)
}

function editCategorySelectOptions(currentCategoryName, newCategoryName) {
  const categorySelectElements = document.querySelectorAll('[id^="commentCategorySelect"]')

  categorySelectElements.forEach(function(categorySelectElement) {
    const targetOptionElement = categorySelectElement.querySelector(`option[value="${currentCategoryName}"]`)

    targetOptionElement.textContent = newCategoryName
    targetOptionElement.value = newCategoryName
  })
}