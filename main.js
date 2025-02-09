// SECTION:【import】
import {
	addArrow,
	addRow,
	deleteArrow,
	drawHeaderLabel,
	drawLabel,
	drawSpeakerLabel,
	genHatsuwaTags,
	genLabelBox,
	genRowDiv,
	genSpan,
	getHatsuwaObjFromSpan,
	splitSpan,
} from './modules/domUtils.js'
import { formatNumber, num2Px, px2Num } from './modules/otherUtils.js'
import { roundTextValues, /* tempConvertKukuriMarksInHatsuwa */ } from './modules/transcriptUtils.js'
import { loadVideo, video, videoAspectRatio } from './modules/video.js'
import { addComment, pushSpans, pushHatsuwaGroups } from './modules/commentUtils.js'


// SECTION:【グローバル変数】
let hatsuwaObjs = []
let hatsuwaGroups = []
let hatsuwaTagSpans = [] //三重配列:[グループ][発話][発話タグ]
const drawnRange = {
	sGroupID: 0,
	eGroupID: 0,
}
let rowElems = [] //rowエレメント（行えれめんと）を、格納する
let idLabels = []
let speakerLabels = []
let accumRowCount = 0 //最終的に表示されるデータ行数（データの選択箇所&折り返しとか反映後）
let hatsuwaTimeResolution = 0.05
let isAdjustedPosition = false

let resizeTimer
let fontSize = 12 //デフォだと12になるぽい
let lineHeightRatio = 1.2 //フォントサイズに対するテキストのボックス高さの比
let transcriptArea = document.getElementById('transcriptArea')
let transcriptAreaStyle
let scrollableDivArea = document.getElementById('scrollable-div')
let scrollableDivAreaMargin = 0
let scrollableDivAreaStyle
let dataArea = document.getElementById('dataArea')
let dataAreaMargin = 10
let dataAreaStyle
let labelBoxW = fontSize * 7
let dataBoxX
let headerArea = document.getElementById('headerArea')
let headerAreaStyle
let headerAreaHeight = fontSize * 1
let file
let textFile
let videoFile

let commentObjs = []

let windowSize = {
	w: 0,
	h: 0,
	margin: 20,
}

// 色
let mouseon4Label = '#c1dff7'
let selected4Label = 'red'
let mouseon4HatsuwarowColor = '#f1f2ed'
let selectedHatsuwarowColor = '#e7e8e3'
let selected4Hatsuwatag = '#ff0062'

// DOMの選択
let selectionStartTag
let selectionEndTag

// SECTION::【関数】
// メイン関数
async function main(_file = null, _fontSize = null, _charNumPerRow = null) {
	if (_file) {
		file = _file
	}

	const fileReader = new FileReader()
	fileReader.readAsText(file)
	fileReader.onload = async () => {
		// TODO:hatsuwaObjsとかの生成は、リロード時はやりなおさなくてよし！！！！
		await reload()
		await resize()

		// 最初の読み込み時だけ（winリサイズ時はいちいちやらない）
		if (_file) {
			const textContent = fileReader.result
			await genHatsuwaObjs(textContent)
			// tempConvertKukuriMarks(hatsuwaObjs)
			await groupingHatsuwaObjs(hatsuwaObjs)
		}
		drawnRange.sGroupID = 0
		drawnRange.eGroupID = hatsuwaGroups.length
		const isAdjustedPosition = false
		await drawTranscript(hatsuwaGroups, fontSize, drawnRange, isAdjustedPosition, _charNumPerRow)
		// 左の発話者&行数ラベルを表示
		drawIDandSpeaker(hatsuwaGroups, drawnRange, fontSize)
		// spanやラベルにイベントを追加
		await addMouseEvents()

		// TODO:heightを更新
		// 1:hatsuwaTagSpans[][][]の最終要素のbottomを取得して
		const lastDataBottom = accumRowCount * fontSize * lineHeightRatio
		transcriptArea.style.height = num2Px(lastDataBottom - headerAreaHeight)
		headerArea.style.height = num2Px(headerAreaHeight)
		dataArea.style.height = num2Px(lastDataBottom)
		scrollableDivArea.style.top = num2Px(headerAreaHeight+5)
		console.groupCollapsed('最終的な全体情報')
		console.log('drawnRange: ', drawnRange)
		console.log('hatsuwaObjs: ', hatsuwaObjs)
		console.log('hatsuwaGroups: ', hatsuwaGroups)
		console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
		console.log('rowElems: ', rowElems)
		console.log('行数: ', rowElems.length)
		console.log('dataBoxX: ', dataBoxX)
		console.groupEnd()
		console.log('-----データロード完了-----')
	}
}

// 1: 発話オブジェクト群[]を生成する関数
async function genHatsuwaObjs(_textContent) {
	console.groupCollapsed('genHatsuwaObjs')
	// TODO:macで出力されたファイルの改行コードは\nだけど、winは\r\n。これを確認する。
	let rows
	if (_textContent.includes('\r\n')) {
		// windows CR + LF(Carriage Return + Line Feed)
		rows = _textContent.split('\r\n')
	} else {
		// macOS X以降　LF(Line Feed)
		rows = _textContent.split('\n')
	}

	const rowNum = rows.length
	console.log('データ行の数: ', rowNum)
	// 発話オブジェクト群を生成
	hatsuwaObjs = rows
		.map((row, i) => {
			/*
			[.txtのrowの中身]
			1列目:CM_Utter??
			2列目:CM??
			3列目:発話開始時間（秒）
			4列目:発話終了時間（秒）
			5列目:発話内容（発話記号含む）			
			*/
			const cells = row.split('\t')
			// console.log('cells: ', cells)
			let o = {
				// ID: i + 1, //発話インデックス
				label: cells[0], // 発話ラベル
				speaker: cells[1], // 発話者
				start: Number(cells[2]), // 発話開始時間
				end: Number(cells[3]), // 発話終了時間
				text: cells[4], // 発話内容
			}

			// 沈黙だった場合の微調整
			if (o.speaker == '') {
				// 沈黙時間を小数第二位で四捨五入して、第一位までに
				let silentDuration = parseFloat(o.text.replace(/[()]/g, ''))
				silentDuration = Math.round(silentDuration * 10) / 10
				silentDuration = silentDuration.toFixed(1)
				o.text = silentDuration
				o.text = '(' + o.text + ')'
			} else {
				roundTextValues(o)
			}
			return o
		})
		.filter((o) => o.text)
	// 発話オブジェクト群から、「0.15秒未満の沈黙」を削除
	hatsuwaObjs = hatsuwaObjs.filter((o) => {
		if (o.speaker == '') {
			let silentDuration = parseFloat(o.text.replace(/[()]/g, ''))
			console.log('silentDuration: ', silentDuration)
			return silentDuration >= 0.15
		} else {
			return true
		}
	})
	// TODO:発話オブジェクト群から、silentオンリーの発話は先頭末尾に'(',')'がなければつける。

	// 発話オブジェクトを「発話開始時間」でソート
	hatsuwaObjs.sort((a, b) => a.start - b.start)
	hatsuwaObjs.forEach((obj, i) => (obj.ID = i + 1)) //発話インデックス（ソート後にやる）
	// console.log('hatsuwaObjs[0]: ', hatsuwaObjs[0])
	console.groupEnd()
}

