/* =========================================================
   MONKEYGG2 - MAIN SCRIPT
   ========================================================= */

/* =========================================================
   GLOBALS
   ========================================================= */

let currentMenu = $('.homepage');
let inGame = false;


/* =========================================================
   SAFE EVENT HELPERS
   ========================================================= */

/*
 * These were missing from the previous version.
 *
 * They safely attach events even when an element does not
 * exist on a particular page.
 */

function onClick(selector, callback) {

    document.addEventListener('click', function (event) {

        const element = event.target.closest(selector);

        if (!element) {
            return;
        }

        if (typeof callback === 'function') {
            callback.call(element, event);
        }
    });
}


function onInput(selector, callback) {

    document.addEventListener('input', function (event) {

        if (!event.target.matches(selector)) {
            return;
        }

        if (typeof callback === 'function') {
            callback.call(event.target, event);
        }
    });
}


function onChange(selector, callback) {

    document.addEventListener('change', function (event) {

        if (!event.target.matches(selector)) {
            return;
        }

        if (typeof callback === 'function') {
            callback.call(event.target, event);
        }
    });
}


/* =========================================================
   GAME LIST CLICK
   ========================================================= */

$(document).on('click', '#gamesList li', function (event) {

    event.preventDefault();
    event.stopImmediatePropagation();

    const gameUrl = fixGameUrl(
        this.getAttribute('url')
    );

    if (!gameUrl) {
        return false;
    }

    openGameInNewTab(gameUrl);

    return false;
});


/* =========================================================
   GAME URL FIX
   ========================================================= */

function fixGameUrl(url) {

    if (!url) {
        return url;
    }

    url = String(url).trim();

    /*
     * Remove accidental full-width spaces.
     */
    url = url.replace(/\u3000/g, '');

    /*
     * Absolute URLs
     */
    if (
        url.startsWith('http://') ||
        url.startsWith('https://')
    ) {

        try {

            const parsed = new URL(url);

            /*
             * Only modify our local game directories.
             */
            if (
                parsed.pathname.startsWith('/games/') &&
                !parsed.pathname.endsWith('/')
            ) {

                const lastPart =
                    parsed.pathname.substring(
                        parsed.pathname.lastIndexOf('/') + 1
                    );

                /*
                 * Don't modify actual files.
                 */
                if (!lastPart.includes('.')) {
                    parsed.pathname += '/';
                }
            }

            return parsed.toString();

        } catch (error) {

            console.error(
                'Could not parse game URL:',
                url,
                error
            );

            return url;
        }
    }


    /*
     * Relative game URLs.
     */
    if (url.startsWith('/games/')) {

        const lastPart =
            url.substring(
                url.lastIndexOf('/') + 1
            );

        if (
            !lastPart.includes('.') &&
            !url.endsWith('/')
        ) {

            url += '/';
        }
    }

    return url;
}


/* =========================================================
   OPEN GAME
   ========================================================= */

function openGameInNewTab(gameUrl) {

    if (!gameUrl) {
        return;
    }

    gameUrl = fixGameUrl(gameUrl);

    let fullUrl;

    try {

        fullUrl = new URL(
            gameUrl,
            window.location.origin
        ).href;

    } catch (error) {

        console.error(
            'Invalid game URL:',
            gameUrl,
            error
        );

        return;
    }

    console.log(
        'Opening game:',
        fullUrl
    );

    /*
     * Open the game in a completely new tab.
     */
    const newTab = window.open(
        fullUrl,
        '_blank'
    );

    /*
     * If the browser allowed the popup, switch
     * the CURRENT tab to the Games page.
     */
    if (newTab) {

        try {
            newTab.opener = null;
        } catch (error) {
            // Ignore
        }

        window.location.href = '/games';

    } else {

        /*
         * Popup blocker fallback.
         *
         * Don't navigate away if the game failed to open.
         */
        alert(
            'Your browser blocked the new game tab. Please allow popups for this site.'
        );
    }
}


/* =========================================================
   HOME BUTTONS
   ========================================================= */

onClick(
    'logo img',
    returnHome
);

onClick(
    '#gameButton',
    returnHome
);

onClick(
    '#refresh',
    refreshPage
);


/* =========================================================
   DIALOGS
   ========================================================= */

$(document).on(
    'click',
    'dialog',
    function (event) {

        if (event.target === this) {
            this.close();
        }
    }
);


/* =========================================================
   JARO SIMILARITY
   ========================================================= */

