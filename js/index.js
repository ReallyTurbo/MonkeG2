/* =========================================================
   MAIN MENU
   ========================================================= */

let currentMenu = $('.homepage');


/* =========================================================
   GAME URL HANDLING
   ========================================================= */

/*
 * IMPORTANT:
 *
 * /games/2048
 *
 * becomes:
 *
 * /games/2048/
 *
 * BEFORE the URL is opened or placed inside an iframe.
 */

function fixGameUrl(url) {
    if (!url) {
        return url;
    }

    url = String(url).trim();

    try {
        const parsed = new URL(
            url,
            window.location.origin
        );

        /*
         * Only add the slash to game folder URLs.
         */
        if (
            parsed.pathname.startsWith('/games/') &&
            !parsed.pathname.endsWith('/')
        ) {
            parsed.pathname += '/';
        }

        return parsed.href;

    } catch (error) {
        console.error(
            'Could not fix game URL:',
            url,
            error
        );

        return url;
    }
}


/* =========================================================
   OPEN GAME IN NEW TAB
   ========================================================= */

function openGameInNewTab(gameUrl) {
    if (!gameUrl) {
        console.error('Game URL is missing.');
        return;
    }

    const fixedUrl =
        fixGameUrl(gameUrl);

    console.log(
        'Opening game:',
        fixedUrl
    );

    window.open(
        fixedUrl,
        '_blank'
    );
}


/* =========================================================
   GAME LIST CLICK
   ========================================================= */

/*
 * Example:
 *
 * <li url="/games/2048">2048</li>
 *
 * becomes:
 *
 * https://monkegg2.onrender.com/games/2048/
 */

$(document).on(
    'click',
    '#gamesList li',
    function (event) {

        event.preventDefault();

        const gameUrl =
            this.getAttribute('url');

        if (!gameUrl) {
            console.error(
                'Game is missing its url attribute:',
                this
            );

            return;
        }

        openGameInNewTab(
            gameUrl
        );
    }
);


/* =========================================================
   GAME CARD / MENU BUTTONS
   ========================================================= */

