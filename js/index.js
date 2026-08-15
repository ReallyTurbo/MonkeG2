/* =========================================================
   MONKEYGG2 - MAIN SCRIPT
   ========================================================= */

/* =========================================================
   GLOBALS
   ========================================================= */

let currentMenu = $('.homepage');

window.inGame = false;
window.hold = false;
window.click = 0;


/* =========================================================
   GAME URL FIXER
   ========================================================= */

/*
 * Makes sure game folders ALWAYS end with "/".
 *
 * Example:
 *
 * /games/2048
 *
 * becomes:
 *
 * /games/2048/
 *
 * This is important for Render because some games depend
 * on the trailing slash when loading relative assets.
 */

function fixGameUrl(url) {

    if (!url) {
        return url;
    }

    url = String(url).trim();

    /*
     * If it is a relative game URL
     */
    if (
        url.startsWith('/games/') &&
        !url.endsWith('/') &&
        !url.includes('.html')
    ) {
        url += '/';
    }

    /*
     * If it is a full URL pointing to /games/
     */
    try {

        const parsed = new URL(
            url,
            window.location.origin
        );

        if (
            parsed.pathname.startsWith('/games/') &&
            !parsed.pathname.endsWith('/') &&
            !parsed.pathname.includes('.html')
        ) {
            parsed.pathname += '/';
        }

        /*
         * Return relative URLs as relative URLs.
         * This keeps them on whatever domain the site
         * is currently running on.
         */
        if (url.startsWith('/')) {
            return (
                parsed.pathname +
                parsed.search +
                parsed.hash
            );
        }

        return parsed.href;

    } catch (error) {

        console.warn(
            'Could not normalize game URL:',
            url,
            error
        );

        return url;
    }
}


/* =========================================================
   OPEN GAME
   ========================================================= */

/*
 * Games ALWAYS open in a NEW TAB.
 *
 * Example:
 *
 * /games/2048
 *
 * becomes:
 *
 * https://monkegg2.onrender.com/games/2048/
 */

function openGameInNewTab(gameUrl) {

    if (!gameUrl) {
        return;
    }

    /*
     * IMPORTANT:
     * Fix the URL BEFORE creating the full URL.
     */
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

    /*
     * Make absolutely sure the final game path
     * has a trailing slash.
     */
    try {

        const parsed = new URL(fullUrl);

        if (
            parsed.pathname.startsWith('/games/') &&
            !parsed.pathname.endsWith('/') &&
            !parsed.pathname.includes('.html')
        ) {
            parsed.pathname += '/';
        }

        fullUrl = parsed.href;

    } catch (error) {
        console.error(error);
    }

    console.log(
        'Opening game:',
        fullUrl
    );

    /*
     * ALWAYS open a new tab.
     */
    const newTab = window.open(
        fullUrl,
        '_blank'
    );

    /*
     * If the browser blocks the popup, provide
     * a fallback.
     */
    if (!newTab) {

        console.warn(
            'New tab was blocked by the browser.'
        );

        return;
    }

    /*
     * Focus the new tab when possible.
     */
    try {
        newTab.focus();
    } catch (error) {}
}


/* =========================================================
   GAME LIST CLICKING
   ========================================================= */

/*
 * Every game should look like:
 *
 * <li url="/games/2048">2048</li>
 *
 * It will automatically become:
 *
 * /games/2048/
 */

$(document).on(
    'click',
    '#gamesList li',
    function (event) {

        event.preventDefault();

        const gameUrl =
            this.getAttribute('url');

        if (!gameUrl) {
            console.warn(
                'Game has no "url" attribute:',
                this
            );

            return;
        }

        openGameInNewTab(gameUrl);
    }
);


/* =========================================================
   LOGO / HOME / REFRESH
   ========================================================= */

$('logo img').on(
    'click',
    returnHome
);

$('#gameButton').on(
    'click',
    returnHome
);

$('#refresh').on(
    'click',
    refreshPage
);


/* =========================================================
   DIALOG
   ========================================================= */