function jaro_distance(s1, s2) {

    s1 = String(s1 || '');
    s2 = String(s2 || '');

    if (s1 === s2) {
        return 1.0;
    }

    const len1 = s1.length;
    const len2 = s2.length;

    if (
        len1 === 0 ||
        len2 === 0
    ) {
        return 0.0;
    }

    const maxDist =
        Math.max(
            Math.floor(
                Math.max(len1, len2) / 2
            ) - 1,
            0
        );

    let match = 0;

    const hashS1 =
        new Array(len1).fill(0);

    const hashS2 =
        new Array(len2).fill(0);


    for (
        let i = 0;
        i < len1;
        i++
    ) {

        for (
            let j = Math.max(
                0,
                i - maxDist
            );

            j < Math.min(
                len2,
                i + maxDist + 1
            );

            j++
        ) {

            if (
                s1[i] === s2[j] &&
                hashS2[j] === 0
            ) {

                hashS1[i] = 1;
                hashS2[j] = 1;

                match++;

                break;
            }
        }
    }


    if (match === 0) {
        return 0.0;
    }


    let t = 0;
    let point = 0;


    for (
        let i = 0;
        i < len1;
        i++
    ) {

        if (hashS1[i] === 1) {

            while (
                hashS2[point] === 0
            ) {
                point++;
            }

            if (
                s1[i] !== s2[point]
            ) {
                t++;
            }

            point++;
        }
    }


    t /= 2;


    return (
        match / len1 +
        match / len2 +
        (match - t) / match
    ) / 3.0;
}


function jaroWinklerSimilarity(
    s1,
    s2
) {

    const jaroDist =
        jaro_distance(
            s1,
            s2
        );


    if (jaroDist > 0.7) {

        let prefix = 0;


        for (
            let i = 0;

            i <
            Math.min(
                String(s1).length,
                String(s2).length
            );

            i++
        ) {

            if (
                String(s1)[i] ===
                String(s2)[i]
            ) {

                prefix++;

            } else {

                break;
            }
        }


        prefix =
            Math.min(
                4,
                prefix
            );


        return (
            jaroDist +
            0.1 *
            prefix *
            (1 - jaroDist)
        ).toFixed(6);
    }


    return jaroDist.toFixed(6);
}


/* =========================================================
   GAME LIST
   ========================================================= */

function updateList() {

    const searchElement =
        document.getElementById('search');

    const sortElement =
        document.getElementById('sort');

    const list =
        document.getElementById('gamesList');


    if (!list) {
        return;
    }


    const filter =
        searchElement
            ? searchElement.value
                .toLowerCase()
                .trim()
            : '';


    const sortType =
        sortElement
            ? sortElement.value
            : '';


    const elems =
        Array.from(
            list.querySelectorAll('li')
        );


    /*
     * Sort alphabetically.
     */

    elems.sort(
        function (a, b) {

            if (
                sortType ===
                'alphabetical'
            ) {

                return a.textContent
                    .localeCompare(
                        b.textContent
                    );
            }


            if (
                sortType ===
                'reverse'
            ) {

                return b.textContent
                    .localeCompare(
                        a.textContent
                    );
            }


            return 0;
        }
    );


    /*
     * Filter.
     */

    elems.forEach(
        function (item) {

            const name =
                item.textContent
                    .toLowerCase();


            const aliases =
                item.getAttribute(
                    'aliases'
                );


            let visible =
                name.includes(filter);


            if (
                filter === ''
            ) {

                visible = true;
            }


            /*
             * Check aliases.
             */

            if (
                !visible &&
                aliases
            ) {

                const aliasList =
                    aliases.split(',');


                for (
                    const alias of aliasList
                ) {

                    const cleanAlias =
                        alias
                            .trim()
                            .toLowerCase();


                    if (
                        cleanAlias.includes(
                            filter
                        )
                    ) {

                        visible = true;
                        break;
                    }


                    if (
                        filter.length > 1 &&
                        jaroWinklerSimilarity(
                            filter,
                            cleanAlias
                        ) >= 0.7
                    ) {

                        visible = true;
                        break;
                    }
                }
            }


            /*
             * Fuzzy search.
             */

            if (
                !visible &&
                filter.length > 1
            ) {

                const similarity =
                    parseFloat(
                        jaroWinklerSimilarity(
                            filter,
                            name
                        )
                    );


                if (
                    similarity >= 0.7
                ) {

                    visible = true;
                }
            }


            item.style.display =
                visible
                    ? ''
                    : 'none';
        }
    );


    /*
     * Put sorted elements back.
     */

    elems.forEach(
        function (item) {
            list.appendChild(item);
        }
    );


    /*
     * Preserve existing game-list
     * functionality if present.
     */

    if (
        typeof updateGameList ===
        'function'
    ) {

        updateGameList();
    }
}


onInput(
    '#search',
    updateList
);


onChange(
    '#sort',
    updateList
);


/* =========================================================
   DRAG BUTTONS
   ========================================================= */

const gameButton =
    document.getElementById(
        'gameButton'
    );

const refreshButton =
    document.getElementById(
        'refresh'
    );


if (gameButton) {
    dragElement(gameButton);
}


if (refreshButton) {
    dragElement(refreshButton);
}


/* =========================================================
   EASTER EGGS
   ========================================================= */

