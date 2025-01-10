window.addEventListener('DOMContentLoaded', () => {
  console.log("aaa")
  // ファイルのドラッグ&ドロップ
	const ddareas = document.getElementsByClassName('ddarea')
	console.log('ddareas: ', ddareas)
	Array.from(ddareas).forEach((ddarea) => {
		const isValid = (e) => e.dataTransfer.types.indexOf('Files') >= 0
		const ddEvent = {
			dragover: (e) => {
				e.preventDefault() // 既定の処理をさせない
				if (!e.currentTarget.isEqualNode(ddarea)) {
					// ドロップエリア外ならドロップを無効にする
					e.dataTransfer.dropEffect = 'none'
					return
				}
				e.stopPropagation() // イベント伝播を止める

				if (!isValid(e)) {
					// 無効なデータがドラッグされたらドロップを無効にする
					e.dataTransfer.dropEffect = 'none'
					return
				}
				// ドロップのタイプを変更
				e.dataTransfer.dropEffect = 'copy'
				ddarea.classList.add('ddefect')
			},
			dragleave: (e) => {
				if (!e.currentTarget.isEqualNode(ddarea)) {
					return
				}
				e.stopPropagation() // イベント伝播を止める
				ddarea.classList.remove('ddefect')
			},
			drop: (e) => {
				e.preventDefault() // 既定の処理をさせない
				e.stopPropagation() // イベント伝播を止める
				const files = e.dataTransfer.files
				const fileType = files[0].type
				if (fileType == 'text/plain') {
					// console.log('.txtファイルだよ')
					main(files[0])
				} else if (fileType.startsWith('video/')) {
					loadVideo(files[0])
				}
				ddarea.classList.remove('ddefect')
			},
		}
		Object.keys(ddEvent).forEach((e) => {
			ddarea.addEventListener(e, ddEvent[e])
			document.body.addEventListener(e, ddEvent[e])
		})
	})
})