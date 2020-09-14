'use strict';
/* global PluginManager */
/* global ImageManager  */
/* global Input  */
/* global PIXI   */
/* global Bitmap */
/* global SceneManager   */
/* global Scene_Item     */
/* global $gameParty     */
/* global Graphics       */
/* global Scene_Map      */
/* global Sprite         */
/* global TouchInput     */
/* global Window_Base    */
/* global Window_Message */
/* global Game_Action  */
/* global SoundManager */
//=============================================================================
// ItemSlot.js
//=============================================================================


/*:
 * @target MZ
 * @plugindesc Itemslot plugin.
 * @author @BananaPepperTK
 *
 * @help This is a plugin to draw a circular light.
 * 
 * For more information
 *   https://github.com/sevenspice/ItemSlot
 *
 *
 */

/*:ja
 * @target MZ
 * @plugindesc アイテムスロットプラグイン。
 * @author @BananaPepperTK
 *
 * @help マップ上にアイテムスロットを表示します。
 *
 * 詳細
 *   https://github.com/sevenspice/ItemSlot
 *
 * @param BackgroundColor
 * @desc スロットの背景色
 * @default 0x000000
 *
 * @param SlotCount
 * @desc スロットの数。最小:1 最大:9
 * @default 5
 *
 * @param SlotMarginLeft
 * @desc スロット間の左マージン
 * @default 10
 *
 * @param SlotMarginRight
 * @desc スロット間の右マージン
 * @default 10
 *
 * @param SlotMarginTop
 * @desc スロットの上マージン
 * @default 10
 *
 * @param SlotMarginBottom
 * @desc スロットの下マージン
 * @default 10
 *
 * @param VerticalAlign
 * @desc アイテムスロットの配置位置。BOTTOM or TOP
 * @default BOTTOM
 *
 * @param SlotFontSize
 * @desc スロットに描画される数字のフォントサイズ
 * @default 10
 *
 * @param ItemSlotFontSize
 * @desc スロットに描画される数字のフォントサイズ
 * @default 15
 *
 * @param LineWeight
 * @desc 選択枠の線の太さ
 * @default 2
 *
 * @param LineColor
 * @desc 選択枠の色
 * @default 0xF0E68C
 *
 * @param LineMargin
 * @desc 選択枠の上下左右マージン
 * @default 8
 *
 * @command show
 * @text 表示
 * @desc アイテムスロットを表示します。
 *
 * @command update
 * @text 更新
 * @desc アイテムスロットを現在所有しているアイテムで更新します。
 *
 * @command hide
 * @text 非表示
 * @desc アイテムスロットを非表示にします。
 * 
 */

// グローバル変数を追加する
// このプラグインを有効化すると追加されるため競合に注意すること
window.$gameItemSlot = null;