$('dialog').on(
    'click',
    function (e) {

        if (
            e.originalEvent &&
            e.originalEvent.target &&
            !e.originalEvent.target.closest('div')
        ) {

            e.originalEvent.target.close();
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

    const max_dist =
        Math.floor(
            Math.max(len1, len2) / 2
        ) - 1;

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
            let j = Math.max(
                0,
                i - max_dist
            );

            j < Math.min(
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

        if (hash_s1[i] === 1) {

            while (
                hash_s2[point] === 0
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

    s1 = String(s1 || '');
    s2 = String(s2 || '');

    let jaro_dist =
        jaro_distance(
            s1,
            s2
        );

    if (jaro_dist > 0.7) {

        let prefix = 0;

        for (
            let i = 0;
            i < Math.min(
                s1.length,
                s2.length
            );
            i++
        ) {

            if (
                s1[i] === s2[i]
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

        jaro_dist +=
            0.1 *
            prefix *
            (1 - jaro_dist);
    }

    return Number(
        jaro_dist.toFixed(6)
    );
}


/* =========================================================
   GAME LIST
   ========================================================= */

function updateList() {

    const searchElement =
        $('#search');

    const sortElement =
        $('#sort');

    const list =
        document.getElementById(
            'gamesList'
        );

    if (!list) {
        return;
    }

    const filter =
        String(
            searchElement.val() || ''
        ).toLowerCase().trim();

    const elems =
        Array.from(
            list.querySelectorAll('li')
        );

    const sortType =
        sortElement.val();


    /* -----------------------------------------------------
       SORT
       ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       SEARCH FILTER
       ----------------------------------------------------- */

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

            /*
             * Empty search = show everything.
             */
            if (
                filter === '' ||
                similarity >= 0.7 ||
                text.includes(filter)
            ) {

                item.style.display =
                    '';

            } else {

                item.style.display =
                    'none';
            }
        }
    );


    /* -----------------------------------------------------
       SEARCH RELEVANCE SORT
       ----------------------------------------------------- */

    if (filter !== '') {

        elems.sort(
            function (a, b) {

                let distanceA =
                    jaroWinklerSimilarity(
                        filter,
                        a.textContent
                            .toLowerCase()
                    );

                let distanceB =
                    jaroWinklerSimilarity(
                        filter,
                        b.textContent
                            .toLowerCase()
                    );

                const aliasesA =
                    a.getAttribute(
                        'aliases'
                    );

                const aliasesB =
                    b.getAttribute(
                        'aliases'
                    );

                if (aliasesA) {

                    aliasesA
                        .split(',')
                        .forEach(
                            function (alias) {

                                distanceA +=
                                    jaroWinklerSimilarity(
                                        filter,
                                        alias
                                            .trim()
                                            .toLowerCase()
                                    );
                            }
                        );
                }

                if (aliasesB) {

                    aliasesB
                        .split(',')
                        .forEach(
                            function (alias) {

                                distanceB +=
                                    jaroWinklerSimilarity(
                                        filter,
                                        alias
                                            .trim()
                                            .toLowerCase()
                                    );
                            }
                        );
                }

                return distanceB -
                    distanceA;
            }
        );
    }


    /* -----------------------------------------------------
       PUT ITEMS BACK INTO LIST
       ----------------------------------------------------- */

    elems.forEach(
        function (item) {
            list.appendChild(item);
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


let sequenceIndexes =
    new Array(
        sequences.length
    ).fill(0);


document.addEventListener(
    'keydown',
    function (event) {

        sequences.forEach(
            function (
                sequence,
                sequenceIndex
            ) {

                const index =
                    sequenceIndexes[
                        sequenceIndex
                    ];

                if (
                    event.code ===
                    sequence.keys[index]
                ) {

                    sequenceIndexes[
                        sequenceIndex
                    ]++;

                    if (
                        sequenceIndexes[
                            sequenceIndex
                        ] ===
                        sequence.keys.length
                    ) {

                        sequence.action();

                        sequenceIndexes[
                            sequenceIndex
                        ] = 0;
                    }

                } else if (
                    event.code ===
                    sequence.keys[0]
                ) {

                    sequenceIndexes[
                        sequenceIndex
                    ] = 1;

                } else {

                    sequenceIndexes[
                        sequenceIndex
                    ] = 0;
                }
            }
        );
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

    const c =
        a.createElement('canvas');

    const H = c.style;

    H.position = 'fixed';
    H.left = '0';
    H.top = '0';
    H.width = '100vw';
    H.height = '100vh';
    H.zIndex = '100000';
    H.pointerEvents = 'none';

    a.body.insertBefore(
        c,
        a.body.firstChild
    );

    const l =
        c.getContext('2d');

    if (!l) {
        return;
    }

    const p = 300;
    const g = 5e-4;
    const u = 20;

    let _ =
        c.width =
        innerWidth;

    let f =
        c.height =
        innerHeight;

    let w =
        f + u;

    let b =
        _ + u;

    const v = 15.2;

    const m =
        a.createElement('canvas');

    m.width = v;
    m.height = v;

    const E =
        m.getContext('2d');

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


    class SnowTimer {

        constructor(
            duration,
            autoStart = true
        ) {

            this._ts = o();
            this._p = true;
            this._pa = o();
            this.d = duration;

            if (autoStart) {
                this.s();
            }
        }

        get et() {

            return this._p
                ? this._pa - this._ts
                : o() - this._ts;
        }

        get rt() {

            return h.max(
                0,
                this.d - this.et
            );
        }

        get ip() {
            return this._p;
        }

        get ic() {
            return this.et >= this.d;
        }

        s() {

            this._ts =
                o() - this.et;

            this._p = false;

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


    class Snowflake {

        D() {

            const t =
                h.atan(
                    this.i / this.d
                );

            l.save();

            l.translate(
                this.b,
                this.a
            );

            l.rotate(-t);

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
        }
    }


    const C = [];

    let y =
        new SnowTimer(
            0,
            true
        );

    let L =
        new SnowTimer(
            0,
            true
        );


    function resetSnow() {

        for (
            let e = 0;
            e < p;
            ++e
        ) {

            C[e].a =
                r() * (f + u);

            C[e].b =
                r() * _;
        }
    }


    function resizeSnow() {

        c.width =
            _ =
            innerWidth;

        c.height =
            f =
            innerHeight;

        w = f + u;
        b = _ + u;

        resetSnow();
    }


    for (
        let j = 0;
        j < p;
        ++j
    ) {

        const t =
            new Snowflake();

        t.a =
            r() * (f + u);

        t.b =
            r() * _;

        t.c =
            1 *
            (
                3 *
                r() +
                0.8
            );

        t.d =
            0.1 *
            h.pow(
                t.c,
                2.5
            ) *
            50 *
            (
                2 *
                r() +
                1
            );

        t.d =
            t.d < 65
                ? 65
                : t.d;

        t.e =
            t.c / 7.6;

        t.f =
            t.d * t.d;

        t.g =
            (
                r() *
                h.PI
            ) / 1.3;

        t.h =
            15 *
            t.c;

        t.i = 0;
        t.j = 0;

        C.push(t);
    }


    resetSnow();


    window.addEventListener(
        'resize',
        resizeSnow,
        false
    );


    function animateSnow() {

        l.clearRect(
            0,
            0,
            _,
            f
        );

        requestAnimationFrame(
            animateSnow
        );

        const i =
            0.001 *
            y.et;

        y.r();

        const s =
            L.et * g;

        for (
            let n = 0;
            n < C.length;
            ++n
        ) {

            const t = C[n];

            t.i =
                h.sin(
                    s + t.g
                ) *
                t.h;

            t.j =
                h.sqrt(
                    t.i *
                    t.i +
                    t.f
                );

            t.a +=
                t.d * i;

            t.b +=
                t.i * i;

            if (t.a > w) {
                t.a = -u;
            }

            if (t.b > b) {
                t.b = -u;
            }

            if (t.b < -u) {
                t.b = b;
            }

            t.D();
        }
    }


    animateSnow();
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

        window.inGame =
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
        window.location.reload();
        return;
    }

    const oldUrl =
        iframe.getAttribute('src');

    if (!oldUrl) {
        return;
    }

    console.log(
        'Refreshing:',
        oldUrl
    );

    iframe.setAttribute(
        'src',
        ''
    );

    setTimeout(
        function () {

            iframe.setAttribute(
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

/*
 * Cloak is intentionally OFF by default.
 *
 * The function is kept here so your existing settings
 * still work if you turn it on.
 */

function makecloak(
    replaceUrl =
        preferences.cloakUrl
) {

    if (
        window.top.location.href ===
        'about:blank'
    ) {
        return;
    }

    const url =
        window.location.href;

    const win =
        window.open();

    if (
        !win ||
        win.closed
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


/* =========================================================
   MASK
   ========================================================= */

function mask(
    title =
        preferences.maskTitle,

    iconUrl =
        preferences.maskIconUrl
) {

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
            '/popup-page.php',
            windowName,
            'width=1000,height=700,left=24,top=24,scrollbars,resizable'
        );

    if (
        popUp == null ||
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

    const shouldMute =
        !Array.from(
            mediaElements
        ).every(
            function (media) {
                return media.muted;
            }
        );

    mediaElements.forEach(
        function (media) {

            media.muted =
                shouldMute;
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
        btoa(cookiesSave);

    mainSave.cookies =
        cookiesSave;

    mainSave =
        btoa(
            JSON.stringify(
                mainSave
            )
        );

    if (
        typeof CryptoJS ===
        'undefined'
    ) {

        console.error(
            'CryptoJS is required for saves.'
        );

        return mainSave;
    }

    return CryptoJS.AES.encrypt(
        mainSave,
        'save'
    ).toString();
}


function downloadMainSave() {

    const data =
        new Blob([
            getMainSave()
        ], {
            type:
                'application/octet-stream'
        });

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

    if (
        typeof CryptoJS ===
        'undefined'
    ) {

        throw new Error(
            'CryptoJS is required.'
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

    /*
     * Cookies may be restricted by the browser,
     * so don't let that stop the localStorage restore.
     */
    try {

        const cookiesSave =
            atob(
                mainSave.cookies
            );

        document.cookie =
            cookiesSave;

    } catch (error) {

        console.warn(
            'Could not restore cookies:',
            error
        );
    }
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

    document.body.appendChild(
        hiddenUpload
    );

    hiddenUpload.click();


    hiddenUpload.addEventListener(
        'change',
        function (e) {

            const file =
                e.target.files[0];

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
                            'Save upload failed:',
                            error
                        );

                        alert(
                            'Could not load this save file.'
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

const keyConfig =
    JSON.parse(
        localStorage.getItem(
            'keyConfig'
        ) || '{}'
    );


const keySlots =
    document.querySelectorAll(
        '.keySlot'
    );


const actions =
    document.querySelectorAll(
        '.slot-action'
    );


/* ---------------------------------------------------------
   LOAD SAVED KEYS
   --------------------------------------------------------- */

for (
    const slot in keyConfig
) {

    if (
        !Object.prototype.hasOwnProperty
            .call(
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
            !Object.prototype.hasOwnProperty
                .call(
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


/* ---------------------------------------------------------
   SAVE ACTION SELECT
   --------------------------------------------------------- */

actions.forEach(
    function (action) {

        action.addEventListener(
            'change',
            function () {

                const slot =
                    action.parentNode.id;

                if (!slot) {
                    return;
                }

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


/* ---------------------------------------------------------
   KEY SLOTS
   --------------------------------------------------------- */

keySlots.forEach(
    function (slot) {

        slot.addEventListener(
            'click',
            function () {

                slot.textContent =
                    'Press any key';


                const keyPressHandler =
                    function (event) {

                        event.preventDefault();

                        slot.textContent =
                            event.key;

                        document.removeEventListener(
                            'keydown',
                            keyPressHandler
                        );


                        const parSlot =
                            slot.parentNode.id;

                        if (!parSlot) {
                            return;
                        }

                        if (
                            !keyConfig[
                                parSlot
                            ]
                        ) {

                            keyConfig[
                                parSlot
                            ] = {};
                        }


                        const key =
                            slot.className
                                .replace(
                                    / /g,
                                    '-'
                                );


                        keyConfig[
                            parSlot
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
            !Object.prototype.hasOwnProperty
                .call(
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
            !config[
                'keySlot-1'
            ] ||
            !config[
                'keySlot-2'
            ] ||
            !config[
                'slot-action'
            ]
        ) {
            continue;
        }


        const key1Config =
            config[
                'keySlot-1'
            ].toLowerCase();

        const key2Config =
            config[
                'keySlot-2'
            ].toLowerCase();

        const key3Config =
            (
                config[
                    'keySlot-3'
                ] || ''
            ).toLowerCase();


        if (
            pressedKeys[
                key1Config
            ] &&
            pressedKeys[
                key2Config
            ] &&
            (
                key3Config
                    ? pressedKeys[
                        key3Config
                    ]
                    : true
            )
        ) {

            try {

                /*
                 * Existing action system.
                 */
                eval(
                    config[
                        'slot-action'
                    ]
                );

            } catch (error) {

                console.error(
                    'Key action failed:',
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
 * input[type="color"] does NOT accept:
 *
 * #373737a6
 *
 * It only accepts normal 6-digit colors.
 *
 * So the settings inputs use:
 *
 * #373737
 *
 * while the CSS variable can still be changed
 * separately if you need transparency.
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


const savedColorSettings =
    JSON.parse(
        localStorage.getItem(
            'colorSettings'
        ) || 'null'
    );


const colorSettings = {

    ...defaultColorSettings,

    ...(savedColorSettings || {})
};


/* ---------------------------------------------------------
   LOAD COLOR INPUTS
   --------------------------------------------------------- */

Object.keys(
    colorSettings
).forEach(
    function (key) {

        const inputElement =
            document.getElementById(
                key
            );

        if (!inputElement) {
            return;
        }

        /*
         * Color inputs require #RRGGBB.
         */
        if (
            /^#[0-9A-Fa-f]{6}$/
                .test(
                    colorSettings[key]
                )
        ) {

            inputElement.value =
                colorSettings[key];

        } else {

            /*
             * Strip alpha if an old saved value
             * contained it.
             */
            const cleaned =
                colorSettings[key]
                    .substring(
                        0,
                        7
                    );

            if (
                /^#[0-9A-Fa-f]{6}$/
                    .test(cleaned)
            ) {

                inputElement.value =
                    cleaned;
            }
        }
    }
);


/* ---------------------------------------------------------
   APPLY COLORS
   --------------------------------------------------------- */

Object.entries(
    colorSettings
).forEach(
    function ([key, value]) {

        document.documentElement
            .style.setProperty(
                `--${key}`,
                value
            );
    }
);


/* ---------------------------------------------------------
   SAVE COLORS
   --------------------------------------------------------- */

function saveColorChanges() {

    const inputs =
        document.querySelectorAll(
            'input[type="color"]'
        );

    const newColorSettings =
        {};

    inputs.forEach(
        function (input) {

            if (
                input.id &&
                /^#[0-9A-Fa-f]{6}$/
                    .test(
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

            document.documentElement
                .style.setProperty(
                    `--${key}`,
                    value
                );
        }
    );
}


/* ---------------------------------------------------------
   RESTORE COLORS
   --------------------------------------------------------- */

function restoreColorChanges() {

    localStorage.removeItem(
        'colorSettings'
    );


    Object.entries(
        defaultColorSettings
    ).forEach(
        function ([key, value]) {

            document.documentElement
                .style.setProperty(
                    `--${key}`,
                    value
                );

            const input =
                document.getElementById(
                    key
                );

            if (input) {
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


    /*
     * Only choose games that actually have
     * a URL.
     */
    const validGames =
        Array.from(
            gameLinks
        ).filter(
            function (game) {

                return game.getAttribute(
                    'url'
                );
            }
        );


    if (!validGames.length) {
        return;
    }


    const randomIndex =
        Math.floor(
            Math.random() *
            validGames.length
        );


    const randomGameLink =
        validGames[
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


/* ---------------------------------------------------------
   LOAD PREFERENCES
   --------------------------------------------------------- */

let storedPreferences =
    localStorage.getItem(
        'preferences'
    );


if (
    storedPreferences ===
    null
) {

    localStorage.setItem(
        'preferences',
        JSON.stringify(
            preferencesDefaults
        )
    );

    storedPreferences =
        JSON.stringify(
            preferencesDefaults
        );
}


/*
 * Merge with defaults so newly-added settings
 * don't become undefined.
 */

const preferences = {

    ...preferencesDefaults,

    ...JSON.parse(
        storedPreferences
    )
};


/*
 * Save the merged preferences.
 */

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
        preferences.cloak;
}


if (cloakUrl) {

    cloakUrl.value =
        preferences.cloakUrl;
}


if (maskCheckbox) {

    maskCheckbox.checked =
        preferences.mask;
}


if (maskTitle) {

    maskTitle.value =
        preferences.maskTitle;
}


if (maskIcon) {

    maskIcon.value =
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

    const presetElement =
        document.getElementById(
            'presets'
        );

    if (!presetElement) {
        return;
    }

    setPreset(
        presets[
            presetElement.value
        ]
    );
}


/* =========================================================
   CLOAK STARTUP
   ========================================================= */

/*
 * Because the default is now FALSE, this section
 * will NOT run on a fresh installation.
 */

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


                if (
                    event.target.className !==
                        'cloaklaunch' &&
                    event.target.className !==
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

            window.inGame =
                !preferences.background;
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
   DOWNLOAD / UPLOAD
   ========================================================= */

const downloadButton =
    document.getElementById(
        'download'
    );


if (downloadButton) {

    downloadButton.addEventListener(
        'click',
        function () {
            downloadMainSave();
        }
    );
}


const uploadButton =
    document.getElementById(
        'upload'
    );


if (uploadButton) {

    uploadButton.addEventListener(
        'click',
        function () {
            uploadMainSave();
        }
    );
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

if (
    document.getElementById(
        'gamesList'
    )
) {

    updateList();
}


/* =========================================================
   DONE
   ========================================================= */

console.log(
    'MonkeyGG2 script loaded successfully.'
);

console.log(
    'Cloak default:',
    preferences.cloak
);
