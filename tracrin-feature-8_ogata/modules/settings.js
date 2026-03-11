/* 
【⚙️設定メニュー】ついてはこのファイルへ。
*/


/**
 * 発話グループごとの水平線のトグル
 */
export function toggleLine() {
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

/**
 * 開発用の見た目に変える
 */
export function toggleDev(){
	var checkbox = document.getElementById('toggle-dev');
	// 開発モードON
	if (checkbox.checked) {
		// // グループ水平線
		// var lines = document.querySelectorAll('.group-line');
        // lines.forEach(function(line) {
        //     line.style.borderTop = '2.0px dashed #bababa';
        // });
		// // 発話行のスタイル
		// rowElems.forEach(row=>{
		// 	row.style.border = '0.5px solid #86bd7d';
		// })
		// // 発話タグのスタイル
		// hatsuwaTagSpans.forEach(group=>{
		// 	group.forEach(htw=>{
		// 		htw.forEach(tag=>{
		// 			tag.style.border = '0.5px solid #bd7d9f';
		// 		})						
		// 	})
		// })
		// 各種エリア要素のスタイル
		headerArea.style.backgroundColor = 'red'
    }
	// 開発モードOFF
	else{
		headerArea.style.backgroundColor = 'transparent'
	}	
}