// ククリ記号を一時的に別の文字に置き換える
// async function tempConvertKukuriMarks(_hatsuwaObjs) {
// 	console.groupCollapsed('ククリ記号を一時的に別文字に置換')
// 	_hatsuwaObjs.forEach(async (hatsuwaObj) => {
// 		console.log('hatsuwaObj: ', hatsuwaObj)
// 		await tempConvertKukuriMarksInHatsuwa(hatsuwaObj)
// 	})
// 	console.groupEnd()
// }

// 2: 発話オブジェクト群[]をグルーピングする
async function groupingHatsuwaObjs(_hatsuwaObjs) {
	console.groupCollapsed('発話オブジェクト群をグルーピング')
	// グループで最若の発話オブジェクトインデックス
	let groupStartIndex = 0
	doGrouping: for (let i = 0; i < hatsuwaObjs.length; i++) {
		console.log('groupStartIndex: ', groupStartIndex)
		console.log('i: ', i)
		if (i >= groupStartIndex) {
			// 発話グループ生成して、ひとつの発話オブジェクトいれとく
			let hatsuwaGroup = [hatsuwaObjs[i]]
			// この発話グループの発話オブジェクトのうち、Endがもっとも遅い値
			let maxEndInThisGroup = hatsuwaObjs[i].end
			// 次の発話objから
			for (let j = i + 1; j < hatsuwaObjs.length; j++) {
				// かぶりがあったら
				if (hatsuwaObjs[j].start < maxEndInThisGroup) {
					// グループにいれる
					hatsuwaGroup.push(hatsuwaObjs[j])
					// maxEndを更新
					maxEndInThisGroup = Math.max(maxEndInThisGroup, hatsuwaObjs[j].end)
					// さいご、かぶりあるなし判定なく、読み込み終わったら、hatsuwaGroupをhatsuwaGroupsにいれこみたい
					if (j == hatsuwaObjs.length - 1) {
						hatsuwaGroups.push(hatsuwaGroup)
						break doGrouping
					}
				}
				// かぶりなかったら
				else {
					// 発話グループ完成、グループ一覧に加える
					hatsuwaGroups.push(hatsuwaGroup)
					// グループの最若インデックスを更新
					groupStartIndex = j
					// console.log('かぶりなし。次ループのgroupStartIndex: ', groupStartIndex)
					// TODO:さいご、かぶりあるなし判定なく、読み込み終わったら、hatsuwaGroupをhatsuwaGroupsにいれこみたい
					if (j == hatsuwaObjs.length - 1) {
						break doGrouping
					} else {
						break
					}
				}
			}
		} else {
			// console.log('グループインデックスより小さいのでスルー')
		}
	}
	console.groupEnd()
	pushHatsuwaGroups(hatsuwaGroups)
}

