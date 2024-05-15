/*NOTE:
その他の便利モジュールはここ
*/

/**
 * 配列要素を足しこむ関数
 * @param {Array} _numArray 
 * @param {Number} _index 
 * @returns 
 */
export function sum(_numArray, _index) {
	let result = 0
	for (let m = 0; m < _index; m++) {
		result += _numArray[m]
	}
	return result
}

/**
 * 文字列にふくまれる任意の文字たちの合計登場回数をカウント
 * @param {String} _string 
 * @param {String} _char1 1文字
 * @param {String} _char2 1文字
 * @returns {Number} カウント
 */
export function getCountOfChar(_string, _char1, _char2){
	let count = 0
	
	for(let i=0; i<_string.length; i++){
		if(_string[i]==_char1 || _string[i]==_char2){
			count++
		}
	}	
	return count
}

/**
 * 配列の最終要素を返す
 * @param {Array} array 
 * @returns {Any} 要素
 * NOTE:オブジェクトの配列の場合は、参照を返す。
 */
export function getLastElement(array) {
  if (array.length === 0) {
    return undefined; // 配列が空の場合は undefined を返すか、適切な処理を行う
  }

  return array[array.length - 1];
}

/**
 * 二重配列の指定インデックスi,jの要素が存在するか？
 * @param {Array} array 
 * @param {Number} i 
 * @param {Number} j 
 * @returns 
 */
export function isElementExist(array, i, j) {
	if (i >= 0 && i < array.length && j >= 0 && j < array[i].length) {
		return true // 要素が存在する場合
	} else {
		return false // 要素が存在しない場合
	}
}

// getMaxBracketsIndex
/**
 * 発話グループ内の"["の最大インデックスを取得する
 * @param {*} _hatsuwaGroup
 * @returns
 */
export function getMaxBracketsIndex(_hatsuwaGroup) {
	return _hatsuwaGroup
		.map((obj) => {
			return obj.text[0] == '[' ? true : false
		})
		.filter((bool) => {
			return bool == true
		}).length
}

//

//

/**
 * 数値から、その数値のピクセル文字列
 * @param {Number} _num
 * @returns {String} ピクセル文字列
 */
export function num2Px(_num) {
	return _num + 'px'
}

export function toInt(_num){
	const ceil = Math.ceil(_num)
	const floor = Math.floor(_num)
	const abs = Math.abs(ceil - _num) - Math.abs(_num - floor)

	let resultInt
	if(abs > 0){
		resultInt = floor
	}else{
		resultInt = ceil
	}
	return resultInt
}

/**
 * "ほげpx"の文字列から、数値取得
 * @param {String} _px
 * @returns {Number} 数値
 */
export function px2Num(_px) {
	return parseInt(_px, 10)
}
