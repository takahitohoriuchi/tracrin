/*NOTE:
HTML要素を直接に生成・更新・削除したりするのモジュールはここ
*/

import { num2Px } from './otherUtils.js'
import { isIncompleteKakko, isIncompleteKukuri, isSuffixFirst, kukuriMarkObjs } from './transcriptUtils.js'

export function updateTranscriptAreaSize(_transcriptArea, _windowSize) {
	// ウィンドウサイズに応じて、widthを変える
	console.log('updateTranscriptAreaSize')
	const margin = _windowSize.margin
	_transcriptArea.style.width = `${_windowSize.w - 2 * margin}px`
	_transcriptArea.style.left = `${margin}px`
}

export function genHatsuwaTags(_hatsuwaGroup, _groupIndex) {
	const array = []
	_hatsuwaGroup.forEach((hatsuwa, i) => {
		// _hatsuwaChildrenSpanTags.push([])
		const tagTexts = hatsuwa.text.split(/(?=\[)/)
		const tags = tagTexts.map((e,j)=>{
			// このタグtextが、発話内の何文字目からはじまるのか？を保存
			let endCharIndexInHatsuwa = 0
			for(let k=0; k<tagTexts.length; k++){
				endCharIndexInHatsuwa += tagTexts[k].length				
				if(k == j){
					break
				}
			}
			return {
				text: e,
				parentHatsuwa: hatsuwa.text,
				endCharIndexInHatsuwa: endCharIndexInHatsuwa-1,
				id: `${_groupIndex}-${i}-${j}`
			}
		})						
		// array.push(tagTexts)
		array.push(tags)
	})
	return array
}

/**
 * spanタグを生成
 * @param {Object} _document 
 * @param {Object} _element 
 * @param {String} _tagText 
 * @param {String} _id 
 * @param {Number} _tagX ⌥
 * @returns {HTMLElement} HMTLElementを返す
 */
export function genSpan(_document, _element, _tagText, _id, _fontSize, _tagX = 0) {
	var dummy = _document.createElement('span')
	dummy.className = 'tag'
	dummy.innerText = _tagText	
	// dummy.classList.add(_id) //NOTE: グループID-発話ID-パーツID	
	dummy.setAttribute('globalTagID', _id)
	dummy.style.fontSize = num2Px(_fontSize)
	// X位置
	dummy.style.left = num2Px(_tagX)
	_element.appendChild(dummy)
	return dummy
}


export function genLabelBox(_document, _row){
	var labelBox = _document.createElement('div')
	labelBox.className = 'labelBox'
	let rowID = _row.getAttribute('rowID')
	labelBox.setAttribute('rowID', rowID)
	labelBox.style.top = _row.style.top
	// console.log('_row.top（labelBox）: ', _row.style.top)
	labelBox.style.height = _row.style.height
	// console.log('_row.height: ', _row.style.height)
	labelBox.style.left = '0px'
	// labelBox.style.backgroundColor = 'blue'
	labelBox.style.width = '90px'
	labelBox.style.backgroundColor = 'transparent'
	_row.appendChild(labelBox)
	return labelBox
}

export function genRowDiv(_document, _parentElem, _w, _y, _rowID, _h){
	var row = _document.createElement('div')
	row.className = 'row'
	row.setAttribute('rowID', _rowID)
	row.style.display = 'flex'		
	// X位置
	row.style.top = num2Px(_y)
	row.style.width = num2Px(_parentElem.width)
	row.style.height = num2Px(_h)

	// gendataBox
	var dataBox = _document.createElement('div')
	dataBox.className = 'dataBox'	
	dataBox.setAttribute('rowID', _rowID)
	// dataBox.style.position = 'absolute'
	dataBox.style.top = num2Px(_y)
	dataBox.style.height = num2Px(_h)
	dataBox.style.width = num2Px(_w)
	dataBox.style.flex = 1	
	dataBox.style.backgroundColor = 'transparent'
			
	// dataBoxをrowに追加し、	
	row.appendChild(dataBox)
	// rowをdataAreaに追加する
	_parentElem.appendChild(row)

	console.log('row: ', row)
	return row

}

/**
 * 
 * @param {Object} _document 
 * @param {*} _element 
 * @param {Number} _x 
 * @param {Number} _y 
 * @param {*} _label 
 * @param {*} _fontSize 
 * @returns 
 */
export function drawLabel(_document, _element, _x, _y, _label, _rowID, _fontSize){	
	var dummy = _document.createElement('span')
	dummy.setAttribute('rowID', _rowID)
	dummy.className = 'label'	
	dummy.innerText = _label
	dummy.style.fontSize = num2Px(_fontSize)
	dummy.style.left = num2Px(_x)
	dummy.style.top = num2Px(_y)	
	_element.appendChild(dummy)
	return dummy
}

export function drawHeaderLabel(_document, _headerArea, _x, _y, _label, _fontSize){
	var label = _document.createElement('span')	
	label.className = 'label'	
	label.innerText = _label
	label.style.fontSize = num2Px(_fontSize)
	label.style.left = num2Px(_x)
	label.style.top = num2Px(_y)	
	_headerArea.appendChild(label)
	return label
}

/**
 * 
 * @param {*} _document 
 * @param {*} _element 
 * @param {*} _fontSize 
 * @param {Number} _x NOTE:矢印終点の位置（right）！！
 * @param {Number} _y 
 */
export function addArrow(_document, _element, _fontSize, _x, _y){
	var dummy = _document.createElement('span')
	dummy.className = 'arrow'
	dummy.innerText = '→'
	dummy.style.fontSize = num2Px(_fontSize)
	dummy.style.left = num2Px(_x)
	dummy.style.top = num2Px(_y)
	_element.appendChild(dummy)	
}

export function deleteArrow(_parentElem, _arrows){
	// DEBUG:ここで、_elementから、classs == 'arrow'になっているものを探して取り除く
	console.log('deleteArrow')
	console.log('_parentElem: ', _parentElem)
	_arrows.forEach(child=>{
		_parentElem.removeChild(child)
	})
}
/**
 * <span>タグをその行の画面幅余白との関係で複数に分割する（発話特殊記号が中途半端に分割されないように処理）
 * @param {Object} _document 
 * @param {HTMLElement} _span 
 * @param {Number} _charNumFirstRow このタグが書かれ始める最初行の残り文字数
 * @param {Number} _maxCharNumPerRow 現在のwin幅だと、一行あたりの最大文字数は？
 * @returns {Array} 分割されたspanのテキストStringの配列
 * EX:win幅に10文字おさまるとしたら、aiueoというタグの直後のタグkakikukekosasisusesoは
 * 1行目: aiueo kakiku
 * 2行目: kekosasisusu
 * 3行目: seso
 * というふうになる。
 */
export function splitSpan(_document, _span, _charNumFirstRow, _maxCharNumPerRow, _tag) {
	// NOTE:このタグtextに対して、発話特殊記号のまとまり扱いを適用する
	const text = _span.innerText
	console.log('spanタグtext: ', text)
	console.log('_charNumFirstRow: ', _charNumFirstRow)
	console.log('_maxCharNumPerRow: ', _maxCharNumPerRow)	

	const id = _span.className
	let result
	// この行におさまらない場合
	if (text.length > _charNumFirstRow) {		
		/*NOTE:
		textのなかに
		・"<"と">"が順番にある・・・isゆっくり = true
		・">"と"<"が順番にある・・・is急いで = true
		・"°"がある・・・is小さい = true
		・".h"がある(正規表現だと、/\.h+/)・・・is吸気音 = true
		・"(hhh)"がある（正規表現だと、\((h+)\)）・・・is笑い = true
		・"(0.4)"的なのがある（正規表現だと、\((\d+(\.\d+)?)\)）・・・短い沈黙
		これらそれぞれについて、
		これらをなす記号の「開始インデックス」と「終了インデックス」を取得しておき、						
		*/
		function splitText(text, charNumFstRow, maxCharNumPerR) {
			// まずcharNumFirstRowのぶんだけとりだす
			var finalSplit = []
			var remainingText = text
			// (0) firstRowを仮生成
			let firstRowString = remainingText.slice(0, charNumFstRow)
			console.log('ククリ記号中途半端判定します: ', firstRowString)
			// (1) 仮生成したfirstRowに、発話記号が中途半端にふくまれてないか？チェック
			// (1-1) 開きっぱなし閉じていないカッコがないか？をチェックし、
			if (isIncompleteKakko(firstRowString)) {
				console.log('開きっぱなしのククリ記号アリ')
				const index = firstRowString.indexOf('(')
				firstRowString = remainingText.slice(0, index)
				finalSplit.push(firstRowString)
				remainingText = remainingText.slice(index)
			}				
			// (1-3)行頭チェック・・・行頭に'?'や'-'があったら、前行の行末に差し戻す
			else if (isSuffixFirst(firstRowString)) {
				console.log(`サフィックスが行頭にきてるよ`)
				const suffix = isSuffixFirst(firstRowString)
				// 前行の行末にサフィックスを押しもどして、
				finalSplit[finalSplit.length - 1] = finalSplit[finalSplit.length - 1] + suffix
				finalSplit.push(firstRowString.slice(1))
				remainingText = remainingText.slice(charNumFstRow - 1)
			}	
			// (1-4)中途半端になってなければ、
			else {
				// DEBUG:20240718
				// (1-2) '()','<>','°'などのククリ系記号が、あるタグ内で開いたら閉じてるか？をチェックし、開きっぱだったら調整。
				console.log('_tag: ', _tag)
				const kukuriMarkName = isIncompleteKukuri(firstRowString)
				console.log('kukuriMarkName: ', kukuriMarkName)
				// console.log('ククリ記号がとじてない（"<"や">"や"°"が、ペアをもたない）')
				if(kukuriMarkName){
					// 残りのなかの、(0,charNumFstRow - modifiedKeyの文字数)
					const kukuriMarkModifiedKey = kukuriMarkObjs[kukuriMarkName].begin.modifiedKey
					const sliceStringLength = kukuriMarkModifiedKey.length
					firstRowString = remainingText.slice(0, charNumFstRow - sliceStringLength)
					finalSplit.push(firstRowString)
					// TODO:
					remainingText = remainingText.slice(charNumFstRow - 1)
					// firstRowString = remainingText.slice(0, charNumFstRow - 1)
					// finalSplit.push(firstRowString)
					// remainingText = remainingText.slice(charNumFstRow - 1)
				}else{
					// const suffix = isSuffixFirst(firstRowString)
					// console.log('suffix: ', suffix)
					// console.log('発話記号チュートハンパなし')
					// // 行末にククリ記号がきてないかチェック
					// if (isIncompleteKukuri(firstRowString)) {
					// 	firstRowString = remainingText.slice(0, charNumFstRow - 1)
					// 	finalSplit.push(firstRowString)
					// 	remainingText = remainingText.slice(charNumFstRow - 1)
					// }
					// // そんままぶちこむ
					// else {
					// 	finalSplit.push(firstRowString)
					// 	remainingText = remainingText.slice(charNumFstRow)
					// }

					finalSplit.push(firstRowString)
					remainingText = remainingText.slice(charNumFstRow)

				}								
			}
			console.log('remainingText: ', remainingText)
			// ここまでの処理を入れ子に繰り返す（行内におさまるまで。）
			while (remainingText.length >= maxCharNumPerR) {
				let rowString = remainingText.slice(0, maxCharNumPerR)
				// "("が中途半端にふくまれてる？
				if (isIncompleteKakko(rowString)) {
					const index = rowString.indexOf('(')
					rowString = remainingText.slice(0, index)
					remainingText = remainingText.slice(index)
				}
				// 行末判定
				else if (isIncompleteKukuri(rowString)) {
					rowString = remainingText.slice(0, maxCharNumPerR - 1)
					finalSplit.push(rowString)
					remainingText = remainingText.slice(maxCharNumPerR - 1)
				}
				// 行頭判定								
				else {					
					const suffix = isSuffixFirst(rowString)					
					if (suffix) {
						console.log(`サフィックスが行頭にきてるよ`)
						const suffix = isSuffixFirst(rowString)
						// 前行の行末にサフィックスを押しもどして、
						finalSplit[finalSplit.length - 1] = finalSplit[finalSplit.length - 1] + suffix
						finalSplit.push(rowString.slice(1))
						remainingText = remainingText.slice(maxCharNumPerR - 1)
					}
					// 中途半端になってないならそんままぶちこむ
					else {
						finalSplit.push(rowString)
						remainingText = remainingText.slice(maxCharNumPerR)
					}
				}
			}

			if (remainingText.length > 0) {
				const suffix = isSuffixFirst(remainingText)
				console.log('短くなったあとのsuffix: ', suffix)
				if(suffix){				
					// 前行の行末にサフィックスを押しもどして、
					finalSplit[finalSplit.length - 1] = finalSplit[finalSplit.length - 1] + suffix
					finalSplit.push(remainingText.slice(1))
					remainingText = remainingText.slice(1)
					
				}else{
					finalSplit.push(remainingText)
				}
				
			}
			return finalSplit
		}
		result = splitText(text, _charNumFirstRow, _maxCharNumPerRow)
			
			/*
			あらかじめ発話objに、発話記号がふくまれる場合、
			「それぞれ何文字目になにがあるのか」を記録しとく。

			この関数の引数に以下２つも渡す
			・発話obj
			・現在の引数である「text」が、発話中の何文字目（〜何文字目）なのか？

			
			
			中途半端になってたら、
			・次行に申し送るか、
			・この行のハバを増やすか
			・する。


			・行末文字がククリ記号になっちゃってない？
			・中途半端にカッコが含まれてない？
			・まとめてある？
			・先頭文字が

			Q1.()をふくむタグspanが、firstRowにあって、それがfirstRowの文字数におさまる？
				YES->
					そのまんま
				NO->
					1行目には、「"タグ先頭文字"〜"("」まで切り取り、
					2行目には、「残りの"("〜_maxCharNumPerRow文字」を描くが、
					このとき2行目にも"("の２個目以降がマギコレんでいたら、
					行内に２個目")"がおさまるかをチェック。
						YES -> そのまま
						NO -> 2個目"("を3行目からに改行
			Q2.()をふくむタグspanが、iこ目のrowからはじまって、それがmaxCharNumPerRowにおさまる？
				YES->
					そのまんま
				NO->
					i行目には"("の直前文字まで書いといて、
					i+1行目冒頭から、残りの"("からはじまるタグspanを描く
			
	*/					
		
	}
	// この行におさまる場合は、そのまんまとくになんもしない
	else {
		result = [text]
	}

	console.log(result)
	return result
}

export function toggleSelectionOfSpan(_span){

}

/**
 * このタグが属する発話オブジェクトを取得する
 * @param {*} _span 
 * @param {*} _hatsuwaGroups 
 * @returns 
 */
export function getHatsuwaObjFromSpan(_span, _hatsuwaGroups){
	// let classList = _span.classList
	// let globalTagID = classList[1]
	let globalTagID = _span.getAttribute("globalTagID")
	console.log('globalTagID: ', globalTagID)
	let groupID = globalTagID.split('-')[0]
	let hatsuwaIDInGroup = globalTagID.split('-')[1]
	let hatsuwaObjOwningThisTag = _hatsuwaGroups[groupID][hatsuwaIDInGroup]
	console.log('選択されたタグをもつ発話obj: ', hatsuwaObjOwningThisTag)	
	return hatsuwaObjOwningThisTag
}
//
/**
 * このテキストは、指定フォントサイズだと何px？
 * @param {*} _document
 * @param {*} _text
 * @param {*} _fontSize
 * @returns
 */
export function getTextWidth(_document, _text, _fontSize) {
	var dummy = _document.createElement('span')
	dummy.className = 'tag'
	dummy.innerText = _text
	dummy.style.fontSize = _fontSize
	// DOMに追加して、
	_document.body.appendChild(dummy)
	// widthだけ取得したら、
	const width = dummy.clientWidth
	// すぐ削除（あとでまた生成する）
	_document.body.removeChild(dummy)
	return width
}

/**
 * <span>タグのうち、所望の一文字が、ウィンドウ上のpx位置情報rectを取得
 * @param {Object} _document
 * @param {Object} _element
 * @param {String} _character
 * @returns {Object} rectオブジェクト（width, leftとかright, topなどのプロパティをもつ）
 */
export function getCharGlobalPositionOfSpan(_document, _element, _character) {
	// 要素内のテキストを取得
	const textContent = _element.textContent

	// "w" のインデックスを取得
	const indexOfW = textContent.indexOf(_character)

	// "w" の位置を取得
	if (indexOfW !== -1) {
		const range = _document.createRange()
		range.setStart(_element.firstChild, indexOfW)
		range.setEnd(_element.firstChild, indexOfW + 1)

		const rect = range.getBoundingClientRect()

		// 位置情報を表示
		console.log('X Position:', rect.left)
		console.log('Y Position:', rect.top)
		return rect
	}
}

/**
 * tagTextsのなかから、現在処理ループのtagTextだけ取り出す
 * @param {Array} _tagTexts 本グループの発話全部が、splitされた二次元配列で。
 * @param {Number} _loopIndex 処理ループインデックス
 * @returns {Array} 一次元配列
 */
export function getTagTextsInThisLoop(_tagTexts, _groupIndex, _loopIndex) {
	// i=0...[0-0]
	// i=1...[0-1],[1-0]
	// i=2...[0-2], [1-1], [2-0]
	// i=3...[0-3], [1-2], [2-1], [3-0]
	// i=j...[0-j], [1-(j-1)], ..., [j-0]
	const resultTagTexts = []
	for (let i = 0; i < _loopIndex + 1; i++) {
		if (_tagTexts[i][_loopIndex - i]){
			const tag = {
				text: _tagTexts[i][_loopIndex - i],
				id: `${_groupIndex}-${i}-${_loopIndex-i}`
			}
			resultTagTexts.push(tag)
		} 
	}
	return resultTagTexts
}