// 3: 発話たちを描画する。
async function drawTranscript(_hatsuwaGroups, _fontSize, _drawnRange, _isAdjustedPosition) {
	/*TODO:		
	・globalTagIDはちゃんと「hatsuwaGroupsの何グループ目か」が必要：groupIndexとtempGroupIndexのつかいわけ（tempHatsuwaGroupsの何番目かではなく）
	・ただし、tempHatsuwaGroupsに削除とかすると、参照ゆえに元のhatsuwaGroupsからも削除されかねない。。
	*/
	console.groupCollapsed('drawTranscript()')
	console.log('_drawnRange: ', _drawnRange)
	let tempHatsuwaGroups = _hatsuwaGroups.slice(_drawnRange.sGroupID, _drawnRange.eGroupID + 1)
	console.log('tempHatsuwaGroups: ', tempHatsuwaGroups)

	// 現在の発話描画エリアの最下端位置(各発話グループの処理が終わるたび更新)
	// dataBoxWの定義を、行内最大文字数とフォントサイズによって決める。
	// 取得する
	let maxCharNumPerRow = 0
	if(_isAdjustedPosition){		
		maxCharNumPerRow = document.getElementById('charNumPerRow').value
	}else{
		document.getElementById('charNumPerRow').value = 50
		maxCharNumPerRow = 50
	}
		
	let dataBoxW = maxCharNumPerRow * fontSize

	console.log('maxCharNumPerRow: ', maxCharNumPerRow)
	console.log('dataBoxW: ', dataBoxW)
	// 発話グループそれぞれにおいて
	tempHatsuwaGroups.forEach((hatsuwaGroup, tempGroupIndex) => {
		console.groupCollapsed(`発話グループ${tempGroupIndex}`)
		console.log(`【グループ${tempGroupIndex}】`, hatsuwaGroup)
		// (1) hatsuwaTagSpansの前準備
		hatsuwaTagSpans.push([])
		hatsuwaGroup.forEach((hatsuwa, i) => {
			console.log(`発話${i}: `, hatsuwa.text)
			//グループ内の発話の数だけ、空配列セット
			hatsuwaTagSpans[tempGroupIndex].push([])
		})

		// (2) 発話から子発話に生成・分割（二重配列）
		let groupIndex = tempGroupIndex + _drawnRange.sGroupID
		let tagArrays = genHatsuwaTags(hatsuwaGroup, groupIndex)
		console.log('tagArrays: ', tagArrays)

		// (3) 各発話の「先頭タグ」に'bracketID'フィールドを割り振る
		let bracketID = 1
		for (let i = 0; i < tagArrays.length; i++) {
			// 発話iの先頭（=tagArrays[0].text[0]）には[がある？
			console.log('tagArrays.length: ', tagArrays.length)
			if (tagArrays[i][0].text[0] == '[') {
				if (i < tagArrays.length - 1) {
					// まだbracketIDプロパティをもたないものだけ
					if (!('bracketID' in tagArrays[i][0])) {
						console.log('この発話の先頭タグは、bracketIDをもってません')
						// あれば、
						for (let j = 1; j < tagArrays.length; j++) {
							// 続く発話たち(tagArrays[i+j].text[0]の発話開始時間と同じかチェック
							if (!hatsuwaGroup[i + j]) {
								break
							} else if (hatsuwaGroup[i + j].start - hatsuwaGroup[i].start < hatsuwaTimeResolution) {
								tagArrays[i][0].bracketID = bracketID
								tagArrays[i + j][0].bracketID = bracketID
							} else {
								tagArrays[i][0].bracketID = bracketID
								bracketID += 1
								break
							}
						}
					} else {
						console.log('この発話の先頭タグは、bracketIDをすでにもってます')
					}
				}
				// グループ最終発話
				else {
					if (!('bracketID' in tagArrays[i][0])) {
						tagArrays[i][0].bracketID = bracketID
					}
				}
			} else {
				// 次ループへ
			}
		}
		// (4) 各発話の「非先頭タグ」に'bracketID'フィールドを割り振る（同発話内の直前タグのbracketIDをインクリメントしたバージョンを割り振る)
		tagArrays.forEach((tagArray) => {
			tagArray.forEach((tag, i) => {
				// 発話内先頭タグなら
				if (i == 0) {
					// ブラケットIDをもってなければ、bracketID = 0を足す
					if (!('bracketID' in tag)) {
						tag.bracketID = 0
					}
					// ブラケットIDをもってれば、なんもしない
				}
				// 発話内先頭以降タグなら
				else {
					// ブラケットIDをもってないはずなので、直前tagのブラケットIDに++する
					tag.bracketID = tagArray[i - 1].bracketID + 1
				}
			})
		})

		// (5) ブラケットグループ化する（同じbracketIDのtagどうしをまとめた配列）
		const tempTagArray = tagArrays.flatMap((row) => row) // tagArraysを、二次元配列から一次元配列に変えて、
		// console.log('tempTagArray: ', tempTagArray)
		const bracketsGroup = tempTagArray.reduce((result, obj) => {
			const group = result.find((group) => group[0].bracketID === obj.bracketID)
			if (group) {
				group.push(obj)
			} else {
				result.push([obj])
			}
			return result
		}, [])
		console.log('bracketsGroup: ', bracketsGroup)

		// 位置調整アリの場合
		if (_isAdjustedPosition) {
			// (6) 各ブラケットグループの開始X位置を決定してゆく
			let startX = 0
			bracketsGroup.forEach((tagsInThisBracketGroup, i) => {
				console.groupCollapsed(`ブラケットグループ${i}の開始X位置決定`)
				console.log('bracketID: ', i, ' (グループ内での[のインデックス)')
				console.log('tagsInThisBracketGroup: ', tagsInThisBracketGroup)
				const spansOfThisBracketGroup = [] //一時生成であり、最終的には消す

				// (6-1) このブラケットグループのspanタグを一時的に描画する
				tagsInThisBracketGroup.forEach((tag) => {
					const span = genSpan(document, dataArea, tag.text, tag.id, fontSize, startX)
					spansOfThisBracketGroup.push(span)
				})
				console.log('spansOfThisBracketGroup: ', spansOfThisBracketGroup)

				// (6-2) spanタグの行分割処理（画面右端オーバーしないよう。）
				let maxTagXInThisBracketGroup = 0 // このbracketのグループの<span>タグ群の末尾の最右位置
				spansOfThisBracketGroup.forEach((span, j) => {
					// spanの幅
					const spanW = span.getBoundingClientRect().width // NOTE:下のやりかただと、12pxぶん違いがでる。。。？
					// console.log('spanW: ', spanW)
					// 残りの画面幅（px）
					const remainedHaba = dataBoxW - startX
					// console.log('remainedHaba: ', remainedHaba)
					// この行にはあと何文字ぶんの余白が残っている？
					const charNumFirstRow = Math.floor(remainedHaba / fontSize)
					// console.log('この行にはあと何文字ぶん余白？（charNumFirstRow）: ', charNumFirstRow)

					// spanをnコのテキストへと分割(DOM操作。発話特殊記号にかんする境界処理はsplitSpanにて。)
					const splittedSpanTexts = splitSpan(document, span, charNumFirstRow, maxCharNumPerRow, tagsInThisBracketGroup[j])
					console.log(`${span.innerText}は以下${splittedSpanTexts.length}つに分割される↓`)
					console.log('splittedSpanTexts: ', splittedSpanTexts)
					// const id = span.className.split(' ')[1] //id。例：(10-4-1)みたいな。おおもとのspanは削除しちゃうから、先にidだけとっとく
					const id = span.getAttribute('globalTagID')
					console.log('id: ', id)
					const hatsuwaID = id.split('-')[1]

					splittedSpanTexts.forEach((splittedTag, k) => {
						//分割された断片テキストの1番目は直前タグの末尾から書き始め、改行した２番目以降は最左から書き始めるってだけ。
						const tagX = k == 0 ? startX + labelBoxW : labelBoxW
						const e = genSpan(document, dataArea, splittedTag, id, fontSize, tagX)
						e.setAttribute('fragmentID', k)
						// テキストからspanタグを描画
						// 全体の発話span配列に追加する
						hatsuwaTagSpans[tempGroupIndex][hatsuwaID].push(e)
						// 分割してできた最終タグが、maxケツXの候補になる！
						// 分割された各断片テキストのうち、末尾が最右にあるものの末尾pxを。
						const tagID = id.split('-')[2]
						if (Number(tagID) < tagArrays[hatsuwaID].length - 1) {
							if (k == splittedSpanTexts.length - 1) {
								const xx = e.getBoundingClientRect().right - dataAreaStyle.x
								console.log(`splitTag${k}のright`, xx)
								maxTagXInThisBracketGroup = Math.max(maxTagXInThisBracketGroup, xx)
							}
						}
					})
				})
				// (6-3)「次bracketグループの描画開始X位置」を更新する(現bracketグループの末尾に合わせる)！
				startX = maxTagXInThisBracketGroup - labelBoxW
				// console.log('startX: ', startX)

				// (6-4)spansOfThisBracketGroup[]は削除
				spansOfThisBracketGroup.forEach((span) => span.remove())
				console.groupEnd()
			})
		}
		// 位置調整ナシの場合
		else {
			hatsuwaGroup.forEach((hatsuwaObj, i) => {
				const tagX = labelBoxW
				const span = genSpan(document, dataArea, hatsuwaObj.text, `${groupIndex}-${i}-0`, fontSize, tagX)
				hatsuwaTagSpans[tempGroupIndex][i].push(span)
			})
		}

		console.log('dataAreaStyle: ', dataAreaStyle)
		console.groupEnd()
		// console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
	})

	// (7) 各spanのY位置を決定
	// この段階で、各spanに'rowID'属性（spanが属する行番号）を追加
	console.groupCollapsed('spanのY位置決定処理（rowの子要素にするのもここ）')
	accumRowCount = 0 //累積行数
	// 位置調整アリの場合
	if (_isAdjustedPosition) {
		hatsuwaTagSpans.forEach((spansOfGroup, i) => {
			console.groupCollapsed(`発話グループ${i}のspan処理`)
			spansOfGroup.forEach((spansOfHatsuwa, j) => {
				console.groupCollapsed(`発話${j}: ${tempHatsuwaGroups[i][j].text}`)
				let rowNum = 0
				tempHatsuwaGroups[i][j].startRow = accumRowCount
				spansOfHatsuwa.forEach((span, k) => {
					// (パタンA)： いっっちばんさいしょタグspanの場合
					if (i == 0 && j == 0 && k == 0) {
						console.log('データの最初です')
						span.setAttribute('rowID', accumRowCount)
						const y = 0
						let row = genRowDiv(document, dataArea, dataBoxW, y, accumRowCount, fontSize * lineHeightRatio)
						let dataBox = row.querySelector('.dataBox')
						console.log('dataBox: ', dataBox)
						dataBox.appendChild(span)
						// row.appendChild(span)
						rowElems.push(row)
						rowNum += 1
					}
					// (パタンB): グループ内最初発話かつ最初タグの場合・・・直前グループ最終発話かつ最終タグspanのbottomにあわせる
					else if (j == 0 && k == 0) {
						accumRowCount += 1
						console.log('グループ内の最初発話の最初タグ')
						const hatsuwaNum = hatsuwaTagSpans[i - 1].length
						const spanNum = hatsuwaTagSpans[i - 1][hatsuwaNum - 1].length						
						const y = accumRowCount * fontSize * lineHeightRatio
						span.style.top = num2Px(y)
						span.setAttribute('rowID', accumRowCount)
						let row = genRowDiv(document, dataArea, dataBoxW, y, accumRowCount, fontSize * lineHeightRatio)
						let dataBox = row.querySelector('.dataBox')
						console.log('dataBox: ', dataBox)
						dataBox.appendChild(span)
						rowElems.push(row)
						rowNum += 1
					}
					// (パタンC): 発話内最初のタグの場合・・・直前発話の最終タグspanのbottomにあわせる
					else if (k == 0) {
						accumRowCount += 1
						console.log('発話内最初タグ')
						const spanNum = spansOfGroup[j - 1].length
						const y = accumRowCount * fontSize * lineHeightRatio
						span.style.top = num2Px(y)
						span.setAttribute('rowID', accumRowCount)
						let row = genRowDiv(document, dataArea, dataBoxW, y, accumRowCount, fontSize * lineHeightRatio)
						let dataBox = row.querySelector('.dataBox')
						console.log('dataBox: ', dataBox)
						dataBox.appendChild(span)
						rowElems.push(row)
						rowNum += 1
					}
					// (パタンD): spanXが0にきてる場合・・・直前タグのbottomにあわせる
					else if (px2Num(span.style.left) == labelBoxW) {
						accumRowCount += 1
						const y = accumRowCount * fontSize * lineHeightRatio
						span.style.top = num2Px(y)
						span.setAttribute('rowID', accumRowCount)
						let row = genRowDiv(document, dataArea, dataBoxW, y, accumRowCount, fontSize * lineHeightRatio)
						let dataBox = row.querySelector('.dataBox')
						console.log('dataBox: ', dataBox)
						dataBox.appendChild(span)
						rowElems.push(row)
						rowNum += 1
					}
					// (パタンE): それ以外の場合・・・直前タグのtopにあわせる（列車的連結）
					else {
						const y = accumRowCount * fontSize * lineHeightRatio
						span.style.top = num2Px(y)
						span.setAttribute('rowID', accumRowCount)
						let dataBox = rowElems[rowElems.length - 1].querySelector('.dataBox')
						dataBox.appendChild(span)
						// rowElems[rowElems.length-1].appendChild(span)
					}
				})
				console.log('この発話の行数: ', rowNum)
				tempHatsuwaGroups[i][j].rowNum = rowNum
				// tempHatsuwaGroups[i][j].endRow = accumRowCount
				console.groupEnd()
			})
			const lineY = spansOfGroup[0][0].getBoundingClientRect().top - dataAreaStyle.top
			var horizontalLine = document.createElement('div')
			// console.log('水平線のlineY: ', lineY)
			horizontalLine.style.top = num2Px(lineY)
			horizontalLine.className = 'group-line'
			dataArea.appendChild(horizontalLine)
			console.groupEnd()
		})
	}
	// 位置調整ナシの場合（粗表示）
	else {
		// 各グループ
		hatsuwaTagSpans.forEach((spansOfGroup, i) => {
			console.groupCollapsed(`発話グループ${i}のspan処理`)
			let y = 0
			// 各発話
			spansOfGroup.forEach((spansOfHatsuwa, j) => {
				console.groupCollapsed(`発話${j}: ${tempHatsuwaGroups[i][j].text}`)
				console.log('accumRowCount: ', accumRowCount)
				y = accumRowCount * fontSize * lineHeightRatio
				let row = genRowDiv(document, dataArea, dataBoxW, y, accumRowCount, fontSize * lineHeightRatio)
				let dataBox = row.querySelector('.dataBox')
				// let dataBox = rowElems[rowElems.length - 1].querySelector('.dataBox')
				console.log('dataBox: ', dataBox)
				tempHatsuwaGroups[i][j].startRow = accumRowCount
				tempHatsuwaGroups[i][j].rowNum = 1
				// 各span
				spansOfHatsuwa.forEach((span, k) => {
					// 発話が変われば、accumRowCount++
					console.log('spanのテキスト: ', span.textContent)
					console.log('このspanのrowID: ', accumRowCount)
					const y = accumRowCount * fontSize * lineHeightRatio
					span.style.top = num2Px(y)
					span.setAttribute('rowID', accumRowCount)
					dataBox.appendChild(span)
				})
				rowElems.push(row)
				accumRowCount += 1
				// tempHatsuwaGroups[i][j].endRow = accumRowCount
				console.groupEnd()
			})

			const lineY = spansOfGroup[0][0].getBoundingClientRect().top - dataAreaStyle.top
			var horizontalLine = document.createElement('div')
			// console.log('水平線のlineY: ', lineY)
			horizontalLine.style.top = num2Px(lineY)
			horizontalLine.className = 'group-line'
			dataArea.appendChild(horizontalLine)
			console.groupEnd()
		})
	}

	console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
	console.groupEnd()
	// 更新
	requestAnimationFrame(function () {})
	console.groupEnd()
}

