export function drawComment(commentObj) {
  const divElement = document.createElement("div")
  divElement.className = 'draggable'

  const p = document.createElement("p")
  p.className = "header"
  divElement.appendChild(p)

  const inputElement = document.createElement("textarea")
  inputElement.placeholder = commentObj.linkedGlobalTagIDs[0] + 'のコメントを入力'
  inputElement.className = 'commentInput'
  inputElement.onchange = function() {
    commentObj.comment = this.value
    console.log(commentObj.comment)
  }

  divElement.appendChild(inputElement)
  $(divElement).draggable()

  return divElement
}
