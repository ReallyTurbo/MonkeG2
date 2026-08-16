/* =========================================================
   SCHOOL TERMINAL - MAIN SCRIPT
   ========================================================= */

/* =========================================================
   GLOBALS
   ========================================================= */

let currentMenu =
    $('.games');


/*
 * Do NOT declare `inGame` here.
 *
 * Your existing bg.js / loading.js system owns it.
 */


/* =========================================================
   SAFE EVENT HELPERS
   ========================================================= */

function onClick(
    selector,
    callback
) {

    document.addEventListener(
        'click',
        function (event) {

            const target =
                event.target.closest(
                    selector
                );

            if (!target) {
                return;
            }

            if (
                typeof callback ===
                'function'
            ) {

                callback.call(
                    target,
                    event
                );
            }
        }
    );
}


function onChange(
    selector,
    callback
) {

    document.addEventListener(
        'change',
        function (event) {

            if (
                !event.target.matches(
                    selector
                )
            ) {

                return;
            }

            if (
                typeof callback ===
                'function'
            ) {

                callback.call(
                    event.target,
                    event
                );
            }
        }
    );
}


function onInput(
    selector,
    callback
) {

    document.addEventListener(
        'input',
        function (event) {

            if (
                !event.target.matches(
                    selector
                )
            ) {

                return;
            }

            if (
                typeof callback ===
                'function'
            ) {

                callback.call(
                    event.target,
                    event
                );
            }
        }
    );
}


/* =========================================================
   MENU NAVIGATION
   ========================================================= */

function showMenu(
    menu
) {

    $('.homepage').hide();
    $('.games').hide();
    $('.settings').hide();
    $('#page-loader').hide();

    if (
        menu &&
        menu.length
    ) {

        menu.show();

        currentMenu =
            menu;
    }
}


function goToGames() {

    showMenu(
        $('.games')
    );

    if (
        typeof inGame !==
        'undefined'
    ) {

        inGame =
            false;
    }

    document
        .querySelectorAll(
            '.portal-nav-button'
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    'active',
                    button.getAttribute(
                        'data-nav'
                    ) === 'games'
                );
            }
        );
}


function goToSettings() {

    showMenu(
        $('.settings')
    );

    document
        .querySelectorAll(
            '.portal-nav-button'
        )
        .forEach(
            function (button) {

                button.classList.remove(
                    'active'
                );
            }
        );
}


function goToHome() {

    showMenu(
        $('.homepage')
    );
}


/* =========================================================
   GAME URL FIX
   ========================================================= */

