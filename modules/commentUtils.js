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
    colorValue: 'blue',
    colorCodeLight: '#adf4ff'
  },
  {
    colorName: 'イエロー',
    colorValue: 'yellow',
    colorCodeLight: '#FEF49C'
  },
  {
    colorName: 'グリーン',
    colorValue: 'green',
    colorCodeLight: '#B2FFA0'
  },
  {
    colorName: 'ピンク',
    colorValue: 'pink',
    colorCodeLight: '#FFC7C7'
  },
  {
    colorName: 'パープル',
    colorValue: 'purple',
    colorCodeLight: '#B6CAFF'
  },
  {
    colorName: 'グレー',
    colorValue: 'gray',
    colorCodeLight: '#EEEEEE'
  }
]

let commentObjs = []
let hatsuwaGroups
let spans
let zIndexCounter = 2
let isEditingGlobal = false // コメントに対応するspanタグ要素を編集状態を制御、わかりやすい変数名に変更予定
let currentCategory = categories[0].categoryName

export function getCommentObjs(_commentObjs){
  commentObjs = _commentObjs
  getSpans()
}

export function pushHatsuwaGroups(_hatsuwaGroups){
  hatsuwaGroups = _hatsuwaGroups
  console.log(hatsuwaGroups[5][0]['end'])
}

function getSpans() {
  spans = document.querySelectorAll('[globalTagID]')
}

