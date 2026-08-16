/* =========================================================
   SCHOOL TERMINAL - GAME LOADER
   ========================================================= */


/* =========================================================
   LOADING TIP
   ========================================================= */

function changeLoadingTip() {

    const tips = [
        'Finding something fun...',
        'Loading games...',
        'Getting everything ready...',
        'Almost there...',
        'Preparing your game library...'
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
                Math.random() *
                tips.length
            )
        ];


    element.textContent =
        'Loading... ' +
        randomTip;
}


changeLoadingTip();


/* =========================================================
   INITIAL HIDDEN STATE
   ========================================================= */

$('#everything-else').hide();
$('#page-loader').hide();
$('.cloaklaunch').hide();
$('.settings').hide();


let changeTip =
    setInterval(
        changeLoadingTip,
        3000
    );


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
   STORAGE
   ========================================================= */

const RECENT_STORAGE_KEY =
    'schoolTerminalRecentlyPlayed';

const STARRED_STORAGE_KEY =
    'starredGamesList';


let recentlyPlayed = [];

let starredGamesList = [];


try {

    recentlyPlayed =
        JSON.parse(
            localStorage.getItem(
                RECENT_STORAGE_KEY
            )
        ) || [];

} catch (error) {

    recentlyPlayed = [];
}


try {

    starredGamesList =
        JSON.parse(
            localStorage.getItem(
                STARRED_STORAGE_KEY
            )
        ) || [];

} catch (error) {

    starredGamesList = [];
}


/* =========================================================
   GAME DATA
   ========================================================= */

const gameEntries =
    Object.entries(
        games
    );


/* =========================================================
   CATEGORY HELPERS
   ========================================================= */

const categoryDefinitions = {

    arcade: [
        'arcade',
        'random',
        'click',
        'flappy',
        'run',
        'jump',
        'geometry'
    ],

    action: [
        'action',
        'fight',
        'gun',
        'stick',
        'war',
        'battle',
        'epstein',
        'ninja'
    ],

    puzzle: [
        'puzzle',
        '2048',
        'bloxorz',
        'cut-the-rope',
        'hextris',
        'riddle',
        'trace',
        'brain'
    ],

    sports: [
        'basket',
        'basketball',
        'soccer',
        'football',
        'volley',
        'golf',
        'bowling',
        'sport',
        'retro-bowl'
    ],

    racing: [
        'race',
        'racing',
        'moto',
        'motox',
        'slope',
        'drift',
        'car',
        'subway',
        'x-trench'
    ],

    multiplayer: [
        '1v1',
        '.io',
        'io',
        'smash',
        'karts',
        'yohoho',
        'evo',
        'brawl'
    ],

    adventure: [
        'adventure',
        'escape',
        'submachine',
        'treasure',
        'room',
        'life',
        'temple',
        'mario',
        'minecraft',
        'eagler'
    ],

    strategy: [
        'tower',
        'strategy',
        'war',
        'planet',
        'idle',
        'progress',
        'factory'
    ]

};


/* =========================================================
   NORMALIZE CATEGORY
   ========================================================= */

function normalizeCategory(category) {

    if (!category) {
        return '';
    }

    return String(
        category
    )
        .trim()
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            '-'
        );
}


/* =========================================================
   DERIVE CATEGORIES
   ========================================================= */