// 4: IDとSpeakerのラベルを左にDOM描画する関数
async function drawIDandSpeaker(_hatsuwaGroups, _drawnRange, _fontSize) {
	// drawLabel()を、グローバル位置Xを引数にとるようにして、各ラベルの位置を指定する	
	// "headerlabel" クラスをもつ要素を一括で取得
	const elements = document.querySelectorAll('.headerlabel')
	// 取得した全ての要素を削除
	elements.forEach((element) => {
		element.remove()
	})
	// 行ラベル表示
	drawHeaderLabel(document, headerArea, 0, 0, 'ID', _fontSize) //ID
	// (1) ヘッダを描く
	// 話者
	const speakerLabelX = _fontSize * 3
	drawHeaderLabel(document, headerArea, speakerLabelX, 0, 'Speaker', _fontSize) // speaker
	// 矢印
	// const arrowLabelX = _fontSize * 6
	const textLabelX = _fontSize * 8
	drawHeaderLabel(document, headerArea, textLabelX, 0, 'Text', _fontSize) // text

	// console.log('dataAreaStyle: ', dataAreaStyle)	

	// (2) 列ラベルを発話ごとに処理
	let tempHatsuwaGroups = _hatsuwaGroups.slice(_drawnRange.sGroupID, _drawnRange.eGroupID + 1)
	accumRowCount = 0
	tempHatsuwaGroups.forEach((hatsuwaGroup, i) => {
		hatsuwaGroup.forEach((hatsuwaObj, j) => {
			for (let k = 0; k < hatsuwaObj.rowNum; k++) {
				// 行連番を表示
				const idColX = 0
				const idColY = _fontSize * lineHeightRatio * (accumRowCount + k)

				const id = formatNumber(accumRowCount + k + 1) //NOTE:この+1は、ユーザからすると「IDが0からだとヘンだから1からにする」ってだけ。
				const rowID = id - 1
				// const id = accumRowCount + k + 1
				// TODO:親となるdiv
				// let labelBox = document.createElement('div')
				// console.log('rowElems[rowID]: ', rowElems[rowID])
				let labelBox = genLabelBox(document, rowElems[rowID])
				// labelBoxをrowにapppendせねば
				const label = drawLabel(document, labelBox, idColX, idColY, id, rowID, _fontSize)

				// 矢印用のボックスを用意
				// let arrowLabel = drawLabel(document, labelBox, )

				idLabels.push(label)
				// 「話者ラベル」を表示（発話の最初行だけ）
				if (k == 0) {
					const speakerColX = speakerLabelX
					const speakerColY = _fontSize * lineHeightRatio * accumRowCount
					const speaker = hatsuwaObj.speaker
					const label = drawSpeakerLabel(document, labelBox, speakerColX, speakerColY, speaker, rowID, hatsuwaObj.ID, _fontSize)
					speakerLabels.push(label)
				}
				// rowElems[rowID].appendChild(labelBox)
				rowElems[rowID].insertBefore(labelBox, rowElems[rowID].firstChild)
			}
			accumRowCount += hatsuwaObj.rowNum
		})
	})
	// console.log('最終的に描画される行数: ', accumRowCount)
}

