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

// export function getCommentObjs(_commentObjs){
//   commentObjs = _commentObjs
//   getSpans()
// }

export function pushSpans(){
  spans = document.querySelectorAll('[globalTagID]')
}

export function pushHatsuwaGroups(_hatsuwaGroups){
  hatsuwaGroups = _hatsuwaGroups
  console.log(hatsuwaGroups[5][0]['end'])
}

// function getSpans() {
//   spans = document.querySelectorAll('[globalTagID]')
// }

export function addComment(globalTagID){
  const commentObj = addCommentObj(globalTagID)
  addCommentSticker(commentObj)
}

function addCommentObj(globalTagID){
  const commentID = commentObjs.length
  const commentObj = {
    linkedGlobalTagIDs: [ globalTagID ],
    comment: "",
    category: currentCategory,
    isSelected: false,
    isShown: true,
    isDeleted: false,
    commentID: commentID
  }

  commentObjs.push(commentObj)

  return commentObj
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
  if ( commentObj.isShown === 'false' ) {
    //TODO: コメントファイル入力時にtrue/falseを文字列型でなくbool型で取得するよう修正、分岐の記述をシンプルにする
    fieldElement.style.display = 'none'
    headerComment.textContent = commentObj.comment
  } else {
    fieldElement.style.display = 'block'
    headerComment.textContent = ""
  }

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
    const index = categories.find(_category => _category.categoryName === category)
    if (index) {
      var color = index.color
    }
    const colorIndex = colorOptions.find(colorOption => colorOption.colorValue === color)
    if (colorIndex) {
      var colorCode = colorIndex.colorCodeLight
    }
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
    outputCommentFile(selectedCommentObjs, 'no_name')
  }
})

// document.getElementById("outputCommentFileButton").addEventListener('click', function() {
//   outputCommentFile(commentObjs)
// })

document.getElementById('inputCommentFileButton').addEventListener('click', function() {
  document.getElementById('commentFileInput').click()
})

document.addEventListener('DOMContentLoaded', () => {
  let popup; // ポップアップのインスタンスを保持

  const openPopupBtn = document.getElementById("outputCommentFileButton");

  openPopupBtn.addEventListener('click', () => {
    if (!popup) {
      // 初回クリック時にポップアップを生成
      const content = document.createElement('p');
      content.innerHTML = `
        <label>
          ファイル名: <input type="text" id="fileName" value="comment" />
        </label>
        <br>
        <label>
          ファイル形式: 
          <select id="fileType">
            <option value="tsv">tracrin(.tsv)</option>
            <option value="elan">elan(.eafcomment)</option>
          </select>
        </label>
      `;

      // ポップアップを作成
      popup = new Popup(
        'コメントファイルを出力',
        content,
        () => {
          // コールバック内で最新の値を取得
          const fileNameInput = document.getElementById('fileName');
          const fileTypeSelect = document.getElementById('fileType');

          let fileName = fileNameInput.value;
          if (!fileName) {
            fileName = 'comment'
          }
          const fileType = fileTypeSelect.value;

          if (fileType === 'tsv') {
            outputCommentFile(commentObjs, fileName)
          } else if (fileType === 'elan') {
            outputCommentFileForElan(commentObjs, fileName)
          } else {
            alert('無効な形式が選択されました。');
          }
        }
      );

      // 初期生成後、ポップアップを保持して再利用
    }

    // ポップアップを表示
    popup.show();
  });
});

