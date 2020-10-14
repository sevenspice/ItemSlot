# 概要

RPGツクールMZ用のプラグイン。

マップにアイテムスロットを表示する。

# プロジェクトへのインポート方法

1. プラグインをダウンロードする。以下のリンクをクリックすると最新のバイナリを落とせる。
    * [ItemSlot-1.0.0](https://storage.googleapis.com/aurelia-github/rpgmaker-mz/itemslot/ItemSlot-1.0.0.zip)

3. ダウンロードしたZIPファイルを展開する。

2. ItemSlot.jsをRPGツクールMZのプロジェクトのプラグインフォルダにコピーする。

3. エディタのプラグイン管理からItemSlotを読み込んでONにする。

# 仕様

* プラグインが実行されると同時に以下のキーのインプット判定が有効になる。競合に注意すること。
```
Input.keyMapper['49'] = '1';
Input.keyMapper['50'] = '2';
Input.keyMapper['51'] = '3';
Input.keyMapper['52'] = '4';
Input.keyMapper['53'] = '5';
Input.keyMapper['54'] = '6';
Input.keyMapper['55'] = '7';
Input.keyMapper['56'] = '8';
Input.keyMapper['57'] = '9';
```

* アイテムスロットプラグインで選択されたアイテムを使用する場合は、独自に使用効果をエディタ等で実装する必要がある。
    * 実装例は[アイテム使用の実装例](#アイテム使用の実装例)を参考にすること。

* 本プラグインを導入すると自動的にメニュー画面におけるアイテム画面での挙動がカスタマイズされる。
    * アイテム画面表示中に画面上部にスロットへアイテムを設定するためのボタンを表示する。
    * アイテム選択中にキーボードの[1～9]のいずれかのキーまたはボタンを押すと対応するスロットへアイテムをセットする。

# アイテム使用の実装例

アイテムスロットでアイテムを使用するための実装例を以下に示す。

以下３つのコモンイベントを実装する。

<img src="https://storage.googleapis.com/aurelia-github/rpgmaker-mz/itemslot/common_event1.png?raw=true">

<img src="https://storage.googleapis.com/aurelia-github/rpgmaker-mz/itemslot/common_event2.png?raw=true">

<img src="https://storage.googleapis.com/aurelia-github/rpgmaker-mz/itemslot/common_event3.png?raw=true">

「アイテム共通処理」のコモンイベントを何らかのタイミングで呼び出すことでアイテムスロットで選択中のアイテムを使用できる。

# セーブデータロード時における実装例

スロットに設定されたアイテムはセーブデータで保持されるため、何らかの方法でロードを判定してプラグインを呼び出せばセーブ前の状態を再現できる。如何にその実装例を示す。

<img src="https://storage.googleapis.com/aurelia-github/rpgmaker-mz/itemslot/initialize_example.png?raw=true">

プラグインが呼び出された場合、`window.$gameItemSlot`にアイテムスロットの情報が格納される。
セーブ時に保存されているのであれば、この情報が既に存在するのでアイテムスロットを再度生成することで以前の状態を再現できる。


# 動作例

プラグインが動作しているデモを以下のGIFで示す。

<img src="https://storage.googleapis.com/aurelia-github/rpgmaker-mz/itemslot/itemslot.gif?raw=true">


# 開発

## 必要条件

| アプリケーション | バージョン               |
| :--------------- | :----------------------- |
| node.js          | `>=8.11.4`               |
| npm              | `>=5.6.0`                |
| gulp             | `>=2.3.0`                |
| parcel           | `>=1.12.4`               |

[Gulp](https://gulpjs.com/)を以下のコマンドでインストールする。
```
npm install -g gulp
```

[Parcel](https://ja.parceljs.org/)を以下のコマンドでインストールする。
```
npm install -g parcel-bundler
```


## スタートガイド

リポジトリをクローンする。
```
git clone https://github.com/sevenspice/ItemSlot.git
```

ディレクトリを移動する。
```
cd ItemSlot
```

設定ファイルを編集する。
```
copy mv.origin.json mv.json
```
* mv.jsonの`dest`に、インポートしたいRPGツクールMZプロジェクトのプラグインフォルダを指定すること。

モジュールをインストールする。
```
npm install
```

コンパイルとプロジェクトへのコピーを実行する。
```
gulp
```

以上で、ゲームプロジェクトにプラグインがインポートされる。