export function addCommentObj(globalTagID){
  let commentID = commentObjs.length
  let commentObj = {
    linkedGlobalTagIDs: [ globalTagID ],
    comment: "",
    category: currentCategory,
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
function addCommentSticker(commentObj, xPosition, yPosition) {
  const category = commentObj.category

  const index = categories.find(_category => _category.categoryName === category)
  if (index) {
    var color = index.color
  }

  const colorIndex = colorOptions.find(colorOption => colorOption.colorValue === color)
  if (colorIndex) {
    var colorCode = colorIndex.colorCodeLight
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
  categorySelect.value = commentObj.category
  categorySelect.text = commentObj.category
  categorySelect.className = 'select'
  categorySelect.addEventListener('change', function() {
    changeCategory(this.value, commentObj)
  })

  // コメントに対応する要素選択機能【ここから】
  const editLinkedSpansButton = document.createElement('button')
  editLinkedSpansButton.textContent = '参照先を変更'
  let isEditing = false

  const spanHandlers = new Map()

  editLinkedSpansButton.onclick = () => {
    if (isEditingGlobal & !isEditing) {
      alert('他のコメントの参照先を変更中です。')
    } else {
      spans.forEach((span) => {
        const globalTagID = span.getAttribute('globalTagID')
        let isLinked = linkedGlobalTagIDs.includes(globalTagID)
    
        if (!spanHandlers.has(span)) {
          const editLinkedSpans = () => {
            if (isLinked) {
              span.style.border = 'none'
              const index = linkedGlobalTagIDs.indexOf(globalTagID)
              if (index !== -1) {
                linkedGlobalTagIDs.splice(index, 1)
                linkedSpans.splice(index, 1)
              }
              isLinked = false
            } else {
              span.style.border = '1px solid black'
              linkedGlobalTagIDs.push(globalTagID)
              linkedSpans.push(span)
              isLinked = true
            }
          }
    
          spanHandlers.set(span, editLinkedSpans)
        }
    
        if (isEditing) {
          span.removeEventListener('click', spanHandlers.get(span))
          span.style.border = 'none'
          commentStickerElement.style.border = 'none'
        } else {
          span.addEventListener('click', spanHandlers.get(span))
          if (isLinked) {
            span.style.border = '1px solid black'
            commentStickerElement.style.border = '1px solid black'
          }
        }
      })
      if (isEditing) {
        editLinkedSpansButton.textContent = '参照先を変更'
      } else {
        editLinkedSpansButton.textContent = '参照先を確定'
      }
  
      isEditing = !isEditing
      isEditingGlobal = isEditing
    }
  }

  // コメントに対応する要素選択機能【ここまで】

  headerElement.ondblclick = function() {
    showOrHideComment(commentObj, fieldElement, headerComment)
  }

  fieldElement.appendChild(commentInput)
  
  const optionElement = document.createElement('div')
  optionElement.id = 'commentOption' + commentObj.commentID

  optionElement.appendChild(categorySelect)
  optionElement.appendChild(editLinkedSpansButton)

  fieldElement.appendChild(optionElement)

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

  if (xPosition === undefined) {
    const targetY = parseInt(linkedSpans[0].style.top, 10)
    commentStickerElement.style.left = '400px'
    commentStickerElement.style.top = targetY + 11 + 'px'
  } else {
    commentStickerElement.style.left = xPosition + 'px'
    commentStickerElement.style.top = yPosition + 'px'
  }
  commentStickerElement.style.position = 'absolute'
  commentStickerElement.style.zIndex = zIndexCounter++

  commentStickerElement.addEventListener('click', function() {
    this.style.zIndex = zIndexCounter++ // クリックされるたびにz-indexを増加
  })

  commentStickerElement.addEventListener('mouseover', () => {
    linkedSpans.forEach(function(linkedSpan) {
      linkedSpan.style.backgroundColor = colorCode
    })
  })

  commentStickerElement.addEventListener('mouseout', () => {
    linkedSpans.forEach(function(linkedSpan) {
      linkedSpan.style.backgroundColor = 'transparent'
    })
  })

  const container = document.getElementById("commentArea")
  container.appendChild(commentStickerElement)
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

  const colorIndex = colorOptions.find(colorOption => colorOption.colorValue === color)
  if (colorIndex) {
    var colorCode = colorIndex.colorCodeLight
  }

  commentStickerElement.className = 'comment ' + color

  const linkedGlobalTagIDs = commentObj.linkedGlobalTagIDs
  let linkedSpans = []
  linkedGlobalTagIDs.forEach(function(linkedGlobalTagID) {
    const linkedSpan = document.querySelector(`[globaltagid="${linkedGlobalTagID}"`)
    linkedSpans.push(linkedSpan)
  })

  commentStickerElement.addEventListener('mouseover', () => {
    linkedSpans.forEach(function(linkedSpan) {
      linkedSpan.style.backgroundColor = colorCode
    })
  })

  commentStickerElement.addEventListener('mouseout', () => {
    linkedSpans.forEach(function(linkedSpan) {
      linkedSpan.style.backgroundColor = 'transparent'
    })
  })
}

function changeCategory(newCategory, commentObj) {
  commentObj.category = newCategory
  currentCategory = newCategory
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
    const showOrHideCategoryCommentsButton = document.createElement('button')
    showOrHideCategoryCommentsButton.textContent = '表示切り替え'
    showOrHideCategoryCommentsButton.onclick = () => {
      alert('ご要望がありましたらカテゴリ「' + category.categoryName + '」に含まれるコメント付箋の表示/非表示を切り替える機能を実装します。')
    }
    showCell.appendChild(showOrHideCategoryCommentsButton)

    const selectCell = document.createElement('td')
    const selectCategoryButton = document.createElement('button')
    selectCategoryButton.textContent = '選択'
    selectCategoryButton.onclick = () => {
      selectCategoryComments(category)
      alert('カテゴリ「' + category.categoryName + '」に含まれるコメント付箋を全て選択状態にする機能を実装予定です。')
    }
    selectCell.appendChild(selectCategoryButton)

    const deleteCell = document.createElement('td')
    const deleteCategoryButton = document.createElement('button')
    deleteCategoryButton.textContent = '削除'
    deleteCategoryButton.onclick = () => {
      alert('カテゴリ「' + category.categoryName + '」を削除する機能を実装予定です。')
    }
    deleteCell.appendChild(deleteCategoryButton)

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

  currentCategory = newCategoryName

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
  const isConfirmed = confirm('コメントを削除しますか？')

  if (isConfirmed) {
    targetCommentObjs.forEach(function(targetCommentObj) {
      deleteComment(targetCommentObj)
    })
  }
  spans.forEach(function(span) {
    span.style.backgroundColor = 'transparent'
  })
}

let commentOptionDisplay = true

document.getElementById('showOrHideCommentOptionButton').addEventListener('click', function() {
  commentOptionDisplay = !commentOptionDisplay
  showOrHideCommentOption()
})

function showOrHideCommentOption() {
  const commentOptionElements = document.querySelectorAll('[id^="commentOption"]')
  if (commentOptionDisplay) {
    commentOptionElements.forEach(function(commentOptionElement) {
      commentOptionElement.style.display = 'block'
    })
  } else {
    commentOptionElements.forEach(function(commentOptionElement) {
      commentOptionElement.style.display = 'none'
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

function outputCommentFile(commentObjs) {
  // オブジェクトのキーからヘッダーを生成
  // const headers = Object.keys(commentObjs[0])
  const headers = [
    'linkedGlobalTagIDs',
    'comment',
    'category',
    'startTime',
    'endTime',
    'xPosition',
    'yPosition',
    'isShown'
  ]
  // ヘッダー行をタブで結合
  const tsvRows = [headers.join('\t')]

  // 各オブジェクトを行に変換
  for (const row of commentObjs) {
    if (row.isDeleted === false){
      const linkedGlobalTagIDs = row.linkedGlobalTagIDs
      const comment = row.comment
      const category = row.category
      const [ startTime, endTime ] = getHatsuwaTime(linkedGlobalTagIDs[0])
      const commentID = row.commentID
      const [ xPosition, yPosition ] = getCommentStickerPosition(commentID)
      const isShown = row.isShown

      const values = [
        linkedGlobalTagIDs.join(','), // 配列の場合カンマ区切り
        comment,
        category,
        startTime,
        endTime,
        xPosition,
        yPosition,
        isShown
      ].map(value => {
        const strValue = '' + value; // 数値などを文字列に変換
        return strValue.replace(/[\t\n\r]/g, ' '); // TSVの制御文字を空白に置換
      });
      tsvRows.push(values.join('\t'));
    }
  }

  // TSV文字列を生成し、Blobとして保存
  const tsvString = tsvRows.join('\n');
  const blob = new Blob([tsvString], { type: 'text/tab-separated-values' })
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export.tsv'; // 拡張子を.tsvに変更
  link.click();

  // 生成したURLを解放
  URL.revokeObjectURL(url);
}

function readCommentFile(tsvText) {
  const lines = tsvText.split('\n');
  const headers = lines[0].split('\t').map(header => header.trim());
  let existingCategories = []

  return lines.slice(1).map(line => {
    const data = line.split('\t').map((cell, index) => {
      cell = cell.trim()
      if (index === 0) {
        return cell.includes(',') ? cell.split(',').map(item => item.trim()) : [cell]
      } else {
        return cell
      }
    })
    let obj = {}
    headers.forEach((header, index) => {
      obj[header] = data[index];
      obj['isSelected'] = false
      obj['isDeleted'] = false
      obj['commentID'] = commentObjs.length
      if (header === 'category' & !existingCategories.includes(data[index])) {
        categories.push({
          categoryName: data[index],
          categoryID: 'category' + categories.length,
          color: colorOptions[categories.length % 6].colorValue
        })
        existingCategories.push(data[index])
      }
    })
    setCategoryList()
    getSpans()
    commentObjs.push(obj)
    addCommentSticker(obj, obj['xPosition'], obj['yPosition'])
  })
}

document.getElementById('commentFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0]
  if (file) {
    console.log("コメントファイルの入力を受け付けました:", file.name)
    const reader = new FileReader()
    reader.onload = function(e) {
      const text = e.target.result
      readCommentFile(text)
    }
    reader.readAsText(file)
  }
})

function getHatsuwaTime(globalTagID){
  const [ i, j, k ] = globalTagID.split('-')

  console.log(i, j, k)

  const startTime = hatsuwaGroups[i][j]['start']
  const endTime = hatsuwaGroups[i][j]['end']

  return [ startTime, endTime ]
}

function getCommentStickerPosition(commentID){
  const commentStickerElementID = 'commentSticker' + commentID
  const commentStickerElement = document.getElementById(commentStickerElementID)
  const parent = commentStickerElement.offsetParent

  const xPosition = commentStickerElement.offsetLeft + parent.scrollLeft
  const yPosition = commentStickerElement.offsetTop + parent.scrollTop

  return [ xPosition, yPosition ]
}