const sequences = [

    {
        keys: [
            'ArrowUp',
            'ArrowUp',
            'ArrowDown',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'ArrowLeft',
            'ArrowRight',
            'KeyB',
            'KeyA',
            'Enter'
        ],

        action: function () {

            alert(
                'No easter egg here'
            );
        }
    },

    {
        keys: [
            'KeyL',
            'KeyE',
            'KeyT',
            'Space',
            'KeyI',
            'KeyT',
            'Space',
            'KeyS',
            'KeyN',
            'KeyO',
            'KeyW'
        ],

        action: snow
    }

];


let sequenceIndex = 0;


document.addEventListener(
    'keydown',
    function (event) {

        let matched = false;


        for (
            const sequence of sequences
        ) {

            if (
                event.code ===
                sequence.keys[
                    sequenceIndex
                ]
            ) {

                matched = true;

                sequenceIndex++;


                if (
                    sequenceIndex ===
                    sequence.keys.length
                ) {

                    sequence.action();

                    sequenceIndex = 0;
                }

            } else if (
                event.code ===
                sequence.keys[0]
            ) {

                matched = true;

                sequenceIndex = 1;
            }
        }


        if (!matched) {
            sequenceIndex = 0;
        }
    }
);


/* =========================================================
   SNOW
   ========================================================= */

