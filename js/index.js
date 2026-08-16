let currentMenu = $('.homepage');

let games = [];
let pressedKeys = {};
let keybinds = [];

/* =========================================================
   MENU NAVIGATION
   ========================================================= */

function showMenu(menu) {
    $('.homepage, .games, .settings').hide();
    $(menu).show();
    currentMenu = $(menu);
}

$('.column button .card').on('click', function () {
    const nextMenu = $(this).attr('data');

    if (nextMenu === 'games') {
        showMenu('.games');
    }

    else if (nextMenu === 'settings') {
        showMenu('.settings');
    }

    else if (nextMenu === 'proxy') {
        if (
            typeof config !== 'undefined' &&
            config.proxy
        ) {
            window.open(config.proxy, '_blank');
        }
        else {
            const disabled = document.getElementById('disabled');

            if (disabled) {
                disabled.showModal();
            }
        }
    }
});


/* =========================================================
   RETURN HOME
   ========================================================= */

function returnHome() {
    $('.games, .settings').hide();
    $('.homepage').show();

    currentMenu = $('.homepage');
}


/* =========================================================
   GAME DATA
   ========================================================= */

function getGameData() {
    /*
     * MonkeyGG2 normally stores the game information
     * inside config.js.
     */

    if (
        typeof config !== 'undefined' &&
        Array.isArray(config.games)
    ) {
        return config.games;
    }

    /*
     * Some versions of the site use config["games"].
     */

    if (
        typeof config !== 'undefined' &&
        config['games'] &&
        Array.isArray(config['games'])
    ) {
        return config['games'];
    }

    return [];
}


/* =========================================================
   LOAD GAMES
   ========================================================= */

function loadGames() {
    games = getGameData();

    displayGames();
}


/* =========================================================
   GET GAME NAME
   ========================================================= */

function getGameName(game) {
    if (typeof game === 'string') {
        return game;
    }

    if (!game) {
        return 'Game';
    }

    return (
        game.name ||
        game.title ||
        game.text ||
        game.game ||
        'Game'
    );
}


/* =========================================================
   GET GAME URL
   ========================================================= */

function getGameURL(game) {
    if (typeof game === 'string') {
        return game;
    }

    if (!game) {
        return '';
    }

    return (
        game.url ||
        game.link ||
        game.path ||
        game.href ||
        ''
    );
}


/* =========================================================
   FIX GAME URL
   ========================================================= */

function fixGameURL(url) {
    if (!url) {
        return '';
    }

    let gameUrl = String(url).trim();

    /*
     * Remove accidental whitespace.
     */

    gameUrl = gameUrl.replace(/\s+/g, '');


    /*
     * Eaglercraft / directory-based games need
     * the trailing slash.
     *
     * Example:
     *
     * /games/ampler-launcher/mc/1.5.2
     *
     * becomes:
     *
     * /games/ampler-launcher/mc/1.5.2/
     */

    if (
        gameUrl.includes('/games/ampler-launcher/mc/') &&
        !gameUrl.endsWith('/')
    ) {
        gameUrl += '/';
    }


    /*
     * Other directory-style game URLs.
     *
     * Don't add a slash to actual files such as:
     *
     * game.html
     * index.html
     * game.js
     * game.swf
     */

    if (
        !gameUrl.endsWith('/') &&
        !gameUrl.includes('?') &&
        !gameUrl.includes('#') &&
        !/\.[a-zA-Z0-9]{2,6}$/.test(gameUrl)
    ) {
        gameUrl += '/';
    }

    return gameUrl;
}


/* =========================================================
   DISPLAY GAMES
   ========================================================= */

