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
