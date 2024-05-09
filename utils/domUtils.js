import { getLastElement, num2Px } from './otherUtils.js'
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
	dummy.innerHTML = _tagText	
	dummy.classList.add(_id) //NOTE: グループID-発話ID-パーツID	
	dummy.style.fontSize = num2Px(_fontSize)
	// X位置
	dummy.style.left = num2Px(_tagX)
	_element.appendChild(dummy)
	return dummy
}

export function drawLabel(_document, _element, _x, _y, _label, _fontSize){	
	var dummy = _document.createElement('span')
	dummy.className = 'label'
	dummy.innerHTML = _label
	dummy.style.fontSize = num2Px(_fontSize)
	dummy.style.left = num2Px(_x)
	dummy.style.top = num2Px(_y)
	_element.appendChild(dummy)
	return dummy
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
	dummy.innerHTML = '→'
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
 * spanタグを画面幅との関係で複数に分割する
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
	// DEBUG:このタグtextに対して、発話特殊記号のまとまり扱いを適用する
	const text = _span.innerHTML
	console.log('spanタグtext: ', text)
	console.log('_charNumFirstRow: ', _charNumFirstRow)
	console.log('_maxCharNumPerRow: ', _maxCharNumPerRow)
	// if(text.includes('(')){
	// 	console.log('()をふくむspanだよ')
	// }
	

	const id = _span.className
	let result
	// この行におさまらない場合
	if (text.length > _charNumFirstRow) {		
		// textのなかに"<"と">"が順番にある・・・isゆっくり = true
		// textのなかに">"と"<"が順番にある・・・is急いで = true
		// textのなかに"°"がある・・・is小さい = true
		// textのなかに".h"がある(正規表現だと、/\.h+/)・・・is吸気音 = true
		// textのなかに"(hhh)"がある（正規表現だと、\((h+)\)）・・・is笑い = true
		// textのなかに"(0.4)"的なのがある（正規表現だと、\((\d+(\.\d+)?)\)）・・・短い沈黙
		// これらそれぞれについて、
		// これらをなす記号の「開始インデックス」と「終了インデックス」を取得しておき、						
		function splitText(text, charNumFstRow, maxCharNumPerR) {
			// まずcharNumFirstRowのぶんだけとりだす
			var finalSplit = []
			var remainingText = text
			// (0) firstRowを仮生成
			let firstRowString = remainingText.slice(0, charNumFstRow)

			// (1) 仮生成したfirstRowに、発話記号が中途半端にふくまれてないか？チェック
			// (1-1) 開きっぱなし閉じていないカッコがないか？をチェックし、
			if (isIncompleteKakko(firstRowString)) {
				const index = firstRowString.indexOf('(')
				firstRowString = remainingText.slice(0, index)
				finalSplit.push(firstRowString)
				remainingText = remainingText.slice(index)
			}
			// 	const bool = isIncompleteKukuri(firstRowString, _tag)
			// }
			
			// (1-3)行頭チェック・・・'?'や'-'など、行頭禁止記号がないかたしかめ、あったら、その行頭禁止記号を前行行末に差し戻す
			else if (isSuffixFirst(firstRowString)) {
				console.log(`サフィックスが行頭にきてるよ`)
				const suffix = isSuffixFirst(firstRowString)
				// 前行の行末にサフィックスを押しもどして、
				finalSplit[finalSplit.length - 1] = finalSplit[finalSplit.length - 1] + suffix
				finalSplit.push(firstRowString.slice(1))
				remainingText = remainingText.slice(charNumFstRow - 1)
			}
			// else if(){

			// }

			// (1-4)中途半端になってなければ、
			else {
				// (1-2) '()','<>','°'などのククリ系記号が、あるタグ内で開いたら閉じてるか？をチェックし、開きっぱだったら調整。
				const kukuriMarkName = isIncompleteKukuri(firstRowString, _tag)
				console.log('kukuriMarkName: ', kukuriMarkName)
				// console.log('ククリ記号がとじてない（"<"や">"や"°"が、ペアをもたない）')
				if(kukuriMarkName){
					// 残りのなかの、(0,charNumFstRow - modifiedKeyの文字数)
					const kukuriMarkModifiedKey = kukuriMarkObjs[kukuriMarkName].begin.modifiedKey
					const sliceStringLength = kukuriMarkModifiedKey.length
					firstRowString = remainingText.slice(0, charNumFstRow - sliceStringLength)
					finalSplit.push(firstRowString)
					// TODO:
					remainingText = remainingText.slice(charNumFstRow - 5)
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
				else if (isIncompleteKukuri(rowString, _tag)) {
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


			*/

			/*
	10文字幅winだとすると、
	すでにaiueoがある行に対して、
	タグ
	kak(ikukekosa)si(sus)esotatitu(tetonaninuneno)
	を追加するならば、
		

	aiueo kak
	(ikukekosa
	)si(sus)es
	otatitu
	(tetonanin
	uneno)

	になる。

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
			
		// テスト
		result = splitText(text, _charNumFirstRow, _maxCharNumPerRow)
	}
	// この行におさまる場合は、そのまんまとくになんもしない
	else {
		result = [text]
	}

	console.log(result)
	return result
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
	dummy.innerHTML = _text
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