function displayGames() {
    const list = $('#gamesList');

    if (!list.length) {
        return;
    }

    list.empty();

    const searchValue =
        String($('#search').val() || '')
            .toLowerCase()
            .trim();

    const sortType =
        $('#sort').val() || 'alphabetical';


    let filteredGames = games.filter(function (game) {

        const name =
            getGameName(game)
                .toLowerCase();

        return name.includes(searchValue);
    });


    filteredGames.sort(function (a, b) {

        const nameA =
            getGameName(a);

        const nameB =
            getGameName(b);

        return nameA.localeCompare(nameB);
    });


    if (sortType === 'reverse') {
        filteredGames.reverse();
    }


    filteredGames.forEach(function (game) {

        const name =
            getGameName(game);

        const url =
            fixGameURL(
                getGameURL(game)
            );


        /*
         * Create the same kind of <li>
         * that your existing index.html expects.
         */

        const li =
            $('<li></li>');

        const button =
            $('<button></button>');


        button.attr(
            'type',
            'button'
        );


        button.text(name);


        /*
         * Store the URL directly on the LI.
         */

        li.attr(
            'url',
            url
        );


        /*
         * Also store it on the button.
         * This makes the click handler more reliable.
         */

        button.attr(
            'data-url',
            url
        );


        li.append(button);

        list.append(li);
    });
}


/* =========================================================
   GAME CLICK HANDLER
   ========================================================= */

/*
 * IMPORTANT:
 *
 * We DO NOT use:
 *
 * #page-loader iframe
 *
 * anymore.
 *
 * The game opens directly in a new tab.
 */

$(document).on(
    'click',
    '#gamesList li, #gamesList li button',
    function (event) {

        event.preventDefault();
        event.stopPropagation();


        const li =
            $(this).closest('li');


        let gameUrl =
            li.attr('url') ||
            $(this).attr('data-url');


        if (!gameUrl) {
            console.error(
                'Game URL could not be found.'
            );

            return;
        }


        gameUrl =
            fixGameURL(gameUrl);


        /*
         * Keep the corrected URL on the element.
         */

        li.attr(
            'url',
            gameUrl
        );


        console.log(
            '[GAME] Opening:',
            gameUrl
        );


        /*
         * OPEN THE GAME IN A NEW TAB.
         *
         * This completely bypasses the iframe.
         */

        const gameTab =
            window.open(
                gameUrl,
                '_blank'
            );


        /*
         * If the browser blocked the popup,
         * tell the user.
         */

        if (!gameTab) {

            alert(
                'The game could not open because your browser blocked the new tab. Please allow pop-ups for this site.'
            );

            return;
        }


        gameTab.focus();
    }
);


/* =========================================================
   SEARCH
   ========================================================= */

$('#search').on(
    'input',
    function () {
        displayGames();
    }
);


/* =========================================================
   SORT
   ========================================================= */

$('#sort').on(
    'change',
    function () {
        displayGames();
    }
);


/* =========================================================
   RANDOM GAME
   ========================================================= */

function randomGame() {

    if (!games.length) {
        return;
    }


    const game =
        games[
            Math.floor(
                Math.random() * games.length
            )
        ];


    const url =
        fixGameURL(
            getGameURL(game)
        );


    if (!url) {
        return;
    }


    const gameTab =
        window.open(
            url,
            '_blank'
        );


    if (!gameTab) {

        alert(
            'The game could not open because your browser blocked the new tab.'
        );

        return;
    }


    gameTab.focus();
}


/* =========================================================
   PAGE LOADER BUTTONS
   ========================================================= */

/*
 * These buttons are kept so your existing HTML/CSS
 * doesn't break, but games themselves no longer
 * use the iframe.
 */

$('#gameButton').on(
    'click',
    function () {
        returnHome();
    }
);


$('#refresh').on(
    'click',
    function () {

        /*
         * Refresh the main School Terminal page.
         */

        window.location.reload();
    }
);


/* =========================================================
   CLOAK
   ========================================================= */

function makecloak() {

    let cloakURL =
        localStorage.getItem('cloakUrl');


    if (!cloakURL) {

        if (
            typeof config !== 'undefined' &&
            config.cloakUrl
        ) {
            cloakURL =
                config.cloakUrl;
        }
    }


    if (!cloakURL) {
        return;
    }


    window.open(
        cloakURL,
        '_blank'
    );
}