function snow() {

    const canvas =
        document.createElement(
            'canvas'
        );


    const style =
        canvas.style;


    style.position = 'fixed';
    style.left = '0';
    style.top = '0';
    style.width = '100vw';
    style.height = '100vh';
    style.zIndex = '100000';
    style.pointerEvents = 'none';


    document.body.prepend(
        canvas
    );


    const ctx =
        canvas.getContext('2d');


    if (!ctx) {
        return;
    }


    const particles = 250;


    let width =
        canvas.width =
        window.innerWidth;


    let height =
        canvas.height =
        window.innerHeight;


    const snowflakes = [];


    for (
        let i = 0;
        i < particles;
        i++
    ) {

        snowflakes.push({

            x:
                Math.random() *
                width,

            y:
                Math.random() *
                height,

            size:
                Math.random() * 3 + 1,

            speed:
                Math.random() * 2 + 1,

            drift:
                Math.random() * 1 - 0.5
        });
    }


    function resize() {

        width =
            canvas.width =
            window.innerWidth;

        height =
            canvas.height =
            window.innerHeight;
    }


    window.addEventListener(
        'resize',
        resize
    );


    function animate() {

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        ctx.fillStyle =
            'white';


        for (
            const flake of snowflakes
        ) {

            flake.y +=
                flake.speed;

            flake.x +=
                flake.drift;


            if (
                flake.y > height
            ) {

                flake.y = -10;

                flake.x =
                    Math.random() *
                    width;
            }


            if (
                flake.x > width
            ) {

                flake.x = 0;
            }


            if (
                flake.x < 0
            ) {

                flake.x = width;
            }


            ctx.beginPath();

            ctx.arc(
                flake.x,
                flake.y,
                flake.size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        requestAnimationFrame(
            animate
        );
    }


    animate();


    setTimeout(
        function () {

            canvas.remove();

            window.removeEventListener(
                'resize',
                resize
            );

        },
        20000
    );
}


/* =========================================================
   DRAG ELEMENT
   ========================================================= */

function dragElement(elmnt) {

    if (!elmnt) {
        return;
    }


    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;


    elmnt.onmousedown =
        dragMouseDown;


    function dragMouseDown(e) {

        e =
            e ||
            window.event;


        /*
         * We intentionally allow the element to
         * receive the mouse event.
         */
        pos3 =
            e.clientX;

        pos4 =
            e.clientY;


        document.onmouseup =
            closeDragElement;

        document.onmousemove =
            elementDrag;
    }


    function elementDrag(e) {

        e =
            e ||
            window.event;


        e.preventDefault();


        pos1 =
            pos3 -
            e.clientX;


        pos2 =
            pos4 -
            e.clientY;


        pos3 =
            e.clientX;

        pos4 =
            e.clientY;


        elmnt.style.top =
            (
                elmnt.offsetTop -
                pos2
            ) + 'px';


        elmnt.style.left =
            (
                elmnt.offsetLeft -
                pos1
            ) + 'px';
    }


    function closeDragElement() {

        document.onmouseup =
            null;

        document.onmousemove =
            null;
    }
}


/* =========================================================
   HOME
   ========================================================= */

function returnHome() {

    if (
        currentMenu &&
        currentMenu.length
    ) {

        currentMenu.fadeOut(
            300,
            function () {

                $('#everything-else')
                    .fadeIn(200);

                $('.games')
                    .hide();

                $('.homepage')
                    .fadeIn(200);
            }
        );

    } else {

        $('#everything-else')
            .fadeIn(200);

        $('.games')
            .hide();

        $('.homepage')
            .fadeIn(200);
    }


    currentMenu =
        $('.homepage');


    if (
        typeof preferences !==
        'undefined'
    ) {

        inGame =
            !preferences.background;
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshPage() {

    const iframe =
        document.querySelector(
            '#page-loader iframe'
        );


    if (!iframe) {

        location.reload();

        return;
    }


    const oldUrl =
        iframe.getAttribute('src');


    if (!oldUrl) {
        return;
    }


    iframe.setAttribute(
        'src',
        ''
    );


    setTimeout(
        function () {

            iframe.setAttribute(
                'src',
                oldUrl
            );

        },
        100
    );
}


/* =========================================================
   CLOAK
   ========================================================= */

function makecloak(
    replaceUrl
) {

    if (!replaceUrl) {

        replaceUrl =
            preferences.cloakUrl;
    }


    const currentUrl =
        window.location.href;


    const win =
        window.open();


    if (
        !win ||
        win.closed ||
        typeof win.closed ===
        'undefined'
    ) {

        return;
    }


    win.document.body.style.margin =
        '0';

    win.document.body.style.height =
        '100vh';


    const iframe =
        win.document.createElement(
            'iframe'
        );


    iframe.style.border =
        'none';

    iframe.style.width =
        '100%';

    iframe.style.height =
        '100%';

    iframe.style.margin =
        '0';


    iframe.referrerPolicy =
        'no-referrer';


    iframe.allow =
        'fullscreen';


    iframe.src =
        currentUrl;


    win.document.body.appendChild(
        iframe
    );


    window.location.replace(
        replaceUrl
    );
}


/* =========================================================
   MASK
   ========================================================= */

function mask(
    title,
    iconUrl
) {

    title =
        title ||
        preferences.maskTitle;


    iconUrl =
        iconUrl ||
        preferences.maskIconUrl;


    try {

        const doc =
            window.top.document;


        doc.title =
            title;


        let link =
            doc.querySelector(
                "link[rel*='icon']"
            );


        if (!link) {

            link =
                doc.createElement(
                    'link'
                );

            link.rel =
                'shortcut icon';

            link.type =
                'image/x-icon';


            doc.head.appendChild(
                link
            );
        }


        link.href =
            iconUrl;

    } catch (error) {

        console.warn(
            'Could not apply mask:',
            error
        );
    }
}


/* =========================================================
   POPUPS
   ========================================================= */

function popupsAllowed() {

    const windowName =
        'userConsole';


    const popUp =
        window.open(
            '',
            windowName,
            'width=1000,height=700,left=24,top=24,scrollbars,resizable'
        );


    if (
        !popUp ||
        typeof popUp ===
        'undefined'
    ) {

        return false;
    }


    popUp.close();

    return true;
}


/* =========================================================
   MUTE
   ========================================================= */

function toggleMute() {

    const mediaElements =
        document.querySelectorAll(
            'audio, video'
        );


    if (!mediaElements.length) {
        return;
    }


    const currentlyMuted =
        Array.from(
            mediaElements
        ).every(
            function (media) {
                return media.muted;
            }
        );


    mediaElements.forEach(
        function (media) {

            media.muted =
                !currentlyMuted;
        }
    );
}


/* =========================================================
   SAVE SYSTEM
   ========================================================= */

function getMainSave() {

    let mainSave = {};


    let localStorageSave =
        Object.entries(
            localStorage
        );


    localStorageSave =
        btoa(
            JSON.stringify(
                localStorageSave
            )
        );


    mainSave.localStorage =
        localStorageSave;


    let cookiesSave =
        document.cookie;


    cookiesSave =
        btoa(
            cookiesSave
        );


    mainSave.cookies =
        cookiesSave;


    mainSave =
        btoa(
            JSON.stringify(
                mainSave
            )
        );


    if (
        typeof CryptoJS !==
        'undefined'
    ) {

        mainSave =
            CryptoJS.AES.encrypt(
                mainSave,
                'save'
            ).toString();
    }


    return mainSave;
}


/* =========================================================
   DOWNLOAD SAVE
   ========================================================= */

function downloadMainSave() {

    const data =
        new Blob(
            [
                getMainSave()
            ],
            {
                type:
                    'application/octet-stream'
            }
        );


    const dataURL =
        URL.createObjectURL(
            data
        );


    const fakeElement =
        document.createElement(
            'a'
        );


    fakeElement.href =
        dataURL;


    fakeElement.download =
        'monkey.data';


    document.body.appendChild(
        fakeElement
    );


    fakeElement.click();


    fakeElement.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(
                dataURL
            );

        },
        100
    );
}


/* =========================================================
   LOAD SAVE
   ========================================================= */

function getMainSaveFromUpload(
    data
) {

    try {

        if (
            typeof CryptoJS ===
            'undefined'
        ) {

            throw new Error(
                'CryptoJS is not loaded.'
            );
        }


        data =
            CryptoJS.AES.decrypt(
                data,
                'save'
            ).toString(
                CryptoJS.enc.Utf8
            );


        const mainSave =
            JSON.parse(
                atob(data)
            );


        const mainLocalStorageSave =
            JSON.parse(
                atob(
                    mainSave.localStorage
                )
            );


        for (
            const item of
            mainLocalStorageSave
        ) {

            localStorage.setItem(
                item[0],
                item[1]
            );
        }


        const cookiesSave =
            atob(
                mainSave.cookies
            );


        document.cookie =
            cookiesSave;


        return true;

    } catch (error) {

        console.error(
            'Could not load save:',
            error
        );


        alert(
            'That save file could not be loaded.'
        );


        return false;
    }
}


/* =========================================================
   UPLOAD SAVE
   ========================================================= */

function uploadMainSave() {

    const hiddenUpload =
        document.createElement(
            'input'
        );


    hiddenUpload.type =
        'file';


    hiddenUpload.accept =
        '.data';


    hiddenUpload.style.display =
        'none';


    document.body.appendChild(
        hiddenUpload
    );


    hiddenUpload.addEventListener(
        'change',
        function (event) {

            const file =
                event.target.files[0];


            if (!file) {

                hiddenUpload.remove();

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const success =
                        getMainSaveFromUpload(
                            event.target.result
                        );


                    if (success) {

                        const uploadResult =
                            document.querySelector(
                                '.upload-result'
                            );


                        if (
                            uploadResult
                        ) {

                            uploadResult.innerText =
                                'Uploaded save!';


                            setTimeout(
                                function () {

                                    uploadResult.innerText =
                                        '';

                                },
                                3000
                            );
                        }
                    }


                    hiddenUpload.remove();
                };


            reader.readAsText(
                file
            );
        }
    );


    hiddenUpload.click();
}


/* =========================================================
   KEY CONFIG
   ========================================================= */

let keyConfig = {};


try {

    keyConfig =
        JSON.parse(
            localStorage.getItem(
                'keyConfig'
            )
        ) || {};

} catch (error) {

    keyConfig = {};
}


const keySlots =
    document.querySelectorAll(
        '.keySlot'
    );


const actions =
    document.querySelectorAll(
        '.slot-action'
    );


/* =========================================================
   RESTORE SAVED KEYS
   ========================================================= */

for (
    const slot in keyConfig
) {

    if (
        !Object.prototype.hasOwnProperty.call(
            keyConfig,
            slot
        )
    ) {
        continue;
    }


    for (
        const key in keyConfig[slot]
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                keyConfig[slot],
                key
            )
        ) {
            continue;
        }


        const correctKey =
            keyConfig[slot][key];


        const slotDiv =
            document.getElementById(
                slot
            );


        if (!slotDiv) {
            continue;
        }


        if (
            key ===
            'slot-action'
        ) {

            const select =
                slotDiv.querySelector(
                    '.slot-action'
                );


            if (select) {

                for (
                    let i = 0;
                    i < select.options.length;
                    i++
                ) {

                    if (
                        select.options[i].value ===
                        correctKey
                    ) {

                        select.selectedIndex =
                            i;

                        break;
                    }
                }
            }


            continue;
        }


        try {

            const keyElement =
                slotDiv.querySelector(
                    '.' +
                    CSS.escape(
                        key
                    )
                );


            if (keyElement) {

                keyElement.textContent =
                    correctKey;
            }

        } catch (error) {

            console.warn(
                'Could not restore key:',
                key,
                error
            );
        }
    }
}