$(document).on(
    'click',
    '.column button .card',
    function () {

        const nextMenu =
            this.getAttribute('data');

        if (!nextMenu) {
            return;
        }

        if (nextMenu === 'proxy') {

            if (
                typeof config !== 'undefined' &&
                !config['proxy']
            ) {

                const disabled =
                    $('#disabled')[0];

                if (
                    disabled &&
                    typeof disabled.showModal === 'function'
                ) {
                    disabled.showModal();
                }

                return;
            }

            $('#everything-else').fadeOut(
                300,
                function () {

                    $('#page-loader').fadeIn(
                        200
                    );

                    let proxyPath =
                        '/proxy';

                    if (
                        typeof config !== 'undefined' &&
                        config['proxyPath']
                    ) {
                        proxyPath =
                            config['proxyPath'];
                    }

                    const iframe =
                        $('#page-loader iframe')[0];

                    if (iframe) {
                        iframe.src =
                            proxyPath;

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

        currentMenu.fadeOut(
            300,
            function () {

                $('.' + nextMenu)
                    .fadeIn(200);
            }
        );

        currentMenu =
            $('.' + nextMenu);
    }
);


/* =========================================================
   GENERAL BUTTONS
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
   DIALOGS
   ========================================================= */

$('dialog').on(
    'click',
    function (event) {

        const target =
            event.target;

        if (
            target &&
            !target.closest('div')
        ) {

            if (
                typeof target.close === 'function'
            ) {
                target.close();
            }
        }
    }
);


/* =========================================================
   JARO SIMILARITY
   ========================================================= */

function jaro_distance(
    s1,
    s2
) {

    if (s1 === s2) {
        return 1.0;
    }

    const len1 =
        s1.length;

    const len2 =
        s2.length;

    if (
        len1 === 0 ||
        len2 === 0
    ) {
        return 0.0;
    }

    const max_dist =
        Math.floor(
            Math.max(
                len1,
                len2
            ) / 2
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
   GAME LIST
   ========================================================= */

function updateList() {

    const searchElement =
        $('#search');

    const filter =
        searchElement.length
            ? String(
                searchElement.val() || ''
              ).toLowerCase()
            : '';

    const gamesList =
        document.getElementById(
            'gamesList'
        );

    if (!gamesList) {
        return;
    }

    const elems =
        Array.from(
            gamesList.querySelectorAll(
                'li'
            )
        );

    const sortElement =
        $('#sort');

    const sortType =
        sortElement.length
            ? sortElement.val()
            : 'default';


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
       FILTER
       ----------------------------------------------------- */

    elems.forEach(
        function (item) {

            const text =
                item.textContent
                    .toLowerCase();

            let similarity = 0;

            if (filter.length > 0) {

                similarity =
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
            }


            const matches =
                filter.length === 0 ||
                text.includes(filter) ||
                similarity >= 0.7;


            item.style.display =
                matches
                    ? ''
                    : 'none';
        }
    );


    /* -----------------------------------------------------
       SEARCH RELEVANCE
       ----------------------------------------------------- */

    if (
        filter.length > 0
    ) {

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


                const aliasesB =
                    b.getAttribute(
                        'aliases'
                    );

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

                return distanceB - distanceA;
            }
        );
    }


    /* -----------------------------------------------------
       PUT ITEMS BACK
       ----------------------------------------------------- */

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

dragElement(
    document.getElementById(
        'gameButton'
    )
);

dragElement(
    document.getElementById(
        'refresh'
    )
);


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

                break;
            }


            if (
                event.code ===
                sequence.keys[0]
            ) {

                matched = true;

                sequenceIndex = 1;

                break;
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

    const h =
        Math;

    const r =
        h.random;

    const a =
        document;

    const o =
        Date.now;


    const canvas =
        a.createElement(
            'canvas'
        );

    const style =
        canvas.style;

    style.position =
        'fixed';

    style.left =
        '0';

    style.top =
        '0';

    style.width =
        '100vw';

    style.height =
        '100vh';

    style.zIndex =
        '100000';

    style.pointerEvents =
        'none';


    a.body.insertBefore(
        canvas,
        a.body.firstChild
    );


    const context =
        canvas.getContext('2d');


    const particleCount =
        300;

    const gravity =
        5e-4;

    const padding =
        20;

    let width =
        canvas.width =
        window.innerWidth;

    let height =
        canvas.height =
        window.innerHeight;

    let bottom =
        height + padding;

    let right =
        width + padding;

    const size =
        15.2;


    const snowCanvas =
        a.createElement(
            'canvas'
        );

    snowCanvas.width =
        size;

    snowCanvas.height =
        size;


    const snowContext =
        snowCanvas.getContext(
            '2d'
        );


    const gradient =
        snowContext.createRadialGradient(
            7.6,
            7.6,
            0,
            7.6,
            7.6,
            7.6
        );


    gradient.addColorStop(
        0,
        'rgba(255,255,255,1)'
    );

    gradient.addColorStop(
        1,
        'rgba(255,255,255,0)'
    );


    snowContext.fillStyle =
        gradient;

    snowContext.fillRect(
        0,
        0,
        size,
        size
    );


    class Timer {

        constructor(
            duration,
            running = true
        ) {

            this._start =
                o();

            this._paused =
                !running;

            this._pauseTime =
                o();

            this.duration =
                duration;

            if (running) {
                this.start();
            }
        }


        get elapsed() {

            return this._paused
                ? this._pauseTime -
                    this._start
                : o() -
                    this._start;
        }


        get remaining() {

            return h.max(
                0,
                this.duration -
                this.elapsed
            );
        }


        get paused() {
            return this._paused;
        }


        start() {

            this._start =
                o() -
                this.elapsed;

            this._paused =
                false;

            return this;
        }


        reset() {

            this._pauseTime =
                this._start =
                o();

            return this;
        }


        pause() {

            this._paused =
                true;

            this._pauseTime =
                o();

            return this;
        }
    }


    class SnowParticle {

        draw() {

            const angle =
                h.atan(
                    this.xVelocity /
                    this.speed
                );

            context.save();

            context.translate(
                this.x,
                this.y
            );

            context.rotate(
                -angle
            );

            context.scale(
                this.scale,
                this.scale *
                h.max(
                    1,
                    h.pow(
                        this.velocity,
                        0.7
                    ) / 15
                )
            );

            context.drawImage(
                snowCanvas,
                -size / 2,
                -size / 2
            );

            context.restore();
        }
    }


    const particles = [];


    function resetParticles() {

        for (
            let i = 0;
            i < particles.length;
            i++
        ) {

            particles[i].x =
                r() *
                (height + padding);

            particles[i].y =
                r() *
                width;
        }
    }


    function resize() {

        canvas.width =
            width =
            window.innerWidth;

        canvas.height =
            height =
            window.innerHeight;

        bottom =
            height +
            padding;

        right =
            width +
            padding;

        resetParticles();
    }


    const timer =
        new Timer(
            0,
            true
        );

    const movementTimer =
        new Timer(
            0,
            true
        );


    for (
        let j = 0;
        j < particleCount;
        j++
    ) {

        const particle =
            new SnowParticle();


        particle.x =
            r() *
            (height + padding);

        particle.y =
            r() *
            width;

        particle.scale =
            3 *
            r() +
            0.8;

        particle.speed =
            0.1 *
            h.pow(
                particle.scale,
                2.5
            ) *
            50 *
            (2 * r() + 1);

        if (
            particle.speed < 65
        ) {
            particle.speed = 65;
        }

        particle.scale =
            particle.scale /
            7.6;

        particle.velocity =
            particle.speed *
            particle.speed;

        particle.phase =
            (
                r() *
                h.PI
            ) / 1.3;

        particle.wind =
            15 *
            particle.scale;

        particle.xVelocity = 0;
        particle.rotation = 0;

        particles.push(
            particle
        );
    }


    resetParticles();


    function animate() {

        context.clearRect(
            0,
            0,
            width,
            height
        );

        const delta =
            0.001 *
            timer.elapsed;

        timer.reset();

        const movement =
            movementTimer.elapsed *
            gravity;


        for (
            let n = 0;
            n < particles.length;
            n++
        ) {

            const particle =
                particles[n];


            particle.xVelocity =
                h.sin(
                    movement +
                    particle.phase
                ) *
                particle.wind;


            particle.velocity =
                h.sqrt(
                    particle.xVelocity *
                    particle.xVelocity +
                    particle.speed *
                    particle.speed
                );


            particle.x +=
                particle.speed *
                delta;

            particle.y +=
                particle.xVelocity *
                delta;


            if (
                particle.x >
                bottom
            ) {
                particle.x =
                    -padding;
            }


            if (
                particle.y >
                right
            ) {
                particle.y =
                    -padding;
            }


            if (
                particle.y <
                -padding
            ) {
                particle.y =
                    right;
            }


            particle.draw();
        }


        requestAnimationFrame(
            animate
        );
    }


    document.addEventListener(
        'visibilitychange',
        function () {
            setTimeout(
                resize,
                100
            );
        },
        false
    );


    window.addEventListener(
        'resize',
        resize,
        false
    );


    animate();
}


/* =========================================================
   DRAG ELEMENT
   ========================================================= */

function dragElement(
    element
) {

    if (!element) {
        return;
    }


    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;


    element.onmousedown =
        dragMouseDown;


    function dragMouseDown(
        event
    ) {

        event =
            event ||
            window.event;

        event.preventDefault();

        pos3 =
            event.clientX;

        pos4 =
            event.clientY;


        document.onmouseup =
            closeDragElement;

        document.onmousemove =
            elementDrag;
    }


    function elementDrag(
        event
    ) {

        event =
            event ||
            window.event;

        event.preventDefault();


        pos1 =
            pos3 -
            event.clientX;

        pos2 =
            pos4 -
            event.clientY;


        pos3 =
            event.clientX;

        pos4 =
            event.clientY;


        element.style.top =
            (
                element.offsetTop -
                pos2
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
        $('#page-loader iframe')[0];

    if (!iframe) {
        return;
    }


    const oldUrl =
        iframe.src;


    if (!oldUrl) {
        return;
    }


    iframe.src =
        'about:blank';


    setTimeout(
        function () {

            iframe.src =
                fixGameUrl(oldUrl);

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
        !replaceUrl &&
        typeof preferences !==
        'undefined'
    ) {

        replaceUrl =
            preferences.cloakUrl;
    }


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


    if (replaceUrl) {

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

    if (
        typeof preferences !==
        'undefined'
    ) {

        title =
            title ||
            preferences.maskTitle;

        iconUrl =
            iconUrl ||
            preferences.maskIconUrl;
    }


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

            doc
                .getElementsByTagName(
                    'head'
                )[0]
                .appendChild(link);
        }


        link.type =
            'image/x-icon';

        link.href =
            iconUrl;

    } catch (error) {

        console.error(
            'Could not mask page:',
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


    const popup =
        window.open(
            '/popup-page.php',
            windowName,
            'width=1000,height=700,left=24,top=24,scrollbars,resizable'
        );


    if (
        popup == null ||
        typeof popup ===
        'undefined'
    ) {

        return false;
    }


    popup.close();

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


function downloadMainSave() {

    const data =
        new Blob([
            getMainSave()
        ]);


    const dataURL =
        URL.createObjectURL(
            data
        );


    const link =
        document.createElement(
            'a'
        );


    link.href =
        dataURL;

    link.download =
        'monkey.data';


    document.body.appendChild(
        link
    );

    link.click();

    link.remove();


    setTimeout(
        function () {
            URL.revokeObjectURL(
                dataURL
            );
        },
        100
    );
}


function getMainSaveFromUpload(
    data
) {

    try {

        if (
            typeof CryptoJS !==
            'undefined'
        ) {

            data =
                CryptoJS.AES.decrypt(
                    data,
                    'save'
                ).toString(
                    CryptoJS.enc.Utf8
                );
        }


        const mainSave =
            JSON.parse(
                atob(data)
            );


        const localStorageSave =
            JSON.parse(
                atob(
                    mainSave.localStorage
                )
            );


        const cookiesSave =
            atob(
                mainSave.cookies
            );


        localStorageSave.forEach(
            function (item) {

                localStorage.setItem(
                    item[0],
                    item[1]
                );
            }
        );


        document.cookie =
            cookiesSave;


        return true;

    } catch (error) {

        console.error(
            'Could not restore save:',
            error
        );

        return false;
    }
}


function uploadMainSave() {

    const input =
        document.createElement(
            'input'
        );


    input.type =
        'file';

    input.accept =
        '.data';


    input.addEventListener(
        'change',
        function (event) {

            const file =
                event.target.files[0];


            if (!file) {
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


                    const result =
                        document.querySelector(
                            '.upload-result'
                        );


                    if (result) {

                        result.innerText =
                            success
                                ? 'Uploaded save!'
                                : 'Could not upload save.';

                        setTimeout(
                            function () {
                                result.innerText =
                                    '';
                            },
                            3000
                        );
                    }
                };


            reader.readAsText(
                file
            );
        }
    );


    document.body.appendChild(
        input
    );


    input.click();


    setTimeout(
        function () {

            if (input.parentNode) {
                input.remove();
            }

        },
        1000
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


Object.keys(
    keyConfig
).forEach(
    function (slot) {

        const slotData =
            keyConfig[slot];


        if (!slotData) {
            return;
        }


        const slotDiv =
            document.getElementById(
                slot
            );


        if (!slotDiv) {
            return;
        }


        Object.keys(
            slotData
        ).forEach(
            function (key) {

                const correctKey =
                    slotData[key];


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
                            i <
                            select.options.length;
                            i++
                        ) {

                            if (
                                select
                                    .options[i]
                                    .value ===
                                correctKey
                            ) {

                                select.selectedIndex =
                                    i;

                                break;
                            }
                        }
                    }

                    return;
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


                if (keyElement) {

                    keyElement.textContent =
                        correctKey;
                }
            }
        );
    }
);


/* =========================================================
   KEY ACTION SELECTS
   ========================================================= */

actions.forEach(
    function (action) {

        action.addEventListener(
            'change',
            function () {

                const parent =
                    action.closest(
                        '[id]'
                    );


                if (!parent) {
                    return;
                }


                const slot =
                    parent.id;


                if (!keyConfig[slot]) {

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


/* =========================================================
   KEY SLOTS
   ========================================================= */

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


                        const parent =
                            slot.closest(
                                '[id]'
                            );


                        if (!parent) {
                            return;
                        }


                        const parentSlot =
                            parent.id;


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
                                .split(/\s+/)
                                .find(
                                    function (name) {
                                        return name
                                            .toLowerCase()
                                            .includes(
                                                'keyslot'
                                            );
                                    }
                                );


                        if (!key) {
                            return;
                        }


                        keyConfig[
                            parentSlot
                        ][
                            key
                        ] =
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


function onKeyRelease(
    event
) {

    const key =
        event.key.toLowerCase();


    pressedKeys[key] =
        false;
}


function onKeyPress(
    event
) {

    const key =
        event.key.toLowerCase();


    pressedKeys[key] =
        true;


    Object.keys(
        keyConfig
    ).forEach(
        function (slot) {

            const settings =
                keyConfig[slot];


            if (!settings) {
                return;
            }


            const key1 =
                settings[
                    'keySlot-1'
                ];


            const key2 =
                settings[
                    'keySlot-2'
                ];


            const key3 =
                settings[
                    'keySlot-3'
                ];


            const action =
                settings[
                    'slot-action'
                ];


            if (
                !key1 ||
                !key2 ||
                !action
            ) {
                return;
            }


            const key1Config =
                key1.toLowerCase();


            const key2Config =
                key2.toLowerCase();


            const key3Config =
                key3
                    ? key3.toLowerCase()
                    : '';


            if (
                pressedKeys[key1Config] &&
                pressedKeys[key2Config] &&
                (
                    key3Config
                        ? pressedKeys[
                            key3Config
                          ]
                        : true
                )
            ) {

                try {

                    eval(action);

                } catch (error) {

                    console.error(
                        'Key action failed:',
                        error
                    );
                }
            }
        }
    );
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
 * <input type="color"> does NOT accept:
 *
 * #373737a6
 * #111
 *
 * So these are changed to valid 6-digit colors.
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


let colorSettings = {};


try {

    colorSettings =
        JSON.parse(
            localStorage.getItem(
                'colorSettings'
            )
        ) ||
        defaultColorSettings;

} catch (error) {

    colorSettings =
        defaultColorSettings;
}


/* ---------------------------------------------------------
   APPLY COLORS
   --------------------------------------------------------- */

Object.keys(
    colorSettings
).forEach(
    function (key) {

        const input =
            document.getElementById(
                key
            );


        if (input) {

            /*
             * type=color needs a valid
             * 6-digit hexadecimal value.
             */

            let value =
                colorSettings[key];


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

                colorSettings[key] =
                    value;
            }
        }
    }
);


/* ---------------------------------------------------------
   CSS VARIABLES
   --------------------------------------------------------- */

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


/* =========================================================
   SAVE COLOR CHANGES
   ========================================================= */

function saveColorChanges() {

    const inputs =
        document.querySelectorAll(
            'input[type="color"]'
        );


    const newColorSettings =
        {};


    inputs.forEach(
        function (input) {

            newColorSettings[
                input.id
            ] =
                input.value;
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


/* =========================================================
   RESTORE COLORS
   ========================================================= */

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


    if (!gameLinks.length) {
        return;
    }


    const randomIndex =
        Math.floor(
            Math.random() *
            gameLinks.length
        );


    const randomGameLink =
        gameLinks[randomIndex];


    const gameUrl =
        randomGameLink.getAttribute(
            'url'
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


let preferences;


try {

    const savedPreferences =
        localStorage.getItem(
            'preferences'
        );


    if (!savedPreferences) {

        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferencesDefaults
            )
        );


        preferences =
            {
                ...preferencesDefaults
            };

    } else {

        preferences =
            {
                ...preferencesDefaults,
                ...JSON.parse(
                    savedPreferences
                )
            };
    }

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
        preferences.cloakUrl;
}


if (maskCheckbox) {

    maskCheckbox.checked =
        !!preferences.mask;
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


function setPreset(
    object
) {

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

    const select =
        document.getElementById(
            'presets'
        );


    if (!select) {
        return;
    }


    const preset =
        presets[
            select.value
        ];


    if (preset) {

        setPreset(
            preset
        );
    }
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
   DOWNLOAD / UPLOAD
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

$(document).ready(
    function () {

        updateList();
    }
);
