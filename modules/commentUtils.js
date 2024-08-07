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
let spans
let zIndexCounter = 2

export function getCommentObjs(_commentObjs){
  commentObjs = _commentObjs
  spans = document.querySelectorAll('[globalTagID]')
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

  addCommentSticker(commentObj)

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

  const selectCheckbox = document.createElement('input')
  selectCheckbox.setAttribute('type', 'checkbox')
  selectCheckbox.style.transform = 'scale(1.5)'
  selectCheckbox.onchange = function() {
    commentObj.isSelected = selectCheckbox.checked
  }

  const headerComment = document.createElement('p')
  headerComment.className = 'p'

  const deleteButton = document.createElement('p')
  deleteButton.textContent = '×'
  deleteButton.className = 'deleteButton'
  deleteButton.onclick = () => confirmDeleteComments([commentObj])

  headerElement.appendChild(selectCheckbox)
  headerElement.appendChild(headerComment)
  headerElement.appendChild(deleteButton)

  commentStickerElement.appendChild(headerElement)

  const fieldElement = document.createElement('div')
  fieldElement.className = 'field'

  const commentInput = document.createElement('textarea')
  commentInput.placeholder = commentObj.linkedGlobalTagIDs[0] + 'のコメントを入力'
  commentInput.className = 'input'
  commentInput.value = commentObj.comment
  commentInput.onchange = function() {
    commentObj.comment = this.value
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

  // const editLinkedSpansButton = document.createElement('button')
  // editLinkedSpansButton.textContent = '対応する要素を編集'
  // let isEditing = false

  // const spanHandlers = new Map()

  // editLinkedSpansButton.onclick = () => {
  //   spans.forEach((span) => {
  //     const globalTagID = span.getAttribute('globalTagID')
  //     let isLinked = linkedGlobalTagIDs.includes(globalTagID)
  
  //     if (!spanHandlers.has(span)) {
  //       const editLinkedSpans = () => {
  //         if (isLinked) {
  //           span.style.border = 'none'
  //           const index = linkedGlobalTagIDs.indexOf(globalTagID)
  //           if (index !== -1) {
  //             linkedGlobalTagIDs.splice(index, 1)
  //             linkedSpans.splice(index, 1)
  //           }
  //           isLinked = false
  //         } else {
  //           span.style.border = '1px solid black'
  //           linkedGlobalTagIDs.push(globalTagID)
  //           linkedSpans.push(span)
  //           isLinked = true
  //         }
  //       }
  
  //       spanHandlers.set(span, editLinkedSpans)
  //     }
  
  //     if (isEditing) {
  //       span.removeEventListener('click', spanHandlers.get(span))
  //       span.style.border = 'none'
  //     } else {
  //       span.addEventListener('click', spanHandlers.get(span))
  //       if (isLinked) {
  //         span.style.border = '1px solid black'
  //       }
  //     }
  //   })
  //   if (isEditing) {
  //     editLinkedSpansButton.textContent = '対応する要素を確定'
  //   } else {
  //     editLinkedSpansButton.textContent = '対応する要素を編集'
  //   }
  //   isEditing = !isEditing
  // }

  // fieldElement.appendChild(editLinkedSpansButton)

  headerElement.ondblclick = function() {
    showOrHideComment(commentObj, fieldElement, headerComment)
  }

  fieldElement.appendChild(commentInput)
  fieldElement.appendChild(categorySelect)

  commentStickerElement.appendChild(fieldElement)
  $(commentStickerElement).draggable({
    containment: '#scrollable-div'
  })

  const linkedGlobalTagIDs = commentObj.linkedGlobalTagIDs
  let linkedSpans = []
  linkedGlobalTagIDs.forEach(function(linkedGlobalTagID) {
    const linkedSpan = document.querySelector(`[globaltagid="${linkedGlobalTagID}"`)
    linkedSpans.push(linkedSpan)
  })

  const targetY = parseInt(linkedSpans[0].style.top, 10)
  commentStickerElement.style.top = targetY + 11 + 'px'
  commentStickerElement.style.left = '400px'
  commentStickerElement.style.position = 'absolute'
  commentStickerElement.style.zIndex = zIndexCounter++

  commentStickerElement.addEventListener('click', function() {
    this.style.zIndex = zIndexCounter++ // クリックされるたびにz-indexを増加
  })

  commentStickerElement.addEventListener('mouseover', () => {
    linkedSpans.forEach(function(linkedSpan) {
      linkedSpan.style.backgroundColor = '#adf4ff'
    })
  })

  commentStickerElement.addEventListener('mouseout', () => {
    linkedSpans.forEach(function(linkedSpan) {
      linkedSpan.style.backgroundColor = 'transparent'
    })
  })

  let container = document.getElementById("commentArea")
  container.appendChild(commentStickerElement)
}

/**
 * 
 * @param {Object} commentObjs 
 */
function outputCommentFile(commentObjs) {
  const headers = Object.keys(commentObjs[0])
  const csvRows = [headers.join(',')]

  for (const row of commentObjs) {
    if (row.isDeleted === false){
      const values = headers.map(header => {
        const escaped = (''+row[header]).replace(/"/g, '\\"')
        return `"${escaped}"`
      })
    csvRows.push(values.join(','))
    }
  }

  const csvString = csvRows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'export.csv'
  link.click()

  URL.revokeObjectURL(url)
}

function deleteComment(commentObj) {
  commentObj.isDeleted = true
  const target = document.getElementById('commentSticker' + commentObj.commentID)
  target.remove()
}

function showOrHideComment(commentObj, fieldElement, headerComment) {
  if ( commentObj.isShown ) {
    commentObj.isShown = false
    fieldElement.style.display = 'none'

    headerComment.textContent = commentObj.comment
  } else {
    commentObj.isShown = true
    fieldElement.style.display = 'block'

    headerComment.textContent = ""
  }
}

function changeCommentStickerColor(commentObj) {
  const category = commentObj.category
  const commentID = commentObj.commentID
  const commentStickerElementID = 'commentSticker' + commentID
  const commentStickerElement = document.getElementById(commentStickerElementID)

  const index = categories.find(_category => _category.categoryName === category)
  if (index) {
    var color = index.color
  }

  commentStickerElement.className = 'comment ' + color
}

function changeCategory(newCategory, commentObj) {
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

document.getElementById('deleteSelectedCommentsButton').addEventListener('click', function() {
  const selectedCommentObjs = commentObjs.filter(commentObj => commentObj.isSelected === true)
  if (selectedCommentObjs) {
    console.log(selectedCommentObjs)
    confirmDeleteComments(selectedCommentObjs)
  }
})

document.getElementById('showOrHideSelectedCommentsButton').addEventListener('click', function() {
  const selectedCommentObjs = commentObjs.filter(commentObj => commentObj.isSelected === true)
  if (selectedCommentObjs) {
    selectedCommentObjs.forEach(selectedCommentObj => {
      const commentID = selectedCommentObj.commentID
      const selectedCommentSticker = document.getElementById('commentSticker' + commentID)
      const fieldElement = selectedCommentSticker.getElementsByClassName('field')[0]
      const headerComment = selectedCommentSticker.querySelector('p')
      showOrHideComment(selectedCommentObj, fieldElement, headerComment)
    })
  }
})

document.getElementById('outputSelectedCommentsAsFileButton').addEventListener('click', function() {
  const selectedCommentObjs = commentObjs.filter(commentObj => commentObj.isSelected === true)
  if (selectedCommentObjs) {
    outputCommentFile(selectedCommentObjs)
  }
})

document.getElementById("outputCommentFileButton").addEventListener('click', function() {
  outputCommentFile(commentObjs)
})

document.getElementById('inputCommentFileButton').addEventListener('click', function() {
  document.getElementById('commentFileInput').click()
})

document.getElementById('commentFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0]
  if (file) {
    console.log("ファイルが選択されました:", file.name)
    const reader = new FileReader()
    reader.onload = function(e) {
      const text = e.target.result
      const data = readCommentFile(text)
      commentObjs = data // コメントファイルを複数読み込む場合を考慮するとcommentObjの全書き換えはしない方が良いので後で修正
      addCommentStickersFromCommentFile(data)
    }
    reader.readAsText(file)
  }
})

function readCommentFile(csvText) {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    const data = line.split(',').map(cell => cell.trim())
    let obj = {}
    headers.forEach((header, index) => {
      obj[header] = parseValue(data[index])
    })
    return obj
  })
}