/* =========================================================
   ACTION SELECTS
   ========================================================= */

actions.forEach(
    function (action) {

        action.addEventListener(
            'change',
            function () {

                const slot =
                    action.parentNode
                        ? action.parentNode.id
                        : null;


                if (!slot) {
                    return;
                }


                if (!keyConfig[slot]) {

                    keyConfig[slot] = {};
                }


                keyConfig[slot][
                    'slot-action'
                ] =
                    action.value;


                localStorage.setItem(
                    'keyConfig',
                    JSON.stringify(
                        keyConfig
                    )
                );
            }
        );
    }
);


/* =========================================================
   KEY BINDING
   ========================================================= */

const pressedKeys = {};


keySlots.forEach(
    function (slot) {

        slot.addEventListener(
            'click',
            function () {

                slot.textContent =
                    'Press any key';


                function keyPressHandler(
                    event
                ) {

                    event.preventDefault();


                    slot.textContent =
                        event.key;


                    document.removeEventListener(
                        'keydown',
                        keyPressHandler
                    );


                    const parent =
                        slot.parentNode;


                    if (!parent) {
                        return;
                    }


                    const parentId =
                        parent.id;


                    if (!keyConfig[parentId]) {

                        keyConfig[parentId] =
                            {};
                    }


                    const key =
                        slot.className
                            .trim()
                            .split(/\s+/)
                            .join('-');


                    keyConfig[parentId][
                        key
                    ] =
                        event.key;


                    localStorage.setItem(
                        'keyConfig',
                        JSON.stringify(
                            keyConfig
                        )
                    );
                }


                document.addEventListener(
                    'keydown',
                    keyPressHandler
                );
            }
        );
    }
);


