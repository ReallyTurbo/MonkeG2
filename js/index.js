let currentMenu = $('.homepage');


/* =========================================================
   GAME URL HANDLING
   ========================================================= */

function fixGameUrl(url) {
    if (!url) {
        return url;
    }

    url = String(url).trim();

    /*
     * Convert:
     *
     * /games/basket-random
     *
     * into:
     *
     * /games/basket-random/
     *
     * This is important for Render because the game files
     * are served from the directory URL.
     */

    if (
        url.startsWith('/games/') &&
        !url.endsWith('/') &&
        !url.includes('.html')
    ) {
        url += '/';
    }

    return url;
}


function getFullGameUrl(gameUrl) {
    gameUrl = fixGameUrl(gameUrl);

    if (!gameUrl) {
        return null;
    }

    try {
        return new URL(
            gameUrl,
            window.location.origin
        ).href;
    } catch (error) {
        console.error(
            'Invalid game URL:',
            gameUrl,
            error
        );

        return null;
    }
}


/* =========================================================
   OPEN GAME IN NEW TAB
   ========================================================= */

function openGameInNewTab(gameUrl) {
    const fullUrl =
        getFullGameUrl(gameUrl);

    if (!fullUrl) {
        return;
    }

    console.log(
        'Opening game:',
        fullUrl
    );

    window.open(
        fullUrl,
        '_blank'
    );
}


/* =========================================================
   GAME LIST
   ========================================================= */

$(document).on(
    'click',
    '#gamesList li',
    function (event) {

        event.preventDefault();

        const gameUrl =
            this.getAttribute('url');

        const fullUrl =
            getFullGameUrl(gameUrl);

        if (!fullUrl) {
            console.error(
                'Game has no URL:',
                this
            );

            return;
        }

        openGameInNewTab(fullUrl);
    }
);


/* =========================================================
   MENU BUTTONS
   ========================================================= */

$('.column button .card').on(
    'click',
    function () {

        const nextMenu =
            this.getAttribute('data');

        if (!nextMenu) {
            return;
        }


        /* =========================
           PROXY
           ========================= */

        if (nextMenu === 'proxy') {

            if (
                typeof config !== 'undefined' &&
                !config['proxy']
            ) {
                $('#disabled').showModal();
                return;
            }

            currentMenu.fadeOut(
                300,
                function () {

                    $('#page-loader').fadeIn(200);

                    const proxyPath =
                        (
                            typeof config !== 'undefined' &&
                            config['proxyPath']
                        )
                            ? config['proxyPath']
                            : '/proxy';

                    $('#page-loader iframe')
                        .attr(
                            'src',
                            proxyPath
                        );

                    const iframe =
                        $('#page-loader iframe')[0];

                    if (iframe) {
                        iframe.focus();
                    }
                }
            );

            currentMenu =
                $('#page-loader');

            if (
                typeof preferences !== 'undefined'
            ) {
                inGame =
                    !preferences.background;
            }

            return;
        }


        /* =========================
           NORMAL MENU
           ========================= */

        const nextMenuElement =
            $('.' + nextMenu);

        if (!nextMenuElement.length) {
            console.warn(
                'Menu not found:',
                nextMenu
            );

            return;
        }

        currentMenu.fadeOut(
            300,
            function () {
                nextMenuElement.fadeIn(200);
            }
        );

        currentMenu =
            nextMenuElement;
    }
);


/* =========================================================
   HOME / REFRESH BUTTONS
   ========================================================= */

$('logo img').on(
    'click',
    returnHome
);


$('#gameButton').on(
    'click',
    function () {

        if (window.hold) {
            return;
        }

        returnHome();
    }
);


$('#refresh').on(
    'click',
    function () {

        if (window.hold) {
            return;
        }

        refreshPage();
    }
);


/* =========================================================
   DIALOGS
   ========================================================= */

$('dialog').on(
    'click',
    function (event) {

        const target =
            event.target;

        if (
            target === this
        ) {
            this.close();
        }
    }
);


/* =========================================================
   JARO SIMILARITY
   ========================================================= */

