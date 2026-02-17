import { bleachSpans, colorSpans } from './domUtils.js'
import { hatsuwaObjs } from '../main.js'
// console.log(hatsuwaObjs.length)


// DEBUG:20260214
// ==== timeupdate 用の状態 ====
let coloredSpans = [] // 前回色付けしていた span たち
let lastStructureID = null // 前回ヒットしたID（同じなら更新しない）

// ===== デバッグスイッチ =====
const DEBUG = true

// ログ出しすぎ防止（ms）
const LOG_THROTTLE_MS = 500
let lastLogAt = 0

// もし色が付かない時に「本当にclass/スタイルが当たってるか」を確認したいなら true
const FORCE_INLINE_STYLE_DEBUG = false

// DEBUG:20260214
// 動画について
export let video = document.getElementById('myVideo')
console.log('video: ', video)
export let videoAspectRatio
let videoPath = './movies/test.mp4'
video.startTime = 0
video.endTime = 100
// const hatsuwaObjs = []
// for (let i = 0; i < 50; i++) {
// 	hatsuwaObjs.push({
// 		start: i,
// 		end: i + 1,
// 		structureID: `${i}-0`,
// 	})
// }

export function loadVideo(_file) {
	const url = URL.createObjectURL(_file)
	video.src = url
	video.style.display = 'block'
	video.addEventListener('loadedmetadata', function () {
		console.groupCollapsed('videoデータ')
		console.log('videoオブジェクト: ', video)
		console.log(`Video Width: ${video.videoWidth}px`)
		console.log(`Video Height: ${video.videoHeight}px`)
		videoAspectRatio = video.videoWidth / video.videoHeight
		console.log('videoAspectRatio: ', videoAspectRatio)

		console.log(`Duration: ${video.duration}s`)
		video.endTime = video.duration
		console.log('video.endTime: ', video.endTime)
		console.groupEnd()
		// ここで必要に応じて他の動作を行う
	})

	// 動画の再生準備ができたら再生を開始
	video.addEventListener('canplay', function () {
		// video.play();
	})
	// 再生が開始されたとき
	video.addEventListener('play', function () {
		console.log('再生が開始されました。')
		// if (video.currentTime) video.currentTime = video.startTime
		video.currentTime = video.currentTime >= video.endTime ? video.startTime : video.currentTime
	})

	// 一時停止されたとき
	video.addEventListener('pause', function () {
		console.log('一時停止されました。')
		console.log(`currentTime: ${video.currentTime}s`)
	})

	// 再生中の現在時刻を監視
	video.addEventListener('timeupdate', function () {
		const t = video.currentTime

		// --- (A) timeupdate が本当に回ってるか ---
		if (DEBUG) {
			const now = performance.now()
			if (now - lastLogAt > LOG_THROTTLE_MS) {
				lastLogAt = now
				console.groupCollapsed(`[timeupdate] t=${t.toFixed(3)}`)
				console.log('video.paused:', video.paused)
				console.log('video.startTime:', video.startTime, 'video.endTime:', video.endTime)
				console.log('hatsuwaObjs.length:', hatsuwaObjs.length)
				console.groupEnd()
			}
		}

		// 1) currentTime に該当する hatsuwaObj を探す（線形探索）
		let hit = null
		for (let hatsuwaObj of hatsuwaObjs) {
			// DEBUG: start/end が数値か確認したい場合
			if (DEBUG && (typeof hatsuwaObj.start !== 'number' || typeof hatsuwaObj.end !== 'number')) {
			    console.warn('start/end が number じゃないかも:', hatsuwaObj);
			}

			if (t >= hatsuwaObj.start && t < hatsuwaObj.end) {
				hit = hatsuwaObj
				break
			}
		}

		// --- (B) hit が取れてるか ---
		if (DEBUG) {
			// たまにだけ出す（ログ洪水防止）
			const now = performance.now()
			if (now - lastLogAt > LOG_THROTTLE_MS) {
				console.log('hit:', hit)
			}
		}

		// 2) ヒットしなかった（沈黙など）→ いま塗ってるのがあれば消す
		if (!hit) {
			if (DEBUG) {
				console.warn('No hit hatsuwa at time:', t);
			}
			if (coloredSpans.length > 0) {
				if (DEBUG) console.log('bleach: coloredSpans.length=', coloredSpans.length)
				bleachSpans(coloredSpans)
				coloredSpans = []
			}
			lastStructureID = null
			return
		}

		// 3) 前回と同じ発話なら何もしない（DOM更新を抑える）
		const currentID = hit.structureID // 今の暫定ID
		if (currentID === lastStructureID) {
			if (DEBUG) {
				console.log('same ID, skip:', currentID);
			}
			return
		}
		if (DEBUG) console.log('ID changed:', lastStructureID, '->', currentID)
		lastStructureID = currentID

		// 4) 前回の色を消す
		if (coloredSpans.length > 0) {
			if (DEBUG) console.log('bleach old spans:', coloredSpans.length)
			bleachSpans(coloredSpans)
			coloredSpans = []
		}

		// 5) span を集める
		//    ここが一番バグりやすい：sp.globalTagID が本当に存在するか？値は一致してるか？
        // TODO:ここの検索は、全部のspanを検索するんじゃなくて、現在のspanから、globalTagIDをインクリメントする形で探すほうがよし
		const spans = document.querySelectorAll('span.tag')

		if (DEBUG) {
			console.groupCollapsed('span scan debug')
			console.log('total spans:', spans.length)			
			// 先頭の数個だけ中身を覗く（全部出すと地獄）
			for (let i = 0; i < Math.min(5, spans.length); i++) {
				const sp = spans[i]
				console.log(
					`sp[${i}] text=`,
					sp.textContent?.slice(0, 30),					
					'globalTagID=',
					sp.getAttribute('globalTagID'),										
				)
			}
			console.groupEnd()
		}

		const newSpans = []
		for (const sp of spans) {
			const structureIDfromGlobalTagID = sp.getAttribute('globalTagID').split('-').slice(0, 2).join('-')
			// どれかが currentID と一致したら採用
			if (structureIDfromGlobalTagID === currentID) {
				newSpans.push(sp)
			}
		}

		// --- (C) newSpans が取れてるか ---
		if (DEBUG) {
			console.log('newSpans.length:', newSpans.length, 'for ID:', currentID)
			if (newSpans.length > 0) {
				console.log('example span:', newSpans[0], 'text=', newSpans[0].textContent)
			} else {
				console.warn('一致する span が0。IDの形式が違う or span側にIDが入ってない可能性大')
				console.warn('currentID:', currentID)
			}
		}

		// 6) 色付け
		if (newSpans.length > 0) {
			colorSpans(newSpans)
			coloredSpans = newSpans

			// --- (D) colorSpansが効いてるかを強制確認（CSSが無い場合の切り分け）---
			if (FORCE_INLINE_STYLE_DEBUG) {
				for (const sp of newSpans) {
					sp.style.outline = '2px solid red'
					sp.style.background = 'rgba(255,0,0,0.2)'
				}
				if (DEBUG) console.warn('FORCE_INLINE_STYLE_DEBUG ON: inline styleで強制表示してる')
			} else {
				// class方式なら、ここで class ついてるか確認
				if (DEBUG) {
					// 例：domUtilsが class "is-current" を付けてる想定
					// console.log('classList:', newSpans[0].className);
				}
			}
		}

		// 7) 再生区間の終端チェック（既存のまま）
		if (video.currentTime >= video.endTime) {
			if (DEBUG) console.log('reach endTime -> pause')
			video.pause()
		}
		// console.log('動画コマ更新')
		// // TODO:currentTimeをつかって、hatsuwaObjsを検索し、そのrowを装飾せよ
		// // TODO:hatsuwaObjをどうやってここで受け取るか？constにしないとexportできないが。。
		// // TODO:発話の探索アルゴリズムを最適化したほうがいいかも。まずは次の発話から・・・とか。
		// for (let hatsuwaObj of hatsuwaObjs){
		//     if(
		//         (video.currentTime >= hatsuwaObj.start)
		//         &&
		//         (video.currentTime < hatsuwaObj.end)
		//     ){
		//         console.log('hatsuwaObj.structureID: ', hatsuwaObj.structureID)
		//         /*
		//         <span>たちから、.globalTagID == i-j-k
		//         domUtils.jsでspan着色・脱色関数をつくる
		//         （）現在の
		//         ・colorSpanByCurrentTime(hatsuwaObj.structureID)
		//         （）前ループの塗りつぶし済spansを脱色
		//         ・bleachSpan(hatsuwaObj.structureID)
		//         （）新しい着色spansをセット。
		//         */
		//     }
		// }

		// // TODO:手動スライダで動画を動かしたときに、video.startTimeとvideo.endTimeをどうする？
		// if (video.currentTime >= video.endTime) {
		//     video.pause(); // 終了時間に達したら一時停止
		//     // video.currentTime = video.startTime; // TODO:必要に応じて再度開始時間に戻す？それともそのまま？
		//     // console.log('指定された区間の再生が完了しました。');
		// }
	})

	// 動画が終了したとき
	video.addEventListener('ended', function () {
		console.log('動画が終了しました。')
	})
}