// 発話やIDやSpeakerを描画する
async function positionAdjust(_isAdjustedPosition) {
	await reload()
	labelBoxW = fontSize * 7
	await drawTranscript(hatsuwaGroups, fontSize, drawnRange, _isAdjustedPosition, null)
	drawIDandSpeaker(hatsuwaGroups, drawnRange, fontSize)
	// spanやラベルにイベントを追加
	await addMouseEvents()

	// TODO:heightを更新
	// 1:hatsuwaTagSpans[][][]の最終要素のbottomを取得して
	const lastDataBottom = accumRowCount * fontSize * lineHeightRatio
	transcriptArea.style.height = num2Px(lastDataBottom - headerAreaHeight)
	// headerArea.style.height = num2Px(headerAreaHeight)
	dataArea.style.height = num2Px(lastDataBottom)
	scrollableDivArea.style.top = num2Px(headerAreaHeight + 5)
	console.groupCollapsed('最終的な全体情報')
	console.log('drawnRange: ', drawnRange)
	console.log('hatsuwaObjs: ', hatsuwaObjs)
	console.log('hatsuwaGroups: ', hatsuwaGroups)
	console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
	console.log('rowElems: ', rowElems)
	console.log('行数: ', rowElems.length)
	console.log('dataBoxX: ', dataBoxX)
	console.groupEnd()

	console.group('positionAdjust実行')
	console.groupEnd()
}