/* =========================================================
   MASK
   ========================================================= */

function mask() {

    const title =
        localStorage.getItem(
            'maskTitle'
        );

    const icon =
        localStorage.getItem(
            'maskIcon'
        );


    if (title) {
        document.title = title;
    }


    if (icon) {

        let favicon =
            document.querySelector(
                'link[rel="icon"]'
            );


        if (!favicon) {

            favicon =
                document.createElement(
                    'link'
                );

            favicon.rel =
                'icon';

            document.head.appendChild(
                favicon
            );
        }


        favicon.href =
            icon;
    }
}


/* =========================================================
   MUTE
   ========================================================= */

function mute() {

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
   PRESETS
   ========================================================= */

function updatePreset() {

    const preset =
        $('#presets').val();


    let url = '';
    let title = '';
    let icon = '';


    switch (preset) {

        case 'classroom':

            url =
                'https://classroom.google.com/';

            title =
                'Google Classroom';

            icon =
                'https://ssl.gstatic.com/classroom/favicon.png';

            break;


        case 'drive':

            url =
                'https://drive.google.com/';

            title =
                'Google Drive';

            break;


        case 'mail':

            url =
                'https://mail.google.com/';

            title =
                'Google Mail';

            break;


        case 'canvas':

            url =
                'https://www.instructure.com/canvas';

            title =
                'Canvas';

            break;
    }


    $('#cloakUrlInput')
        .val(url);

    $('#maskTitleInput')
        .val(title);

    $('#maskIconInput')
        .val(icon);
}


/* =========================================================
   CLOAK URL SETTING
   ========================================================= */

$('#cloakUrlSubmit').on(
    'click',
    function () {

        const value =
            $('#cloakUrlInput').val();


        localStorage.setItem(
            'cloakUrl',
            value
        );
    }
);


/* =========================================================
   MASK TITLE SETTING
   ========================================================= */

$('#maskTitleSubmit').on(
    'click',
    function () {

        const value =
            $('#maskTitleInput').val();


        localStorage.setItem(
            'maskTitle',
            value
        );
    }
);


/* =========================================================
   MASK ICON SETTING
   ========================================================= */

$('#maskIconSubmit').on(
    'click',
    function () {

        const value =
            $('#maskIconInput').val();


        localStorage.setItem(
            'maskIcon',
            value
        );
    }
);


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

document.addEventListener(
    'keydown',
    function (event) {

        pressedKeys[
            event.key.toLowerCase()
        ] = true;


        checkKeybinds();
    }
);


document.addEventListener(
    'keyup',
    function (event) {

        delete pressedKeys[
            event.key.toLowerCase()
        ];
    }
);


function checkKeybinds() {

    if (!keybinds.length) {
        return;
    }


    keybinds.forEach(
        function (bind) {

            if (
                !bind ||
                !bind.keys ||
                !bind.action
            ) {
                return;
            }


            const requiredKeys =
                bind.keys.map(
                    function (key) {
                        return String(
                            key
                        ).toLowerCase();
                    }
                );


            const activated =
                requiredKeys.every(
                    function (key) {
                        return pressedKeys[key];
                    }
                );


            if (activated) {

                try {

                    eval(
                        bind.action
                    );

                }
                catch (error) {

                    console.error(
                        'Keyboard shortcut error:',
                        error
                    );
                }


                pressedKeys = {};
            }
        }
    );
}


/* =========================================================
   STARTUP
   ========================================================= */

$(document).ready(
    function () {

        /*
         * Start on homepage.
         */

        $('.games').hide();
        $('.settings').hide();
        $('.homepage').show();


        /*
         * Load games.
         */

        loadGames();


        /*
         * Apply saved mask.
         */

        mask();
    }
);
