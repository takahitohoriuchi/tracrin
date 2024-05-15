/*NOTE:
発話特殊記号をいじくるモジュールはここ
*/

import { getCountOfChar } from './otherUtils.js'


// 文字列を全部変換する。
// 発話ごとに、このキーがあるかを走査する。
// そのそれぞれが、これのどれに相当するのかを判断する。
// 最初のキーがあれば、開始と発話セットで同時に調べて、奇数番目が開始、偶数番目が終了。
// 必ず、ひとつの発話のなかに、開始/終了キーはセットで存在する？させよ！！！！


// 各発話に対して、それぞれのカッコキーでググり、そのなかでbeginキーだけでググル。（beginキーがあればendキーは必ず存在する）
// その発話内に、beginキーに相当するのがあれば、beginキーとendキーを、それぞれmodifiedのものに変換する
export const kukuriMarkObjs = {
    // 速い発話
    fast: {
        // 開始キー
        begin: {
            key: '<',            
            modifiedKey: '$s_b$'
        },
        // 終了キー
        end: {
            key: '>',
            modifiedKey: '$s_e$'
        }   
    },
    // 遅い発話
    slow: {
        // 開始キー            
        begin: {
            key: '>',
            modifiedKey: '$s_b$'
        },
        end: {
            key: '<',
            modifiedKey: '$s_e$'
        }
    },
    // しずか発話
    quiet: {
        // 開始キー
        begin: {
            key: '°',
            modifiedKey: '$q_b$'
        },
        // 終了キー
        end: {
            key: '°',
            modifiedKey: '$q_e$'
        }        
    }
}
const kukuriMarks = ['<', '>', '°']
const kukuriMarksModified = ['$s_b$', '$s_e$', '$q_b$', '$q_e$']

function isIncludeAnyKukuriMark(_text){    
    let result = false    
    for(let i=0; i<kukuriMarks.length; i++){
        // これが、最初記号とは限らない。
        if(_text.includes(kukuriMarks[i])){
            result = true
        }     
    }
    return result
}

function isIncludeAnyKukuriMarkModified(_text){    
    let result = false    
    for(let i=0; i<kukuriMarksModified.length; i++){
        // これが、最初記号とは限らない。
        if(_text.includes(kukuriMarksModified[i])){
            result = true
        }     
    }
    return result
}

function findStartIndexOfSubstring(str, substring) {
    const index = str.indexOf(substring);
    return index !== -1 ? index : null;
}

export async function tempConvertKukuriMarksInHatsuwa(_hatsuwaObj){
    console.log('この発話objを変換します', _hatsuwaObj)    
    console.log('\n\n\n\n\n\n\n\n\n\n\n\n')
    console.log('_hatsuwaObj.text: ', _hatsuwaObj.text)
    console.log('isIncludeAnyKukuriMark(_hatsuwaObj.text): ', isIncludeAnyKukuriMark(_hatsuwaObj.text))    
    while(isIncludeAnyKukuriMark(_hatsuwaObj.text)){
        const sortedMarkObjs = Object.values(kukuriMarkObjs).map(v=>{               
            let beginIndex = findStartIndexOfSubstring(_hatsuwaObj.text, v.begin.key)
            // return beginIndex
            return {
                beginKey: v.begin.key,
                beginModifiedKey: v.begin.modifiedKey,
                endKey: v.end.key,
                endModifiedKey: v.end.modifiedKey,
                index: beginIndex,
            }
            
        })
        // nullは排除
        .filter(e=>e.index)
        // .indexが小さい順にソート
        .sort((a,b)=>a.index - b.index)
        
        // ソート後最初要素オブジェについて、それ自身（=begin）と、それとペアとなるend記号を変換する
        _hatsuwaObj.text = _hatsuwaObj.text.replace(
            sortedMarkObjs[0].beginKey, 
            sortedMarkObjs[0].beginModifiedKey, 
        )
        console.log('sortedMarkObjs: ', sortedMarkObjs)

        _hatsuwaObj.text = _hatsuwaObj.text.replace(
            sortedMarkObjs[0].endKey, 
            sortedMarkObjs[0].endModifiedKey, 
        )
        console.log('変換後_hatsuwaObj.text: ', _hatsuwaObj.text)                                                    
    }
    
}