function fixGameUrl(
    url
) {

    if (!url) {
        return url;
    }

    url =
        String(
            url
        ).trim();


    url =
        url.replace(
            /\u3000/g,
            ''
        );


    /*
     * =====================================================
     * EAGLERCRAFT
     * =====================================================
     */

    const eaglercraftPaths = [
        'games/ampler-launcher/mc/1.5.2',
        'games/ampler-launcher/mc/1.8.8',
        'games/ampler-launcher/mc/1.12.2',

        '/games/ampler-launcher/mc/1.5.2',
        '/games/ampler-launcher/mc/1.8.8',
        '/games/ampler-launcher/mc/1.12.2'
    ];


    for (
        const eaglerPath of
        eaglercraftPaths
    ) {

        if (
            url ===
            eaglerPath
        ) {

            if (
                !url.endsWith('/')
            ) {

                url += '/';
            }

            console.log(
                '[EAGLERCRAFT] Fixed:',
                url
            );

            return url;
        }
    }


    /*
     * Absolute URL.
     */

    if (
        url.startsWith(
            'http://'
        ) ||
        url.startsWith(
            'https://'
        )
    ) {

        try {

            const parsed =
                new URL(
                    url
                );

            if (
                parsed.pathname.startsWith(
                    '/games/'
                ) &&
                !parsed.pathname.endsWith(
                    '/'
                )
            ) {

                const lastPart =
                    parsed.pathname.substring(
                        parsed.pathname.lastIndexOf(
                            '/'
                        ) + 1
                    );


                const knownFiles = [
                    '.html',
                    '.htm',
                    '.js',
                    '.css',
                    '.json',
                    '.png',
                    '.jpg',
                    '.jpeg',
                    '.gif',
                    '.webp',
                    '.svg',
                    '.ico',
                    '.mp3',
                    '.wav',
                    '.ogg',
                    '.mp4',
                    '.webm',
                    '.wasm',
                    '.xml',
                    '.txt'
                ];


                const isFile =
                    knownFiles.some(
                        function (
                            extension
                        ) {

                            return lastPart
                                .toLowerCase()
                                .endsWith(
                                    extension
                                );
                        }
                    );


                if (!isFile) {

                    parsed.pathname +=
                        '/';
                }
            }

            return parsed.toString();

        } catch (error) {

            console.error(
                'Invalid absolute game URL:',
                url,
                error
            );

            return url;
        }
    }


    /*
     * Relative URL.
     */

    if (
        url.startsWith(
            'games/'
        )
    ) {

        url =
            '/' +
            url;
    }


    if (
        url.startsWith(
            '/games/'
        ) &&
        !url.endsWith(
            '/'
        )
    ) {

        const lastPart =
            url.substring(
                url.lastIndexOf(
                    '/'
                ) + 1
            );


        const knownFiles = [
            '.html',
            '.htm',
            '.js',
            '.css',
            '.json',
            '.png',
            '.jpg',
            '.jpeg',
            '.gif',
            '.webp',
            '.svg',
            '.ico',
            '.mp3',
            '.wav',
            '.ogg',
            '.mp4',
            '.webm',
            '.wasm',
            '.xml',
            '.txt'
        ];


        const isFile =
            knownFiles.some(
                function (
                    extension
                ) {

                    return lastPart
                        .toLowerCase()
                        .endsWith(
                            extension
                        );
                }
            );


        if (!isFile) {

            url += '/';
        }
    }


    return url;
}


/* =========================================================
   OPEN GAME
   ========================================================= */

function openGameInNewTab(
    gameUrl,
    gameName
) {

    if (!gameUrl) {
        return;
    }


    gameUrl =
        fixGameUrl(
            gameUrl
        );


    let fullUrl;


    try {

        fullUrl =
            new URL(
                gameUrl,
                window.location.origin
            ).href;

    } catch (error) {

        console.error(
            'Could not create game URL:',
            gameUrl,
            error
        );

        return;
    }


    /*
     * Final trailing slash safety check.
     */

    try {

        const parsed =
            new URL(
                fullUrl
            );

        if (
            parsed.pathname.startsWith(
                '/games/'
            ) &&
            !parsed.pathname.endsWith(
                '/'
            )
        ) {

            const lastPart =
                parsed.pathname.substring(
                    parsed.pathname.lastIndexOf(
                        '/'
                    ) + 1
                );

            if (
                !lastPart.includes(
                    '.'
                )
            ) {

                parsed.pathname +=
                    '/';
            }
        }

        fullUrl =
            parsed.href;

    } catch (error) {

        console.warn(
            'Could not normalize URL:',
            fullUrl
        );
    }


    console.log(
        'Opening game:',
        fullUrl
    );


    /*
     * Remember game.
     */

    if (
        gameName &&
        typeof saveRecentlyPlayed ===
        'function'
    ) {

        saveRecentlyPlayed(
            gameName
        );
    }


    /*
     * Open new tab FIRST.
     */

    const newTab =
        window.open(
            fullUrl,
            '_blank'
        );


    if (!newTab) {

        alert(
            'Your browser blocked the new game tab. Please allow popups for this site.'
        );

        return;
    }


    /*
     * Prevent opener behavior.
     */

    try {

        newTab.opener =
            null;

    } catch (error) {

        // Ignore.
    }


    /*
     * Original tab stays on the Games menu.
     */

    goToGames();
}


