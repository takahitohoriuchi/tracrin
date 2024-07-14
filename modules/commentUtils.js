export function drawComment(comment) {
  var p = document.createElement("p")
  p.textContent = comment
  p.className = 'draggable'
  $(p).draggable()
  return p
}
