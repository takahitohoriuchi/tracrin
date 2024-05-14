// SECTION:【import】
import { addArrow, deleteArrow, drawLabel, genHatsuwaTags, genSpan, getTagTextsInThisLoop, splitSpan } from './utils/domUtils.js'

import { getMaxBracketsIndex, num2Px } from './utils/otherUtils.js'
import { reconvertKukuriMarksInHatsuwa, tempConvertKukuriMarksInHatsuwa } from './utils/transcriptUtils.js'

// SECTION:【グローバル変数】
let hatsuwaObjs
let hatsuwaGroups = []
let hatsuwaTagSpans = [] //三重配列:[グループ][発話][発話タグ]
let idLabels = []
let speakerLabels = []
let accumRowCount = 0 //最終的に表示されるデータ行数（データの選択箇所&折り返しとか反映後）
let hatsuwaTimeResolution = 0.05
// 動画について
// let video = document.getElementById('myVideo');    
// let videoPath = './movies/test.mp4';
let startTime = 0
let endTime = 100
// DOM関連
let resizeTimer
// スクリプトが描かれるエリア
let transcriptArea = document.getElementById('transcriptArea')
let transcriptAreaStyle
let scrollableDivArea = document.getElementById('scrollable-div')
let scrollableDivAreaStyle
let dataArea = document.getElementById('dataArea')
let dataAreaStyle
let itemArea = document.getElementById('itemArea')
let itemAreaStyle
let labelArea = document.getElementById('labelArea')
let labelAreaStyle
let labelAreaHeight = 30
let file

let windowSize = {
	w: 0,
	h: 0,
	margin: 20,
}
let fontSize = 12 //デフォだと12になるぽい
let lineHeightRatio = 1.2 //フォントサイズに対するテキストのボックス高さの比

// SECTION::【関数】
// メイン関数
async function main(_file = null) {
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
			// DEBUG:error
			tempConvertKukuriMarks(hatsuwaObjs)			
			// DEBUG:error
			reconvertKukuriMarks(hatsuwaObjs)		// ククリ系記号を元に戻す関数
			await groupingHatsuwaObjs(hatsuwaObjs)
			
		}

		await drawHatsuwa(hatsuwaGroups, fontSize)

		// 左の発話者&行数ラベルを表示itemArea
		drawIDandSpeaker(hatsuwaGroups, fontSize)
		// spanやラベルにイベントを追加
		await addEvents()		

		// TODO:heightを更新
		// 1:hatsuwaTagSpans[][][]の最終要素のbottomを取得して
		const lastDataBottom = accumRowCount * fontSize * lineHeightRatio
		transcriptArea.style.height = num2Px(lastDataBottom - labelAreaHeight)
		itemArea.style.height = num2Px(lastDataBottom)
		dataArea.style.height = num2Px(lastDataBottom)
		console.log('hatsuwaObjs: ', hatsuwaObjs)
		console.log('hatsuwaGroups: ', hatsuwaGroups)
		console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
	}
}

// 1: 発話オブジェクト群[]を生成する関数
async function genHatsuwaObjs(_textContent) {
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
	hatsuwaObjs = rows.map((row, i) => {
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
		if(o.speaker==''){
			// 沈黙時間を小数第二位で四捨五入
			let silentDuration = parseFloat(o.text.replace(/[()]/g, ''))
			silentDuration = Math.round(silentDuration * 10) / 10
			o.text = silentDuration
			o.text = '(' + o.text + ')'			
		}
		return o
	})
	// 発話オブジェクト群から、「0.15秒未満の沈黙」を削除
	hatsuwaObjs = hatsuwaObjs.filter(o=>{
		if(o.speaker == ''){
			let silentDuration = parseFloat(o.text.replace(/[()]/g, ''))
			console.log('silentDuration: ', silentDuration)
			return silentDuration>=0.15			
		}else{
			return true
		}		
	})
	// TODO:発話オブジェクト群から、silentオンリーの発話は先頭末尾に'(',')'がなければつける。


	// 発話オブジェクトを「発話開始時間」でソート
	hatsuwaObjs.sort((a, b) => a.start - b.start)
	hatsuwaObjs.forEach((obj, i) => (obj.ID = i + 1)) //発話インデックス（ソート後にやる）
	// console.log('hatsuwaObjs[0]: ', hatsuwaObjs[0])
}