/* =========================================================
   CUSTOM KEY ACTIONS
   ========================================================= */

function onKeyRelease(event) {

    const key =
        event.key.toLowerCase();


    pressedKeys[key] =
        false;
}


function onKeyPress(event) {

    const target =
        event.target;


    /*
     * Don't trigger custom actions while
     * typing into an input.
     */

    if (
        target &&
        (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT'
        )
    ) {

        return;
    }


    const key =
        event.key.toLowerCase();


    pressedKeys[key] =
        true;


    for (
        const slot in keyConfig
    ) {

        if (
            !Object.prototype.hasOwnProperty.call(
                keyConfig,
                slot
            )
        ) {
            continue;
        }


        const config =
            keyConfig[slot];


        if (
            !config ||
            !config['keySlot-1'] ||
            !config['keySlot-2'] ||
            !config['slot-action']
        ) {

            continue;
        }


        const key1 =
            String(
                config['keySlot-1']
            ).toLowerCase();


        const key2 =
            String(
                config['keySlot-2']
            ).toLowerCase();


        const key3 =
            String(
                config['keySlot-3'] ||
                ''
            ).toLowerCase();


        if (
            pressedKeys[key1] &&
            pressedKeys[key2] &&
            (
                key3
                    ? pressedKeys[key3]
                    : true
            )
        ) {

            try {

                eval(
                    config['slot-action']
                );

            } catch (error) {

                console.error(
                    'Custom key action error:',
                    error
                );
            }
        }
    }
}


document.addEventListener(
    'keydown',
    onKeyPress
);


document.addEventListener(
    'keyup',
    onKeyRelease
);


/* =========================================================
   COLORS
   ========================================================= */

const defaultColorSettings = {

    bg:
        '#202020',

    'block-color':
        '#2b2b2b',

    'button-color':
        '#373737',

    'games-color':
        '#373737a6',

    'hover-color':
        '#3c3c3c',

    'scrollbar-color':
        '#434343',

    'scroll-track-color':
        '#111111',

    'font-color':
        '#dcddde'
};


let colorSettings;


try {

    colorSettings =
        JSON.parse(
            localStorage.getItem(
                'colorSettings'
            )
        ) ||
        {
            ...defaultColorSettings
        };

} catch (error) {

    colorSettings =
        {
            ...defaultColorSettings
        };
}


/*
 * Apply CSS variables.
 */

Object.entries(
    colorSettings
).forEach(
    function ([key, value]) {

        document.documentElement
            .style
            .setProperty(
                `--${key}`,
                value
            );
    }
);


/*
 * Put colors into color inputs.
 */

Object.keys(
    colorSettings
).forEach(
    function (key) {

        const input =
            document.getElementById(
                key
            );


        if (!input) {
            return;
        }


        let value =
            colorSettings[key];


        /*
         * Convert #RRGGBBAA to #RRGGBB.
         */

        if (
            /^#[0-9a-fA-F]{8}$/.test(
                value
            )
        ) {

            value =
                value.substring(
                    0,
                    7
                );
        }


        /*
         * Convert #RGB to #RRGGBB.
         */

        if (
            /^#[0-9a-fA-F]{3}$/.test(
                value
            )
        ) {

            value =
                '#' +
                value[1] +
                value[1] +
                value[2] +
                value[2] +
                value[3] +
                value[3];
        }


        if (
            /^#[0-9a-fA-F]{6}$/.test(
                value
            )
        ) {

            input.value =
                value;
        }
    }
);


/* =========================================================
   SAVE COLORS
   ========================================================= */

function saveColorChanges() {

    const inputs =
        document.querySelectorAll(
            'input[type="color"]'
        );


    const newColorSettings = {
        ...colorSettings
    };


    inputs.forEach(
        function (input) {

            if (!input.id) {
                return;
            }


            /*
             * Preserve transparency for games-color.
             */

            if (
                input.id ===
                'games-color'
            ) {

                /*
                 * Preserve the current alpha if
                 * one already exists.
                 */

                let alpha =
                    'a6';


                if (
                    /^#[0-9a-fA-F]{8}$/.test(
                        colorSettings[
                            'games-color'
                        ]
                    )
                ) {

                    alpha =
                        colorSettings[
                            'games-color'
                        ].substring(7);
                }


                newColorSettings[
                    input.id
                ] =
                    input.value +
                    alpha;

            } else {

                newColorSettings[
                    input.id
                ] =
                    input.value;
            }
        }
    );


    localStorage.setItem(
        'colorSettings',
        JSON.stringify(
            newColorSettings
        )
    );


    colorSettings =
        newColorSettings;


    Object.entries(
        newColorSettings
    ).forEach(
        function ([key, value]) {

            document.documentElement
                .style
                .setProperty(
                    `--${key}`,
                    value
                );
        }
    );
}


