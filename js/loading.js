/* =========================================================
   SCHOOL TERMINAL - LOADING / GAME GENERATION
   ========================================================= */

/* =========================================================
   LOADING TIP
   ========================================================= */

function changeLoadingTip() {

    const tips = [
        'Loading games...',
        'Finding something fun...',
        'Preparing your game library...',
        'Almost ready...',
        'Loading School Terminal...'
    ];

    const element =
        document.getElementsByClassName(
            'loading-tip'
        )[0];

    if (!element) {
        return;
    }

    const randomTip =
        tips[
            Math.floor(
                Math.random() * tips.length
            )
        ];

    element.textContent =
        randomTip;
}

changeLoadingTip();

let changeTip =
    setInterval(
        changeLoadingTip,
        3000
    );

/* =========================================================
   INITIAL DISPLAY
   ========================================================= */

$(
    '#everything-else, #page-loader, .homepage, .games, .settings, .cloaklaunch'
).hide();

/* =========================================================
   CONFIG
   ========================================================= */

let games =
    json &&
    json['games']
        ? json['games']
        : {};

let themes =
    json &&
    json['themes']
        ? json['themes']
        : {};

let config =
    json &&
    json['config']
        ? json['config']
        : {};

/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(value) {

    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function getGamePath(gameData) {

    if (!gameData) {
        return '';
    }

    return String(
        gameData.path || ''
    ).replace(
        /^\/+/,
        ''
    );
}


function getGameCategories(
    gameName,
    gameData
) {

    const result =
        new Set();

    if (
        gameData &&
        Array.isArray(
            gameData.categories
        )
    ) {

        gameData.categories
            .forEach(
                function (category) {

                    if (category) {

                        result.add(
                            String(
                                category
                            ).toLowerCase()
                        );
                    }
                }
            );
    }

    const name =
        String(
            gameName || ''
        ).toLowerCase();

    const path =
        getGamePath(
            gameData
        ).toLowerCase();


    function add(
        category
    ) {
        result.add(category);
    }


    if (
        /basket|soccer|football|volley|boxing|tennis|basketball|retro bowl|pool/.test(
            name
        )
    ) {
        add('sports');
    }

    if (
        /moto|racing|drift|drive|car|truck|rally|traffic/.test(
            name + ' ' + path
        )
    ) {
        add('racing');
    }

    if (
        /vex|mario|fireboy|watergirl|run|ovo|stickman|flappy/.test(
            name + ' ' + path
        )
    ) {
        add('platformer');
    }

    if (
        /2048|puzzle|cut the rope|hextris|bloxorz|factory balls|ball sort/.test(
            name
        )
    ) {
        add('puzzle');
    }

    if (
        /gun|slope|shooter|mayhem|fight|battle|time shooter|strike/.test(
            name
        )
    ) {
        add('action');
    }

    if (
        /adventure|escape|riddle|fireboy|watergirl|raft wars|eaglercraft|minecraft/.test(
            name
        )
    ) {
        add('adventure');
    }

    if (
        /multiplayer|1v1|io|smash karts|evowars|yohoho/.test(
            name + ' ' + path
        )
    ) {
        add('multiplayer');
    }

    if (
        /flash|henry stickmin|bloons|papas|duck life/.test(
            name + ' ' + path
        )
    ) {
        add('retro');
    }

    if (!result.size) {
        add('arcade');
    }

    return Array.from(result);
}


function getGameIconPath(
    gameData
) {

    const path =
        getGamePath(
            gameData
        );

    if (!path) {
        return '';
    }

    /*
     * The site will try icon.png first.
     * index.js / CSS provides a fallback if it does not exist.
     */

    return 'games/' +
        path +
        '/icon.png';
}


/* =========================================================
   RECENTLY PLAYED
   ========================================================= */

function getRecentlyPlayed() {

    try {

        return JSON.parse(
            localStorage.getItem(
                'recentGames'
            )
        ) || [];

    } catch (error) {

        return [];
    }
}


function saveRecentlyPlayed(
    gameName
) {

    if (!gameName) {
        return;
    }

    let recent =
        getRecentlyPlayed();

    recent =
        recent.filter(
            function (name) {
                return name !== gameName;
            }
        );

    recent.unshift(
        gameName
    );

    recent =
        recent.slice(
            0,
            12
        );

    localStorage.setItem(
        'recentGames',
        JSON.stringify(
            recent
        )
    );
}


/* Make available to index.js */

window.saveRecentlyPlayed =
    saveRecentlyPlayed;


/* =========================================================
   STARRED GAMES
   ========================================================= */

let starredGamesList;

try {

    starredGamesList =
        JSON.parse(
            localStorage.getItem(
                'starredGamesList'
            )
        ) || [];

} catch (error) {

    starredGamesList = [];
}


/* =========================================================
   CREATE GAME CARD
   ========================================================= */

function createGameCard(
    gameName,
    gameData
) {

    const path =
        getGamePath(
            gameData
        );

    const icon =
        getGameIconPath(
            gameData
        );

    const categories =
        getGameCategories(
            gameName,
            gameData
        );

    const aliases =
        gameData &&
        Array.isArray(
            gameData.aliases
        )
            ? gameData.aliases.join(',')
            : '';

    const isStarred =
        starredGamesList.includes(
            gameName
        );

    const card =
        document.createElement(
            'div'
        );

    card.className =
        'generated-game-card';

    card.setAttribute(
        'data-game-name',
        gameName
    );

    card.setAttribute(
        'data-path',
        path
    );

    card.setAttribute(
        'data-categories',
        categories.join(',')
    );

    card.setAttribute(
        'data-aliases',
        aliases
    );

    const art =
        document.createElement(
            'div'
        );

    art.className =
        'generated-game-art';


    if (icon) {

        const image =
            document.createElement(
                'img'
            );

        image.src =
            icon;

        image.alt =
            gameName;

        image.loading =
            'lazy';

        image.onerror =
            function () {

                image.remove();

                const fallback =
                    document.createElement(
                        'div'
                    );

                fallback.className =
                    'generated-game-fallback';

                fallback.textContent =
                    '🎮';

                art.appendChild(
                    fallback
                );
            };

        art.appendChild(
            image
        );

    } else {

        const fallback =
            document.createElement(
                'div'
            );

        fallback.className =
            'generated-game-fallback';

        fallback.textContent =
            '🎮';

        art.appendChild(
            fallback
        );
    }


    const star =
        document.createElement(
            'button'
        );

    star.type =
        'button';

    star.className =
        'generated-star';

    star.textContent =
        isStarred
            ? '★'
            : '☆';

    if (isStarred) {
        star.classList.add('filled');
    }

    star.title =
        'Favorite';


    star.addEventListener(
        'click',
        function (event) {

            event.preventDefault();
            event.stopPropagation();

            const name =
                gameName;

            if (
                starredGamesList.includes(
                    name
                )
            ) {

                starredGamesList =
                    starredGamesList.filter(
                        function (item) {
                            return item !== name;
                        }
                    );

                star.classList.remove(
                    'filled'
                );

                star.textContent =
                    '☆';

            } else {

                starredGamesList.unshift(
                    name
                );

                star.classList.add(
                    'filled'
                );

                star.textContent =
                    '★';
            }

            localStorage.setItem(
                'starredGamesList',
                JSON.stringify(
                    starredGamesList
                )
            );

            updateGeneratedLists();
        }
    );


    const name =
        document.createElement(
            'div'
        );

    name.className =
        'generated-game-name';

    name.textContent =
        gameName;


    const meta =
        document.createElement(
            'div'
        );

    meta.className =
        'generated-game-meta';

    meta.textContent =
        categories.length
            ? categories[0]
                .charAt(0)
                .toUpperCase() +
              categories[0].slice(1)
            : 'Arcade';


    card.appendChild(
        art
    );

    card.appendChild(
        star
    );

    card.appendChild(
        name
    );

    card.appendChild(
        meta
    );


    card.addEventListener(
        'click',
        function () {

            if (
                typeof window.openGameFromCard ===
                'function'
            ) {

                window.openGameFromCard(
                    gameName,
                    gameData
                );
            }
        }
    );


    return card;
}


/* =========================================================
   CREATE ORIGINAL LIST ITEMS
   ========================================================= */

const gamesList =
    $('#gamesList');

if (gamesList.length) {

    Object.keys(
        games
    ).forEach(
        function (gameName) {

            const gameData =
                games[
                    gameName
                ];

            const path =
                getGamePath(
                    gameData
                );

            const categories =
                getGameCategories(
                    gameName,
                    gameData
                );

            const aliases =
                gameData &&
                Array.isArray(
                    gameData.aliases
                )
                    ? gameData.aliases.join(',')
                    : '';

            const item =
                document.createElement(
                    'li'
                );

            item.setAttribute(
                'url',
                'games/' + path
            );

            item.setAttribute(
                'game-name',
                gameName
            );

            item.setAttribute(
                'aliases',
                aliases
            );

            item.setAttribute(
                'categories',
                categories.join(',')
            );

            item.textContent =
                gameName;

            const star =
                document.createElement(
                    'span'
                );

            star.className =
                'star';

            star.textContent =
                starredGamesList.includes(
                    gameName
                )
                    ? '★'
                    : '☆';

            if (
                starredGamesList.includes(
                    gameName
                )
            ) {
                star.classList.add(
                    'filled'
                );
            }

            item.appendChild(
                star
            );

            gamesList.append(
                item
            );
        }
    );
}


/* =========================================================
   STAR HANDLERS FOR ORIGINAL LIST
   ========================================================= */

$(document).on(
    'click',
    '#gamesList .star',
    function (event) {

        event.preventDefault();
        event.stopPropagation();

        const star =
            this;

        const gameItem =
            star.closest(
                'li'
            );

        if (!gameItem) {
            return;
        }

        const gameName =
            gameItem.getAttribute(
                'game-name'
            );

        if (!gameName) {
            return;
        }

        if (
            starredGamesList.includes(
                gameName
            )
        ) {

            starredGamesList =
                starredGamesList.filter(
                    function (name) {
                        return name !== gameName;
                    }
                );

            star.classList.remove(
                'filled'
            );

            star.textContent =
                '☆';

        } else {

            starredGamesList.unshift(
                gameName
            );

            star.classList.add(
                'filled'
            );

            star.textContent =
                '★';
        }

        localStorage.setItem(
            'starredGamesList',
            JSON.stringify(
                starredGamesList
            )
        );

        updateGameList();
        updateGeneratedLists();
    }
);


/* =========================================================
   UPDATE ORIGINAL LIST
   ========================================================= */

function updateGameList() {

    const list =
        document.getElementById(
            'gamesList'
        );

    if (!list) {
        return;
    }

    const children =
        Array.from(
            list.children
        );

    children.forEach(
        function (item) {

            const gameName =
                item.getAttribute(
                    'game-name'
                );

            const star =
                item.querySelector(
                    '.star'
                );

            if (!star) {
                return;
            }

            if (
                starredGamesList.includes(
                    gameName
                )
            ) {

                star.classList.add(
                    'filled'
                );

                star.textContent =
                    '★';

            } else {

                star.classList.remove(
                    'filled'
                );

                star.textContent =
                    '☆';
            }
        }
    );
}


/* =========================================================
   GENERATED SECTIONS
   ========================================================= */

function rebuildGeneratedSections() {

    const featured =
        document.getElementById(
            'featuredGames'
        );

    const recent =
        document.getElementById(
            'recentGames'
        );

    const newest =
        document.getElementById(
            'newGames'
        );

    if (
        !featured ||
        !recent ||
        !newest
    ) {
        return;
    }


    featured.innerHTML =
        '';

    recent.innerHTML =
        '';

    newest.innerHTML =
        '';


    const gameNames =
        Object.keys(
            games
        );


    /*
     * Featured = first 5 games.
     */

    gameNames
        .slice(
            0,
            5
        )
        .forEach(
            function (gameName) {

                featured.appendChild(
                    createGameCard(
                        gameName,
                        games[
                            gameName
                        ]
                    )
                );
            }
        );


    /*
     * Recent.
     */

    const recentNames =
        getRecentlyPlayed();


    recentNames
        .slice(
            0,
            5
        )
        .forEach(
            function (gameName) {

                if (
                    !games[
                        gameName
                    ]
                ) {
                    return;
                }

                recent.appendChild(
                    createGameCard(
                        gameName,
                        games[
                            gameName
                        ]
                    )
                );
            }
        );


    const recentSection =
        document.getElementById(
            'recentSection'
        );

    if (recentSection) {

        recentSection.style.display =
            recent.children.length
                ? ''
                : 'none';
    }


    /*
     * New games = last 5 config entries.
     */

    gameNames
        .slice(-5)
        .reverse()
        .forEach(
            function (gameName) {

                newest.appendChild(
                    createGameCard(
                        gameName,
                        games[
                            gameName
                        ]
                    )
                );
            }
        );
}


function updateGeneratedLists() {

    rebuildGeneratedSections();
}


/* =========================================================
   INITIALIZE
   ========================================================= */

updateGameList();

rebuildGeneratedSections();

/* =========================================================
   LOADING FINISHED
   ========================================================= */

$(window).on(
    'load',
    function () {

        $('.track')
            .attr(
                'stroke',
                'url(#grad2)'
            );

        $('.worm1')
            .hide();

        $('.worm2')
            .hide();

        clearInterval(
            changeTip
        );

        $('.loading').fadeOut({
            duration: 300,

            complete: function () {

                setTimeout(
                    function () {

                        $('#everything-else')
                            .fadeIn(
                                500
                            );

                    },
                    100
                );
            }
        });
    }
);


/* =========================================================
   DIALOG HELPER
   ========================================================= */

jQuery.fn.extend({

    showModal: function () {

        return this.each(
            function () {

                if (
                    this.tagName ===
                    'DIALOG'
                ) {

                    this.showModal();
                }
            }
        );
    }

});


/* =========================================================
   FPS METER
   ========================================================= */

(function () {

    let previousTime =
        Date.now();

    let frames =
        0;

    let refreshRate =
        1000;

    const fpsMeter =
        document.createElement(
            'div'
        );

    fpsMeter.id =
        'fpsMeter';

    document.body.appendChild(
        fpsMeter
    );

    fpsMeter.style.position =
        'fixed';

    fpsMeter.style.top =
        '5px';

    fpsMeter.style.right =
        '5px';

    fpsMeter.style.zIndex =
        '10000';

    fpsMeter.style.background =
        'rgba(0,0,0,0.5)';

    fpsMeter.style.opacity =
        '0.35';

    fpsMeter.style.padding =
        '5px 8px';

    fpsMeter.style.color =
        'white';

    fpsMeter.style.fontSize =
        '12px';

    fpsMeter.style.pointerEvents =
        'none';


    function loop() {

        const time =
            Date.now();

        frames++;

        if (
            time >
            previousTime +
            refreshRate
        ) {

            const fps =
                Math.round(
                    (
                        frames *
                        refreshRate
                    ) /
                    (
                        time -
                        previousTime
                    )
                );

            previousTime =
                time;

            frames =
                0;

            fpsMeter.textContent =
                'FPS: ' +
                fps;
        }

        requestAnimationFrame(
            loop
        );
    }

    requestAnimationFrame(
        loop
    );

})();