// 5: マウスイベントを追加
async function addMouseEvents() {
	let clickTimeout = null
	// 発話spanタグとrowの選択
	for (let group of hatsuwaTagSpans) {
		for (let hatsuwa of group) {
			for (let span of hatsuwa) {
				// マウスオン
				span.addEventListener('mouseover', () => {
					span.style.backgroundColor = mouseon4Label
					let rowID = span.getAttribute('rowID')
					let row = rowElems[rowID]
					row.style.backgroundColor = mouseon4HatsuwarowColor
				})
				// マウスリーブ
				span.addEventListener('mouseout', () => {
					span.style.backgroundColor = 'transparent'
					let rowID = span.getAttribute('rowID')
					let row = rowElems[rowID]
					let isSelectedRow = row.getAttribute('selected')
					if (isSelectedRow) {
						row.style.backgroundColor = selectedHatsuwarowColor
					} else {
						row.style.backgroundColor = 'transparent'
					}
				})
				// マウスダウン
				span.addEventListener('mousedown', (e) => {
					// console.groupCollapsed('spanのマウスダウン処理')
				})
				// マウスムーブ
				span.addEventListener('mousemove', () => {
					// shift + マウスダウン中だったら、行の色を変える。
				})				
				// クリック（NOTE:マウスアップのあとに起こる）
				span.addEventListener('click', (e) => {
					console.groupCollapsed('spanのクリック処理')
					console.log(span)
					// console.log('selectionStartTag: ', selectionStartTag)
					// console.log('selectionEndTag: ', selectionEndTag)
					/*
					【単一タグの該当再生時間の計算方法】
					選択タグの`globalTagID = i-j-k`と`発話objのID`取得しておき（`hatsuwaObjs[l]`とする）
					- 再生開始時間：、`hatsuwObjs[l+k].start`
					- 再生終了時間：`globalTagID = i-j-(k+1)`なるタグがあるかどうかを判定し、
						- あれば、`hatsuwaObjs[l+k].start`
						- なければ、`hatsuwaObjs[l].end`					
					*/

					/*
					【複数タグ選択の再生時間の計算方法】
					shiftなしでタグクリックしたら、自動的に、selectionStartTagとする
					shiftありでタグクリックしたら、
					- selectionStartTagがすでにあれば
						それをselectionEndTagとし、
						処理のあとに、selectionStartTagとselectionEndTagを両方とも破棄
					- selectionStartTagなければ、なにもしない										
					*/
					// 非Shiftキーのとき
					if (!e.shiftKey) {
						// not Shiftキーのときは、これを「スタートタグ」に設定
						selectionEndTag = null
						selectionStartTag = span // ダウンとアップを記録するだけで良い。そのあいだのspanタグ全部取得するから。

						let globalTagID = span.getAttribute('globalTagID')
						console.log('globalTagID: ', globalTagID)
						let rowID = span.getAttribute('rowID')
						console.log('rowID: ', rowID)
						let groupID = globalTagID.split('-')[0]
						let hatsuwaIDInGroup = globalTagID.split('-')[1]
						let hatsuwaObjOwningThisTag = hatsuwaGroups[groupID][hatsuwaIDInGroup]
						console.log('↓↓↓この発話objの傘下です↓↓↓')
						console.table(hatsuwaObjOwningThisTag)

						let hatsuwaIDOwningThisTagZeroStart = hatsuwaObjOwningThisTag.ID - 1
						// console.log('hatsuwaIDOwningThisTagZeroStart: ', hatsuwaIDOwningThisTagZeroStart)
						let tagIDinThisHatsuwa = parseInt(globalTagID.split('-')[2])
						// console.log('tagIDinThisHatsuwa: ', tagIDinThisHatsuwa)

						video.startTime = hatsuwaObjs[hatsuwaIDOwningThisTagZeroStart + tagIDinThisHatsuwa].start
						console.log('video.startTime: ', video.startTime)
						video.currentTime = video.startTime
						// 同発話内で、このタグの後続のタグはあるか？
						let nextTagInThisHatsuwa = document.querySelector(`[globalTagID="${groupID}-${hatsuwaIDInGroup}-${tagIDinThisHatsuwa + 1}"]`)
						// console.log('nextTagInThisHatsuwa: ', nextTagInThisHatsuwa)
						video.endTime = nextTagInThisHatsuwa
							? hatsuwaObjs[hatsuwaIDOwningThisTagZeroStart + 1 + tagIDinThisHatsuwa].start
							: hatsuwaObjOwningThisTag.end
						console.log('video.endTime: ', video.endTime)

						// spanタグの選択状態（selected属性）を反転
						let classList = span.classList
						let selectedSpans = document.getElementsByClassName('selected')
						if (!classList.contains('selected')) {
							Array.from(selectedSpans).forEach((spn) => {
								spn.classList.remove('selected')
								spn.style.color = ''
							})
							console.log('非選択状態から選択状態へ')
							classList.add('selected')
							span.style.color = selected4Hatsuwatag
						} else {
							Array.from(selectedSpans).forEach((spn) => {
								spn.classList.remove('selected')
								spn.style.color = ''
							})
						}						
						// このspanタグを含む行の選択状態を変更
						rowElems.forEach((row, i) => {
							// ドラッグ範囲内の行なら選択状態に
							if (i == rowID) {
								console.log(`row${i}が選択されたので色づけます`)
								row.setAttribute('selected', true)
								row.style.backgroundColor = selectedHatsuwarowColor
							}
							// 範囲外なので非選択状態にする
							else {
								row.removeAttribute('selected')
								row.style.backgroundColor = 'transparent'
							}
						})						
						// var style = window.getComputedStyle(span)						
					}
					// Shiftキー押してて、かつstartTagがあるときだけ
					else if (e.shiftKey && selectionStartTag) {
						/*
						いま選択したタグ（span）の時間が、
						- sタグよりも早い・・・sタグをeタグにいれ、いまタグをsタグにいれてから、処理
						- (sタグそのもの・・・なんもしない)
						- sタグからeタグのあいだ・・・eタグをいまタグにしてから、処理
						- (eタグそのもの・・・なんもしない)
						- （eタグあり ∩）eタグよりも遅い・・・eタグをsタグにいれ、いまタグをeタグにしてから、処理
						*/
						selectionEndTag = span						
						let sRowID = Number(selectionStartTag.getAttribute('rowID'))						
						let eRowID = Number(selectionEndTag.getAttribute('rowID'))						
						// 下から上にドラッグしてた場合、上下範囲逆転
						if (sRowID > eRowID) {
							let tempSRowID = sRowID
							sRowID = eRowID
							eRowID = tempSRowID
						}
						console.log('sRowID: ', sRowID)
						console.log('eRowID: ', eRowID)

						let sGlobalTagID = selectionStartTag.getAttribute('globalTagID')
						let eGlobalTagID = selectionEndTag.getAttribute('globalTagID')
						// 選択順のせいでsがeより大きかったら、両者を入れ替える
						if (parseInt(sGlobalTagID) > parseInt(eGlobalTagID)) {
							;[sGlobalTagID, eGlobalTagID] = [eGlobalTagID, sGlobalTagID]
						}
						console.log('sGlobalTagID: ', sGlobalTagID)
						// console.log('eGlobalTagID: ', eGlobalTagID)
						drawnRange.sGroupID = Number(sGlobalTagID.split('-')[0])
						drawnRange.eGroupID = Number(eGlobalTagID.split('-')[0])
						console.log('drawnRange: ', drawnRange)

						// 部分再生の時間をセット↓
						let sObj = getHatsuwaObjFromSpan(selectionStartTag, hatsuwaGroups)
						let eObj = getHatsuwaObjFromSpan(selectionEndTag, hatsuwaGroups)
						video.startTime = sObj.start						
						video.currentTime = video.startTime
						video.endTime = eObj.end
						console.log('video.startTime: ', video.startTime)
						console.log('video.endTime: ', video.endTime)
						// ;(selectionStartTag = null), (selectionEndTag = null)						
						// 行選択状態の変更
						console.log('行群の色付け変えます')
						rowElems.forEach((row, i) => {
							// ドラッグ範囲内の行なら選択状態に
							if (i >= sRowID && i <= eRowID) {
								console.log(`row${i}は範囲内なので色付けます`)
								row.setAttribute('selected', true)
								row.style.backgroundColor = selectedHatsuwarowColor
							}
							// 範囲外なので非選択状態にする
							else {
								console.log(`row${i}は範囲外です！！！`)
								row.removeAttribute('selected')
								row.style.backgroundColor = 'transparent'
							}
						})						
						console.groupEnd()
					}

					console.groupEnd()
				})

				// ダブルクリックでコメントを追加
				span.addEventListener('contextmenu', () => {
					event.preventDefault()
					let globalTagID = span.getAttribute('globalTagID')
          pushSpans()
          addComment(globalTagID)
				})
			}
		}
	}
	// IDラベルの選択
	for (let [i, label] of idLabels.entries()) {
			

		// マウスオン
		label.addEventListener('mouseover', () => {						
			label.style.backgroundColor = mouseon4Label
			let rowID = label.getAttribute('rowID')
			let row = rowElems[rowID]
			row.style.backgroundColor = mouseon4HatsuwarowColor
		})
		// マウスリーブ
		label.addEventListener('mouseout', () => {			
			label.style.backgroundColor = 'transparent'
			let rowID = label.getAttribute('rowID')
			let row = rowElems[rowID]
			let isSelectedRow = row.getAttribute('selected')
			if (isSelectedRow) {
				row.style.backgroundColor = selectedHatsuwarowColor
			} else {
				row.style.backgroundColor = 'transparent'
			}
			// TODO:左側のマーク削除
		})
		// クリック
		label.addEventListener('click', async (e) => {
			console.log('clickされたIDラベル: ', label)
			// ダブルクリック
			if (clickTimeout) {
				clearTimeout(clickTimeout) // シングルクリックをキャンセル
				clickTimeout = null
				console.log('IDラベルがダブルクリックされました')
				

				// (1) クリックしたlabelが属するrowを取得（おじいちゃん要素）
				const grandparentDiv = label.parentElement?.parentElement
				if (!grandparentDiv) return

				// (2) row傘下のhatsuwaSpanTagをひとつ取得
				const span = grandparentDiv.querySelector('span.tag')
				console.log('span: ', span)
				if (!span) return

				// (3) hatsuwaSpanTagの'globalTagID'(i-j-k)を取得
				const globalTagID = span.getAttribute('globalTagID')
				console.log('globalTagID: ', globalTagID)
				if (!globalTagID) return

				// (4) 該当するhatsuwaObjを取得
				const [j, k, l] = globalTagID.split('-').map(Number)
				const clickedHatsuwaObj = hatsuwaGroups[j][k]
				// (5) 該当obj直後に空白obj追加 or 該当obj削除
				if(clickedHatsuwaObj.text != ''){
					// (5a) hatsuwaGroups[i][j+1]として、空っぽhatsuwaObjを挿入
					if (isNaN(j) || isNaN(k)) return
					const hatsuwaObj = {
						label: '', // 発話ラベル
						speaker: '', // 発話者
						start: hatsuwaGroups[j][k].start, // 発話開始時間
						end: hatsuwaGroups[j][k].end, // 発話終了時間
						text: '', // 発話内容
					}
					hatsuwaGroups[j].splice(k + 1, 0, hatsuwaObj)
				}else{
					// (5b) 該当空行の削除
					hatsuwaGroups[j].splice(k, 1)
				}
				// TODO:ここでもいちどdrawTranscript()する
				await positionAdjust(isAdjustedPosition)					


				return
			}


				
			

			clickTimeout = setTimeout(() => {
				clickTimeout = null
				console.log('クリックされました！')
			}, 300) // 300ms 以内に再度クリックされたらダブルクリックと判定

			// let rowID = label.getAttribute('rowID')
			// console.log('rowID: ', rowID)
			// const labelBox =
			// このrowIDのlabelBoxに矢印を追加する
			// const x = speakerLabels[i].getBoundingClientRect().left
			// console.log('xxx: ', xxx)
			console.log('IDラベルのindex: ', i)
			// const y = i * fontSize * lineHeightRatio
			const y = 0 //NOTE:yは、この行（label）のローカルで良い。addArrow参照。
			const arrows = label.querySelectorAll(`.arrow`)
			console.log('arrows: ', arrows)
			if (arrows.length > 0) {
				deleteArrow(label, arrows)
			} else {
				addArrow(document, label, fontSize * 1.5, 15, y)
			}
		})
		// ダブルクリック
		label.addEventListener('dblick', () => {
			e.preventDefault() // デフォルトの動作を防ぐ（ブラウザのダブルクリック動作対策）
			
		})
		
	}
	// speakerラベルの選択
	for (let label of speakerLabels) {
		// マウスオン
		label.addEventListener('mouseover', () => {
			label.style.backgroundColor = mouseon4Label
			let rowID = label.getAttribute('rowID')
			let row = rowElems[rowID]
			row.style.backgroundColor = mouseon4HatsuwarowColor
		})
		// マウスリーブ
		label.addEventListener('mouseout', () => {
			label.style.backgroundColor = 'transparent'
			let rowID = label.getAttribute('rowID')
			let row = rowElems[rowID]
			let isSelectedRow = row.getAttribute('selected')
			if (isSelectedRow) {
				row.style.backgroundColor = selectedHatsuwarowColor
			} else {
				row.style.backgroundColor = 'transparent'
			}
		})
		// クリック（発話選択して、再生時間セット）
		label.addEventListener('click', () => {
			console.log('clickされたspakerラベル: ', label)
			// labelの「hatsuwaID」属性値を取得し、
			const hatsuwaID = label.getAttribute('hatsuwaID')
			const hatsuwaID_zeroIndex = hatsuwaID - 1
			// console.log('hatsuwaID_zeroIndex: ', hatsuwaID_zeroIndex)
			// hatsuwaObjsからそれの.startと.endをそれぞれ取得し、セット（idに-1してる）
			// console.log('選択した発話obj: ', hatsuwaObjs[hatsuwaID_zeroIndex])
			video.startTime = hatsuwaObjs[hatsuwaID_zeroIndex].start
			// console.log('video.startTime: ', video.startTime)
			video.currentTime = video.startTime
			video.endTime = hatsuwaObjs[hatsuwaID_zeroIndex].end
			// console.log('video.endTime: ', video.endTime)
		})
	}
}