export async function reconvertKukuriMarksInHatsuwa(_hatsuwaObj){
    console.log('この発話objを変換します', _hatsuwaObj)    
    console.log('\n\n\n\n\n\n\n\n\n\n\n\n')
    console.log('isIncludeAnyKukuriMark(_hatsuwaObj.text): ', isIncludeAnyKukuriMark(_hatsuwaObj.text))    
    while(isIncludeAnyKukuriMarkModified(_hatsuwaObj.text)){
        const sortedMarkObjs = Object.values(kukuriMarkObjs).map(v=>{               
            let beginIndex = findStartIndexOfSubstring(_hatsuwaObj.text, v.begin.modifiedKey)
            // return beginIndex
            return {
                beginKey: v.begin.key,
                beginModifiedKey: v.begin.modifiedKey,
                endKey: v.end.key,
                endModifiedKey: v.end.modifiedKey,
                index: beginIndex,
            }
            
        })
        // nullは排除
        .filter(e=>e.index)
        // .indexが小さい順にソート
        .sort((a,b)=>a.index - b.index)
        
        // ソート後最初要素オブジェについて、それ自身（=begin）と、それとペアとなるend記号を変換する
        _hatsuwaObj.text = _hatsuwaObj.text.replace(
            sortedMarkObjs[0].beginModifiedKey, 
            sortedMarkObjs[0].beginKey, 
        )
        console.log('sortedMarkObjs: ', sortedMarkObjs)

        _hatsuwaObj.text = _hatsuwaObj.text.replace(
            sortedMarkObjs[0].endModifiedKey, 
            sortedMarkObjs[0].endKey, 
        )
        console.log('変換後_hatsuwaObj.text: ', _hatsuwaObj.text)                                                    
    }

}
// export async function reconvertHkukuriMarksInHatsuwa(_hatsuwaObj, _hatsuwaTagSpans)

// くくり記号（行末にこれらがきちゃいけない）
// const kukuris = [
//     // {
//     //     id: 'slow',
//     //     begin: '<',        
//     //     end: '>'         
//     // },
//     // {
//     //     id: 'fast',
//     //     begin: '>',
//     //     end: '<'
//     // },
//     // {
//     //     id: 'slow',
//     //     begin: '&lt;',        
//     //     end: '&gt;'         
//     // },
//     {
//         id: 'slow',
//         begin: '＜',        
//         end: '＞'         
//     },
//     {
//         id: 'fast',
//         begin: '&gt;',
//         end: '&lt;'
//     },
//     {
//         id: 'quiet',
//         begin: '°',
//         end: '°'
//     }
// ]
/*

行末文字が、開始記号一覧のどれかだったとき、どうOUT判定する？
それが「終了記号」だったらセーフ。
終了記号だと判定するにはどうする？？
「擬似判定↓」で切り抜けるか？？
・・・同じstring内に開始記号のほうもある？
・・・  あればセーフ
・・・  なければ、行末の記号は次stringへと送られる。

例：<おはよう>ござい>ます
これが、それぞれ開始記号なのか終了記号なのかは判断がつかないはず？
発話のなかで
1番目に出てきたのが開始記号。
2番目に出てきたのが終了記号。


*/


// 後ろ添え字記号（行頭にこれらがきちゃいけない）
const suffixes = ['?', '-']

export function isIncompleteKakko(_rowString){
    let bool = false
    if(_rowString.includes('(') && !_rowString.includes(')')){
        bool = true
    }
    return bool
}

export function isIncompleteKukuri(_rowString, _tag){
    /*    
    ・行末にククリ開始記号がきているならば、次の行に送る            
    */
    // 行末に開始記号が来てるか？？
    let kukuriMarkName = null
   Object.entries(kukuriMarkObjs).forEach(([k,v])=>{
    if(_rowString.endsWith(v.begin.modifiedKey)){
        kukuriMarkName = k
    }    
   })				
   return kukuriMarkName
}


export function isSuffixFirst(_rowString){
    console.log('_rowString[0]: ', _rowString[0])
    let bool = null
    for (let i = 0; i < suffixes.length; i++) {
        if (_rowString[0] == suffixes[i]) {
            bool = suffixes[i]
            break
        }
    }
    return bool    
}