function getGameCategories(
    gameName,
    gameData
) {

    const categories =
        new Set();


    /*
     * Use categories from config.js first.
     */

    if (
        gameData &&
        Array.isArray(
            gameData.categories
        )
    ) {

        gameData.categories.forEach(
            function (category) {

                const normalized =
                    normalizeCategory(
                        category
                    );


                if (normalized) {

                    categories.add(
                        normalized
                    );
                }
            }
        );
    }


    /*
     * Search the game name/path.
     */

    const searchable =
        (
            String(gameName || '') +
            ' ' +
            String(
                gameData &&
                gameData.path
                    ? gameData.path
                    : ''
            )
        ).toLowerCase();


    Object.entries(
        categoryDefinitions
    ).forEach(
        function (
            [
                category,
                keywords
            ]
        ) {

            if (
                keywords.some(
                    function (keyword) {

                        return searchable
                            .includes(
                                keyword
                            );
                    }
                )
            ) {

                categories.add(
                    category
                );
            }
        }
    );


    /*
     * If absolutely nothing matched,
     * place it into arcade.
     */

    if (
        categories.size === 0
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
   CATEGORY DISPLAY NAMES
   ========================================================= */

const categoryLabels = {

    all: 'All Games',

    arcade: 'Arcade',

    action: 'Action',

    puzzle: 'Puzzle',

    sports: 'Sports',

    racing: 'Racing',

    multiplayer: 'Multiplayer',

    adventure: 'Adventure',

    strategy: 'Strategy'

};


/* =========================================================
   IMAGE HANDLING
   ========================================================= */

function makeImageCandidates(
    gamePath
) {

    const cleanPath =
        String(
            gamePath || ''
        )
        .replace(
            /^\/+/,
            ''
        )
        .replace(
            /\/+$/,
            ''
        );


    return [

        `games/${cleanPath}/thumbnail.png`,

        `games/${cleanPath}/thumbnail.jpg`,

        `games/${cleanPath}/thumb.png`,

        `games/${cleanPath}/thumb.jpg`,

        `games/${cleanPath}/icon.png`,

        `games/${cleanPath}/icon.jpg`,

        `games/${cleanPath}/cover.png`,

        `games/${cleanPath}/cover.jpg`

    ];
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(
        value || ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}


/* =========================================================
   GET GAME URL
   ========================================================= */

function getGameUrl(
    gameName
) {

    const gameData =
        games[
            gameName
        ];


    if (
        !gameData ||
        !gameData.path
    ) {

        return '';
    }


    let url =
        'games/' +
        gameData.path;


    /*
     * EaglerCraft directories.
     */

    if (
        gameData.path.startsWith(
            'ampler-launcher/mc/'
        ) &&
        !url.endsWith('/')
    ) {

        url += '/';
    }


    return url;
}


/* =========================================================
   RECORD RECENT GAME
   ========================================================= */

function recordRecentlyPlayed(
    gameName
) {

    recentlyPlayed =
        recentlyPlayed.filter(
            function (name) {

                return name !== gameName;
            }
        );


    recentlyPlayed.unshift(
        gameName
    );


    /*
     * Keep the list small.
     */

    recentlyPlayed =
        recentlyPlayed.slice(
            0,
            12
        );


    try {

        localStorage.setItem(
            RECENT_STORAGE_KEY,
            JSON.stringify(
                recentlyPlayed
            )
        );

    } catch (error) {

        console.warn(
            'Could not save recently played:',
            error
        );
    }
}


/* =========================================================
   CARD IMAGE FALLBACK
   ========================================================= */

function applyImageFallback(
    image
) {

    if (!image) {
        return;
    }


    image.addEventListener(
        'error',
        function () {

            const fallback =
                image.parentElement;

            if (!fallback) {
                return;
            }


            /*
             * Prevent repeated errors.
             */

            image.style.display =
                'none';


            if (
                fallback.querySelector(
                    '.game-card-image-fallback'
                )
            ) {

                return;
            }


            const name =
                image.getAttribute(
                    'data-game-name'
                ) || 'Game';


            const fallbackElement =
                document.createElement(
                    'div'
                );


            fallbackElement.className =
                'game-card-image-fallback';


            fallbackElement.textContent =
                getGameEmoji(
                    name
                );


            fallback.appendChild(
                document.createTextNode(
                    ''
                )
            );


            fallbackElement.style.fontSize =
                '44px';


            fallback.appendChild(
                document.createTextNode(
                    ''
                )
            );


            fallback.style.width =
                '100%';

            fallback.style.height =
                '100%';


            fallback.style.display =
                'flex';

            fallback.style.justifyContent =
                'center';

            fallback.style.alignItems =
                'center';


            fallback.insertAdjacentHTML(
                'beforeend',
                ''
            );


            image.parentElement
                .appendChild(
                    fallbackElement
                );
        }
    );
}


/* =========================================================
   GAME EMOJI
   ========================================================= */

function getGameEmoji(
    gameName
) {

    const name =
        String(
            gameName || ''
        ).toLowerCase();


    if (
        name.includes('basket') ||
        name.includes('soccer') ||
        name.includes('volley') ||
        name.includes('retro bowl')
    ) {

        return '🏀';
    }


    if (
        name.includes('moto') ||
        name.includes('car') ||
        name.includes('drift') ||
        name.includes('racing') ||
        name.includes('slope')
    ) {

        return '🏎️';
    }


    if (
        name.includes('minecraft') ||
        name.includes('eagler')
    ) {

        return '⛏️';
    }


    if (
        name.includes('puzzle') ||
        name.includes('2048') ||
        name.includes('riddle') ||
        name.includes('hextris')
    ) {

        return '🧩';
    }


    if (
        name.includes('gun') ||
        name.includes('war') ||
        name.includes('fight') ||
        name.includes('stick')
    ) {

        return '⚔️';
    }


    if (
        name.includes('adventure') ||
        name.includes('escape') ||
        name.includes('mario')
    ) {

        return '🗺️';
    }


    return '🎮';
}


/* =========================================================
   CATEGORY FOR DISPLAY
   ========================================================= */

function getPrimaryCategory(
    categories
) {

    if (
        !categories ||
        !categories.length
    ) {

        return 'Arcade';
    }


    const preferred = [

        'arcade',
        'action',
        'puzzle',
        'sports',
        'racing',
        'multiplayer',
        'adventure',
        'strategy'

    ];


    for (
        const category of preferred
    ) {

        if (
            categories.includes(
                category
            )
        ) {

            return categoryLabels[
                category
            ] || category;
        }
    }


    return categoryLabels[
        categories[0]
    ] || categories[0];
}


/* =========================================================
   CARD CREATOR
   ========================================================= */

function createGameCard(
    gameName,
    options = {}
) {

    const gameData =
        games[
            gameName
        ];


    if (!gameData) {
        return null;
    }


    const categories =
        getGameCategories(
            gameName,
            gameData
        );


    const primaryCategory =
        getPrimaryCategory(
            categories
        );


    const url =
        getGameUrl(
            gameName
        );


    const isStarred =
        starredGamesList.includes(
            gameName
        );


    const card =
        document.createElement(
            'div'
        );


    card.className =
        'game-card';


    card.setAttribute(
        'data-game-name',
        gameName
    );


    card.setAttribute(
        'data-game-url',
        url
    );


    card.setAttribute(
        'data-categories',
        categories.join(',')
    );


    /*
     * Make the entire card clickable.
     */

    card.addEventListener(
        'click',
        function (event) {

            /*
             * Don't launch the game when
             * pressing the star.
             */

            if (
                event.target.closest(
                    '.star'
                )
            ) {

                return;
            }


            recordRecentlyPlayed(
                gameName
            );


            if (
                typeof openGameInNewTab ===
                'function'
            ) {

                openGameInNewTab(
                    url
                );

            } else {

                window.open(
                    url,
                    '_blank'
                );
            }

        }
    );


    /*
     * Image container.
     */

    const imageContainer =
        document.createElement(
            'div'
        );


    imageContainer.className =
        'game-card-image';


    const image =
        document.createElement(
            'img'
        );


    image.loading =
        'lazy';


    image.alt =
        gameName;


    image.setAttribute(
        'data-game-name',
        gameName
    );


    const candidates =
        makeImageCandidates(
            gameData.path
        );


    image.src =
        candidates[0];


    let candidateIndex =
        0;


    image.addEventListener(
        'error',
        function () {

            candidateIndex++;


            if (
                candidateIndex <
                candidates.length
            ) {

                image.src =
                    candidates[
                        candidateIndex
                    ];

                return;
            }


            image.style.display =
                'none';


            if (
                imageContainer.querySelector(
                    '.game-card-image-fallback'
                )
            ) {

                return;
            }


            const fallback =
                document.createElement(
                    'div'
                );


            fallback.className =
                'game-card-image-fallback';


            fallback.textContent =
                getGameEmoji(
                    gameName
                );


            imageContainer.appendChild(
                fallback
            );
        }
    );


    imageContainer.appendChild(
        image
    );


    /*
     * Card body.
     */

    const body =
        document.createElement(
            'div'
        );


    body.className =
        'game-card-body';


    const title =
        document.createElement(
            'div'
        );


    title.className =
        'game-card-title';


    title.textContent =
        gameName;


    const category =
        document.createElement(
            'div'
        );


    category.className =
        'game-card-category';


    category.textContent =
        primaryCategory;


    body.appendChild(
        title
    );

    body.appendChild(
        category
    );


    /*
     * Star.
     */

    const star =
        document.createElement(
            'span'
        );


    star.className =
        'star' +
        (
            isStarred
                ? ' filled'
                : ''
        );


    star.textContent =
        '★';


    star.title =
        'Favorite';


    star.addEventListener(
        'click',
        function (event) {

            event.preventDefault();
            event.stopPropagation();


            toggleStar(
                gameName,
                star
            );
        }
    );


    card.appendChild(
        imageContainer
    );


    card.appendChild(
        body
    );


    card.appendChild(
        star
    );


    return card;
}


/* =========================================================
   TOGGLE STAR
   ========================================================= */

function toggleStar(
    gameName,
    starElement
) {

    const index =
        starredGamesList.indexOf(
            gameName
        );


    if (
        index === -1
    ) {

        starredGamesList.unshift(
            gameName
        );

        starElement.classList.add(
            'filled'
        );

    } else {

        starredGamesList.splice(
            index,
            1
        );

        starElement.classList.remove(
            'filled'
        );
    }


    try {

        localStorage.setItem(
            STARRED_STORAGE_KEY,
            JSON.stringify(
                starredGamesList
            )
        );

    } catch (error) {

        console.warn(
            'Could not save starred games:',
            error
        );
    }


    renderGameSections(
        activeCategory
    );
}


/* =========================================================
   CATEGORY GAME CHECK
   ========================================================= */

function gameMatchesCategory(
    gameName,
    category
) {

    if (
        category ===
        'all'
    ) {

        return true;
    }


    const gameData =
        games[
            gameName
        ];


    const categories =
        getGameCategories(
            gameName,
            gameData
        );


    return categories.includes(
        category
    );
}


/* =========================================================
   CATEGORY BUTTONS
   ========================================================= */

let activeCategory =
    'all';


function buildCategoryButtons() {

    const categoryContainer =
        document.getElementById(
            'categoryList'
        );


    if (!categoryContainer) {
        return;
    }


    categoryContainer.innerHTML =
        '';


    /*
     * Count categories.
     */

    const counts = {};


    gameEntries.forEach(
        function (
            [
                gameName,
                gameData
            ]
        ) {

            const categories =
                getGameCategories(
                    gameName,
                    gameData
                );


            categories.forEach(
                function (
                    category
                ) {

                    counts[category] =
                        (
                            counts[category] ||
                            0
                        ) + 1;
                }
            );
        }
    );


    const availableCategories = [

        'all',
        'arcade',
        'action',
        'puzzle',
        'sports',
        'racing',
        'multiplayer',
        'adventure',
        'strategy'

    ];


    availableCategories.forEach(
        function (
            category
        ) {

            if (
                category !== 'all' &&
                !counts[category]
            ) {

                return;
            }


            const button =
                document.createElement(
                    'button'
                );


            button.type =
                'button';


            button.className =
                'category-button' +
                (
                    category === activeCategory
                        ? ' active'
                        : ''
                );


            button.setAttribute(
                'data-category',
                category
            );


            const label =
                categoryLabels[
                    category
                ] || category;


            button.textContent =
                label +
                (
                    category !== 'all'
                        ? ` (${counts[category] || 0})`
                        : ''
                );


            button.addEventListener(
                'click',
                function () {

                    setActiveCategory(
                        category
                    );
                }
            );


            categoryContainer.appendChild(
                button
            );
        }
    );


    /*
     * Hook up sidebar icons.
     */

    document
        .querySelectorAll(
            '.category-nav'
        )
        .forEach(
            function (navButton) {

                const category =
                    navButton.getAttribute(
                        'data-category-nav'
                    );


                if (
                    !counts[category]
                ) {

                    navButton.style.display =
                        'none';

                    return;
                }


                navButton.style.display =
                    'flex';


                navButton.onclick =
                    function () {

                        goToGames();

                        setTimeout(
                            function () {

                                setActiveCategory(
                                    category
                                );

                            },
                            50
                        );
                    };
            }
        );
}


/* =========================================================
   SET CATEGORY
   ========================================================= */

function setActiveCategory(
    category
) {

    activeCategory =
        category;


    document
        .querySelectorAll(
            '.category-button'
        )
        .forEach(
            function (button) {

                button.classList.toggle(
                    'active',
                    button.getAttribute(
                        'data-category'
                    ) === category
                );
            }
        );


    renderGameSections(
        category
    );
}


/* =========================================================
   PICK GAMES
   ========================================================= */

function getFeaturedGames() {

    const names =
        gameEntries.map(
            function (entry) {
                return entry[0];
            }
        );


    /*
     * Prefer starred games.
     */

    const starred =
        starredGamesList.filter(
            function (name) {
                return names.includes(
                    name
                );
            }
        );


    const result =
        [...starred];


    /*
     * Fill the remainder.
     */

    for (
        const name of names
    ) {

        if (
            result.includes(name)
        ) {

            continue;
        }


        result.push(
            name
        );


        if (
            result.length >= 10
        ) {

            break;
        }
    }


    return result.slice(
        0,
        10
    );
}


function getOtherGames() {

    const names =
        gameEntries.map(
            function (entry) {
                return entry[0];
            }
        );


    const recentSet =
        new Set(
            recentlyPlayed
        );


    const featuredSet =
        new Set(
            getFeaturedGames()
        );


    return names.filter(
        function (name) {

            return !recentSet.has(
                name
            ) &&
            !featuredSet.has(
                name
            );
        }
    );
}


/* =========================================================
   RENDER CARD SECTION
   ========================================================= */

function renderCards(
    container,
    names
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        '';


    names.forEach(
        function (gameName) {

            const card =
                createGameCard(
                    gameName
                );


            if (!card) {
                return;
            }


            container.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   RENDER GAME SECTIONS
   ========================================================= */

function renderGameSections(
    category = 'all'
) {

    const recentContainer =
        document.getElementById(
            'recentGames'
        );


    const featuredContainer =
        document.getElementById(
            'featuredGames'
        );


    const newContainer =
        document.getElementById(
            'newGames'
        );


    const gamesList =
        document.getElementById(
            'gamesList'
        );


    /*
     * Recently played.
     */

    let recentNames =
        recentlyPlayed.filter(
            function (name) {

                return (
                    games[name] &&
                    gameMatchesCategory(
                        name,
                        category
                    )
                );
            }
        );


    renderCards(
        recentContainer,
        recentNames
    );


    const recentSection =
        document.getElementById(
            'recentSection'
        );


    if (recentSection) {

        recentSection.style.display =
            recentNames.length
                ? ''
                : 'none';
    }


    /*
     * Featured.
     */

    let featuredNames =
        getFeaturedGames().filter(
            function (name) {

                return gameMatchesCategory(
                    name,
                    category
                );
            }
        );


    renderCards(
        featuredContainer,
        featuredNames
    );


    /*
     * Other games.
     */

    let otherNames =
        getOtherGames().filter(
            function (name) {

                return gameMatchesCategory(
                    name,
                    category
                );
            }
        );


    renderCards(
        newContainer,
        otherNames.slice(
            0,
            12
        )
    );


    /*
     * Full list.
     *
     * We use cards here too, which means
     * the entire library stays visually consistent.
     */

    if (gamesList) {

        gamesList.innerHTML =
            '';


        gameEntries.forEach(
            function (
                [
                    gameName
                ]
            ) {

                if (
                    !gameMatchesCategory(
                        gameName,
                        category
                    )
                ) {

                    return;
                }


                const card =
                    createGameCard(
                        gameName
                    );


                if (!card) {
                    return;
                }


                const li =
                    document.createElement(
                        'li'
                    );


                li.setAttribute(
                    'url',
                    getGameUrl(
                        gameName
                    )
                );


                li.setAttribute(
                    'aliases',
                    (
                        games[gameName]
                            .aliases || []
                    ).join(',')
                );


                /*
                 * Put card inside li.
                 *
                 * This preserves compatibility
                 * with index.js which listens to
                 * #gamesList li.
                 */

                li.style.listStyle =
                    'none';


                li.appendChild(
                    card
                );


                gamesList.appendChild(
                    li
                );
            }
        );
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

function filterAllGameSections(
    searchValue
) {

    const filter =
        String(
            searchValue || ''
        )
        .trim()
        .toLowerCase();


    document
        .querySelectorAll(
            '#gamesList li'
        )
        .forEach(
            function (item) {

                const text =
                    item.textContent
                        .toLowerCase();


                item.style.display =
                    !filter ||
                    text.includes(
                        filter
                    )
                        ? ''
                        : 'none';
            }
        );


    /*
     * Also search the featured/recent cards.
     */

    document
        .querySelectorAll(
            '.game-card'
        )
        .forEach(
            function (card) {

                const name =
                    card.getAttribute(
                        'data-game-name'
                    ) ||
                    '';


                const matches =
                    !filter ||
                    name
                        .toLowerCase()
                        .includes(
                            filter
                        );


                card.style.display =
                    matches
                        ? ''
                        : 'none';
            }
        );
}


/* =========================================================
   BUILD INITIAL GAME LIST
   ========================================================= */

function buildGames() {

    buildCategoryButtons();

    renderGameSections(
        activeCategory
    );


    const search =
        document.getElementById(
            'search'
        );


    if (search) {

        search.addEventListener(
            'input',
            function () {

                filterAllGameSections(
                    search.value
                );

            }
        );
    }


    const sort =
        document.getElementById(
            'sort'
        );


    if (sort) {

        sort.addEventListener(
            'change',
            function () {

                sortAllGames(
                    sort.value
                );

            }
        );
    }
}


/* =========================================================
   SORT
   ========================================================= */

function sortAllGames(
    mode
) {

    const sections = [

        document.getElementById(
            'recentGames'
        ),

        document.getElementById(
            'featuredGames'
        ),

        document.getElementById(
            'newGames'
        ),

        document.getElementById(
            'gamesList'
        )

    ];


    sections.forEach(
        function (container) {

            if (!container) {
                return;
            }


            const children =
                Array.from(
                    container.children
                );


            children.sort(
                function (
                    a,
                    b
                ) {

                    const aName =
                        (
                            a.getAttribute(
                                'data-game-name'
                            ) ||
                            a.textContent
                        )
                            .trim()
                            .toLowerCase();


                    const bName =
                        (
                            b.getAttribute(
                                'data-game-name'
                            ) ||
                            b.textContent
                        )
                            .trim()
                            .toLowerCase();


                    return mode ===
                        'reverse'
                        ? bName.localeCompare(
                            aName
                        )
                        : aName.localeCompare(
                            bName
                        );
                }
            );


            children.forEach(
                function (child) {

                    container.appendChild(
                        child
                    );
                }
            );
        }
    );
}


/* =========================================================
   RANDOM GAME
   ========================================================= */

function randomGame() {

    const available =
        gameEntries.filter(
            function (
                [
                    gameName
                ]
            ) {

                return gameMatchesCategory(
                    gameName,
                    activeCategory
                );
            }
        );


    if (
        !available.length
    ) {

        return;
    }


    const randomIndex =
        Math.floor(
            Math.random() *
            available.length
        );


    const gameName =
        available[
            randomIndex
        ][0];


    recordRecentlyPlayed(
        gameName
    );


    const url =
        getGameUrl(
            gameName
        );


    if (
        typeof openGameInNewTab ===
        'function'
    ) {

        openGameInNewTab(
            url
        );

    } else {

        window.open(
            url,
            '_blank'
        );
    }
}


/* =========================================================
   GLOBAL RANDOM FUNCTION
   ========================================================= */

window.randomGame =
    randomGame;


/* =========================================================
   GLOBAL CATEGORY FILTER
   ========================================================= */

window.filterGameCategory =
    setActiveCategory;


/* =========================================================
   MAKE GAMES MENU DEFAULT
   ========================================================= */

function openGamesMenuOnStartup() {

    const homepage =
        document.querySelector(
            '.homepage'
        );


    const gamesMenu =
        document.querySelector(
            '.games'
        );


    const settings =
        document.querySelector(
            '.settings'
        );


    const main =
        document.querySelector(
            '#everything-else'
        );


    if (homepage) {
        homepage.style.display =
            'none';
    }


    if (settings) {
        settings.style.display =
            'none';
    }


    if (gamesMenu) {
        gamesMenu.style.display =
            'block';
    }


    if (main) {
        main.style.display =
            'block';
    }


    /*
     * This is intentionally set because
     * your index.js expects the site to open
     * directly into Games.
     */

    if (
        typeof currentMenu !==
        'undefined'
    ) {

        try {

            currentMenu =
                $('.games');

        } catch (error) {
            // Ignore.
        }
    }


    buildGames();
}


/* =========================================================
   JQUERY GAME CARD SUPPORT
   ========================================================= */

function bindGameCardClicks() {

    document.addEventListener(
        'click',
        function (event) {

            const card =
                event.target.closest(
                    '.game-card'
                );


            if (!card) {
                return;
            }


            /*
             * Let the main index.js handler
             * handle li cards.
             */

            const parent =
                card.closest(
                    '#gamesList li'
                );


            if (parent) {

                return;
            }


            if (
                event.target.closest(
                    '.star'
                )
            ) {

                return;
            }


            const url =
                card.getAttribute(
                    'data-game-url'
                );


            if (!url) {
                return;
            }


            event.preventDefault();


            const gameName =
                card.getAttribute(
                    'data-game-name'
                );


            if (gameName) {

                recordRecentlyPlayed(
                    gameName
                );
            }


            if (
                typeof openGameInNewTab ===
                'function'
            ) {

                openGameInNewTab(
                    url
                );

            } else {

                window.open(
                    url,
                    '_blank'
                );
            }

        }
    );
}


/* =========================================================
   WINDOW LOAD
   ========================================================= */

$(window).on(
    'load',
    function () {

        $('.track').attr(
            'stroke',
            'url(#grad2)'
        );


        $('.worm1').hide();

        $('.worm2').hide();


        clearInterval(
            changeTip
        );


        $('.loading').fadeOut(
            300,
            function () {

                setTimeout(
                    function () {

                        $('#everything-else')
                            .fadeIn(
                                400
                            );

                    },
                    100
                );

            }
        );


        openGamesMenuOnStartup();


        bindGameCardClicks();

    }
);


/* =========================================================
   FALLBACK IF LOAD ALREADY HAPPENED
   ========================================================= */

if (
    document.readyState ===
    'complete'
) {

    setTimeout(
        function () {

            openGamesMenuOnStartup();

            bindGameCardClicks();

        },
        0
    );
}


/* =========================================================
   MODAL HELPER
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

    const refreshRate =
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
        '10px';


    fpsMeter.style.zIndex =
        '10000';


    fpsMeter.style.background =
        'rgba(0,0,0,0.45)';


    fpsMeter.style.opacity =
        '0.35';


    fpsMeter.style.padding =
        '5px 8px';


    fpsMeter.style.color =
        'white';


    fpsMeter.style.fontFamily =
        'monospace';


    fpsMeter.style.fontSize =
        '12px';


    fpsMeter.style.pointerEvents =
        'none';


    function loop() {

        const currentTime =
            Date.now();


        frames++;


        if (
            currentTime >
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
                        currentTime -
                        previousTime
                    )
                );


            previousTime =
                currentTime;


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