// エリアのサイズ調整
async function resize() {
	console.groupCollapsed('リサイズ関数()')
	console.log('window.innerWidth: ', window.innerWidth)

	// NOTE:外側の要素からサイズ決定していく（データによらないサイズ情報。）

	// (0) ウィンドウサイズ変更
	windowSize.w = window.innerWidth
	windowSize.h = window.innerHeight
	console.log('windowSize: ', windowSize)

	// (1) transcriptAreaとその子scrollableDivAreaのサイズ（ウィンドウサイズに応じて）
	transcriptArea.style.display = 'block'
	transcriptArea.style.width = num2Px(window.innerWidth)
	transcriptAreaStyle = transcriptArea.getBoundingClientRect()
	scrollableDivArea.style.margin = num2Px(scrollableDivAreaMargin)
	scrollableDivArea.style.width = num2Px(window.innerWidth - 2 * scrollableDivAreaMargin) //-20はtranscriptAreaのm
	scrollableDivAreaStyle = scrollableDivArea.getBoundingClientRect()

	// (2) dataAreaサイズを
	dataArea.style.margin = num2Px(dataAreaMargin)
	dataArea.style.width = num2Px(scrollableDivAreaStyle.width - 2 * dataAreaMargin)
	dataAreaStyle = dataArea.getBoundingClientRect()
	// console.log('dataAreaStyle: ', dataAreaStyle)
	// console.log('dataAreastyle.width: ', dataArea.style.width)
	// console.log('dataBoxX: ', dataBoxX)

	// (3) headerAreaサイズ
	// headerArea.style.margin = num2Px(dataAreaMargin)
	// headerArea.style.width = num2Px(dataAreaStyle.width)
	headerAreaStyle = headerArea.getBoundingClientRect()
	// console.log('scrollableDivAreaStyle.margin: ', scrollableDivArea.style.padding)

	// ビデオをリサイズ（scrollableDivAreaにハバをあわせる）
	const videoContainer = document.getElementById('videoContainer')
	// videoContainer.style.width = num2Px(window.innerWidth)
	// videoContainer.style.height = num2Px(window.innerWidth / videoAspectRatio)

	// videoContainer.style.width = num2Px(scrollableDivAreaStyle.width)
	videoContainer.style.height = num2Px(scrollableDivAreaStyle.width / videoAspectRatio)

	console.groupEnd()
}

// データのリロード
async function reload() {
	// // 同期ver
	// // dataAreaのすべてのDOM削除
	// while (dataArea.firstChild) {
	// 	dataArea.removeChild(dataArea.firstChild)
	// }
	// 非同期ver
	while (dataArea.firstChild) {
		dataArea.firstChild.remove()
		await new Promise((resolve) => setTimeout(resolve, 0)) // 非同期処理の待機
	}

	// 初期化
	hatsuwaTagSpans = []
	idLabels = []
	speakerLabels = []
	rowElems = []
}



