// 動画について
export let video = document.getElementById('myVideo'); 
console.log('video: ', video)
export let videoAspectRatio;
let videoPath = './movies/test.mp4';
video.startTime = 0
video.endTime = 100
const hatsuwaObjs = []    
for(let i=0; i<50; i++){
    hatsuwaObjs.push({
        start: i,
        end: i+1,
        structureID: `${i}-0`
    })
}

// function 

export function loadVideo(_file){
    const url = URL.createObjectURL(_file);
    video.src = url;
    video.style.display = 'block';					
    video.addEventListener('loadedmetadata', function() {
        console.groupCollapsed('videoデータ')
		console.log('videoオブジェクト: ', video)        
        console.log(`Video Width: ${video.videoWidth}px`);
        console.log(`Video Height: ${video.videoHeight}px`);
        videoAspectRatio = video.videoWidth / video.videoHeight
        console.log('videoAspectRatio: ', videoAspectRatio)

        console.log(`Duration: ${video.duration}s`);
		video.endTime = video.duration
		console.log('video.endTime: ', video.endTime)        
        console.groupEnd()
        // ここで必要に応じて他の動作を行う
    });        
    
    // 動画の再生準備ができたら再生を開始
    video.addEventListener('canplay', function() {
        // video.play();
    });
	// 再生が開始されたとき
    video.addEventListener('play', function() {
        console.log('再生が開始されました。');
        // if (video.currentTime) video.currentTime = video.startTime
        video.currentTime = video.currentTime >= video.endTime ? video.startTime : video.currentTime
    });

    // 一時停止されたとき
    video.addEventListener('pause', function() {
        console.log('一時停止されました。');
		console.log(`currentTime: ${video.currentTime}s`);        
    });

	 // 再生中の現在時刻を監視
    video.addEventListener('timeupdate', function() {				
		console.log('動画コマ更新')
        // TODO:currentTimeをつかって、hatsuwaObjsを検索し、そのrowを装飾せよ
        // TODO:hatsuwaObjをどうやってここで受け取るか？constにしないとexportできないが。。
        // TODO:発話の探索アルゴリズムを最適化したほうがいいかも。まずは次の発話から・・・とか。
        for (let hatsuwaObj of hatsuwaObjs){
            if(
                (video.currentTime >= hatsuwaObj.start)
                &&
                (video.currentTime < hatsuwaObj.end)
            ){
                console.log('hatsuwaObj.structureID: ', hatsuwaObj.structureID)
                /*
                <span>たちから、.globalTagID == i-j-k
                domUtils.jsでspan着色・脱色関数をつくる
                （）現在の
                ・colorSpanByCurrentTime(hatsuwaObj.structureID)
                （）前ループの塗りつぶし済spansを脱色
                ・bleachSpan(hatsuwaObj.structureID)                
                （）新しい着色spansをセット。
                */
            }                                    
        }


		// TODO:手動スライダで動画を動かしたときに、video.startTimeとvideo.endTimeをどうする？
        if (video.currentTime >= video.endTime) {
            video.pause(); // 終了時間に達したら一時停止
            // video.currentTime = video.startTime; // TODO:必要に応じて再度開始時間に戻す？それともそのまま？
            // console.log('指定された区間の再生が完了しました。');
        }
    });

    // 動画が終了したとき
    video.addEventListener('ended', function() {
        console.log('動画が終了しました。');
    });
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