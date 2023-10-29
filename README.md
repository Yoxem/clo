# clo
 - another personal draught of a typesetting language and engine.
 - website: https://kianting.info/wiki/w/Project:Clo
 - license: MIT 
 - issue tracking mailing list: `clo@kianting.info`

## changing journal
 - 20230904 建立 thenDo、matchRange的函數、refactor harfbuzzjs 以及libpdf 等測試界面
 - 20230905-06: 建立 : `toSome`, initial of basic tokenizer (`tokenize`),
   `matchAny`, `notDo`, `orDo`, `zeroOrMoreDo`, `zeroOrOnceDo`
 - 20230905-07:強化`tokenize`, 加強功能，加`Token`界面。
 - 20230907-08:強化`tokenize`。
 - 20230910 : add basic parser `CONST` rule, and add the grammar rule.
 - 20230914-15: 追加一寡 tokenizer ê 功能。
 - 20230918: 重新tuì下kàu頂起做parser. add rule
 - 20230921-22:add rule, report issue
 - 20230925-26: 試驗án-tsuánn解決[issue1](https://kianting.info/pipermail/clo_kianting.info/2023-September/000004.html), iáu-buē成功。
   - 凡勢用？
    ```
    FuncApp ::= Single FuncAppAux | Single
    FuncAppAUx ::= FunCallee FuncAppAUx
    FuncCallee ::= "(" ")" | "(" ARGS ")"
    ARGS = SINGLE "," ARGS | SINGLE
    ```
 - 20230928：basically fix `issue1`。其他ê物件猶著做。
 - 20230929：add multi args parsing for `callee`.
 - 20230930：tîng khí parser, using `js-token`.
 - 20231006: tîng siá parser, using `ts-parsec`.
 - 20231010: 初步完成tsit ê階段ê Parser`。
 - 20231012: clo->js converter successfully (maybe.)
 - 20231016：basic font guessing and `putText` function
 - 20231023-24:fix .ttc bug.
 - 20231026-27 : clo basic interface, preprocessor of stream of text,
  add cjk-english splitter, etc.
 - 20231029: hyphenating for english.

 ## 之後的做法
  - 先做一個前處理註冊器，註冊下列的前處理
    - 中英文間距
    - 換行點
    - 空白轉為 [glue]
  - 前處理完成字串後，必須要：
    - 算出字元的Box
    - 利用 frame/box 資訊分行、分頁
    - 然後算出每個Box的x, y, page
    - 最後納入排版

## 排版語法

使用lisp表示，但其實是陣列
```lisp
  (hglue 寬度 伸展值)
  (vglue 高度 伸展值)
  (bp 原始模式 斷行模式) ; breakpoint
  (nl) ; newline
  (em 數字)
  (ex 數字)
  (span {"font-family" : "Noto Sans" , "font-size" : 16 })
  (vbox 高度 內容)
```

## How to generate documents
 - `typedoc /path/to/index.js [/path/to/index2.js ...]`
the generated page will be stored in `/src`.