// イベントの定義
window.addEventListener('DOMContentLoaded', () => {
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
					// main(files[0])
          textFile = files[0]
				} else if (fileType.startsWith('video/')) {
					// loadVideo(files[0])
          videoFile = files[0]
				}
				ddarea.classList.remove('ddefect')
			},
		}
		Object.keys(ddEvent).forEach((e) => {
			ddarea.addEventListener(e, ddEvent[e])
			document.body.addEventListener(e, ddEvent[e])
		})
	})
  
  document.getElementById('inputTextFileButton').addEventListener('click', function(event) {
    event.preventDefault();  // デフォルトのリンククリック動作をキャンセル
    document.getElementById('TextFileInput').click();  // 隠れているファイルインプットをクリックする
  });
  
  document.getElementById('TextFileInput').addEventListener('change', function(event) {
    var file = event.target.files[0];  // 選択されたファイルを取得
    if (file) {
      const fileType = file.type
      if (fileType == 'text/plain') {
        // main(file)
        textFile = file
      } else {
        alert("テキストファイルを選択してください。")
      }
    }
  });

  document.getElementById('inputVideoFileButton').addEventListener('click', function(event) {
    event.preventDefault();  // デフォルトのリンククリック動作をキャンセル
    document.getElementById('VideoFileInput').click();  // 隠れているファイルインプットをクリックする
  });
  
  document.getElementById('VideoFileInput').addEventListener('change', function(event) {
    var file = event.target.files[0];  // 選択されたファイルを取得
    if (file) {
      const fileType = file.type
      if (fileType.startsWith('video/')) {
        // loadVideo(file)
        videoFile = file
      } else {
        alert("ビデオファイルを選択してください。")
      }
    }
  });

  document.getElementById('goButton').addEventListener('click', function(e) {
    e.preventDefault();
    // divのdisplayプロパティを変更して表示
    var next = document.getElementById('next');
    next.style.visibility = 'visible';
    next.style.height = 'auto';
    next.style.overflow = 'visible'
    var top = document.getElementById('top');
    top.style.display = 'none';
    main(textFile)
    loadVideo(videoFile)
  });

	// 選択範囲のトラクリを精密描画
	const positionAdjustmentButton = document.getElementById('positionAdjustment')
	positionAdjustmentButton.addEventListener('click', () => {
		isAdjustedPosition = true
		positionAdjust(isAdjustedPosition)
	})
	// 全発話のトラクリを粗描画
	const roughDrawButton = document.getElementById('roughdraw')
	roughDrawButton.addEventListener('click', () => {
		releaseSelection()
		isAdjustedPosition = false
		positionAdjust(isAdjustedPosition)
	})
	
	// 文字位置調整の設定	
	// 一行あたり文字数の設定
	const charNumPerRowInputField = document.getElementById('charNumPerRow')
	const charNumChangeConfirmButton = document.getElementById('charNumChange')
	charNumChangeConfirmButton.addEventListener('click', handleCharNumInput)
	function handleCharNumInput(event) {
		const inputValue = charNumPerRowInputField.value

		// Check if the input is a valid number
		if (!isNaN(inputValue) && inputValue.trim() !== '') {
			console.log(`The entered number is: ${inputValue}`)
			// Call your custom function here
			// drawTranscript(hatsuwaGroups, fontSize, inputValue)
			main(null, null, inputValue)
		} else {
			console.log('Please enter a valid number')
			alert('Please enter a valid number')
		}
	}	

	// フォントサイズの設定
	const fontSizeSelector = document.getElementById('fontSizeSelector')
	fontSizeSelector.addEventListener('change', async() => {
		console.log('フォントサイズの変更')
		fontSize = fontSizeSelector.value
		// TODO:labelBoxのwidthを更新
		// TODO:トラクリのヘッダ列を再描画
		// →drawIdAndSpeaker()の処理で、前のやつを削除する処理をつくる）
		// main(null, fontSize, null)
		await positionAdjust(isAdjustedPosition)
		
	})

	// フォントの設定
	const fontSelector = document.getElementById('fontSelector')
	fontSelector.addEventListener('change', () => {
		const selectedFont = fontSelector.value
		if (selectedFont === 'gothic') {
			transcriptArea.style.fontFamily = 'Arial, sans-serif'
		} else if (selectedFont === 'mincho') {
			transcriptArea.style.fontFamily = '"Times New Roman", serif'
		} else if (selectedFont === 'monospace') {
			transcriptArea.style.fontFamily = '"Noto Sans Mono", "Courier New", monospace'
		}
	})

	// // 設定メニュー開く
	// const settingsIcon = document.getElementById('settings-icon')
	// if (settingsIcon) {
	// 	settingsIcon.addEventListener('click', function () {
	// 		const menu = document.getElementById('settings-menu')
	// 		menu.style.display = 'block'
	// 	})
	// }
	// // 設定メニュー閉じる
	// const settingsMenu = document.getElementById('settings-menu')
	// document.addEventListener('click', function (e) {
	// 	// クリックがメニュー内またはアイコン上でなければメニューを閉じる
	// 	if (!settingsMenu.contains(e.target) && e.target !== settingsIcon) {
	// 		settingsMenu.style.display = 'none'
	// 	}
	// })

	// 発話グループ水平線をトグル@設定メニュー
	// const toggleLineCheckbox = document.getElementById('toggle-line');
	// toggleLineCheckbox.addEventListener('change', toggleLine)

	// 開発用表示＠設定メニュー
	// const toggleDevCheckbox = document.getElementById('toggle-dev');
	// toggleDevCheckbox.addEventListener('change', toggleDev)

	// プチ設定エリア
	const releaseSelectionButton = document.getElementById('releaseSelectionButton')
	// 発話の部分選択を解除
	function releaseSelection() {
		// ボタン非表示
		// releaseSelectionButton.style.display = 'none'
		drawnRange.sGroupID = 0
		drawnRange.eGroupID = hatsuwaGroups.length

		// spanの選択解除
		let selectedSpans = document.getElementsByClassName('selected')
		// このspanが元々selectedなら、
		Array.from(selectedSpans).forEach((spn) => {
			spn.classList.remove('selected')
			spn.style.color = ''
		})
		// 選択開始タグと終了タグを解除
		;(selectionStartTag = null), (selectionEndTag = null)

		// rowの選択解除
		rowElems.forEach((row, i) => {
			row.removeAttribute('selected')
			row.style.backgroundColor = 'transparent'
		})

		// ビデオ再生範囲を初期状態へ
		video.startTime = 0
		video.endTime = video.duration
	}
	releaseSelectionButton.addEventListener('click', releaseSelection)
})

// ウィンドウサイズ変更イベント
window.addEventListener('resize', () => {
	clearTimeout(resizeTimer)
	resizeTimer = setTimeout(function () {
		console.log('ウィンドウがリサイズされました')
		// DEBUG:20240819：fixモードだと、リサイズに従わない
		// main()
		// DEBUG:20240819
		// updatedataAreaSize(dataArea, windowSize)
	}, 500)
})


window.addEventListener('beforeunload', function(event) {
  var message = 'このページを離れますか？';
  event.returnValue = message;
  return message;
});