// // 動画のソースを設定
// window.addEventListener('DOMContentLoaded', () => {
//     // video.src = videoPath;

//     // DEBUG:ddareaに、動画がD&Dされたら実行されるようにする

//     // メタデータがロードされたら動画情報を取得
//     video.addEventListener('loadedmetadata', function() {
//         console.groupCollapsed('videoデータ')
// 		console.log('videoオブジェクト: ', video)
//         console.log(`Video Width: ${video.videoWidth}px`);
//         console.log(`Video Height: ${video.videoHeight}px`);
//         videoAspectRatio = video.videoWidth / video.videoHeight
//         console.log('videoAspectRatio: ', videoAspectRatio)

//         console.log(`Duration: ${video.duration}s`);
// 		video.endTime = video.duration
// 		console.log('video.endTime: ', video.endTime)
//         console.groupEnd()
//         // ここで必要に応じて他の動作を行う
//     });

//     // 動画の再生準備ができたら再生を開始
//     video.addEventListener('canplay', function() {
//         // video.play();
//     });
// 	// 再生が開始されたとき
//     video.addEventListener('play', function() {
//         console.log('再生が開始されました。');
//     });

//     // 一時停止されたとき
//     video.addEventListener('pause', function() {
//         console.log('一時停止されました。');
// 		console.log(`currentTime: ${video.currentTime}s`);
//     });

// 	 // 再生中の現在時刻を監視
//     video.addEventListener('timeupdate', function() {
// 		// console.log('動画コマうごきました（timeupdate）')
//         // TODO:currentTimeをつかって、hatsuwaObjsを検索し、そのrowを装飾せよ
//         // TODO:hatsuwaObjをどうやってここで受け取るか？constにしないとexportできないが。。
//         // for(let i=0; i<hatsuwaObjs.length; i++){
//             // if(
//             //     (currentTime >= hatsuwaObj.start)
//             //     &&
//             //     (currentTime < hatsuwaObj.end)
//             // ){

//             // }
//         // }

// 		// TODO:手動スライダで動画を動かしたときに、video.startTimeとvideo.endTimeをどうする？
//         if (video.currentTime >= video.endTime) {
//             video.pause(); // 終了時間に達したら一時停止
//             video.currentTime = video.startTime; // TODO:必要に応じて再度開始時間に戻す？それともそのまま？
//             // console.log('指定された区間の再生が完了しました。');
//         }
//     });

//     // 動画が終了したとき
//     video.addEventListener('ended', function() {
//         console.log('動画が終了しました。');
//     });
// })

// function update