function outputCommentFileForElan(commentObjs, fileName) {
  let xmlData = `
  <?xml version="1.0" encoding="UTF-8"?>
  <ColTimeList xmlns="http://mpi.nl/tools/coltime"
    xmlns:NS1="http://www.w3.org/2001/XMLSchema-instance" NS1:schemaLocation="http://mpi.nl/tools/coltime http://www.mpi.nl/tools/coltime/schema.xsd">
    `.trim()
  for (const commentObj of commentObjs) {
    if (commentObj.isDeleted === false) {
      const linkedGlobalTagIDs = commentObj.linkedGlobalTagIDs
      const comment = commentObj.comment
      const category = commentObj.category

      linkedGlobalTagIDs.forEach(linkedGlobalTagID => {
        const [ startTime, endTime ] = getHatsuwaTime(linkedGlobalTagID)
        const xmlItem = `
        <ColTime ColTimeMessageID="" URL="">
          <Metadata>
            <Initials/>
            <ThreadID/>
            <Sender/>
            <Recipient/>
            <CreationDate/>
            <ModificationDate/>
            <Category>unknown</Category>
            <Status>unknown</Status>
          </Metadata>
          <AnnotationFile URL="" type="EAF">#t=${startTime}/${endTime};tier=default</AnnotationFile>
          <Message>${category}:${comment}
          </Message>
        </ColTime>
        `.trim()
        xmlData += xmlItem
      })
    }
  }

  // 1. XMLデータの生成
  xmlData += `
  </ColTimeList>
  `.trim();

  // 2. Blobを使用してファイルを生成
  const blob = new Blob([xmlData], { type: "application/xml" });

  // 3. ダウンロードリンクを生成
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName + ".eafcomment"; // ダウンロードされるファイル名
  link.click();

  // 4. 生成したURLを解放
  URL.revokeObjectURL(url);
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
        currentCategory = newCategoryName
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

function outputCommentFile(commentObjs, fileName) {
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
  link.download = fileName + '.tsv'; // 拡張子を.tsvに変更
  link.click();

  // 生成したURLを解放
  URL.revokeObjectURL(url);
}

function readCommentFile(tsvText) {
  const lines = tsvText.split('\n');
  const headers = lines[0].split('\t').map(header => header.trim());
  let existingCategories = categories.map(category => category.categoryName)

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
      if (header === 'category') {
        if (!existingCategories.includes(data[index])) {
          const newCategory = {
            categoryName: data[index],
            categoryID: 'category' + categories.length,
            color: colorOptions[categories.length % 6].colorValue
          }
          categories.push(newCategory)
          existingCategories.push(newCategory.categoryName)
          console.log('categories: ', categories)
          console.log('existingCategories: ', existingCategories)
        } else {
          console.log('categories!: ', categories)
          console.log('existingCategories!: ', existingCategories)
          // const newCategory = {
          //   categoryName: data[index] + '_2',
          //   categoryID: 'category' + categories.length,
          //   color: colorOptions[categories.length % 6].colorValue
          // }
          // categories.push(newCategory)
          // existingCategories.push(newCategory.categoryName)
          // console.log('categories: ', categories)
          // console.log('existingCategories: ', existingCategories)
        }
      }
    })
    setCategoryList()
    // getSpans()
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

class Popup {
  constructor(headerTitle, contentElement, onConfirm) {
    // モーダル要素を作成
    this.modal = document.createElement('div');
    this.modal.style.display = 'none';
    this.modal.style.position = 'fixed';
    this.modal.style.top = '0';
    this.modal.style.left = '0';
    this.modal.style.width = '100%';
    this.modal.style.height = '100%';
    this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.modal.style.display = 'flex';
    this.modal.style.justifyContent = 'center';
    this.modal.style.alignItems = 'center';
    this.modal.style.zIndex = zIndexCounter

    // モーダルの中身を作成
    const modalContent = document.createElement('div');
    modalContent.style.background = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '5px';
    modalContent.style.textAlign = 'center';
    modalContent.style.minWidth = '300px';
    modalContent.style.zIndex = zIndexCounter + 1

    zIndexCounter += 2

    // ヘッダー部分を作成
    const header = document.createElement('h3');
    header.textContent = headerTitle;

    // 内容部分を挿入
    const content = document.createElement('div');
    content.appendChild(contentElement);

    // ボタン部分を作成
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-around';

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'キャンセル';
    cancelButton.addEventListener('click', () => this.hide());

    const confirmButton = document.createElement('button');
    confirmButton.textContent = '実行';
    confirmButton.addEventListener('click', () => {
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
      this.hide();
    });

    // ボタンを追加
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);

    // モーダルの中身を結合
    modalContent.appendChild(header);
    modalContent.appendChild(content);
    modalContent.appendChild(buttonContainer);
    this.modal.appendChild(modalContent);

    // モーダル外をクリックしたときに閉じる
    this.modal.addEventListener('click', (event) => {
      // クリックした箇所がmodalContentではない場合に閉じる
      if (event.target === this.modal) {
        this.hide();
      }
    });

    // DOMに追加
    document.body.appendChild(this.modal);
  }

  // モーダルを表示
  show() {
    this.modal.style.display = 'flex';
  }

  // モーダルを非表示
  hide() {
    this.modal.style.display = 'none';
  }
}