// ククリ記号を一時的に別の文字に置き換える
async function tempConvertKukuriMarks(_hatsuwaObjs){
	_hatsuwaObjs.forEach(async hatsuwaObj=>{		
		console.log('hatsuwaObj: ', hatsuwaObj)
		await tempConvertKukuriMarksInHatsuwa(hatsuwaObj)		
	})
}

// ククリ記号を元に戻す
async function reconvertKukuriMarks(_hatsuwaObjs, _spansOfHatsuwa){
	// _hatsuwaObjsを元に戻す
	_hatsuwaObjs.forEach(async hatsuwaObj=>{		
		await reconvertKukuriMarksInHatsuwa(hatsuwaObj)			
	})

	// TODO:_spansOfHatsuwaをもとに戻す
}

// 2: 発話オブジェクト群[]をグルーピングする
async function groupingHatsuwaObjs(_hatsuwaObjs) {
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
}

// 3: 発話たちを描画する。
async function drawHatsuwa(_hatsuwaGroups, _fontSize) {
	// 現在の発話描画エリアの最下端位置(各発話グループの処理が終わるたび更新)
	let startX = 0
	let dataAreaW = dataAreaStyle.width
	let maxCharNumPerRow = Math.floor(dataAreaW / fontSize)
	console.log('maxCharNumPerRow: ', maxCharNumPerRow)
	console.log('startX: ', startX)
	// 発話グループそれぞれにおいて
	_hatsuwaGroups.forEach((hatsuwaGroup, groupIndex) => {
		console.log('====================')
		console.log(`【グループ${groupIndex}】`, hatsuwaGroup)
		// <span>三重配列へこのグループ用に空セット
		hatsuwaTagSpans.push([])

		hatsuwaGroup.forEach((hatsuwa, i) => {
			console.log(`発話${i}: `, hatsuwa.text)
			//グループ内の発話の数だけ、空配列セット
			hatsuwaTagSpans[groupIndex].push([])
		})
						
		// 発話から子発話に生成・分割（二重配列）
		let tagArrays = genHatsuwaTags(hatsuwaGroup, groupIndex)
		console.log('tagArrays: ', tagArrays)
		let maxTagX = startX		

		let bracketID = 1
		for (let i = 0; i < tagArrays.length; i++) {
			// 発話iの先頭（=tagArrays[0].text[0]）には[がある？cl
			console.log('tagArrays.length: ', tagArrays.length)
			if (tagArrays[i][0].text[0] == '[') {
				if (i < tagArrays.length - 1) {										
					// まだbracketIDプロパティをもたないものだけ
					if (!('bracketID' in tagArrays[i][0])) {
						console.log('この発話の先頭タグは、bracketIDをもってません')
						// あれば、
						for (let j = 1; j < tagArrays.length; j++) {
							// 続く発話たち(tagArrays[i+j].text[0]の発話開始時間と同じかチェック							
							if(!hatsuwaGroup[i+j]){
								break
							}
							else if (hatsuwaGroup[i + j].start - hatsuwaGroup[i].start < hatsuwaTimeResolution) {
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
		// (次に、それぞれの発話において、1番目以降のブラケットがあれば、それらは順に+したブラケットIDを振っていく)
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

		// tagArraysを、二次元配列から一次元配列に変えて、
		const tempTagArray = tagArrays.flatMap((row) => row)
		// console.log('tempTagArray: ', tempTagArray)

		// ブラケットグループ化する（同じbracketIDのtagどうしをまとめた配列）
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
		

		// 同じbracketsGroupのなかで位置決定してく
		bracketsGroup.forEach((tagsOfThisLoop, i) => {			
			console.log('----------')
			console.log('ループindex', i, ' (グループ内での[のインデックス)')
			console.log('tagsOfThisLoop: ', tagsOfThisLoop)
			const spansOfThisLoop = []

			// (1) 抽出タグそれぞれに対して、span描画する
			//  「maxケツX」から描画しはじめる（前ループで取得してある。）
			tagsOfThisLoop.forEach((tag) => {
				const span = genSpan(document, dataArea, tag.text, tag.id, fontSize, maxTagX)
				spansOfThisLoop.push(span)
			})
			console.log('spansOfThisLoop: ', spansOfThisLoop)

			// (2) タグの行分割処理（画面右端オーバーのケース || 中途半端発話記号で改行のケース）
			// let tempMaxTagX = maxTagX
			let tempMaxTagX = 0
			spansOfThisLoop.forEach((span, j) => {
				// オーバー
				
				// NOTE:以下２通りのやりかただと、12pxぶん違いがでる。。。？
				const spanW = span.getBoundingClientRect().width
				// const spanW = px2Num(window.getComputedStyle(span).width)
				console.log('spanW: ', spanW)
				const remainedHaba = dataAreaW - maxTagX
				console.log('remainedHaba: ', remainedHaba)
				const charNumFirstRow = Math.floor(remainedHaba / fontSize)
				console.log('charNumFirstRow: ', charNumFirstRow)

				// nコへと分割(DOM操作)
				const splittedSpanTexts = splitSpan(document, span, charNumFirstRow, maxCharNumPerRow, tagsOfThisLoop[j])
				console.log(`${span.innerHTML}は以下${splittedSpanTexts.length}つに分割される↓`)
				console.log('splittedSpanTexts: ', splittedSpanTexts)								
				const id = span.className.split(' ')[1] //id。例：(10-4-1)みたいな。おおもとのspanは削除しちゃうから、先にidだけとっとく
				console.log('id: ', id)
				const hatsuwaID = id.split('-')[1]
				// NOTE:maxTagXは次のbracketsIndexのループでつかわれる

				splittedSpanTexts.forEach((splittedTag, k) => {
					const tagX = k == 0 ? maxTagX : startX
					// spanタグを生成
					const e = genSpan(document, dataArea, splittedTag, id, fontSize, tagX)
					// console.log('splitして生み出されたspan: ', e)
					// 全体の発話span配列に追加する
					hatsuwaTagSpans[groupIndex][hatsuwaID].push(e)
					// 分割してできた最終タグが、maxケツXの候補になる！					
					const tagID = id.split('-')[2]																									
					if(Number(tagID) < tagArrays[hatsuwaID].length-1){
						if (k == splittedSpanTexts.length - 1) {
							const xx = e.getBoundingClientRect().right - dataAreaStyle.x
							console.log(`splitTag${k}のright`, xx)
							tempMaxTagX = Math.max(tempMaxTagX, xx)
						}
					}					
				})
			})
			// (3)「maxケツX」を取得、更新する！
			maxTagX = tempMaxTagX
			// console.log('maxTagX: ', maxTagX)

			// (4)spanOfThisLoopを[]削除しちゃえ！
			spansOfThisLoop.forEach((span) => span.remove())
		})
			
		console.log('dataAreaStyle: ', dataAreaStyle)
		// console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
	})

	// タグspanの、Y位置を決めて、ククリ記号を元に戻す処理
	accumRowCount = 0 //累積行数
	hatsuwaTagSpans.forEach((spansOfGroup, i) => {
		spansOfGroup.forEach((spansOfHatsuwa, j) => {
			let rowNum = 0
			spansOfHatsuwa.forEach((span, k) => {				
				// DEBUG:ククリ記号を変換する
				console.log('span.textContent: ', span.textContent)
				// span.innerHTML = 
				// (パタンA)： いっっちばんさいしょタグspanの場合
				if (i == 0 && j == 0 && k == 0) {
					console.log('さいしょです')
					rowNum += 1
				}
				// (パタンB): グループ内最初発話かつ最初タグの場合・・・直前グループ最終発話かつ最終タグspanのbottomにあわせる
				else if (j == 0 && k == 0) {
					rowNum += 1
					accumRowCount += 1
					console.log('グループ内の最初発話の最初タグ')
					const hatsuwaNum = hatsuwaTagSpans[i - 1].length
					const spanNum = hatsuwaTagSpans[i - 1][hatsuwaNum - 1].length
					const y = accumRowCount * fontSize * lineHeightRatio
					span.style.top = num2Px(y)
				}
				// (パタンC): 発話内最初のタグの場合・・・直前発話の最終タグspanのbottomにあわせる
				else if (k == 0) {
					rowNum += 1
					accumRowCount += 1
					console.log('発話内最初タグ')
					const spanNum = spansOfGroup[j - 1].length
					const y = accumRowCount * fontSize * lineHeightRatio
					span.style.top = num2Px(y)
				}
				// (パタンD): spanXが0にきてる場合・・・直前タグのbottomにあわせる
				else if (span.getBoundingClientRect().left - dataAreaStyle.x == 0) {
					rowNum += 1
					accumRowCount += 1
					const y = accumRowCount * fontSize * lineHeightRatio
					span.style.top = num2Px(y)
				}
				// (パタンE): それ以外の場合・・・直前タグのtopにあわせる（列車的連結）
				else {
					const y = accumRowCount * fontSize * lineHeightRatio
					span.style.top = num2Px(y)
				}
			})
			console.log('この発話の行数: ', rowNum)
			hatsuwaGroups[i][j].rowNum = rowNum
		})
		const lineY = spansOfGroup[0][0].getBoundingClientRect().top - dataAreaStyle.top		
		var horizontalLine = document.createElement('div')
		console.log('水平線のlineY: ', lineY)
		horizontalLine.style.top = num2Px(lineY)
		horizontalLine.className = 'group-line'
		dataArea.appendChild(horizontalLine)
	})
	// DEBUG:こいつのタグをそれぞれハックして、記号を元に戻す
	console.log('hatsuwaTagSpans: ', hatsuwaTagSpans)
	// 更新
	requestAnimationFrame(function () {})
}

// 4: IDとSpeakerのラベルを左にDOM描画する関数
async function drawIDandSpeaker(_hatsuwaGroups, _fontSize) {
	// 行ラベル表示
	drawLabel(document, labelArea, 0, 0, 'ID', _fontSize) //ID
	// TODO:ID列の最高rightを取得。
	// const maxIDSpanRight = idLabels[idLabels.length-1].getBoundingClientRect().right - transcriptAreaStyle.left
	// console.log('maxIDSpanRight: ', maxIDSpanRight)
	
	// (1) ヘッダを描く
	const speakerLabelX = _fontSize * 3
	drawLabel(document, labelArea, speakerLabelX, 0, 'Speaker', _fontSize) // speaker
	drawLabel(document, labelArea, dataAreaStyle.left, 0, 'Text', _fontSize) // text
	console.log('itemAreaStyle: ', itemAreaStyle)
	console.log('dataAreaStyle: ', dataAreaStyle)

	// (2) 列ラベルを発話ごとに処理
	accumRowCount = 0
	_hatsuwaGroups.forEach((hatsuwaGroup, i) => {
		hatsuwaGroup.forEach((hatsuwaObj, j) => {
			for (let k = 0; k < hatsuwaObj.rowNum; k++) {
				// 行連番を表示
				const idColX = 0
				const idColY = _fontSize * lineHeightRatio * (accumRowCount + k)

				const id = accumRowCount + k + 1//NOTE:この+1は、ユーザからすると「IDが0からだとヘンだから1からにする」ってだけ。
				const label = drawLabel(document, itemArea, idColX, idColY, id, _fontSize)
				idLabels.push(label)
				// 「話者ラベル」を表示（発話の最初行だけ）
				if (k == 0) {
					const speakerColX = speakerLabelX
					const speakerColY = _fontSize * lineHeightRatio * accumRowCount
					const speaker = hatsuwaObj.speaker
					const label = drawLabel(document, itemArea, speakerColX, speakerColY, speaker, _fontSize)
					speakerLabels.push(label)
				}
			}
			accumRowCount += hatsuwaObj.rowNum
		})
	})
	console.log('最終的な全行数: ', accumRowCount)
}

// 5: マウスクリックとマウスオンイベントを追加
async function addEvents() {
	// 発話spanタグひとつひとつに（最小単位）
	for (let group of hatsuwaTagSpans) {
		for (let hatsuwa of group) {
			for (let span of hatsuwa) {
				// マウスオン
				span.addEventListener('mouseover', () => {
					span.style.color = 'red'
				})
				// マウスリーブ
				span.addEventListener('mouseout', () => {
					span.style.color = 'black'
				})
				// クリック
				span.addEventListener('click', () => {
					console.log('クリックされたspanタグ: ', span)
					let classList = span.classList
					let globalTagID = classList[1]
					console.log('globalTagID: ', globalTagID)
					let groupID = globalTagID.split('-')[0]
					let hatsuwaIDInGroup = globalTagID.split('-')[1]
					let hatsuwaObjOwningThisTag = hatsuwaGroups[groupID][hatsuwaIDInGroup]
					console.log('選択されたタグをもつ発話obj: ', hatsuwaObjOwningThisTag)
					startTime = hatsuwaObjOwningThisTag.start
					// video.currentTime = startTime
					endTime = hatsuwaObjOwningThisTag.end
					console.log('endTime: ', endTime)
					
					/*NOTE:
					上記コンソールには、<span>タグが出力されるが、
					「tag i-j-k」（例：tag 6-3-1）というクラスが付与している。
					「発話グループiの、j番目発話の、k番目タグ」という意味。
					つまりこのi,jをつかえば、hatsuwaObjのなかから相当オブジェクトを指定して、
					その発話の開始時間と終了時間を取得できる。
					まずはそれら時間のコンソール出力を以下に試すべし。
					*/
				})
			}
		}
	}
	// 発話行の選択（ID）
	for (let [i, label] of idLabels.entries()) {
		// マウスオン
		label.addEventListener('mouseover', () => {
			label.style.color = 'red'
		})
		// マウスリーブ
		label.addEventListener('mouseout', () => {
			label.style.color = 'black'
		})
		// クリック
		label.addEventListener('click', () => {
			console.log('clickされたIDラベル: ', label)
			const x = speakerLabels[i].getBoundingClientRect().left
			const xx = itemAreaStyle.left
			const xxx = speakerLabels[i].getBoundingClientRect().left - itemAreaStyle.left - lineHeightRatio * fontSize	
			console.log('xxx: ', xxx)
			console.log('IDラベルのindex: ', i)
			// const y = i * fontSize * lineHeightRatio					
			const y = 0//NOTE:yは、この行（label）のローカルで良い。addArrow参照。			
			const arrows = label.querySelectorAll(`.arrow`);
			console.log('arrows: ', arrows)
			if(arrows.length > 0){				
				deleteArrow(label, arrows)				
			}else{
				addArrow(document, label, fontSize * 1.2, xxx, y)				
			}								
		})
	}
	// 発話行の選択（speaker）
	for (let label of speakerLabels) {
		// マウスオン
		label.addEventListener('mouseover', () => {
			label.style.color = 'red'
		})
		// マウスリーブ
		label.addEventListener('mouseout', () => {
			label.style.color = 'black'
		})
		// クリック
		label.addEventListener('click', () => {
			console.log('clickされたspakerラベル: ', label)
			let classList = label.className
			console.log('classList: ', classList)
			/*NOTE:
			上記コンソールには、<span>タグが出力されるが、
			「tag i-j-k」（例：tag 6-3-1）というクラスが付与している。
			「発話グループiの、j番目発話の、k番目タグ」という意味。
			つまりこのi,jをつかえば、hatsuwaObjのなかから相当オブジェクトを指定して、
			その発話の開始時間と終了時間を取得できる。
			まずはそれら時間のコンソール出力を以下に試すべし。
			*/
		})
	}
}

// 設定メニューの開閉
// function toggleSettingsMenu() {
//     var menu = document.getElementById('settings-menu');
//     if (menu.style.display === 'none') {
//         menu.style.display = 'block';
//     } else {
//         menu.style.display = 'none';
//     }
// }

// 発話グループごとの水平線のトグル
function toggleLine() {
	console.log('toggleLine()')
    var checkbox = document.getElementById('toggle-line');
    var lines = document.querySelectorAll('.group-line');
	console.log('lines: ', lines)
    if (checkbox.checked) {
        lines.forEach(function(line) {
            line.style.borderTop = '0.5px dashed #000';
        });
    } else {
        lines.forEach(function(line) {
            line.style.borderTop = '';
        });
    }
}


// エリアのサイズ調整
async function resize() {
	console.log('window.innerWidth: ', window.innerWidth)
	transcriptArea.style.display = 'block'

	// (1) ウィンドウサイズに応じて、tranとscrollableのwidthを設定して、
	transcriptArea.style.width = num2Px(window.innerWidth - 20) //-20はtranscriptAreaのmargin*2ぶん
	scrollableDivArea.style.width = num2Px(window.innerWidth - 20) //-20はtranscriptAreaのmargin*2ぶん

	// (2) 設定したサイズ情報を取得しといて、
	transcriptAreaStyle = transcriptArea.getBoundingClientRect()
	scrollableDivAreaStyle = scrollableDivArea.getBoundingClientRect()
	itemAreaStyle = itemArea.getBoundingClientRect()

	// (3) dataAreaとlabelAreaのハバをそれに応じて変更する
	dataArea.style.width = num2Px(scrollableDivAreaStyle.right - itemAreaStyle.right - 10) //-10はmarginぶん
	labelArea.style.width = num2Px(scrollableDivAreaStyle.right - 10)

	// (4) dataAreaとlabelAreaの情報を更新する
	// NOTE:getBoundingClientRect()は、参照ではなくコピーです！
	dataAreaStyle = dataArea.getBoundingClientRect()
	labelAreaStyle = labelArea.getBoundingClientRect()
	console.log('dataAreaStyle: ', dataAreaStyle)
	console.log('itemAreaStyle: ', itemAreaStyle)
}

// データのリロード
async function reload() {
	// // 同期ver
	// // dataAreaのすべてのDOM削除
	// while (dataArea.firstChild) {
	// 	dataArea.removeChild(dataArea.firstChild)
	// }
	// // itemAreaのすべてのDOM削除
	// while (itemArea.firstChild) {
	// 	itemArea.removeChild(itemArea.firstChild)
	// }
	// 非同期ver
	while (dataArea.firstChild) {
		dataArea.firstChild.remove()
		await new Promise((resolve) => setTimeout(resolve, 0)) // 非同期処理の待機
	}
	while (itemArea.firstChild) {
		itemArea.firstChild.remove()
		await new Promise((resolve) => setTimeout(resolve, 0)) // 非同期処理の待機
	}

	// 初期化
	// hatsuwaObjs = null
	// hatsuwaGroups = []
	hatsuwaTagSpans = [] //三重配列:[グループ][発話][発話タグ]
	idLabels = []
	speakerLabels = []
}

// イベントの定義
window.addEventListener('DOMContentLoaded', () => {	
    // // 動画のソースを設定
    // video.src = videoPath;
	
    // // メタデータがロードされたら動画情報を取得
    // video.addEventListener('loadedmetadata', function() {
	// 	console.log('videoオブジェクト: ', video)
    //     console.log(`Video Width: ${video.videoWidth}px`);
    //     console.log(`Video Height: ${video.videoHeight}px`);
    //     console.log(`Duration: ${video.duration}s`);
	// 	endTime = video.duration
	// 	console.log('endTime: ', endTime)
    //     // ここで必要に応じて他の動作を行う
    // });

    // // 動画の再生準備ができたら再生を開始
    // video.addEventListener('canplay', function() {
    //     // video.play();
    // });
	// // 再生が開始されたとき
    // video.addEventListener('play', function() {
    //     console.log('再生が開始されました。');
    // });

    // // 一時停止されたとき
    // video.addEventListener('pause', function() {
    //     console.log('一時停止されました。');
	// 	console.log(`currentTime: ${video.currentTime}s`);        
    // });

	//  // 再生中の現在時刻を監視
    // video.addEventListener('timeupdate', function() {				
	// 	console.log('動画コマうごきました（timeupdate）')
	// 	// TODO:手動スライダで動画を動かしたときに、startTimeとendTimeをどうする？
    //     if (video.currentTime >= endTime) {
    //         video.pause(); // 終了時間に達したら一時停止
    //         video.currentTime = startTime; // 必要に応じて再度開始時間に戻す
    //         console.log('指定された区間の再生が完了しました。');
    //     }
    // });

    // // 動画が終了したとき
    // video.addEventListener('ended', function() {
    //     console.log('動画が終了しました。');
    // });

	const ddarea = document.getElementById('ddarea')
	const tarea = document.getElementById('txtarea')
	// ドラッグされたデータが有効かどうかチェック
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
			// tarea.value += `ファイルdropped!`
			// for (file of files) tarea.value += `name:${file.name} type:${file.type}`
			// const file = files[0]
			const fileType = files[0].type
			if (fileType == 'text/plain') {
				console.log('.txtファイルだよ')
				main(files[0])
				// const fileReader = new FileReader()
				// fileReader.readAsText(file)
				// fileReader.onload = async () => {
				// 	const textContent = fileReader.result
				// 	await genHatsuwaObjs(textContent)
				// 	await modifyHatsuwaObjsByWinSize(_hatsuwaObjs)
				// 	console.log('hatsuwaObjs: ', hatsuwaObjs)
				// 	// hatsuwaObjs.splice(0,1)
				// 	await groupingHatsuwaObjs(hatsuwaObjs)
				// 	console.log('hatsuwaGroups: ', hatsuwaGroups)
				// 	drawIDandSpeaker(hatsuwaObjs)
				// 	await drawHatsuwaTags(hatsuwaGroups)
				// }
			}
			ddarea.classList.remove('ddefect')
		},
	}
	Object.keys(ddEvent).forEach((e) => {
		ddarea.addEventListener(e, ddEvent[e])
		document.body.addEventListener(e, ddEvent[e])
	})	

	// 設定メニュー開く
	const settingsIcon = document.getElementById('settings-icon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function(){
			const menu = document.getElementById('settings-menu');
        	menu.style.display = 'block'
		});
    }
	// 設定メニュー閉じる
	const settingsMenu = document.getElementById('settings-menu');
	document.addEventListener('click', function(e) {
        // クリックがメニュー内またはアイコン上でなければメニューを閉じる
        if (!settingsMenu.contains(e.target) && e.target !== settingsIcon) {
            settingsMenu.style.display = 'none';
        }
    });
	
	// 設定メニュー：発話グループ水平線をトグル
	const checkbox = document.getElementById('toggle-line');
	checkbox.addEventListener('change', ()=>{
		console.log('toggleLine()')		
		var lines = document.querySelectorAll('.group-line');
		console.log('lines: ', lines)
		if (checkbox.checked) {
			lines.forEach(function(line) {
				line.style.borderTop = '0.5px dashed #000';
			});
		} else {
			lines.forEach(function(line) {
				line.style.borderTop = '';
			});
		}
		}
	)    
})

// ウィンドウサイズ変更イベント
window.addEventListener('resize', () => {
	clearTimeout(resizeTimer)
	resizeTimer = setTimeout(function () {
		console.log('ウィンドウがリサイズされました')
		windowSize.w = window.innerWidth
		windowSize.h = window.innerHeight
		console.log('windowSize: ', windowSize)
		main()
		// updatedataAreaSize(dataArea, windowSize)
	}, 500)
})