( function() {
    const pluginName = 'ItemSlot';
    const iconSet    = ImageManager.loadSystem('IconSet');

    Input.keyMapper['49'] = '1';
    Input.keyMapper['50'] = '2';
    Input.keyMapper['51'] = '3';
    Input.keyMapper['52'] = '4';
    Input.keyMapper['53'] = '5';
    Input.keyMapper['54'] = '6';
    Input.keyMapper['55'] = '7';
    Input.keyMapper['56'] = '8';
    Input.keyMapper['57'] = '9';

    // アイテムスロットの配置位置定義
    const SLOT_VERTICAL_ALIGN = {
        TOP:    Symbol(),
        BOTTOM: Symbol()
    };

    // 枠の背景色
    let backgroundColor = 0x000000;

    // 枠の透明度
    let backgroundAlpha = 0.3;

    // 枠の角丸の半径
    let radius = 10;

    // 配置するアイテムスロット枠数
    let slotCount = 9;

    // 枠のマージン
    let slotMarginLeft   = 10;
    let slotMarginRight  = 10;
    let slotMarginTop    = 10;
    let slotMarginBottom = 10;

    // アイテムスロットの配置位置
    let verticalAlign = SLOT_VERTICAL_ALIGN.BOTTOM;

    // 選択枠
    let lineWeight = 2;
    let lineColor  = 0xF0E68C;
    let lineMargin = 8;

    // スロットに描画するフォントのサイズ
    let slotFontSize = 10;

    // アイテム一覧に描画するスロットIDのフォントサイズ
    let itemSlotFontSize = 15;

    // プラグイン初期化
    // コマンドパラメーターの取得
    const parameters = PluginManager.parameters(pluginName);
    backgroundColor  = parseInt(parameters['BackgroundColor'], 16);

    slotCount = parseInt(parameters['SlotCount']);
    if (slotCount <= 0) slotCount = 1;
    if (slotCount > 9)  slotCount = 9;

    slotMarginLeft   = parseInt(parameters['SlotMarginLeft']);
    slotMarginRight  = parseInt(parameters['SlotMarginRight']);
    slotMarginTop    = parseInt(parameters['SlotMarginTop']);
    slotMarginBottom = parseInt(parameters['SlotMarginBottom']);

    if (parameters['VerticalAlign'] == 'TOP') verticalAlign = SLOT_VERTICAL_ALIGN.TOP;
    else if(parameters['VerticalAlign'] == 'BOTTOM') verticalAlign = SLOT_VERTICAL_ALIGN.BOTTOM;
    else verticalAlign = SLOT_VERTICAL_ALIGN.BOTTOM;

    slotFontSize     = parseInt(parameters['SlotFontSize']);
    itemSlotFontSize = parseInt(parameters['ItemSlotFontSize']);

    lineWeight = parseInt(parameters['LineWeight']);
    lineColor  = parseInt(parameters['LineColor'], 16);
    lineMargin = parseInt(parameters['LineMargin']);

    // スロットに使用する文字のスタイル
    const slotFontStyle = new PIXI.TextStyle({
        fill: 'white'
        , fontWeight: 'bold'
        , strokeThickness: 4
        , miterLimit: 15
        , align : 'center'
        , fontSize: slotFontSize
    });

    // プラグインで使用する関数群
    /**
     * アイテムのアイコン画像を取得する巻数
     * @param {Bitmap}  iconset  アイコン一覧のスプライト
     * @param {integer} iconIdex アイコン番号
     * @return {Bitmap} アイコンのビットマップを返却
     */
    const getIcon = (iconset, iconIdex) => {
        const iconX  = (iconIdex % 16) * ImageManager.iconWidth;
        const iconY  = Math.floor(iconIdex / 16) * ImageManager.iconHeight;
        const bitmap = new Bitmap(ImageManager.iconWidth, ImageManager.iconHeight);
        bitmap.blt(iconset, iconX, iconY, ImageManager.iconWidth, ImageManager.iconHeight, 0, 0, ImageManager.iconWidth, ImageManager.iconHeight);
        return bitmap;
    };

    /**
     * アイテムウィンドウからスロットにアイテムをセットする関数
     * @param  {integer} inputKey キー番号
     * @return {boolean} true or false
     */
    const slotSet = (inputKey) => {
        if (SceneManager._scene instanceof Scene_Item) {
            // アイテムを取得する
            const item = SceneManager._scene._itemWindow.itemAt(SceneManager._scene._itemWindow.index());
            if (!item) return false;

            // プレイヤーの所有しているアイテムに選択されキーを設定する
            if (typeof $gameParty._items.slots != 'object') return false;
            if ($gameParty._items.slots[inputKey]) {
                // 対象スロットから取り消し
                if ($gameParty._items.slots[inputKey].id == item.id) $gameParty._items.slots[inputKey] = null;
            } else {
                // 既にスロットにセットされているアイテムの場合は処理を終了する
                const keys = Object.keys($gameParty._items.slots);
                for (let i = 0; i < keys.length; i++) {
                    if ($gameParty._items.slots[keys[i]]) {
                        const id = $gameParty._items.slots[keys[i]].id;
                        if (item.id == id) return false;
                    }
                }

                // 対象スロットへセット
                $gameParty._items.slots[inputKey] = item;
            }

            SceneManager._scene._itemWindow.refresh();
        }
    };

    /**
     * アイテムスロットクラス
     */
    class ItemSlot {
        constructor(
            _slotCount
            , _slotMarginLeft
            , _slotMarginRight
            , _slotMarginTop
            , _slotMarginBottom
            , _verticalAlign
            , _radius
            , _backgroundColor
            , _backgroundAlpha
            , _slotFontStyle
            , _iconSet
            , _lineWeight
            , _lineColor
            , _lineMargin
        ) {
            this.slotOn           = false;
            this.slotCount        = _slotCount;
            this.slotMarginLeft   = _slotMarginLeft;
            this.slotMarginRight  = _slotMarginRight;
            this.slotMarginTop    = _slotMarginTop;
            this.slotMarginBottom = _slotMarginBottom;
            this.verticalAlign    = _verticalAlign;
            this.radius           = _radius;
            this.backgroundColor  = _backgroundColor;
            this.backgroundAlpha  = _backgroundAlpha;
            this.slotFontStyle    = _slotFontStyle;
            this.iconSet          = _iconSet;
            this.lineWeight       = _lineWeight;
            this.lineColor        = _lineColor;
            this.lineMargin       = _lineMargin;

            // スロット
            this.slots = [];

            // スロット枠のサイズ
            this.slotWidth  = SceneManager._scene._spriteset._tilemap._tileWidth;
            this.slotHeight = SceneManager._scene._spriteset._tilemap._tileHeight;

            // アイテムスロット全体の幅と高さを算出する
            this.boxWidth  = Math.floor( ( this.slotWidth + this.slotMarginLeft + this.slotMarginRight ) * this.slotCount );
            this.boxHeight = Math.floor( this.slotHeight + this.slotMarginTop + this.slotMarginBottom );

            // アイテムスロットの配置開始位置を算出する
            this.startX = Math.floor((( Graphics.width - this.boxWidth ) / 2) + this.slotMarginLeft);
            if (this.verticalAlign == SLOT_VERTICAL_ALIGN.BOTTOM ) this.startY = Math.floor(Graphics.height - this.boxHeight);
            else if (this.verticalAlign == SLOT_VERTICAL_ALIGN.TOP ) this.startY = this.slotMarginTop;
            else this.startY = Math.floor(Graphics.height - this.boxHeight);

            for (let i = 0; i < this.slotCount; i++) {
                // スロットの表示位置の算出
                const x = this.startX + (i * ( this.slotMarginLeft + this.slotWidth + this.slotMarginRight));
                const y = this.startY;

                const slot = new Slot(
                    (i + 1)
                    , x
                    , y
                    , this.slotWidth
                    , this.slotHeight
                    , this.radius
                    , this.backgroundColor
                    , this.backgroundAlpha
                    , this.slotFontStyle
                    , this.iconSet
                    , this.lineWeight
                    , this.lineColor
                    , this.lineMargin
                );
                this.slots.push(slot);
            }

            return ItemSlot.instance;
        }

        /**
         * アイテムスロットを描画する
         */
        show () {
            for (let i = 0; i < this.slotCount; i++) {
                this.slots[i].show();
            }
        }

        /**
         * アイテムスロットにセットされたアイテム情報とスロットの描画を更新する
         */
        update () {
            // パーティーが所有しているアイテムと個数の一覧
            const partyItems = $gameParty._items;

            // パーティーが所有しているアイテム一覧からスロットに設定されたアイテム一覧を取り出す
            let slotItems = $gameParty._items.slots;
            let keys      = Object.keys(slotItems);

            // まず所有しているアイテムがなくなっている場合を確認する
            for (let i = 0; i < keys.length; i++) {
                if (slotItems[keys[i]]) {
                    if (!$gameParty._items[slotItems[keys[i]].id]) {
                        // アイテムをすでに所有していない場合はスロットから外す
                        $gameParty._items.slots[keys[i]] = null;
                    }
                }
            }

            // 更新
            slotItems = $gameParty._items.slots;
            keys      = Object.keys(slotItems);

            // スロットにアイテムを渡して描画
            for (let i = 0; i < keys.length; i++) {
                if (slotItems[keys[i]]) {
                    slotItems[keys[i]].haveCount = partyItems[slotItems[keys[i]].id]; // アイテムに所持数情報を追加・更新する
                    this.slots[(keys[i] - 1)].update(slotItems[keys[i]]);
                } else {
                    this.slots[(keys[i] - 1)].update(null);
                }
            }

        }

        /**
         * アイテムスロットの描画を消す
         */
        hide () {
            for (let i = 0; i < this.slotCount; i++) {
                this.slots[i].hide();
            }
        }
    }

    /**
     * スロットクラス
     */
    class Slot {
        constructor(
            id
            , x
            , y
            , width
            , height
            , radius
            , color
            , alpha
            , fontStyle
            , iconSet
            , lineWeight
            , lineColor
            , lineMargin
        ) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.width  = width;
            this.height = height;
            this.radius = radius;
            this.color  = color;
            this.alpha  = alpha;
            this.fontStyle  = fontStyle;
            this.iconSet    = iconSet;
            this.lineWeight = lineWeight;
            this.lineColor  = lineColor;
            this.lineMargin = lineMargin;

            this.item = null;

            this.isClick = false;

            this.current   = null;
            this.number    = null;
            this.slot      = null;
            this.icon      = null;
            this.count     = null;

            this.open = false;
        }

        show() {
            if (!this.open) {
                if (this.number  != null) SceneManager._scene.removeChild(this.number);
                if (this.slot    != null) SceneManager._scene.removeChild(this.slot);
                if (this.icon    != null) SceneManager._scene.removeChild(this.icon);
                if (this.current != null) SceneManager._scene.removeChild(this.current);
                if (this.count   != null) SceneManager._scene.removeChild(this.count);

                if (SceneManager._scene instanceof Scene_Map) {
                    let slot    = null;
                    let icon    = null;
                    let count   = null;
                    let number  = null;
                    let current = null;

                    // 枠生成
                    slot = new PIXI.Graphics();
                    slot.lineStyle(0);
                    slot.beginFill(this.color);
                    slot.drawRoundedRect(this.x, this.y, this.width, this.height, this.radius);
                    slot.endFill();
                    slot.alpha = this.alpha;

                    // 選択状態生成
                    if(this.isClick) {
                        current = new PIXI.Graphics();
                        current.lineStyle(this.lineWeight, this.lineColor);
                        current.drawRoundedRect(
                            Math.floor(this.x - this.lineMargin)
                            , Math.floor(this.y - this.lineMargin)
                            , Math.floor(this.width  + (this.lineMargin * 2))
                            , Math.floor(this.height + (this.lineMargin * 2))
                            , this.radius
                        );
                    }

                    // キー番号生成
                    number = new PIXI.Text(this.id, this.fontStyle);
                    number.x = Math.floor((this.x + ((this.width - number.width) / 2)));
                    number.y = Math.floor((this.y - (number.height/ 2)));

                    if (this.item) {
                        const iconIndex = this.item.iconIndex;
                        let   haveCount = this.item.haveCount;
                        if (haveCount > 99) {
                            haveCount = 99;
                        }

                        // 表示するアイコン生成
                        icon = new Sprite();
                        icon.bitmap = getIcon(this.iconSet, iconIndex);
                        const iconX = this.x + Math.floor((this.width  - ImageManager.iconWidth)  / 2);
                        const iconY = this.y + Math.floor((this.height - ImageManager.iconHeight) / 2);
                        icon.x = iconX;
                        icon.y = iconY;
                        icon.alpha = 1.0;

                        // 所持数
                        count = new PIXI.Text(haveCount, this.fontStyle);
                        count.x = Math.floor((this.x + this.width)  - count.width  - 5);
                        count.y = Math.floor((this.y + this.height) - count.height - 5);
                    }

                    if (slot    != null) this.slot    = SceneManager._scene.addChild(slot);
                    if (icon    != null) this.icon    = SceneManager._scene.addChild(icon);
                    if (count   != null) this.count   = SceneManager._scene.addChild(count);
                    if (number  != null) this.number  = SceneManager._scene.addChild(number);
                    if (current != null) this.current = SceneManager._scene.addChild(current);
                    this.open = true;
                }
            }
        }

        update(item) {
            this.open = false;
            this.item = item;
            this.show();
        }

        hide() {
            if (this.number  != null) SceneManager._scene.removeChild(this.number);
            if (this.slot    != null) SceneManager._scene.removeChild(this.slot);
            if (this.icon    != null) SceneManager._scene.removeChild(this.icon);
            if (this.current != null) SceneManager._scene.removeChild(this.current);
            if (this.count   != null) SceneManager._scene.removeChild(this.count);
        }
    }

    // ------------------------------------
    // 以下はプラグインコマンド実行処理群
    // ------------------------------------
    /**
     * アイテムスロットの呼び出し
     * ※ アイテムスロットを使用する場合は最低1回は呼び出しが必要
     */
    let itemslot = null;
    PluginManager.registerCommand(pluginName, 'show', function() {
        if (!itemslot) {
            itemslot = new ItemSlot(
                slotCount
                , slotMarginLeft
                , slotMarginRight
                , slotMarginTop
                , slotMarginBottom
                , verticalAlign
                , radius
                , backgroundColor
                , backgroundAlpha
                , slotFontStyle
                , iconSet
                , lineWeight
                , lineColor
                , lineMargin
            );

            // グローバル変数に追加
            window.$gameItemSlot = itemslot;
            // -------------------------------------------
            // 以下はツクールMZから呼び出すためのAPIの定義
            // -------------------------------------------
            /**
             * 選択されているスロットにセットされているアイテムを返却する
             * @param {string} key アイテムから取得したい情報のキー名
             * @return {object} 指定されたキーのアイテム情報
             */
            window.$gameItemSlot.currentItem = (key) => {
                const slots = window.$gameItemSlot.slots;
                let item  = null;

                for(let i = 0; i < slots.length; i++) {
                    if(slots[i].isClick) item = slots[i].item;
                }

                if(item) return item[key];
                else '';
            };

            /**
             * 選択されているスロットにセットされているアイテムの数を返却する
             */
            window.$gameItemSlot.currentCount = () => {
                const slots = window.$gameItemSlot.slots;
                for(let i = 0; i < slots.length; i++) {
                    if(slots[i].isClick) return slots[i].item.haveCount;
                }

                return 0;
            };

            /**
             * 選択されているスロットにセットされているアイテムを通常使用する
             */
            window.$gameItemSlot.defaultUse = () => {
                const slots   = window.$gameItemSlot.slots;
                const members = $gameParty.movableMembers();
                const actor   = members.shift(); // 先頭のメンバー

                let item = null;
                for(let i = 0; i < slots.length; i++) {
                    if(slots[i].isClick) item = slots[i].item;
                }

                if(!item) return false;

                // 先頭のメンバーがアイテムを使用する
                SoundManager.playUseItem();
                actor.useItem(item);

                const action = new Game_Action(actor);
                action.setItemObject(item);

                let numRepeats = action.numRepeats();
                if(!numRepeats) numRepeats = 1;

                // 対象はパーティ全体
                // ※ アイテムスロットの用途としてはプレイヤーは数は常に1人を想定している
                for (const target of $gameParty.members()) {
                    for (let i = 0; i < numRepeats; i++) {
                        action.apply(target);
                    }
                }

                // アイテム情報を更新
                action.applyGlobal();

                // 描画更新
                window.$gameItemSlot.update();

                return true;
            };

            // プレイヤーの所有するアイテム一覧に, 表示する対象スロットIDの一覧表となる入れ物を用意しておく
            if(typeof $gameParty._items.slots != 'object') {
                $gameParty._items.slots = {};
                for(let i = 0; i < slotCount; i++) $gameParty._items.slots[(i+1)] = null;

                // アイテムスロット描画
                itemslot.show();
            } else {
                // セーブデータ対策
                // 過去のセーブデータよりスロット数を少ない仕様になった場合に既にセットされているアイテムを切り捨てる
                const keys = Object.keys($gameParty._items.slots);
                if (itemslot.slotCount < keys.length) {
                    const slots = {};
                    for(let i = 0; i < slotCount; i++) {
                        slots[(i+1)] = $gameParty._items.slots[(i+1)];
                    }

                    // 入れ替え
                    $gameParty._items.slots = slots;
                }

                // 描画を更新
                itemslot.update();
            }

            // ON
            itemslot.slotOn = true;
        } else {
            // アイテムスロット描画
            itemslot.show();

            // ON
            itemslot.slotOn = true;
        }

    });

    /**
     * アイテムスロット更新
     */
    PluginManager.registerCommand(pluginName, 'update', function() {
        if (itemslot) {
            itemslot.update();
        }
    });

    /**
     * アイテムスロット非表示
     */
    PluginManager.registerCommand(pluginName, 'hide', function() {
        if (itemslot) {
            itemslot.hide();
            itemslot.slotOn = false;
        }
    });

    // -------------------------------------------
    // 以下はツクールMZにある機能を改造する処理群
    // -------------------------------------------
    /**
     * シーン更新時の挙動を改造する
     * 入力判定系の処理を追加する
     */
    const _SceneManager_updateMain = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        _SceneManager_updateMain.apply(this, arguments);

        // アイテム画面からスロットセット処理
        for (let i = 0; i < slotCount; i++) {
            const inputKey = `${(i + 1)}`;
            if (Input.isTriggered(inputKey)) {
                slotSet(inputKey);
            }
        }

        // マウス左クリック
        if (itemslot && TouchInput.isTriggered()) {
            const clickX = TouchInput.x;
            const clickY = TouchInput.y;

            // スロットをクリックされたかどうかを判定する
            for (let i = 0; i < slotCount; i++) {
                if (
                    (clickX >= itemslot.slots[i].x && clickX <= (itemslot.slots[i].x + itemslot.slots[i].width))
                    && (clickY >= itemslot.slots[i].y && clickY <= (itemslot.slots[i].y + itemslot.slots[i].height))
                ) {
                    if (itemslot.slotOn) itemslot.slots[i].isClick = true;

                    // 選択されたスロット以外は false にする
                    for (let j = 0; j < slotCount; j++) {
                        if (i != j) itemslot.slots[j].isClick = false;
                    }
                }
            }

            // アイテムスロットを更新
            itemslot.update();
        }
    };

    /**
     * マップをタッチされた際の挙動を改造する
     * スロットをクリックされた場合は移動させない
     */
    const _Scene_Map_prototype_onMapTouch = Scene_Map.prototype.onMapTouch;
    Scene_Map.prototype.onMapTouch = function() {
        if (itemslot) {
            const clickX = TouchInput.x;
            const clickY = TouchInput.y;

            let canMove = true;
            for (let i = 0; i < slotCount; i++) {
                if (
                    (clickX >= itemslot.slots[i].x && clickX <= (itemslot.slots[i].x + itemslot.slots[i].width))
                    && (clickY >= itemslot.slots[i].y && clickY <= (itemslot.slots[i].y + itemslot.slots[i].height))
                    && itemslot.slotOn
                ) {
                    canMove = false;
                }
            }

            if (canMove) return _Scene_Map_prototype_onMapTouch.apply(this, arguments);
            return ;
        } else {
            return _Scene_Map_prototype_onMapTouch.apply(this, arguments);
        }
    };

    /**
     * アイテムリストのアイテム描画を改造する
     * セットしているスロットIDをアイテム名描画部分に追記する
     */
    const _Window_Base_prototype_drawItemName = Window_Base.prototype.drawItemName;
    Window_Base.prototype.drawItemName = function(item, x, y, width) {
        _Window_Base_prototype_drawItemName.apply(this, arguments);
        const keys = Object.keys($gameParty._items.slots);

        for (let i = 0; i < keys.length; i++) {
            if ($gameParty._items.slots[keys[i]] && $gameParty._items.slots[keys[i]].id == item.id) {
                this.contents.fontSize = itemSlotFontSize;
                this.contents.drawText(keys[i], x, Math.floor(y + (this.contents.fontSize / 3)), width, 0, 'left');
                this.resetFontSettings();
            }
        }
    };

    /**
     * マップシーン開始時の挙動を改造する
     * マップシーン開始時にアイテムスロットも更新する
     */
    const _Scene_Map_prototype_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_prototype_start.apply(this, arguments);
        if (itemslot) {
            if (itemslot.slotOn) itemslot.update();
        }
    };

    /**
     * メッセージウィンドウ表示時の挙動を改造する
     * メッセージウィンドウ表示時はアイテムスロットは表示しない
     */
    const _Window_Message_prototype_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        _Window_Message_prototype_startMessage.apply(this, arguments);
        if (SceneManager._scene instanceof Scene_Map && itemslot) {
            itemslot.hide();
        }
    };

    /**
     * メッセージウィンドウ終了時の挙動を改造する
     * メッセージウィンドウ終了時はアイテムスロットは表示する
     */
    const _Window_Message_prototype_terminateMessage = Window_Message.prototype.terminateMessage;
    Window_Message.prototype.terminateMessage = function() {
        _Window_Message_prototype_terminateMessage.apply(this, arguments);
        if (SceneManager._scene instanceof Scene_Map && itemslot) {
            itemslot.update();
        }
    };
})();