function parseValue(value) {
  // 値が配列の形式をしている場合 (例: "[item1,item2,item3]")
  if (value.includes('-')) {
    return value.substring(1, value.length - 1).split(',').map(item => item.trim().replace(/^"|"$/g, ''))
  }

  // 値がブール値の形式をしている場合 (例: "true" または "false")
  if (value === '"true"') {
    return true
  }
  if (value === '"false"') {
    return false
  }

  // 値が数値の形式をしている場合
  if (/^"\d+"$/.test(value)) {
    return parseFloat(value.replace(/^"|"$/g, ''))
  }

  // それ以外の場合は、クォーテーションを取り除いた文字列を返す
  return value.replace(/^"|"$/g, '')
}

function addCommentStickersFromCommentFile(commentObjsFromFile) {
  commentObjsFromFile.forEach(commentObjFromFile => {
    // const globalTagID = commentObjFromFile.linkedGlobalTagIDs[0]
    // addCommentObj(globalTagID)
    addCommentSticker(commentObjFromFile)
  })
}

setCategoryList()

function setCategoryList() {
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
    // selectCell.textContent = '選択'
    const selectCategoryButton = document.createElement('button')
    selectCategoryButton.textContent = '選択'
    selectCategoryButton.onclick = () => {
      selectCategoryComments(category)
    }
    selectCell.appendChild(selectCategoryButton)

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
}