/* =========================================================
   GAME FROM GENERATED CARD
   ========================================================= */

window.openGameFromCard =
    function (
        gameName,
        gameData
    ) {

        if (
            !gameData
        ) {

            return;
        }


        const path =
            String(
                gameData.path || ''
            ).replace(
                /^\/+/,
                ''
            );


        if (!path) {
            return;
        }


        openGameInNewTab(
            'games/' + path,
            gameName
        );
    };


/* =========================================================
   ORIGINAL GAME LIST
   ========================================================= */

$(document).on(
    'click',
    '#gamesList li',
    function (event) {

        event.preventDefault();
        event.stopPropagation();


        const item =
            this;

        const gameUrl =
            fixGameUrl(
                item.getAttribute(
                    'url'
                )
            );


        const gameName =
            item.getAttribute(
                'game-name'
            ) ||
            item.textContent
                .replace(
                    '☆',
                    ''
                )
                .replace(
                    '★',
                    ''
                )
                .trim();


        if (!gameUrl) {

            console.warn(
                'Game has no URL:',
                item
            );

            return;
        }


        openGameInNewTab(
            gameUrl,
            gameName
        );
    }
);


/* =========================================================
   HOME BUTTON
   ========================================================= */

onClick(
    '#gameButton',
    function (
        event
    ) {

        event.preventDefault();

        goToGames();
    }
);


/* =========================================================
   LOGO
   ========================================================= */

onClick(
    '.portal-logo',
    function () {

        goToGames();
    }
);


/* =========================================================
   TOP SETTINGS
   ========================================================= */

onClick(
    '#settingsTopButton',
    function () {

        goToSettings();
    }
);


/* =========================================================
   WELCOME BUTTON
   ========================================================= */

onClick(
    '[data-open-games]',
    function () {

        goToGames();
    }
);


/* =========================================================
   NAVIGATION
   ========================================================= */

onClick(
    '.portal-nav-button',
    function () {

        const nav =
            this.getAttribute(
                'data-nav'
            );


        document
            .querySelectorAll(
                '.portal-nav-button'
            )
            .forEach(
                function (button) {

                    button.classList.remove(
                        'active'
                    );
                }
            );


        this.classList.add(
            'active'
        );


        if (
            nav === 'games'
        ) {

            goToGames();
            return;
        }


        if (
            nav === 'recent'
        ) {

            goToGames();

            setTimeout(
                function () {

                    const section =
                        document.getElementById(
                            'recentSection'
                        );

                    if (section) {

                        section.scrollIntoView({
                            behavior:
                                'smooth',
                            block:
                                'start'
                        });
                    }

                },
                50
            );

            return;
        }


        if (
            nav === 'favorites'
        ) {

            goToGames();

            setTimeout(
                function () {

                    filterGames(
                        'favorites'
                    );

                },
                50
            );

            return;
        }


        filterGames(
            nav
        );

        goToGames();
    }
);


/* =========================================================
   HOMEPAGE CARD COMPATIBILITY
   ========================================================= */

$(document).on(
    'click',
    '.homepage .card',
    function (event) {

        event.preventDefault();

        const destination =
            this.getAttribute(
                'data'
            );


        if (
            destination === 'games'
        ) {

            goToGames();

            return;
        }


        if (
            destination === 'settings'
        ) {

            goToSettings();

            return;
        }


        if (
            destination === 'proxy'
        ) {

            if (
                typeof config !==
                'undefined' &&
                config &&
                config.proxyPath
            ) {

                window.open(
                    config.proxyPath,
                    '_blank'
                );

            } else {

                console.warn(
                    'Proxy is not configured.'
                );
            }
        }
    }
);


/* =========================================================
   HOME
   ========================================================= */

function returnHome() {

    goToHome();
}