function jaro_distance(s1, s2) {

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

    const max_dist =
        Math.max(
            Math.floor(
                Math.max(len1, len2) / 2
            ) - 1,
            0
        );

    let match = 0;

    const hash_s1 =
        new Array(len1).fill(0);

    const hash_s2 =
        new Array(len2).fill(0);


    for (
        let i = 0;
        i < len1;
        i++
    ) {

        for (
            let j =
                Math.max(
                    0,
                    i - max_dist
                );

            j <
            Math.min(
                len2,
                i + max_dist + 1
            );

            j++
        ) {

            if (
                s1[i] === s2[j] &&
                hash_s2[j] === 0
            ) {

                hash_s1[i] = 1;
                hash_s2[j] = 1;

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

        if (
            hash_s1[i] === 1
        ) {

            while (
                hash_s2[point] === 0
            ) {
                point++;
            }

            if (
                s1[i] !==
                s2[point++]
            ) {
                t++;
            }
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

    const jaro_dist =
        jaro_distance(
            s1,
            s2
        );

    let result =
        jaro_dist;


    if (
        jaro_dist > 0.7
    ) {

        let prefix = 0;


        for (
            let i = 0;
            i <
            Math.min(
                s1.length,
                s2.length
            );

            i++
        ) {

            if (
                s1[i] ===
                s2[i]
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


        result +=
            0.1 *
            prefix *
            (1 - result);
    }


    return Number(
        result.toFixed(6)
    );
}


/* =========================================================
   GAME LIST UPDATE
   ========================================================= */

function updateList() {

    const searchElement =
        $('#search');

    const sortElement =
        $('#sort');

    const gamesList =
        document.getElementById(
            'gamesList'
        );


    if (!gamesList) {
        return;
    }


    const filter =
        (
            searchElement.val() ||
            ''
        )
            .toString()
            .toLowerCase();


    const elems =
        Array.from(
            gamesList.querySelectorAll(
                'li'
            )
        );


    const sortType =
        sortElement.val();


    /* =========================
       FILTER
       ========================= */

    elems.forEach(
        function (item) {

            const text =
                item.textContent
                    .toLowerCase();


            let similarity =
                jaroWinklerSimilarity(
                    filter,
                    text
                );


            const aliases =
                item.getAttribute(
                    'aliases'
                );


            if (aliases) {

                aliases
                    .split(',')
                    .forEach(
                        function (alias) {

                            alias =
                                alias
                                    .trim()
                                    .toLowerCase();

                            if (
                                alias.length > 0
                            ) {

                                similarity +=
                                    jaroWinklerSimilarity(
                                        filter,
                                        alias
                                    );
                            }
                        }
                    );
            }


            const matches =
                filter === '' ||
                text.includes(filter) ||
                similarity >= 0.7;


            item.style.display =
                matches
                    ? ''
                    : 'none';
        }
    );


    /* =========================
       SORT
       ========================= */

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


    elems.forEach(
        function (item) {
            gamesList.appendChild(item);
        }
    );


    if (
        typeof updateGameList ===
        'function'
    ) {
        updateGameList();
    }
}


$('#search').on(
    'input',
    updateList
);


$('#sort').on(
    'change',
    updateList
);


/* =========================================================
   DRAG BUTTONS
   ========================================================= */

if (
    document.getElementById(
        'gameButton'
    )
) {
    dragElement(
        document.getElementById(
            'gameButton'
        )
    );
}


if (
    document.getElementById(
        'refresh'
    )
) {
    dragElement(
        document.getElementById(
            'refresh'
        )
    );
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

        action:
            function () {
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
            const sequence
            of sequences
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

    const h = Math;
    const r = h.random;
    const a = document;
    const o = Date.now;


    function Snowflake() {

        this.D =
            function () {

                const t =
                    h.atan(
                        this.i /
                        this.d
                    );


                l.save();

                l.translate(
                    this.b,
                    this.a
                );

                l.rotate(
                    -t
                );

                l.scale(
                    this.e,
                    this.e *
                    h.max(
                        1,
                        h.pow(
                            this.j,
                            0.7
                        ) / 15
                    )
                );


                l.drawImage(
                    m,
                    -v / 2,
                    -v / 2
                );


                l.restore();
            };
    }


    function animate() {

        l.clearRect(
            0,
            0,
            canvasWidth,
            canvasHeight
        );


        requestAnimationFrame(
            animate
        );


        const delta =
            0.001 *
            timer.et;


        timer.r();


        const time =
            timer2.et *
            gravity;


        for (
            let n = 0;
            n < snowflakes.length;
            n++
        ) {

            const flake =
                snowflakes[n];


            flake.i =
                h.sin(
                    time +
                    flake.g
                ) *
                flake.h;


            flake.j =
                h.sqrt(
                    flake.i *
                    flake.i +
                    flake.f
                );


            flake.a +=
                flake.d *
                delta;


            flake.b +=
                flake.i *
                delta;


            if (
                flake.a >
                bottom
            ) {
                flake.a = -offset;
            }


            if (
                flake.b >
                right
            ) {
                flake.b = -offset;
            }


            if (
                flake.b <
                -offset
            ) {
                flake.b = right;
            }


            flake.D();
        }
    }


    function resize() {

        canvas.width =
            canvasWidth =
            window.innerWidth;


        canvas.height =
            canvasHeight =
            window.innerHeight;


        bottom =
            canvasHeight +
            offset;


        right =
            canvasWidth +
            offset;


        resetSnow();
    }


    class Timer {

        constructor(
            duration,
            start = true
        ) {

            this._ts = o();
            this._p = true;
            this._pa = o();
            this.d = duration;


            if (start) {
                this.s();
            }
        }


        get et() {

            return this.ip
                ? this._pa -
                    this._ts
                : o() -
                    this._ts;
        }


        get rt() {

            return h.max(
                0,
                this.d -
                this.et
            );
        }


        get ip() {
            return this._p;
        }


        get ic() {
            return (
                this.et >=
                this.d
            );
        }


        s() {

            this._ts =
                o() -
                this.et;

            this._p =
                false;

            return this;
        }


        r() {

            this._pa =
                this._ts =
                o();

            return this;
        }


        p() {

            this._p = true;
            this._pa = o();

            return this;
        }


        st() {

            this._p = true;

            return this;
        }
    }


    const canvas =
        a.createElement(
            'canvas'
        );


    canvas.style.position =
        'fixed';

    canvas.style.left =
        '0';

    canvas.style.top =
        '0';

    canvas.style.width =
        '100vw';

    canvas.style.height =
        '100vh';

    canvas.style.zIndex =
        '100000';

    canvas.style.pointerEvents =
        'none';


    a.body.insertBefore(
        canvas,
        a.body.children[0]
    );


    const l =
        canvas.getContext(
            '2d'
        );


    const particleCount = 300;
    const gravity = 5e-4;
    const offset = 20;
    const v = 15.2;


    let canvasWidth =
        canvas.width =
        window.innerWidth;


    let canvasHeight =
        canvas.height =
        window.innerHeight;


    let bottom =
        canvasHeight +
        offset;


    let right =
        canvasWidth +
        offset;


    const m =
        a.createElement(
            'canvas'
        );


    const E =
        m.getContext(
            '2d'
        );


    const x =
        E.createRadialGradient(
            7.6,
            7.6,
            0,
            7.6,
            7.6,
            7.6
        );


    x.addColorStop(
        0,
        'rgba(255,255,255,1)'
    );


    x.addColorStop(
        1,
        'rgba(255,255,255,0)'
    );


    E.fillStyle = x;


    E.fillRect(
        0,
        0,
        v,
        v
    );


    const timer =
        new Timer(
            0,
            true
        );


    const timer2 =
        new Timer(
            0,
            true
        );


    const snowflakes = [];


    function resetSnow() {

        for (
            let e = 0;
            e < particleCount;
            e++
        ) {

            snowflakes[e].a =
                r() *
                (
                    canvasHeight +
                    offset
                );


            snowflakes[e].b =
                r() *
                canvasWidth;
        }
    }


    for (
        let j = 0;
        j < particleCount;
        j++
    ) {

        const flake =
            new Snowflake();


        flake.a =
            r() *
            (
                canvasHeight +
                offset
            );


        flake.b =
            r() *
            canvasWidth;


        flake.c =
            3 *
            r() +
            0.8;


        flake.d =
            0.1 *
            h.pow(
                flake.c,
                2.5
            ) *
            50 *
            (
                2 * r() + 1
            );


        if (
            flake.d < 65
        ) {
            flake.d = 65;
        }


        flake.e =
            flake.c /
            7.6;


        flake.f =
            flake.d *
            flake.d;


        flake.g =
            (
                r() *
                h.PI
            ) /
            1.3;


        flake.h =
            15 *
            flake.c;


        flake.i = 0;
        flake.j = 0;


        snowflakes.push(
            flake
        );
    }


    resetSnow();


    document.addEventListener(
        'visibilitychange',
        function () {
            setTimeout(
                resize,
                100
            );
        }
    );


    window.addEventListener(
        'resize',
        resize
    );


    animate();
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


        e.preventDefault();


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


        window.click = 1;


        elmnt.style.top =
            (
                elmnt.offsetTop -
                pos2
            ) +
            'px';


        elmnt.style.left =
            (
                elmnt.offsetLeft -
                pos1
            ) +
            'px';
    }


    function closeDragElement() {

        document.onmouseup =
            null;


        document.onmousemove =
            null;


        if (
            window.click === 1
        ) {

            window.hold = true;
            window.click = 0;


            setTimeout(
                function () {
                    window.hold = false;
                },
                100
            );
        }
    }
}


/* =========================================================
   HOME
   ========================================================= */

function returnHome() {

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
        $('#page-loader iframe');


    if (!iframe.length) {
        return;
    }


    const oldUrl =
        iframe.attr('src');


    if (!oldUrl) {
        return;
    }


    iframe.attr(
        'src',
        ''
    );


    setTimeout(
        function () {

            iframe.attr(
                'src',
                fixGameUrl(oldUrl)
            );

        },
        10
    );
}


/* =========================================================
   CLOAK
   ========================================================= */

function makecloak(
    replaceUrl
) {

    if (
        typeof replaceUrl ===
        'undefined'
    ) {

        replaceUrl =
            preferences.cloakUrl;
    }


    if (
        window.top.location.href !==
        'about:blank'
    ) {

        const url =
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
            url;


        win.document.body.appendChild(
            iframe
        );


        window.location.replace(
            replaceUrl
        );
    }
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

        const e =
            window.top.document;


        e.title =
            title;


        let link =
            e.querySelector(
                "link[rel*='icon']"
            );


        if (!link) {

            link =
                e.createElement(
                    'link'
                );

            e.head.appendChild(
                link
            );
        }


        link.type =
            'image/x-icon';


        link.rel =
            'shortcut icon';


        link.href =
            iconUrl;

    } catch (error) {

        console.warn(
            'Could not update mask:',
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
            '/popup-page.php',
            windowName,
            'width=1000,height=700,left=24,top=24,scrollbars,resizable'
        );


    if (
        !popUp ||
        popUp.closed
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

    const media =
        document.querySelectorAll(
            'audio, video'
        );


    media.forEach(
        function (element) {

            element.muted =
                !element.muted;
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


    mainSave =
        CryptoJS.AES.encrypt(
            mainSave,
            'save'
        ).toString();


    return mainSave;
}


function downloadMainSave() {

    const data =
        new Blob(
            [
                getMainSave()
            ],
            {
                type:
                    'text/plain'
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


    URL.revokeObjectURL(
        dataURL
    );
}


function getMainSaveFromUpload(
    data
) {

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


    const cookiesSave =
        atob(
            mainSave.cookies
        );


    for (
        const item
        of mainLocalStorageSave
    ) {

        localStorage.setItem(
            item[0],
            item[1]
        );
    }


    document.cookie =
        cookiesSave;
}


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


    hiddenUpload.click();


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

                    try {

                        getMainSaveFromUpload(
                            event.target.result
                        );


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

                    } catch (error) {

                        console.error(
                            'Could not load save:',
                            error
                        );

                        alert(
                            'The save file could not be loaded.'
                        );
                    }


                    hiddenUpload.remove();
                };


            reader.readAsText(
                file
            );
        }
    );
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


        let displayKey =
            key;


        if (
            key.includes(
                'keySlot'
            )
        ) {

            displayKey =
                key.replace(
                    /-/g,
                    ' '
                );
        }


        const keyElement =
            slotDiv.getElementsByClassName(
                displayKey
            )[0];


        if (!keyElement) {
            continue;
        }


        if (
            key !==
            'slot-action'
        ) {

            keyElement.textContent =
                correctKey;

        } else {

            for (
                let i = 0;
                i <
                keyElement.options.length;
                i++
            ) {

                if (
                    keyElement
                        .options[i]
                        .value ===
                    correctKey
                ) {

                    keyElement.selectedIndex =
                        i;

                    break;
                }
            }
        }
    }
}


actions.forEach(
    function (action) {

        action.addEventListener(
            'change',
            function () {

                const slot =
                    action.parentNode.id;


                if (
                    !keyConfig[slot]
                ) {

                    keyConfig[slot] =
                        {};
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


keySlots.forEach(
    function (slot) {

        slot.addEventListener(
            'click',
            function () {

                slot.textContent =
                    'Press any key';


                const keyPressHandler =
                    function (event) {

                        slot.textContent =
                            event.key;


                        document.removeEventListener(
                            'keydown',
                            keyPressHandler
                        );


                        const parentSlot =
                            slot.parentNode.id;


                        if (
                            !keyConfig[
                                parentSlot
                            ]
                        ) {

                            keyConfig[
                                parentSlot
                            ] = {};
                        }


                        const key =
                            slot.className
                                .replace(
                                    / /g,
                                    '-'
                                );


                        keyConfig[
                            parentSlot
                        ][key] =
                            event.key;


                        localStorage.setItem(
                            'keyConfig',
                            JSON.stringify(
                                keyConfig
                            )
                        );
                    };


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

const pressedKeys = {};


function onKeyRelease(event) {

    const key =
        event.key.toLowerCase();


    pressedKeys[key] =
        false;
}


function onKeyPress(event) {

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


        const settings =
            keyConfig[slot];


        if (
            !settings ||
            !settings[
                'keySlot-1'
            ] ||
            !settings[
                'keySlot-2'
            ] ||
            !settings[
                'slot-action'
            ]
        ) {
            continue;
        }


        const key1 =
            settings[
                'keySlot-1'
            ].toLowerCase();


        const key2 =
            settings[
                'keySlot-2'
            ].toLowerCase();


        const key3 =
            (
                settings[
                    'keySlot-3'
                ] ||
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
                    settings[
                        'slot-action'
                    ]
                );

            } catch (error) {

                console.error(
                    'Key action error:',
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

/*
 * IMPORTANT:
 *
 * input[type="color"] does NOT support #373737a6.
 *
 * Use normal 6-digit hex values.
 */

const defaultColorSettings = {

    bg:
        '#202020',

    'block-color':
        '#2b2b2b',

    'button-color':
        '#373737',

    'games-color':
        '#373737',

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
 * Fix old invalid color values that may already
 * exist in localStorage.
 */

Object.keys(
    defaultColorSettings
).forEach(
    function (key) {

        if (
            !colorSettings[key] ||
            !/^#[0-9a-fA-F]{6}$/.test(
                colorSettings[key]
            )
        ) {

            colorSettings[key] =
                defaultColorSettings[key];
        }
    }
);


Object.keys(
    colorSettings
).forEach(
    function (key) {

        const inputElement =
            document.getElementById(
                key
            );


        if (
            inputElement &&
            inputElement.type ===
            'color'
        ) {

            inputElement.value =
                colorSettings[key];
        }
    }
);


Object.entries(
    colorSettings
).forEach(
    function ([key, value]) {

        document.documentElement.style.setProperty(
            '--' + key,
            value
        );
    }
);


function saveColorChanges() {

    const inputs =
        document.querySelectorAll(
            'input[type="color"]'
        );


    const newColorSettings = {};


    inputs.forEach(
        function (input) {

            if (
                /^#[0-9a-fA-F]{6}$/.test(
                    input.value
                )
            ) {

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


    Object.entries(
        newColorSettings
    ).forEach(
        function ([key, value]) {

            document.documentElement.style.setProperty(
                '--' + key,
                value
            );
        }
    );
}


function restoreColorChanges() {

    localStorage.removeItem(
        'colorSettings'
    );


    Object.entries(
        defaultColorSettings
    ).forEach(
        function ([key, value]) {

            document.documentElement.style.setProperty(
                '--' + key,
                value
            );


            const input =
                document.getElementById(
                    key
                );


            if (
                input &&
                input.type ===
                'color'
            ) {

                input.value =
                    value;
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
        randomGameLink.getAttribute(
            'url'
        );


    openGameInNewTab(
        gameUrl
    );
}


/* =========================================================
   PREFERENCES
   ========================================================= */

const preferencesDefaults = {

    cloak:
        true,

    cloakUrl:
        'https://classroom.google.com',

    mask:
        true,

    maskTitle:
        'Home',

    maskIconUrl:
        'https://ssl.gstatic.com/classroom/ic_product_classroom_32.png',

    background:
        true
};


if (
    localStorage.getItem(
        'preferences'
    ) === null
) {

    localStorage.setItem(
        'preferences',
        JSON.stringify(
            preferencesDefaults
        )
    );
}


let preferences;


try {

    preferences =
        JSON.parse(
            localStorage.getItem(
                'preferences'
            )
        ) ||
        {
            ...preferencesDefaults
        };

} catch (error) {

    preferences =
        {
            ...preferencesDefaults
        };
}


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


const cloakUrl =
    document.getElementById(
        'cloakUrlInput'
    );


const maskCheckbox =
    document.getElementById(
        'maskCheckboxInput'
    );


const maskTitle =
    document.getElementById(
        'maskTitleInput'
    );


const maskIcon =
    document.getElementById(
        'maskIconInput'
    );


if (cloakCheckbox) {

    cloakCheckbox.checked =
        !!preferences.cloak;
}


if (cloakUrl) {

    cloakUrl.value =
        preferences.cloakUrl || '';
}


if (maskCheckbox) {

    maskCheckbox.checked =
        !!preferences.mask;
}


if (maskTitle) {

    maskTitle.value =
        preferences.maskTitle || '';
}


if (maskIcon) {

    maskIcon.value =
        preferences.maskIconUrl || '';
}


if (backgroundCheckbox) {

    backgroundCheckbox.checked =
        !!preferences.background;
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
            'Inbox (12) - Google Mail',

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
        'Preset will take place upon next opening!'
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


            if (
                typeof inGame !==
                'undefined'
            ) {

                inGame =
                    !preferences.background;
            }
        }
    );
}


/* =========================================================
   CLOAK URL
   ========================================================= */

const cloakUrlSubmit =
    document.getElementById(
        'cloakUrlSubmit'
    );


if (cloakUrlSubmit) {

    cloakUrlSubmit.addEventListener(
        'click',
        function () {

            if (!cloakUrl) {
                return;
            }


            preferences.cloakUrl =
                cloakUrl.value;


            localStorage.setItem(
                'preferences',
                JSON.stringify(
                    preferences
                )
            );


            alert(
                'Submitted! Change will take place upon refresh'
            );
        }
    );
}


/* =========================================================
   MASK TITLE
   ========================================================= */

const maskTitleSubmit =
    document.getElementById(
        'maskTitleSubmit'
    );


if (maskTitleSubmit) {

    maskTitleSubmit.addEventListener(
        'click',
        function () {

            if (!maskTitle) {
                return;
            }


            preferences.maskTitle =
                maskTitle.value;


            localStorage.setItem(
                'preferences',
                JSON.stringify(
                    preferences
                )
            );


            alert(
                'Submitted! Change will take place upon refresh'
            );
        }
    );
}


/* =========================================================
   MASK ICON
   ========================================================= */

const maskIconSubmit =
    document.getElementById(
        'maskIconSubmit'
    );


if (maskIconSubmit) {

    maskIconSubmit.addEventListener(
        'click',
        function () {

            if (!maskIcon) {
                return;
            }


            preferences.maskIconUrl =
                maskIcon.value;


            localStorage.setItem(
                'preferences',
                JSON.stringify(
                    preferences
                )
            );


            alert(
                'Submitted! Change will take place upon refresh'
            );
        }
    );
}


/* =========================================================
   DOWNLOAD / UPLOAD BUTTONS
   ========================================================= */

const downloadButton =
    document.getElementById(
        'download'
    );


if (downloadButton) {

    downloadButton.addEventListener(
        'click',
        downloadMainSave
    );
}


const uploadButton =
    document.getElementById(
        'upload'
    );


if (uploadButton) {

    uploadButton.addEventListener(
        'click',
        uploadMainSave
    );
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

        currentMenu.fadeOut(
            300,
            function () {

                $('.cloaklaunch')
                    .fadeIn(200);
            }
        );


        currentMenu =
            $('.cloaklaunch');


        document.addEventListener(
            'click',
            function (event) {

                if (
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


                const target =
                    event.target;


                if (
                    !target.classList.contains(
                        'cloaklaunch'
                    ) &&
                    !target.classList.contains(
                        'cloaker'
                    )
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
   INITIAL GAME LIST UPDATE
   ========================================================= */

$(function () {

    updateList();

});
