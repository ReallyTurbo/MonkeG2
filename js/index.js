/* =========================================================
   SCHOOL TERMINAL - MAIN SCRIPT
   ========================================================= */

/* =========================================================
   GLOBAL
   ========================================================= */

let currentMenu =
    $('.games');


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

            callback.call(
                target,
                event
            );
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
                event.target.matches(
                    selector
                )
            ) {

                callback.call(
                    event.target,
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
                event.target.matches(
                    selector
                )
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
   MENU
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


function goToHome() {

    showMenu(
        $('.homepage')
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


/* =========================================================
   URL HANDLING
   ========================================================= */

function fixGameUrl(
    url
) {

    if (!url) {
        return '';
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
     * EAGLERCRAFT
     */

    const eaglerCraftPaths = [
        'games/ampler-launcher/mc/1.5.2',
        'games/ampler-launcher/mc/1.8.8',
        'games/ampler-launcher/mc/1.12.2',

        '/games/ampler-launcher/mc/1.5.2',
        '/games/ampler-launcher/mc/1.8.8',
        '/games/ampler-launcher/mc/1.12.2'
    ];


    if (
        eaglerCraftPaths.includes(
            url
        )
    ) {

        if (
            !url.endsWith('/')
        ) {

            url += '/';
        }

        return url;
    }


    /*
     * Absolute URL
     */

    if (
        url.startsWith('http://') ||
        url.startsWith('https://')
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


                const fileExtensions = [
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
                    fileExtensions.some(
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

            return url;
        }
    }


    /*
     * Relative URL
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
        !url.endsWith('/')
    ) {

        const lastPart =
            url.substring(
                url.lastIndexOf(
                    '/'
                ) + 1
            );


        const fileExtensions = [
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
            fileExtensions.some(
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


    const fullUrl =
        new URL(
            gameUrl,
            window.location.origin
        ).href;


    console.log(
        'Opening game:',
        fullUrl
    );


    /*
     * SAVE RECENTLY PLAYED
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
     * NEW TAB
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


    try {

        newTab.opener =
            null;

    } catch (error) {
        // Ignore.
    }


    /*
     * ORIGINAL TAB
     */

    goToGames();


    /*
     * Refresh the recent-games cards
     */

    if (
        typeof rebuildGeneratedSections ===
        'function'
    ) {

        rebuildGeneratedSections();
    }
}


/* =========================================================
   GENERATED CARDS
   ========================================================= */

window.openGameFromCard =
    function (
        gameName,
        gameData
    ) {

        if (
            !gameData ||
            !gameData.path
        ) {

            return;
        }


        openGameInNewTab(
            'games/' +
            gameData.path,
            gameName
        );
    };


/* =========================================================
   CATEGORY DETECTION
   ========================================================= */

function getCategories(
    gameName,
    gameData
) {

    const categories =
        new Set();


    /*
     * Config categories
     */

    if (
        gameData &&
        Array.isArray(
            gameData.categories
        )
    ) {

        gameData.categories
            .forEach(
                function (
                    category
                ) {

                    if (
                        category
                    ) {

                        categories.add(
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
        String(
            gameData &&
            gameData.path
                ? gameData.path
                : ''
        ).toLowerCase();


    const combined =
        name +
        ' ' +
        path;


    if (
        /basket|soccer|volley|boxing|basketball|football|retro bowl|tennis|pool/
            .test(
                combined
            )
    ) {

        categories.add(
            'sports'
        );
    }


    if (
        /moto|racing|drift|drive|car|truck|rally|traffic/
            .test(
                combined
            )
    ) {

        categories.add(
            'racing'
        );
    }


    if (
        /2048|bloxorz|puzzle|hextris|cut-the-rope|factory-balls|conways|ball-sort/
            .test(
                combined
            )
    ) {

        categories.add(
            'puzzle'
        );
    }


    if (
        /vex|mario|run-3|ovo|flappy|fireboy|watergirl|stickman/
            .test(
                combined
            )
    ) {

        categories.add(
            'platformer'
        );
    }


    if (
        /gun|slope|shooter|mayhem|fight|battle|time-shooter|x-trench/
            .test(
                combined
            )
    ) {

        categories.add(
            'action'
        );
    }


    if (
        /escape|riddle|adventure|raft-wars|treasure|eaglercraft|minecraft/
            .test(
                combined
            )
    ) {

        categories.add(
            'adventure'
        );
    }


    if (
        /1v1|io|smash-karts|evowars|yohoho|gons/
            .test(
                combined
            )
    ) {

        categories.add(
            'multiplayer'
        );
    }


    if (
        /flash|bloons|papas|duck-life|henry-stickmin/
            .test(
                combined
            )
    ) {

        categories.add(
            'retro'
        );
    }


    /*
     * If nothing was detected,
     * use arcade.
     */

    if (
        !categories.size
    ) {

        categories.add(
            'arcade'
        );
    }


    return Array.from(
        categories
    );
}


/* =========================================================
   IMAGE GENERATION
   ========================================================= */

function getGameImage(
    gameName,
    gameData
) {

    /*
     * First try a local image.
     */

    if (
        gameData &&
        gameData.image
    ) {

        return gameData.image;
    }


    const path =
        gameData &&
        gameData.path
            ? String(
                gameData.path
            ).replace(
                /^\/+/,
                ''
            )
            : '';


    /*
     * Try common local thumbnail
     * names inside each game folder.
     */

    if (
        path
    ) {

        return (
            'games/' +
            path +
            '/thumbnail.png'
        );
    }


    return '';
}


/* =========================================================
   RANDOM THUMBNAIL FALLBACK
   ========================================================= */

const fallbackImages = [
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=80'
];


function fallbackImageFor(
    gameName
) {

    let hash =
        0;


    const value =
        String(
            gameName || ''
        );


    for (
        let i = 0;
        i < value.length;
        i++
    ) {

        hash =
            (
                (
                    hash << 5
                ) -
                hash +
                value.charCodeAt(i)
            ) |
            0;
    }


    return fallbackImages[
        Math.abs(hash) %
        fallbackImages.length
    ];
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
            function (
                item
            ) {

                return item !==
                    gameName;
            }
        );


    recent.unshift(
        gameName
    );


    recent =
        recent.slice(
            0,
            10
        );


    localStorage.setItem(
        'recentGames',
        JSON.stringify(
            recent
        )
    );
}


window.saveRecentlyPlayed =
    saveRecentlyPlayed;


/* =========================================================
   FAVORITES
   ========================================================= */

function getFavorites() {

    try {

        return JSON.parse(
            localStorage.getItem(
                'starredGamesList'
            )
        ) || [];

    } catch (error) {

        return [];
    }
}


function toggleFavorite(
    gameName
) {

    let favorites =
        getFavorites();


    if (
        favorites.includes(
            gameName
        )
    ) {

        favorites =
            favorites.filter(
                function (
                    name
                ) {

                    return name !==
                        gameName;
                }
            );

    } else {

        favorites.unshift(
            gameName
        );
    }


    localStorage.setItem(
        'starredGamesList',
        JSON.stringify(
            favorites
        )
    );


    rebuildGeneratedSections();
}


/* =========================================================
   CREATE CARD
   ========================================================= */

function createGameCard(
    gameName,
    gameData,
    large
) {

    const card =
        document.createElement(
            'div'
        );


    card.className =
        'generated-game-card';


    if (large) {

        card.classList.add(
            'large'
        );
    }


    const categories =
        getCategories(
            gameName,
            gameData
        );


    const art =
        document.createElement(
            'div'
        );


    art.className =
        'generated-game-art';


    const image =
        document.createElement(
            'img'
        );


    image.loading =
        'lazy';


    image.src =
        getGameImage(
            gameName,
            gameData
        );


    image.alt =
        gameName;


    image.onerror =
        function () {

            if (
                image.dataset.fallbackUsed
            ) {

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

                return;
            }


            image.dataset.fallbackUsed =
                'true';

            image.src =
                fallbackImageFor(
                    gameName
                );
        };


    art.appendChild(
        image
    );


    const star =
        document.createElement(
            'button'
        );


    star.type =
        'button';

    star.className =
        'generated-star';

    star.textContent =
        getFavorites().includes(
            gameName
        )
            ? '★'
            : '☆';


    if (
        getFavorites().includes(
            gameName
        )
    ) {

        star.classList.add(
            'filled'
        );
    }


    star.addEventListener(
        'click',
        function (
            event
        ) {

            event.preventDefault();
            event.stopPropagation();

            toggleFavorite(
                gameName
            );
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
        categories[0]
            ? (
                categories[0]
                    .charAt(0)
                    .toUpperCase() +
                categories[0]
                    .slice(1)
            )
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

            openGameInNewTab(
                'games/' +
                gameData.path,
                gameName
            );
        }
    );


    return card;
}


/* =========================================================
   BUILD RECENT
   ========================================================= */

function buildRecentGames() {

    const container =
        document.getElementById(
            'recentGames'
        );


    const section =
        document.getElementById(
            'recentSection'
        );


    if (
        !container ||
        !section
    ) {

        return;
    }


    container.innerHTML =
        '';


    const recent =
        getRecentlyPlayed();


    const validRecent =
        recent.filter(
            function (
                gameName
            ) {

                return (
                    typeof games !==
                    'undefined' &&
                    games[
                        gameName
                    ]
                );
            }
        );


    if (
        !validRecent.length
    ) {

        section.style.display =
            'none';

        return;
    }


    section.style.display =
        '';


    validRecent
        .slice(
            0,
            3
        )
        .forEach(
            function (
                gameName
            ) {

                container.appendChild(
                    createGameCard(
                        gameName,
                        games[
                            gameName
                        ],
                        true
                    )
                );
            }
        );
}


/* =========================================================
   BUILD FEATURED
   ========================================================= */

function buildFeaturedGames() {

    const container =
        document.getElementById(
            'featuredGames'
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        '';


    const recent =
        getRecentlyPlayed();


    /*
     * If recently played exists,
     * featured uses the games the user
     * actually played.
     */

    let featuredNames =
        recent.filter(
            function (
                name
            ) {

                return games[
                    name
                ];
            }
        ).slice(
            0,
            3
        );


    /*
     * Fill the remaining spaces
     * from the game library.
     */

    if (
        featuredNames.length <
        4
    ) {

        Object.keys(
            games
        ).forEach(
            function (
                name
            ) {

                if (
                    featuredNames.length >=
                    4
                ) {

                    return;
                }

                if (
                    !featuredNames.includes(
                        name
                    )
                ) {

                    featuredNames.push(
                        name
                    );
                }
            }
        );
    }


    featuredNames
        .slice(
            0,
            4
        )
        .forEach(
            function (
                gameName
            ) {

                container.appendChild(
                    createGameCard(
                        gameName,
                        games[
                            gameName
                        ],
                        false
                    )
                );
            }
        );
}


/* =========================================================
   BUILD DISCOVERY
   ========================================================= */

function buildDiscoveryGames() {

    const container =
        document.getElementById(
            'newGames'
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        '';


    const allNames =
        Object.keys(
            games
        );


    allNames
        .slice(
            -8
        )
        .reverse()
        .forEach(
            function (
                gameName
            ) {

                container.appendChild(
                    createGameCard(
                        gameName,
                        games[
                            gameName
                        ],
                        false
                    )
                );
            }
        );
}


/* =========================================================
   CATEGORY SIDEBAR
   ========================================================= */

function buildCategorySidebar() {

    const container =
        document.getElementById(
            'categoryList'
        );


    if (!container) {
        return;
    }


    const categorySet =
        new Set();


    Object.entries(
        games
    ).forEach(
        function (
            [
                gameName,
                gameData
            ]
        ) {

            getCategories(
                gameName,
                gameData
            ).forEach(
                function (
                    category
                ) {

                    categorySet.add(
                        category
                    );
                }
            );
        }
    );


    const preferredOrder = [
        'arcade',
        'action',
        'adventure',
        'puzzle',
        'sports',
        'racing',
        'platformer',
        'multiplayer',
        'retro'
    ];


    container.innerHTML =
        '';


    /*
     * ALL
     */

    const all =
        document.createElement(
            'button'
        );

    all.type =
        'button';

    all.className =
        'category-button active';

    all.dataset.category =
        'all';

    all.textContent =
        'All Games';

    container.appendChild(
        all
    );


    preferredOrder
        .filter(
            function (
                category
            ) {

                return categorySet.has(
                    category
                );
            }
        )
        .forEach(
            function (
                category
            ) {

                const button =
                    document.createElement(
                        'button'
                    );

                button.type =
                    'button';

                button.className =
                    'category-button';

                button.dataset.category =
                    category;

                button.textContent =
                    category
                        .charAt(0)
                        .toUpperCase() +
                    category.slice(1);


                container.appendChild(
                    button
                );
            }
        );
}


/* =========================================================
   FILTER
   ========================================================= */

function applyCategoryFilter(
    category
) {

    const sections =
        document.getElementById(
            'gameSections'
        );


    const standardGames =
        document.getElementById(
            'gamesList'
        );


    if (
        !sections ||
        !standardGames
    ) {

        return;
    }


    /*
     * ALL
     */

    if (
        category === 'all'
    ) {

        document
            .querySelectorAll(
                '.game-section'
            )
            .forEach(
                function (
                    section
                ) {

                    section.style.display =
                        '';

                }
            );


        standardGames
            .querySelectorAll(
                'li'
            )
            .forEach(
                function (
                    item
                ) {

                    item.style.display =
                        '';
                }
            );


        return;
    }


    /*
     * Filter standard list
     */

    standardGames
        .querySelectorAll(
            'li'
        )
        .forEach(
            function (
                item
            ) {

                const categories =
                    String(
                        item.dataset.categories ||
                        ''
                    ).split(',');


                item.style.display =
                    categories.includes(
                        category
                    )
                        ? ''
                        : 'none';
            }
        );


    /*
     * Hide homepage-style sections
     * when a specific category is selected.
     */

    document
        .querySelectorAll(
            '.game-section'
        )
        .forEach(
            function (
                section
            ) {

                const isAllGames =
                    section
                        .querySelector(
                            '#gamesList'
                        );


                if (
                    isAllGames
                ) {

                    section.style.display =
                        '';

                } else {

                    section.style.display =
                        'none';
                }
            }
        );
}


/* =========================================================
   CATEGORY CLICKS
   ========================================================= */

onClick(
    '.category-button',
    function () {

        const category =
            this.dataset.category;


        document
            .querySelectorAll(
                '.category-button'
            )
            .forEach(
                function (
                    button
                ) {

                    button.classList.remove(
                        'active'
                    );
                }
            );


        this.classList.add(
            'active'
        );


        applyCategoryFilter(
            category
        );
    }
);


/* =========================================================
   SEARCH
   ========================================================= */

function updateList() {

    const input =
        document.getElementById(
            'search'
        );


    if (!input) {
        return;
    }


    const search =
        input.value
            .toLowerCase()
            .trim();


    const list =
        document.getElementById(
            'gamesList'
        );


    if (!list) {
        return;
    }


    list.querySelectorAll(
        'li'
    ).forEach(
        function (
            item
        ) {

            const name =
                String(
                    item.dataset.gameName ||
                    ''
                ).toLowerCase();


            const aliases =
                String(
                    item.dataset.aliases ||
                    ''
                ).toLowerCase();


            item.style.display =
                !search ||
                name.includes(
                    search
                ) ||
                aliases.includes(
                    search
                )
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


        const reverse =
            this.value ===
            'reverse';


        items.sort(
            function (
                a,
                b
            ) {

                const aName =
                    String(
                        a.dataset.gameName ||
                        ''
                    );


                const bName =
                    String(
                        b.dataset.gameName ||
                        ''
                    );


                return reverse
                    ? bName.localeCompare(
                        aName
                    )
                    : aName.localeCompare(
                        bName
                    );
            }
        );


        items.forEach(
            function (
                item
            ) {

                list.appendChild(
                    item
                );
            }
        );
    }
);


/* =========================================================
   RANDOM
   ========================================================= */

function randomGame() {

    const items =
        Array.from(
            document.querySelectorAll(
                '#gamesList li'
            )
        ).filter(
            function (
                item
            ) {

                return item.style.display !==
                    'none';
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


    openGameInNewTab(
        item.getAttribute(
            'url'
        ),
        item.dataset.gameName
    );
}


window.randomGame =
    randomGame;


/* =========================================================
   SETTINGS
   ========================================================= */

const preferencesDefaults = {

    cloak: false,

    cloakUrl:
        'https://classroom.google.com/',

    mask: true,

    maskTitle:
        'Google Maps',

    maskIconUrl:
        'https://www.google.com/images/branding/product/ico/googleg_lodp.ico',

    background: false
};


let preferences;


try {

    const saved =
        localStorage.getItem(
            'preferences'
        );


    preferences =
        saved
            ? JSON.parse(
                saved
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
    )
);


/* =========================================================
   SETTINGS INPUTS
   ========================================================= */

const cloakCheckbox =
    document.getElementById(
        'cloakCheckboxInput'
    );

const maskCheckbox =
    document.getElementById(
        'maskCheckboxInput'
    );

const backgroundCheckbox =
    document.getElementById(
        'backgroundCheckboxInput'
    );

const cloakUrlInput =
    document.getElementById(
        'cloakUrlInput'
    );

const maskTitleInput =
    document.getElementById(
        'maskTitleInput'
    );

const maskIconInput =
    document.getElementById(
        'maskIconInput'
    );


if (
    cloakCheckbox
) {

    cloakCheckbox.checked =
        preferences.cloak;
}


if (
    maskCheckbox
) {

    maskCheckbox.checked =
        preferences.mask;
}


if (
    backgroundCheckbox
) {

    backgroundCheckbox.checked =
        preferences.background;
}


if (
    cloakUrlInput
) {

    cloakUrlInput.value =
        preferences.cloakUrl;
}


if (
    maskTitleInput
) {

    maskTitleInput.value =
        preferences.maskTitle;
}


if (
    maskIconInput
) {

    maskIconInput.value =
        preferences.maskIconUrl;
}


/* =========================================================
   SETTINGS EVENTS
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
   SAVE SYSTEM
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
                            'That save could not be loaded.'
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


onClick(
    '#download',
    downloadMainSave
);


onClick(
    '#upload',
    uploadMainSave
);


/* =========================================================
   COLOR SETTINGS
   ========================================================= */

const defaultColorSettings = {

    bg:
        '#f8f7f5',

    'block-color':
        '#ffffff',

    'button-color':
        '#ffffff',

    'games-color':
        '#ffffff',

    'hover-color':
        '#f1efec',

    'scrollbar-color':
        '#c9c4bf',

    'scroll-track-color':
        '#f0eeeb',

    'font-color':
        '#242220'
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
                '--' +
                key,
                value
            );
    }
);


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
                    '--' +
                    key,
                    value
                );
        }
    );
}


function restoreColorChanges() {

    colorSettings =
        {
            ...defaultColorSettings
        };


    localStorage.removeItem(
        'colorSettings'
    );


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
                    '--' +
                    key,
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


window.saveColorChanges =
    saveColorChanges;

window.restoreColorChanges =
    restoreColorChanges;


/* =========================================================
   MASK
   ========================================================= */

function mask(
    title,
    iconUrl
) {

    document.title =
        title ||
        preferences.maskTitle;


    const finalIcon =
        iconUrl ||
        preferences.maskIconUrl;


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


    if (
        finalIcon
    ) {

        link.href =
            finalIcon;
    }
}


/* =========================================================
   AUTO START
   ========================================================= */

function openGamesMenuOnStartup() {

    /*
     * Build interface from config.
     */

    if (
        typeof rebuildGeneratedSections ===
        'function'
    ) {

        rebuildGeneratedSections();
    }


    if (
        typeof buildCategorySidebar ===
        'function'
    ) {

        buildCategorySidebar();
    }


    goToGames();

    updateList();


    console.log(
        'Games menu opened.'
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function rebuildGeneratedSections() {

    buildRecentGames();
    buildFeaturedGames();
    buildDiscoveryGames();
}


window.rebuildGeneratedSections =
    rebuildGeneratedSections;


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
    '%cSchool Terminal loaded successfully.',
    'font-weight:bold;'
);

console.log(
    'Games:',
    typeof games !==
        'undefined'
        ? Object.keys(
            games
        ).length
        : 0
);

console.log(
    'Games use trailing slash URLs.'
);