/* =========================================================
   REFRESH
   ========================================================= */

function refreshPage() {

    location.reload();
}

onClick(
    '#refresh',
    refreshPage
);


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function filterGames(
    category
) {

    const list =
        document.getElementById(
            'gamesList'
        );

    if (!list) {
        return;
    }


    const items =
        list.querySelectorAll(
            'li'
        );


    items.forEach(
        function (item) {

            if (
                category === 'favorites'
            ) {

                const gameName =
                    item.getAttribute(
                        'game-name'
                    );

                const favorites =
                    JSON.parse(
                        localStorage.getItem(
                            'starredGamesList'
                        ) || '[]'
                    );


                item.style.display =
                    favorites.includes(
                        gameName
                    )
                        ? ''
                        : 'none';

                return;
            }


            if (
                category === 'all'
            ) {

                item.style.display =
                    '';

                return;
            }


            const categories =
                String(
                    item.getAttribute(
                        'categories'
                    ) || ''
                ).toLowerCase();


            item.style.display =
                categories
                    .split(',')
                    .includes(
                        category
                    )
                        ? ''
                        : 'none';
        }
    );
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

onClick(
    '.category-button',
    function () {

        const category =
            this.getAttribute(
                'data-category'
            );


        document
            .querySelectorAll(
                '.category-button'
            )
            .forEach(
                function (button) {

                    button.classList.remove(
                        'active'
                    );
                }
            );


        this.classList.add(
            'active'
        );


        filterGames(
            category
        );
    }
);


/* =========================================================
   SEARCH
   ========================================================= */

function updateList() {

    const search =
        document.getElementById(
            'search'
        );

    const list =
        document.getElementById(
            'gamesList'
        );


    if (!search || !list) {
        return;
    }


    const filter =
        search.value
            .toLowerCase()
            .trim();


    const items =
        Array.from(
            list.querySelectorAll(
                'li'
            )
        );


    items.forEach(
        function (item) {

            const name =
                String(
                    item.getAttribute(
                        'game-name'
                    ) ||
                    item.textContent
                ).toLowerCase();


            const aliases =
                String(
                    item.getAttribute(
                        'aliases'
                    ) || ''
                ).toLowerCase();


            const matches =
                !filter ||
                name.includes(
                    filter
                ) ||
                aliases.includes(
                    filter
                );


            item.style.display =
                matches
                    ? ''
                    : 'none';
        }
    );
}


onInput(
    '#search',
    updateList
);


/* =========================================================
   SORT
   ========================================================= */

onChange(
    '#sort',
    function () {

        const sort =
            this.value;

        const list =
            document.getElementById(
                'gamesList'
            );


        if (!list) {
            return;
        }


        const items =
            Array.from(
                list.children
            );


        items.sort(
            function (
                a,
                b
            ) {

                const aName =
                    (
                        a.getAttribute(
                            'game-name'
                        ) || ''
                    ).toLowerCase();


                const bName =
                    (
                        b.getAttribute(
                            'game-name'
                        ) || ''
                    ).toLowerCase();


                return sort ===
                    'reverse'
                    ? bName.localeCompare(
                        aName
                    )
                    : aName.localeCompare(
                        bName
                    );
            }
        );


        items.forEach(
            function (item) {

                list.appendChild(
                    item
                );
            }
        );
    }
);


/* =========================================================
   RANDOM GAME
   ========================================================= */

function randomGame() {

    const items =
        Array.from(
            document.querySelectorAll(
                '#gamesList li'
            )
        ).filter(
            function (item) {

                return (
                    item.style.display !==
                    'none'
                );
            }
        );


    if (!items.length) {

        return;
    }


    const item =
        items[
            Math.floor(
                Math.random() *
                items.length
            )
        ];


    const gameUrl =
        fixGameUrl(
            item.getAttribute(
                'url'
            )
        );


    const gameName =
        item.getAttribute(
            'game-name'
        );


    openGameInNewTab(
        gameUrl,
        gameName
    );
}


/* =========================================================
   MAKE AVAILABLE FOR HTML
   ========================================================= */

window.randomGame =
    randomGame;


/* =========================================================
   REFRESH
   ========================================================= */

function refreshIframe() {

    const iframe =
        document.querySelector(
            '#page-loader iframe'
        );


    if (!iframe) {

        location.reload();

        return;
    }


    const oldSrc =
        iframe.getAttribute(
            'src'
        );


    if (!oldSrc) {

        location.reload();

        return;
    }


    iframe.src =
        '';

    setTimeout(
        function () {

            iframe.src =
                oldSrc;

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


    document.title =
        title;


    let link =
        document.querySelector(
            "link[rel*='icon']"
        );


    if (!link) {

        link =
            document.createElement(
                'link'
            );

        link.rel =
            'icon';

        document.head.appendChild(
            link
        );
    }


    if (iconUrl) {

        link.href =
            iconUrl;
    }
}


/* =========================================================
   POPUPS
   ========================================================= */

function popupsAllowed() {

    const popUp =
        window.open(
            '',
            'userConsole',
            'width=1000,height=700,left=24,top=24,scrollbars,resizable'
        );


    if (!popUp) {

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


    if (!media.length) {
        return;
    }


    const muted =
        Array.from(
            media
        ).every(
            function (
                element
            ) {

                return element.muted;
            }
        );


    media.forEach(
        function (
            element
        ) {

            element.muted =
                !muted;
        }
    );
}


/* =========================================================
   SAVE
   ========================================================= */

function getMainSave() {

    const save = {

        localStorage:
            btoa(
                JSON.stringify(
                    Object.entries(
                        localStorage
                    )
                )
            ),

        cookies:
            btoa(
                document.cookie
            )

    };


    let result =
        btoa(
            JSON.stringify(
                save
            )
        );


    if (
        typeof CryptoJS !==
        'undefined'
    ) {

        result =
            CryptoJS.AES.encrypt(
                result,
                'save'
            ).toString();
    }


    return result;
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadMainSave() {

    const blob =
        new Blob(
            [
                getMainSave()
            ],
            {
                type:
                    'application/octet-stream'
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            'a'
        );


    link.href =
        url;

    link.download =
        'school-terminal.data';


    document.body.appendChild(
        link
    );

    link.click();

    link.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        100
    );
}


/* =========================================================
   UPLOAD
   ========================================================= */

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
        function () {

            const file =
                input.files[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function () {

                    try {

                        let data =
                            reader.result;


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


                        const save =
                            JSON.parse(
                                atob(
                                    data
                                )
                            );


                        const localSave =
                            JSON.parse(
                                atob(
                                    save.localStorage
                                )
                            );


                        localSave.forEach(
                            function (
                                item
                            ) {

                                localStorage.setItem(
                                    item[0],
                                    item[1]
                                );
                            }
                        );


                        alert(
                            'Save uploaded!'
                        );


                    } catch (error) {

                        console.error(
                            error
                        );

                        alert(
                            'That save file could not be loaded.'
                        );
                    }

                };


            reader.readAsText(
                file
            );
        }
    );


    input.click();
}


/* =========================================================
   COLOR SETTINGS
   ========================================================= */

const defaultColorSettings = {

    bg:
        '#faf8f6',

    'block-color':
        '#ffffff',

    'button-color':
        '#ffffff',

    'games-color':
        '#ffffff',

    'hover-color':
        '#f1efed',

    'scrollbar-color':
        '#c7c2bd',

    'scroll-track-color':
        '#f4f2f0',

    'font-color':
        '#252525'
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


Object.entries(
    colorSettings
).forEach(
    function (
        [
            key,
            value
        ]
    ) {

        document.documentElement
            .style
            .setProperty(
                '--' + key,
                value
            );
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


    const settings = {
        ...colorSettings
    };


    inputs.forEach(
        function (
            input
        ) {

            if (
                input.id
            ) {

                settings[
                    input.id
                ] =
                    input.value;
            }
        }
    );


    localStorage.setItem(
        'colorSettings',
        JSON.stringify(
            settings
        )
    );


    colorSettings =
        settings;


    Object.entries(
        settings
    ).forEach(
        function (
            [
                key,
                value
            ]
        ) {

            document.documentElement
                .style
                .setProperty(
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


    colorSettings =
        {
            ...defaultColorSettings
        };


    Object.entries(
        colorSettings
    ).forEach(
        function (
            [
                key,
                value
            ]
        ) {

            document.documentElement
                .style
                .setProperty(
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
   PREFERENCES
   ========================================================= */

const preferencesDefaults = {

    cloak:
        false,

    cloakUrl:
        'https://classroom.google.com/',

    mask:
        true,

    maskTitle:
        'Google Maps',

    maskIconUrl:
        'https://www.google.com/images/branding/product/ico/googleg_lodp.ico',

    background:
        false
};


let preferences;


try {

    const stored =
        localStorage.getItem(
            'preferences'
        );


    preferences =
        stored
            ? JSON.parse(
                stored
            )
            : {
                ...preferencesDefaults
            };

} catch (error) {

    preferences =
        {
            ...preferencesDefaults
        };
}


preferences =
    {
        ...preferencesDefaults,
        ...preferences
    };


localStorage.setItem(
    'preferences',
    JSON.stringify(
        preferences
    );


/* =========================================================
   PREFERENCE INPUTS
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


if (backgroundCheckbox) {

    backgroundCheckbox.checked =
        preferences.background;
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


/* =========================================================
   SETTINGS
   ========================================================= */

onChange(
    '#cloakCheckboxInput',
    function () {

        preferences.cloak =
            this.checked;

        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );
    }
);


onChange(
    '#backgroundCheckboxInput',
    function () {

        preferences.background =
            this.checked;

        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );
    }
);


onChange(
    '#maskCheckboxInput',
    function () {

        preferences.mask =
            this.checked;

        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );
    }
);


onClick(
    '#cloakUrlSubmit',
    function () {

        preferences.cloakUrl =
            cloakUrlInput.value.trim();


        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );


        alert(
            'Cloak URL saved.'
        );
    }
);


onClick(
    '#maskTitleSubmit',
    function () {

        preferences.maskTitle =
            maskTitleInput.value;


        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );


        mask();
    }
);


onClick(
    '#maskIconSubmit',
    function () {

        preferences.maskIconUrl =
            maskIconInput.value;


        localStorage.setItem(
            'preferences',
            JSON.stringify(
                preferences
            )
        );


        mask();
    }
);


/* =========================================================
   SAVE BUTTONS
   ========================================================= */

onClick(
    '#download',
    downloadMainSave
);

onClick(
    '#upload',
    uploadMainSave
);


/* =========================================================
   RANDOM BUTTON
   ========================================================= */

onClick(
    '#randomGame',
    randomGame
);


/* =========================================================
   MASK
   ========================================================= */

if (
    preferences.mask
) {

    mask();
}


/* =========================================================
   AUTOMATIC GAMES PAGE
   ========================================================= */

function openGamesMenuOnStartup() {

    goToGames();

    updateList();

    console.log(
        'Games menu opened.'
    );
}


/* =========================================================
   STARTUP
   ========================================================= */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        openGamesMenuOnStartup,
        {
            once: true
        }
    );

} else {

    openGamesMenuOnStartup();
}


/* =========================================================
   FINAL
   ========================================================= */

console.log(
    '%cSchool Terminal loaded.',
    'font-weight:bold;'
);

console.log(
    'Cloak:',
    preferences.cloak
        ? 'ON'
        : 'OFF'
);

console.log(
    'Games use trailing slash URLs.'
);