/* =========================================================
   RESTORE COLORS
   ========================================================= */

function restoreColorChanges() {

    localStorage.removeItem(
        'colorSettings'
    );


    colorSettings =
        {
            ...defaultColorSettings
        };


    Object.entries(
        defaultColorSettings
    ).forEach(
        function ([key, value]) {

            document.documentElement
                .style
                .setProperty(
                    `--${key}`,
                    value
                );


            const input =
                document.getElementById(
                    key
                );


            if (!input) {
                return;
            }


            let inputValue =
                value;


            if (
                /^#[0-9a-fA-F]{8}$/.test(
                    inputValue
                )
            ) {

                inputValue =
                    inputValue.substring(
                        0,
                        7
                    );
            }


            if (
                /^#[0-9a-fA-F]{6}$/.test(
                    inputValue
                )
            ) {

                input.value =
                    inputValue;
            }
        }
    );
}


/* =========================================================
   RANDOM GAME
   ========================================================= */

function randomGame() {

    const gameLinks =
        document.querySelectorAll(
            '#gamesList li'
        );


    if (
        !gameLinks.length
    ) {

        return;
    }


    const randomIndex =
        Math.floor(
            Math.random() *
            gameLinks.length
        );


    const randomGameLink =
        gameLinks[
            randomIndex
        ];


    const gameUrl =
        fixGameUrl(
            randomGameLink.getAttribute(
                'url'
            )
        );


    if (gameUrl) {

        openGameInNewTab(
            gameUrl
        );
    }
}


/* =========================================================
   PREFERENCES
   ========================================================= */

/*
 * CLOAK IS OFF BY DEFAULT.
 */

const preferencesDefaults = {

    cloak:
        false,

    cloakUrl:
        'https://classroom.google.com/',

    mask:
        true,

    maskTitle:
        'Home',

    maskIconUrl:
        'https://ssl.gstatic.com/classroom/ic_product_classroom_32.png',

    background:
        true
};


let preferences;


try {

    const stored =
        localStorage.getItem(
            'preferences'
        );


    if (stored) {

        preferences =
            JSON.parse(
                stored
            );

    } else {

        preferences =
            {
                ...preferencesDefaults
            };

        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );
    }

} catch (error) {

    preferences =
        {
            ...preferencesDefaults
        };
}


/*
 * Fill missing settings with defaults.
 */

preferences =
    {
        ...preferencesDefaults,
        ...preferences
    };


localStorage.setItem(
    'preferences',
    JSON.stringify(
        preferences
    )
);


/* =========================================================
   PREFERENCE ELEMENTS
   ========================================================= */

const cloakCheckbox =
    document.getElementById(
        'cloakCheckboxInput'
    );


const backgroundCheckbox =
    document.getElementById(
        'backgroundCheckboxInput'
    );


const cloakUrlInput =
    document.getElementById(
        'cloakUrlInput'
    );


const maskCheckbox =
    document.getElementById(
        'maskCheckboxInput'
    );


const maskTitleInput =
    document.getElementById(
        'maskTitleInput'
    );


const maskIconInput =
    document.getElementById(
        'maskIconInput'
    );


if (cloakCheckbox) {

    cloakCheckbox.checked =
        preferences.cloak;
}


if (cloakUrlInput) {

    cloakUrlInput.value =
        preferences.cloakUrl;
}


if (maskCheckbox) {

    maskCheckbox.checked =
        preferences.mask;
}


if (maskTitleInput) {

    maskTitleInput.value =
        preferences.maskTitle;
}


if (maskIconInput) {

    maskIconInput.value =
        preferences.maskIconUrl;
}


if (backgroundCheckbox) {

    backgroundCheckbox.checked =
        preferences.background;
}


/* =========================================================
   PRESETS
   ========================================================= */

const presets = {

    classroom: {

        url:
            'https://classroom.google.com/',

        title:
            'Home',

        icon:
            'https://ssl.gstatic.com/classroom/ic_product_classroom_32.png'
    },


    drive: {

        url:
            'https://drive.google.com/',

        title:
            'My Drive - Google Drive',

        icon:
            'https://ssl.gstatic.com/images/branding/product/2x/hh_drive_36dp.png'
    },


    mail: {

        url:
            'https://mail.google.com/',

        title:
            'Inbox - Google Mail',

        icon:
            'https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_512dp.png'
    },


    canvas: {

        url:
            'https://www.instructure.com/',

        title:
            'Dashboard',

        icon:
            'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico'
    }
};


