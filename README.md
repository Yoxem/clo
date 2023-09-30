# clo
another personal draught of a typesetting language and engine.
website: https://kianting.info/wiki/w/Project:Clo
License: MIT 

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
 - 20230930：tîng-khí parser, using `js-token`.