function addCategorySelectOption(categorySelect, category) {
  const opt = document.createElement('option')
  opt.value = category.categoryName
  opt.text = category.categoryName
  categorySelect.add(opt)
}

function editCategorySelectOptions(currentCategoryName, newCategoryName) {
  const targetCategory = categories.find(_category => _category.categoryName === currentCategoryName)
  if (targetCategory) {
    targetCategory.categoryName = newCategoryName
  }

  const targetComments = commentObjs.filter(_commentObj => _commentObj.category === currentCategoryName)
  if (targetComments) {
    targetComments.forEach(function(targetComment) {
      targetComment.category = newCategoryName
    })
  }

  const categorySelectElements = document.querySelectorAll('[id^="commentCategorySelect"]')

  categorySelectElements.forEach(function(categorySelectElement) {
    const targetOptionElement = categorySelectElement.querySelector(`option[value="${currentCategoryName}"]`)

    targetOptionElement.textContent = newCategoryName
    targetOptionElement.value = newCategoryName
  })
}

function confirmDeleteComments(targetCommentObjs) {
  const deleteConfirmationDialog = document.getElementById('deleteConfirmationDialog')
  deleteConfirmationDialog.textContent = 'コメントを削除しますか？'
  deleteConfirmationDialog.className = 'categoryList'
  const display = deleteConfirmationDialog.style.display
  if (display == 'none') {
    deleteConfirmationDialog.style.display = 'block'
  } else {
    deleteConfirmationDialog.style.display = 'none'
  }

  const confirmDeleteButton = document.createElement('button')
  confirmDeleteButton.textContent = '削除'
  confirmDeleteButton.onclick = () => {
    targetCommentObjs.forEach(function(targetCommentObj) {
      deleteComment(targetCommentObj)
    })
    deleteConfirmationDialog.style.display = 'none'
  }

  const backButton = document.createElement('button')
  backButton.textContent = '戻る'
  backButton.onclick = () => {
    deleteConfirmationDialog.style.display = 'none'
  }

  deleteConfirmationDialog.appendChild(backButton)
  deleteConfirmationDialog.appendChild(confirmDeleteButton)
}

let categorySelectDisplay = true

document.getElementById('showOrHideCategorySelectButton').addEventListener('click', function() {
  categorySelectDisplay = !categorySelectDisplay
  showOrHideCategorySelect()
})

function showOrHideCategorySelect() {
  const categorySelectElements = document.querySelectorAll('[id^="commentCategorySelect"]')
  if (categorySelectDisplay) {
    categorySelectElements.forEach(function(categorySelectElement) {
      categorySelectElement.style.display = 'block'
    })
  } else {
    categorySelectElements.forEach(function(categorySelectElement) {
      categorySelectElement.style.display = 'none'
    })
  }
}

function selectCategoryComments(category) {
  console.log('選択したカテゴリ: ', category.categoryName)
  const targetComments = commentObjs.filter(commentObj => commentObj.category === category)
  if (targetComments) {
    targetComments.forEach(function(targetComment) {
      targetComment.isSelected = true
    })
  }
}