function setPreset(object) {

    if (!object) {
        return;
    }


    preferences.cloakUrl =
        object.url;


    preferences.maskTitle =
        object.title;


    preferences.maskIconUrl =
        object.icon;


    localStorage.setItem(
        'preferences',
        JSON.stringify(
            preferences
        )
    );


    alert(
        'Preset saved!'
    );
}


function updatePreset() {

    const presetsElement =
        document.getElementById(
            'presets'
        );


    if (!presetsElement) {
        return;
    }


    setPreset(
        presets[
            presetsElement.value
        ]
    );
}


/* =========================================================
   SETTINGS EVENTS
   ========================================================= */

if (maskCheckbox) {

    maskCheckbox.addEventListener(
        'change',
        function () {

            preferences.mask =
                maskCheckbox.checked;


            localStorage.setItem(
                'preferences',
                JSON.stringify(
                    preferences
                )
            );
        }
    );
}


if (cloakCheckbox) {

    cloakCheckbox.addEventListener(
        'change',
        function () {

            preferences.cloak =
                cloakCheckbox.checked;


            localStorage.setItem(
                'preferences',
                JSON.stringify(
                    preferences
                )
            );
        }
    );
}


if (backgroundCheckbox) {

    backgroundCheckbox.addEventListener(
        'change',
        function () {

            preferences.background =
                backgroundCheckbox.checked;


            localStorage.setItem(
                'preferences',
                JSON.stringify(
                    preferences
                )
            );


            inGame =
                !preferences.background;
        }
    );
}


/* =========================================================
   CLOAK URL SUBMIT
   ========================================================= */

onClick(
    '#cloakUrlSubmit',
    function () {

        if (!cloakUrlInput) {
            return;
        }


        preferences.cloakUrl =
            cloakUrlInput.value.trim();


        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );


        alert(
            'Submitted! The change will take place the next time cloak is opened.'
        );
    }
);


/* =========================================================
   MASK TITLE SUBMIT
   ========================================================= */

onClick(
    '#maskTitleSubmit',
    function () {

        if (!maskTitleInput) {
            return;
        }


        preferences.maskTitle =
            maskTitleInput.value;


        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );


        alert(
            'Submitted! The change will take place after refresh.'
        );
    }
);


/* =========================================================
   MASK ICON SUBMIT
   ========================================================= */

onClick(
    '#maskIconSubmit',
    function () {

        if (!maskIconInput) {
            return;
        }


        preferences.maskIconUrl =
            maskIconInput.value;


        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );


        alert(
            'Submitted! The change will take place after refresh.'
        );
    }
);


/* =========================================================
   DOWNLOAD / UPLOAD
   ========================================================= */

onClick(
    '#download',
    function () {

        downloadMainSave();
    }
);


onClick(
    '#upload',
    function () {

        uploadMainSave();
    }
);


/* =========================================================
   PRESET BUTTON
   ========================================================= */

onClick(
    '#presetSubmit',
    updatePreset
);


/* =========================================================
   RANDOM GAME BUTTON
   ========================================================= */

onClick(
    '#randomGame',
    randomGame
);


/* =========================================================
   SEARCH / SORT INITIALIZATION
   ========================================================= */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        function () {

            updateList();
        }
    );

} else {

    updateList();
}


/* =========================================================
   CLOAK STARTUP
   ========================================================= */

if (
    preferences.cloak &&
    window.location.href ===
    window.top.location.href
) {

    if (
        popupsAllowed()
    ) {

        makecloak();

    } else {

        if (
            currentMenu &&
            currentMenu.length
        ) {

            currentMenu.fadeOut(
                300,
                function () {

                    $('.cloaklaunch')
                        .fadeIn(200);
                }
            );


            currentMenu =
                $('.cloaklaunch');
        }


        document.addEventListener(
            'click',
            function (event) {

                if (
                    event.target &&
                    event.target.id ===
                    'disableCloak'
                ) {

                    $('.cloaklaunch')
                        .fadeOut(200);


                    setTimeout(
                        returnHome,
                        200
                    );


                    return;
                }


                if (
                    !event.target
                ) {

                    return;
                }


                const className =
                    typeof event.target.className ===
                    'string'
                        ? event.target.className
                        : '';


                if (
                    className !==
                        'cloaklaunch' &&
                    className !==
                        'cloaker'
                ) {

                    return;
                }


                event.preventDefault();

                makecloak();
            }
        );
    }
}


/* =========================================================
   MASK STARTUP
   ========================================================= */

if (
    preferences.mask
) {

    mask();
}


/* =========================================================
   FINAL INITIALIZATION
   ========================================================= */

console.log(
    '%cMonkeyGG2 loaded successfully.',
    'font-weight:bold;'
);


console.log(
    'Cloak:',
    preferences.cloak
        ? 'ON'
        : 'OFF'
);


console.log(
    'Game links use trailing slashes.'
);
